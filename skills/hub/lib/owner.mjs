// The watcher's owner (spec §5.5, P14): the nearest ancestor process named claude, so the watcher
// stops when the hub session that started it through Monitor has ended. Closing a VS Code panel
// ended the hub's claude.exe but not the watcher (Plan 3 acceptance, B2).
import { spawnSync } from 'node:child_process';

const OWNER_NAME = /^claude(\.exe)?$/i;
const WINDOWS_QUERY = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress';

// One read of the process table as [{ pid, ppid, name }]; [] when it cannot be read.
// HUB_PROCESS_TABLE, a JSON array in that shape, replaces it for tests.
export function processTable({ env = process.env, platform = process.platform, run = spawnSync } = {}) {
  try {
    if (env.HUB_PROCESS_TABLE) return JSON.parse(env.HUB_PROCESS_TABLE);
    if (platform === 'win32') {
      const result = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_QUERY], { encoding: 'utf8', timeout: 30000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
      if (result.status !== 0 || !result.stdout?.trim()) return [];
      // ConvertTo-Json prints a single process as an object, several as an array.
      return [JSON.parse(result.stdout)].flat().map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: String(p.Name ?? '') }));
    }
    const result = run('ps', ['-A', '-o', 'pid=,ppid=,comm='], { encoding: 'utf8', timeout: 30000 });
    if (result.status !== 0 || !result.stdout) return [];
    return result.stdout.split('\n')
      .map((line) => /^\s*(\d+)\s+(\d+)\s+(.+?)\s*$/.exec(line))
      .filter(Boolean)
      .map(([, pid, ppid, comm]) => ({ pid: Number(pid), ppid: Number(ppid), name: comm.split('/').pop() }));
  } catch {
    return [];
  }
}

// The nearest ancestor of `pid` named claude, or null. A loop in the table ends the walk.
export function findOwner(table, pid) {
  const byPid = new Map(table.map((p) => [p.pid, p]));
  const seen = new Set([pid]);
  let current = byPid.get(pid)?.ppid;
  while (current && !seen.has(current)) {
    seen.add(current);
    const entry = byPid.get(current);
    if (!entry) return null;
    if (OWNER_NAME.test(entry.name)) return entry.pid;
    current = entry.ppid;
  }
  return null;
}

// EPERM means the process exists but belongs to someone else. Only the PID is checked: a PID that
// Windows reuses within the check interval keeps an orphan alive until its Monitor timeout, an
// accepted risk (Plan 4 final review, M4).
export function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}
