import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// The env override can only shorten the worker's life: a test needs a deadline
// it can trigger, but nothing outside the settings may let a worker outlive
// the age limit `--wait` uses to call it dead.
export function effectiveDeadlineMs(computedMs, override) {
  const value = Number(override);
  return Number.isFinite(value) && value > 0 ? Math.min(computedMs, value) : computedMs;
}

// Why a finder child failed: its first stderr line, or at least the exit code
// so the report never shows an empty reason.
export function failureDetail(code, stderr) {
  const line = String(stderr ?? '').split(/\r?\n/).map((l) => l.trim()).find((l) => l !== '');
  return line ? line.slice(0, 200) : `exit code ${code}`;
}

// Starts the detached worker and records its pid. `spawnFn` is injectable so
// the spawn-failure path can be tested: a failed spawn yields `pid: undefined`
// and an async 'error' event, which must neither leave a pid file naming
// nothing nor escape as an uncaught exception.
export function startWorker(spawnFn, { command, args, pidPath }) {
  const worker = spawnFn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  worker.on('error', () => {});
  worker.unref();
  if (worker.pid === undefined) return { started: false, reason: 'spawn-failed', detail: 'worker process has no pid' };
  mkdirSync(dirname(pidPath), { recursive: true });
  writeFileSync(pidPath, String(worker.pid), 'utf8');
  return { started: true };
}
