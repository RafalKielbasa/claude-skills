import { test } from 'node:test';
import assert from 'node:assert/strict';
import { partLabel, partition, buildParts } from '../lib/parts.mjs';

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

test('parts are balanced by churn', () => {
  const files = [100, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10].map((n, i) => file(`f${i}.ts`, n));
  const sums = partition(files, 2).map((p) => p.reduce((s, f) => s + churn(f), 0));
  assert.deepEqual(sums, [100, 100]);
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
