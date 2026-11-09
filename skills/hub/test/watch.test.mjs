import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transitions, readWatchState, errorReporter, debouncer } from '../lib/watch.mjs';
import { tempRoot, ev } from './helpers.mjs';

const WATCH = fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url));
// None of these tests may speak aloud or read the real talk root, whatever the watcher finds.
const SAFE = { HUB_SPEAK_CMD: JSON.stringify([process.execPath, '-e', '0']), HUB_TALK_ROOT: tempRoot() };
const s = (label, extra = {}) => ({ label, detail: '', name: 'probe-a', project: 'sandbox', continuedFrom: null, ...extra });

test('only the transitions of spec §5.5 are printed', () => {
  assert.deepEqual(transitions({}, { abcdefgh1: s('working') }), ['new session: sandbox abcdefgh probe-a']);
  // A plain session's wait is announced by the alert schedule after 60 s; only a dialog fork keeps these lines.
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for decision', { detail: 'A czy B?' }) }), []);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for permission') }), []);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for decision', { detail: 'A czy B?', isDialog: true }) }), ['waiting for decision: sandbox x1 probe-a — A czy B?']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for permission', { isDialog: true }) }), ['waiting for permission: sandbox x1 probe-a']);
  const stop = (isDialog, lastStop) => s('waiting for decision', { detail: 'A czy B?', isDialog, lastStop });
  assert.deepEqual(transitions({ x1: stop(true, 'a') }, { x1: stop(true, 'b') }), ['waiting for decision: sandbox x1 probe-a — A czy B?']);
  assert.deepEqual(transitions({ x1: stop(false, 'a') }, { x1: stop(false, 'b') }), []);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('problem', { detail: 'rate_limit' }) }), ['problem: sandbox x1 probe-a — rate_limit']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('turn ended') }), ['turn ended: sandbox x1 probe-a']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('working') }), []);
  assert.deepEqual(transitions({ x1: s('turn ended') }, { x1: s('ended') }), []);
});

test('a /clear continuation is not reported as a new session', () => {
  const lines = transitions({}, { newid0001: s('working', { name: 'probe-role', continuedFrom: 'oldid0001' }) });
  assert.deepEqual(lines, ['continued after /clear: sandbox probe-role oldid000 -> newid000']);
});

test('the watcher seeds silently, then reports what changed while it was not running', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  appendFileSync(log, `${JSON.stringify(ev('UserPromptSubmit', new Date().toISOString(), { sessionId: 'w1', promptId: 'q1', sessionTitle: 'probe-a' }))}\n`);
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root, ...SAFE } });

  const first = run();
  assert.equal(first.status, 0);
  assert.equal(first.stdout, '');

  appendFileSync(log, `${JSON.stringify(ev('Stop', new Date(Date.now() + 1000).toISOString(), { sessionId: 'w1', promptId: 'q1', marker: 'A czy B?' }))}\n`);
  const second = run();
  // The gate is seconds old and the session is not a dialog fork: no line yet, the 60 s alert announces it.
  assert.equal(second.stdout, '');
  assert.equal(run().stdout, '');
});

test('a corrupt watch-state.json is seeded again with one line, then the watcher works', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'w1.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', new Date().toISOString(), { sessionId: 'w1', promptId: 'q1', sessionTitle: 'probe-a' }))}\n`);
  writeFileSync(join(root, 'watch-state.json'), '{ broken', 'utf8');
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root, ...SAFE } });

  const first = run();
  assert.equal(first.status, 0);
  assert.equal(first.stdout, 'watcher state unreadable; seeded again from the current overview\n');
  assert.equal(run().stdout, '');
  assert.equal(typeof readWatchState(root).state, 'object');
  assert.notEqual(readWatchState(root).state, null);
});

test('the error reporter prints a repeated error once and again after a good tick', () => {
  const lines = [];
  const r = errorReporter((line) => lines.push(line));
  r.fail('a'); r.fail('a'); r.fail('b'); r.ok(); r.fail('b');
  assert.deepEqual(lines, ['watcher error: a', 'watcher error: b', 'watcher error: b']);
});

const waitFor = async (check, ms = 15000) => {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
};

// A clock and one timer under the test's control.
function fakeTime() {
  let nowMs = 0;
  let timer = null;
  return {
    now: () => nowMs,
    setTimer: (fn, ms) => {
      timer = { fn, at: nowMs + ms };
      return timer;
    },
    clearTimer: (handle) => {
      if (timer === handle) timer = null;
    },
    advance(ms) {
      const until = nowMs + ms;
      if (timer && timer.at <= until) {
        const { fn, at } = timer;
        timer = null;
        nowMs = at;
        fn();
      }
      nowMs = until;
    },
  };
}

test('debouncer: 500 ms after the last change', () => {
  const time = fakeTime();
  let fired = 0;
  const change = debouncer(() => { fired += 1; }, time);
  change();
  time.advance(499);
  assert.equal(fired, 0);
  change();
  time.advance(499);
  assert.equal(fired, 0);
  time.advance(1);
  assert.equal(fired, 1);
  time.advance(10000);
  assert.equal(fired, 1);
});

test('debouncer: a steady stream of changes fires at most 5 s from the first, and the next change starts anew', () => {
  const time = fakeTime();
  const firedAt = [];
  const change = debouncer(() => { firedAt.push(time.now()); }, time);
  for (let i = 0; i < 70; i += 1) {
    change();
    time.advance(100);
  }
  assert.deepEqual(firedAt, [5000]);
  time.advance(10000);
  assert.deepEqual(firedAt, [5000, 7400]);
});

test('debouncer: a change just before the 5 s limit waits only for what is left', () => {
  const time = fakeTime();
  const firedAt = [];
  const change = debouncer(() => { firedAt.push(time.now()); }, time);
  change();
  time.advance(400);
  change();
  time.advance(400);
  change();
  time.advance(400);
  for (let i = 0; i < 8; i += 1) {
    change();
    time.advance(450);
  }
  assert.deepEqual(firedAt, []);
  change();
  time.advance(199);
  assert.deepEqual(firedAt, []);
  time.advance(1);
  assert.deepEqual(firedAt, [5000]);
});

test('a running watcher reports through a busy registry: a write every 100 ms does not hold the tick back past 5 s', async (t) => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  const add = (event) => appendFileSync(log, `${JSON.stringify(event)}\n`);
  const at = () => new Date().toISOString();
  const env = { ...process.env, HUB_DATA: root, ...SAFE };
  add(ev('UserPromptSubmit', at(), { sessionId: 'w1', promptId: 'p1', sessionTitle: 'probe-a' }));
  add(ev('Stop', at(), { sessionId: 'w1', promptId: 'p1', marker: null, lastFile: 'w1.last/a.md' }));
  spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { env });

  const watcher = spawn(process.execPath, [WATCH, '--no-poll', `--owner-pid=${process.pid}`, '--interval-ms=600000', '--alert-check-ms=600000'], { env });
  t.after(() => watcher.kill());
  let out = '';
  watcher.stdout.on('data', (chunk) => { out += chunk; });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const noise = setInterval(() => writeFileSync(join(root, 'registry', 'noise.txt'), String(Date.now())), 100);
  t.after(() => clearInterval(noise));
  await new Promise((resolve) => setTimeout(resolve, 300));
  const started = Date.now();
  add(ev('UserPromptSubmit', at(), { sessionId: 'w1', promptId: 'p2' }));
  add(ev('Stop', at(), { sessionId: 'w1', promptId: 'p2', marker: null, lastFile: 'w1.last/b.md' }));
  while (!/turn ended: .* w1 probe-a/.test(out)) {
    assert.ok(Date.now() - started < 7000, 'no tick within 7 s, with the writes still coming');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});

test('a running watcher reports while its owner lives, then stops without writing its state (P14)', async () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  const add = (event) => appendFileSync(log, `${JSON.stringify(event)}\n`);
  const t = () => new Date().toISOString();
  const env = { ...process.env, HUB_DATA: root, ...SAFE };
  add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p1', sessionTitle: 'probe-a' }));
  add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p1', marker: null, lastFile: 'w1.last/a.md' }));
  spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { env });

  const owner = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);
  // A 1 s rescan catches an event appended before fs.watch was registered, as the 2-minute rescan
  // does in production (final review M3).
  const watcher = spawn(process.execPath, [WATCH, '--no-poll', `--owner-pid=${owner.pid}`, '--owner-check-ms=100', '--interval-ms=1000'], { env });
  let out = '';
  watcher.stdout.on('data', (chunk) => { out += chunk; });
  const exited = new Promise((resolve) => watcher.on('exit', resolve));
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p2' }));
    add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p2', marker: null, lastFile: 'w1.last/b.md' }));
    await waitFor(() => /turn ended: .* w1 probe-a/.test(out));

    const ownerGone = new Promise((resolve) => owner.on('exit', resolve));
    owner.kill();
    await ownerGone;
    add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p3' }));
    add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p3', marker: null, lastFile: 'w1.last/c.md' }));
    assert.equal(await Promise.race([exited, new Promise((resolve) => setTimeout(() => resolve('still running'), 10000))]), 0);
  } finally {
    owner.kill();
    watcher.kill();
  }
  assert.match(out, new RegExp(`watcher stopped: its hub session \\(process ${owner.pid}\\) has ended`));
  assert.equal(out.match(/turn ended/g).length, 1);
  // The orphan wrote nothing, so the next watcher still reports the turn that ended after it.
  assert.match(spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env }).stdout, /^turn ended: .* w1 probe-a/m);
});

test('a running watcher without a claude ancestor says so once and keeps running (P14)', async () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const watcher = spawn(process.execPath, [WATCH, '--no-poll'], { env: { ...process.env, HUB_DATA: root, ...SAFE, HUB_PROCESS_TABLE: '[]' } });
  let out = '';
  watcher.stdout.on('data', (chunk) => { out += chunk; });
  try {
    await waitFor(() => out.includes('\n'));
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.equal(out, 'watcher: no claude process among its ancestors; it will not stop with the hub session\n');
    assert.equal(watcher.exitCode, null);
  } finally {
    watcher.kill();
  }
});

test('a re-armed watcher reports a turn that ended while it was down, also when the saved label was already "turn ended"', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  const add = (event) => appendFileSync(log, `${JSON.stringify(event)}\n`);
  const t = (offset) => new Date(Date.now() + offset).toISOString();
  add(ev('UserPromptSubmit', t(-5000), { sessionId: 'w1', promptId: 'p1', sessionTitle: 'probe-a' }));
  add(ev('Stop', t(-4000), { sessionId: 'w1', promptId: 'p1', marker: null, lastFile: 's1.last/a.md' }));
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root, ...SAFE } });

  assert.equal(run().stdout, '');
  add(ev('UserPromptSubmit', t(-3000), { sessionId: 'w1', promptId: 'p2' }));
  add(ev('Stop', t(-2000), { sessionId: 'w1', promptId: 'p2', marker: null, lastFile: 's1.last/b.md' }));
  assert.match(run().stdout, /^turn ended: .* w1 probe-a/m);
  assert.equal(run().stdout, '');
});
