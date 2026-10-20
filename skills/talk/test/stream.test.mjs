import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTurnCollector, userLine } from '../lib/stream.mjs';

test('a turn ends on the result line and carries its result text', () => {
  const c = createTurnCollector();
  assert.equal(c.push('{"type":"system","subtype":"init","session_id":"s"}'), null);
  assert.equal(c.push('not json'), null);
  assert.deepEqual(c.push('{"type":"result","subtype":"success","result":"Dobrze."}'), { text: 'Dobrze.', subtype: 'success' });
});

test('userLine keeps Polish diacritics', () => {
  assert.equal(JSON.parse(userLine('zażółć gęślą jaźń')).message.content[0].text, 'zażółć gęślą jaźń');
});

test('a result with num_turns 0 is not a turn', () => {
  const c = createTurnCollector();
  assert.equal(c.push('{"type":"result","subtype":"success","num_turns":0,"result":""}'), null);
  assert.deepEqual(c.push('{"type":"result","subtype":"success","num_turns":1,"result":"Tak."}'), { text: 'Tak.', subtype: 'success' });
});
