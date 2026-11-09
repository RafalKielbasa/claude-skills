import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gateQuote, inputPreview, renderItem, renderQueue, clock } from '../lib/item.mjs';
import { emptyQueue, withQueue, readQueue } from '../lib/queue.mjs';
import { writePending } from '../lib/pending.mjs';
import { tempRoot, ev } from './helpers.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const MARKER = '⏸ Czeka na decyzję: wybór A albo B.';
const gate = (question) => `---\n## Temat\n### 🎯 STATUS / DECYZJA\nWybierz.\n\n### ❓ PYTANIE I WARIANTY\n${question}\n\n<details><summary>Szczegóły</summary>\nlogi\n</details>\n\n${MARKER}`;

test('gateQuote: from under the question heading up to <details>, verbatim, marker included', () => {
  const question = 'Rekomendacja: A.\n[A] pierwszy `kod`\n[B] drugi';
  const result = gateQuote(gate(question));
  assert.equal(result.text, `${question}\n${MARKER}`);
  assert.equal(result.hiddenChars, 0);
});

test('gateQuote: the heading section also stops at the marker line when there are no details', () => {
  const result = gateQuote(`### ❓ PYTANIE I WARIANTY\n[A] x\n${MARKER}`);
  assert.equal(result.text, `[A] x\n${MARKER}`);
});

test('gateQuote: without the heading it returns the last 12 non-empty lines before the marker', () => {
  const lines = Array.from({ length: 20 }, (_, i) => `linia ${i + 1}`);
  const result = gateQuote(`${lines.join('\n\n')}\n${MARKER}`);
  assert.equal(result.text, `${lines.slice(8).join('\n')}\n${MARKER}`);
});

test('gateQuote: over 4000 characters the body is cut, hiddenChars says how much, the marker stays', () => {
  const result = gateQuote(gate('x'.repeat(5000)));
  assert.equal(result.hiddenChars, 1000);
  assert.equal(result.text, `${'x'.repeat(4000)}\n${MARKER}`);
});

test('inputPreview: Bash shows the command, Write and Edit the path and sizes, others JSON', () => {
  assert.equal(inputPreview('Bash', { command: 'ls -la', description: 'harmless' }, '/p.json'), 'ls -la');
  assert.match(inputPreview('Write', { file_path: '/a/b.md', content: 'abcd' }, '/p.json'), /^\/a\/b\.md .*4 znaków/);
  assert.match(inputPreview('Edit', { file_path: '/a/b.md', old_string: 'ab', new_string: 'xyz' }, '/p.json'), /^\/a\/b\.md .*2 znaków.*3/);
  assert.equal(inputPreview('WebFetch', { url: 'https://e.x' }, '/p.json'), '{"url":"https://e.x"}');
});

test('inputPreview: beyond 1500 characters it ends with how much is hidden and where the whole is', () => {
  const out = inputPreview('Bash', { command: 'y'.repeat(1700) }, '/pending/p1.json');
  assert.ok(out.startsWith('y'.repeat(1500)));
  assert.ok(out.endsWith('(ukryto 200 znaków, całość: /pending/p1.json)'));
});

const SINCE = Date.parse('2026-11-06T09:15:00');
const decision = { key: 's|1', kind: 'decision', since: SINCE, code: 'a3', name: 'Sesja', project: 'App', answerable: true, askTool: null, pendingId: null };

test('renderItem: a decision shows the header, the quote, the message path and the fixed last line with its own code', () => {
  const out = renderItem(decision, { message: gate('[A] x'), messagePath: '/r/s.last/x.md' }).split('\n');
  assert.equal(out[0], `a3 · Sesja (App) · Decyzja do podjęcia · czeka od ${clock(SINCE)}`);
  assert.ok(out.includes('[A] x'));
  assert.ok(out.includes(MARKER));
  assert.ok(out.includes('Cała wiadomość: /r/s.last/x.md'));
  assert.equal(out.at(-1), '`dawaj` omawia głosem, `a3 <tekst>` idzie do sesji, `dalej` pomija');
});

test('renderItem: a long quote says how much is hidden', () => {
  assert.match(renderItem(decision, { message: gate('x'.repeat(4100)), messagePath: '/m' }), /\(ukryto 100 znaków\)/);
});

test('renderItem: a permission shows the literal command, not the description, and the ok/nie line', () => {
  const item = { ...decision, kind: 'permission', pendingId: 'p1' };
  const pending = { tool: 'Bash', target: 'Tylko opis', input: { command: 'rm -rf build', description: 'Tylko opis' } };
  const out = renderItem(item, { pending, pendingPath: '/pending/p1.json' }).split('\n');
  assert.equal(out[0], `a3 · Sesja (App) · Uprawnienia do zaakceptowania · czeka od ${clock(SINCE)}`);
  assert.equal(out[1], 'Bash: rm -rf build');
  assert.ok(!out.join('\n').includes('Tylko opis'));
  assert.equal(out.at(-1), '`! ok a3` zatwierdza, `! nie a3` odmawia, `dalej` pomija');
});

test('renderItem: an item with no hook behind it ends with the answer-in-session line', () => {
  const item = { ...decision, kind: 'permission', answerable: false };
  assert.equal(renderItem(item, {}).split('\n').at(-1), 'Odpowiedz w sesji Sesja. `dalej` pomija.');
});

test('renderItem: an ask tool item is the title line and the no-hook line, with no quote: the last message is not the question asked', () => {
  for (const askTool of ['AskUserQuestion', 'ExitPlanMode']) {
    const out = renderItem({ ...decision, answerable: false, askTool }, { message: gate('[A] x'), messagePath: '/m' }).split('\n');
    assert.deepEqual(out, [`a3 · Sesja (App) · Decyzja do podjęcia · czeka od ${clock(SINCE)}`, 'Odpowiedz w sesji Sesja. `dalej` pomija.']);
  }
});

test('renderQueue: open items oldest first, pauza first when paused, skipped and answered left out', () => {
  const state = emptyQueue();
  const mk = (key, since, extra = {}) => ({ ...decision, key, since, code: key, ...extra });
  state.items = { n: mk('a2', 2000), o: mk('a1', 1000), s: mk('a3', 500, { skippedAt: 1 }), d: mk('a4', 400, { answeredAt: 1 }) };
  assert.deepEqual(renderQueue(state).split('\n').map((line) => line.slice(0, 2)), ['a1', 'a2']);
  state.mode = 'paused';
  state.pausedAt = SINCE;
  assert.equal(renderQueue(state).split('\n')[0], `pauza od ${clock(SINCE)}`);
});

test('renderQueue: a walk names its current item when it is open and has a code', () => {
  const state = emptyQueue();
  const item = { ...decision, key: 's|1' };
  state.items = { 's|1': item };
  state.mode = 'walking';
  state.walkCurrent = 's|1';
  assert.equal(renderQueue(state).split('\n')[0], 'przegląd: bieżąca a3');
  for (const fields of [{ answeredAt: 1 }, { skippedAt: 1 }, { code: null }]) {
    state.items['s|1'] = { ...item, ...fields };
    assert.ok(!renderQueue(state).includes('przegląd'), JSON.stringify(fields));
  }
  state.items['s|1'] = item;
  state.walkCurrent = null;
  assert.ok(!renderQueue(state).includes('przegląd'));
  state.walkCurrent = 'gone|1';
  assert.ok(!renderQueue(state).includes('przegląd'));
  state.walkCurrent = 's|1';
  state.mode = 'listening';
  assert.ok(!renderQueue(state).includes('przegląd'));
});

test('the overview names a walk\'s current item', () => {
  const { root, hub, log } = setup();
  const at = new Date(Date.now() - 200000).toISOString();
  log('s1', [
    { id: 'e1', at, event: 'UserPromptSubmit', cwd: 'C:\\repo', promptId: 'p1', sessionTitle: 'Sesja' },
    { id: 'e2', at, event: 'Stop', cwd: 'C:\\repo', promptId: 'p1', marker: 'A czy B?' },
  ]);
  const key = 's1|' + Date.parse(at);
  writeFileSync(join(root, 'agents.json'), '[]');
  withQueue(root, (state) => {
    state.mode = 'walking';
    state.walkCurrent = key;
    state.items[key] = { ...decision, key, sessionId: 's1', since: Date.parse(at), code: 'a3' };
    state.codes.push({ n: 3, at: Date.now(), key, closedAt: null, name: 'Sesja' });
  });
  const out = hub('overview', '--agents-json', join(root, 'agents.json'));
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^przegląd: bieżąca a3$/m);
});

// --- the CLI

function setup() {
  const root = tempRoot();
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });
  const log = (sessionId, events) => {
    mkdirSync(join(root, 'registry'), { recursive: true });
    for (const event of events) appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), `${JSON.stringify({ ...event, sessionId })}\n`);
  };
  return { root, hub, log };
}

const ago = (ms) => new Date(Date.now() - ms).toISOString();

test('HUB item: unknown code, nothing announced, announced item gone, closed code', () => {
  const { root, hub } = setup();
  let result = hub('item', 'a9');
  assert.deepEqual([result.status, result.stderr.trim()], [3, 'a9: nie ma takiej pozycji']);
  result = hub('item');
  assert.deepEqual([result.status, result.stderr.trim()], [3, 'Nic jeszcze nie ogłoszono. Podaj kod, np. „dawaj a3”.']);
  withQueue(root, (state) => {
    state.lastAnnounced = 'a3';
    state.codes.push({ n: 3, at: Date.now(), key: 'gone', closedAt: Date.now(), name: 'x' });
  });
  result = hub('item');
  assert.deepEqual([result.status, result.stderr.trim()], [3, 'Ostatnio ogłoszona pozycja (a3) już nie czeka. Nic nie zrobiłem.']);
  result = hub('item', 'A3');
  assert.deepEqual([result.status, result.stderr.trim()], [3, 'a3: ta pozycja już nie czeka']);
});

test('HUB item a3 and bare HUB item print the announced permission with its literal command', () => {
  const { root, hub } = setup();
  writePending(root, { id: 'p1', sessionId: 's1', tool: 'Bash', target: 'opis', input: { command: 'git status' }, pid: process.pid, startedAt: Date.now() });
  withQueue(root, (state) => {
    state.items['s1|p:p1'] = { ...decision, key: 's1|p:p1', sessionId: 's1', kind: 'permission', pendingId: 'p1' };
    state.codes.push({ n: 3, at: Date.now(), key: 's1|p:p1', closedAt: null, name: 'Sesja' });
    state.lastAnnounced = 'a3';
  });
  for (const args of [['item', 'a3'], ['item']]) {
    const result = hub(...args);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^a3 · Sesja \(App\) · Uprawnienia do zaakceptowania/);
    assert.match(result.stdout, /Bash: git status/);
  }
});

test('HUB overview: lists a waiting session with a fresh code, then keeps the code; a paused queue prints pauza od', () => {
  const { root, hub, log } = setup();
  log('s1', [
    ev('UserPromptSubmit', ago(600000), { sessionTitle: 'Moja sesja' }),
    ev('Notification', ago(300000), { kind: 'permission_prompt' }),
  ]);
  const first = hub('overview', '--no-poll');
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /\na1 · Moja sesja \(.*\) · Uprawnienia do zaakceptowania · czeka od \d\d:\d\d/);
  assert.equal(readQueue(root).rowsAt, 0);
  const second = hub('overview', '--no-poll');
  assert.match(second.stdout, /\na1 · Moja sesja/);
  withQueue(root, (state) => {
    state.mode = 'paused';
    state.pausedAt = Date.now();
  });
  assert.match(hub('overview', '--no-poll').stdout, /\npauza od \d\d:\d\d\na1 · /);
  withQueue(root, (state) => {
    Object.values(state.items).forEach((item) => { item.skippedAt = Date.now(); });
  });
  assert.doesNotMatch(hub('overview', '--no-poll').stdout, /\na1 · /);
});

test('HUB overview: a corrupt queue.json does not cost the table, and the queue starts again', () => {
  const { root, hub, log } = setup();
  log('s1', [ev('UserPromptSubmit', ago(600000)), ev('Notification', ago(300000), { kind: 'permission_prompt' })]);
  writeFileSync(join(root, 'queue.json'), '{not json');
  const result = hub('overview', '--no-poll');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^\| Project/);
  assert.match(result.stdout, /\na1 · /);
});

test('HUB item: a decision quotes the last message of its session from the registry', () => {
  const { root, hub, log } = setup();
  mkdirSync(join(root, 'registry', 's1.last'), { recursive: true });
  writeFileSync(join(root, 'registry', 's1.last', 'x.md'), gate('[A] tak\n[B] nie'));
  log('s1', [ev('UserPromptSubmit', ago(60000)), ev('Stop', ago(50000), { marker: null, lastFile: 's1.last/x.md' })]);
  withQueue(root, (state) => {
    state.items['s1|1'] = { ...decision, key: 's1|1', sessionId: 's1' };
    state.codes.push({ n: 3, at: Date.now(), key: 's1|1', closedAt: null, name: 'Sesja' });
  });
  const result = hub('item', 'a3');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /\[A\] tak\n\[B\] nie\n⏸ Czeka na decyzję/);
  assert.ok(result.stdout.includes(`Cała wiadomość: ${join(root, 'registry', 's1.last', 'x.md')}`));
});

test('gateQuote: a CRLF message leaves no carriage return in the quote', () => {
  const result = gateQuote(gate('[A] x\n[B] y').replace(/\n/g, '\r\n'));
  assert.equal(result.text, `[A] x\n[B] y\n${MARKER}`);
  assert.ok(!result.text.includes('\r'));
});

test('gateQuote: a message without the marker returns the section alone', () => {
  assert.equal(gateQuote('### ❓ PYTANIE I WARIANTY\n[A] x\n\n<details>\nlogi').text, '[A] x');
  assert.equal(gateQuote('raz\ndwa').text, 'raz\ndwa');
});

test('gateQuote: an empty heading section returns the marker only', () => {
  assert.equal(gateQuote(`### ❓ PYTANIE I WARIANTY\n\n<details>x</details>\n${MARKER}`).text, MARKER);
});

test('renderItem: a permission whose pending record is gone is an item with no hook, with no ok line', () => {
  const out = renderItem({ ...decision, kind: 'permission', pendingId: 'p1' }, { pending: null, pendingPath: '/p.json' });
  assert.equal(out.split('\n').at(-1), 'Odpowiedz w sesji Sesja. `dalej` pomija.');
  assert.ok(!out.includes('! ok'));
});

test('renderItem: a decision whose last message cannot be read says so', () => {
  const out = renderItem(decision, {}).split('\n');
  assert.equal(out[1], '(nie udało się odczytać wiadomości sesji)');
  assert.equal(out.at(-1), '`dawaj` omawia głosem, `a3 <tekst>` idzie do sesji, `dalej` pomija');
});

test('HUB item: bare HUB item with a closed code entry says the announced item is gone', () => {
  const { root, hub } = setup();
  withQueue(root, (state) => {
    state.items['s1|1'] = { ...decision, key: 's1|1', sessionId: 's1' };
    state.codes.push({ n: 3, at: Date.now(), key: 's1|1', closedAt: Date.now(), name: 'Sesja' });
    state.lastAnnounced = 'a3';
  });
  const result = hub('item');
  assert.deepEqual([result.status, result.stderr.trim()], [3, 'Ostatnio ogłoszona pozycja (a3) już nie czeka. Nic nie zrobiłem.']);
});
