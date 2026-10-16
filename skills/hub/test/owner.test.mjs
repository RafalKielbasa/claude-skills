import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTable, findOwner, isAlive } from '../lib/owner.mjs';

// The chain seen in the Plan 3 acceptance: Code.exe -> claude.exe -> bash -> bash -> node (watcher).
const TABLE = [
  { pid: 15096, ppid: 1, name: 'explorer.exe' },
  { pid: 36988, ppid: 15096, name: 'Code.exe' },
  { pid: 11508, ppid: 36988, name: 'claude.exe' },
  { pid: 42568, ppid: 11508, name: 'bash.exe' },
  { pid: 35248, ppid: 42568, name: 'bash.exe' },
  { pid: 21236, ppid: 35248, name: 'node.exe' },
];

test('findOwner: the nearest claude ancestor; none, a gap or a loop give null', () => {
  assert.equal(findOwner(TABLE, 21236), 11508);
  assert.equal(findOwner([...TABLE, { pid: 7, ppid: 21236, name: 'claude' }, { pid: 8, ppid: 7, name: 'node' }], 8), 7);
  assert.equal(findOwner(TABLE.filter((p) => p.name !== 'claude.exe'), 21236), null);
  // The orphan of the acceptance: its claude.exe (35508) is gone from the table.
  assert.equal(findOwner([{ pid: 14272, ppid: 34044, name: 'bash.exe' }, { pid: 34044, ppid: 35508, name: 'bash.exe' }, { pid: 14132, ppid: 14272, name: 'node.exe' }], 14132), null);
  assert.equal(findOwner([{ pid: 1, ppid: 2, name: 'a' }, { pid: 2, ppid: 1, name: 'b' }, { pid: 3, ppid: 1, name: 'node' }], 3), null);
  assert.equal(findOwner(TABLE, 999), null);
});

test('processTable: the override, PowerShell JSON (one process or several), ps output, failures', () => {
  assert.deepEqual(processTable({ env: { HUB_PROCESS_TABLE: JSON.stringify(TABLE) } }), TABLE);
  assert.deepEqual(processTable({ env: { HUB_PROCESS_TABLE: '{ broken' } }), []);
  const several = JSON.stringify([{ ProcessId: 4, ParentProcessId: 0, Name: 'System' }, { ProcessId: 11508, ParentProcessId: 36988, Name: 'claude.exe' }]);
  let call;
  const win = processTable({ env: {}, platform: 'win32', run: (cmd, args) => { call = [cmd, ...args]; return { status: 0, stdout: several }; } });
  assert.deepEqual(win, [{ pid: 4, ppid: 0, name: 'System' }, { pid: 11508, ppid: 36988, name: 'claude.exe' }]);
  assert.equal(call[0], 'powershell.exe');
  assert.match(call.at(-1), /Get-CimInstance Win32_Process/);
  const one = JSON.stringify({ ProcessId: 4, ParentProcessId: 0, Name: 'System' });
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 0, stdout: one }) }), [{ pid: 4, ppid: 0, name: 'System' }]);
  const ps = '    1     0 init\n  200     1 /usr/local/bin/claude\n  300   200 node\n';
  assert.deepEqual(processTable({ env: {}, platform: 'linux', run: () => ({ status: 0, stdout: ps }) }), [
    { pid: 1, ppid: 0, name: 'init' }, { pid: 200, ppid: 1, name: 'claude' }, { pid: 300, ppid: 200, name: 'node' },
  ]);
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 1, stdout: '' }) }), []);
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 0, stdout: '{ broken' }) }), []);
});

test('isAlive: this process is alive, a finished one is not', () => {
  assert.equal(isAlive(process.pid), true);
  assert.equal(isAlive(2147483646), false);
});
