import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { effectiveDeadlineMs, failureDetail, startWorker } from '../lib/finders.mjs';

test('the deadline override can shorten but never lengthen the computed deadline', () => {
  assert.equal(effectiveDeadlineMs(720000, '1'), 1);
  assert.equal(effectiveDeadlineMs(720000, '99999999'), 720000);
  for (const bad of [undefined, '', 'abc', '0', '-5', 'Infinity']) {
    assert.equal(effectiveDeadlineMs(720000, bad), 720000, String(bad));
  }
});

test('failureDetail prefers the first stderr line and falls back to the exit code', () => {
  assert.equal(failureDetail(3, ''), 'exit code 3');
  assert.equal(failureDetail(3, '\n  \n'), 'exit code 3');
  assert.equal(failureDetail(1, '\n boom \nmore'), 'boom');
  assert.equal(failureDetail(1, 'x'.repeat(500)).length, 200);
});

test('a worker that failed to spawn writes no pid file', () => {
  const pidPath = join(mkdtempSync(join(tmpdir(), 'crm-fw-')), 'reports', 'r-finders.pid');
  const stub = () => ({ pid: undefined, on() {}, unref() {} });
  const out = startWorker(stub, { command: 'node', args: [], pidPath });
  assert.equal(out.started, false);
  assert.equal(out.reason, 'spawn-failed');
  assert.equal(existsSync(pidPath), false);
});

test('a spawned worker has its pid recorded', () => {
  const pidPath = join(mkdtempSync(join(tmpdir(), 'crm-fw-')), 'reports', 'r-finders.pid');
  const stub = () => ({ pid: 4242, on() {}, unref() {} });
  assert.deepEqual(startWorker(stub, { command: 'node', args: [], pidPath }), { started: true });
  assert.equal(existsSync(pidPath), true);
});
