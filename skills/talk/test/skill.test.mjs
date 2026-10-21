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

test('SKILL.md keeps outward actions behind Rafal\'s word in text even when prompt.md or the repository orders a push', () => {
  const skill = read('../SKILL.md').replace(/\s+/g, ' ');
  assert.match(skill, /when `prompt\.md` orders them, and in a repository whose own rules push without asking/);
  assert.match(skill, /a voice decision is never that word\. Stop before the first such action/);
});

test('SKILL.md passes the subject single-quoted without single quotes, names the status line and the call lengths', () => {
  const skill = read('../SKILL.md');
  // Single quotes keep $, backticks and backslashes literal; the = form takes a subject that starts with -.
  assert.match(skill, /start --session \$\{CLAUDE_SESSION_ID\} --cwd "<session cwd>" \[--subject='<subject>'\]\n/);
  assert.doesNotMatch(skill, /--subject "/);
  assert.match(skill, /every\s+single quote \(`'`\) removed/);
  // The sentence is the status line of Rafal's reply protocol, not the whole reply.
  assert.match(skill, /End the turn\.\*\* Its status line[^\n]* is „Rozmowa głosowa otwarta w przeglądarce\.”/);
  assert.doesNotMatch(skill, /with exactly/);
  assert.match(skill, /`conversations:` line[\s\S]{0,200}call length of each/);
});
