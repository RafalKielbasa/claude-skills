#!/usr/bin/env node
// Hub CLI (spec §4, §5.6, §6). The hub session calls it; every command prints plain text or JSON.
//   overview [--no-poll] [--agents-json <file>]
//   last <sessionId>
//   judge <sessionId> --verdict question|other
//   compose --path <path> --session <sessionId> (--body-file <file|-> | --topic <text> --max <n>) [--project <p>]
//     (--body-file - reads the body from stdin)
//   approve --session <sessionId> --path <path> --text-file <file> [--project <p>]
//   compose --path new-session --project <key> --slug <slug> --body-file <file|->
//   approve --path new-session --project <key> --slug <slug> --text-file <file> [--no-worktree]
//   launch <recordId> [--agents-json <file>]
//   prepare <recordId> [--confirm-waiting] [--confirm-busy] [--confirm-resend] [--agents-json <file>]
//   result <recordId> (--msg-id <id> | --error <literal error>)
//   notice --text <literal notice>
//   confirm [--hub-name hub]
//   register --session <sessionId|short id> --kind dialog|background [--project <p>] [--name <n>] [--agents-json <file>]
//   journal --project <p>
//   projects
//   cleanup
// Every <sessionId> also takes a unique prefix, such as the 8 characters the overview shows.
// --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
// --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { hubRoot, draftsDir, sentDir, registryDir } from '../lib/paths.mjs';
import { readEvents, resolveSessionId, listSessionIds } from '../lib/registry.mjs';
import { deriveSession } from '../lib/derive.mjs';
import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { loadProjectMap, projectFor, renderProjects } from '../lib/projects.mjs';
import { registerLaunched, readHubSessions } from '../lib/hubsessions.mjs';
import { composeMessage, questionnaireRequest, withProjectContext } from '../lib/compose.mjs';
import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
import { gitInfo, runChecks } from '../lib/checks.mjs';
import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
import { cleanup } from '../lib/retention.mjs';
import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
import { sha256 } from '../lib/text.mjs';

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
  return { key, entry, name: `${key}-${slug}` };
}

const readBody = (options) => readFileSync(need(options, 'body-file') === '-' ? 0 : options['body-file'], 'utf8');

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

const root = hubRoot();
const [command, ...rest] = process.argv.slice(2);
const { positional, options } = parseArgs(rest);

switch (command) {
  case 'overview': {
    if (!options['no-poll']) freshPoll(root, options);
    console.log(renderOverview(buildOverview(root)));
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
      text = composeMessage({ path, project, sessionId, at, body });
    }
    mkdirSync(draftsDir(root, project), { recursive: true });
    // The random suffix keeps two drafts composed within one second apart.
    const file = join(draftsDir(root, project), `${stamp(at)}-${path}-${randomBytes(2).toString('hex')}.md`);
    writeFileSync(file, text, 'utf8');
    console.log(file);
    break;
  }
  case 'approve': {
    const textFile = need(options, 'text-file');
    const textHash = sha256(readFileSync(textFile, 'utf8'));
    const at = new Date().toISOString();
    let record;
    if (options.path === 'new-session') {
      // The baseline of a session still to be launched is the project directory (spec §6.6 step 5).
      // A worktree by default: a background session may not edit the shared checkout (probe S7),
      // and only a worktree the hub names is one it can journal and propose to clean up (P9).
      const { key, entry, name } = newSessionTarget(root, options);
      record = {
        id: newRecordId(at), project: key, path: 'new-session', sessionId: null, name, worktree: !options['no-worktree'],
        textFile, textHash, baseline: { sessionId: null, name, cwd: entry.dir, ...gitInfo(entry.dir) }, state: 'approved', approvedAt: at,
      };
    } else {
      const sessionId = sessionArg(root, options.session, 'missing --session');
      const derived = derivedOf(root, sessionId);
      const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
      record = {
        id: newRecordId(at),
        project,
        path: need(options, 'path'),
        sessionId,
        name: derived.sessionTitle ?? null,
        textFile,
        textHash,
        baseline: { sessionId, name: derived.sessionTitle ?? null, cwd: derived.cwd, ...gitInfo(derived.cwd) },
        state: 'approved',
        approvedAt: at,
      };
    }
    saveRecords(root, record.project, [...loadRecords(root, record.project), record]);
    console.log(JSON.stringify({ id: record.id, project: record.project, baseline: record.baseline }));
    break;
  }
  case 'launch': {
    const found = findRecord(root, positional[0] ?? fail('usage: launch <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record, records } = found;
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
    const launched = runClaude(newSessionArgs({ name: record.name, worktree: record.worktree, text }), { cwd: record.baseline.cwd });
    if (launched.unknown) {
      // A timeout: `claude --bg` hands off to a background service, so a session may exist (spec §6.3 step 6).
      saveRecords(root, project, records.map((r) => (r.id === record.id ? { ...record, state: 'pending', sentAt: at, sentFile, error: launched.error } : r)));
      console.log(JSON.stringify({ ok: false, id: record.id, unknown: true, error: launched.error }, null, 2));
      process.exit(3);
    }
    if (!launched.ok) {
      saveRecords(root, project, records.map((r) => (r.id === record.id ? { ...record, state: 'not-sent', sentAt: at, sentFile, error: launched.error } : r)));
      console.log(JSON.stringify({ ok: false, id: record.id, error: launched.error }, null, 2));
      process.exit(3);
    }
    const sessionId = findLaunched(() => freshPoll(root, options), launched.shortId, options['agents-json'] ? { attempts: 1 } : {});
    const worktree = record.worktree ? worktreeOf(record.baseline.cwd, record.name) : null;
    if (sessionId) registerLaunched(root, { sessionId, kind: 'background', project, name: record.name, worktree, at });
    const updated = {
      ...record, state: 'pending', sentAt: at, sentFile, shortId: launched.shortId, sessionId,
      worktreePath: worktree?.path ?? null, worktreeBranch: worktree?.branch ?? null,
    };
    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ ok: true, id: record.id, shortId: launched.shortId, sessionId, name: record.name, worktree, attach: `claude attach ${launched.shortId}` }, null, 2));
    break;
  }
  case 'prepare': {
    const found = findRecord(root, positional[0] ?? fail('usage: prepare <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record, records } = found;
    if (record.state !== 'approved') fail(`record is ${record.state}, not approved`, 3);
    const poll = freshPoll(root, options);
    const derived = derivedOf(root, record.sessionId);
    const text = readFileSync(record.textFile, 'utf8');
    if (!record.baseline.name) record.baseline.name = pollEntry(poll, record.sessionId)?.name ?? null;
    const failures = runChecks({
      record, records, poll, derived, git: gitInfo(derived.cwd), text,
      confirmWaiting: Boolean(options['confirm-waiting']),
      confirmBusy: Boolean(options['confirm-busy']),
      confirmResend: Boolean(options['confirm-resend']),
    });
    if (failures.length) {
      console.log(JSON.stringify({ ok: false, failures }, null, 2));
      process.exit(3);
    }
    const at = new Date().toISOString();
    mkdirSync(sentDir(root, project), { recursive: true });
    const sentFile = join(sentDir(root, project), `${stamp(at)}-${record.id}.md`);
    copyFileSync(record.textFile, sentFile);
    const updated = { ...record, state: 'pending', sentAt: at, sentFile };
    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ ok: true, id: record.id, to: pollEntry(poll, record.sessionId)?.name ?? null, sentFile }, null, 2));
    break;
  }
  case 'result': {
    const found = findRecord(root, positional[0] ?? fail('usage: result <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record, records } = found;
    if (record.state !== 'pending') fail(`record is ${record.state}, not pending`, 3);
    const updated = options.error
      ? { ...record, state: 'not-sent', error: String(options.error) }
      : { ...record, msgId: need(options, 'msg-id') };
    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ id: record.id, state: updated.state, msgId: updated.msgId ?? null }));
    break;
  }
  case 'notice': {
    const text = need(options, 'text');
    const notice = classifyNotice(text);
    const found = notice.msgId ? findRecordByMsgId(root, notice.msgId) : null;
    if (!found) fail(`no record with msg_id ${notice.msgId ?? '(none in the notice)'}`, 3);
    const updated = applyNotice(found.record, notice, text);
    saveRecords(root, found.project, found.records.map((r) => (r.id === updated.id ? updated : r)));
    console.log(JSON.stringify({ id: updated.id, kind: notice.kind, state: updated.state }));
    break;
  }
  case 'confirm': {
    const hubName = options['hub-name'] && options['hub-name'] !== true ? options['hub-name'] : 'hub';
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
    const unmapped = [...new Set(buildOverview(root).rows.filter((row) => !row.mapped).map((row) => row.project))];
    console.log(renderProjects({ projects, errors, unmapped }));
    break;
  }
  case 'cleanup': {
    console.log(JSON.stringify(cleanup(root)));
    break;
  }
  default:
    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|prepare|result|notice|confirm|register|journal|projects|cleanup');
}
