import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { posixPath, voiceForkSettings, writeVoiceForkSettings } from '../lib/settings.mjs';

test('posixPath lower-cases the drive, turns backslashes into slashes and keeps spaces', () => {
  assert.equal(posixPath('C:\\Users\\rafal\\hub data\\x'), '//c/Users/rafal/hub data/x');
  assert.equal(posixPath('D:/Praca/Devstock/Baza wiedzy'), '//d/Praca/Devstock/Baza wiedzy');
});

test('the fork may edit only the dialog directory and reads no secret', () => {
  const s = voiceForkSettings('C:/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk/**)']);
  assert.deepEqual(s.permissions.deny, ['Edit(./**)', 'Bash', 'EnterWorktree', 'Read(**/.env*)', 'Read(**/*.pem)',
    'Read(**/*.key)', 'Read(**/*credentials*)', 'Read(**/*secret*)', 'Read(**/auth.json)', 'Read(**/secrets.yaml)']);
});

test('a dialog directory with spaces keeps them in the allow rule', () => {
  const s = voiceForkSettings('C:\\Users\\rafal\\hub data\\d');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub data/d/**)']);
});

test('writeVoiceForkSettings writes fork-settings.json into the dialog directory', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'v-')), 'd');
  const path = writeVoiceForkSettings(dir);
  assert.equal(path, join(dir, 'fork-settings.json'));
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), voiceForkSettings(dir));
});
