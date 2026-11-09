import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync, utimesSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { markDue, announce, createAlerts } from '../lib/alerts.mjs';
import { snapshot } from '../lib/watch.mjs';
import { sentence, speakCommand, speak } from '../lib/speech.mjs';
import { anyLiveVoice, dialogRootOf } from '../lib/voicelive.mjs';
import { emptyQueue, reconcile, readQueue, withQueue, openItems } from '../lib/queue.mjs';
import { writePending } from '../lib/pending.mjs';
import { registerLaunched } from '../lib/hubsessions.mjs';
import { queuePath, queueLockPath, heartbeatPath } from '../lib/paths.mjs';

const WATCH = fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url));
const CMD = fileURLToPath(new URL('../bin/hub-cmd.mjs', import.meta.url));
const FAKE = fileURLToPath(new URL('../fakes/speak.mjs', import.meta.url));
const SPEAK_PS1 = fileURLToPath(new URL('../bin/speak.ps1', import.meta.url));
const SEC = 1000;
const MIN = 60 * SEC;

// A hub data root with its own talk root and speech log: no test speaks aloud or reads real data.
function setup() {
  const root = tempRoot();
  const talk = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'speak.log');
  const env = {
    ...process.env, HUB_DATA: root, HUB_TALK_ROOT: talk, HUB_SPEAK_LOG: log, HUB_SPEAK_CMD: JSON.stringify([process.execPath, FAKE]),
  };
  delete env.HUB_SPEAK_FAIL;
  delete env.HUB_SPEAK_MS;
  return { root, talk, log, env };
}

const iso = (offsetMs) => new Date(Date.now() + offsetMs).toISOString();
const add = (root, sessionId, event) => appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), `${JSON.stringify(event)}\n`);

// A session that has been waiting for a decision for `ageMs`.
function gate(root, sessionId, { title = 'Migracja', ageMs = 70 * SEC, marker = 'Które API?' } = {}) {
  add(root, sessionId, ev('UserPromptSubmit', iso(-ageMs - 1000), { sessionId, promptId: 'q1', sessionTitle: title }));
  add(root, sessionId, ev('Stop', iso(-ageMs), { sessionId, promptId: 'q1', marker }));
}

function working(root, sessionId, title = 'Migracja') {
  add(root, sessionId, ev('UserPromptSubmit', iso(-120 * SEC), { sessionId, promptId: 'q1', sessionTitle: title }));
}

function run(env, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [WATCH, '--once', '--no-poll', ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

const spoken = (log) => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)) : []);
const announces = (stdout) => stdout.split('\n').filter((line) => line.startsWith('announce:'));

// The queue is seeded by a first run with nothing waiting.
async function seeded() {
  const ctx = setup();
  const first = await run(ctx.env);
  assert.equal(first.stdout, '');
  return ctx;
}

test('the first run ever seeds the queue without speaking; a gate after it speaks once', async () => {
  const { root, log, env } = setup();
  gate(root, 'w1');
  const first = await run(env);
  assert.equal(first.status, 0);
  assert.deepEqual(announces(first.stdout), []);
  assert.deepEqual(spoken(log), []);

  gate(root, 'w2', { title: 'Druga' });
  const second = await run(env);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Druga. Decyzja do podjęcia.']);
  assert.equal(announces(second.stdout).length, 1);
  assert.equal(announces((await run(env)).stdout).length, 0);
  assert.equal(spoken(log).length, 1);
});

test('a gate 70 s old after seeding is spoken and announced once', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1');
  const out = await run(env);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Migracja. Decyzja do podjęcia.']);
  assert.match(out.stdout, /^announce: a1 decision: \S+ w1 Migracja — Które API\?$/m);
  const again = await run(env);
  assert.equal(announces(again.stdout).length, 0);
  assert.equal(spoken(log).length, 1);
  const alerts = readFileSync(join(root, 'alerts.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(alerts.length, 1);
  assert.deepEqual({ ...alerts[0], at: 0, project: 0 }, { type: 'alert', at: 0, code: 'a1', key: alerts[0].key, sessionId: 'w1', project: 0, name: 'Migracja', kind: 'decision', mode: 'listening' });
});

test('a gate under 60 s, one answered by a prompt, and one older than 10 min after a gap stay silent', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'young', { ageMs: 30 * SEC });
  gate(root, 'answered', { title: 'Odpowiedziana' });
  add(root, 'answered', ev('UserPromptSubmit', iso(-10 * SEC), { sessionId: 'answered', promptId: 'q2' }));
  gate(root, 'old', { title: 'Stara', ageMs: 11 * MIN });
  const out = await run(env);
  assert.deepEqual(announces(out.stdout), []);
  assert.deepEqual(spoken(log), []);
  const state = readQueue(root);
  assert.deepEqual(openItems(state).map((item) => item.sessionId).sort(), ['old', 'young']);
  assert.equal(Object.values(state.items).find((item) => item.sessionId === 'old').silent, true);
  assert.equal(Object.values(state.items).find((item) => item.sessionId === 'young').silent, false);
});

test('a permission with a pending record is spoken as a permission', async () => {
  const { root, log, env } = await seeded();
  working(root, 'w1');
  writePending(root, { id: 'pd1', sessionId: 'w1', promptId: 'q1', tool: 'Bash', target: 'ls', pid: process.pid, startedAt: Date.now() - 70 * SEC });
  const out = await run(env);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Migracja. Uprawnienia do zaakceptowania.']);
  assert.match(out.stdout, /^announce: a1 permission: \S+ w1 Migracja$/m);
});

test('two due waits are spoken one after the other, the older first', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1', { title: 'Pierwsza', ageMs: 100 * SEC });
  gate(root, 'w2', { title: 'Druga', ageMs: 80 * SEC });
  const out = await run({ ...env, HUB_SPEAK_MS: '300' });
  const lines = spoken(log);
  assert.deepEqual(lines.map((s) => s.text), ['Pierwsza. Decyzja do podjęcia.', 'Druga. Decyzja do podjęcia.']);
  assert.ok(lines[0].end <= lines[1].start);
  assert.deepEqual(announces(out.stdout).map((line) => line.split(' ')[1]), ['a1', 'a2']);
});

test('a paused queue speaks nothing and prints no announce line', async () => {
  const { root, log, env } = await seeded();
  withQueue(root, (state) => { state.mode = 'paused'; state.pausedAt = Date.now(); });
  gate(root, 'w1');
  const out = await run(env);
  assert.deepEqual(announces(out.stdout), []);
  assert.deepEqual(spoken(log), []);
});

test('a walk speaks the older item, then the newer once the older is answered, then returns to listening', async () => {
  const { root, log, env } = await seeded();
  withQueue(root, (state) => { state.mode = 'walking'; });
  gate(root, 'w1', { title: 'Starsza', ageMs: 200 * SEC });
  gate(root, 'w2', { title: 'Nowsza', ageMs: 100 * SEC });
  const first = await run(env);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Starsza. Decyzja do podjęcia.']);
  assert.equal(announces(first.stdout).length, 1);
  assert.equal(readQueue(root).walkCurrent.startsWith('w1|'), true);

  assert.equal(announces((await run(env)).stdout).length, 0);
  assert.equal(spoken(log).length, 1);

  withQueue(root, (state) => { Object.values(state.items).find((item) => item.sessionId === 'w1').answeredAt = Date.now(); });
  await run(env);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Starsza. Decyzja do podjęcia.', 'Nowsza. Decyzja do podjęcia.']);

  withQueue(root, (state) => { Object.values(state.items).find((item) => item.sessionId === 'w2').answeredAt = Date.now(); });
  await run(env);
  assert.equal(spoken(log).length, 2);
  const state = readQueue(root);
  assert.equal(state.mode, 'listening');
  assert.equal(state.walkCurrent, null);
});

test('a pause in a walk, then wracam: the current item is announced again, once', async () => {
  const { root, log, env } = await seeded();
  const typed = (command) => spawnSync(process.execPath, [CMD, command], { encoding: 'utf8', env }).stdout.trim();
  withQueue(root, (state) => { state.mode = 'walking'; });
  gate(root, 'w1', { title: 'Starsza', ageMs: 200 * SEC });
  gate(root, 'w2', { title: 'Nowsza', ageMs: 100 * SEC });
  assert.equal(announces((await run(env)).stdout).length, 1);
  assert.match(typed('pauza'), /^Pauza od /);
  assert.deepEqual(announces((await run(env)).stdout), []);

  assert.equal(typed('wracam'), 'Wracamy: czeka 2. Najstarsza idzie pierwsza.');
  assert.equal(readQueue(root).walkCurrent, null);
  assert.deepEqual(announces((await run(env)).stdout).map((line) => line.split(' ')[1]), ['a1']);
  assert.deepEqual(spoken(log).map((s) => s.text), ['Starsza. Decyzja do podjęcia.', 'Starsza. Decyzja do podjęcia.']);
  assert.deepEqual(announces((await run(env)).stdout), []);
  const state = readQueue(root);
  assert.equal(state.mode, 'walking');
  assert.equal(state.walkCurrent.startsWith('w1|'), true);
});

test('a watcher starting on a walk: another owner speaks the current item once, the same owner or none stays silent', async () => {
  const root = tempRoot();
  const env = { HUB_TALK_ROOT: tempRoot() };
  const said = [];
  const lines = [];
  const source = { current: { rows: [], rowsAt: 1 } };
  const watcher = (owner) => createAlerts({
    root, env, owner, print: (line) => lines.push(line), speakFn: async (text) => { said.push(text); }, rows: () => source.current,
  });
  const round = async (alerts) => {
    await alerts.pass();
    await alerts.drain();
  };
  const tabA = watcher(100);
  await round(tabA);
  source.current = { rows: [rowOf('w1', 100 * SEC, { name: 'Pierwsza' }), rowOf('w2', 80 * SEC, { name: 'Druga' })], rowsAt: 2 };
  withQueue(root, (state) => { state.mode = 'walking'; });
  await round(tabA);
  const first = 'Pierwsza. Decyzja do podjęcia.';
  assert.deepEqual(said, [first]);
  assert.deepEqual(readQueue(root).walkSeen.owners, [100]);

  // The Monitor re-arms the watcher of the same tab every 30 min.
  const rearmed = watcher(100);
  await round(rearmed);
  await round(rearmed);
  assert.deepEqual(said, [first]);
  // A --once tick or a watcher with no claude ancestor says nothing about the tab.
  await round(watcher(null));
  assert.deepEqual(said, [first]);

  // A new hub tab.
  const tabB = watcher(200);
  await round(tabB);
  assert.deepEqual(said, [first, first]);
  assert.deepEqual(readQueue(root).walkSeen.owners, [100, 200]);
  await round(tabB);
  await round(tabA);
  assert.deepEqual(said, [first, first]);
  await round(watcher(200));
  assert.deepEqual(said, [first, first]);
  // Two live tabs re-arming in turns do not repeat it.
  await round(watcher(100));
  await round(watcher(200));
  await round(watcher(100));
  assert.deepEqual(said, [first, first]);
  assert.equal(lines.filter((line) => line.startsWith('announce: a1 decision')).length, 2);

  // The next item speaks once, and only the current one was repeated.
  withQueue(root, (state) => { Object.values(state.items).find((item) => item.sessionId === 'w1').answeredAt = NOW; });
  await round(tabB);
  await round(tabA);
  assert.deepEqual(said, [first, first, 'Druga. Decyzja do podjęcia.']);
});

test('a watcher starting while listening or paused changes no walk', async () => {
  const root = tempRoot();
  const source = { current: { rows: [], rowsAt: 1 } };
  const alerts = () => createAlerts({ root, env: { HUB_TALK_ROOT: tempRoot() }, owner: 300, print: () => {}, speakFn: async () => {}, rows: () => source.current });
  for (const mode of ['listening', 'paused']) {
    withQueue(root, (state) => { state.mode = mode; state.walkCurrent = 'left|1'; state.walkSeen = { key: 'left|1', owners: [100] }; state.seededAt = 1; });
    await alerts().pass();
    assert.equal(readQueue(root).walkCurrent, 'left|1', mode);
  }
});

test('the running watcher takes its owner from --owner-pid: a new owner announces the current item, a re-arm with the same owner does not', async (t) => {
  const { root, log, env } = await seeded();
  withQueue(root, (state) => { state.mode = 'walking'; });
  gate(root, 'w1', { title: 'Starsza', ageMs: 200 * SEC });
  assert.equal(announces((await run(env)).stdout).length, 1);
  withQueue(root, (state) => { state.walkSeen = { key: state.walkCurrent, owners: [1] }; });
  const start = (owner) => {
    const child = spawn(process.execPath, [WATCH, '--no-poll', `--owner-pid=${owner}`, '--alert-check-ms=100'], { env, stdio: ['ignore', 'pipe', 'ignore'] });
    const watcher = { child, out: '' };
    child.stdout.on('data', (chunk) => { watcher.out += chunk; });
    const closed = new Promise((resolve) => child.on('close', resolve));
    watcher.stop = async () => { child.kill(); await closed; };
    t.after(watcher.stop);
    return watcher;
  };
  const until = async (probe) => {
    const deadline = Date.now() + 10000;
    while (!probe()) {
      if (Date.now() > deadline) throw new Error('timed out');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };

  const tab = start(process.pid);
  await until(() => announces(tab.out).length === 1);
  await until(() => spoken(log).length === 2);
  assert.deepEqual(readQueue(root).walkSeen.owners, [1, process.pid]);
  await tab.stop();

  // Its heartbeat, written every 100 ms, shows it has been through several passes.
  const armedAt = Date.now();
  const rearmed = start(process.pid);
  await until(() => statSync(heartbeatPath(root)).mtimeMs > armedAt + 800);
  assert.deepEqual(announces(rearmed.out), []);
  assert.equal(spoken(log).length, 2);
  await rearmed.stop();
});

function statusServer(body = { ending: false }) {
  const server = createServer((req, res) => {
    if (req.url.startsWith('/api/status')) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(body));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const closeServer = (server) => new Promise((resolve) => { server.close(resolve); server.closeAllConnections(); });

function bridgeFile(talk, port) {
  const dir = join(talk, 'projects', 'p1', 'dialogs', 'd1');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'bridge.json'), JSON.stringify({ sessionId: 'x', origin: 'o', url: `http://127.0.0.1:${port}/?t=1` }));
}

test('while a voice conversation is live nothing is spoken and the wait is held; once it ends the wait speaks, also past 10 min', async () => {
  const { root, talk, log, env } = await seeded();
  const server = await statusServer();
  try {
    bridgeFile(talk, server.address().port);
    gate(root, 'w1', { title: 'Trzymana', ageMs: 11 * MIN });
    gate(root, 'w2', { title: 'Druga', ageMs: 70 * SEC });
    const held = await run(env);
    assert.deepEqual(announces(held.stdout), []);
    assert.deepEqual(spoken(log), []);
    const items = Object.values(readQueue(root).items);
    assert.ok(items.every((item) => typeof item.heldAt === 'number'));
    assert.ok(items.every((item) => !item.silent));
  } finally {
    await closeServer(server);
  }
  const free = await run(env);
  assert.equal(announces(free.stdout).length, 2);
  assert.deepEqual(spoken(log).map((s) => s.text).sort(), ['Druga. Decyzja do podjęcia.', 'Trzymana. Decyzja do podjęcia.']);
});

test('a bridge that is ending does not hold the alert', async () => {
  const { root, talk, log, env } = await seeded();
  const server = await statusServer({ ending: true });
  try {
    bridgeFile(talk, server.address().port);
    gate(root, 'w1');
    await run(env);
    assert.equal(spoken(log).length, 1);
  } finally {
    await closeServer(server);
  }
});

test('Review Focus 1: a title with quotes, a newline, $(...) and Polish letters reaches speech only through stdin', async () => {
  const { root, log, env } = await seeded();
  const title = 'a"b $(x)\nć';
  gate(root, 'w1', { title });
  const out = await run(env);
  const [call] = spoken(log);
  assert.equal(call.text, `${title}. Decyzja do podjęcia.`);
  assert.deepEqual(call.argv, []);
  const lines = announces(out.stdout);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /^announce: a1 decision: \S+ w1 a"b \$\(x\) ć — /);
});

test('a failing speech prints one line, keeps the announce line, and the next alert is still spoken', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1', { title: 'Pierwsza' });
  const failed = await run({ ...env, HUB_SPEAK_FAIL: '1' });
  assert.equal(failed.status, 0);
  assert.equal(failed.stdout.match(/^speech failed: /gm).length, 1);
  assert.match(failed.stdout, /^speech failed: speech process exited 1: fake speech failure$/m);
  assert.equal(announces(failed.stdout).length, 1);

  gate(root, 'w2', { title: 'Druga' });
  const next = await run(env);
  assert.equal(announces(next.stdout).length, 1);
  assert.equal(spoken(log).at(-1).text, 'Druga. Decyzja do podjęcia.');
  assert.doesNotMatch(next.stdout, /speech failed/);
});

test('Review Focus 3: two watchers started together speak and announce a wait once', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1');
  const results = await Promise.all([run({ ...env, HUB_SPEAK_MS: '200' }), run({ ...env, HUB_SPEAK_MS: '200' })]);
  assert.equal(spoken(log).length, 1);
  assert.equal(results.flatMap((r) => announces(r.stdout)).length, 1);
});

test('Review Focus 4: a corrupt queue.json seeds again with one line and speaks nothing for waits already there', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1');
  writeFileSync(queuePath(root), '{ broken', 'utf8');
  const first = await run(env);
  assert.match(first.stdout, /^queue state unreadable; seeded again$/m);
  assert.equal(first.stdout.match(/unreadable/g).length, 1);
  assert.deepEqual(announces(first.stdout), []);
  assert.deepEqual(spoken(log), []);

  const second = await run(env);
  assert.equal(second.stdout, '');
  assert.deepEqual(spoken(log), []);
});

test('Review Focus 4: a lock left by a killed process is stolen and the alert still speaks', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1');
  writeFileSync(queueLockPath(root), '');
  const old = new Date(Date.now() - 20 * SEC);
  utimesSync(queueLockPath(root), old, old);
  const out = await run(env);
  assert.equal(announces(out.stdout).length, 1);
  assert.equal(spoken(log).length, 1);
});

test('a dialog fork at a gate is not spoken, and its waiting line stays', async () => {
  const { root, log, env } = await seeded();
  registerLaunched(root, { sessionId: 'dlg1', kind: 'dialog', name: 'rozmowa' });
  gate(root, 'dlg1', { title: 'rozmowa' });
  const out = await run(env);
  assert.match(out.stdout, /^waiting for decision: \S+ dlg1 rozmowa — Które API\?$/m);
  assert.deepEqual(announces(out.stdout), []);
  assert.deepEqual(spoken(log), []);
});

test('the heartbeat file is written on every tick', async () => {
  const { root, env } = setup();
  await run(env);
  const first = statSync(heartbeatPath(root)).mtimeMs;
  await new Promise((resolve) => setTimeout(resolve, 60));
  await run(env);
  assert.ok(statSync(heartbeatPath(root)).mtimeMs > first);
});

test('a running watcher keeps the heartbeat fresh between ticks and speaks a wait that falls due', async () => {
  const { root, log, env } = await seeded();
  working(root, 'w1');
  add(root, 'w1', ev('Stop', iso(-58 * SEC), { sessionId: 'w1', promptId: 'q1', marker: 'Które API?' }));
  const watcher = spawn(process.execPath, [WATCH, '--no-poll', '--interval-ms=600000', '--alert-check-ms=200'], { env: { ...env, HUB_PROCESS_TABLE: '[]' }, stdio: ['ignore', 'pipe', 'ignore'] });
  let out = '';
  watcher.stdout.on('data', (chunk) => { out += chunk; });
  try {
    const end = Date.now() + 15000;
    while (spoken(log).length === 0 && Date.now() < end) await new Promise((resolve) => setTimeout(resolve, 100));
    assert.deepEqual(spoken(log).map((s) => s.text), ['Migracja. Decyzja do podjęcia.']);
    assert.match(out, /^announce: a1 decision: /m);
    const beat = statSync(heartbeatPath(root)).mtimeMs;
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.ok(statSync(heartbeatPath(root)).mtimeMs > beat);
  } finally {
    const exited = new Promise((resolve) => watcher.on('close', resolve));
    watcher.kill();
    await exited;
  }
});

// --- markDue, announce, speech and voicelive on their own ---

const NOW = Date.parse('2026-11-06T12:00:00Z');
const wait = (fields) => ({
  key: 's1|1', sessionId: 's1', kind: 'decision', since: NOW - 70 * SEC, pendingId: null, answerable: true,
  askTool: null, name: 'Sesja', project: 'proj', shortId: 's1', detail: 'x', ...fields,
});
const queueOf = (waits, fields = {}) => {
  const state = { ...emptyQueue(), seededAt: NOW - 1000, ...fields };
  reconcile(state, waits, NOW);
  return state;
};

test('markDue seeds every wait silent in any mode and speaks nothing', () => {
  for (const mode of ['listening', 'paused', 'walking']) {
    const waits = [wait()];
    const state = { ...emptyQueue(), mode };
    reconcile(state, waits, NOW);
    assert.deepEqual(markDue(state, waits, NOW), []);
    assert.equal(state.seededAt, NOW);
    assert.equal(state.items['s1|1'].silent, true);
  }
});

test('markDue, listening: the rows of the rule', () => {
  const due = (mutate, options, ageMs = 70 * SEC) => {
    const w = [wait({ since: NOW - ageMs })];
    const state = queueOf(w);
    mutate?.(state.items['s1|1']);
    return { result: markDue(state, w, NOW, options), item: state.items['s1|1'] };
  };
  assert.equal(due().result.length, 1);
  assert.equal(due((i) => { i.announcedAt = 1; }).result.length, 0);
  assert.equal(due((i) => { i.silent = true; }).result.length, 0);
  assert.equal(due((i) => { i.answeredAt = 1; }).result.length, 0);
  assert.equal(due((i) => { i.skippedAt = 1; }).result.length, 0);
  assert.equal(due(null, {}, 59 * SEC).result.length, 0);
  assert.equal(due(null, {}, 60 * SEC).result.length, 1);
  const held = due(null, { voiceLive: true });
  assert.equal(held.result.length, 0);
  assert.equal(held.item.heldAt, NOW);
  const old = due(null, {}, 10 * MIN + 1);
  assert.equal(old.result.length, 0);
  assert.equal(old.item.silent, true);
  assert.equal(due((i) => { i.heldAt = NOW - 5000; }, {}, 11 * MIN).result.length, 1);
});

test('markDue, paused: nothing is due', () => {
  const waits = [wait()];
  assert.deepEqual(markDue(queueOf(waits, { mode: 'paused' }), waits, NOW), []);
});

test('markDue, walking: the oldest open item, nothing while the current one is open or a voice is live, listening when none is left', () => {
  const waits = [wait({ key: 'a|1', since: NOW - 200 * SEC }), wait({ key: 'b|1', sessionId: 'b', since: NOW - 100 * SEC })];
  const state = queueOf(waits, { mode: 'walking' });
  assert.deepEqual(markDue(state, waits, NOW, { voiceLive: true }), []);
  assert.deepEqual(markDue(state, waits, NOW).map((w) => w.key), ['a|1']);
  state.items['a|1'].announcedAt = 1;
  assert.deepEqual(markDue(state, waits, NOW).map((w) => w.key), ['a|1']);
  state.walkCurrent = 'a|1';
  assert.deepEqual(markDue(state, waits, NOW), []);
  state.items['a|1'].answeredAt = 1;
  assert.deepEqual(markDue(state, waits, NOW).map((w) => w.key), ['b|1']);
  state.walkCurrent = 'b|1';
  state.items['b|1'].skippedAt = 1;
  assert.deepEqual(markDue(state, waits, NOW), []);
  assert.equal(state.mode, 'listening');
  assert.equal(state.walkCurrent, null);
});

test('markDue, walking: an item younger than 60 s waits for its turn', () => {
  const waits = [wait({ since: NOW - 30 * SEC })];
  assert.deepEqual(markDue(queueOf(waits, { mode: 'walking' }), waits, NOW), []);
});

test('a successor item after a hub allow is not spoken again in listening', () => {
  const first = wait({ key: 's1|p:pd1', kind: 'permission', pendingId: 'pd1' });
  const state = queueOf([first]);
  Object.assign(state.items[first.key], { code: 'a1', announcedAt: NOW - 5000, answeredAt: NOW - 1000 });
  const successor = wait({ key: 's1|2', kind: 'permission', pendingId: null, answerable: false, since: NOW - 60 * SEC });
  reconcile(state, [successor], NOW);
  const item = state.items['s1|2'];
  assert.equal(item.code, 'a1');
  assert.equal(item.answerable, false);
  assert.deepEqual(markDue(state, [successor], NOW), []);
});

test('a successor of the current item of a walk is not spoken again while the walk goes on', () => {
  const first = wait({ key: 's1|p:pd1', kind: 'permission', pendingId: 'pd1' });
  const state = queueOf([first], { mode: 'walking' });
  Object.assign(state.items[first.key], { code: 'a1', announcedAt: NOW - 5000 });
  state.walkCurrent = first.key;
  const successor = wait({ key: 's1|2', kind: 'permission', pendingId: null, answerable: false, since: NOW - 60 * SEC });
  reconcile(state, [successor], NOW);
  assert.equal(state.walkCurrent, 's1|2');
  assert.deepEqual(markDue(state, [successor], NOW), []);
  assert.equal(state.mode, 'walking');
});

test('a successor that was answered ends the walk instead of being spoken again', () => {
  const first = wait({ key: 's1|p:pd1', kind: 'permission', pendingId: 'pd1' });
  const state = queueOf([first], { mode: 'walking' });
  Object.assign(state.items[first.key], { code: 'a1', announcedAt: NOW - 5000, answeredAt: NOW - 1000 });
  state.walkCurrent = first.key;
  const successor = wait({ key: 's1|2', kind: 'permission', pendingId: null, answerable: false, since: NOW - 60 * SEC });
  reconcile(state, [successor], NOW);
  assert.deepEqual(markDue(state, [successor], NOW), []);
  assert.equal(state.mode, 'listening');
});

test('announce gives a code, records the item and logs; a second claim in listening or in a walk is refused', () => {
  const root = tempRoot();
  const w = wait();
  withQueue(root, (state) => { reconcile(state, [w], NOW); state.seededAt = NOW; });
  assert.deepEqual(announce(root, w, NOW), { code: 'a1', announced: true });
  const state = readQueue(root);
  assert.equal(state.items[w.key].announcedAt, NOW);
  assert.equal(state.lastAnnounced, 'a1');
  assert.deepEqual(announce(root, w, NOW), { code: 'a1', announced: false });

  withQueue(root, (s) => { s.mode = 'walking'; });
  assert.equal(announce(root, w, NOW).announced, true);
  assert.equal(readQueue(root).walkCurrent, w.key);
  assert.equal(announce(root, w, NOW).announced, false);
  const logged = readFileSync(join(root, 'alerts.jsonl'), 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  assert.deepEqual(logged.map((l) => l.mode), ['listening', 'walking']);
  assert.equal(logged[0].code, 'a1');
});

test('announce refuses an unknown wait and a paused queue', () => {
  const root = tempRoot();
  const w = wait();
  assert.equal(announce(root, w, NOW).announced, false);
  withQueue(root, (state) => { reconcile(state, [w], NOW); state.mode = 'paused'; });
  assert.equal(announce(root, w, NOW).announced, false);
});

test('sentence follows the exact Polish texts', () => {
  assert.equal(sentence({ name: 'Migracja', kind: 'decision' }), 'Migracja. Decyzja do podjęcia.');
  assert.equal(sentence({ name: 'Migracja', kind: 'permission' }), 'Migracja. Uprawnienia do zaakceptowania.');
});

test('speakCommand: HUB_SPEAK_CMD replaces the default powershell command', () => {
  assert.deepEqual(speakCommand({ HUB_SPEAK_CMD: '["x","y"]' }), ['x', 'y']);
  const command = speakCommand({});
  assert.deepEqual(command.slice(0, 6), ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File']);
  assert.equal(command[6], SPEAK_PS1);
});

test('speak rejects a failing process and kills one that outlives the limit', async () => {
  const { log, env } = setup();
  await speak('tekst', { env });
  assert.equal(spoken(log)[0].text, 'tekst');
  await assert.rejects(speak('x', { env: { ...env, HUB_SPEAK_FAIL: '1' } }), /exited 1/);
  await assert.rejects(speak('x', { env: { ...env, HUB_SPEAK_MS: '5000' }, timeoutMs: 300 }), /killed after 300 ms/);
  await assert.rejects(speak('x', { env: { ...env, HUB_SPEAK_CMD: JSON.stringify(['definitely-not-a-command-hub']) } }));
});

test('speak.ps1 is ASCII only, without a byte order mark', () => {
  const bytes = readFileSync(SPEAK_PS1);
  assert.ok(bytes.every((byte) => byte < 128));
  assert.match(bytes.toString('ascii'), /Microsoft Paulina Desktop/);
});

test('dialogRootOf prefers HUB_TALK_ROOT; anyLiveVoice is false without a root or a bridge file', async () => {
  assert.equal(dialogRootOf({ HUB_TALK_ROOT: 'X' }), 'X');
  assert.equal(await anyLiveVoice(null), false);
  assert.equal(await anyLiveVoice(tempRoot()), false);
});

// --- fix round 1 ---

const rowOf = (sessionId, ageMs = 70 * SEC, extra = {}) => ({
  sessionId, state: 'waiting for decision', detail: 'Q?', name: 'Migracja', projectName: 'proj', launchedKind: null,
  since: new Date(Date.now() - ageMs).toISOString(), ...extra,
});

// An alert pass on its own rows, as one watcher has them; speech is a stub that records the text.
function instance(root, env, source, said, lines) {
  return createAlerts({
    root, env, print: (line) => lines.push(line), speakFn: async (text) => { said.push(text); }, rows: () => source.current,
  });
}

test('rows carry their time: a watcher with stale rows cannot revive a wait another watcher closed', async () => {
  const root = tempRoot();
  const env = { HUB_TALK_ROOT: tempRoot() };
  const said = [];
  const lines = [];
  const sourceA = { current: { rows: [], rowsAt: 1 } };
  const sourceB = { current: { rows: [], rowsAt: 1 } };
  const a = instance(root, env, sourceA, said, lines);
  const b = instance(root, env, sourceB, said, lines);
  await a.pass();
  const stale = [rowOf('w1')];
  sourceA.current = { rows: stale, rowsAt: 2 };
  sourceB.current = { rows: stale, rowsAt: 2 };
  await a.pass();
  await a.drain();
  sourceA.current = { rows: [], rowsAt: 3 };
  await a.pass();
  await b.pass();
  await b.drain();
  assert.equal(said.length, 1);
  assert.deepEqual(lines.filter((line) => line.startsWith('announce:')).map((line) => line.split(' ')[1]), ['a1']);
  assert.equal(readQueue(root).rowsAt, 3);
});

test('a pass that waits on a voice probe uses the rows of the moment it resumes', async () => {
  const root = tempRoot();
  const talk = tempRoot();
  const env = { HUB_TALK_ROOT: talk };
  let hits = 0;
  const hanging = createServer(() => { hits += 1; });
  await new Promise((resolve) => hanging.listen(0, '127.0.0.1', resolve));
  try {
    bridgeFile(talk, hanging.address().port);
    const said = [];
    const lines = [];
    const source = { current: { rows: [], rowsAt: 1 } };
    const alerts = instance(root, env, source, said, lines);
    await alerts.pass();
    source.current = { rows: [rowOf('w1')], rowsAt: 2 };
    const inFlight = alerts.pass();
    source.current = { rows: [], rowsAt: 3 };
    await inFlight;
    await alerts.drain();
    assert.equal(hits, 1);
    assert.deepEqual(said, []);
    assert.deepEqual(lines, []);
    assert.deepEqual(Object.keys(readQueue(root).items), []);
  } finally {
    await closeServer(hanging);
  }
});

test('a wait that vanishes from the rows and returns under its key keeps its code and is not spoken again', () => {
  const root = tempRoot();
  const w = wait();
  withQueue(root, (state) => { reconcile(state, [w], NOW); state.seededAt = NOW; });
  assert.equal(announce(root, w, NOW).code, 'a1');
  withQueue(root, (state) => { reconcile(state, [], NOW + 1000); });
  assert.equal(readQueue(root).codes[0].closedAt, NOW + 1000);
  withQueue(root, (state) => {
    reconcile(state, [w], NOW + 2000);
    const item = state.items[w.key];
    assert.equal(item.code, 'a1');
    assert.equal(item.announcedAt, NOW);
    assert.equal(state.codes.length, 1);
    assert.equal(state.codes[0].closedAt, null);
    assert.deepEqual(markDue(state, [w], NOW + 3000), []);
  });
});

test('in a walk, the current item that vanishes and returns stays current and is not spoken again', () => {
  const root = tempRoot();
  const w = wait();
  withQueue(root, (state) => { reconcile(state, [w], NOW); state.seededAt = NOW; state.mode = 'walking'; });
  assert.equal(announce(root, w, NOW).announced, true);
  withQueue(root, (state) => { reconcile(state, [], NOW + 1000); });
  assert.equal(readQueue(root).walkCurrent, null);
  withQueue(root, (state) => {
    reconcile(state, [w], NOW + 2000);
    assert.equal(state.items[w.key].code, 'a1');
    assert.equal(state.walkCurrent, w.key);
    assert.deepEqual(markDue(state, [w], NOW + 3000), []);
    assert.equal(state.mode, 'walking');
  });
});

test('a code older than 24 h is not restored for a returning key', () => {
  const state = emptyQueue();
  const w = wait();
  state.codes.push({ n: 1, at: NOW - 25 * 60 * MIN, key: w.key, closedAt: NOW - 24 * 60 * MIN, name: 'x', announcedAt: NOW - 25 * 60 * MIN });
  reconcile(state, [w], NOW);
  assert.equal(state.items[w.key].announcedAt, null);
  assert.equal(state.items[w.key].code, null);
});

test('queue states and files without rowsAt still work', () => {
  assert.equal(emptyQueue().rowsAt, 0);
  const root = tempRoot();
  const old = emptyQueue();
  delete old.rowsAt;
  writeFileSync(queuePath(root), JSON.stringify(old));
  assert.equal(withQueue(root, (s) => s.rowsAt ?? 0), 0);
});

test('Fix 2: an overview that fails does not wipe the queue, so the wait keeps its code and is not spoken twice', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'w1');
  const second = await run(env);
  assert.equal(announces(second.stdout).length, 1);
  mkdirSync(join(root, 'judgments.jsonl'));
  const failing = await run(env);
  assert.match(failing.stdout, /^watcher error: /m);
  assert.deepEqual(announces(failing.stdout), []);
  assert.equal(readQueue(root).codes[0].closedAt, null);
  rmSync(join(root, 'judgments.jsonl'), { recursive: true });
  const third = await run(env);
  assert.deepEqual(announces(third.stdout), []);
  assert.equal(spoken(log).length, 1);
  assert.equal(readQueue(root).codes.length, 1);
});

test('Fix 3: speak.ps1 stops at the first error, so a wrong voice or a missing synthesizer is a failure', () => {
  const script = readFileSync(SPEAK_PS1, 'utf8');
  assert.match(script, /^\$ErrorActionPreference = 'Stop'$/m);
  const copy = join(tempRoot(), 'speak-check.ps1');
  // Nothing is played: the voice is wrong and the Speak call is removed.
  writeFileSync(copy, script.replace('Microsoft Paulina Desktop', 'No Such Voice').replace(/^\$synth\.Speak.*$/m, ''));
  const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', copy], { input: 'x', encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});

test('Fix 3: a multi-line speech error is printed as one line, cut to a sensible length', async () => {
  const { root, env } = await seeded();
  gate(root, 'w1');
  const out = await run({ ...env, HUB_SPEAK_FAIL: '1', HUB_SPEAK_STDERR: `first line\nsecond line\n${'x'.repeat(500)}` });
  const lines = out.stdout.split('\n').filter((line) => line !== '');
  const failed = lines.filter((line) => line.startsWith('speech failed:'));
  assert.equal(failed.length, 1);
  assert.match(failed[0], /^speech failed: speech process exited 1: first line second line x+$/);
  assert.ok(failed[0].length < 300);
  assert.equal(lines.filter((line) => !line.startsWith('announce:') && !line.startsWith('speech failed:') && !line.startsWith('new session:')).length, 0);
});

test('Fix 4: a dialog known only by its name is not spoken and keeps its waiting line', async () => {
  const { root, log, env } = await seeded();
  gate(root, 'dlg1', { title: 'dlg-rozmowa' });
  const out = await run(env);
  assert.match(out.stdout, /^waiting for decision: \S+ dlg1 dlg-rozmowa — Które API\?$/m);
  assert.deepEqual(announces(out.stdout), []);
  assert.deepEqual(spoken(log), []);
  assert.equal(snapshot([{ sessionId: 'd', name: 'dlg-x', state: 'working', launchedKind: null }]).d.isDialog, true);
  assert.equal(snapshot([{ sessionId: 'd', name: 'x', state: 'working', launchedKind: null }]).d.isDialog, false);
});

test('in a walk, announce refuses while another open item is current', () => {
  const root = tempRoot();
  const one = wait({ key: 'a|1', since: NOW - 200 * SEC });
  const two = wait({ key: 'b|1', sessionId: 'b', since: NOW - 100 * SEC });
  withQueue(root, (state) => { reconcile(state, [one, two], NOW); state.seededAt = NOW; state.mode = 'walking'; state.walkCurrent = 'a|1'; });
  assert.equal(announce(root, two, NOW).announced, false);
  withQueue(root, (state) => { state.items['a|1'].answeredAt = NOW; });
  assert.equal(announce(root, two, NOW).announced, true);
});

test('a voice conversation that starts while the FIFO holds entries is not talked over, and the next pass holds the wait', async () => {
  const root = tempRoot();
  const talk = tempRoot();
  const env = { HUB_TALK_ROOT: talk };
  const server = await statusServer();
  try {
    const said = [];
    const lines = [];
    const source = { current: { rows: [], rowsAt: 1 } };
    const alerts = createAlerts({
      root, env, print: (line) => lines.push(line), rows: () => source.current,
      speakFn: async (text) => { said.push(text); bridgeFile(talk, server.address().port); },
    });
    await alerts.pass();
    source.current = { rows: [rowOf('w1', 100 * SEC, { name: 'Pierwsza' }), rowOf('w2', 80 * SEC, { name: 'Druga' })], rowsAt: 2 };
    await alerts.pass();
    await alerts.drain();
    assert.deepEqual(said, ['Pierwsza. Decyzja do podjęcia.']);
    assert.equal(lines.filter((line) => line.startsWith('announce:')).length, 1);
    source.current = { ...source.current, rowsAt: 3 };
    await alerts.pass();
    await alerts.drain();
    assert.equal(said.length, 1);
    const second = Object.values(readQueue(root).items).find((item) => item.sessionId === 'w2');
    assert.equal(second.announcedAt, null);
    assert.equal(typeof second.heldAt, 'number');
  } finally {
    await closeServer(server);
  }
});

test('a repeated alert error prints again after a good pass', async () => {
  const root = tempRoot();
  const errors = [];
  const oks = [];
  let broken = true;
  const alerts = createAlerts({
    root, env: { HUB_TALK_ROOT: tempRoot() }, print: () => {}, onError: (m) => errors.push(m), onOk: () => oks.push(1),
    rows: () => { if (broken) throw new Error('boom'); return { rows: [], rowsAt: 1 }; },
  });
  await alerts.pass();
  broken = false;
  await alerts.pass();
  assert.deepEqual(errors, ['boom']);
  assert.equal(oks.length, 1);
});
