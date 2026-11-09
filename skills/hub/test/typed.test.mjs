import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTyped, releaseClaim, takeTyped, verifyPrompt } from '../lib/typed.mjs';
import { recordHook, readEvents } from '../lib/registry.mjs';
import { deriveSession } from '../lib/derive.mjs';
import { appendAsk, writePending } from '../lib/pending.mjs';
import { loadRecords, saveRecords } from '../lib/journal.mjs';
import { loadItemContext, renderItem } from '../lib/item.mjs';
import { itemByCode, readQueue, withQueue } from '../lib/queue.mjs';
import { hubSessionsPath, queueLockPath, queuePath } from '../lib/paths.mjs';
import { sha256 } from '../lib/text.mjs';
import { tempRoot } from './helpers.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const S1 = 'abcdef12-1111-4111-8111-111111111111';
const S2 = 'fedcba98-2222-4222-8222-222222222222';
const HUB_SESSION = 'cccccccc-3333-4333-8333-333333333333';
const TITLE = 'Migracja';
const GATE = '### ❓ PYTANIE I WARIANTY\n[A] tak\n[B] nie\n\n⏸ Czeka na decyzję: A czy B?';
const FIVE = '**Cel**\nx\n**Kontekst**\nx\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nPokaż wynik.';
const MISMATCH = 'Tekst nie zgadza się z tym, co wpisałeś. Nic nie wysłano.';
const AS_TEXT = 'Komenda się nie wykonała, nic nie zatwierdzono ani nie zmieniono: `!` trzeba wcisnąć ręcznie, potem wkleić resztę. W panelu VS Code `!` nie działa.';
const CLOSED = 'a3: ta pozycja już nie czeka';
const NOTHING_ANNOUNCED = 'Nic jeszcze nie ogłoszono. Podaj kod, np. „dawaj a3”.';
const LAST_GONE = 'Ostatnio ogłoszona pozycja (a3) już nie czeka. Nic nie zrobiłem.';
const ANSWER_THERE = `a3: odpowiedz w sesji ${TITLE}`;
const DIALOG_DIR = '2026-11-06-1000-talk';

const ago = (ms) => new Date(Date.now() - ms).toISOString();
// Stamps from two processes are compared here, and on Windows they can run out of order: an event stamped after
// the overview had ended was measured 1-5 ms before the code that overview gave. Waiting this long orders them.
const tick = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 60);

// Repositories for the whole file: no test changes them.
function makeRepo(name) {
  const dir = join(tempRoot(), name);
  const git = (...args) => spawnSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@e', ...args]);
  mkdirSync(dir, { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main', dir]);
  writeFileSync(join(dir, 'README.md'), 'x');
  git('add', '-A');
  git('commit', '-q', '-m', 'init');
  return dir;
}
const repo = makeRepo('app');
const otherRepo = makeRepo('other');

const pollEntryOf = (sessionId, name, status = 'idle') => ({ sessionId, id: sessionId, name, kind: 'interactive', status, state: null, cwd: repo });

// A fresh data root with codes a1 and a2 already given, so the first item gets a3.
function world() {
  const root = tempRoot();
  const talkRoot = tempRoot();
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { app: { name: 'App', dir: repo, description: 'Test app.' }, other: { name: 'Other', dir: otherRepo, description: 'Another.' } } }));
  const agents = join(root, 'agents.json');
  writeFileSync(agents, JSON.stringify([pollEntryOf(S1, 'probe-a'), pollEntryOf(S2, 'probe-b')]));
  withQueue(root, (state) => {
    for (const n of [1, 2]) state.codes.push({ n, at: Date.now(), key: `older|${n}`, closedAt: Date.now(), name: 'x' });
  });
  const env = { ...process.env, HUB_DATA: root, HUB_TALK_ROOT: talkRoot };
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env });
  const hook = (fields, at = new Date().toISOString()) => recordHook(root, { cwd: repo, prompt_id: randomUUID(), ...fields }, { id: randomUUID(), at });
  return { root, talkRoot, agents, env, hub, hook };
}

// A session's turn that ended at a gate, through the real hook input.
function gate(w, sessionId = S1, stopAt = ago(120000), cwd = repo) {
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: sessionId, cwd, prompt: 'pracuj', session_title: TITLE }, new Date(Date.parse(stopAt) - 1000).toISOString());
  w.hook({ hook_event_name: 'Stop', session_id: sessionId, cwd, last_assistant_message: GATE }, stopAt);
}

// The overview reconciles the queue and gives the codes.
const list = (w) => {
  const result = w.hub('overview', '--agents-json', w.agents);
  assert.equal(result.status, 0, result.stderr);
  tick();
  return result;
};
const announce = (w, code) => withQueue(w.root, (state) => { state.lastAnnounced = code; });
const waitingGate = (w, sessionId = S1) => {
  gate(w, sessionId);
  list(w);
};

const hubPrompt = (w, prompt, at) => w.hook({ hook_event_name: 'UserPromptSubmit', session_id: HUB_SESSION, cwd: w.root, prompt }, at);
const runTyped = (w, passes, agents = w.agents) => {
  const result = spawnSync(process.execPath, [HUB, 'typed', '--prompt-file', '-', '--agents-json', agents], { encoding: 'utf8', env: w.env, input: `${passes}\n` });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};
// Rafal types `prompt` in the hub tab; the hub model passes `passes` on through a heredoc.
const type = (w, prompt, { passes = prompt, agents } = {}) => {
  hubPrompt(w, prompt);
  return runTyped(w, passes, agents);
};
const startTyped = (w, passes, agents = w.agents) => new Promise((done) => {
  const child = spawn(process.execPath, [HUB, 'typed', '--prompt-file', '-', '--agents-json', agents], { env: w.env, windowsHide: true });
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.on('close', () => done(JSON.parse(stdout)));
  child.stdin.end(`${passes}\n`);
});
// A poll that runs test code while the command waits for it: a saved poll file read from a named pipe.
async function pollPipe(t, onPoll) {
  const path = `\\\\.\\pipe\\hub-test-${randomUUID()}`;
  const server = createServer((socket) => { socket.end(JSON.stringify(onPoll())); });
  await new Promise((done) => server.listen(path, done));
  t.after(() => server.close());
  return path;
}
const WINDOWS_ONLY = { skip: process.platform !== 'win32' };

const itemOf = (w, code) => itemByCode(readQueue(w.root), code);
const records = (w) => loadRecords(w.root, 'app');
const assertRefused = (out, message) => assert.deepEqual(out, { action: 'refused', message });

function dialogFile(w, { name = 'prompt.md', body = FIVE, project = 'app' } = {}) {
  const dir = join(w.talkRoot, 'projects', project, 'dialogs', DIALOG_DIR);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, name);
  tick();
  writeFileSync(file, body);
  tick();
  return file;
}
const voiceSend = (w, code, file) => {
  const result = w.hub('voice', 'send', code, '--prompt-file', file, '--agents-json', w.agents);
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
};

// A running hook's permission: its pending record began before the session's Notification.
function hookPermission(w, sessionId = S1) {
  const promptId = randomUUID();
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: sessionId, prompt: 'pracuj', session_title: TITLE, prompt_id: promptId }, ago(200000));
  const record = { id: `pend-${randomUUID()}`, sessionId, promptId, tool: 'Bash', target: 'opis', inputHash: 'h', input: { command: 'git status' }, pid: process.pid, startedAt: ago(100000) };
  writePending(w.root, record);
  w.hook({ hook_event_name: 'Notification', notification_type: 'permission_prompt', session_id: sessionId, prompt_id: promptId }, ago(99000));
  list(w);
  return record;
}

// A prompt the hook did not hold: the item stays in the queue with nothing behind it.
function bareWait(w, { ask = false } = {}) {
  const promptId = randomUUID();
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'pracuj', session_title: TITLE, prompt_id: promptId }, ago(200000));
  if (ask) appendAsk(w.root, { sessionId: S1, tool: 'AskUserQuestion', at: ago(100000) });
  w.hook({ hook_event_name: 'Notification', notification_type: 'permission_prompt', session_id: S1, prompt_id: promptId }, ago(99000));
  list(w);
}

// --- parseTyped

test('parseTyped: a code with text is an answer, the newline kept and the code in lower case', () => {
  assert.deepEqual(parseTyped('a3 B'), { kind: 'answer', code: 'a3', body: 'B' });
  assert.deepEqual(parseTyped('A3 tak\ndrugie'), { kind: 'answer', code: 'a3', body: 'tak\ndrugie' });
  assert.deepEqual(parseTyped('a12 wyślij to, proszę\n'), { kind: 'answer', code: 'a12', body: 'wyślij to, proszę' });
  assert.deepEqual(parseTyped('a3\nB'), { kind: 'answer', code: 'a3', body: 'B' });
});

test('parseTyped: a code alone shows the item; dawaj and dalej with or without a code', () => {
  assert.deepEqual(parseTyped('a3'), { kind: 'show', code: 'a3' });
  assert.deepEqual(parseTyped('A3\n'), { kind: 'show', code: 'a3' });
  assert.deepEqual(parseTyped('dawaj'), { kind: 'dawaj', code: null });
  assert.deepEqual(parseTyped('Dawaj A3'), { kind: 'dawaj', code: 'a3' });
  assert.deepEqual(parseTyped('dalej'), { kind: 'dalej', code: null });
  assert.deepEqual(parseTyped('dalej a3'), { kind: 'dalej', code: 'a3' });
});

test('parseTyped: ordinary conversation stays other', () => {
  for (const text of ['B', 'tak', 'wyślij', 'a co z tym?', 'a3b coś', 'dawaj mi to', 'dalej a3 proszę', 'ok', 'nie wiem', 'ok a3 i coś jeszcze', 'pauza w pracy', 'wracam jutro', 'a', '! ls', '! ok']) {
    assert.deepEqual(parseTyped(text), { kind: 'other' }, text);
  }
});

test('parseTyped: Rafal\'s commands arriving as text, with or without the !', () => {
  for (const text of ['! ok a3', '!ok a3', '! NIE A3', 'ok a3', 'nie a3', '! pauza', 'pauza', '! wracam', 'wracam', '!pauza', 'Pauza\n']) {
    assert.deepEqual(parseTyped(text), { kind: 'command-as-text' }, text);
  }
});

test('parseTyped: a later line starting with a code or a command may be a merged answer', () => {
  for (const text of ['a3 tak\na4 B', 'A3 tak\nA4', 'a3\na4 B', 'a3 tak\n\n  a4 B', 'a3 tak\na12\ndrugie', 'a3 tak\nkolejna\na12 x', 'a3 tak\r\na4 B', 'a3 tak\ndawaj', 'a3 tak\nDalej', 'a3 tak\ndawaj a4', 'a3 tak\ndalej A4 ', 'a3 tak\n dalej a4 \nkolejna']) {
    assert.deepEqual(parseTyped(text), { kind: 'merged' }, text);
  }
  for (const text of ['a3 a4 B', 'a3 dawaj', 'a3 dalej a4', 'A3 tak\ndrugie', 'a3\nB', 'a3 tak\na4b x', 'a3 tak\na03 x', 'a3 tak\na4, tak', 'a3 tak\ndawaj mi to', 'a3 tak\ndalej a4 proszę', 'a3 tak\nok a4', 'a3 tak\n! nie a4', 'a3 tak\npauza']) {
    assert.equal(parseTyped(text).kind, 'answer', text);
  }
});

test('parseTyped: a message from another session is other, whatever it carries', () => {
  assert.deepEqual(parseTyped('<cross-session-message from="x" from-name="y">\na3 B\n</cross-session-message>'), { kind: 'other' });
});

// --- verifyPrompt

const prompts = () => {
  const root = tempRoot();
  const add = (sessionId, prompt, { cwd = root, at = new Date().toISOString(), id = randomUUID() } = {}) => {
    recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: sessionId, cwd, prompt }, { id, at });
    return id;
  };
  return { root, add };
};
const verified = (root, text, options = {}) => verifyPrompt(root, text, { retryMs: 0, ...options });

test('verifyPrompt: a session on the hub list counts whatever its cwd', () => {
  const { root, add } = prompts();
  writeFileSync(hubSessionsPath(root), JSON.stringify({ hub: [HUB_SESSION], launched: [] }));
  const id = add(HUB_SESSION, 'a3 B', { cwd: 'C:\\anywhere' });
  assert.equal(verified(root, 'a3 B').eventId, id);
});

test('verifyPrompt: a session not listed yet counts by a cwd equal to the root, not by a sub-directory', () => {
  const { root, add } = prompts();
  const id = add(HUB_SESSION, 'a3 B', { cwd: root.toUpperCase() });
  assert.equal(verified(root, 'a3 B').eventId, id);
  const other = prompts();
  other.add(HUB_SESSION, 'a3 B', { cwd: join(other.root, 'sub') });
  assert.equal(verified(other.root, 'a3 B').ok, false);
});

test('verifyPrompt: the same text typed in a project session does not count', () => {
  const { root, add } = prompts();
  add(S1, 'a3 B', { cwd: 'C:\\repo' });
  assert.equal(verified(root, 'a3 B').ok, false);
});

test('verifyPrompt: a heredoc\'s trailing newline and a CRLF do not refuse; any other change does', () => {
  const { root, add } = prompts();
  add(HUB_SESSION, 'a3 tak\r\ndrugie');
  for (const same of ['a3 tak\ndrugie', 'a3 tak\ndrugie\n', 'a3 tak\r\ndrugie\r\n']) assert.equal(verified(root, same).ok, true, same);
  for (const changed of ['a3 tak\ndrugie.', 'a3 Tak\ndrugie', 'a3  tak\ndrugie', ' a3 tak\ndrugie', 'a3 tak\n\ndrugie', 'a3 tak']) assert.equal(verified(root, changed).ok, false, changed);
});

test('verifyPrompt: an event older than 30 minutes, or already used, does not count; the newest free one does', () => {
  const { root, add } = prompts();
  const now = Date.now();
  const older = add(HUB_SESSION, 'a3 B', { at: new Date(now - 20 * 60 * 1000).toISOString() });
  const newer = add(HUB_SESSION, 'a3 B', { at: new Date(now - 10 * 60 * 1000).toISOString() });
  assert.deepEqual(verified(root, 'a3 B', { now }), { ok: true, eventId: newer, at: now - 10 * 60 * 1000 });
  assert.equal(verified(root, 'a3 B', { now: now + 19 * 60 * 1000 }).eventId, newer);
  assert.equal(verified(root, 'a3 B', { now: now + 41 * 60 * 1000 }).ok, false);
  withQueue(root, (state) => { state.usedPromptEvents = [newer]; });
  assert.deepEqual(verified(root, 'a3 B', { now }), { ok: true, eventId: older, at: now - 20 * 60 * 1000 });
  withQueue(root, (state) => { state.usedPromptEvents = [newer, older]; });
  assert.deepEqual(verified(root, 'a3 B', { now }), { ok: false, eventId: null, at: null });
});

test('verifyPrompt: an old prompt in a log still being written is out of the window by its own time', () => {
  const { root, add } = prompts();
  add(HUB_SESSION, 'a3 B', { at: ago(31 * 60 * 1000) });
  add(HUB_SESSION, 'co dalej?');
  assert.equal(verified(root, 'a3 B').ok, false);
  const id = add(HUB_SESSION, 'a3 B', { at: ago(29 * 60 * 1000) });
  assert.equal(verified(root, 'a3 B').eventId, id);
});

test('verifyPrompt: a message another session sent to the hub is not what Rafal typed', () => {
  const { root, add } = prompts();
  add(HUB_SESSION, '<cross-session-message from="x" from-name="y">\na3 B\n</cross-session-message>');
  assert.equal(verified(root, 'a3 B').ok, false);
});

// --- HUB typed: what never reaches a session

test('HUB typed: a command arriving as text is refused with how to type it, and nothing changes', () => {
  const w = world();
  waitingGate(w);
  const before = readFileSync(queuePath(w.root), 'utf8');
  for (const line of ['! ok a3', '!ok a3', '! NIE A3', 'ok a3', 'nie a3', '! pauza', 'pauza', '! wracam', 'wracam']) {
    assertRefused(runTyped(w, line), AS_TEXT);
  }
  assert.equal(readFileSync(queuePath(w.root), 'utf8'), before);
  assert.deepEqual(records(w), []);
});

test('HUB typed: text without a code does nothing and costs no wait for a hook', () => {
  const w = world();
  waitingGate(w);
  const before = readFileSync(queuePath(w.root), 'utf8');
  const started = Date.now();
  assert.deepEqual(runTyped(w, 'B'), { action: 'none' });
  assert.ok(Date.now() - started < 2500);
  assert.equal(readFileSync(queuePath(w.root), 'utf8'), before);
  assert.deepEqual(records(w), []);
});

test('HUB typed: text altered by the model is refused, with no record and no claim', () => {
  const w = world();
  waitingGate(w);
  assertRefused(type(w, 'a3 B', { passes: 'a3 C' }), MISMATCH);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.deepEqual(readQueue(w.root).usedPromptEvents, []);
});

test('HUB typed: a replay of one prompt event is refused, and typing it again finds the item answered', () => {
  const w = world();
  waitingGate(w);
  assert.equal(type(w, 'a3 B').action, 'send');
  assertRefused(runTyped(w, 'a3 B'), MISMATCH);
  assert.equal(records(w).length, 1);
  assertRefused(type(w, 'a3 B'), CLOSED);
  assert.equal(records(w).length, 1);
});

test('HUB typed: two processes on one prompt: exactly one prints send', async () => {
  const w = world();
  waitingGate(w);
  hubPrompt(w, 'a3 B');
  const outputs = await Promise.all([startTyped(w, 'a3 B'), startTyped(w, 'a3 B')]);
  assert.deepEqual(outputs.map((out) => out.action).sort(), ['refused', 'send']);
  assert.equal(records(w).length, 1);
});

test('HUB typed: the hook\'s event arriving just after the model ran the command still counts', async () => {
  const w = world();
  waitingGate(w);
  const running = startTyped(w, 'a3 B');
  await new Promise((resolve) => setTimeout(resolve, 700));
  hubPrompt(w, 'a3 B');
  assert.equal((await running).action, 'send');
});

test('HUB typed: a code nobody was given', () => {
  const w = world();
  waitingGate(w);
  assertRefused(type(w, 'a9 B'), 'a9: nie ma takiej pozycji');
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

// --- HUB typed: the send

test('HUB typed: a3 B at a waiting gate: the verbatim message, a pending record, a claim, and HUB confirm confirms it', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'a3 B');
  assert.equal(out.action, 'send');
  assert.equal(out.to, 'probe-a');
  assert.match(out.message, /^\[hub · gate-answer · app · abcdef12 · \d{4}-\d\d-\d\d \d\d:\d\d · a3\]\n\nB\n$/);
  const [record] = records(w);
  assert.equal(record.id, out.id);
  assert.equal(record.state, 'pending');
  assert.equal(record.path, 'gate-answer');
  assert.equal(record.sessionId, S1);
  assert.equal(record.textHash, sha256(out.message));
  assert.equal(record.sentFile, out.sentFile);
  assert.equal(readFileSync(out.sentFile, 'utf8'), out.message);
  assert.deepEqual(out.warnings, [{ check: 6, message: 'the session waits for decision: A czy B?' }]);
  const item = itemOf(w, 'a3');
  assert.equal(typeof item.answeredAt, 'number');
  assert.equal(item.answerRecordId, out.id);

  assert.equal(w.hub('result', out.id, '--msg-id', '11111111-2222-3333-4444-555555555555').status, 0);
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: `<cross-session-message from="uds:x" from-name="hub" from-mode="default">\n${out.message}\n</cross-session-message>` }, new Date(Date.now() + 1000).toISOString());
  assert.deepEqual(JSON.parse(w.hub('confirm').stdout).confirmed, [out.id]);
  assert.equal(records(w)[0].state, 'sent');
});

test('HUB typed: the body goes verbatim, several lines and Polish letters, whatever the case of the code', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'A3 Zażółć gęślą jaźń\n\n[B] drugie');
  assert.match(out.message, /^\[hub · gate-answer · app · abcdef12 · [^\]]* · a3\]\n\nZażółć gęślą jaźń\n\n\[B\] drugie\n$/);
});

test('Review Focus 2: a gate answered in the session between the announcement and a3 B: nothing is sent', () => {
  const w = world();
  gate(w, S1, ago(300000));
  list(w);
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'B' }, ago(200000));
  assertRefused(type(w, 'a3 B'), CLOSED);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('Review Focus 2: also when a newer gate already waits in that session, which keeps waiting', () => {
  const w = world();
  gate(w, S1, ago(300000));
  list(w);
  gate(w, S1, ago(100000));
  const newerSince = deriveSession(readEvents(w.root, S1).events).waiting.since;
  assertRefused(type(w, 'a3 B'), CLOSED);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(deriveSession(readEvents(w.root, S1).events).waiting.since, newerSince);

  list(w);
  assert.equal(itemOf(w, 'a4').since, Date.parse(newerSince));
  assert.equal(itemOf(w, 'a4').answeredAt, null);
  assertRefused(type(w, 'a3 B'), CLOSED);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a4').answeredAt, null);
  assert.equal(type(w, 'a4 B').action, 'send');
});

test('HUB typed: text on a permission item names the commands, also when its hook began before the Notification', () => {
  const w = world();
  hookPermission(w);
  assertRefused(type(w, 'a3 tak'), 'a3 to uprawnienia: wpisz `! ok a3` albo `! nie a3`');
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB typed: text on a permission whose hook is gone, and on an item with nothing behind it, says to answer there', () => {
  const dead = world();
  const record = hookPermission(dead);
  writePending(dead.root, { ...record, pid: 999999 });
  assertRefused(type(dead, 'a3 tak'), ANSWER_THERE);

  const bare = world();
  bareWait(bare);
  assert.equal(itemOf(bare, 'a3').answerable, false);
  assertRefused(type(bare, 'a3 tak'), ANSWER_THERE);

  const ask = world();
  bareWait(ask, { ask: true });
  assert.equal(itemOf(ask, 'a3').kind, 'decision');
  assertRefused(type(ask, 'a3 tak'), ANSWER_THERE);
  assert.deepEqual(records(ask), []);
  // What it shows and what `ok` says tell the same story.
  const shown = type(ask, 'a3');
  assert.deepEqual(shown.text.split('\n').slice(1), [`Odpowiedz w sesji ${TITLE}. \`dalej\` pomija.`]);
  const ok = spawnSync(process.execPath, [fileURLToPath(new URL('../bin/hub-cmd.mjs', import.meta.url)), 'ok', 'a3'], { encoding: 'utf8', env: ask.env });
  assert.deepEqual([ok.status, ok.stdout.trim()], [3, ANSWER_THERE]);
});

test('HUB typed: a failing pre-send check: the literal message, no send, the claim given back, the prompt stays used', () => {
  const w = world();
  waitingGate(w);
  const empty = join(w.root, 'agents-empty.json');
  writeFileSync(empty, '[]');
  assertRefused(type(w, 'a3 B', { agents: empty }), `target ${S1} is not alive`);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  const [record] = records(w);
  assert.equal(record.state, 'not-sent');
  assert.equal(record.sentFile, undefined);
  assert.equal(w.hub('prepare', record.id, '--agents-json', w.agents).status, 3);
  // A retry needs Rafal to type it again.
  assertRefused(runTyped(w, 'a3 B'), MISMATCH);
  assert.equal(type(w, 'a3 B').action, 'send');
});

test('HUB typed: the confirm flags do not reach the checks: a busy session refuses a typed answer', () => {
  const w = world();
  waitingGate(w);
  const busy = join(w.root, 'agents-busy.json');
  writeFileSync(busy, JSON.stringify([pollEntryOf(S1, 'probe-a', 'busy')]));
  hubPrompt(w, 'a3 B');
  const result = spawnSync(process.execPath, [HUB, 'typed', '--prompt-file', '-', '--confirm-busy', '--agents-json', busy], { encoding: 'utf8', env: w.env, input: 'a3 B\n' });
  assertRefused(JSON.parse(result.stdout), 'the session is busy (busy)');
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB typed: anything thrown after the claim gives it back too, and every outcome stays one JSON object', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'a3 B', { agents: join(w.root, 'missing.json') });
  assert.equal(out.action, 'refused');
  assert.match(out.message, /ENOENT/);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(records(w)[0].state, 'not-sent');

  const unreadable = w.hub('typed', '--prompt-file', join(w.root, 'missing.txt'));
  assert.equal(unreadable.status, 0);
  assert.equal(JSON.parse(unreadable.stdout).action, 'refused');
});

test('takeTyped: one event is taken once, whatever it asks for; the last 50 are kept', () => {
  const w = world();
  waitingGate(w);
  const show = { kind: 'show', code: 'a3' };
  const event = (eventId) => ({ eventId, at: Date.now() });
  assert.equal(takeTyped(w.root, show, event('e1')).action, 'show');
  assertRefused(takeTyped(w.root, show, event('e1')), MISMATCH);
  for (let n = 2; n <= 60; n += 1) takeTyped(w.root, show, event(`e${n}`));
  const used = readQueue(w.root).usedPromptEvents;
  assert.equal(used.length, 50);
  assert.equal(used.at(-1), 'e60');
  assert.equal(used[0], 'e11');
});

// --- HUB typed: show, dawaj, dalej

test('HUB typed: a3 shows the item with renderItem\'s text; an old code says it no longer waits', () => {
  const w = world();
  waitingGate(w);
  const item = itemOf(w, 'a3');
  assert.deepEqual(type(w, 'a3'), { action: 'show', text: renderItem(item, loadItemContext(w.root, item)) });
  assert.match(type(w, 'A3').text, /\[A\] tak\n\[B\] nie\n⏸ Czeka na decyzję: A czy B\?/);
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'B' });
  assertRefused(type(w, 'a3'), CLOSED);
});

test('HUB typed: dawaj means the item announced last, and sets dawajAt on it only', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2);
  list(w);
  const [first, second] = [itemOf(w, 'a3'), itemOf(w, 'a4')];
  announce(w, second.code);
  assert.deepEqual(type(w, 'dawaj'), { action: 'voice', code: 'a4', sessionId: second.sessionId });
  assert.equal(typeof itemOf(w, 'a4').dawajAt, 'number');
  assert.equal(itemOf(w, 'a3').dawajAt, null);
  assert.deepEqual(type(w, 'Dawaj A3'), { action: 'voice', code: 'a3', sessionId: first.sessionId });
  assert.equal(typeof itemOf(w, 'a3').dawajAt, 'number');
  assert.deepEqual(records(w), []);
});

test('HUB typed: dawaj on a permission shows the ready commands; on an item with nothing behind it, says to answer there', () => {
  const w = world();
  hookPermission(w);
  announce(w, 'a3');
  const out = type(w, 'dawaj');
  assert.equal(out.action, 'show');
  assert.match(out.text, /Bash: git status/);
  assert.match(out.text, /`! ok a3` zatwierdza, `! nie a3` odmawia, `dalej` pomija$/);
  assert.equal(itemOf(w, 'a3').dawajAt, null);

  const bare = world();
  bareWait(bare);
  announce(bare, 'a3');
  assertRefused(type(bare, 'dawaj'), ANSWER_THERE);
  assert.equal(itemOf(bare, 'a3').dawajAt, null);
});

test('HUB typed: dawaj with nothing announced, and when a3 no longer waits, opens no other item', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2);
  list(w);
  assertRefused(type(w, 'dawaj'), NOTHING_ANNOUNCED);
  announce(w, 'a3');
  // The wait ended in the session: the item is still in the queue until the next reconcile.
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: itemOf(w, 'a3').sessionId, prompt: 'B' });
  assertRefused(type(w, 'dawaj'), LAST_GONE);
  assert.equal(itemOf(w, 'a3').dawajAt, null);
  assert.equal(itemOf(w, 'a4').dawajAt, null);
  // After the reconcile only the closed code is left.
  list(w);
  assert.equal(itemOf(w, 'a3'), null);
  assertRefused(type(w, 'dawaj'), LAST_GONE);
  assertRefused(type(w, 'dawaj a3'), CLOSED);
  assert.equal(itemOf(w, 'a4').dawajAt, null);
});

test('HUB typed: dalej skips the item announced last; a3 B still sends while its wait lasts', () => {
  const w = world();
  waitingGate(w);
  assertRefused(type(w, 'dalej'), NOTHING_ANNOUNCED);
  announce(w, 'a3');
  assert.deepEqual(type(w, 'dalej'), { action: 'skipped', message: `a3 pominięte: ${TITLE}. Zostaje w przeglądzie.` });
  const skippedAt = itemOf(w, 'a3').skippedAt;
  assert.equal(typeof skippedAt, 'number');
  assert.deepEqual(records(w), []);
  // Skipped, so it no longer is what `dalej` alone means.
  assertRefused(type(w, 'dalej'), LAST_GONE);
  assertRefused(type(w, 'dawaj'), LAST_GONE);
  const out = type(w, 'a3 B');
  assert.equal(out.action, 'send');
  assert.equal(typeof itemOf(w, 'a3').answeredAt, 'number');
});

test('HUB typed: dalej a3 names the item, also one with nothing behind it or a permission; a wait that ended stays closed', () => {
  const bare = world();
  bareWait(bare);
  assert.equal(type(bare, 'dalej a3').action, 'skipped');
  assert.equal(typeof itemOf(bare, 'a3').skippedAt, 'number');

  const permission = world();
  hookPermission(permission);
  assert.equal(type(permission, 'dalej a3').action, 'skipped');

  const ended = world();
  waitingGate(ended);
  ended.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'B' });
  assertRefused(type(ended, 'dalej a3'), CLOSED);
  assert.equal(itemOf(ended, 'a3').skippedAt, null);
});

// --- HUB result

test('HUB result --error on a gate answer gives the claim back, so Rafal can type it again', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'a3 B');
  assert.equal(w.hub('result', out.id, '--error', 'No such agent').status, 0);
  assert.equal(records(w)[0].state, 'not-sent');
  const item = itemOf(w, 'a3');
  assert.equal(item.answeredAt, null);
  assert.equal(item.answerRecordId, null);
  assert.equal(type(w, 'a3 B').action, 'send');
});

test('HUB result --msg-id leaves the claim, and --error on a plain message touches no item', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'a3 B');
  assert.equal(w.hub('result', out.id, '--msg-id', '11111111-2222-3333-4444-555555555555').status, 0);
  assert.equal(typeof itemOf(w, 'a3').answeredAt, 'number');

  const other = world();
  waitingGate(other);
  const body = join(other.root, 'body.md');
  writeFileSync(body, FIVE);
  const draft = other.hub('compose', '--path', 'direct', '--session', S1, '--body-file', body).stdout.trim();
  const { id } = JSON.parse(other.hub('approve', '--session', S1, '--path', 'direct', '--text-file', draft).stdout);
  assert.equal(other.hub('prepare', id, '--agents-json', other.agents).status, 0);
  const before = readFileSync(queuePath(other.root), 'utf8');
  assert.equal(other.hub('result', id, '--error', 'boom').status, 0);
  assert.equal(readFileSync(queuePath(other.root), 'utf8'), before);
});

// --- HUB voice send

test('HUB voice send: without dawaj it is refused and nothing moves', () => {
  const w = world();
  waitingGate(w);
  const out = voiceSend(w, 'a3', dialogFile(w));
  assert.equal(out.action, 'refused');
  assert.match(out.message, /^a3: .*„dawaj”.*Nic nie wysłano\.$/);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB voice send: after dawaj, with the wait current: send on path dialog, origin voice/<dir name>', () => {
  const w = world();
  waitingGate(w);
  assert.equal(type(w, 'dawaj a3').action, 'voice');
  const out = voiceSend(w, 'A3', dialogFile(w));
  assert.equal(out.action, 'send');
  assert.equal(out.to, 'probe-a');
  assert.match(out.message, new RegExp(`^\\[hub · dialog · app · abcdef12 · [^\\]]* · voice/${DIALOG_DIR}\\]\\n\\n\\*\\*Cel\\*\\*`));
  assert.ok(out.message.endsWith('Pokaż wynik.\n'));
  const [record] = records(w);
  assert.deepEqual([record.id, record.state, record.path, record.textHash], [out.id, 'pending', 'dialog', sha256(out.message)]);
  const item = itemOf(w, 'a3');
  assert.equal(typeof item.answeredAt, 'number');
  assert.equal(item.answerRecordId, out.id);
  assertRefused(voiceSend(w, 'a3', dialogFile(w)), CLOSED);
  assert.equal(records(w).length, 1);
});

test('HUB voice send: the wait ended during the conversation, also with a newer gate there: nothing is sent', () => {
  const w = world();
  gate(w, S1, ago(300000));
  list(w);
  type(w, 'dawaj a3');
  gate(w, S1, ago(100000));
  assertRefused(voiceSend(w, 'a3', dialogFile(w)), CLOSED);
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assertRefused(voiceSend(w, 'a9', dialogFile(w)), 'a9: nie ma takiej pozycji');
});

test('HUB voice send: a file not named prompt.md, or outside the dialog root, or not in a dialog directory: refused', () => {
  const w = world();
  waitingGate(w);
  type(w, 'dawaj a3');
  const outside = join(tempRoot(), 'prompt.md');
  writeFileSync(outside, FIVE);
  const notDialog = join(w.talkRoot, 'prompt.md');
  writeFileSync(notDialog, FIVE);
  for (const file of [dialogFile(w, { name: 'decisions.md' }), outside, notDialog, join(w.talkRoot, 'missing', 'prompt.md'), '-']) {
    const out = voiceSend(w, 'a3', file);
    assert.equal(out.action, 'refused', file);
    assert.match(out.message, /Nic nie wysłano\.$/);
  }
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB voice send: a prompt without the five sections fails its check and gives the claim back; HUB result --error too', () => {
  const w = world();
  waitingGate(w);
  type(w, 'dawaj a3');
  const out = voiceSend(w, 'a3', dialogFile(w, { body: 'Zrób to.' }));
  assert.equal(out.action, 'refused');
  assert.match(out.message, /missing section Cel/);
  assert.equal(itemOf(w, 'a3').answeredAt, null);

  const sent = voiceSend(w, 'a3', dialogFile(w));
  assert.equal(sent.action, 'send');
  assert.equal(w.hub('result', sent.id, '--error', 'No such agent').status, 0);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(existsSync(sent.sentFile), true);
});

// --- fix round 1

const NOT_THIS_TALK = 'a3: ten prompt.md nie pochodzi z tej rozmowy. Nic nie wysłano.';
const NOT_THIS_TALK_A4 = 'a4: ten prompt.md nie pochodzi z tej rozmowy. Nic nie wysłano.';
const projectFolderOf = (cwd) => resolve(cwd).replace(/[^A-Za-z0-9]/g, '-').toLowerCase();

test('parseTyped: a code with a leading zero is no code', () => {
  for (const text of ['a03 B', 'a03', 'A03 tak', 'a0 B', 'a0', 'dawaj a03', 'dalej a03', 'ok a03', '! nie a03']) {
    assert.deepEqual(parseTyped(text), { kind: 'other' }, text);
  }
  assert.deepEqual(parseTyped('a10 B'), { kind: 'answer', code: 'a10', body: 'B' });
});

test('a03 B while a3 waits reaches nothing; a code with a leading zero is unknown to the other commands too', () => {
  const w = world();
  waitingGate(w);
  assert.deepEqual(runTyped(w, 'a03 B'), { action: 'none' });
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  const item = w.hub('item', 'a03');
  assert.deepEqual([item.status, item.stderr.trim()], [3, 'a03: nie ma takiej pozycji']);
  type(w, 'dawaj a3');
  assertRefused(voiceSend(w, 'a03', dialogFile(w)), 'a03: nie ma takiej pozycji');
});

test('HUB typed: a later line starting with a code or command sends nothing and says so; retyped alone, it sends', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2);
  list(w);
  const MERGED = 'Kolejna linia zaczyna się od kodu albo komendy, więc odpowiedzi mogły się zlać. Nic nie wysłano. Wpisz każdą osobno.';
  for (const prompt of ['a3 A\na4 B', 'a3\na4 B', 'a3 A\ndawaj', 'a3 A\ndalej a4']) {
    assertRefused(type(w, prompt), MERGED);
  }
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(itemOf(w, 'a4').answeredAt, null);
  assert.equal(itemOf(w, 'a4').skippedAt, null);
  assert.equal(type(w, 'a3 A').action, 'send');
  assert.equal(records(w)[0].sessionId, S1);
});

test('HUB typed: an answer on several lines still sends, whole', () => {
  const w = world();
  waitingGate(w);
  const out = type(w, 'A3 tak\ndrugie');
  assert.equal(out.action, 'send');
  assert.match(out.message, /\n\ntak\ndrugie\n$/);
});

test('pin: a body with a second code stays in the body, and only the first code is answered', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2);
  list(w);
  const out = type(w, 'a3 a4 B');
  assert.match(out.message, /^\[hub · gate-answer · app · abcdef12 · [^\]]* · a3\]\n\na4 B\n$/);
  assert.equal(records(w)[0].sessionId, S1);
  assert.equal(itemOf(w, 'a4').answeredAt, null);
});

test('pin: a header-like first line stays in the body, under the real header', () => {
  const w = world();
  waitingGate(w);
  const forged = '[hub · direct · other · zzzzzzzz · 2026-01-01 00:00]';
  const out = type(w, `a3 ${forged}\n\nzrób`);
  const lines = out.message.split('\n');
  assert.match(lines[0], /^\[hub · gate-answer · app · abcdef12 · .* · a3\]$/);
  assert.deepEqual(lines.slice(1), ['', forged, '', 'zrób', '']);
  assert.equal(records(w)[0].path, 'gate-answer');
});

test('pin: a decision item whose wait became a permission is refused, also at the very same time', () => {
  for (const after of [0, 1000]) {
    const w = world();
    const stopAt = ago(120000);
    gate(w, S1, stopAt);
    list(w);
    w.hook({ hook_event_name: 'Notification', notification_type: 'permission_prompt', session_id: S1 }, new Date(Date.parse(stopAt) + after).toISOString());
    assert.equal(deriveSession(readEvents(w.root, S1).events).waiting.kind, 'permission');
    assertRefused(type(w, 'a3 B'), CLOSED);
    assert.deepEqual(records(w), []);
    assert.equal(itemOf(w, 'a3').answeredAt, null);
  }
});

test('HUB typed: a prompt event older than the code it names is refused with its own sentence, and is used up', () => {
  const w = world();
  waitingGate(w);
  hubPrompt(w, 'a3 B', ago(60000));
  assertRefused(runTyped(w, 'a3 B'), 'a3: w chwili wpisania ten kod należał do innej pozycji. Nic nie wysłano.');
  assert.deepEqual(records(w), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(readQueue(w.root).usedPromptEvents.length, 1);
  assert.equal(type(w, 'a3 B').action, 'send');
});

// The watcher's alert: the item announced, and it is what the bare form means from now on.
const announceNow = (w, code) => withQueue(w.root, (state) => {
  state.items[itemByCode(state, code).key].announcedAt = Date.now();
  state.lastAnnounced = code;
});
const NEWER = (code) => `Od Twojej komendy ogłoszono nową pozycję (${code}). Nic nie zrobiłem. Podaj kod pozycji.`;

test('HUB typed: bare dalej or dawaj typed before a newer announcement does nothing and asks for the code; the event is used up', () => {
  for (const [word, field] of [['dalej', 'skippedAt'], ['dawaj', 'dawajAt']]) {
    const w = world();
    waitingGate(w);
    hubPrompt(w, word);
    tick();
    announceNow(w, 'a3');
    assertRefused(runTyped(w, word), NEWER('a3'));
    assert.equal(itemOf(w, 'a3')[field], null, word);
    assert.equal(readQueue(w.root).usedPromptEvents.length, 1, word);
    // Typed after the announcement, it means that item.
    assert.notEqual(type(w, word).action, 'refused', word);
    assert.equal(typeof itemOf(w, 'a3')[field], 'number', word);
  }
});

test('HUB typed: an item coded and announced after the bare form was typed gets the same sentence, and a named form typed before the announcement still works', () => {
  const w = world();
  hubPrompt(w, 'dalej');
  tick();
  waitingGate(w);
  announceNow(w, 'a3');
  assertRefused(runTyped(w, 'dalej'), NEWER('a3'));
  assert.equal(itemOf(w, 'a3').skippedAt, null);

  hubPrompt(w, 'dalej a3');
  tick();
  announceNow(w, 'a3');
  assert.equal(runTyped(w, 'dalej a3').action, 'skipped');
});

test('compose and approve refuse the path gate-answer: only HUB typed makes such a record', () => {
  const w = world();
  waitingGate(w);
  const body = join(w.root, 'body.md');
  writeFileSync(body, 'B');
  const composed = w.hub('compose', '--path', 'gate-answer', '--session', S1, '--body-file', body, '--origin', 'a3');
  assert.equal(composed.status, 3);
  assert.equal(composed.stdout, '');
  assert.match(composed.stderr, /HUB typed/);
  const text = join(w.root, 'text.md');
  writeFileSync(text, '[hub · gate-answer · app · abcdef12 · 2026-11-06 10:00 · a3]\n\nB\n');
  const approved = w.hub('approve', '--session', S1, '--path', 'gate-answer', '--text-file', text);
  assert.equal(approved.status, 3);
  assert.equal(approved.stdout, '');
  assert.match(approved.stderr, /HUB typed/);
  assert.deepEqual(records(w), []);
});

test('HUB prepare keeps a record saved while its poll ran', WINDOWS_ONLY, async (t) => {
  const w = world();
  waitingGate(w);
  const body = join(w.root, 'body.md');
  writeFileSync(body, FIVE);
  const draft = w.hub('compose', '--path', 'direct', '--session', S1, '--body-file', body).stdout.trim();
  const { id } = JSON.parse(w.hub('approve', '--session', S1, '--path', 'direct', '--text-file', draft).stdout);
  const during = { id: 'r-during-poll', project: 'app', path: 'direct', sessionId: S1, state: 'not-sent', textHash: 'x', approvedAt: new Date().toISOString(), baseline: {} };
  const agents = await pollPipe(t, () => {
    saveRecords(w.root, 'app', [...records(w), during]);
    return [pollEntryOf(S1, 'probe-a')];
  });
  const code = await new Promise((done) => {
    spawn(process.execPath, [HUB, 'prepare', id, '--agents-json', agents], { env: w.env, windowsHide: true, stdio: 'ignore' }).on('close', done);
  });
  assert.equal(code, 0);
  assert.deepEqual(records(w).map((r) => [r.id, r.state]), [[id, 'pending'], ['r-during-poll', 'not-sent']]);
});

test('releaseClaim outlasts a lock held longer than one wait for it', async () => {
  const w = world();
  waitingGate(w);
  withQueue(w.root, (state) => { itemByCode(state, 'a3').answeredAt = Date.now(); });
  const lock = queueLockPath(w.root);
  writeFileSync(lock, '');
  const holder = spawn(process.execPath, ['-e', "setTimeout(() => require('node:fs').unlinkSync(process.argv[1]), 2600)", lock], { windowsHide: true });
  const closed = new Promise((done) => { holder.on('close', done); });
  assert.equal(releaseClaim(w.root, itemOf(w, 'a3')), null);
  await closed;
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB typed: a lock busy through the whole give-back: one more line says the item stays hidden, still one JSON object', WINDOWS_ONLY, async (t) => {
  const w = world();
  waitingGate(w);
  hubPrompt(w, 'a3 B');
  const lock = queueLockPath(w.root);
  let keeper = null;
  const touch = () => {
    try {
      utimesSync(lock, new Date(), new Date());
    } catch {
      // the lock's reader had it open: the next tick touches it
    }
  };
  // The claim is taken by now; the poll lists nobody, so the check fails and the claim must go back.
  const agents = await pollPipe(t, () => {
    writeFileSync(lock, '');
    keeper = setInterval(touch, 500);
    return [];
  });
  t.after(() => clearInterval(keeper));
  const out = await startTyped(w, 'a3 B', agents);
  clearInterval(keeper);
  rmSync(lock, { force: true });
  assert.equal(out.action, 'refused');
  const lines = out.message.split('\n');
  assert.equal(lines.length, 2);
  assert.equal(lines[0], `target ${S1} is not alive`);
  assert.match(lines[1], new RegExp(`^a3: nie udało się zwolnić pozycji \\(queue lock busy: .*\\), więc nie wróci do kolejki\\. Odpowiedz w sesji ${TITLE}\\.$`));
  assert.equal(records(w)[0].state, 'not-sent');
});

test('a3 and HUB item a3 on a permission whose hook is gone offer no approval', () => {
  const w = world();
  const record = hookPermission(w);
  writePending(w.root, { ...record, pid: 999999 });
  const out = type(w, 'a3');
  assert.equal(out.action, 'show');
  assert.equal(out.text.split('\n').at(-1), `Odpowiedz w sesji ${TITLE}. \`dalej\` pomija.`);
  assert.ok(!out.text.includes('! ok'));
  const item = w.hub('item', 'a3');
  assert.equal(item.stdout.trim().split('\n').at(-1), `Odpowiedz w sesji ${TITLE}. \`dalej\` pomija.`);
  assert.ok(!item.stdout.includes('! ok'));
});

test('HUB item a3 shows a skipped item, as typed a3 does; the bare HUB item keeps its rule', () => {
  const w = world();
  waitingGate(w);
  announce(w, 'a3');
  assert.equal(type(w, 'dalej a3').action, 'skipped');
  const named = w.hub('item', 'a3');
  assert.equal(named.status, 0, named.stderr);
  assert.match(named.stdout, /^a3 · Migracja/);
  assert.equal(type(w, 'a3').action, 'show');
  const bare = w.hub('item');
  assert.deepEqual([bare.status, bare.stderr.trim()], [3, LAST_GONE]);
  w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'B' });
  list(w);
  const gone = w.hub('item', 'a3');
  assert.deepEqual([gone.status, gone.stderr.trim()], [3, CLOSED]);
});

test('HUB notice moving a gate answer or a voice order to not-sent gives the claim back; held keeps it', () => {
  const MSG = '4b8b0732-2830-4c04-8f38-ca22dfe06e59';
  const held = `Your message to another session was held by that session (recipient: x; msg_id: ${MSG}). NOT delivered: its Claude has not seen it.`;
  const refusedNotice = `Your message to another session was refused (recipient: x; msg_id: ${MSG}): not accepting`;
  const w = world();
  waitingGate(w);
  const out = type(w, 'a3 B');
  assert.equal(w.hub('result', out.id, '--msg-id', MSG).status, 0);
  assert.equal(JSON.parse(w.hub('notice', '--text', held).stdout).state, 'held');
  assert.equal(typeof itemOf(w, 'a3').answeredAt, 'number');
  assert.equal(JSON.parse(w.hub('notice', '--text', refusedNotice).stdout).state, 'not-sent');
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  assert.equal(itemOf(w, 'a3').answerRecordId, null);
  assert.equal(type(w, 'a3 B').action, 'send');

  const voice = world();
  waitingGate(voice);
  type(voice, 'dawaj a3');
  const sent = voiceSend(voice, 'a3', dialogFile(voice));
  assert.equal(voice.hub('result', sent.id, '--msg-id', MSG).status, 0);
  assert.equal(JSON.parse(voice.hub('notice', '--text', refusedNotice).stdout).state, 'not-sent');
  assert.equal(itemOf(voice, 'a3').answeredAt, null);
});

test('HUB voice send: an order under another project is refused', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2, ago(110000), otherRepo);
  list(w);
  assert.equal(itemOf(w, 'a4').sessionId, S2);
  // a3 is the newest dawaj, so only the project tells the order is not its own.
  type(w, 'dawaj a4');
  type(w, 'dawaj a3');
  assertRefused(voiceSend(w, 'a3', dialogFile(w, { project: 'other' })), NOT_THIS_TALK);
  assert.deepEqual(records(w), []);
  assert.deepEqual(loadRecords(w.root, 'other'), []);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
});

test('HUB voice send: dawaj a3 with no order, dawaj a4 with one, and the model naming a3: refused; a4 sends', () => {
  const w = world();
  gate(w, S1);
  gate(w, S2, ago(110000), otherRepo);
  list(w);
  type(w, 'dawaj a3');
  type(w, 'dawaj a4');
  const file = dialogFile(w, { project: 'other' });
  assertRefused(voiceSend(w, 'a3', file), NOT_THIS_TALK);
  assert.equal(itemOf(w, 'a3').answeredAt, null);
  const out = voiceSend(w, 'a4', file);
  assert.equal(out.action, 'send');
  assert.equal(loadRecords(w.root, 'other')[0].sessionId, S2);
});

test('HUB voice send: a prompt.md older than the dawaj is refused', () => {
  const w = world();
  waitingGate(w);
  type(w, 'dawaj a3');
  const file = dialogFile(w);
  const before = new Date(itemOf(w, 'a3').dawajAt - 60000);
  utimesSync(file, before, before);
  assertRefused(voiceSend(w, 'a3', file), NOT_THIS_TALK);
  assert.deepEqual(records(w), []);
  assert.equal(voiceSend(w, 'a3', dialogFile(w)).action, 'send');
});

test('HUB voice send: an order belongs to the newest dawaj before it, also in one project', () => {
  const after = world();
  gate(after, S1);
  gate(after, S2);
  list(after);
  type(after, 'dawaj a3');
  type(after, 'dawaj a4');
  const file = dialogFile(after);
  assertRefused(voiceSend(after, 'a3', file), NOT_THIS_TALK);
  assert.equal(voiceSend(after, 'a4', file).action, 'send');

  // The later dawaj came after the order was written, so the order is still a3's; a4 has none of its own.
  const before = world();
  gate(before, S1);
  gate(before, S2);
  list(before);
  type(before, 'dawaj a3');
  const written = dialogFile(before);
  type(before, 'dawaj a4');
  assertRefused(voiceSend(before, 'a4', written), NOT_THIS_TALK_A4);
  assert.equal(voiceSend(before, 'a3', written).action, 'send');
});

test('HUB voice send: the project folder is the key as talk normalises it, in any letter case', () => {
  const hidden = makeRepo('.my app');
  const w = world();
  writeFileSync(w.agents, JSON.stringify([pollEntryOf(S1, 'probe-a')]));
  gate(w, S1, ago(120000), hidden);
  list(w);
  type(w, 'dawaj a3');
  assertRefused(voiceSend(w, 'a3', dialogFile(w, { project: '.my-app' })), NOT_THIS_TALK);
  assert.equal(voiceSend(w, 'a3', dialogFile(w, { project: 'my-app' })).action, 'send');

  const cased = world();
  waitingGate(cased);
  type(cased, 'dawaj a3');
  assert.equal(voiceSend(cased, 'a3', dialogFile(cased, { project: 'APP' })).action, 'send');
});

test('HUB voice send: a session that moved by cd keeps the project its transcript, and so talk, files it under', () => {
  const transcript = join(tempRoot(), 'projects', projectFolderOf(repo), `${S1}.jsonl`);
  const seed = () => {
    const w = world();
    const stopAt = ago(120000);
    w.hook({ hook_event_name: 'UserPromptSubmit', session_id: S1, prompt: 'pracuj', session_title: TITLE, transcript_path: transcript }, ago(130000));
    w.hook({ hook_event_name: 'Stop', session_id: S1, cwd: otherRepo, last_assistant_message: GATE }, stopAt);
    list(w);
    type(w, 'dawaj a3');
    return w;
  };
  const moved = seed();
  assert.equal(deriveSession(readEvents(moved.root, S1).events).cwd, otherRepo);
  assertRefused(voiceSend(moved, 'a3', dialogFile(moved, { project: 'other' })), NOT_THIS_TALK);
  const again = seed();
  assert.equal(voiceSend(again, 'a3', dialogFile(again, { project: 'app' })).action, 'send');
});
