import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'review.sh');

// A stub that writes its argv to a file and exits with the code we ask for.
function stub(dir, exitCode) {
  const path = join(dir, 'claude-stub');
  writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' "$@" > "${dir}/argv.txt"\nexit ${exitCode}\n`);
  chmodSync(path, 0o755);
  return path;
}

const runWrapper = (dir, code, args) => {
  try {
    execFileSync('sh', [SCRIPT, ...args], { env: { ...process.env, CRM_CLAUDE_BIN: stub(dir, code) }, encoding: 'utf8' });
    return 0;
  } catch (err) {
    return err.status;
  }
};

test('the wrapper propagates the gate exit code', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  assert.equal(runWrapper(dir, 0, ['--repo', dir, '--mode', 'since']), 0);
  assert.equal(runWrapper(dir, 1, ['--repo', dir, '--mode', 'since']), 1);
  assert.equal(runWrapper(dir, 2, ['--repo', dir, '--mode', 'since']), 2);
});

test('the wrapper never passes --slots and passes the mode through', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  runWrapper(dir, 0, ['--repo', dir, '--mode', 'pr', '--pr', '42']);
  const argv = readFileSync(join(dir, 'argv.txt'), 'utf8');
  assert.equal(argv.includes('--slots'), false, 'an unattended run must not be able to raise the budget');
  assert.match(argv, /code-review-master pr 42/);
});
