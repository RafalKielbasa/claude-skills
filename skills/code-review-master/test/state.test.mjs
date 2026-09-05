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

// pending_files changed shape from a flat array to a map keyed by mode. A
// state.json left over from before that change must not be read as-is: the
// array's indices would otherwise become permanent string keys ("0", "1", …)
// the next writeState bakes into the file, and every mode's lookup
// (`pending_files?.[mode]`) would silently see undefined, dropping the
// backlog with no error.
test('a legacy array pending_files loads as an empty map, not as numeric keys', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  writeState(dir, { ...emptyState(), pending_files: ['a.ts', 'b.ts'] });
  const state = readState(dir);
  assert.deepEqual(state.pending_files, {});
  writeState(dir, state);
  const raw = await readFile(join(dir, '.claude/review/state.json'), 'utf8');
  const onDisk = JSON.parse(raw);
  assert.deepEqual(onDisk.pending_files, {}, 'a rewrite must not bake the old array\'s indices in as keys');
  assert.equal('0' in onDisk.pending_files, false);
});
