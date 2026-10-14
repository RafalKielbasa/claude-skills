import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEvent } from '../lib/events.mjs';
import { recordHook, readEvents } from '../lib/registry.mjs';
import { sha256 } from '../lib/text.mjs';
import { tempRoot, fixture } from './helpers.mjs';

const HOOK = fileURLToPath(new URL('../bin/hub-hook.mjs', import.meta.url));
const meta = (id = 'e1') => ({ id, at: '2026-10-14T10:00:00.000Z' });

test('every recorded kind keeps prompt_id and drops content', () => {
  const ups = buildEvent(fixture('UserPromptSubmit.json', { session_id: 's1', prompt_id: 'p1', prompt: 'tajny tekst' }), meta()).event;
  assert.equal(ups.promptId, 'p1');
  assert.equal(ups.promptHash, sha256('tajny tekst'));
  assert.ok(!JSON.stringify(ups).includes('tajny tekst'));

  const bash = buildEvent(fixture('PostToolUse-Bash.json', {
    session_id: 's1', tool_input: { command: 'curl -H "Authorization: secret"', description: 'Fetch status' },
  }), meta()).event;
  assert.equal(bash.tool, 'Bash');
  assert.equal(bash.target, 'Fetch status');
  assert.ok(!JSON.stringify(bash).includes('secret'));
  assert.ok(!('tool_response' in bash));

  const read = buildEvent(fixture('PostToolUse-Read.json', { tool_input: { file_path: 'C:\\repo\\a.md' } }), meta()).event;
  assert.equal(read.target, 'C:\\repo\\a.md');

  const end = buildEvent(fixture('SessionEnd.json', { reason: 'clear' }), meta()).event;
  assert.equal(end.reason, 'clear');
});

test('only a permission_prompt notification becomes an event', () => {
  assert.equal(buildEvent(fixture('Notification-idle_prompt.json'), meta()), null);
  assert.equal(buildEvent(fixture('Notification-permission_prompt.json'), meta()).event.kind, 'permission_prompt');
});

test('StopFailure records the documented error field', () => {
  const failure = buildEvent({ hook_event_name: 'StopFailure', session_id: 's1', prompt_id: 'p1', error: 'rate_limit', error_details: '429 Too Many Requests' }, meta()).event;
  assert.equal(failure.error, 'rate_limit');
  assert.equal(failure.errorDetails, '429 Too Many Requests');
});

test('a cross-session prompt records the sender and inner-text hashes, never the text', () => {
  const event = buildEvent(fixture('cross-session-UserPromptSubmit.json'), meta()).event;
  assert.equal(event.fromName, 'notatki-7a');
  assert.equal(event.innerHash, sha256('Probe S4: reply with the single word RECEIVED.'));
  assert.equal(event.sessionTitle, 'probe-recipient');
  assert.ok(!JSON.stringify(event).includes('RECEIVED'));
});

test('a multi-line inner text with <, & and " hashes the same raw or entity-decoded', () => {
  const text = 'Cel\nline <a> & "b"';
  const raw = `<cross-session-message from="x" from-name="hub" from-mode="auto">\n${text}\n</cross-session-message>`;
  const escaped = `<cross-session-message from="x" from-name="hub" from-mode="auto">\nCel\nline &lt;a&gt; &amp; &quot;b&quot;\n</cross-session-message>`;
  const rawEvent = buildEvent({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt: raw }, meta()).event;
  const escapedEvent = buildEvent({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt: escaped }, meta()).event;
  assert.equal(rawEvent.innerHash, sha256(text));
  assert.equal(escapedEvent.innerHashDecoded, sha256(text));
});

test('each Stop writes its own last-message file and the event references it', () => {
  const root = tempRoot();
  const first = recordHook(root, fixture('Stop-marker.json', { session_id: 's1', last_assistant_message: 'Pytanie?\n⏸ Czeka na decyzję: A czy B' }), meta('stop-1'));
  const second = recordHook(root, fixture('Stop-plain.json', { session_id: 's1', last_assistant_message: 'Gotowe.' }), meta('stop-2'));
  assert.equal(first.marker, 'A czy B');
  assert.equal(second.marker, null);
  assert.notEqual(first.lastFile, second.lastFile);
  assert.equal(readFileSync(join(root, 'registry', first.lastFile), 'utf8'), 'Pytanie?\n⏸ Czeka na decyzję: A czy B');
  assert.equal(readEvents(root, 's1').events.length, 2);
});

test('the hook script records an event and exits 0 on broken input and an unwritable root', () => {
  const root = tempRoot();
  const ok = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(fixture('UserPromptSubmit.json', { session_id: 's1', prompt: 'zażółć gęślą jaźń', cwd: 'D:\\Praca\\Devstock\\Baza wiedzy' })),
    env: { ...process.env, HUB_DATA: root },
  });
  assert.equal(ok.status, 0);
  const [event] = readEvents(root, 's1').events;
  assert.equal(event.cwd, 'D:\\Praca\\Devstock\\Baza wiedzy');
  assert.equal(event.promptHash, sha256('zażółć gęślą jaźń'));

  const broken = spawnSync(process.execPath, [HOOK], { input: 'not json', env: { ...process.env, HUB_DATA: root } });
  assert.equal(broken.status, 0);
  assert.equal(broken.stdout.length + broken.stderr.length, 0);

  const unwritable = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(fixture('UserPromptSubmit.json')),
    env: { ...process.env, HUB_DATA: 'Z:\\nonexistent\\hub' },
  });
  assert.equal(unwritable.status, 0);
  assert.equal(unwritable.stdout.length + unwritable.stderr.length, 0);
});

test('parallel hook processes of one session lose no event', async () => {
  const root = tempRoot();
  const runs = Array.from({ length: 12 }, (_, i) => new Promise((resolve) => {
    const child = spawn(process.execPath, [HOOK], { env: { ...process.env, HUB_DATA: root } });
    child.on('exit', resolve);
    child.stdin.end(JSON.stringify(fixture('PostToolUse-Read.json', { session_id: 's1', tool_input: { file_path: `f${i}` } })));
  }));
  await Promise.all(runs);
  const { events, broken } = readEvents(root, 's1');
  assert.equal(broken, 0);
  assert.equal(events.length, 12);
  assert.equal(new Set(events.map((event) => event.id)).size, 12);
  assert.ok(!existsSync(join(root, 'registry', 's1.last')));
});

test('the real multi-line wrapper from Task 3 confirms delivery of the sent text', () => {
  const event = buildEvent(fixture('cross-session-multiline.json'), meta()).event;
  const sent = readFileSync(new URL('./fixtures/cross-session-multiline.sent.md', import.meta.url), 'utf8');
  assert.equal(event.innerHash, sha256(sent));
  assert.equal(event.fromName, 'notatki-7a');
});
