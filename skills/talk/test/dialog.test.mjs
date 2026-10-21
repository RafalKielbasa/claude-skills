import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { dialogDirFor, prepareDialog } from '../lib/dialog.mjs';

test('dialog directories are named by minute and never reuse an existing one', () => {
  const root = mkdtempSync(join(tmpdir(), 't-'));
  const now = new Date(2026, 9, 21, 10, 15);
  const first = dialogDirFor({ root, projectKey: 'notatki', now });
  assert.equal(first, join(root, 'projects', 'notatki', 'dialogs', '2026-10-21-1015-talk'));
  mkdirSync(first, { recursive: true });
  const second = dialogDirFor({ root, projectKey: 'notatki', now });
  assert.equal(second, `${first}-2`);
  mkdirSync(second, { recursive: true });
  assert.equal(dialogDirFor({ root, projectKey: 'notatki', now }), `${first}-3`);
});

test('the project key is made safe for a directory name', () => {
  const root = mkdtempSync(join(tmpdir(), 't-'));
  const dir = dialogDirFor({ root, projectKey: 'my project', now: new Date(2026, 9, 21, 9, 5) });
  assert.equal(dir, join(root, 'projects', 'my-project', 'dialogs', '2026-10-21-0905-talk'));
});

test('a project key with leading dots loses them, so no dialog path holds a .claude directory', () => {
  const root = mkdtempSync(join(tmpdir(), 't-'));
  const dir = dialogDirFor({ root, projectKey: '.claude', now: new Date(2026, 9, 21, 9, 5) });
  assert.equal(dir, join(root, 'projects', 'claude', 'dialogs', '2026-10-21-0905-talk'));
});

test('prepareDialog takes the snapshot into context and writes fork-settings.json', () => {
  const repo = mkdtempSync(join(tmpdir(), 'repo-'));
  assert.equal(spawnSync('git', ['init', repo]).status, 0);
  const dialogDir = join(mkdtempSync(join(tmpdir(), 'dlg-')), 'd');
  const { snapshot, settingsPath } = prepareDialog({ cwd: repo, dialogDir });
  assert.equal(snapshot.git, true);
  assert.ok(existsSync(join(dialogDir, 'context')));
  assert.ok(existsSync(join(dialogDir, 'context', 'snapshot.json')));
  assert.equal(settingsPath, join(dialogDir, 'fork-settings.json'));
  assert.ok(existsSync(settingsPath));
});
