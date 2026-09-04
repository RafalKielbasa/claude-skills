import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(ROOT, 'templates', name), 'utf8');

test('the shipped global template parses and validates', () => {
  const doc = parseConfigDoc(read('global.md'));
  assert.ok(doc.axes.length >= 2, 'ships at least the universal axes');
  assert.deepEqual(validateConfig(mergeConfig(doc, { settings: {}, axes: [] })), []);
});

test('the global template declares the report language and the false-positive list', () => {
  const text = read('global.md');
  assert.match(text, /Polish/);
  assert.match(text, /pre-existing/);
  assert.match(text, /linter, typechecker/);
});

test('the config skeleton parses and validates once its placeholder axis is kept', () => {
  const doc = parseConfigDoc(read('config.md'));
  assert.deepEqual(validateConfig(mergeConfig({ settings: {}, axes: [] }, doc)), []);
});
