import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorize } from '../lib/auth.mjs';

const token = 'a'.repeat(64);
const opts = { token, port: 4100 };

test('the token and a local Host are both required', () => {
  assert.deepEqual(authorize({ url: `/api/ask?t=${token}`, host: '127.0.0.1:4100' }, opts), { ok: true });
  assert.deepEqual(authorize({ url: `/?t=${token}`, host: 'localhost:4100' }, opts), { ok: true });
  assert.deepEqual(authorize({ url: '/api/ask', host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
  assert.deepEqual(authorize({ url: `/api/ask?t=${'b'.repeat(64)}`, host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
  assert.deepEqual(authorize({ url: '/api/ask?t=short', host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
  for (const host of ['evil.example:4100', '127.0.0.1:4101', undefined]) {
    assert.deepEqual(authorize({ url: `/?t=${token}`, host }, opts), { ok: false, status: 403, reason: 'host' });
  }
});

test('a request target that is not a valid URL is refused, not thrown', () => {
  assert.deepEqual(authorize({ url: 'http://[', host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
});
