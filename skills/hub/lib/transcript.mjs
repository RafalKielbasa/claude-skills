// The typed-command search (spec §5): a `!` command Rafal typed leaves a `user` record whose whole
// content is a <bash-input> tag, while a model's call is a tool_use block and a pasted line has no
// tag. This is what keeps a model out of the approval path. Also the session's own side (spec §6.1):
// whether a prompt was answered there, which the registry does not always show.
import { closeSync, fstatSync, openSync, readSync, statSync } from 'node:fs';
import { deriveSession } from './derive.mjs';
import { inputHash } from './events.mjs';
import { readHubSessions } from './hubsessions.mjs';
import { readEvents } from './registry.mjs';

const TAIL_BYTES = 512 * 1024;
// A call and its result can lie far apart: measured on 25 real transcripts, 0.4% of the pairs span more
// than 512 KB, at most 1,027 KB.
const SESSION_TAIL_BYTES = 2 * 1024 * 1024;
const NEWEST_SESSIONS = 5;
const TYPED_COMMAND = /^<bash-input>[ \t]*(\S+)[ \t]+(\S+)[ \t]*<\/bash-input>$/;
const INTERRUPTED = '[Request interrupted by user';
const MAY_ANSWER = /tool_use|tool_result|Request interrupted/;

// The complete lines of the last `tailBytes`: a first line cut by the start of the tail is dropped.
function tailLines(path, tailBytes = TAIL_BYTES) {
  const fd = openSync(path, 'r');
  try {
    const { size } = fstatSync(fd);
    const start = Math.max(0, size - tailBytes);
    const buffer = Buffer.alloc(size - start);
    let filled = 0;
    while (filled < buffer.length) {
      const read = readSync(fd, buffer, filled, buffer.length - filled, start + filled);
      if (read === 0) break;
      filled += read;
    }
    const lines = buffer.toString('utf8', 0, filled).split('\n');
    return start > 0 ? lines.slice(1) : lines;
  } finally {
    closeSync(fd);
  }
}

// A `claude -p` prompt has the same shape as a typed command but for its entrypoint, so a model running
// `claude -p --resume <hub id>` is refused. A negative check, because a bare record has no entrypoint. This
// narrows one route; spec §5 "Where this ends" still stands.
function isTyped(record, verb, code) {
  if (record?.type !== 'user' || record.isSidechain !== false || record.entrypoint === 'sdk-cli') return false;
  const content = record.message?.content;
  if (typeof content !== 'string') return false;
  const match = TYPED_COMMAND.exec(content);
  return Boolean(match) && match[1].toLowerCase() === verb.toLowerCase() && match[2].toLowerCase() === code.toLowerCase();
}

// Every typed `<verb> <code>` dated inside [fromMs, toMs], newest first, as { timestamp, uuid }. Case and spacing
// do not matter; an unparseable time on either side never matches. A record with no uuid is left out, because
// one typing may open one decision and only the uuid tells two typings apart (real records have one: 10 of 10
// checked on 2026-11-07). The time decides the order, not the place in the file: Claude Code writes a record only
// after its command has ended, so records with a later time can stand before it.
export function typedCommands(path, verb, code, { fromMs, toMs }) {
  let lines;
  try {
    lines = tailLines(path);
  } catch {
    return [];
  }
  const found = [];
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (!lines[i].includes('<bash-input>')) continue;
    let record;
    try {
      record = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (!isTyped(record, String(verb), String(code)) || typeof record.uuid !== 'string' || !record.uuid) continue;
    const at = Date.parse(record.timestamp);
    if (at >= fromMs && at <= toMs) found.push({ at, timestamp: record.timestamp, uuid: record.uuid });
  }
  return found.sort((a, b) => b.at - a.at).map(({ timestamp, uuid }) => ({ timestamp, uuid }));
}

const blocksOf = (content) => (Array.isArray(content) ? content : []);

// The record's own text. What a tool_result block holds is the tool's output, not this.
function isInterruption(content) {
  if (typeof content === 'string') return content.startsWith(INTERRUPTED);
  return blocksOf(content).some((block) => block?.type === 'text' && String(block.text).startsWith(INTERRUPTED));
}

// How the prompt of this pending call was answered in its session, from the tail of that session's
// transcript, or null. „No” leaves a tool_result and the interrupted text 1 ms apart; the text wins over
// the result, wherever it stands, so the logged outcome calls a refusal a refusal. A call is recognised by
// tool name and input hash, because the hook input has no tool_use_id; that the transcript's `input`
// serialises exactly like the hook's `tool_input` was checked by hand on real Bash calls and is pinned by
// nothing. Never throws: a transcript that cannot be read gives no signal, and the hook keeps waiting.
export function answeredInSession(path, record) {
  try {
    const startedAt = new Date(record.startedAt).getTime();
    const ownCalls = new Set();
    let answer = null;
    for (const line of tailLines(path, SESSION_TAIL_BYTES)) {
      if (!MAY_ANSWER.test(line)) continue;
      let entry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (!entry || entry.isSidechain === true) continue;
      const content = entry.message?.content;
      if (entry.type === 'assistant') {
        for (const block of blocksOf(content)) {
          if (block?.type === 'tool_use' && block.name === record.tool && inputHash(block.input) === record.inputHash) ownCalls.add(block.id);
        }
      } else if (entry.type === 'user' && Date.parse(entry.timestamp) >= startedAt) {
        if (isInterruption(content)) return 'interrupted';
        if (blocksOf(content).some((block) => block?.type === 'tool_result' && ownCalls.has(block.tool_use_id))) answer = 'tool-result';
      }
    }
    return answer;
  } catch {
    return null;
  }
}

// One hook's repeated look at its session, up to 14,400 rounds in 8 h: the transcript is read again only
// when its size changed. A half-written last line is safe, because the rest of it changes the size.
export function sessionAnswerCheck(record) {
  let seenSize = null;
  return () => {
    let size;
    try {
      size = statSync(record.transcriptPath).size;
    } catch {
      return null;
    }
    if (size === seenSize) return null;
    seenSize = size;
    return answeredInSession(record.transcriptPath, record);
  };
}

// The transcripts of the newest hub sessions, newest first. A session on the hub list that has no
// transcript path yet, or whose file is gone, is skipped.
export function hubTranscriptPaths(root) {
  const found = [];
  for (const sessionId of readHubSessions(root).hub) {
    const path = deriveSession(readEvents(root, sessionId).events).transcriptPath;
    if (!path) continue;
    try {
      found.push({ path, mtimeMs: statSync(path).mtimeMs });
    } catch {
      // missing file
    }
  }
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, NEWEST_SESSIONS).map((entry) => entry.path);
}
