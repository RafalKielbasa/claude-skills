import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { emptyQueue, readQueue, withQueue, giveCode, itemByCode, codeEntry, openItems, reconcile } from '../lib/queue.mjs';
import { queuePath, queueLockPath } from '../lib/paths.mjs';
import { tempRoot } from './helpers.mjs';

const HOUR = 60 * 60 * 1000;
const NOW = Date.parse('2026-11-06T12:00:00Z');

const wait = (fields) => ({
  key: 's1|1000', sessionId: 's1', kind: 'decision', since: 1000, pendingId: null, answerable: false,
  askTool: null, name: 'Sesja', project: 'proj', shortId: 's1', detail: '', ...fields,
});

function runChild(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', script, ...args], { stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`child exited ${code}`))));
  });
}

test('giveCode gives the lowest free number', () => {
  const state = emptyQueue();
  assert.equal(giveCode(state, 'k1', 'One', NOW), 'a1');
  assert.equal(giveCode(state, 'k2', 'Two', NOW), 'a2');
  state.codes[0].at = NOW - 24 * HOUR - 1;
  assert.equal(giveCode(state, 'k3', 'Three', NOW), 'a1');

  const fresh = emptyQueue();
  giveCode(fresh, 'k1', 'One', NOW);
  giveCode(fresh, 'k2', 'Two', NOW);
  fresh.codes[0].at = NOW - 24 * HOUR + 1;
  assert.equal(giveCode(fresh, 'k3', 'Three', NOW), 'a3');
});

test('giveCode sets code and codeAt on an existing item', () => {
  const state = emptyQueue();
  reconcile(state, [wait({})], NOW);
  assert.equal(giveCode(state, 's1|1000', 'Sesja', NOW), 'a1');
  assert.equal(state.items['s1|1000'].code, 'a1');
  assert.equal(state.items['s1|1000'].codeAt, NOW);
});

test('itemByCode ignores case', () => {
  const state = emptyQueue();
  reconcile(state, [wait({})], NOW);
  giveCode(state, 's1|1000', 'Sesja', NOW);
  assert.equal(itemByCode(state, 'A1').key, itemByCode(state, 'a1').key);
  assert.equal(itemByCode(state, 'a9'), null);
});

test('withQueue is atomic across processes', async () => {
  const root = tempRoot();
  const script = `
    import { withQueue } from ${JSON.stringify(pathToFileURL(join(import.meta.dirname, '..', 'lib', 'queue.mjs')).href)};
    for (let i = 0; i < 50; i += 1) withQueue(process.argv[1], (state) => { state.counter = (state.counter ?? 0) + 1; });
  `;
  await Promise.all([runChild(script, [root]), runChild(script, [root])]);
  assert.equal(readQueue(root).counter, 100);
  assert.equal(existsSync(queueLockPath(root)), false);
});

test('a stale lock is stolen', () => {
  const root = tempRoot();
  writeFileSync(queueLockPath(root), '');
  const old = new Date(Date.now() - 10_000);
  utimesSync(queueLockPath(root), old, old);
  const started = Date.now();
  assert.equal(withQueue(root, () => 'done'), 'done');
  assert.ok(Date.now() - started < 500);
});

test('a fresh lock delays until released', async () => {
  const root = tempRoot();
  writeFileSync(queueLockPath(root), '');
  const recent = new Date(Date.now() - 1000);
  utimesSync(queueLockPath(root), recent, recent);
  const releaser = runChild(
    `import { unlinkSync } from 'node:fs'; setTimeout(() => unlinkSync(process.argv[1]), 400);`,
    [queueLockPath(root)],
  );
  const started = Date.now();
  assert.equal(withQueue(root, () => 'done'), 'done');
  assert.ok(Date.now() - started >= 250, 'waited for the release');
  await releaser;
});

test('a lock that is never released ends in an error after about 2 s', () => {
  const root = tempRoot();
  writeFileSync(queueLockPath(root), '');
  const started = Date.now();
  assert.throws(() => withQueue(root, () => {}), /queue lock busy/);
  assert.ok(Date.now() - started >= 1500);
  unlinkSync(queueLockPath(root));
});

test('withQueue writes only when the state changed', () => {
  const root = tempRoot();
  withQueue(root, () => {});
  assert.equal(existsSync(queuePath(root)), false);
  withQueue(root, (state) => { state.mode = 'paused'; });
  const first = readFileSync(queuePath(root), 'utf8');
  withQueue(root, () => {});
  assert.equal(readFileSync(queuePath(root), 'utf8'), first);
});

test('a corrupt queue file seeds again', () => {
  const root = tempRoot();
  writeFileSync(queuePath(root), '{ broken');
  assert.deepEqual(readQueue(root), emptyQueue());
  const seen = withQueue(root, (state) => ({ ...state }));
  assert.ok(seen.corruptAt > 0);
  assert.deepEqual({ ...seen, corruptAt: undefined }, { ...emptyQueue(), corruptAt: undefined });
  assert.equal(JSON.parse(readFileSync(queuePath(root), 'utf8')).version, 1);
});

test('reconcile adds and removes items', () => {
  const state = emptyQueue();
  reconcile(state, [wait({})], NOW);
  assert.equal(state.items['s1|1000'].code, null);
  giveCode(state, 's1|1000', 'Sesja', NOW);
  assert.equal(itemByCode(state, 'a1').key, 's1|1000');

  reconcile(state, [], NOW + 1000);
  assert.deepEqual(state.items, {});
  assert.equal(codeEntry(state, 'a1').closedAt, NOW + 1000);
  assert.equal(itemByCode(state, 'a1'), null);
});

test('openItems lists unanswered and unskipped items, oldest first', () => {
  const state = emptyQueue();
  reconcile(state, [wait({ key: 'x|3000', since: 3000 }), wait({ key: 'y|1000', since: 1000 }), wait({ key: 'z|2000', since: 2000 })], NOW);
  state.items['z|2000'].skippedAt = NOW;
  assert.deepEqual(openItems(state).map((item) => item.key), ['y|1000', 'x|3000']);
  state.items['y|1000'].answeredAt = NOW;
  assert.deepEqual(openItems(state).map((item) => item.key), ['x|3000']);
});

test('reconcile keeps a code when a hook ends but the prompt stays', () => {
  const state = emptyQueue();
  reconcile(state, [wait({ key: 's1|p:pend1', kind: 'permission', since: 1000, pendingId: 'pend1', answerable: true })], NOW);
  const code = giveCode(state, 's1|p:pend1', 'Sesja', NOW);
  state.items['s1|p:pend1'].announcedAt = NOW + 5;
  state.items['s1|p:pend1'].answeredAt = NOW + 6;
  state.walkCurrent = 's1|p:pend1';

  reconcile(state, [wait({ key: 's1|1500', kind: 'permission', since: 1500, pendingId: null, answerable: false })], NOW + 10);
  const items = Object.values(state.items);
  assert.equal(items.length, 1);
  assert.equal(items[0].key, 's1|1500');
  assert.equal(items[0].code, code);
  assert.equal(items[0].announcedAt, NOW + 5);
  assert.equal(items[0].answeredAt, NOW + 6);
  assert.equal(items[0].answerable, false);
  assert.equal(state.walkCurrent, 's1|1500');
  assert.equal(codeEntry(state, code).closedAt, null);
  assert.equal(itemByCode(state, code).key, 's1|1500');
});

test('reconcile does not carry a code to a wait of another session or an older wait', () => {
  const state = emptyQueue();
  reconcile(state, [wait({ key: 's1|p:pend1', kind: 'permission', since: 1000, pendingId: 'pend1' })], NOW);
  giveCode(state, 's1|p:pend1', 'Sesja', NOW);
  reconcile(state, [wait({ key: 's2|1500', sessionId: 's2', kind: 'permission', since: 1500 }), wait({ key: 's1|900', kind: 'permission', since: 900 })], NOW + 10);
  assert.equal(itemByCode(state, 'a1'), null);
  assert.equal(codeEntry(state, 'a1').closedAt, NOW + 10);
});

test('a stale lock that cannot be removed ends in an error instead of spinning', () => {
  const root = tempRoot();
  // A directory at the lock path: stale by mtime, but unlinkSync fails on it.
  mkdirSync(queueLockPath(root));
  writeFileSync(join(queueLockPath(root), 'held'), '');
  const old = new Date(Date.now() - 10_000);
  utimesSync(queueLockPath(root), old, old);
  const started = Date.now();
  assert.throws(() => withQueue(root, () => {}), /queue lock busy/);
  assert.ok(Date.now() - started < 4000);
});
