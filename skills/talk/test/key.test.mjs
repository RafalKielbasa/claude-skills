import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadKey } from '../lib/key.mjs';

test('the key comes from the process env first, else from the User environment, never printed', () => {
  assert.equal(loadKey({ env: { ELEVENLABS_API_KEY: 'a' }, readUserEnv: () => 'b' }), 'a');
  assert.equal(loadKey({ env: {}, readUserEnv: () => 'b' }), 'b');
  assert.equal(loadKey({ env: {}, readUserEnv: () => '' }), null);
});

test('the User environment reader is asked for ELEVENLABS_API_KEY and its value is trimmed', () => {
  const asked = [];
  assert.equal(loadKey({ env: {}, readUserEnv: (n) => { asked.push(n); return ' k\r\n'; } }), 'k');
  assert.deepEqual(asked, ['ELEVENLABS_API_KEY']);
});

test('the default reader returns nothing when the test hook TALK_USER_ENV_EMPTY is 1', () => {
  assert.equal(loadKey({ env: { TALK_USER_ENV_EMPTY: '1' } }), null);
});
