import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, saveConfig } from '../lib/config.mjs';

test('the shipped config allows notatki and .claude and stores dialogs outside ~/.claude', () => {
  const c = loadConfig();
  assert.deepEqual(c.allow, ['notatki', '.claude']);
  assert.equal(c.dialogRoot, 'C:/Users/rafal/hub-data');
  assert.deepEqual(c.agent, { agentId: null, toolId: null });
  assert.ok(['contextual-update', 'disable-during-tool'].includes(c.interruption));
});

test('saveConfig round-trips and writes pretty JSON with a trailing newline', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'c-')), 'config.json');
  const c = { ...loadConfig(), agent: { agentId: 'a1', toolId: 't1' } };
  saveConfig(c, path);
  assert.deepEqual(loadConfig(path), c);
  assert.ok(readFileSync(path, 'utf8').endsWith('}\n'));
});
