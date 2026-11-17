import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partLabel, partition, buildParts, assignFindings, describeIncomplete } from '../lib/parts.mjs';

const file = (path, added = 1) => ({ path, added, removed: 0, size: 100 });
const churn = (f) => f.added + f.removed;
const many = (n) => Array.from({ length: n }, (_, i) => file(`f${String(i).padStart(2, '0')}.ts`, n - i));

test('a part label is the bare axis id when there is one part', () => {
  assert.equal(partLabel('code-quality', 1, 1), 'code-quality');
  assert.equal(partLabel('a+b', 2, 3), 'a+b#2');
});

test('every file lands in exactly one part', () => {
  const files = many(25);
  const parts = partition(files, 3);
  assert.equal(parts.length, 3);
  const got = parts.flat().map((f) => f.path).sort();
  assert.deepEqual(got, files.map((f) => f.path).sort());
});

// Balanced within the per-part file cap: 100 alone against 40+30+30, then the
// zero-churn files top up the lighter-by-count part.
test('parts are balanced by churn', () => {
  const files = [100, 40, 30, 30, 0, 0].map((n, i) => file(`f${i}.ts`, n));
  const parts = partition(files, 2);
  assert.deepEqual(parts.map((p) => p.reduce((s, f) => s + churn(f), 0)), [100, 100]);
  assert.deepEqual(parts.map((p) => p.length), [3, 3]);
});

// Churn balance alone would hand one part nearly every file when a single
// file dominates; the cap keeps every part within ceil(n / count).
test('skewed churn never pushes a part past ceil(files / count)', () => {
  const cases = [
    [file('big.ts', 900), ...Array.from({ length: 23 }, (_, i) => file(`s${i}.ts`, 10))],
    [file('a.ts', 400), file('b.ts', 300),
      ...Array.from({ length: 34 }, (_, i) => ({ path: `t${i}.ts`, added: 5, removed: 2, size: 100 }))],
  ];
  for (const files of cases) {
    const count = Math.ceil(files.length / 12);
    const cap = Math.ceil(files.length / count);
    const parts = partition(files, count);
    assert.ok(parts.every((p) => p.length <= cap), `sizes ${parts.map((p) => p.length)} over ${cap}`);
    assert.deepEqual(parts.flat().map((f) => f.path).sort(), files.map((f) => f.path).sort());
    const built = buildParts('x', files, 12);
    assert.ok(built.every((p) => p.files.length <= 12), `buildParts sizes ${built.map((p) => p.files.length)}`);
  }
});

test('zero-churn files spread by count', () => {
  const files = Array.from({ length: 6 }, (_, i) => file(`z${i}.ts`, 0));
  assert.deepEqual(partition(files, 3).map((p) => p.length), [2, 2, 2]);
});

test('each part keeps the ranked input order', () => {
  const files = many(25);
  const idx = new Map(files.map((f, i) => [f.path, i]));
  for (const p of partition(files, 4)) {
    const order = p.map((f) => idx.get(f.path));
    assert.deepEqual(order, [...order].sort((a, b) => a - b));
  }
});

test('buildParts sizes parts by ceil(files / size)', () => {
  const parts = buildParts('x', many(25), 12);
  assert.equal(parts.length, 3);
  assert.deepEqual(parts.map((p) => p.label), ['x#1', 'x#2', 'x#3']);
  assert.ok(parts.every((p) => p.of === 3));
  const one = buildParts('x', many(12), 12);
  assert.equal(one.length, 1);
  assert.equal(one[0].label, 'x');
});

test('an empty file list yields one part labelled by the bare axis id', () => {
  assert.deepEqual(buildParts('x', [], 12), [{ label: 'x', index: 1, of: 1, files: [] }]);
});

const entry = (axisId, ...partFiles) => ({
  axisId,
  parts: partFiles.map((files, i) => ({
    label: partLabel(axisId, i + 1, partFiles.length), index: i + 1, of: partFiles.length, files: files.map((p) => file(p)),
  })),
});

test('a finding goes to the part holding its file', () => {
  const out = assignFindings([entry('q', ['a/x.ts'], ['b/y.ts'])], [{ id: 'f-01', axis: 'q', file: 'b/y.ts' }]);
  assert.deepEqual(out.parts['q#2'], ['f-01']);
  assert.deepEqual(out.parts['q#1'], []);
});

test('a finding on a foreign file maps to the part with the longest shared directory prefix', () => {
  const sel = [entry('q', ['apps/web/a.tsx'], ['apps/api/b.ts'])];
  const out = assignFindings(sel, [
    { id: 'f-01', axis: 'q', file: 'apps/api/c.ts' },
    { id: 'f-02', axis: 'q', file: 'README.md' },
  ]);
  assert.deepEqual(out.parts['q#2'], ['f-01']);
  assert.deepEqual(out.parts['q#1'], ['f-02']);
});

test('a finding on an unknown axis is reported, not dropped', () => {
  const out = assignFindings([entry('q', ['a.ts'])], [{ id: 'f-09', axis: 'zzz', file: 'a.ts' }]);
  assert.deepEqual(out.unassigned, ['f-09']);
  assert.deepEqual(out.parts.q, []);
});

test('single-part entries are keyed by their axisId', () => {
  const out = assignFindings([entry('secrets', ['a.ts'])], [{ id: 'f-01', axis: 'secrets', file: 'a.ts' }]);
  assert.deepEqual(Object.keys(out.parts), ['secrets']);
  assert.deepEqual(out.parts.secrets, ['f-01']);
});

test('a finding without a file falls to part 1 instead of throwing', () => {
  const out = assignFindings([entry('q', ['a/x.ts'], ['b/y.ts'])], [{ id: 'f-01', axis: 'q' }]);
  assert.deepEqual(out.parts['q#1'], ['f-01']);
  assert.deepEqual(out.unassigned, []);
});

test('equal non-zero directory prefixes tie to the lower-index part', () => {
  const out = assignFindings([entry('q', ['apps/api/a.ts'], ['apps/api/b.ts'])], [{ id: 'f-01', axis: 'q', file: 'apps/api/c.ts' }]);
  assert.deepEqual(out.parts['q#1'], ['f-01']);
  assert.deepEqual(out.parts['q#2'], []);
});

test('a finding naming a member axis of a grouped entry lands in that entry\'s part', () => {
  const grouped = {
    ...entry('web-frontend+web-design-system', ['a/x.ts'], ['b/y.ts']),
    axes: [{ id: 'web-frontend' }, { id: 'web-design-system' }],
  };
  const finding = { id: 'f-01', axis: 'web-frontend', file: 'b/y.ts' };
  const out = assignFindings([grouped], [finding]);
  assert.deepEqual(out.parts['web-frontend+web-design-system#2'], ['f-01']);
  assert.deepEqual(out.unassigned, []);
  assert.equal(finding.axis, 'web-frontend');
});

test('a finding path with backslashes or a leading ./ matches its part', () => {
  const out = assignFindings([entry('q', ['b/y.ts'], ['apps/x.ts'])], [
    { id: 'f-01', axis: 'q', file: './apps/x.ts' },
    { id: 'f-02', axis: 'q', file: 'apps\\x.ts' },
  ]);
  assert.deepEqual(out.parts['q#2'], ['f-01', 'f-02']);
  assert.deepEqual(out.parts['q#1'], []);
});

test('an incomplete part is described with its position and size', () => {
  const sel = [
    { axisId: 'code-quality', parts: [1, 2, 5].map((n, i) => ({
      label: `code-quality#${i + 1}`, index: i + 1, of: 3, files: Array.from({ length: n }, (_, k) => file(`f${k}.ts`)),
    })) },
    { axisId: 'secrets', parts: [{ label: 'secrets', index: 1, of: 1, files: [file('a.ts')] }] },
  ];
  const labels = ['code-quality#1', 'code-quality#2', 'code-quality#3', 'secrets', 'mystery'];
  assert.deepEqual(describeIncomplete(sel, labels, 'pl'), [
    'code-quality (część 1 z 3, 1 plik)', 'code-quality (część 2 z 3, 2 pliki)',
    'code-quality (część 3 z 3, 5 plików)', 'secrets', 'mystery',
  ]);
  assert.deepEqual(describeIncomplete(sel, labels, 'en'), [
    'code-quality (part 1 of 3, 1 file)', 'code-quality (part 2 of 3, 2 files)',
    'code-quality (part 3 of 3, 5 files)', 'secrets', 'mystery',
  ]);
});
