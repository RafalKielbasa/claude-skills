import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'review.ps1');

// review.ps1's own comment above $ClaudeBin has long said this file has no
// automated harness on a machine without `sh` — true for the counterpart in
// wrapper.test.mjs, which drives review.sh. This file drives review.ps1
// itself instead, so it needs `powershell.exe`, not `sh`. Detected once, so
// a host with neither reports one clear skip instead of one per test.
function hasPowerShell() {
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'exit 0'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const skip = hasPowerShell() ? false : 'powershell.exe is not on PATH';

function runPs1(args) {
  return execFileSync('powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT, ...args],
    { encoding: 'utf8' });
}

// B6: these two argument-validation diagnostics used to reach the caller
// through Write-Host, which — unlike review.sh's `>&2` equivalents for the
// same two checks — does not write to the real stderr stream; PowerShell's
// host-output stream is a distinct thing. A caller that reads only stderr
// for diagnostics (a scheduled task's error log, a `2>&1` split for a log
// file) saw nothing for a bad argument, only the correct exit code.
test('review.ps1 -Mode pr without -Pr exits 2 and writes to stderr, not stdout', { skip }, () => {
  try {
    runPs1(['-Repo', '.', '-Mode', 'pr']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /-Mode pr requires -Pr/, 'the diagnostic must reach stderr');
    assert.equal(String(err.stdout).includes('-Mode pr requires'), false,
      'the diagnostic must not land on stdout instead');
  }
});

test('review.ps1 with a nonexistent -Repo exits 2 and writes to stderr, not stdout', { skip }, () => {
  try {
    runPs1(['-Repo', 'C:\\definitely\\does\\not\\exist\\crm-test']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /is not a directory/, 'the diagnostic must reach stderr');
    assert.equal(String(err.stdout).includes('is not a directory'), false,
      'the diagnostic must not land on stdout instead');
  }
});
