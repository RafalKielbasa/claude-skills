import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectReplies } from '../lib/coverage.mjs';

const file = (path, size = 10) => ({ path, added: 1, removed: 0, size });
const selected = [
  { axisId: 'correctness', parts: [
    { label: 'correctness#1', index: 1, of: 2, files: [file('a.ts'), file('b.ts')] },
    { label: 'correctness#2', index: 2, of: 2, files: [file('c.ts'), file('gone.ts', 0)] },
  ] },
  { axisId: 'secrets', parts: [{ label: 'secrets', index: 1, of: 1, files: [file('a.ts')] }] },
];
const finding = (path) => ({ axis: 'correctness', file: path, lines: [1, 1], severity: 'blocking', claim: 'c', evidence: 'e' });

test('findings of every part are flattened in plan order', () => {
  const out = collectReplies(selected, {
    secrets: { findings: [finding('a.ts')], read: ['a.ts'], searches: [] },
    'correctness#1': { findings: [finding('b.ts')], read: ['a.ts', 'b.ts'], searches: ['git grep x'] },
    'correctness#2': { findings: [], read: ['c.ts'], searches: [] },
  });
  assert.deepEqual(out.findings.map((f) => f.file), ['b.ts', 'a.ts']);
  assert.deepEqual(out.incomplete, []);
});

// The defect this exists for: an agent that ran one command and answered `[]`
// was counted as a clean part. No findings and no file read is not a review.
test('an empty reply without a single file read marks the part incomplete', () => {
  const out = collectReplies(selected, {
    secrets: { findings: [], read: [], searches: ['git diff'] },
    'correctness#1': { findings: [], read: ['a.ts'], searches: [] },
    'correctness#2': { findings: [] },
  });
  assert.deepEqual(out.incomplete, ['correctness#2', 'secrets']);
});

test('a part with no reply, or a reply that is not the agreed object, is incomplete', () => {
  const out = collectReplies(selected, {
    'correctness#1': null,
    'correctness#2': 'the files look fine',
  });
  assert.deepEqual(out.incomplete, ['correctness#1', 'correctness#2', 'secrets']);
  assert.deepEqual(out.findings, []);
});

// The old contract: a bare array. Its findings still pass the evidence gate
// later, so they are kept; an empty one proves nothing.
test('a bare array is read as findings without a reading list', () => {
  const out = collectReplies(selected, {
    'correctness#1': [finding('a.ts')],
    'correctness#2': [],
    secrets: { findings: [], read: ['a.ts'], searches: [] },
  });
  assert.deepEqual(out.findings.map((f) => f.file), ['a.ts']);
  assert.deepEqual(out.incomplete, ['correctness#2']);
});

test('coverage names the listed files a part did not read, ignoring deleted ones', () => {
  const out = collectReplies(selected, {
    'correctness#1': { findings: [], read: ['./a.ts'], searches: [] },
    'correctness#2': { findings: [], read: ['c.ts', 'elsewhere.ts'], searches: ['rg lock'] },
    secrets: { findings: [], read: ['a.ts'], searches: [] },
  });
  const byLabel = Object.fromEntries(out.coverage.map((c) => [c.label, c]));
  assert.deepEqual(byLabel['correctness#1'].unread, ['b.ts']);
  assert.equal(byLabel['correctness#1'].read, 1);
  assert.deepEqual(byLabel['correctness#2'].unread, [], 'gone.ts has no content to read');
  assert.equal(byLabel['correctness#2'].searches, 1);
});

test('a reply under a label the plan does not know is reported, not merged', () => {
  const out = collectReplies(selected, {
    'correctness#3': { findings: [finding('z.ts')], read: ['z.ts'], searches: [] },
  });
  assert.deepEqual(out.unknownLabels, ['correctness#3']);
  assert.deepEqual(out.findings, []);
});

// D3: findings made from the diff alone, with no file opened, are flagged.
test('a part with findings and no file read is diffOnly; one with a file read is not', () => {
  const out = collectReplies(selected, {
    'correctness#1': { findings: [finding('a.ts')], read: [], searches: ['git diff'] },
    'correctness#2': { findings: [finding('c.ts')], read: ['c.ts'], searches: [] },
    secrets: { findings: [], read: [], searches: [] },
  });
  const byLabel = Object.fromEntries(out.coverage.map((c) => [c.label, c]));
  assert.equal(byLabel['correctness#1'].diffOnly, true);
  assert.deepEqual(byLabel['correctness#1'].unread, ['a.ts', 'b.ts']);
  assert.equal(byLabel['correctness#2'].diffOnly, false);
  assert.equal(byLabel.secrets.incomplete, true, 'the incomplete part is marked, so the report does not list it twice');
  assert.equal(byLabel['correctness#1'].incomplete, false);
});

test('an axis that reads by search has no unread files and is never diffOnly', () => {
  const searchAxis = { id: 'secrets', reads: 'search' };
  const fileAxis = { id: 'quality', reads: 'files' };
  const plan = [
    { axisId: 'secrets', axes: [searchAxis], parts: [{ label: 'secrets', index: 1, of: 1, files: [file('a.ts'), file('b.ts')] }] },
    // A grouped entry counts as search-only only when every member axis is.
    { axisId: 'web', axes: [searchAxis, fileAxis], parts: [{ label: 'web', index: 1, of: 1, files: [file('a.ts')] }] },
  ];
  const out = collectReplies(plan, {
    secrets: { findings: [finding('a.ts')], read: [], searches: ['git grep -n token'] },
    web: { findings: [finding('a.ts')], read: [], searches: [] },
  });
  const byLabel = Object.fromEntries(out.coverage.map((c) => [c.label, c]));
  assert.deepEqual(byLabel.secrets.unread, []);
  assert.equal(byLabel.secrets.diffOnly, false);
  assert.deepEqual(byLabel.web.unread, ['a.ts']);
  assert.equal(byLabel.web.diffOnly, true);
});
