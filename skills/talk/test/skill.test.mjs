import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('SKILL.md runs check in the foreground and start in the background with the session id', () => {
  const skill = read('../SKILL.md');
  assert.match(skill, /^---\nname: talk\ndescription: /);
  assert.match(skill, /check --cwd/);
  assert.match(skill, /start --session \$\{CLAUDE_SESSION_ID\}/);
  assert.match(skill, /run_in_background: true/);
});

test('SKILL.md uses the absolute CLI path, LF endings, a closed frontmatter, and reads the deletion result by its first segment', () => {
  const skill = read('../SKILL.md');
  assert.doesNotMatch(skill, /\r/);
  assert.match(skill, /^---\nname: talk\ndescription: [^\n]+\n---\n/);
  // The description is one plain YAML scalar: a ": " inside it would break the frontmatter.
  assert.doesNotMatch(skill.split('\n')[2].slice('description: '.length), /: | #/);
  assert.match(skill, /node "C:\/Users\/rafal\/\.claude\/skills\/talk\/bin\/talk\.mjs" check --cwd/);
  assert.match(skill, /node "C:\/Users\/rafal\/\.claude\/skills\/talk\/bin\/talk\.mjs" start --session/);
  assert.match(skill, /Rozmowa głosowa otwarta w przeglądarce\./);
  assert.match(skill, /Start-Process \(Get-Content -Raw '<dir>\\\.url'\)/);
  assert.match(skill, /deletion:/);
  assert.match(skill, /first `;`/);
  assert.match(skill, /stays at ElevenLabs/);
});
