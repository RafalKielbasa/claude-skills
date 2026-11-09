import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync, appendFileSync, readFileSync, readdirSync, existsSync, mkdirSync, utimesSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writePending, readPending, listOpenPendings, closePending, writeDecision, readDecision, removeDecision,
  writeOutcome, readOutcome, appendAsk, readAsks,
} from '../lib/pending.mjs';
import { passThroughReason, readJobName, laterEvent, hookOutput, verifyDecision, hubRunning, sessionProcessGone, shownCall, markAnswered, nextHubWatch } from '../lib/permission.mjs';
import { inputHash, toolTarget } from '../lib/events.mjs';
import { recordHook, recordPermissionClosed, readEvents } from '../lib/registry.mjs';
import { deriveSession } from '../lib/derive.mjs';
import { registerLaunched } from '../lib/hubsessions.mjs';
import { readQueue, withQueue } from '../lib/queue.mjs';
import { heartbeatPath, hubSessionsPath, pendingDir, pollsPath, approvalsLogPath, queueLockPath } from '../lib/paths.mjs';
import { tempRoot, transcriptToolUse, transcriptToolResult, transcriptInterrupted, REFUSED_RESULT, jsonLines } from './helpers.mjs';

const HOOK = fileURLToPath(new URL('../bin/hub-permission.mjs', import.meta.url));
const HUB_SESSION = 'hub-1';
const MINUTE = 60 * 1000;
const BASH_INPUT = { command: 'git push origin main', description: 'Push the branch' };
const DENY_MESSAGE = 'Rafał odmówił tego wywołania z huba. Nie obchodź tej odmowy: zakończ turę i napisz, czego potrzebowałeś.';

const hookInput = (fields = {}) => ({
  session_id: 's1',
  transcript_path: 'C:/x/s1.jsonl',
  cwd: 'C:\\repo',
  scratchpad_dir: 'C:/x/scratch',
  prompt_id: 'pr1',
  permission_mode: 'default',
  effort: { level: 'high' },
  hook_event_name: 'PermissionRequest',
  tool_name: 'Bash',
  tool_input: BASH_INPUT,
  ...fields,
});

const setAge = (path, ms) => {
  const at = (Date.now() - ms) / 1000;
  utimesSync(path, at, at);
};

// A fresh heartbeat and a hub session with a transcript, and no poll.
function seedHub() {
  const root = tempRoot();
  const transcript = join(root, 'hub-transcript.jsonl');
  writeFileSync(heartbeatPath(root), '');
  writeFileSync(transcript, '');
  recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: HUB_SESSION, prompt: 'przegląd', cwd: root, transcript_path: transcript }, { id: 'hub-e1', at: new Date().toISOString() });
  writeFileSync(hubSessionsPath(root), JSON.stringify({ hub: [HUB_SESSION], launched: [] }));
  return { root, transcript };
}

async function until(probe, ms, what) {
  const deadline = Date.now() + ms;
  for (;;) {
    const value = probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out after ${ms} ms waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

// Spawns the hook; the process is killed when the test ends, whatever its result.
function startHook(t, root, input = hookInput(), env = {}) {
  const child = spawn(process.execPath, [HOOK], {
    env: { ...process.env, HUB_DATA: root, CLAUDE_CODE_ENTRYPOINT: 'cli', CLAUDE_JOB_DIR: undefined, CLAUDE_PID: undefined, ...env },
    windowsHide: true,
  });
  const hook = { child, closed: null };
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const closed = new Promise((resolve) => {
    child.on('close', (code, signal) => {
      hook.closed = { code, signal, stdout, stderr };
      resolve();
    });
  });
  t.after(async () => {
    child.kill();
    await closed;
  });
  child.stdin.on('error', () => {});
  child.stdin.end(typeof input === 'string' ? input : JSON.stringify(input));
  return hook;
}

const ended = (hook) => until(() => hook.closed, 15000, 'the hook to end');
const pendingOf = (root, hook) => until(() => listOpenPendings(root).find((record) => record.pid === hook.child.pid), 15000, 'the pending record');
// Date.now() differs by up to 15 ms between Node processes on Windows (measured), so an event of this
// test is dated from the hook's own clock: read from the test's clock it could fall before startedAt.
const afterStart = (record) => new Date(record.startedAt + 100).toISOString();
const pendingFiles = (root) => (existsSync(pendingDir(root)) ? readdirSync(pendingDir(root)) : []);

function assertEndedQuietly(done) {
  assert.equal(done.code, 0);
  assert.equal(done.stdout, '');
  assert.equal(done.stderr, '');
}

async function assertPassesThrough(t, root, input, env) {
  const started = Date.now();
  const hook = startHook(t, root, input, env);
  const done = await ended(hook);
  const took = Date.now() - started;
  assertEndedQuietly(done);
  assert.ok(took < 5000, `took ${took} ms`);
  assert.deepEqual(pendingFiles(root), []);
}

async function assertWaits(t, root, input, env) {
  const hook = startHook(t, root, input, env);
  const record = await pendingOf(root, hook);
  assert.equal(hook.closed, null);
  return { hook, record };
}

function giveItem(root, record, code, fields = {}) {
  withQueue(root, (state) => {
    const key = `${record.sessionId}|p:${record.id}`;
    state.items[key] = {
      key, sessionId: record.sessionId, kind: 'permission', since: record.startedAt, pendingId: record.id, answerable: true,
      askTool: null, name: 'Migracja', project: 'notatki', code, codeAt: Date.now(), ...fields,
    };
  });
}

// What a typed `!` command leaves, as measured: the record, then its stdout. Each has its own uuid.
function typeInHub(transcript, command, at = new Date().toISOString(), uuid = randomUUID()) {
  const line = (content, id) => `${JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user', content }, timestamp: at, uuid: id, userType: 'external', entrypoint: 'cli' })}\n`;
  appendFileSync(transcript, line(`<bash-input> ${command}</bash-input>`, uuid) + line('<bash-stdout></bash-stdout><bash-stderr></bash-stderr>', randomUUID()));
}

const decide = (verb, code, attempt) => ({ verb, code, attempt, at: Date.now() });
const approvals = (root) => readFileSync(approvalsLogPath(root), 'utf8').trim().split('\n').map((line) => JSON.parse(line));

test('no heartbeat: the hook passes through', async (t) => {
  const { root } = seedHub();
  rmSync(heartbeatPath(root));
  await assertPassesThrough(t, root);
});

test('a heartbeat 6 min old: the hook passes through', async (t) => {
  const { root } = seedHub();
  setAge(heartbeatPath(root), 6 * MINUTE);
  await assertPassesThrough(t, root);
});

for (const [name, value] of [['sdk-cli', 'sdk-cli'], ['an unknown value', 'something-new'], ['no value', undefined]]) {
  test(`entrypoint ${name}: the hook passes through`, async (t) => {
    await assertPassesThrough(t, seedHub().root, hookInput(), { CLAUDE_CODE_ENTRYPOINT: value });
  });
}

for (const entrypoint of ['cli', 'claude-vscode']) {
  test(`entrypoint ${entrypoint}: the hook waits, with no poll`, async (t) => {
    const { root } = seedHub();
    await assertWaits(t, root, hookInput(), { CLAUDE_CODE_ENTRYPOINT: entrypoint });
    assert.equal(existsSync(pollsPath(root)), false);
  });
}

test('the pending record holds the call, and no decision yet', async (t) => {
  const { root } = seedHub();
  const started = Date.now();
  const { hook, record } = await assertWaits(t, root);
  assert.equal(record.sessionId, 's1');
  assert.equal(record.promptId, 'pr1');
  assert.equal(record.tool, 'Bash');
  assert.equal(record.target, 'Push the branch');
  assert.equal(record.inputHash, inputHash(BASH_INPUT));
  assert.deepEqual(record.input, BASH_INPUT);
  assert.equal(record.transcriptPath, 'C:/x/s1.jsonl');
  assert.equal(record.pid, hook.child.pid);
  assert.ok(record.startedAt >= started && record.startedAt <= Date.now() + 1000);
  assert.deepEqual(readPending(root, record.id), record);
  assert.equal(readDecision(root, record.id), null);
});

test('the hub session passes through', async (t) => {
  await assertPassesThrough(t, seedHub().root, hookInput({ session_id: HUB_SESSION }));
});

test('a session in the hub folder passes through before it is on the hub list', async (t) => {
  const { root } = seedHub();
  await assertPassesThrough(t, root, hookInput({ session_id: 'new-hub-tab', cwd: root }));
});

test('a launched session named dlg-… passes through', async (t) => {
  const { root } = seedHub();
  registerLaunched(root, { sessionId: 'fork-1', kind: 'dialog', project: 'notatki', name: 'dlg-migracja', at: new Date().toISOString() });
  await assertPassesThrough(t, root, hookInput({ session_id: 'fork-1' }));
});

test('a launched session with another name waits', async (t) => {
  const { root } = seedHub();
  registerLaunched(root, { sessionId: 'bg-1', kind: 'background', project: 'notatki', name: 'migracja', at: new Date().toISOString() });
  await assertWaits(t, root, hookInput({ session_id: 'bg-1' }));
});

test('a name dlg-… in <CLAUDE_JOB_DIR>/state.json passes through', async (t) => {
  const { root } = seedHub();
  const jobDir = join(root, 'job');
  mkdirSync(jobDir);
  writeFileSync(join(jobDir, 'state.json'), JSON.stringify({ name: 'dlg-abc' }));
  await assertPassesThrough(t, root, hookInput(), { CLAUDE_JOB_DIR: jobDir });
});

test('CLAUDE_JOB_DIR with state.json missing, corrupt or of another name: the hook waits', async (t) => {
  const { root } = seedHub();
  const dirs = { missing: null, corrupt: '{ not json', other: JSON.stringify({ name: 'migracja' }) };
  for (const [name, text] of Object.entries(dirs)) {
    const jobDir = join(root, name);
    mkdirSync(jobDir);
    if (text) writeFileSync(join(jobDir, 'state.json'), text);
    await assertWaits(t, root, hookInput({ session_id: name }), { CLAUDE_JOB_DIR: jobDir });
  }
});

for (const tool of ['AskUserQuestion', 'ExitPlanMode']) {
  test(`tool ${tool}: the hook records it and passes through`, async (t) => {
    const { root } = seedHub();
    await assertPassesThrough(t, root, hookInput({ tool_name: tool, tool_input: { questions: [] } }));
    const asks = readAsks(root);
    assert.equal(asks.length, 1);
    assert.equal(asks[0].sessionId, 's1');
    assert.equal(asks[0].tool, tool);
    assert.ok(Number.isFinite(Date.parse(asks[0].at)));
  });
}

test('an ask tool is not recorded while the hub is closed', async (t) => {
  const { root } = seedHub();
  rmSync(heartbeatPath(root));
  await assertPassesThrough(t, root, hookInput({ tool_name: 'AskUserQuestion' }));
  assert.deepEqual(readAsks(root), []);
});

for (const [name, text] of [['text', 'not json'], ['nothing', ''], ['null', 'null'], ['a list', '[]'], ['an empty object', '{}'], ['no tool', '{"session_id":"s1"}']]) {
  test(`malformed stdin (${name}): exit 0, empty stdout`, async (t) => {
    await assertPassesThrough(t, seedHub().root, text);
  });
}

test('a pending folder that cannot be written: exit 0, empty stdout', async (t) => {
  const { root } = seedHub();
  writeFileSync(pendingDir(root), 'a file in the way');
  const done = await ended(startHook(t, root));
  assertEndedQuietly(done);
});

test('an outcome that cannot be written: exit 0, no allow, and no log line claims one', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  mkdirSync(join(pendingDir(root), `${record.id}.outcome.json`));
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'ok a3');
  writeDecision(root, record.id, decide('ok', 'a3', 'try-1'));
  assertEndedQuietly(await ended(hook));
  assert.equal(existsSync(approvalsLogPath(root)), false);
  assert.equal(readPending(root, record.id), null);
});

test('a log that cannot be written costs the line, not a typed approval', async (t) => {
  const { root, transcript } = seedHub();
  mkdirSync(approvalsLogPath(root));
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'ok a3');
  writeDecision(root, record.id, decide('ok', 'a3', 'try-1'));
  const done = await ended(hook);
  assert.equal(done.code, 0);
  assert.equal(done.stderr, '');
  assert.equal(JSON.parse(done.stdout).hookSpecificOutput.decision.behavior, 'allow');
  assert.equal(readOutcome(root, record.id, 'try-1').accepted, true);
  assert.equal(readPending(root, record.id), null);
});

// Creates the file and keeps it open without delete sharing, as a scanner can on Windows: others can
// read it, and deleting it fails. The process goes when the test ends.
function holdOpen(t, path, text) {
  const script = "$f=[IO.File]::Open($env:HOLD_PATH,'CreateNew','ReadWrite','Read');"
    + '$b=[Text.Encoding]::UTF8.GetBytes($env:HOLD_TEXT);$f.Write($b,0,$b.Length);$f.Flush();'
    + '[Console]::In.ReadLine()|Out-Null;$f.Close()';
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    env: { ...process.env, HOLD_PATH: path, HOLD_TEXT: text },
    stdio: ['pipe', 'ignore', 'ignore'],
    windowsHide: true,
  });
  const closed = new Promise((resolve) => child.on('close', resolve));
  t.after(async () => {
    child.kill();
    await closed;
  });
}

test('a decision file that cannot be deleted does not lose a typed approval', { skip: process.platform !== 'win32' }, async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'ok a3');
  holdOpen(t, join(pendingDir(root), `${record.id}.decision.json`), JSON.stringify(decide('ok', 'a3', 'try-1')));
  const done = await ended(hook);
  assert.equal(done.code, 0);
  assert.equal(done.stderr, '');
  assert.equal(JSON.parse(done.stdout).hookSpecificOutput.decision.behavior, 'allow');
  assert.equal(readOutcome(root, record.id, 'try-1').accepted, true);
  assert.equal(readPending(root, record.id), null);
  assert.equal(approvals(root).length, 1);
  // The delete did fail: the file is still there, held open.
  assert.equal(readDecision(root, record.id).attempt, 'try-1');
});

test('a refused decision whose file cannot be deleted ends the hook, so it is never searched again', { skip: process.platform !== 'win32' }, async (t) => {
  const { root } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  holdOpen(t, join(pendingDir(root), `${record.id}.decision.json`), JSON.stringify(decide('ok', 'a3', 'try-1')));
  assertEndedQuietly(await ended(hook));
  assert.equal(existsSync(approvalsLogPath(root)), false);
  assert.equal(readOutcome(root, record.id, 'try-1'), null);
});

test('typed ok: allow, the record closed, an outcome and one approvals line', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'ok a3');
  writeDecision(root, record.id, decide('ok', 'a3', 'try-1'));

  const done = await ended(hook);
  assert.equal(done.code, 0);
  assert.equal(done.stderr, '');
  assert.deepEqual(JSON.parse(done.stdout), { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } } });
  assert.equal(readPending(root, record.id), null);
  assert.equal(readDecision(root, record.id), null);
  const outcome = readOutcome(root, record.id, 'try-1');
  assert.equal(outcome.accepted, true);
  assert.equal(outcome.verb, 'ok');
  assert.equal(outcome.reason, null);
  assert.equal(outcome.call, 'Bash git push origin main');
  const lines = approvals(root);
  assert.equal(lines.length, 1);
  const { at, typedAt, decidedAt, ...rest } = lines[0];
  assert.deepEqual(rest, { code: 'a3', sessionId: 's1', tool: 'Bash', target: 'Push the branch', verb: 'ok', accepted: true });
  assert.ok(Date.parse(typedAt) <= Date.parse(decidedAt));
  // Two processes' clocks: within the tolerance of lib/permission.mjs.
  assert.ok(Date.parse(decidedAt) <= Date.parse(at) + 100);
  assert.ok(!JSON.stringify(lines[0]).includes('git push'));
});

test('typed nie: deny with the exact message and no interrupt', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'nie a3');
  writeDecision(root, record.id, decide('nie', 'a3', 'try-1'));

  const done = await ended(hook);
  assert.equal(done.code, 0);
  const output = JSON.parse(done.stdout);
  assert.equal(output.hookSpecificOutput.hookEventName, 'PermissionRequest');
  assert.deepEqual(output.hookSpecificOutput.decision, { behavior: 'deny', message: DENY_MESSAGE });
  assert.ok(!('interrupt' in output.hookSpecificOutput.decision));
  assert.equal(readPending(root, record.id), null);
  assert.equal(readOutcome(root, record.id, 'try-1').accepted, true);
  assert.equal(approvals(root)[0].verb, 'nie');
});

test('a typed record reaching the file after the decision, dated before it, is still found', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  const typedAt = new Date().toISOString();
  writeDecision(root, record.id, decide('ok', 'a3', 'try-1'));
  await new Promise((resolve) => setTimeout(resolve, 1500));
  assert.equal(hook.closed, null);
  typeInHub(transcript, 'ok a3', typedAt);
  const done = await ended(hook);
  assert.equal(JSON.parse(done.stdout).hookSpecificOutput.decision.behavior, 'allow');
});

test('a decision without a typed record is refused within 10 s; the hook waits on, and a typed one then gives allow', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  writeDecision(root, record.id, decide('ok', 'a3', 'model-try'));

  const outcome = await until(() => readOutcome(root, record.id, 'model-try'), 10000, 'the outcome');
  assert.equal(outcome.accepted, false);
  assert.equal(outcome.attempt, 'model-try');
  assert.equal(outcome.reason, 'not-typed');
  assert.equal(readDecision(root, record.id), null);
  assert.equal(hook.closed, null);
  assert.ok(readPending(root, record.id));
  assert.equal(approvals(root)[0].accepted, false);
  assert.equal(approvals(root)[0].typedAt, null);

  typeInHub(transcript, 'ok a3');
  writeDecision(root, record.id, decide('ok', 'a3', 'typed-try'));
  const done = await ended(hook);
  assert.equal(JSON.parse(done.stdout).hookSpecificOutput.decision.behavior, 'allow');
  assert.equal(readOutcome(root, record.id, 'typed-try').accepted, true);
  assert.equal(readOutcome(root, record.id, 'model-try'), null);
  assert.equal(approvals(root).length, 2);
});

test('a typed record for another code, or a decision for another record, is not accepted', async (t) => {
  const { root, transcript } = seedHub();
  const first = await assertWaits(t, root);
  const second = await assertWaits(t, root, hookInput({ session_id: 's2' }));
  giveItem(root, first.record, 'a3');
  giveItem(root, second.record, 'a4');
  typeInHub(transcript, 'ok a4');
  writeDecision(root, first.record.id, decide('ok', 'a3', 'other-code'));
  writeDecision(root, second.record.id, decide('ok', 'a3', 'other-record'));

  const refused = await until(() => readOutcome(root, first.record.id, 'other-code'), 10000, 'the first outcome');
  assert.equal(refused.accepted, false);
  assert.equal(refused.reason, 'not-typed');
  const elsewhere = await until(() => readOutcome(root, second.record.id, 'other-record'), 10000, 'the second outcome');
  assert.equal(elsewhere.accepted, false);
  assert.equal(elsewhere.reason, 'no-item');
  assert.equal(first.hook.closed, null);
  assert.equal(second.hook.closed, null);
});

test('a decision file with an old time, or none, is refused at once, with no search; the hook waits on', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  giveItem(root, record, 'a3');
  typeInHub(transcript, 'ok a3');
  for (const [attempt, at] of [['old', Date.now() - 16000], ['no-time', 'wczoraj'], ['future', Date.now() + 60000]]) {
    const started = Date.now();
    writeDecision(root, record.id, { verb: 'ok', code: 'a3', attempt, at });
    const outcome = await until(() => readOutcome(root, record.id, attempt), 3000, `the outcome of ${attempt}`);
    assert.ok(Date.now() - started < 2000, attempt);
    assert.equal(outcome.reason, 'stale-decision', attempt);
    assert.equal(readDecision(root, record.id), null, attempt);
  }
  assert.equal(hook.closed, null);
  assert.deepEqual(readQueue(root).usedTypedRecords, []);
  const lines = approvals(root);
  assert.deepEqual(lines.map((line) => line.accepted), [false, false, false]);
  assert.equal(Number.isFinite(Date.parse(lines[0].decidedAt)), true);
  assert.equal(lines[1].decidedAt, null);
});

test('a later event of the session ends the hook with empty stdout', async (t) => {
  const { root } = seedHub();
  const cases = [
    { session: 'post', event: { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: BASH_INPUT } },
    { session: 'prompt', event: { hook_event_name: 'UserPromptSubmit', prompt: 'dalej' } },
    { session: 'stop', event: { hook_event_name: 'Stop', last_assistant_message: 'Gotowe.' } },
    { session: 'failure', event: { hook_event_name: 'StopFailure', error: 'rate_limit' } },
    { session: 'end', event: { hook_event_name: 'SessionEnd', reason: 'other' } },
  ];
  const runs = await Promise.all(cases.map(async ({ session, event }) => {
    const { hook, record } = await assertWaits(t, root, hookInput({ session_id: session }));
    recordHook(root, { session_id: session, cwd: 'C:\\repo', prompt_id: 'pr1', ...event }, { id: `later-${session}`, at: afterStart(record) });
    return { session, hook, record };
  }));
  for (const { session, hook, record } of runs) {
    assertEndedQuietly(await ended(hook));
    assert.equal(readPending(root, record.id), null, session);
  }
});

test('a PostToolUse of another call does not end the hook, also with the same description or none', async (t) => {
  const { root } = seedHub();
  const same = { command: 'git push origin main', description: 'Push the branch' };
  const cases = [
    {
      session: 'same-description',
      own: same,
      other: { tool_name: 'Bash', tool_input: { command: 'rm -rf build', description: 'Push the branch' } },
    },
    {
      session: 'no-description',
      own: { command: 'git push origin main' },
      other: { tool_name: 'Bash', tool_input: { command: 'rm -rf build' } },
    },
    {
      session: 'same-input-other-tool',
      own: same,
      other: { tool_name: 'PowerShell', tool_input: same },
    },
  ];
  const runs = await Promise.all(cases.map(async ({ session, own, other }) => {
    const { hook, record } = await assertWaits(t, root, hookInput({ session_id: session, tool_input: own }));
    recordHook(root, { hook_event_name: 'PostToolUse', session_id: session, cwd: 'C:\\repo', prompt_id: 'pr1', ...other }, { id: `other-${session}`, at: afterStart(record) });
    return { session, own, hook, record };
  }));
  await new Promise((resolve) => setTimeout(resolve, 2600));
  for (const { session, hook, record } of runs) {
    assert.equal(hook.closed, null, session);
    assert.ok(readPending(root, record.id), session);
  }
  // The same hooks still listen: their own call ends them.
  for (const { session, own, record } of runs) {
    recordHook(root, { hook_event_name: 'PostToolUse', session_id: session, cwd: 'C:\\repo', prompt_id: 'pr1', tool_name: 'Bash', tool_input: own }, { id: `own-${session}`, at: afterStart(record) });
  }
  for (const { hook } of runs) assertEndedQuietly(await ended(hook));
});

test('a heartbeat going stale while waiting ends the hook after the grace, and the pending file is gone', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await assertWaits(t, root, undefined, { HUB_STALE_GRACE_MS: '100' });
  setAge(heartbeatPath(root), 6 * MINUTE);
  assertEndedQuietly(await ended(hook));
  assert.equal(readPending(root, record.id), null);
  assert.deepEqual(pendingFiles(root), []);
});

test('a heartbeat seen stale in a round or two does not end the hook, as on waking the computer, with the grace unset or unusable', async (t) => {
  const { root } = seedHub();
  const cases = { unset: undefined, letters: 'abc', zero: '0', negative: '-5' };
  const runs = await Promise.all(Object.entries(cases).map(async ([session, grace]) => ({
    session,
    ...await assertWaits(t, root, hookInput({ session_id: session }), { HUB_STALE_GRACE_MS: grace }),
  })));
  setAge(heartbeatPath(root), 6 * MINUTE);
  await new Promise((resolve) => setTimeout(resolve, 4600));
  for (const { session, hook, record } of runs) {
    assert.equal(hook.closed, null, session);
    assert.ok(readPending(root, record.id), session);
  }
});

test('nextHubWatch, with a fake clock: a jump is skipped, a live heartbeat resets, staleness counts the waking time', () => {
  const GRACE = 60000;
  const round = (prev, now, running = false) => nextHubWatch(prev, { now, running, graceMs: GRACE });
  const start = { wasAt: 0, staleMs: 0 };

  // A jump of 10 min with a stale heartbeat: not gone, and nothing counted.
  assert.deepEqual(round(start, 10 * MINUTE), { wasAt: 10 * MINUTE, staleMs: 0, gone: false });
  // A live heartbeat resets.
  assert.deepEqual(round({ wasAt: 0, staleMs: 50000 }, 2000, true), { wasAt: 2000, staleMs: 0, gone: false });
  // A jump also drops what was counted before it.
  assert.deepEqual(round({ wasAt: 0, staleMs: 58000 }, 30001), { wasAt: 30001, staleMs: 0, gone: false });
  // A gap of exactly 30 s is no jump.
  assert.deepEqual(round({ wasAt: 0, staleMs: 0 }, 30000), { wasAt: 30000, staleMs: 30000, gone: false });

  // 59 s of waking staleness in 2 s rounds: not gone. 60 s: gone.
  let watch = start;
  for (let now = 2000; now <= 58000; now += 2000) {
    watch = round(watch, now);
    assert.equal(watch.gone, false, String(now));
  }
  assert.equal(watch.staleMs, 58000);
  watch = round(watch, 59000);
  assert.deepEqual(watch, { wasAt: 59000, staleMs: 59000, gone: false });
  watch = round(watch, 60000);
  assert.deepEqual(watch, { wasAt: 60000, staleMs: 60000, gone: true });

  // Waking after a sleep: the jump round, then a stale heartbeat for a few rounds, then the watcher's timer writes it.
  watch = round(round(start, 10 * MINUTE), 10 * MINUTE + 2000);
  assert.deepEqual(watch, { wasAt: 10 * MINUTE + 2000, staleMs: 2000, gone: false });
  assert.equal(round(watch, 10 * MINUTE + 4000, true).staleMs, 0);

  // The grace is 60 s by default, and a clock stepping back counts nothing.
  assert.equal(nextHubWatch({ wasAt: 0, staleMs: 58000 }, { now: 2000, running: false }).gone, true);
  assert.equal(nextHubWatch({ wasAt: 0, staleMs: 57000 }, { now: 2000, running: false }).gone, false);
  assert.deepEqual(round({ wasAt: 5000, staleMs: 1000 }, 3000), { wasAt: 3000, staleMs: 1000, gone: false });
});

// Time for the hook's check, which runs every 2 s, to have run at least once after a change.
const pastACheck = () => new Promise((resolve) => setTimeout(resolve, 2600));
const beforeNow = () => new Date(Date.now() - 60000).toISOString();
const closedEvents = (root, session) => readEvents(root, session).events.filter((event) => event.event === 'PermissionClosed');

// A session's own transcript, for the hook to read through input.transcript_path.
function sessionTranscript(root, session, ...records) {
  const path = join(root, `${session}.jsonl`);
  writeFileSync(path, jsonLines(...records));
  return path;
}

test('answered in the session: a tool_result ends the hook, also an is_error one, and the registry gets PermissionClosed', async (t) => {
  const { root } = seedHub();
  const cases = [
    { session: 'plain', result: {} },
    { session: 'failed', result: { block: { is_error: true, content: 'Exit code 1' } } },
  ];
  const runs = await Promise.all(cases.map(async ({ session, result }) => {
    const path = sessionTranscript(root, session, transcriptToolUse(`toolu_${session}`, BASH_INPUT, beforeNow()));
    const { hook, record } = await assertWaits(t, root, hookInput({ session_id: session, transcript_path: path }));
    appendFileSync(path, jsonLines(transcriptToolResult(`toolu_${session}`, afterStart(record), result)));
    return { session, hook, record };
  }));
  for (const { session, hook, record } of runs) {
    assertEndedQuietly(await ended(hook));
    assert.equal(readPending(root, record.id), null, session);
    const closed = closedEvents(root, session);
    assert.equal(closed.length, 1, session);
    assert.equal(closed[0].outcome, 'tool-result', session);
    assert.equal(closed[0].sessionId, session);
    assert.ok(!JSON.stringify(closed[0]).includes('git push'), session);
  }
});

test('„No” in the prompt: the hook ends, PermissionClosed says interrupted, the wait is gone and the phase stays', async (t) => {
  const { root } = seedHub();
  const cases = [
    {
      session: 'refused',
      own: [transcriptToolUse('toolu_1', BASH_INPUT, beforeNow())],
      answer: (at) => [transcriptToolResult('toolu_1', at, REFUSED_RESULT), transcriptInterrupted(at)],
    },
    { session: 'only-text', own: [], answer: (at) => [transcriptInterrupted(at)] },
  ];
  const runs = await Promise.all(cases.map(async ({ session, own, answer }) => {
    const base = { session_id: session, prompt_id: 'pr1', cwd: 'C:\\repo' };
    recordHook(root, { ...base, hook_event_name: 'UserPromptSubmit', prompt: 'x' }, { id: `${session}-1`, at: beforeNow() });
    recordHook(root, { ...base, hook_event_name: 'Notification', notification_type: 'permission_prompt' }, { id: `${session}-2`, at: beforeNow() });
    const before = deriveSession(readEvents(root, session).events);
    assert.equal(before.waiting.kind, 'permission');
    const path = sessionTranscript(root, session, ...own);
    const { hook, record } = await assertWaits(t, root, hookInput({ session_id: session, transcript_path: path }));
    appendFileSync(path, jsonLines(...answer(afterStart(record))));
    return { session, hook, record, before };
  }));
  for (const { session, hook, record, before } of runs) {
    assertEndedQuietly(await ended(hook));
    assert.equal(readPending(root, record.id), null, session);
    assert.equal(closedEvents(root, session)[0].outcome, 'interrupted', session);
    assert.deepEqual(deriveSession(readEvents(root, session).events), { ...before, waiting: null }, session);
  }
});

test('an older identical call, a result of another input and an older interrupted turn do not end the hook', async (t) => {
  const { root } = seedHub();
  const cases = [
    {
      session: 'older-call',
      seed: () => [transcriptToolUse('toolu_old', BASH_INPUT, beforeNow()), transcriptToolResult('toolu_old', beforeNow())],
      later: () => [],
    },
    {
      session: 'other-input',
      seed: () => [],
      later: (record) => [transcriptToolUse('toolu_other', { ...BASH_INPUT, command: 'rm -rf build' }, beforeNow()), transcriptToolResult('toolu_other', afterStart(record))],
    },
    { session: 'older-interrupted', seed: () => [transcriptInterrupted(beforeNow())], later: () => [] },
  ];
  const runs = await Promise.all(cases.map(async ({ session, seed, later }) => {
    const path = sessionTranscript(root, session, ...seed());
    const { hook, record } = await assertWaits(t, root, hookInput({ session_id: session, transcript_path: path }));
    appendFileSync(path, jsonLines(...later(record)));
    return { session, path, hook, record };
  }));
  await pastACheck();
  for (const { session, hook, record } of runs) {
    assert.equal(hook.closed, null, session);
    assert.ok(readPending(root, record.id), session);
    assert.deepEqual(closedEvents(root, session), [], session);
  }
  // The same hooks still read the transcript: a real answer ends them.
  for (const { path, record } of runs) appendFileSync(path, jsonLines(transcriptInterrupted(afterStart(record))));
  for (const { hook } of runs) assertEndedQuietly(await ended(hook));
});

test('a transcript missing or unreadable: the hook keeps waiting', async (t) => {
  const { root } = seedHub();
  const folder = join(root, 'a-folder');
  mkdirSync(folder);
  const cases = {
    missing: join(root, 'none.jsonl'),
    folder,
    garbage: sessionTranscript(root, 'garbage-file'),
    'no-path': undefined,
  };
  writeFileSync(cases.garbage, 'not json\n{ broken\n[]\nnull\n');
  const runs = await Promise.all(Object.entries(cases).map(async ([session, path]) => ({
    session,
    ...await assertWaits(t, root, hookInput({ session_id: session, transcript_path: path })),
  })));
  await pastACheck();
  for (const { session, hook, record } of runs) {
    assert.equal(hook.closed, null, session);
    assert.ok(readPending(root, record.id), session);
    assert.deepEqual(closedEvents(root, session), [], session);
  }
});

async function deadPid() {
  const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore', windowsHide: true });
  await new Promise((resolve) => child.on('exit', resolve));
  return child.pid;
}

test('the session process gone: CLAUDE_PID of a dead process ends the hook, and the pending file is gone', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await assertWaits(t, root, hookInput(), { CLAUDE_PID: String(await deadPid()) });
  assertEndedQuietly(await ended(hook));
  assert.equal(readPending(root, record.id), null);
  assert.deepEqual(pendingFiles(root), []);
  assert.deepEqual(closedEvents(root, 's1'), []);
});

test('CLAUDE_PID unset, of a live process, or unusable is no such signal', async (t) => {
  const { root } = seedHub();
  const cases = { unset: undefined, live: String(process.pid), letters: 'abc', zero: '0' };
  const runs = await Promise.all(Object.entries(cases).map(async ([session, value]) => ({
    session,
    ...await assertWaits(t, root, hookInput({ session_id: session }), { CLAUDE_PID: value }),
  })));
  await pastACheck();
  for (const { session, hook, record } of runs) {
    assert.equal(hook.closed, null, session);
    assert.ok(readPending(root, record.id), session);
  }
});

test('sessionProcessGone asks only about a usable pid', () => {
  assert.equal(sessionProcessGone('123', () => false), true);
  assert.equal(sessionProcessGone('123', () => true), false);
  for (const value of [undefined, null, '', 'abc', '0', '-1', '1.5']) {
    assert.equal(sessionProcessGone(value, () => { throw new Error('asked'); }), false, String(value));
  }
});

test('recordPermissionClosed appends to the log of the session, with no command text', () => {
  const root = tempRoot();
  const record = { id: 'p1', sessionId: 's/1', promptId: 'pr1', tool: 'Bash', target: 'Push the branch', input: BASH_INPUT, inputHash: 'h' };
  recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: 's/1', prompt: 'x', cwd: 'C:\\repo' }, { id: 'e1', at: '2026-11-06T12:00:00.000Z' });
  const event = recordPermissionClosed(root, record, 'interrupted', { id: 'e2', at: '2026-11-06T12:00:01.000Z' });
  assert.deepEqual(event, { id: 'e2', at: '2026-11-06T12:00:01.000Z', event: 'PermissionClosed', sessionId: 's/1', cwd: null, promptId: 'pr1', outcome: 'interrupted' });
  const { events, broken } = readEvents(root, 's/1');
  assert.equal(broken, 0);
  assert.deepEqual(events.map((entry) => entry.event), ['UserPromptSubmit', 'PermissionClosed']);
  const fresh = tempRoot();
  recordPermissionClosed(fresh, { sessionId: 's2' }, 'tool-result', { id: 'e3', at: 't' });
  assert.equal(readEvents(fresh, 's2').events[0].promptId, null);
});

test('the pending record of a killed hook: listOpenPendings deletes it and returns none', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await assertWaits(t, root);
  writeDecision(root, record.id, decide('ok', 'a3', 'late'));
  hook.child.kill();
  await ended(hook);
  assert.ok(readPending(root, record.id));
  assert.deepEqual(listOpenPendings(root), []);
  assert.equal(readPending(root, record.id), null);
  assert.deepEqual(pendingFiles(root), []);
});

test('listOpenPendings lists live records only, and skips decisions, outcomes and broken files', () => {
  const root = tempRoot();
  writePending(root, { id: 'live', pid: 1 });
  writePending(root, { id: 'dead', pid: 2 });
  writeDecision(root, 'live', decide('ok', 'a1', 'x'));
  writeOutcome(root, 'live', { accepted: false, attempt: 'x' });
  writeFileSync(join(pendingDir(root), 'broken.json'), '{ not json');
  const open = listOpenPendings(root, { alive: (pid) => pid === 1 });
  assert.deepEqual(open.map((record) => record.id), ['live']);
  assert.equal(readPending(root, 'dead'), null);
  assert.ok(readDecision(root, 'live'));
  assert.deepEqual(listOpenPendings(tempRoot()), []);
});

test('listOpenPendings: a record counts as closed at startedAt + 8 h, also with a live pid', () => {
  const root = tempRoot();
  const now = Date.now();
  const HOUR = 60 * MINUTE;
  writePending(root, { id: 'young', pid: 1, startedAt: now - 8 * HOUR + 1000 });
  writePending(root, { id: 'limit', pid: 1, startedAt: now - 8 * HOUR });
  writePending(root, { id: 'iso', pid: 1, startedAt: new Date(now - 9 * HOUR).toISOString() });
  writePending(root, { id: 'unknown', pid: 1 });
  writeDecision(root, 'limit', decide('ok', 'a1', 'x'));
  const open = listOpenPendings(root, { alive: () => true, now });
  assert.deepEqual(open.map((record) => record.id).sort(), ['unknown', 'young']);
  assert.equal(readPending(root, 'limit'), null);
  assert.equal(readDecision(root, 'limit'), null);
  assert.equal(readPending(root, 'iso'), null);
  assert.deepEqual(listOpenPendings(root, { alive: () => true, now: now + 2000 }).map((record) => record.id), ['unknown']);
});

test('pending files: a closed record takes its decision along, and its outcome stays', () => {
  const root = tempRoot();
  writePending(root, { id: 'p1', pid: 1 });
  assert.equal(readPending(root, 'p1').pid, 1);
  assert.equal(readPending(root, 'none'), null);

  writeDecision(root, 'p1', decide('ok', 'a1', 'x'));
  assert.equal(readDecision(root, 'p1').attempt, 'x');
  removeDecision(root, 'p1');
  removeDecision(root, 'p1');
  assert.equal(readDecision(root, 'p1'), null);

  writeOutcome(root, 'p1', { accepted: true, verb: 'ok', attempt: 'x', reason: null, at: 't' });
  assert.equal(readOutcome(root, 'p1', 'x').accepted, true);
  assert.equal(readOutcome(root, 'p1', 'y'), null);

  writeDecision(root, 'p1', decide('ok', 'a1', 'z'));
  closePending(root, 'p1');
  closePending(root, 'p1');
  assert.equal(readPending(root, 'p1'), null);
  assert.equal(readDecision(root, 'p1'), null);
  assert.equal(readOutcome(root, 'p1', 'x').accepted, true);
  assert.deepEqual(pendingFiles(root), ['p1.outcome.json']);
});

test('asks: appended and read back; a broken line is skipped', () => {
  const root = tempRoot();
  assert.deepEqual(readAsks(root), []);
  appendAsk(root, { sessionId: 's1', tool: 'AskUserQuestion', at: 't1' });
  appendFileSync(join(root, 'asks.jsonl'), '{ broken\n');
  appendAsk(root, { sessionId: 's2', tool: 'ExitPlanMode', at: 't2' });
  assert.deepEqual(readAsks(root), [{ sessionId: 's1', tool: 'AskUserQuestion', at: 't1' }, { sessionId: 's2', tool: 'ExitPlanMode', at: 't2' }]);
});

test('passThroughReason goes in the order of the design', () => {
  const input = { session_id: 's1', cwd: 'C:\\repo', tool_name: 'Bash' };
  const open = { input, root: 'C:\\hub', hubRunning: true, hubSessions: { hub: ['h'], launched: [] }, entrypoint: 'cli', jobName: null };
  const reason = (fields) => passThroughReason({ ...open, ...fields });
  const dialog = { launched: [{ sessionId: 's1', name: 'dlg-x' }], hub: [] };

  assert.equal(reason({}), null);
  assert.equal(reason({ entrypoint: 'claude-vscode' }), null);
  assert.equal(reason({ hubRunning: false, input: { ...input, session_id: 'h' }, entrypoint: 'sdk-cli' }), 'hub-closed');
  assert.equal(reason({ input: { ...input, session_id: 'h', tool_name: 'AskUserQuestion' }, jobName: 'dlg-x', entrypoint: 'sdk-cli' }), 'hub-session');
  assert.equal(reason({ input: { ...input, cwd: 'c:/HUB/' } }), 'hub-session');
  assert.equal(reason({ jobName: 'dlg-x', input: { ...input, tool_name: 'ExitPlanMode' }, entrypoint: 'sdk-cli' }), 'dialog-fork');
  assert.equal(reason({ hubSessions: dialog }), 'dialog-fork');
  assert.equal(reason({ hubSessions: { hub: [], launched: [{ sessionId: 'other', name: 'dlg-x' }] } }), null);
  assert.equal(reason({ hubSessions: { hub: [], launched: [{ sessionId: 's1', name: 'x-dlg-' }] } }), null);
  assert.equal(reason({ hubSessions: { hub: [], launched: [{ sessionId: 's1', name: null }] } }), null);
  assert.equal(reason({ jobName: 'migracja' }), null);
  assert.equal(reason({ input: { ...input, tool_name: 'AskUserQuestion' }, entrypoint: 'sdk-cli' }), 'ask-tool');
  assert.equal(reason({ input: { ...input, tool_name: 'ExitPlanMode' } }), 'ask-tool');
  for (const entrypoint of ['sdk-cli', 'CLI', 'cli ', '', undefined, null]) assert.equal(reason({ entrypoint }), 'entrypoint');
});

test('readJobName gives the name, and null on any failure', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'state.json'), JSON.stringify({ name: 'dlg-1' }));
  assert.equal(readJobName(root), 'dlg-1');
  writeFileSync(join(root, 'state.json'), JSON.stringify({ name: 7 }));
  assert.equal(readJobName(root), null);
  writeFileSync(join(root, 'state.json'), 'null');
  assert.equal(readJobName(root), null);
  writeFileSync(join(root, 'state.json'), '{ broken');
  assert.equal(readJobName(root), null);
  assert.equal(readJobName(join(root, 'none')), null);
  assert.equal(readJobName(undefined), null);
});

test('laterEvent', () => {
  const startedAt = Date.parse('2026-11-06T12:00:00.000Z');
  const record = { tool: 'Bash', inputHash: 'h1', startedAt };
  const after = '2026-11-06T12:00:01.000Z';
  const before = '2026-11-06T11:59:59.000Z';
  const post = (at, fields) => ({ event: 'PostToolUse', at, tool: 'Bash', inputHash: 'h1', ...fields });

  assert.equal(laterEvent([], record), null);
  for (const event of ['UserPromptSubmit', 'Stop', 'StopFailure', 'SessionEnd']) {
    assert.equal(laterEvent([{ event, at: after }], record).event, event);
    assert.equal(laterEvent([{ event, at: before }], record), null);
  }
  assert.equal(laterEvent([post(after)], record).event, 'PostToolUse');
  assert.equal(laterEvent([post(before)], record), null);
  assert.equal(laterEvent([post('2026-11-06T12:00:00.000Z')], record), null);
  assert.equal(laterEvent([post(after, { inputHash: 'h2' })], record), null);
  assert.equal(laterEvent([post(after, { tool: 'Read' })], record), null);
  assert.equal(laterEvent([post(after, { inputHash: undefined })], record), null);
  assert.equal(laterEvent([{ event: 'Notification', kind: 'permission_prompt', at: after }], record), null);
  assert.equal(laterEvent([{ event: 'Stop', at: after }], { ...record, startedAt: '2026-11-06T12:00:00.000Z' }).event, 'Stop');
});

test('hookOutput: only ok allows, and deny never interrupts', () => {
  assert.deepEqual(hookOutput('ok'), { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'allow' } } });
  assert.deepEqual(hookOutput('nie'), { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision: { behavior: 'deny', message: DENY_MESSAGE } } });
  assert.equal(hookOutput('anything').hookSpecificOutput.decision.behavior, 'deny');
  assert.equal(hookOutput(undefined).hookSpecificOutput.decision.behavior, 'deny');
});

test('hubRunning: the heartbeat exists and is under 5 min old', () => {
  const root = tempRoot();
  assert.equal(hubRunning(root), false);
  writeFileSync(heartbeatPath(root), '');
  assert.equal(hubRunning(root), true);
  setAge(heartbeatPath(root), 4 * MINUTE);
  assert.equal(hubRunning(root), true);
  setAge(heartbeatPath(root), 6 * MINUTE);
  assert.equal(hubRunning(root), false);
});

// The hook's clock just after an item got its code, so a typed record dated a moment before it is newer than the code.
const NOW = () => Date.now() + 1000;

test('verifyDecision', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  const at = now - 500;
  const typedAt = new Date(at - 300).toISOString();
  const verdict = (verb, code) => verifyDecision({ root, record, decision: { verb, code, attempt: 'x', at }, now });
  const stamp = new Date(now).toISOString();

  assert.deepEqual(verdict('ok', 'a3'), { accepted: false, reason: 'no-item', typedAt: null, at: stamp });
  giveItem(root, record, 'a3');
  assert.equal(verdict('ok', 'a3').reason, 'not-typed');
  typeInHub(transcript, 'ok a3', typedAt);

  assert.equal(verdict('nie', 'a3').reason, 'not-typed');
  assert.equal(verdict('ok', 'a4').reason, 'no-item');
  assert.equal(verdict('zatwierdz', 'a3').reason, 'bad-verb');
  assert.equal(verifyDecision({ root, record, decision: { code: 'a3' }, now }).reason, 'bad-verb');
  assert.equal(verifyDecision({ root, record: { id: 'p2' }, decision: { verb: 'ok', code: 'a3', at }, now }).reason, 'no-item');
  assert.deepEqual(verdict('ok', 'A3'), { accepted: true, reason: null, typedAt, at: stamp });
});

test('verifyDecision: a decision with no number for a time, in the future or over 15 s old gets no search', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  giveItem(root, record, 'a3', { codeAt: now - 60000 });
  const decided = (at) => verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at }, now });
  typeInHub(transcript, 'ok a3', new Date(now - 20000).toISOString());
  typeInHub(transcript, 'ok a3', new Date(now - 1000).toISOString());
  for (const at of [undefined, null, 'wczoraj', String(now), Number.NaN, Infinity, now + 1000, now - 15001]) {
    assert.equal(decided(at).reason, 'stale-decision', String(at));
  }
  assert.deepEqual(readQueue(root).usedTypedRecords, []);
  assert.equal(decided(now - 15000).accepted, true);
});

test('verifyDecision: a decision a few ms ahead of the hook\'s clock is no decision from the future', () => {
  // Date.now() differs by up to 15 ms between Node processes on Windows (measured), and the hook can read the file
  // the moment it stands.
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  giveItem(root, record, 'a3');
  const at = now + 15;
  assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at }, now }).reason, 'not-typed');
  typeInHub(transcript, 'ok a3', new Date(now - 300).toISOString());
  assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at }, now }).accepted, true);
  assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now + 101 }, now }).reason, 'stale-decision');
});

test('verifyDecision: a typed record counts only inside the 15 s before the decision', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  const at = now - 100;
  giveItem(root, record, 'a3', { codeAt: now - 60000 });
  const decide3 = () => verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at }, now });
  typeInHub(transcript, 'ok a3', new Date(at - 16000).toISOString());
  assert.equal(decide3().reason, 'not-typed');
  typeInHub(transcript, 'ok a3', new Date(at - 15001).toISOString());
  assert.equal(decide3().reason, 'not-typed');
  typeInHub(transcript, 'ok a3', new Date(at + 1).toISOString());
  assert.equal(decide3().reason, 'not-typed');
  assert.deepEqual(readQueue(root).usedTypedRecords, []);
  typeInHub(transcript, 'ok a3', new Date(at - 15000).toISOString());
  assert.equal(decide3().accepted, true);
  typeInHub(transcript, 'ok a3', new Date(at).toISOString());
  assert.equal(decide3().accepted, true);
});

test('verifyDecision: a record dated before the item got its code does not count, inside the 15 s or not', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  giveItem(root, record, 'a3', { codeAt: now - 5000 });
  typeInHub(transcript, 'ok a3', new Date(now - 5001).toISOString());
  const decided = () => verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now - 100 }, now });
  assert.equal(decided().reason, 'not-typed');
  typeInHub(transcript, 'ok a3', new Date(now - 5000).toISOString());
  assert.equal(decided().accepted, true);
});

test('verifyDecision: a record with no uuid does not count', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  giveItem(root, record, 'a3');
  appendFileSync(transcript, `${JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user', content: '<bash-input> ok a3</bash-input>' }, timestamp: new Date(now - 600).toISOString(), entrypoint: 'cli' })}\n`);
  assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now - 100 }, now }).reason, 'not-typed');
});

test('verifyDecision: one typing opens one decision, the newest record first, and the used list keeps the last 50', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  const at = now - 100;
  giveItem(root, record, 'a3');
  const decided = () => verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at }, now });
  const older = new Date(at - 400).toISOString();
  const newer = new Date(at - 200).toISOString();
  typeInHub(transcript, 'ok a3', older, 'u-older');
  typeInHub(transcript, 'ok a3', newer, 'u-newer');
  assert.equal(decided().typedAt, newer);
  assert.deepEqual(readQueue(root).usedTypedRecords, ['u-newer']);
  assert.equal(decided().typedAt, older);
  assert.equal(decided().reason, 'not-typed');
  assert.deepEqual(readQueue(root).usedTypedRecords, ['u-newer', 'u-older']);

  withQueue(root, (state) => { state.usedTypedRecords = Array.from({ length: 50 }, (_, i) => 'old-' + i); });
  typeInHub(transcript, 'ok a3', newer, 'u-last');
  assert.equal(decided().accepted, true);
  const used = readQueue(root).usedTypedRecords;
  assert.equal(used.length, 50);
  assert.equal(used.at(-1), 'u-last');
  assert.equal(used[0], 'old-1');
});

test('verifyDecision: a queue from before the used list works, and a busy lock counts as not found, so the search goes on', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  giveItem(root, record, 'a3');
  withQueue(root, (state) => { delete state.usedTypedRecords; });
  typeInHub(transcript, 'ok a3', new Date(now - 600).toISOString(), 'u-1');
  const decided = () => verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now - 100 }, now });
  writeFileSync(queueLockPath(root), '');
  assert.equal(decided().reason, 'not-typed');
  rmSync(queueLockPath(root));
  assert.equal(readQueue(root).usedTypedRecords, undefined);
  assert.equal(decided().accepted, true);
  assert.deepEqual(readQueue(root).usedTypedRecords, ['u-1']);
});

test('verifyDecision: a record from a project session does not count', () => {
  const { root } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const project = join(root, 'project-transcript.jsonl');
  writeFileSync(project, '');
  recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: 'project', prompt: 'x', cwd: 'C:\repo', transcript_path: project }, { id: 'p-e1', at: new Date().toISOString() });
  const now = NOW();
  giveItem(root, record, 'a3');
  typeInHub(project, 'ok a3', new Date(now - 600).toISOString());
  assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now - 100 }, now }).reason, 'not-typed');
});

test('verifyDecision: an item with no time for its code never matches', () => {
  const { root, transcript } = seedHub();
  const record = { id: 'p1', sessionId: 's1' };
  const now = NOW();
  typeInHub(transcript, 'ok a3', new Date(now - 600).toISOString());
  for (const codeAt of [null, undefined, 'wczoraj']) {
    giveItem(root, record, 'a3', { codeAt });
    assert.equal(verifyDecision({ root, record, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: now - 100 }, now }).accepted, false);
  }
});

test('verifyDecision: a corrupt queue accepts nothing', () => {
  const { root, transcript } = seedHub();
  typeInHub(transcript, 'ok a3');
  writeFileSync(join(root, 'queue.json'), '{ broken');
  assert.equal(verifyDecision({ root, record: { id: 'p1' }, decision: { verb: 'ok', code: 'a3', attempt: 'x', at: Date.now() }, now: Date.now() + 100 }).reason, 'no-item');
});

test('shownCall: the literal command for Bash, never the description; other tools keep their target; one line, cut at 200', () => {
  assert.equal(shownCall({ tool: 'Bash', target: 'Opis', input: { command: 'ls -la', description: 'Opis' } }), 'ls -la');
  assert.equal(shownCall({ tool: 'Write', target: 'a.md', input: { file_path: 'a.md', content: 'x' } }), 'a.md');
  assert.equal(shownCall({ tool: 'Bash', target: 'Opis', input: { command: 'rm x\r\n  && ls\n' } }), 'rm x && ls');
  assert.equal(shownCall({ tool: 'Bash', input: { command: 'y'.repeat(201) } }), `${'y'.repeat(200)}…`);
  assert.equal(shownCall({ tool: 'Bash', input: null }), '');
});

test('markAnswered marks the item found by code, keeps an earlier time, and a busy queue costs nothing but the mark', () => {
  const root = tempRoot();
  const record = { id: 'p1', sessionId: 's1', startedAt: 1 };
  giveItem(root, record, 'a3');
  const key = 's1|p:p1';
  writeFileSync(queueLockPath(root), '');
  markAnswered(root, 'a3', 111);
  rmSync(queueLockPath(root));
  assert.equal(readQueue(root).items[key].answeredAt, undefined);
  markAnswered(root, 'A3', 222);
  assert.equal(readQueue(root).items[key].answeredAt, 222);
  markAnswered(root, 'a3', 333);
  assert.equal(readQueue(root).items[key].answeredAt, 222);
  markAnswered(root, 'a9', 444);
  assert.deepEqual(Object.keys(readQueue(root).items), [key]);
});

test('toolTarget and inputHash are exported from events.mjs', () => {
  assert.equal(toolTarget({ file_path: 'a.md', description: 'x' }), 'a.md');
  assert.equal(inputHash(undefined), inputHash({}));
  assert.notEqual(inputHash({ command: 'ls' }), inputHash({ command: 'pwd' }));
});
