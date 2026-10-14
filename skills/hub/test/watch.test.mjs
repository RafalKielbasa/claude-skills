import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transitions, readWatchState, errorReporter } from '../lib/watch.mjs';
import { tempRoot, ev } from './helpers.mjs';

const WATCH = fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url));
const s = (label, extra = {}) => ({ label, detail: '', name: 'probe-a', project: 'sandbox', continuedFrom: null, ...extra });

test('only the transitions of spec §5.5 are printed', () => {
  assert.deepEqual(transitions({}, { abcdefgh1: s('working') }), ['new session: sandbox abcdefgh probe-a']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for decision', { detail: 'A czy B?' }) }), ['waiting for decision: sandbox x1 probe-a — A czy B?']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for permission') }), ['waiting for permission: sandbox x1 probe-a']);
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
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });

  const first = run();
  assert.equal(first.status, 0);
  assert.equal(first.stdout, '');

  appendFileSync(log, `${JSON.stringify(ev('Stop', new Date(Date.now() + 1000).toISOString(), { sessionId: 'w1', promptId: 'q1', marker: 'A czy B?' }))}\n`);
  const second = run();
  assert.match(second.stdout, /^waiting for decision: .* w1 probe-a — A czy B\?/m);
  assert.equal(run().stdout, '');
});

test('a corrupt watch-state.json is seeded again with one line, then the watcher works', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'w1.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', new Date().toISOString(), { sessionId: 'w1', promptId: 'q1', sessionTitle: 'probe-a' }))}\n`);
  writeFileSync(join(root, 'watch-state.json'), '{ broken', 'utf8');
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });

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

test('a re-armed watcher reports a turn that ended while it was down, also when the saved label was already "turn ended"', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  const add = (event) => appendFileSync(log, `${JSON.stringify(event)}\n`);
  const t = (offset) => new Date(Date.now() + offset).toISOString();
  add(ev('UserPromptSubmit', t(-5000), { sessionId: 'w1', promptId: 'p1', sessionTitle: 'probe-a' }));
  add(ev('Stop', t(-4000), { sessionId: 'w1', promptId: 'p1', marker: null, lastFile: 's1.last/a.md' }));
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });

  assert.equal(run().stdout, '');
  add(ev('UserPromptSubmit', t(-3000), { sessionId: 'w1', promptId: 'p2' }));
  add(ev('Stop', t(-2000), { sessionId: 'w1', promptId: 'p2', marker: null, lastFile: 's1.last/b.md' }));
  assert.match(run().stdout, /^turn ended: .* w1 probe-a/m);
  assert.equal(run().stdout, '');
});
