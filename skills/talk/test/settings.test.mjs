import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { posixPath, voiceForkSettings, writeVoiceForkSettings } from '../lib/settings.mjs';

test('posixPath lower-cases the drive, turns backslashes into slashes and keeps spaces', () => {
  assert.equal(posixPath('C:\\Users\\rafal\\hub data\\x'), '//c/Users/rafal/hub data/x');
  assert.equal(posixPath('D:/Praca/Devstock/Baza wiedzy'), '//d/Praca/Devstock/Baza wiedzy');
});

test('the fork may edit only the dialog directory and reads no secret', () => {
  const s = voiceForkSettings('C:/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk', 'D:\\Notatki\\notatki');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk/**)']);
  assert.deepEqual(s.permissions.deny, ['Edit(//d/Notatki/notatki/**)', 'Bash', 'EnterWorktree', 'Read(**/.env*)', 'Read(**/*.pem)',
    'Read(**/*.key)', 'Read(**/*credentials*)', 'Read(**/*secret*)', 'Read(**/auth.json)', 'Read(**/secrets.yaml)']);
});

test('a working directory with a space keeps it in the deny rule, and no rule is relative', () => {
  const s = voiceForkSettings('C:\\Users\\rafal\\hub-data\\d', 'D:\\Praca\\Devstock\\Baza wiedzy');
  assert.equal(s.permissions.deny[0], 'Edit(//d/Praca/Devstock/Baza wiedzy/**)');
  assert.ok([...s.permissions.allow, ...s.permissions.deny].every((rule) => !rule.includes('(./')));
});

test('a dialog directory with spaces keeps them in the allow rule', () => {
  const s = voiceForkSettings('C:\\Users\\rafal\\hub data\\d', 'D:\\repo');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub data/d/**)']);
});

test('writeVoiceForkSettings writes fork-settings.json into the dialog directory', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'v-')), 'd');
  const cwd = 'D:\\repo';
  const path = writeVoiceForkSettings(dir, cwd);
  assert.equal(path, join(dir, 'fork-settings.json'));
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), voiceForkSettings(dir, cwd));
});

test('a relative dialog directory becomes absolute in the allow rule', () => {
  const s = voiceForkSettings('rel\\dialog', 'D:\\repo');
  assert.deepEqual(s.permissions.allow, [`Edit(${posixPath(resolve('rel\\dialog'))}/**)`]);
  assert.match(s.permissions.allow[0], /^Edit\(\/\/[a-z]\//);
});
