import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from '../test-helpers/repo.mjs';
import { selectFixable } from '../lib/fixable.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');

// The selection rules are unit-tested against the pure function; the CLI's
// own guard is exercised directly below via --interactive. That flag replaced
// an earlier TTY check specifically so the guard could be tested without
// weakening it — a spawned test process never has a real terminal, but it can
// still choose whether to pass the flag, exactly as a human-driven caller would.
test('only codex-confirmed, scored findings are fixable', () => {
  const out = selectFixable([
    { id: 'f-01', severity: 'blocking', confidence: 92, codex: { verdict: 'confirms', reason: 'r', fix: 'do x' } },
    { id: 'f-02', severity: 'blocking', confidence: 92, codex: { verdict: 'rejects', reason: 'r', fix: null } },
    { id: 'f-03', severity: 'suggestion', confidence: 80, codex: null },
    { id: 'f-04', severity: 'blocking', confidence: null, codex: { verdict: 'confirms', reason: 'r', fix: 'x' } },
  ]);
  assert.deepEqual(out.fixable.map((f) => f.id), ['f-01']);
  assert.equal(out.skipped.length, 3);
  assert.match(out.skipped.find((s) => s.id === 'f-02').why, /rejects/);
  assert.match(out.skipped.find((s) => s.id === 'f-03').why, /no codex verdict/);
  assert.match(out.skipped.find((s) => s.id === 'f-04').why, /never scored/);
});

test('--ids narrows the set further', () => {
  const out = selectFixable([
    { id: 'f-01', severity: 'blocking', confidence: 92, codex: { verdict: 'confirms', reason: 'r', fix: 'x' } },
    { id: 'f-02', severity: 'blocking', confidence: 92, codex: { verdict: 'confirms', reason: 'r', fix: 'y' } },
  ], 'f-02');
  assert.deepEqual(out.fixable.map((f) => f.id), ['f-02']);
});

// The guard itself: without --interactive, the flow must not start unattended
// even if SKILL.md's instruction to pass it were ignored.
test('the CLI refuses to list fixable findings without --interactive', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  try {
    execFileSync(process.execPath, [CLI, 'fixable', '--repo', dir, '--run', 'anyrun'], { encoding: 'utf8' });
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /needs --interactive/);
  }
});

// Proves the guard is what --interactive lifts, and nothing else: past it,
// the command runs and fails for an unrelated reason (no findings.json for a
// run that was never planned), not for lack of a terminal.
test('the CLI proceeds past the guard once --interactive is passed', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  try {
    execFileSync(process.execPath, [CLI, 'fixable', '--repo', dir, '--run', 'anyrun', '--interactive'], { encoding: 'utf8' });
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /run anyrun has no findings\.json/);
  }
});
