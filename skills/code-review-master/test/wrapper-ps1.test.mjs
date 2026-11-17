import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

// `crm plan` drops its confirmation gate on CRM_UNATTENDED=1, so the session
// review.ps1 starts must see it. The gate fails after a stub run, so the exit
// code is ignored; only what the stub saw matters. The space before ">" keeps
// cmd from reading "1>" as a handle redirect.
test('review.ps1 marks the session as unattended', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-ps1-'));
  const stub = join(dir, 'claude-stub.cmd');
  writeFileSync(stub, `@echo %CRM_UNATTENDED% > "${dir}\\env.txt"\r\n@exit /b 0\r\n`);
  // Without the runner's own CRM_UNATTENDED the assertion cannot pass vacuously.
  const env = { ...process.env, CRM_CLAUDE_BIN: stub };
  delete env.CRM_UNATTENDED;
  try {
    execFileSync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT, '-Repo', dir, '-Mode', 'since'],
      { encoding: 'utf8', stdio: 'pipe', env });
  } catch { /* the gate exits non-zero without a real run */ }
  assert.equal(readFileSync(join(dir, 'env.txt'), 'utf8').trim(), '1');
});

// Run interactively (`.\review.ps1` in Rafal's own window) the script shares
// the caller's process, so the marker must not outlive the run: a later
// `claude` from that window would otherwise skip the confirmation gate.
test('review.ps1 restores CRM_UNATTENDED in the calling session', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-ps1-'));
  const stub = join(dir, 'claude-stub.cmd');
  writeFileSync(stub, '@exit /b 0\r\n');
  const env = { ...process.env, CRM_CLAUDE_BIN: stub };
  delete env.CRM_UNATTENDED;
  const after = (before) => {
    const set = before === null ? '' : `$env:CRM_UNATTENDED = '${before}'; `;
    const out = execFileSync('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command',
        `${set}& '${SCRIPT}' -Repo '${dir}' -Mode since *> $null; "CRM_AFTER=[$env:CRM_UNATTENDED]"`],
      { encoding: 'utf8', stdio: 'pipe', env });
    return out.match(/CRM_AFTER=\[(.*)\]/)[1];
  };
  assert.equal(after(null), '', 'an unset marker stays unset');
  assert.equal(after('keep'), 'keep', 'a previous value comes back');
});
