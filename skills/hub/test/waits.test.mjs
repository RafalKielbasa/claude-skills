import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectWaits, spokenName } from '../lib/waits.mjs';

const NOW = Date.parse('2026-11-06T12:00:00Z');
const SINCE = '2026-11-06T11:00:00Z';
const SINCE_MS = Date.parse(SINCE);

const row = (fields) => ({
  sessionId: 's1', name: 'Migracja', projectName: 'notatki', state: 'waiting for decision', since: SINCE,
  detail: 'Which variant?', launchedKind: null, ...fields,
});
const pending = (fields) => ({
  id: 'p1', sessionId: 's1', promptId: 'pr1', tool: 'Bash', target: 'ls', inputHash: 'h', input: {}, pid: 1,
  startedAt: SINCE_MS + 5000, ...fields,
});

test('a decision row gives one answerable decision wait', () => {
  const waits = collectWaits({ rows: [row()], pendings: [], asks: [], now: NOW });
  assert.equal(waits.length, 1);
  assert.equal(waits[0].kind, 'decision');
  assert.equal(waits[0].answerable, true);
  assert.equal(waits[0].key, `s1|${SINCE_MS}`);
  assert.equal(waits[0].since, SINCE_MS);
  assert.equal(waits[0].name, 'Migracja');
  assert.equal(waits[0].project, 'notatki');
  assert.equal(waits[0].detail, 'Which variant?');
});

test('dialog sessions and stale rows give no wait', () => {
  const rows = [
    row({ sessionId: 'a', launchedKind: 'dialog' }),
    row({ sessionId: 'b', name: 'dlg-x' }),
    row({ sessionId: 'c', name: 'Talk [dialog]' }),
    row({ sessionId: 'd', since: '2026-11-05T11:59:00Z' }),
  ];
  assert.deepEqual(collectWaits({ rows, pendings: [], asks: [], now: NOW }), []);
});

test('a pending record gives an answerable permission wait, also while the row says working', () => {
  const p = pending();
  const waits = collectWaits({ rows: [row({ state: 'working', detail: '' })], pendings: [p], asks: [], now: NOW });
  assert.equal(waits.length, 1);
  assert.equal(waits[0].kind, 'permission');
  assert.equal(waits[0].answerable, true);
  assert.equal(waits[0].key, 's1|p:p1');
  assert.equal(waits[0].pendingId, 'p1');
  assert.equal(waits[0].since, p.startedAt);
});

test('no double when the row says waiting for permission', () => {
  const waits = collectWaits({ rows: [row({ state: 'waiting for permission', detail: '' })], pendings: [pending()], asks: [], now: NOW });
  assert.equal(waits.length, 1);
  assert.equal(waits[0].key, 's1|p:p1');
});

test('two pending records give two waits', () => {
  const waits = collectWaits({ rows: [row({ state: 'working' })], pendings: [pending(), pending({ id: 'p2' })], asks: [], now: NOW });
  assert.deepEqual(waits.map((w) => w.key), ['s1|p:p1', 's1|p:p2']);
});

test('a permission row without a pending record is not answerable', () => {
  const waits = collectWaits({ rows: [row({ state: 'waiting for permission', detail: '' })], pendings: [], asks: [], now: NOW });
  assert.equal(waits.length, 1);
  assert.equal(waits[0].kind, 'permission');
  assert.equal(waits[0].answerable, false);
  assert.equal(waits[0].key, `s1|${SINCE_MS}`);
  assert.equal(waits[0].pendingId, null);
});

test('an ask record turns it into an unanswerable decision', () => {
  const asks = [{ sessionId: 's1', at: SINCE_MS - 100000 }];
  const waits = collectWaits({ rows: [row({ state: 'waiting for permission', detail: '' })], pendings: [], asks, now: NOW });
  assert.equal(waits[0].kind, 'decision');
  assert.equal(waits[0].answerable, false);
  assert.equal(waits[0].askTool, 'AskUserQuestion');
  const tooOld = [{ sessionId: 's1', at: SINCE_MS - 121000 }];
  const other = [{ sessionId: 's2', at: SINCE_MS }];
  assert.equal(collectWaits({ rows: [row({ state: 'waiting for permission' })], pendings: [], asks: tooOld, now: NOW })[0].kind, 'permission');
  assert.equal(collectWaits({ rows: [row({ state: 'waiting for permission' })], pendings: [], asks: other, now: NOW })[0].kind, 'permission');
});

test('spokenName', () => {
  const alone = row();
  assert.equal(spokenName(alone, [alone]), 'Migracja');
  const untitled = row({ name: '', projectName: 'Baza wiedzy' });
  assert.equal(spokenName(untitled, [untitled]), 'Baza wiedzy');
  const other = row({ sessionId: 's2', projectName: 'inny' });
  assert.equal(spokenName(alone, [alone, other]), 'Migracja, notatki');
  const notWaiting = row({ sessionId: 's3', state: 'working' });
  assert.equal(spokenName(alone, [alone, notWaiting]), 'Migracja');
  const long = row({ name: 'x'.repeat(200) });
  assert.equal(spokenName(long, [long]).length, 120);
});

test('the latest matching ask gives the askTool', () => {
  const asks = [
    { sessionId: 's1', tool: 'AskUserQuestion', at: SINCE_MS - 50000 },
    { sessionId: 's1', tool: 'ExitPlanMode', at: SINCE_MS + 1000 },
  ];
  const waits = collectWaits({ rows: [row({ state: 'waiting for permission' })], pendings: [], asks, now: NOW });
  assert.equal(waits[0].askTool, 'ExitPlanMode');
});

test('a pending record with an unparseable startedAt is skipped', () => {
  const waits = collectWaits({ rows: [row({ state: 'working' })], pendings: [pending({ startedAt: 'garbage' }), pending({ id: 'p2', startedAt: undefined })], asks: [], now: NOW });
  assert.deepEqual(waits, []);
});

test('a pending record over 24 h old does not suppress the unanswerable fallback', () => {
  const old = pending({ startedAt: NOW - 25 * 60 * 60 * 1000 });
  const waits = collectWaits({ rows: [row({ state: 'waiting for permission' })], pendings: [old], asks: [], now: NOW });
  assert.equal(waits.length, 1);
  assert.equal(waits[0].answerable, false);
  assert.equal(waits[0].key, `s1|${SINCE_MS}`);
});

test('spokenName ignores dialog rows as clashing waiters', () => {
  const alone = row();
  const dialog = row({ sessionId: 's2', launchedKind: 'dialog', projectName: 'inny' });
  assert.equal(spokenName(alone, [alone, dialog]), 'Migracja');
});

test('a pending record whose session has no row gives no wait', () => {
  assert.deepEqual(collectWaits({ rows: [], pendings: [pending()], asks: [], now: NOW }), []);
});

test('a decision row with a pending record gives both waits', () => {
  const waits = collectWaits({ rows: [row()], pendings: [pending()], asks: [], now: NOW });
  assert.deepEqual(waits.map((w) => w.kind).sort(), ['decision', 'permission']);
});
