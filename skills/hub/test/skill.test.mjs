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

test('SKILL.md sends to a waiting session on one "wyślij" and quotes the check 6 notice (U1)', () => {
  const skill = read('../SKILL.md');
  assert.doesNotMatch(skill, /--confirm-waiting/);
  assert.doesNotMatch(skill, /confirms again/);
  assert.match(skill, /check 6[^\n]*warnings/);
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

test('SKILL.md handles the approvals flow: announce lines, typed text, voice send, the pause and the terminal', () => {
  const skill = read('../SKILL.md');
  const flat = skill.replace(/\s+/g, ' ');
  assert.match(skill, /^## Rafal's typed text$/m);
  assert.ok(skill.includes('HUB typed --prompt-file -'));
  assert.ok(skill.includes('announce:'));
  assert.ok(skill.includes('HUB voice send'));
  assert.ok(skill.includes('A voice decision is never „wyślij”, except'));
  assert.ok(skill.includes('No `PushNotification` while the overview shows `pauza od`'));
  assert.match(flat, /Never run `?ok`? or `?nie`?/);
  assert.ok(skill.includes('`! ok` needs a hub in a terminal'));
  assert.ok(flat.includes('After a ! command, reply with one line at most'));
  assert.ok(flat.includes('When its stdout says <code>: przyjęte, sprawdzam, run HUB outcome <code> and quote its output literally: that is your one line.'));
  assert.ok(flat.includes('Never say an approval happened unless the output of HUB outcome says so'));
  assert.ok(!flat.includes("the command's own output says so"));
  assert.ok(!flat.includes('the command already printed its outcome'));
  assert.match(read('../bin/hub.mjs'), /case 'outcome':/);
});

test('SKILL.md: an announce line also notifies when he is away, and a pause brings none', () => {
  const flat = read('../SKILL.md').replace(/\s+/g, ' ');
  assert.ok(flat.includes("When he is away, also use `PushNotification` with the item's first line."));
  assert.ok(flat.includes('A pause brings no `announce:`.'));
  assert.ok(!flat.includes('its output literally, nothing more: that quote'));
});

test('SKILL.md names what Czekać waits for, the other way to answer a prompt, the walk line and the row that is not computed', () => {
  const flat = read('../SKILL.md').replace(/\s+/g, ' ');
  assert.ok(flat.includes('"Czekać": when the watcher prints that session\'s `turn ended` or an `announce:` line for it (none comes in a pause), run `HUB prepare <id>` again'));
  assert.ok(flat.includes('so its message queues until Rafal answers the prompt in that session or with `! ok <code>`.'));
  assert.ok(flat.includes("he answers the session's permission prompts there himself, or with `! ok <code>` from the hub tab."));
  assert.ok(flat.includes('`przegląd: bieżąca a3`'));
  assert.ok(flat.includes('the break row of spec §10 is not computed'));
});

test('the role file holds the two exceptions to "wyślij" and still never answers a prompt', () => {
  const role = read('../role.md').replace(/\s+/g, ' ');
  assert.ok(role.includes('Never send a message to another session before Rafal has seen its exact text and said "wyślij". Two exceptions, only through HUB typed and HUB voice send: an answer he typed with an item\'s code, and a voice order read back and confirmed in a conversation he started with „dawaj”.'));
  assert.ok(role.includes('Never run ok or nie: only Rafal types them.'));
  assert.ok(role.includes('Never answer a permission prompt or a gate'));
});

test('SKILL.md keeps a ! command that already ran away from HUB typed', () => {
  const flat = read('../SKILL.md').replace(/\s+/g, ' ');
  assert.ok(flat.includes('A turn that carries the `<bash-input>` and `<bash-stdout>` of a `!` command has already run: do not pass it to HUB typed; reply with one line at most.'));
  assert.ok(flat.includes('The leading-`!` pass-through is for plain text only.'));
});
