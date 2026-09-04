import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { makeRepo, writeFiles, commitAll, git } from '../test-helpers/repo.mjs';
import { collectTarget, isEmpty } from '../lib/target.mjs';

test('working mode reports uncommitted changes with churn', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  writeFiles(dir, { 'a.ts': 'one\ntwo\n', 'b.ts': 'new\n' });
  const target = collectTarget(dir, 'working', {});
  const paths = target.files.map((f) => f.path).sort();
  assert.deepEqual(paths, ['a.ts', 'b.ts']);
  assert.equal(target.files.find((f) => f.path === 'a.ts').added, 1);
});

test('since mode diffs from the stored sha', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  // makeRepo already committed; the checkpoint is simply where it left HEAD.
  const base = git(dir, 'rev-parse', 'HEAD');
  writeFiles(dir, { 'c.ts': 'x\n' });
  commitAll(dir, 'add c');
  const target = collectTarget(dir, 'since', { base });
  assert.deepEqual(target.files.map((f) => f.path), ['c.ts']);
});

test('exclude patterns drop files', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  writeFiles(dir, { 'a.ts': 'two\n', 'pnpm-lock.yaml': 'lock\n' });
  const target = collectTarget(dir, 'working', { exclude: ['pnpm-lock.yaml'] });
  assert.deepEqual(target.files.map((f) => f.path), ['a.ts']);
});

test('an unchanged tree yields an empty target', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  assert.equal(isEmpty(collectTarget(dir, 'working', {})), true);
});

test('full mode lists tracked files from the cursor onwards', () => {
  const dir = makeRepo({ 'a.ts': '1\n', 'b.ts': '2\n', 'c.ts': '3\n' });
  const target = collectTarget(dir, 'full', { cursor: 'b.ts' });
  assert.deepEqual(target.files.map((f) => f.path), ['b.ts', 'c.ts']);
});

test('pr mode takes both shas from the pull request, not from the checkout', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const gh = (args) => {
    assert.deepEqual(args, ['pr', 'view', '42', '--json', 'files,headRefOid,baseRefOid']);
    return JSON.stringify({
      baseRefOid: 'base111', headRefOid: 'head222',
      files: [{ path: 'a.ts', additions: 3, deletions: 1 }],
    });
  };
  const target = collectTarget(dir, 'pr', { pr: 42, gh });
  assert.equal(target.base, 'base111');
  assert.equal(target.head, 'head222');
  assert.deepEqual(target.files.map((f) => f.path), ['a.ts']);
  assert.equal(target.files[0].added, 3);
});

test('every file carries its size, and a deleted file reports zero', () => {
  const dir = makeRepo({ 'a.ts': 'x'.repeat(100) + '\n', 'gone.ts': 'y\n' });
  writeFiles(dir, { 'a.ts': 'x'.repeat(100) + '\nmore\n' });
  execFileSync('git', ['-C', dir, 'rm', '-q', 'gone.ts']);
  const target = collectTarget(dir, 'working', {});
  assert.equal(target.files.find((f) => f.path === 'a.ts').size, 106);
  assert.equal(target.files.find((f) => f.path === 'gone.ts').size, 0);
});
