import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { closingReport, readDialogFiles } from '../lib/report.mjs';

test('the closing report carries every dialog file or says it was not written', () => {
  const r = closingReport({ dialogDir: 'C:/d', origin: 'session', files: { decisions: '- CSV\n' }, deletion: 'deleted', conversations: [{ id: 'c1', seconds: 150 }, { id: 'c2', seconds: null }] });
  assert.match(r, /^TALK CLOSING REPORT\ndialog: C:\/d\norigin: session\ndeletion: deleted\nconversations: c1 \(150 s\), c2 \(unknown\)\n/);
  assert.match(r, /--- decisions\.md ---\n- CSV\n/);
  assert.match(r, /--- open-questions\.md ---\n\(not written\)\n/);
  assert.match(r, /--- prompt\.md ---\n\(not written\)\nEND OF REPORT\n$/);
});

test('the closing report names the origin right after the dialog line', () => {
  assert.match(closingReport({ dialogDir: 'd', origin: 'hub', files: {}, deletion: 'deleted', conversations: [] }), /^TALK CLOSING REPORT\ndialog: d\norigin: hub\ndeletion: /);
});

test('an empty conversation list prints conversations: none', () => {
  assert.match(closingReport({ dialogDir: 'C:/d', files: {}, deletion: 'deleted', conversations: [] }), /deletion: deleted\nconversations: none\n/);
});

test('readDialogFiles returns the files that exist and leaves the rest undefined', () => {
  const dir = mkdtempSync(join(tmpdir(), 'r-'));
  writeFileSync(join(dir, 'decisions.md'), '- CSV\n');
  assert.deepEqual(readDialogFiles(dir), { decisions: '- CSV\n', openQuestions: undefined, prompt: undefined });
});

test('readDialogFiles does not throw when the dialog directory is missing', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'r-')), 'gone');
  assert.deepEqual(readDialogFiles(dir), { decisions: undefined, openQuestions: undefined, prompt: undefined });
});
