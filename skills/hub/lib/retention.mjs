// Retention (spec §8.2): event logs and last-message directories of sessions ended more than 14
// days ago are deleted together, with the hub's judgments of their turns and their cached titles;
// polls.jsonl keeps the last 14 days. Leftovers of the approval hook go too: a pending record whose hook is gone
// with its decision, a decision or outcome file older than a day whose record is gone, and asks older than 24 h.
// alerts.jsonl and approvals.jsonl are measures and stay. Journals, sent texts, dialogs and Codex threads are never touched.
import { join } from 'node:path';
import { rmSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { listSessionIds, readEvents } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls } from './polls.mjs';
import { pruneJudgments } from './judgments.mjs';
import { pruneTitles } from './titles.mjs';
import { eventLogPath, lastDir, pollsPath, pendingDir, asksPath } from './paths.mjs';
import { readPending, readAsks } from './pending.mjs';
import { isAlive } from './owner.mjs';
import { writeAtomically } from './queue.mjs';

export const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

export const PENDING_LEFTOVER_MS = 24 * 60 * 60 * 1000;
export const ASK_KEEP_MS = 24 * 60 * 60 * 1000;

// A record whose pid is alive is never touched: its hook is still waiting. A dead record goes with its
// decision; its outcome stays until a day old, as `HUB outcome` may be asked for it again.
// A decision or outcome with no record goes once a day old: the hook or the command can leave them behind.
function cleanPending(root, now, alive) {
  const dir = pendingDir(root);
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return 0;
  }
  const records = new Set();
  let removed = 0;
  const drop = (name) => {
    try {
      rmSync(join(dir, name));
      removed += 1;
    } catch {
      // best effort; the next cleanup tries again
    }
  };
  const isOld = (path) => {
    try {
      return now - statSync(path).mtimeMs > PENDING_LEFTOVER_MS;
    } catch {
      return false; // gone meanwhile
    }
  };
  for (const name of names) {
    const id = /^([^.]+)\.json$/.exec(name)?.[1];
    if (!id) continue;
    const record = readPending(root, id);
    if (!record) {
      // An unreadable record is only left when a day old: the hook writes it atomically, so it is not mid-write.
      if (isOld(join(dir, name))) drop(name);
      continue;
    }
    if (alive(record.pid)) {
      records.add(id);
    } else {
      drop(name);
      if (names.includes(`${id}.decision.json`)) drop(`${id}.decision.json`);
    }
  }
  for (const name of names) {
    const id = /^([^.]+)\.(?:decision|outcome)\.json$/.exec(name)?.[1];
    if (!id || records.has(id) || !existsSync(join(dir, name))) continue;
    if (isOld(join(dir, name))) drop(name);
  }
  return removed;
}

// The file is rewritten only when an ask is dropped: a hook may append between the read and the rename, and
// that is lost, so a cleanup with nothing to drop must not touch it. An ask whose time cannot be read stays.
function cleanAsks(root, now) {
  if (!existsSync(asksPath(root))) return 0;
  const asks = readAsks(root);
  const kept = asks.filter((ask) => !(now - Date.parse(ask.at) > ASK_KEEP_MS));
  if (kept.length !== asks.length) {
    const text = kept.map((ask) => JSON.stringify(ask)).join('\n');
    writeAtomically(asksPath(root), kept.length ? `${text}\n` : '');
  }
  return kept.length;
}

export function cleanup(root, now = Date.now(), { alive = isAlive } = {}) {
  const removed = [];
  for (const sessionId of listSessionIds(root)) {
    const derived = deriveSession(readEvents(root, sessionId).events);
    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > RETENTION_MS) {
      rmSync(eventLogPath(root, sessionId), { force: true });
      rmSync(lastDir(root, sessionId), { recursive: true, force: true });
      removed.push(sessionId);
    }
  }
  let pollsKept = 0;
  if (existsSync(pollsPath(root))) {
    const kept = readPolls(root).filter((poll) => now - Date.parse(poll.at) <= RETENTION_MS);
    writeFileSync(pollsPath(root), kept.map((poll) => JSON.stringify(poll)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    pollsKept = kept.length;
  }
  const remaining = new Set(listSessionIds(root));
  const judgmentsKept = pruneJudgments(root, remaining);
  const titlesKept = pruneTitles(root, remaining);
  const pendingRemoved = cleanPending(root, now, alive);
  const asksKept = cleanAsks(root, now);
  return { removed, pollsKept, judgmentsKept, titlesKept, pendingRemoved, asksKept };
}
