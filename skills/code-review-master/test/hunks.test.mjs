import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHunks, overlapsHunks, changedHunks } from '../lib/hunks.mjs';

test('added ranges are read from the new side', () => {
  const patch = [
    'diff --git a/a.ts b/a.ts',
    '--- a/a.ts',
    '+++ b/a.ts',
    '@@ -3,0 +4,2 @@',
    '+one',
    '+two',
    '@@ -10 +12 @@',
    '-old',
    '+new',
  ].join('\n');
  assert.deepEqual(parseHunks(patch).get('a.ts'), [[4, 5], [12, 12]]);
});

test('a pure deletion adds no range', () => {
  const patch = ['--- a/a.ts', '+++ b/a.ts', '@@ -7,2 +6,0 @@', '-x', '-y'].join('\n');
  assert.equal(parseHunks(patch).get('a.ts')?.length ?? 0, 0);
});

test('a deleted file is absent', () => {
  const patch = ['--- a/gone.ts', '+++ /dev/null', '@@ -1,2 +0,0 @@', '-x', '-y'].join('\n');
  assert.equal(parseHunks(patch).has('gone.ts'), false);
});

test('overlap is inclusive at both ends', () => {
  const hunks = new Map([['a.ts', [[4, 5]]]]);
  assert.equal(overlapsHunks(hunks, 'a.ts', [5, 9]), true);
  assert.equal(overlapsHunks(hunks, 'a.ts', [6, 9]), false);
  assert.equal(overlapsHunks(hunks, 'a.ts', [1, 4]), true);
});

test('changedHunks returns null when the diff cannot be computed', () => {
  let called = false;
  const gh = () => { called = true; throw new Error('no network'); };
  assert.equal(changedHunks({ repo: '.', plan: { mode: 'pr', target: { pr: 42 } }, gh }), null);
  assert.equal(called, true);
});

test('changedHunks asks gh for the PR diff in pr mode', () => {
  const calls = [];
  const gh = (args) => { calls.push(args); return ''; };
  changedHunks({ repo: '.', plan: { mode: 'pr', target: { pr: 42 } }, gh });
  assert.deepEqual(calls, [['pr', 'diff', '42']]);
});

test('changedHunks runs a config-independent git diff in branch mode', () => {
  const calls = [];
  const git = (args) => { calls.push(args); return '+++ b/a.ts\n@@ -1,0 +2 @@\n+x\n'; };
  const plan = { mode: 'branch', target: { base: 'abc123' } };
  const hunks = changedHunks({ repo: '.', plan, git });
  assert.deepEqual(calls, [['-c', 'core.quotepath=false', 'diff', '--no-color', '--no-ext-diff',
    '--src-prefix=a/', '--dst-prefix=b/', '-U0', 'abc123', 'HEAD']]);
  assert.deepEqual(hunks.get('a.ts'), [[2, 2]]);
  const failing = () => { throw new Error('bad revision'); };
  assert.equal(changedHunks({ repo: '.', plan, git: failing }), null);
});

test('an added line that looks like a file header does not reset the file', () => {
  const patch = [
    '--- a/a.ts', '+++ b/a.ts',
    '@@ -0,0 +1,2 @@', '+++ not a header', '+x',
    '@@ -9 +11 @@', '-old', '+new',
  ].join('\n');
  const hunks = parseHunks(patch);
  assert.deepEqual([...hunks.keys()], ['a.ts']);
  assert.deepEqual(hunks.get('a.ts'), [[1, 2], [11, 11]]);
});
