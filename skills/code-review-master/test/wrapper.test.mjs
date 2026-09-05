import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'review.sh');

// `clearsSentinel` is what makes this a session that reached `crm finish`
// rather than one that died on the way: the real `finish` removes `.running`,
// so a stub that leaves it behind is exactly a crashed run — the case the
// sentinel exists to catch.
function stub(dir, exitCode, { clearsSentinel = true } = {}) {
  const path = join(dir, 'claude-stub');
  const clear = clearsSentinel ? `rm -f "${dir}/.claude/review/.running"\n` : '';
  writeFileSync(path, `#!/bin/sh\nprintf '%s\\n' "$@" > "${dir}/argv.txt"\n${clear}exit ${exitCode}\n`);
  chmodSync(path, 0o755);
  return path;
}

const runWrapper = (dir, code, args, opts = {}) => {
  try {
    execFileSync('sh', [SCRIPT, ...args], { env: { ...process.env, CRM_CLAUDE_BIN: stub(dir, code, opts) }, encoding: 'utf8' });
    return 0;
  } catch (err) {
    return err.status;
  }
};

// The wrapper's exit code comes from what the review recorded, never from the
// CLI's own status: `crm finish` runs inside the Claude session, so a clean
// `claude -p` exit says nothing about whether the gate passed.
function seedState(dir, exit) {
  const reviewDir = join(dir, '.claude', 'review');
  mkdirSync(reviewDir, { recursive: true });
  writeFileSync(join(reviewDir, 'state.json'), JSON.stringify({
    schema: 1, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
    pending_files: {}, triage: [], runs: [{ id: 'r1', artifact_url: null, exit }],
  }));
}

test('the wrapper exits with the recorded gate code, not with the CLI status', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  seedState(dir, 1);
  assert.equal(runWrapper(dir, 0, ['--repo', dir, '--mode', 'since']), 1,
    'a clean claude exit must not hide a failed gate');
  seedState(dir, 0);
  assert.equal(runWrapper(dir, 0, ['--repo', dir, '--mode', 'since']), 0);
});

test('a session that never reached crm finish exits 2, not 0', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  assert.equal(runWrapper(dir, 0, ['--repo', dir, '--mode', 'since']), 2,
    'no recorded run means the review broke, and that must not read as success');
});

// The failure the sentinel exists for: a repository that has been reviewed
// before, whose newest run says 0, and whose current session died on the way.
// Reading the last entry alone would report last night's pass as tonight's.
test('a died session does not inherit the previous run\'s verdict', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  seedState(dir, 0);
  // The wrapper's own `crm begin` writes the sentinel; this stub exits cleanly
  // without clearing it, which is precisely a session that died before
  // `crm finish`. No sentinel is planted by hand — the run creates its own.
  assert.equal(runWrapper(dir, 0, ['--repo', dir, '--mode', 'since'], { clearsSentinel: false }), 2,
    'a sentinel left behind means this run never finished, whatever the last one decided');
});

test('the wrapper never passes --slots and passes the mode through', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-wrap-'));
  runWrapper(dir, 0, ['--repo', dir, '--mode', 'pr', '--pr', '42']);
  const argv = readFileSync(join(dir, 'argv.txt'), 'utf8');
  assert.equal(argv.includes('--slots'), false, 'an unattended run must not be able to raise the budget');
  assert.match(argv, /code-review-master pr 42/);
});
