import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFinding, dedupe, applyThresholds, assemble } from '../lib/findings.mjs';
import { recordTriage } from '../lib/triage.mjs';
import { emptyState } from '../lib/state.mjs';

// Line 3 is deliberately a short whole line: it is what proves the length rule
// has a whole-line exception. Append to this fixture, never restructure it —
// the other tests pin evidence to line 2.
const SOURCE = { 'a.ts': 'const x = 1;\nconst course = await prisma.course.findFirst({ where: { id } });\n@Public()\n' };
const sourceOf = (path) => SOURCE[path];

const base = {
  axis: 'security', file: 'a.ts', lines: [2, 2], severity: 'blocking',
  claim: 'query without tenant filter',
  evidence: 'const course = await prisma.course.findFirst({ where: { id } });',
};

test('a finding whose evidence appears verbatim is accepted', () => {
  assert.equal(validateFinding(base, sourceOf).ok, true);
});

test('a finding with invented evidence is rejected', () => {
  const out = validateFinding({ ...base, evidence: 'const course = await prisma.course.findMany();' }, sourceOf);
  assert.equal(out.ok, false);
  assert.match(out.why, /not found/);
});

test('a finding with no evidence is rejected', () => {
  assert.equal(validateFinding({ ...base, evidence: '' }, sourceOf).ok, false);
});

test('evidence differing only in whitespace still matches', () => {
  const spaced = { ...base, evidence: 'const  course = await prisma.course.findFirst({ where: { id } });' };
  assert.equal(validateFinding(spaced, sourceOf).ok, true);
});

test('evidence too short to identify anything is rejected', () => {
  const out = validateFinding({ ...base, evidence: 'con' }, sourceOf);
  assert.equal(out.ok, false);
  assert.match(out.why, /too short/);
});

test('a short quote that is a whole line is accepted', () => {
  assert.equal(validateFinding({ ...base, lines: [3, 3], evidence: '@Public()' }, sourceOf).ok, true);
  assert.equal(validateFinding({ ...base, lines: [3, 3], evidence: '  @Public()  ' }, sourceOf).ok, true,
    'the whole-line exemption compares the same way every other match here does');
});

test('a finding with no usable line range is refused, not quietly unchecked', () => {
  for (const lines of [undefined, [], [2], [0, 2], ['2', '2']]) {
    const out = validateFinding({ ...base, lines }, sourceOf);
    assert.equal(out.ok, false, `should refuse lines=${JSON.stringify(lines)}`);
    assert.match(out.why, /lines must be/);
  }
});

// A real quote at a fabricated location defeats the file:line pairing exactly
// as much as a fabricated quote would.
test('a real quote reported at the wrong lines is rejected, and says so', () => {
  const out = validateFinding({ ...base, lines: [9, 9] }, sourceOf);
  assert.equal(out.ok, false);
  assert.match(out.why, /not at the cited lines/);
});

test('duplicates collapse and keep the highest severity', () => {
  const out = dedupe([
    { ...base, severity: 'suggestion', lines: [2, 2] },
    { ...base, severity: 'blocking', lines: [2, 4], claim: 'query, without the tenant filter' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].severity, 'blocking');
  assert.deepEqual(out[0].lines, [2, 4]);
});

test('thresholds are per severity', () => {
  const { kept, dropped } = applyThresholds(
    [{ ...base, confidence: 80 }, { ...base, severity: 'suggestion', confidence: 75 }],
    { blocking: 85, suggestion: 70, nitpick: 70 },
  );
  assert.equal(kept.length, 1);
  assert.equal(kept[0].severity, 'suggestion');
  assert.equal(dropped.length, 1);
});

test('assemble drops suppressed findings and reports them separately', () => {
  const state = recordTriage(emptyState(), base, { verdict: 'rejected', scope: 'here', reason: 'public by design' });
  const out = assemble({ run: { id: 'r1' }, findings: [{ ...base, confidence: 95 }], triage: state.triage, today: '2026-09-04' });
  assert.equal(out.findings.length, 0);
  assert.equal(out.suppressed.length, 1);
  assert.match(out.suppressed[0].reason, /public by design/);
});

test('a finding exactly at its floor passes, and an unknown severity never does', () => {
  const { kept, dropped } = applyThresholds(
    [{ ...base, severity: 'blocking', confidence: 85 }, { ...base, severity: 'unknown', confidence: 100 }],
    { blocking: 85, suggestion: 70, nitpick: 70 },
  );
  assert.deepEqual(kept.map((f) => f.severity), ['blocking']);
  assert.deepEqual(dropped.map((f) => f.severity), ['unknown']);
});

test('ids follow severity, so f-01 is genuinely the most severe finding', () => {
  const out = assemble({
    run: { id: 'r1' },
    findings: [
      { ...base, severity: 'nitpick', confidence: 95, claim: 'trailing whitespace here' },
      { ...base, severity: 'blocking', confidence: 95, claim: 'query without tenant filter' },
      { ...base, severity: 'suggestion', confidence: 95, claim: 'extract this helper' },
    ],
    triage: [], today: '2026-09-04',
  });
  assert.deepEqual(out.findings.map((f) => [f.id, f.severity]),
    [['f-01', 'blocking'], ['f-02', 'suggestion'], ['f-03', 'nitpick']]);
});

test('ids are stable and sequential', () => {
  const out = assemble({
    run: { id: 'r1' },
    findings: [{ ...base, confidence: 95 }, { ...base, file: 'b.ts', confidence: 95 }],
    triage: [], today: '2026-09-04',
  });
  assert.deepEqual(out.findings.map((f) => f.id), ['f-01', 'f-02']);
});
