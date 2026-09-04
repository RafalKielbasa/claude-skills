import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYamlLite, YamlLiteError } from '../lib/yaml-lite.mjs';

test('parses scalars, inline maps and inline lists', () => {
  const out = parseYamlLite(`
gate: blocking
gate_on_disputed: true
budget: { slots: 5, max_files_per_axis: 40 }
exclude: ['**/node_modules/**', 'pnpm-lock.yaml']
`);
  assert.equal(out.gate, 'blocking');
  assert.equal(out.gate_on_disputed, true);
  assert.deepEqual(out.budget, { slots: 5, max_files_per_axis: 40 });
  assert.deepEqual(out.exclude, ['**/node_modules/**', 'pnpm-lock.yaml']);
});

test('parses block lists and one level of nesting', () => {
  const out = parseYamlLite(`
when:
  - apps/api/**
  - packages/**
codex:
  enabled: true
  timeout_s: 300
`);
  assert.deepEqual(out.when, ['apps/api/**', 'packages/**']);
  assert.deepEqual(out.codex, { enabled: true, timeout_s: 300 });
});

test('ignores comments outside quotes', () => {
  const out = parseYamlLite(`gate: blocking   # exit 1 on blocking\nid: 'a#b'\n`);
  assert.equal(out.gate, 'blocking');
  assert.equal(out.id, 'a#b');
});

test('refuses syntax outside the supported subset', () => {
  assert.throws(() => parseYamlLite('key: |\n  folded text\n'), YamlLiteError);
});

test('input outside the supported subset is refused, not guessed', () => {
  for (const bad of ["key: 'unterminated\n", 'key: [1, 2\n', 'key: {a: 1\n', 'key: &anchor value\n', 'key: !!str value\n']) {
    assert.throws(() => parseYamlLite(bad), YamlLiteError, `should refuse: ${bad.trim()}`);
  }
});

test('values that merely look exotic are still accepted', () => {
  const out = parseYamlLite("exclude: ['**/node_modules/**']\nglob: '**/*.tsx'\n");
  assert.deepEqual(out.exclude, ['**/node_modules/**']);
  assert.equal(out.glob, '**/*.tsx');
});
