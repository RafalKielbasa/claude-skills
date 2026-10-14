import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveSession } from '../lib/derive.mjs';
import { ev } from './helpers.mjs';

const s11 = JSON.parse(readFileSync(new URL('./fixtures/s11-queued.json', import.meta.url), 'utf8'))
  .map((event, index) => ({ id: `s11-${index}`, sessionId: '8db2b062', cwd: 'C:\\repo', index, ...event }));
const upTo = (time) => deriveSession(s11.filter((event) => event.at <= `2026-10-14T${time}`));

test('the S11 queued prompt keeps the session working through the earlier turn\'s Stop', () => {
  assert.equal(upTo('05:28:06.000Z').waiting.kind, 'decision');
  assert.equal(upTo('05:28:18.500Z').queuedPromptId, 'dfbfb101');
  const afterEarlierStop = upTo('05:28:22.000Z');
  assert.equal(afterEarlierStop.phase, 'working');
  assert.equal(afterEarlierStop.waiting, null);
  const afterOwnStop = upTo('05:28:47.000Z');
  assert.equal(afterOwnStop.phase, 'turn-ended');
  assert.equal(afterOwnStop.queuedPromptId, null);
  assert.equal(afterOwnStop.waiting.text, 'review `spec.md` (akceptujesz czy coś zmienić).');
});

test('the second S11 queued sequence behaves the same', () => {
  assert.equal(upTo('05:30:03.000Z').phase, 'working');
  const end = upTo('05:30:13.000Z');
  assert.equal(end.phase, 'turn-ended');
  assert.equal(end.waiting.kind, 'decision');
});

test('a permission wait clears only with a later event of the same prompt_id', () => {
  const base = [
    ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { promptId: 'p1' }),
    ev('Notification', '2026-10-14T10:00:10Z', { promptId: 'p1', kind: 'permission_prompt' }),
  ];
  assert.equal(deriveSession(base).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:20Z', { promptId: 'p2', tool: 'Read' })]).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:05Z', { promptId: 'p1', tool: 'Read' })]).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:20Z', { promptId: 'p1', tool: 'Read' })]).waiting, null);
  assert.equal(deriveSession([...base, ev('Stop', '2026-10-14T10:00:30Z', { promptId: 'p1', marker: null })]).waiting, null);
});

test('out-of-order lines are derived by hook start time', () => {
  const events = [
    ev('Stop', '2026-10-14T10:00:30Z', { promptId: 'p1', marker: 'A czy B' }),
    ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { promptId: 'p1' }),
  ];
  const state = deriveSession(events);
  assert.equal(state.phase, 'turn-ended');
  assert.equal(state.waiting.kind, 'decision');
});

test('a hub-caused prompt clears a decision wait and is remembered as from the hub', () => {
  const state = deriveSession([
    ev('Stop', '2026-10-14T10:00:00Z', { promptId: 'p1', marker: 'A czy B' }),
    ev('UserPromptSubmit', '2026-10-14T10:01:00Z', { promptId: 'p2', fromName: 'hub', innerHash: 'h' }),
  ]);
  assert.equal(state.waiting, null);
  assert.equal(state.phase, 'working');
  assert.equal(state.lastPromptFromName, 'hub');
});

test('StopFailure sets a problem and SessionEnd ends the session', () => {
  const failed = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z'), ev('StopFailure', '2026-10-14T10:00:05Z', { error: 'rate_limit' })]);
  assert.equal(failed.problem, 'rate_limit');
  const ended = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z'), ev('SessionEnd', '2026-10-14T10:05:00Z', { reason: 'clear' })]);
  assert.equal(ended.phase, 'ended');
  assert.equal(ended.endReason, 'clear');
  assert.equal(ended.endedAt, '2026-10-14T10:05:00Z');
});

test('a SessionEnd-only log is tolerated and counts no activity', () => {
  const state = deriveSession([ev('SessionEnd', '2026-10-14T10:05:00Z', { reason: 'other' })]);
  assert.equal(state.phase, 'ended');
  assert.equal(state.activity, 0);
});
