import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readState, writeState, emptyState } from '../lib/state.mjs';

test('readState returns an empty state when the file is absent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  assert.deepEqual(readState(dir), emptyState());
});

test('writeState then readState round-trips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  const state = emptyState();
  state.last_reviewed_sha = 'a1f2e30';
  state.axis_cursor = ['conventions', 'git-history'];
  writeState(dir, state);
  assert.equal(readState(dir).last_reviewed_sha, 'a1f2e30');
  const raw = await readFile(join(dir, '.claude/review/state.json'), 'utf8');
  assert.match(raw, /\n$/, 'file ends with a newline');
});

test('readState rejects an unknown schema version', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  writeState(dir, { ...emptyState(), schema: 99 });
  assert.throws(() => readState(dir), /schema 99/);
});
