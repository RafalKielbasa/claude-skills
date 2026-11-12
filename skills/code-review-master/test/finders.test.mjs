import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { effectiveDeadlineMs, failureDetail, startWorker, killProcessTree } from '../lib/finders.mjs';

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

// Only the command is tested, never a real kill: the point is that on Windows
// the whole tree (crm child, codex, docker) is named, by pid, without a shell.
test('on Windows an expired finder is killed with its whole process tree', () => {
  const calls = [];
  let killed = 0;
  const child = { pid: 4242, kill() { killed += 1; } };
  killProcessTree(child, { platform: 'win32', spawn: (cmd, args, opts) => { calls.push({ cmd, args, opts }); return { status: 0 }; } });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].cmd, 'taskkill');
  assert.deepEqual(calls[0].args, ['/T', '/F', '/PID', '4242']);
  assert.equal(calls[0].opts.windowsHide, true);
  assert.equal(calls[0].opts.shell, undefined);
  assert.equal(killed, 1, 'child.kill() still runs after taskkill');
});

test('outside Windows, or without a pid, no taskkill is attempted', () => {
  for (const [platform, pid] of [['linux', 4242], ['win32', undefined]]) {
    const calls = [];
    let killed = 0;
    killProcessTree({ pid, kill() { killed += 1; } }, { platform, spawn: (...a) => { calls.push(a); return {}; } });
    assert.equal(calls.length, 0, platform);
    assert.equal(killed, 1, platform);
  }
});

test('a failing taskkill or kill never throws', () => {
  const child = { pid: 7, kill() { throw new Error('already gone'); } };
  assert.doesNotThrow(() => killProcessTree(child, { platform: 'win32', spawn: () => { throw new Error('no taskkill'); } }));
});
