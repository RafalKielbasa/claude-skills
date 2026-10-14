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

test('the role file carries the hard rules and points at the skill', () => {
  const role = read('../role.md');
  assert.match(role, /invoke the skill `hub`/);
  assert.match(role, /"wyślij"/);
  assert.match(role, /Never answer a permission prompt or a gate/);
});
