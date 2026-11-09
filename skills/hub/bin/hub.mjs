#!/usr/bin/env node
// Hub CLI (spec §4, §5.6, §6). The hub session calls it; every command prints plain text or JSON.
//   overview [--no-poll] [--agents-json <file>]
//   item [<code>]
//   last <sessionId>
//   judge <sessionId> --verdict question|other
//   compose --path <path> --session <sessionId> (--body-file <file|-> | --topic <text> --max <n>) [--project <p>] [--origin <dialog dir>]
//     (--body-file - reads the body from stdin)
//   approve --session <sessionId> --path <path> --text-file <file> [--project <p>]
//   compose --path new-session --project <key> --slug <slug> --body-file <file|->
//   approve --path new-session --project <key> --slug <slug> --text-file <file> [--no-worktree]
//   launch <recordId> [--agents-json <file>]
//   dialog start --session <sessionId> --slug <slug> [--agents-json <file>]
//   dialog refresh --dir <dialog dir>
//   voice resolve --session <sessionId> [--agents-json <file>]
//   voice send <code> --prompt-file <dialog dir>/prompt.md [--agents-json <file>]
//   typed --prompt-file <file|-> [--agents-json <file>]
//     (Rafal's whole prompt; prints one JSON object whose `action` says what the hub does next)
//   outcome <code> [--wait-ms <n>]
//     (read-only: the hook's verdict on the last `ok` or `nie` of a code; exit 0 when accepted, 3 otherwise)
//   codex ask (--session <sessionId> | --cwd <dir>) --slug <slug> (--file <path> | --diff <range> | --last <sessionId>) --question-file <file|-> [--project <p>]
//   codex follow --thread <thread dir> --question-file <file|->
//   codex note --thread <thread dir> --text-file <file|->
//   prepare <recordId> [--confirm-busy] [--confirm-resend] [--confirm-waiting] [--agents-json <file>]
//     (--confirm-waiting is accepted for older callers and has no effect since U1)
//   result <recordId> (--msg-id <id> | --error <literal error>)
//   notice --text <literal notice>
//   confirm [--hub-name hub]
//   register --session <sessionId|short id> --kind dialog|background [--project <p>] [--name <n>] [--agents-json <file>]
//   journal --project <p>
//   projects
//   cleanup
//   alerts [--since YYYY-MM-DD]
// Every <sessionId> also takes a unique prefix, such as the 8 characters the overview shows.
// compose and approve refuse the path gate-answer: only `typed` makes such a record.
// --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
// --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, copyFileSync, existsSync, realpathSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { hubRoot, draftsDir, sentDir, registryDir, dialogsDir, codexDir, ownedDir, alertsLogPath } from '../lib/paths.mjs';
import { readEvents, resolveSessionId, listSessionIds } from '../lib/registry.mjs';
import { deriveSession } from '../lib/derive.mjs';
import { runPoll, appendPoll, readPolls, pollEntry } from '../lib/polls.mjs';
import { buildOverview, renderOverview, deriveAll } from '../lib/overview.mjs';
import { readQueue, withQueue, giveCode, reconcile, openItems } from '../lib/queue.mjs';
import { collectWaits } from '../lib/waits.mjs';
import { listOpenPendings, readAsks } from '../lib/pending.mjs';
import { decisionOutcome } from '../lib/permission.mjs';
import { renderQueue, renderItem, findItem, loadItemContext } from '../lib/item.mjs';
import { loadProjectMap, projectFor, projectOf, renderProjects, isWithin, samePath } from '../lib/projects.mjs';
import { registerLaunched, readHubSessions, hubSenderNames } from '../lib/hubsessions.mjs';
import { COMMAND_AS_TEXT, HASH_MISMATCH, MERGED_ANSWERS, parseTyped, verifyPrompt, takeTyped, claimVoice, voiceOrder, releaseClaim, releaseRecord, storeAnswerRecord, refused } from '../lib/typed.mjs';
import { dialogRootOf } from '../lib/voicelive.mjs';
import { composeMessage, questionnaireRequest, withProjectContext } from '../lib/compose.mjs';
import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
import { gitInfo, runChecks, waitingNotice } from '../lib/checks.mjs';
import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, fallbackCommand } from '../lib/dialog.mjs';
import { resolveSource, findTranscript } from '../lib/resolve.mjs';
import { describeElement, firstPrompt, askArgs, followArgs, isolationArgs, runCodex, threadEntry } from '../lib/codex.mjs';
import { cleanup } from '../lib/retention.mjs';
import { alertStats, renderStats } from '../lib/stats.mjs';
import { isDialogName } from '../lib/waits.mjs';
import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
import { sha256 } from '../lib/text.mjs';

// A broken or missing line is skipped, never fatal.
function readJsonLines(path) {
  if (!existsSync(path)) return [];
  const lines = [];
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    try {
      if (line.trim()) lines.push(JSON.parse(line));
    } catch {
      // see above
    }
  }
  return lines;
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) options[key] = true;
      else {
        options[key] = next;
        i += 1;
      }
    } else positional.push(argv[i]);
  }
  return { positional, options };
}

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function need(options, key) {
  if (!options[key] || options[key] === true) fail(`missing --${key}`);
  return options[key];
}

function freshPoll(root, options) {
  const poll = options['agents-json']
    ? { at: new Date().toISOString(), ok: true, sessions: JSON.parse(readFileSync(options['agents-json'], 'utf8')).map((s) => ({ sessionId: s.sessionId ?? null, id: s.id ?? null, name: s.name ?? null, kind: s.kind ?? null, status: s.status ?? null, state: s.state ?? null, cwd: s.cwd ?? null })) }
    : runPoll();
  appendPoll(root, poll);
  return poll;
}

const stamp = (at) => at.replace(/[-:]/g, '').replace(/\..*$/, '');
const derivedOf = (root, sessionId) => deriveSession(readEvents(root, sessionId).events);

// A full sessionId or a unique prefix, as the overview shows it (finding A1).
function sessionArg(root, value, usage) {
  if (!value || value === true) fail(usage);
  const resolved = resolveSessionId(root, value);
  if (resolved.error) fail(resolved.error, 3);
  return resolved.sessionId;
}

// The map entry and the session name of a new session (spec §6.6 steps 2-3). A project outside
// the map gets no new session: a launch needs the entry's key and dir.
function newSessionTarget(root, options) {
  const key = need(options, 'project');
  const slug = need(options, 'slug');
  if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
  const entry = loadProjectMap(root).projects[key];
  if (!entry?.dir) fail(`project ${key} is not in the map; ask Rafal to add it to projects.json`, 3);
  // The key becomes the session name, the worktree directory and its branch (spec §4.2).
  if (!SLUG.test(key)) fail(`project ${key}: the map key must be kebab-case`, 3);
  return { key, entry, name: `${key}-${slug}` };
}

// The name a session had in the newest successful poll that listed it: VS Code panel sessions carry
// no session_title, but `claude agents --json` names them (spec §6.5 step 2).
const lastPollName = (root, sessionId) => [...readPolls(root)].reverse().map((poll) => pollEntry(poll, sessionId)?.name).find(Boolean) ?? null;

// A fork's name takes the project key kebab-cased: an unmapped checkout's key is its directory name.
const kebab = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// The live source of a fork, from a fresh poll (lib/resolve.mjs). Several or no candidates are
// printed for Rafal to choose from (spec §6.5 step 2), and the command exits.
function liveSource(root, requested, options) {
  const poll = freshPoll(root, options);
  if (!poll.ok) fail(`claude agents --json failed: ${poll.error}`, 3);
  const resolved = resolveSource({ requested, poll, derivedOf: (id) => derivedOf(root, id), lastPollName: (id) => lastPollName(root, id) });
  if (resolved.error) fail(resolved.error, 3);
  if (!resolved.ok) {
    console.log(JSON.stringify({ ok: false, name: resolved.name, candidates: resolved.candidates }, null, 2));
    process.exit(3);
  }
  return { poll, ...resolved };
}

const readBody = (options, key = 'body-file') => readFileSync(need(options, key) === '-' ? 0 : options[key], 'utf8');
const given = (options, key) => (options[key] && options[key] !== true ? options[key] : null);

// One Codex call's result; a failure is "brak drugiej opinii" with the literal error (spec §8.1).
// An answer without a thread id is kept, but marked: no follow-up can resume it (spec §7 step 3).
function reportCodex({ outcome, thread, n, threadId }) {
  console.log(JSON.stringify({
    ok: outcome.ok, thread, n, threadId, answerFile: join(thread, `answer-${n}.md`), errFile: join(thread, `answer-${n}.err`),
    ...(outcome.ok ? {} : { failure: `brak drugiej opinii: ${outcome.failure}` }),
    ...(outcome.ok && !threadId ? { warning: 'no thread.started in the stream: a follow-up is impossible; ask again in a new thread' } : {}),
  }, null, 2));
  if (!outcome.ok) process.exit(3);
}

// A Codex thread named on the command line must be one of the hub's (spec §8.2).
const threadArg = (options) => ownedDir(root, need(options, 'thread'), 'codex') ?? fail(`--thread must be a Codex thread under ${join(root, 'projects', '<project>', 'codex')}`, 3);

// A file element is a repository file or a hub file (spec §7 step 1): a relative path is taken
// from the session's cwd, links are resolved, and anything outside both is refused.
function fileElementPath(file, cwd) {
  const path = resolve(cwd, file);
  const real = existsSync(path) ? realpathSync.native(path) : path;
  const repo = gitInfo(cwd).repoRoot ?? cwd;
  if (!isWithin(real, repo) && !isWithin(real, root)) fail(`the element ${real} lies outside the repository ${repo} and the hub data`, 3);
  return real;
}

// Every session id's events, or only the launched one's when the launch learned it.
function launchCandidates(root, record) {
  const ids = record.sessionId ? [record.sessionId] : listSessionIds(root);
  return new Map(ids.map((id) => [id, readEvents(root, id).events]));
}

// A session found only by `confirm` (the launch saw no poll entry) is registered then.
function ensureRegistered(root, record, sessionId) {
  if (readHubSessions(root).launched.some((item) => item.sessionId === sessionId)) return;
  const worktree = record.worktreePath ? { path: record.worktreePath, branch: record.worktreeBranch } : null;
  registerLaunched(root, { sessionId, kind: 'background', project: record.project, name: record.name, worktree, at: new Date().toISOString() });
}

// The random suffix keeps two drafts composed within one second apart.
function writeDraft(root, project, path, at, text) {
  mkdirSync(draftsDir(root, project), { recursive: true });
  const file = join(draftsDir(root, project), `${stamp(at)}-${path}-${randomBytes(2).toString('hex')}.md`);
  writeFileSync(file, text, 'utf8');
  return file;
}

// An approved record of a message to a running session; its baseline is what `prepareRecord` compares.
function sessionRecord({ project, path, sessionId, derived, textFile, text, at }) {
  return {
    id: newRecordId(at),
    project,
    path,
    sessionId,
    name: derived.sessionTitle ?? null,
    textFile,
    textHash: sha256(text),
    baseline: { sessionId, name: derived.sessionTitle ?? null, cwd: derived.cwd, ...gitInfo(derived.cwd) },
    state: 'approved',
    approvedAt: at,
  };
}

// The pre-send checks, the sent file and the pending state: one path for `prepare`, a typed answer and a
// voice order. Check 6 is a notice (U1): returned with the failures and with the success, never blocking.
function prepareRecord(root, { project, record, records }, options) {
  const poll = freshPoll(root, options);
  const derived = derivedOf(root, record.sessionId);
  const text = readFileSync(record.textFile, 'utf8');
  if (!record.baseline.name) record.baseline.name = pollEntry(poll, record.sessionId)?.name ?? null;
  const failures = runChecks({
    record, records, poll, derived, git: gitInfo(derived.cwd), text,
    confirmBusy: Boolean(options['confirm-busy']),
    confirmResend: Boolean(options['confirm-resend']),
  });
  const warnings = waitingNotice(derived);
  if (failures.length) return { ok: false, failures, warnings };
  const at = new Date().toISOString();
  mkdirSync(sentDir(root, project), { recursive: true });
  const sentFile = join(sentDir(root, project), `${stamp(at)}-${record.id}.md`);
  copyFileSync(record.textFile, sentFile);
  const updated = { ...record, state: 'pending', sentAt: at, sentFile };
  // Read again: the list came in before the poll, which can take seconds.
  saveRecords(root, project, loadRecords(root, project).map((r) => (r.id === record.id ? updated : r)));
  return { ok: true, id: record.id, to: pollEntry(poll, record.sessionId)?.name ?? null, sentFile, warnings };
}

// Sends what an item's claim (answeredAt, set under the lock) was taken for, the way any message goes: a
// draft, a journal record, the checks. Any failure gives the claim back and leaves the record `not-sent`:
// left `approved`, a later `prepare` would skip the wait check. Only the poll option is passed on: the
// --confirm-* flags are Rafal's answers to the hub's questions, and nobody asked here.
function sendClaimed(root, item, { path, origin, body }, options) {
  let project = null;
  let record = null;
  const giveBack = (message) => {
    const stuck = releaseClaim(root, item);
    if (record) saveRecords(root, project, loadRecords(root, project).map((r) => (r.id === record.id ? { ...r, state: 'not-sent', error: message } : r)));
    return refused(stuck ? `${message}\n${stuck}` : message);
  };
  try {
    const derived = derivedOf(root, item.sessionId);
    project = projectFor(derived.cwd, loadProjectMap(root).projects);
    const at = new Date().toISOString();
    const text = composeMessage({ path, project, sessionId: item.sessionId, origin, at, body });
    const textFile = writeDraft(root, project, path, at, text);
    record = sessionRecord({ project, path, sessionId: item.sessionId, derived, textFile, text, at });
    const records = [...loadRecords(root, project), record];
    saveRecords(root, project, records);
    const prepared = prepareRecord(root, { project, record, records }, { 'agents-json': options['agents-json'] });
    if (!prepared.ok) return giveBack(prepared.failures.map((failure) => failure.message).join('\n'));
    storeAnswerRecord(root, item.key, record.id);
    return { action: 'send', to: prepared.to, message: text, id: record.id, sentFile: prepared.sentFile, warnings: prepared.warnings };
  } catch (error) {
    return giveBack(error.message);
  }
}

// Every outcome is one JSON object, an unreadable prompt or a busy lock included.
function runTyped(root, options) {
  try {
    const text = readBody(options, 'prompt-file');
    const parsed = parseTyped(text);
    if (parsed.kind === 'other') return { action: 'none' };
    if (parsed.kind === 'command-as-text') return refused(COMMAND_AS_TEXT);
    if (parsed.kind === 'merged') return refused(MERGED_ANSWERS);
    const { ok, eventId, at } = verifyPrompt(root, text);
    if (!ok) return refused(HASH_MISMATCH);
    const taken = takeTyped(root, parsed, { eventId, at });
    return taken.action === 'claimed'
      ? sendClaimed(root, taken.item, { path: 'gate-answer', origin: parsed.code, body: parsed.body }, options)
      : taken;
  } catch (error) {
    return refused(error.message);
  }
}

function runVoiceSend(root, code, file, options) {
  try {
    const order = voiceOrder(file, dialogRootOf());
    if (order.error) return refused(order.error);
    const claimed = claimVoice(root, code, order);
    return claimed.action === 'claimed'
      ? sendClaimed(root, claimed.item, { path: 'dialog', origin: `voice/${order.dirName}`, body: order.body }, options)
      : claimed;
  } catch (error) {
    return refused(error.message);
  }
}

// A gate answer and a voice order hold an item's claim; a record of any other path holds none.
const holdsClaim = (record) => record.path === 'gate-answer' || record.path === 'dialog';
const TYPED_ONLY = 'the path gate-answer is only for HUB typed, which checks the text against what Rafal typed';

const root = hubRoot();
const [command, ...rest] = process.argv.slice(2);
const { positional, options } = parseArgs(rest);

switch (command) {
  case 'overview': {
    if (!options['no-poll']) freshPoll(root, options);
    const overview = buildOverview(root);
    console.log(renderOverview(overview));
    // The queue section never costs the table: a failure prints one line naming the error. The overview does
    // not stamp rowsAt, which belongs to the watcher's passes.
    try {
      const now = Date.now();
      const section = withQueue(root, (state) => {
        reconcile(state, collectWaits({ rows: overview.rows, pendings: listOpenPendings(root), asks: readAsks(root), now }), now);
        for (const item of openItems(state)) if (!item.code) giveCode(state, item.key, item.name, now);
        return renderQueue(state);
      });
      if (section) console.log(`
${section}`);
    } catch (error) {
      console.log(`
Kolejka niedostępna: ${error.message}`);
    }
    break;
  }
  case 'item': {
    const found = findItem(readQueue(root), positional[0]);
    if (found.error) fail(found.error, 3);
    console.log(renderItem(found.item, loadItemContext(root, found.item)));
    break;
  }
  case 'last': {
    const derived = derivedOf(root, sessionArg(root, positional[0], 'usage: last <sessionId>'));
    if (!derived.lastStop?.lastFile) fail('no Stop recorded for this session', 3);
    console.log(join(registryDir(root), derived.lastStop.lastFile));
    break;
  }
  case 'judge': {
    const sessionId = sessionArg(root, positional[0], 'usage: judge <sessionId> --verdict question|other');
    const verdict = need(options, 'verdict');
    if (!VERDICTS.includes(verdict)) fail(`--verdict must be one of ${VERDICTS.join(', ')}`);
    const derived = derivedOf(root, sessionId);
    if (!derived.lastStop) fail('no Stop recorded for this session', 3);
    console.log(JSON.stringify(recordJudgment(root, { sessionId, stopId: derived.lastStop.id, verdict, at: new Date().toISOString() })));
    break;
  }
  case 'compose': {
    const path = need(options, 'path');
    if (path === 'gate-answer') fail(TYPED_ONLY, 3);
    const at = new Date().toISOString();
    let project;
    let text;
    if (path === 'new-session') {
      const { key, entry, name } = newSessionTarget(root, options);
      let body;
      try {
        body = withProjectContext(readBody(options), entry);
      } catch (error) {
        fail(error.message, 3);
      }
      project = key;
      text = composeMessage({ path, project, target: name, at, body });
    } else {
      const sessionId = sessionArg(root, options.session, 'missing --session');
      const derived = derivedOf(root, sessionId);
      project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
      const body = path === 'questionnaire-request'
        ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
        : readBody(options);
      const origin = options.origin && options.origin !== true ? options.origin : undefined;
      text = composeMessage({ path, project, sessionId, origin, at, body });
    }
    console.log(writeDraft(root, project, path, at, text));
    break;
  }
  case 'approve': {
    if (options.path === 'gate-answer') fail(TYPED_ONLY, 3);
    const textFile = need(options, 'text-file');
    const text = readFileSync(textFile, 'utf8');
    const textHash = sha256(text);
    const at = new Date().toISOString();
    let record;
    if (options.path === 'new-session') {
      // The baseline of a session still to be launched is the project directory (spec §6.6 step 5).
      // A worktree by default: a background session may not edit the shared checkout (probe S7),
      // and only a worktree the hub names is one it can journal and propose to clean up (P9).
      const { key, entry, name } = newSessionTarget(root, options);
      // The header's target is the name Rafal saw; another slug would launch under a different one.
      const target = text.split('\n')[0].split('·')[3]?.trim();
      if (target !== name) fail(`the draft was composed for ${target ?? '(no target in the header)'}, not ${name}`, 3);
      record = {
        id: newRecordId(at), project: key, path: 'new-session', sessionId: null, name, worktree: !options['no-worktree'],
        textFile, textHash, baseline: { sessionId: null, name, cwd: entry.dir, ...gitInfo(entry.dir) }, state: 'approved', approvedAt: at,
      };
    } else {
      const sessionId = sessionArg(root, options.session, 'missing --session');
      const derived = derivedOf(root, sessionId);
      const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
      record = sessionRecord({ project, path: need(options, 'path'), sessionId, derived, textFile, text, at });
    }
    saveRecords(root, record.project, [...loadRecords(root, record.project), record]);
    console.log(JSON.stringify({ id: record.id, project: record.project, baseline: record.baseline }));
    break;
  }
  case 'launch': {
    const found = findRecord(root, positional[0] ?? fail('usage: launch <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record } = found;
    if (record.path !== 'new-session') fail(`record is a ${record.path} message; launch takes new-session records`, 3);
    if (record.state !== 'approved') fail(`record is ${record.state}, not approved`, 3);
    const text = readFileSync(record.textFile, 'utf8');
    const failures = launchChecks({ record, poll: freshPoll(root, options), text, dirExists: existsSync(record.baseline.cwd) });
    if (failures.length) {
      console.log(JSON.stringify({ ok: false, failures }, null, 2));
      process.exit(3);
    }
    const at = new Date().toISOString();
    mkdirSync(sentDir(root, project), { recursive: true });
    const sentFile = join(sentDir(root, project), `${stamp(at)}-${record.id}.md`);
    copyFileSync(record.textFile, sentFile);
    // Saved before the spawn: a launch that outlives the hub's Bash call, or a crash, leaves the record
    // pending (delivery-unknown), never approved (spec §6.3 step 6). Each outcome updates this record;
    // the journal is read again because other records may have changed while `claude --bg` ran.
    const sent = { ...record, state: 'pending', sentAt: at, sentFile };
    const save = (next) => saveRecords(root, project, loadRecords(root, project).map((r) => (r.id === record.id ? next : r)));
    save(sent);
    const launched = runClaude(newSessionArgs({ name: record.name, worktree: record.worktree, text }), { cwd: record.baseline.cwd });
    if (launched.unknown) {
      // A timeout or no "backgrounded" line: `claude --bg` hands off to a background service, so a session may exist.
      save({ ...sent, error: launched.error });
      console.log(JSON.stringify({ ok: false, id: record.id, unknown: true, error: launched.error }, null, 2));
      process.exit(3);
    }
    if (!launched.ok) {
      save({ ...sent, state: 'not-sent', error: launched.error });
      console.log(JSON.stringify({ ok: false, id: record.id, error: launched.error }, null, 2));
      process.exit(3);
    }
    const sessionId = findLaunched(() => freshPoll(root, options), launched.shortId, options['agents-json'] ? { attempts: 1 } : {});
    const worktree = record.worktree ? worktreeOf(record.baseline.cwd, record.name) : null;
    if (sessionId) registerLaunched(root, { sessionId, kind: 'background', project, name: record.name, worktree, at });
    save({
      ...sent, shortId: launched.shortId, sessionId,
      worktreePath: worktree?.path ?? null, worktreeBranch: worktree?.branch ?? null,
    });
    console.log(JSON.stringify({ ok: true, id: record.id, shortId: launched.shortId, sessionId, name: record.name, worktree, attach: `claude attach ${launched.shortId}` }, null, 2));
    break;
  }
  case 'dialog': {
    if (positional[0] === 'refresh') {
      const dir = ownedDir(root, need(options, 'dir'), 'dialogs') ?? fail(`--dir must be a dialog directory under ${join(root, 'projects', '<project>', 'dialogs')}`, 3);
      let previous;
      try {
        previous = JSON.parse(readFileSync(join(dir, 'context', 'snapshot.json'), 'utf8'));
      } catch (error) {
        fail(`no snapshot in ${dir}: ${error.message}`, 3);
      }
      if (!previous.cwd) fail(`the snapshot in ${dir} names no working directory`, 3);
      console.log(JSON.stringify(takeSnapshot(previous.cwd, join(dir, 'context'))));
      break;
    }
    if (positional[0] !== 'start') fail('usage: dialog start --session <sessionId> --slug <slug> | dialog refresh --dir <dialog dir>');
    const requested = sessionArg(root, options.session, 'missing --session');
    const slug = need(options, 'slug');
    if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
    // Resolved right before the launch; the cwd comes from the source's hook events first (lib/resolve.mjs).
    const { poll, source, twins, resolvedFrom } = liveSource(root, requested, options);
    const { cwd } = source;
    if (!cwd) fail(`session ${source.sessionId} has no working directory; a fork starts in its source's directory`, 3);
    const project = projectOf(cwd, loadProjectMap(root).projects);
    const name = `dlg-${kebab(project.key)}-${slug}`;
    if (poll.sessions.some((s) => s.name === name)) fail(`a live session is already named ${name}`, 3);
    const at = new Date().toISOString();
    const dir = join(dialogsDir(root, project.key), `${at.slice(0, 10)}-${slug}`);
    // The fork's settings deny edits under its cwd (Edit(./**)), so a dialog directory there is unwritable.
    if (isWithin(dir, cwd)) fail(`the dialog directory would lie inside the session's working directory, where the fork may not write; fork from a session outside the hub data`, 3);
    if (existsSync(dir)) fail(`the dialog directory exists: ${dir}`, 3);
    const snapshot = takeSnapshot(cwd, join(dir, 'context'), { at });
    const settingsPath = join(dir, 'fork-settings.json');
    writeFileSync(settingsPath, `${JSON.stringify(forkSettings(dir), null, 2)}\n`, 'utf8');
    const prompt = forkStartPrompt({ projectName: project.name, sourceName: source.name ?? '(no name)', sourceId: source.sessionId, dialogDir: dir, snapshot });
    const promptPath = join(dir, 'start-prompt.md');
    writeFileSync(promptPath, prompt, 'utf8');
    const launched = runClaude(forkArgs({ sessionId: source.sessionId, name, settingsPath, prompt, dialogDir: dir }), { cwd });
    if (launched.unknown) {
      // A timeout: the fork may already run, so no fallback command that would start a second one.
      console.log(JSON.stringify({ ok: false, unknown: true, dialogDir: dir, error: launched.error }, null, 2));
      process.exit(3);
    }
    if (!launched.ok) {
      console.log(JSON.stringify({ ok: false, dialogDir: dir, error: launched.error, command: fallbackCommand({ cwd, sessionId: source.sessionId, name, settingsPath, promptPath, dialogDir: dir }) }, null, 2));
      process.exit(3);
    }
    const sessionId = findLaunched(() => freshPoll(root, options), launched.shortId, options['agents-json'] ? { attempts: 1 } : {});
    if (sessionId) registerLaunched(root, { sessionId, kind: 'dialog', project: project.key, name, dialogDir: dir, sourceSessionId: source.sessionId, at });
    console.log(JSON.stringify({
      ok: true, dialogDir: dir, name, shortId: launched.shortId, sessionId, sourceSessionId: source.sessionId,
      resolvedFrom, twins, busy: source.status === 'busy', attach: `claude attach ${launched.shortId}`,
    }, null, 2));
    break;
  }
  case 'voice': {
    if (positional[0] === 'send') {
      const code = positional[1] ?? fail('usage: voice send <code> --prompt-file <dialog dir>/prompt.md');
      console.log(JSON.stringify(runVoiceSend(root, code, need(options, 'prompt-file'), options), null, 2));
      break;
    }
    // Read-only (voice spec §19.2 step 2): it launches nothing and writes only the poll record. The
    // hub then starts the voice fork through the talk CLI with this cwd. HUB_CLAUDE_PROJECTS replaces
    // ~/.claude/projects, where a transcript no hook event names is looked for, in tests.
    if (positional[0] !== 'resolve') fail('usage: voice resolve --session <sessionId> [--agents-json <file>] | voice send <code> --prompt-file <file>');
    const requested = sessionArg(root, options.session, 'missing --session');
    const { source, twins, resolvedFrom } = liveSource(root, requested, options);
    if (!source.cwd) fail(`session ${source.sessionId} has no working directory; a voice fork starts in its source's directory`, 3);
    const projectsDir = process.env.HUB_CLAUDE_PROJECTS || join(homedir(), '.claude', 'projects');
    console.log(JSON.stringify({
      ok: true, sessionId: source.sessionId, name: source.name, cwd: source.cwd, project: projectOf(source.cwd, loadProjectMap(root).projects).key,
      busy: source.status === 'busy', twins, resolvedFrom, ...findTranscript({ sessionId: source.sessionId, transcriptPath: source.transcriptPath, projectsDir }),
    }, null, 2));
    break;
  }
  case 'codex': {
    const sub = positional[0];
    if (sub === 'note') {
      const thread = threadArg(options);
      const meta = JSON.parse(readFileSync(join(thread, 'meta.json'), 'utf8'));
      appendFileSync(join(thread, 'thread.md'), `## Hub assessment ${meta.calls}\n\n${readBody(options, 'text-file').trim()}\n\n`, 'utf8');
      console.log(JSON.stringify({ ok: true, thread, n: meta.calls }));
      break;
    }
    if (sub !== 'ask' && sub !== 'follow') fail('usage: codex ask|follow|note …');
    const question = readBody(options, 'question-file');
    const at = new Date().toISOString();
    if (sub === 'follow') {
      const thread = threadArg(options);
      const meta = JSON.parse(readFileSync(join(thread, 'meta.json'), 'utf8'));
      if (!meta.threadId) fail('the thread has no Codex thread id (its first call failed before thread.started); start a new thread', 3);
      const n = meta.calls + 1;
      const answerFile = join(thread, `answer-${n}.md`);
      const outcome = runCodex({ args: followArgs({ threadId: meta.threadId, answerFile, isolation: isolationArgs() }), cwd: meta.cwd, input: question, answerFile, errFile: join(thread, `answer-${n}.err`) });
      writeFileSync(join(thread, 'meta.json'), `${JSON.stringify({ ...meta, calls: n }, null, 2)}\n`, 'utf8');
      appendFileSync(join(thread, 'thread.md'), threadEntry({ n, question, prompt: question, at, outcome }), 'utf8');
      reportCodex({ outcome, thread, n, threadId: meta.threadId });
      break;
    }
    const sessionId = options.session ? sessionArg(root, options.session, 'missing --session') : null;
    const cwd = given(options, 'cwd') ?? (sessionId ? derivedOf(root, sessionId).cwd : null) ?? fail('missing --cwd or --session');
    const project = given(options, 'project') ?? projectFor(cwd, loadProjectMap(root).projects);
    const slug = need(options, 'slug');
    if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
    let element;
    if (given(options, 'file')) element = { kind: 'file', path: fileElementPath(options.file, cwd) };
    else if (given(options, 'diff')) element = { kind: 'diff', range: options.diff };
    else if (given(options, 'last')) {
      const derived = derivedOf(root, sessionArg(root, options.last, 'missing --last'));
      if (!derived.lastStop?.lastFile) fail('no Stop recorded for this session', 3);
      element = { kind: 'file', path: join(registryDir(root), derived.lastStop.lastFile) };
    } else fail('missing --file, --diff or --last');
    let elementText;
    try {
      elementText = describeElement(element, root);
    } catch (error) {
      fail(error.message, 3);
    }
    const thread = join(codexDir(root, project), `${at.slice(0, 10)}-${slug}`);
    if (existsSync(thread)) fail(`the Codex thread exists: ${thread}`, 3);
    mkdirSync(thread, { recursive: true });
    const prompt = firstPrompt({ question, elementText });
    const answerFile = join(thread, 'answer-1.md');
    const outcome = runCodex({ args: askArgs({ cwd, answerFile, isolation: isolationArgs() }), cwd, input: prompt, answerFile, errFile: join(thread, 'answer-1.err') });
    const meta = { threadId: outcome.threadId, element, sessionId, cwd, project, createdAt: at, calls: 1 };
    writeFileSync(join(thread, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
    writeFileSync(join(thread, 'thread.md'), `# Codex: ${slug}\n\n${threadEntry({ n: 1, question, prompt, at, outcome })}`, 'utf8');
    reportCodex({ outcome, thread, n: 1, threadId: outcome.threadId });
    break;
  }
  case 'prepare': {
    const found = findRecord(root, positional[0] ?? fail('usage: prepare <recordId>'));
    if (!found) fail('record not found', 3);
    if (found.record.state !== 'approved') fail(`record is ${found.record.state}, not approved`, 3);
    const prepared = prepareRecord(root, found, options);
    console.log(JSON.stringify(prepared, null, 2));
    if (!prepared.ok) process.exit(3);
    break;
  }
  case 'typed': {
    need(options, 'prompt-file');
    console.log(JSON.stringify(runTyped(root, options), null, 2));
    break;
  }
  case 'outcome': {
    const code = positional[0] ?? fail('usage: outcome <code> [--wait-ms <n>]');
    const { accepted, text } = await decisionOutcome(root, code, options['wait-ms'] === undefined ? {} : { waitMs: Number(options['wait-ms']) });
    console.log(text);
    if (!accepted) process.exitCode = 3;
    break;
  }
  case 'result': {
    const found = findRecord(root, positional[0] ?? fail('usage: result <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record } = found;
    if (record.state !== 'pending') fail(`record is ${record.state}, not pending`, 3);
    const updated = options.error
      ? { ...record, state: 'not-sent', error: String(options.error) }
      : { ...record, msgId: need(options, 'msg-id') };
    // Before the save: if the queue is out of reach, the record stays pending and the command can run again.
    if (options.error && holdsClaim(record)) releaseRecord(root, record.id);
    saveRecords(root, project, loadRecords(root, project).map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ id: record.id, state: updated.state, msgId: updated.msgId ?? null }));
    break;
  }
  case 'notice': {
    const text = need(options, 'text');
    const notice = classifyNotice(text);
    const found = notice.msgId ? findRecordByMsgId(root, notice.msgId) : null;
    if (!found) fail(`no record with msg_id ${notice.msgId ?? '(none in the notice)'}`, 3);
    const updated = applyNotice(found.record, notice, text);
    // Refused, denied or expired: the session never saw the answer, so the item waits again.
    if (updated.state === 'not-sent' && holdsClaim(updated)) releaseRecord(root, updated.id);
    saveRecords(root, found.project, loadRecords(root, found.project).map((r) => (r.id === updated.id ? updated : r)));
    console.log(JSON.stringify({ id: updated.id, kind: notice.kind, state: updated.state }));
    break;
  }
  case 'confirm': {
    // The hub's from-names (spec §6.3, P10); --hub-name adds one more.
    const hubName = hubSenderNames(root);
    if (options['hub-name'] && options['hub-name'] !== true) hubName.add(options['hub-name']);
    const confirmed = [];
    const mismatched = [];
    for (const project of listProjects(root)) {
      const next = loadRecords(root, project);
      let changed = false;
      // Newest first, and one event confirms one record (see findDelivery).
      const waiting = next.filter((r) => r.state === 'pending' || r.state === 'held')
        .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
      for (const record of waiting) {
        const usedIds = new Set(next.filter((r) => r.sessionId === record.sessionId && r.evidence).map((r) => r.evidence.eventId));
        const delivery = record.path === 'new-session'
          ? findLaunchDelivery(record, launchCandidates(root, record))
          : findDelivery(record, readEvents(root, record.sessionId).events, hubName, usedIds);
        if (!delivery) continue;
        const sessionId = delivery.sessionId ?? record.sessionId;
        next[next.findIndex((r) => r.id === record.id)] = { ...record, sessionId, state: 'sent', evidence: { eventId: delivery.id, at: delivery.at } };
        if (record.path === 'new-session') ensureRegistered(root, record, sessionId);
        confirmed.push(record.id);
        changed = true;
      }
      // Hub-origin text that matches no record of the session: flag it, but only delivery evidence makes `sent`.
      for (const record of waiting) {
        const index = next.findIndex((r) => r.id === record.id);
        if (next[index].state === 'sent' || next[index].mismatch) continue;
        const sessionRecords = next.filter((r) => r.sessionId === record.sessionId);
        const usedIds = new Set(sessionRecords.filter((r) => r.evidence).map((r) => r.evidence.eventId));
        const known = new Set(sessionRecords.map((r) => r.textHash));
        let odd;
        if (record.path === 'new-session') odd = record.sessionId ? findLaunchMismatch(record, readEvents(root, record.sessionId).events) : null;
        else odd = findMismatch(record, readEvents(root, record.sessionId).events, hubName, known, usedIds);
        if (!odd) continue;
        next[index] = { ...next[index], mismatch: { eventId: odd.id, at: odd.at } };
        mismatched.push(record.id);
        changed = true;
      }
      if (changed) saveRecords(root, project, next);
    }
    console.log(JSON.stringify({ confirmed, mismatched }));
    break;
  }
  case 'register': {
    const poll = freshPoll(root, options);
    const wanted = need(options, 'session');
    const entry = poll.sessions?.find((s) => s.sessionId === wanted || s.id === wanted);
    if (!entry) fail(`no live session ${wanted} in claude agents --json`, 3);
    const registered = registerLaunched(root, {
      sessionId: entry.sessionId,
      kind: need(options, 'kind'),
      project: options.project ?? null,
      name: options.name ?? entry.name ?? null,
      at: new Date().toISOString(),
    });
    console.log(JSON.stringify(registered));
    break;
  }
  case 'journal': {
    process.stdout.write(renderJournal(loadRecords(root, need(options, 'project'))));
    break;
  }
  case 'projects': {
    const { projects, errors } = loadProjectMap(root);
    // Every session log, also of sessions the overview no longer shows; the hub's own sessions (cwd =
    // the data root) stay out, as in the overview. One git call per distinct cwd.
    const cwds = new Set(deriveAll(root).map((derived) => derived.cwd).filter((cwd) => cwd && !samePath(cwd, root)));
    const unmapped = [...new Set([...cwds].map((cwd) => projectOf(cwd, projects)).filter((project) => !project.mapped).map((project) => project.key))].sort();
    console.log(renderProjects({ projects, errors, unmapped }));
    break;
  }
  case 'cleanup': {
    console.log(JSON.stringify(cleanup(root)));
    break;
  }
  case 'alerts': {
    const since = options.since;
    if (since !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(since) || Number.isNaN(Date.parse(since)))) fail('--since takes a date, YYYY-MM-DD');
    const hubData = readHubSessions(root);
    const hubIds = new Set(hubData.hub);
    const forks = new Set(hubData.launched.filter((item) => item.kind === 'dialog').map((item) => item.sessionId));
    const sessions = listSessionIds(root).map((sessionId) => {
      const events = readEvents(root, sessionId).events;
      const derived = deriveSession(events);
      const hub = hubIds.has(sessionId) || Boolean(derived.firstCwd && samePath(derived.firstCwd, root));
      const dialog = forks.has(sessionId) || events.some((event) => isDialogName(event.sessionTitle));
      return { sessionId, events, hub, dialog };
    });
    // A hub or fork session with no event log still has its alerts left out.
    const known = new Set(sessions.map((session) => session.sessionId));
    for (const sessionId of [...hubIds, ...forks]) {
      if (!known.has(sessionId)) sessions.push({ sessionId, events: [], hub: hubIds.has(sessionId), dialog: forks.has(sessionId) });
    }
    console.log(renderStats(alertStats({ alerts: readJsonLines(alertsLogPath(root)), sessions, since: since ?? null })));
    break;
  }
  default:
    fail('usage: hub.mjs overview|item|last|judge|compose|approve|launch|dialog|voice|codex|prepare|typed|outcome|result|notice|confirm|register|journal|projects|cleanup|alerts');
}
