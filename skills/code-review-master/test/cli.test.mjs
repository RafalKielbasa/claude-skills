import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { makeRepo, writeFiles } from '../test-helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');
const run = (args, opts = {}) => execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...opts });

const CONFIG = `---
budget: { slots: 2, max_files_per_axis: 5 }
---

# demo

## Quality

\`\`\`yaml
id: quality
when: always
rank: always
\`\`\`

- Explicit return types.
`;

test('plan reports an empty target without selecting any axis', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, true);
  assert.equal(out.selection.agents, 0);
});

test('plan announces the budget for a real change', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, false);
  assert.equal(out.selection.selected.length, 1);
  assert.equal(out.selection.agents, 3);
});

test('a missing config.md exits 2 with a readable message', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /config\.md/);
  }
});

test('finish exits 1 when a blocking finding survives', () => {
  const dir = makeRepo({ 'a.ts': 'const course = findFirst({ where: { id } });\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'const course = findFirst({ where: { id } });\nchanged\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  const raw = join(dir, 'raw.json');
  writeFileSync(raw, JSON.stringify([{
    axis: 'quality', file: 'a.ts', lines: [1, 1], severity: 'blocking',
    claim: 'query without tenant filter', evidence: 'const course = findFirst({ where: { id } });',
  }]));
  const assembled = JSON.parse(run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', raw, '--json']));
  assert.deepEqual(assembled.findings.map((f) => f.id), ['f-01'], 'assemble assigns ids before verification');
  const scores = join(dir, 'scores.json');
  writeFileSync(scores, JSON.stringify([{ id: 'f-01', confidence: 95, note: 'confirmed' }]));
  run(['score', '--repo', dir, '--run', plan.runId, '--scores', scores, '--json']);
  try {
    run(['finish', '--repo', dir, '--run', plan.runId, '--json']);
    assert.fail('should have exited 1');
  } catch (err) {
    assert.equal(err.status, 1);
  }
});

test('a finding verification never scored is treated as unconfirmed, not as passing', () => {
  const dir = makeRepo({ 'a.ts': 'const course = findFirst({ where: { id } });\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'const course = findFirst({ where: { id } });\nchanged\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  const raw = join(dir, 'raw.json');
  writeFileSync(raw, JSON.stringify([{
    axis: 'quality', file: 'a.ts', lines: [1, 1], severity: 'blocking',
    claim: 'query without tenant filter', evidence: 'const course = findFirst({ where: { id } });',
  }]));
  run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', raw, '--json']);
  const scores = join(dir, 'scores.json');
  writeFileSync(scores, JSON.stringify([]));
  const scored = JSON.parse(run(['score', '--repo', dir, '--run', plan.runId, '--scores', scores, '--json']));
  assert.equal(scored.kept, 0);
  assert.equal(scored.belowThreshold, 1);
});

test('a subcommand run out of order exits 2, not 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  try {
    run(['finish', '--repo', dir, '--run', plan.runId, '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'a missing artefact is a broken run, not a failed gate');
    assert.match(String(err.stderr), /findings\.json/);
  }
});

test('a bare --slots is refused rather than read as 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--slots', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /--slots needs a number/);
  }
});

test('two plans in the same minute get distinct run ids', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const first = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'])).runId;
  const second = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'])).runId;
  assert.notEqual(first, second, 'colliding run ids overwrite each other\'s ledger');
});

test('a missing --raw file exits 2, not 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  try {
    run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', join(dir, 'nope.json'), '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /--raw points at/);
  }
});
