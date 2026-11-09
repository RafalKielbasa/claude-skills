import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { writeFileSync, appendFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeDecision, readOutcome, listOpenPendings } from '../lib/pending.mjs';
import { recordHook } from '../lib/registry.mjs';
import { withQueue, readQueue, reconcile } from '../lib/queue.mjs';
import { heartbeatPath, hubSessionsPath, approvalsLogPath, alertsLogPath, pendingDir, queuePath } from '../lib/paths.mjs';
import { tempRoot } from './helpers.mjs';

const HOOK = fileURLToPath(new URL('../bin/hub-permission.mjs', import.meta.url));
const CMD = fileURLToPath(new URL('../bin/hub-cmd.mjs', import.meta.url));
const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const BASH_INPUT = { command: 'git push origin main', description: 'Push the branch' };
const NOT_TYPED = 'a3: nic nie zatwierdzono, bo tej komendy nie wpisano w zakładce huba';
const ACCEPTED = 'a3: zatwierdzone · Migracja · Bash git push origin main';
const TAKEN = 'a3: przyjęte, sprawdzam';

const hookInput = (fields = {}) => ({
  session_id: 's1', transcript_path: 'C:/x/s1.jsonl', cwd: 'C:\\repo', scratchpad_dir: 'C:/x/scratch', prompt_id: 'pr1',
  permission_mode: 'default', effort: { level: 'high' }, hook_event_name: 'PermissionRequest', tool_name: 'Bash', tool_input: BASH_INPUT,
  ...fields,
});

// A fresh heartbeat, a hub session with a transcript, and a project session transcript.
function seedHub() {
  const root = tempRoot();
  const transcript = join(root, 'hub-transcript.jsonl');
  const project = join(root, 'project-transcript.jsonl');
  writeFileSync(heartbeatPath(root), '');
  writeFileSync(transcript, '');
  writeFileSync(project, '');
  recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: 'hub-1', prompt: 'przegląd', cwd: root, transcript_path: transcript }, { id: 'hub-e1', at: new Date().toISOString() });
  writeFileSync(hubSessionsPath(root), JSON.stringify({ hub: ['hub-1'], launched: [] }));
  return { root, transcript, project };
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

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The real hook; killed and awaited when the test ends, whatever its result.
function startHook(t, root, input = hookInput()) {
  const child = spawn(process.execPath, [HOOK], {
    env: { ...process.env, HUB_DATA: root, CLAUDE_CODE_ENTRYPOINT: 'cli', CLAUDE_JOB_DIR: undefined, CLAUDE_PID: undefined },
    windowsHide: true,
  });
  const hook = { child, closed: null };
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  const closed = new Promise((resolve) => {
    child.on('close', (code) => { hook.closed = { code, stdout }; resolve(); });
  });
  t.after(async () => { child.kill(); await closed; });
  child.stdin.on('error', () => {});
  child.stdin.end(JSON.stringify(input));
  return hook;
}

const ended = (hook) => until(() => hook.closed, 15000, 'the hook to end');
const pendingOf = (root, hook) => until(() => listOpenPendings(root).find((record) => record.pid === hook.child.pid), 15000, 'the pending record');

// A command run as a child process; killed when the test ends.
function runFile(t, file, root, args) {
  return new Promise((resolve) => {
    const child = execFile(process.execPath, [file, ...args], { env: { ...process.env, HUB_DATA: root }, windowsHide: true }, (error, stdout) => {
      resolve({ code: error ? error.code : 0, stdout: stdout.trimEnd() });
    });
    t.after(() => child.kill());
  });
}
const runCmd = (t, root, ...args) => runFile(t, CMD, root, args);
const runOutcome = (t, root, ...args) => runFile(t, HUB, root, ['outcome', ...args]);

function giveItem(root, record, code, fields = {}) {
  withQueue(root, (state) => {
    const key = `${record.sessionId}|p:${record.id}`;
    state.items[key] = {
      key, sessionId: record.sessionId, kind: 'permission', since: record.startedAt, pendingId: record.id, answerable: true,
      askTool: null, name: 'Migracja', project: 'notatki', code, codeAt: Date.now(), answeredAt: null, skippedAt: null, ...fields,
    };
    state.codes.push({ n: Number(code.slice(1)), at: Date.now(), key, closedAt: null, name: 'Migracja' });
  });
}

// An item with no hook behind it.
function giveBareItem(root, key, code, fields = {}) {
  withQueue(root, (state) => {
    state.items[key] = {
      key, sessionId: 's9', kind: 'permission', since: Date.now(), pendingId: null, answerable: false, name: 'Inna', code,
      codeAt: Date.now(), answeredAt: null, skippedAt: null, ...fields,
    };
    state.codes.push({ n: Number(code.slice(1)), at: Date.now(), key, closedAt: null, name: 'Inna' });
  });
}

// What a typed `!` command leaves in a transcript.
function appendTyped(transcript, command, at) {
  const line = (content) => `${JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user', content }, timestamp: at, uuid: randomUUID(), userType: 'external', entrypoint: 'cli' })}\n`;
  appendFileSync(transcript, line(`<bash-input> ${command}</bash-input>`) + line('<bash-stdout></bash-stdout><bash-stderr></bash-stderr>'));
}

// Rafal typing `! <verb> <code>`, as Claude Code runs it: the record's time is taken before the command starts,
// and the record reaches the file only after the command has ended (probe report, „Correction of 2026-11-07”).
async function typeCommand(t, root, transcript, verb, code) {
  const at = new Date().toISOString();
  const result = await runCmd(t, root, verb, code);
  appendTyped(transcript, `${verb} ${code}`, at);
  return result;
}

async function waitingHook(t, root, code, input) {
  const hook = startHook(t, root, input);
  const record = await pendingOf(root, hook);
  giveItem(root, record, code);
  return { hook, record };
}

const approvals = (root) => (existsSync(approvalsLogPath(root)) ? readFileSync(approvalsLogPath(root), 'utf8').trim().split('\n').map((line) => JSON.parse(line)) : []);
const itemOf = (root) => Object.values(readQueue(root).items)[0];
const decisionFile = (root, record) => join(pendingDir(root), `${record.id}.decision.json`);

test('ok a3 ends at once with the hook still waiting; the record landing after it gives allow and answeredAt, with no HUB outcome run', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  const typedAt = new Date().toISOString();
  const started = Date.now();
  const result = await runCmd(t, root, 'ok', 'a3');
  const took = Date.now() - started;
  assert.deepEqual(result, { code: 0, stdout: TAKEN });
  assert.ok(took < 2000, `took ${took} ms`);
  await pause(700);
  assert.equal(hook.closed, null);
  assert.equal(itemOf(root).answeredAt, null);

  appendTyped(transcript, 'ok a3', typedAt);
  const done = await ended(hook);
  assert.equal(JSON.parse(done.stdout).hookSpecificOutput.decision.behavior, 'allow');
  assert.equal(typeof itemOf(root).answeredAt, 'number');
  await until(() => approvals(root).length, 5000, 'the approvals line');
  assert.equal(approvals(root)[0].accepted, true);
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: ACCEPTED });
});

test('the hook keeps its order: the outcome, then answeredAt, then the record closed, then the output', async (t) => {
  const { root, transcript } = seedHub();
  const { hook, record } = await waitingHook(t, root, 'a3');
  const seen = [];
  // Read last step first, so that a step seen done proves the earlier ones with no race against the reads.
  const look = setInterval(() => {
    const output = hook.closed !== null;
    const closed = !existsSync(join(pendingDir(root), `${record.id}.json`));
    const answered = Boolean(Object.values(readQueue(root).items)[0]?.answeredAt);
    const outcome = existsSync(join(pendingDir(root), `${record.id}.outcome.json`));
    seen.push({ outcome, answered, closed, output });
  }, 2);
  t.after(() => clearInterval(look));
  await typeCommand(t, root, transcript, 'ok', 'a3');
  await ended(hook);
  clearInterval(look);
  for (const round of seen) {
    assert.ok(!round.answered || round.outcome, JSON.stringify(round));
    assert.ok(!round.closed || round.answered, JSON.stringify(round));
    assert.ok(!round.output || round.closed, JSON.stringify(round));
  }
});

test('HUB outcome reads a decision off the code entry, also when the item has left the queue by then', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  assert.equal((await typeCommand(t, root, transcript, 'ok', 'a3')).code, 0);
  await ended(hook);
  withQueue(root, (state) => reconcile(state, [], Date.now()));
  assert.deepEqual(readQueue(root).items, {});
  assert.equal(typeof readQueue(root).codes[0].closedAt, 'number');
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: ACCEPTED });
  assert.deepEqual(await runOutcome(t, root, 'A3'), { code: 0, stdout: ACCEPTED });
});

test('nie a3: the same path with the deny output and the refused line', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  const typedAt = new Date().toISOString();
  assert.deepEqual(await runCmd(t, root, 'nie', 'a3'), { code: 0, stdout: TAKEN });
  await pause(700);
  assert.equal(hook.closed, null);
  appendTyped(transcript, 'nie a3', typedAt);
  const done = await ended(hook);
  const { decision } = JSON.parse(done.stdout).hookSpecificOutput;
  assert.equal(decision.behavior, 'deny');
  assert.ok(!('interrupt' in decision));
  assert.equal(typeof itemOf(root).answeredAt, 'number');
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: 'a3: odrzucone · Migracja · Bash git push origin main' });
});

test('the record landing 5 s after the command ended: accepted', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  const typedAt = new Date().toISOString();
  assert.equal((await runCmd(t, root, 'ok', 'a3')).code, 0);
  const outcome = runOutcome(t, root, 'a3');
  await pause(5000);
  assert.equal(hook.closed, null);
  appendTyped(transcript, 'ok a3', typedAt);
  assert.deepEqual(await outcome, { code: 0, stdout: ACCEPTED });
  assert.equal(JSON.parse((await ended(hook)).stdout).hookSpecificOutput.decision.behavior, 'allow');
});

test('no typed record: ok exits 0, HUB outcome says so with exit 3 within 10 s, the decision is gone, the hook keeps waiting, the item is untouched', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await waitingHook(t, root, 'a3');
  assert.deepEqual(await runCmd(t, root, 'ok', 'a3'), { code: 0, stdout: TAKEN });
  const started = Date.now();
  const outcome = await runOutcome(t, root, 'a3');
  const took = Date.now() - started;
  assert.deepEqual(outcome, { code: 3, stdout: NOT_TYPED });
  assert.ok(took < 10000, `took ${took} ms`);
  assert.equal(existsSync(decisionFile(root, record)), false);
  assert.equal(hook.closed, null);
  assert.equal(itemOf(root).answeredAt, null);
  const [line] = approvals(root);
  assert.equal(line.accepted, false);
  assert.equal(line.typedAt, null);
  // The search lasts 8 s on the clock, counted from the decision. Two processes' clocks are compared here.
  const searched = Date.parse(line.at) - Date.parse(line.decidedAt);
  assert.ok(searched >= 7900 && searched < 9500, `the search lasted ${searched} ms`);
});

test('HUB outcome is read-only: it changes no file, and a model running it approves nothing', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await waitingHook(t, root, 'a3');
  await runCmd(t, root, 'ok', 'a3');
  const outcome = await until(() => readOutcome(root, record.id, readQueue(root).codes[0].decision.attempt), 10000, 'the outcome');
  assert.equal(outcome.accepted, false);
  const files = () => JSON.stringify([readFileSync(queuePath(root), 'utf8'), readdirSync(pendingDir(root)).sort(), readFileSync(approvalsLogPath(root), 'utf8')]);
  const before = files();
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  assert.equal(files(), before);
  assert.equal(hook.closed, null);
});

test('a model refused, then Rafal typing ok a3: HUB outcome reports the second attempt, not the first outcome, and the same when run twice', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  await runCmd(t, root, 'ok', 'a3');
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  const typedAt = new Date().toISOString();
  assert.equal((await runCmd(t, root, 'ok', 'a3')).code, 0);
  const second = runOutcome(t, root, 'a3');
  // HUB outcome is already polling, with the first attempt's outcome still on disk.
  await pause(600);
  appendTyped(transcript, 'ok a3', typedAt);
  assert.deepEqual(await second, { code: 0, stdout: ACCEPTED });
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: ACCEPTED });
  await ended(hook);
});

test('HUB outcome: a code with no decision, a hook gone with no verdict, another reason of refusal', async (t) => {
  const { root } = seedHub();
  assert.deepEqual(await runOutcome(t, root, 'a9'), { code: 3, stdout: 'a9: nie ma decyzji do sprawdzenia' });
  const gone = await waitingHook(t, root, 'a3');
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: 'a3: nie ma decyzji do sprawdzenia' });
  await runCmd(t, root, 'ok', 'a3');
  gone.hook.child.kill();
  await ended(gone.hook);
  assert.deepEqual(await runOutcome(t, root, 'a3', '--wait-ms', '200'), { code: 3, stdout: 'a3: brak odpowiedzi hooka po 10 s. Zobacz, czy prompt w sesji Migracja nadal czeka.' });

  const other = await waitingHook(t, root, 'a4');
  await runCmd(t, root, 'ok', 'a4');
  // The item is gone from the queue, so the search has nothing to look for and ends at once.
  withQueue(root, (state) => { delete state.items[`${other.record.sessionId}|p:${other.record.id}`]; });
  const started = Date.now();
  assert.deepEqual(await runOutcome(t, root, 'a4'), { code: 3, stdout: 'a4: nic nie zatwierdzono (no-item)' });
  assert.ok(Date.now() - started < 3000);
  assert.equal(other.hook.closed, null);
});

test('the typed record only in a project session transcript: nothing is approved, and HUB outcome says why', async (t) => {
  const { root, project } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  assert.equal((await typeCommand(t, root, project, 'ok', 'a3')).code, 0);
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  assert.equal(hook.closed, null);
  assert.equal(itemOf(root).answeredAt, null);
});

test('a decision file written directly, without the command or the typed record: the hook does not allow', async (t) => {
  const { root } = seedHub();
  const { hook, record } = await waitingHook(t, root, 'a3');
  writeDecision(root, record.id, { verb: 'ok', code: 'a3', attempt: 'forged', at: Date.now() });
  const outcome = await until(() => readOutcome(root, record.id, 'forged'), 10000, 'the outcome');
  assert.equal(outcome.accepted, false);
  assert.equal(hook.closed, null);
});

test('one decision, one typing: a second ok a3 over 15 s after a refused one whose record landed late is refused, and the hook does not allow', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  const typedAt = new Date().toISOString();
  await runCmd(t, root, 'ok', 'a3');
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  appendTyped(transcript, 'ok a3', typedAt);
  await pause(Math.max(0, Date.parse(typedAt) + 15500 - Date.now()));
  // A model's call, with no new typed record.
  assert.deepEqual(await runCmd(t, root, 'ok', 'a3'), { code: 0, stdout: TAKEN });
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: NOT_TYPED });
  assert.equal(hook.closed, null);
  assert.equal(itemOf(root).answeredAt, null);
  assert.deepEqual(readQueue(root).usedTypedRecords, []);
});

test('unknown, closed, decision and hookless items get their sentences, and write no decision', async (t) => {
  const { root } = seedHub();
  assert.equal((await runCmd(t, root, 'ok', 'a9')).stdout, 'a9: nie ma takiej pozycji');
  giveBareItem(root, 's9|1', 'a1', { answeredAt: Date.now() });
  const closed = await runCmd(t, root, 'ok', 'a1');
  assert.equal(closed.stdout, 'a1: ta pozycja już nie czeka');
  assert.equal(closed.code, 3);
  giveBareItem(root, 's9|2', 'a2', { kind: 'decision', answerable: true });
  assert.equal((await runCmd(t, root, 'ok', 'a2')).stdout, 'a2 to decyzja: odpowiedz „a2 <tekst>”');
  giveBareItem(root, 's9|3', 'a3');
  const bare = await runCmd(t, root, 'ok', 'a3');
  assert.equal(bare.stdout, 'a3: odpowiedz w sesji Inna');
  assert.equal(bare.code, 3);
  giveBareItem(root, 's9|4', 'a4', { pendingId: 'gone', answerable: true });
  assert.equal((await runCmd(t, root, 'nie', 'A4')).stdout, 'a4: odpowiedz w sesji Inna');
  giveBareItem(root, 's9|5', 'a5', { kind: 'decision', askTool: 'AskUserQuestion' });
  assert.deepEqual(await runCmd(t, root, 'ok', 'a5'), { code: 3, stdout: 'a5: odpowiedz w sesji Inna' });
  assert.ok(readQueue(root).codes.every((entry) => !entry.decision));
  assert.equal(existsSync(pendingDir(root)), false);
});

test('a skipped permission can still be approved: dalej leaves it in the overview, and ok a3 takes it', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  withQueue(root, (state) => { Object.values(state.items)[0].skippedAt = Date.now(); });
  assert.deepEqual(await typeCommand(t, root, transcript, 'ok', 'a3'), { code: 0, stdout: TAKEN });
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: ACCEPTED });
  assert.equal(JSON.parse((await ended(hook)).stdout).hookSpecificOutput.decision.behavior, 'allow');
});

test('two hooks waiting: ok a4 answers only the hook of a4', async (t) => {
  const { root, transcript } = seedHub();
  const first = await waitingHook(t, root, 'a3', hookInput({ session_id: 's1', tool_input: { command: 'ls one' } }));
  const second = await waitingHook(t, root, 'a4', hookInput({ session_id: 's2', tool_input: { command: 'ls two', description: 'List two' } }));
  await typeCommand(t, root, transcript, 'ok', 'a4');
  assert.deepEqual(await runOutcome(t, root, 'a4'), { code: 0, stdout: 'a4: zatwierdzone · Migracja · Bash ls two' });
  await ended(second.hook);
  assert.equal(first.hook.closed, null);
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 3, stdout: 'a3: nie ma decyzji do sprawdzenia' });
});

test('pauza sets the mode and keeps the first pausedAt', async (t) => {
  const { root } = seedHub();
  const first = await runCmd(t, root, 'pauza');
  assert.match(first.stdout, /^Pauza od \d\d:\d\d\. Alerty wstrzymane, kolejka zbiera dalej\.$/);
  assert.equal(first.code, 0);
  const state = readQueue(root);
  assert.equal(state.mode, 'paused');
  assert.equal(typeof state.pausedAt, 'number');
  await pause(20);
  await runCmd(t, root, 'pauza');
  assert.equal(readQueue(root).pausedAt, state.pausedAt);
});

test('wracam walks with waiting items, listens with none, and logs a walk line', async (t) => {
  const { root } = seedHub();
  giveBareItem(root, 's9|1', 'a1');
  giveBareItem(root, 's9|2', 'a2');
  const walking = await runCmd(t, root, 'wracam');
  assert.equal(walking.stdout, 'Wracamy: czeka 2. Najstarsza idzie pierwsza.');
  assert.equal(walking.code, 0);
  assert.equal(readQueue(root).mode, 'walking');
  withQueue(root, (state) => { for (const item of Object.values(state.items)) item.answeredAt = Date.now(); });
  const idle = await runCmd(t, root, 'wracam');
  assert.equal(idle.stdout, 'Nic nie czeka.');
  assert.equal(readQueue(root).mode, 'listening');
  const lines = readFileSync(alertsLogPath(root), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual([lines.length, lines[0].type, lines[0].waiting, lines[1].waiting], [2, 'walk', 2, 0]);
  assert.equal(typeof lines[0].at, 'number');
});

test('wracam clears the current item of a walk, also with an open one, so it speaks again', async (t) => {
  const { root } = seedHub();
  giveBareItem(root, 's9|1', 'a1');
  withQueue(root, (state) => { state.mode = 'paused'; state.pausedAt = Date.now(); state.walkCurrent = 's9|1'; });
  assert.equal((await runCmd(t, root, 'wracam')).stdout, 'Wracamy: czeka 1. Najstarsza idzie pierwsza.');
  const state = readQueue(root);
  assert.equal(state.mode, 'walking');
  assert.equal(state.walkCurrent, null);
  assert.equal(state.pausedAt, null);
});

test('the outcome shows the literal command, not the model-written description, on one line, cut at 200', async (t) => {
  const { root, transcript } = seedHub();
  const long = `rm -rf build\n${'x'.repeat(300)}`;
  const { hook } = await waitingHook(t, root, 'a3', hookInput({ tool_input: { command: long, description: 'List files' } }));
  await typeCommand(t, root, transcript, 'ok', 'a3');
  const result = await runOutcome(t, root, 'a3');
  assert.ok(!result.stdout.includes('List files'));
  assert.equal(result.stdout, `a3: zatwierdzone · Migracja · Bash ${`rm -rf build ${'x'.repeat(300)}`.slice(0, 200)}…`);
  await ended(hook);
});

test('a repeated ok a3 after it was accepted: the position no longer waits, and HUB outcome still reports the first', async (t) => {
  const { root, transcript } = seedHub();
  const { hook } = await waitingHook(t, root, 'a3');
  assert.equal((await typeCommand(t, root, transcript, 'ok', 'a3')).code, 0);
  await ended(hook);
  const again = await runCmd(t, root, 'ok', 'a3');
  assert.equal(again.stdout, 'a3: ta pozycja już nie czeka');
  assert.equal(again.code, 3);
  assert.deepEqual(await runOutcome(t, root, 'a3'), { code: 0, stdout: ACCEPTED });
});
