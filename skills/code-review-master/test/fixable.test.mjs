import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from '../test-helpers/repo.mjs';
import { selectFixable } from '../lib/fixable.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');

// The selection rules are unit-tested against the pure function, because the
// CLI refuses to run without a terminal and a spawned test process never has
// one. Weakening the guard to make it testable would defeat the guard.
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

// The guard itself, exercised the only honest way: a spawned process has no
// terminal, so this is exactly the situation the guard exists to refuse.
test('the CLI refuses to list fixable findings without a terminal', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  try {
    execFileSync(process.execPath, [CLI, 'fixable', '--repo', dir, '--run', 'anyrun'], { encoding: 'utf8' });
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /refused without a terminal/);
  }
});
