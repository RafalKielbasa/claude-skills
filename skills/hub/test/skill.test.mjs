import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('SKILL.md names the skill hub and every command it uses exists in the CLI usage', () => {
  const skill = read('../SKILL.md');
  assert.match(skill, /^---\nname: hub\ndescription: /);
  const usage = read('../bin/hub.mjs');
  for (const [, command] of skill.matchAll(/`HUB (\w+)/g)) {
    assert.match(usage, new RegExp(`case '${command}':`), `CLI handles ${command}`);
  }
  assert.ok(existsSync(fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url))));
});

test('SKILL.md describes the hub session without start flags (P10)', () => {
  const description = read('../SKILL.md').split('\n').find((line) => line.startsWith('description: '));
  assert.match(description, /working directory is ~\/\.claude\/hub/);
  assert.match(description, /~\/\.claude\/hub\/CLAUDE\.md gives it the hub role/);
  assert.doesNotMatch(description, /--append-system-prompt-file|--name hub/);
});

test('the role file carries the hard rules and points at the skill', () => {
  const role = read('../role.md');
  assert.match(role, /invoke the skill `hub`/);
  assert.match(role, /"wyślij"/);
  assert.match(role, /Never answer a permission prompt or a gate/);
});

test('SKILL.md starts a voice conversation through voice resolve and the talk CLI, and sends prompt.md only after wyślij', () => {
  const skill = read('../SKILL.md');
  assert.match(skill, /HUB voice resolve --session/);
  assert.match(skill, /talk\.mjs" check --cwd "<cwd>" --session <sessionId>/);
  assert.match(skill, /talk\.mjs" start --session <sessionId> --cwd "<cwd>" --origin hub/);
  // The name and the subject go single-quoted, as the talk skill passes --subject (voice spec §19.2 step 4).
  assert.ok(skill.includes(`talk.mjs" start --session <sessionId> --cwd "<cwd>" --origin hub --name='<name>' [--subject='<subject>']\``));
  assert.ok(skill.replace(/\s+/g, ' ').includes("with every single quote (`'`) removed"));
  assert.doesNotMatch(skill, /--name "<name>"/);
  assert.match(skill, /--path dialog --session <sessionId> --origin voice\//);
  assert.match(skill, /A voice decision is never „wyślij”/);
});

test('the role file allows the voice dialog directory as the one write outside the hub data', () => {
  // Compared with the line breaks folded, as the rule wraps in role.md.
  const role = read('../role.md').replace(/\s+/g, ' ');
  assert.ok(role.includes("- Write only into ~/.claude/hub/ (through the hub CLI); a voice conversation's dialog directory is written by the talk CLI in its own dialog root. Change nothing in project repositories and never edit the skill `hub` itself."), role);
});
