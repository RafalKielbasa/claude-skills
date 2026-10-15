import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readTitle, resolveTitles } from '../lib/titles.mjs';
import { buildEvent } from '../lib/events.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { registerLaunched } from '../lib/hubsessions.mjs';
import { cleanup } from '../lib/retention.mjs';
import { tempRoot, fixture, ev } from './helpers.mjs';

const NOW = Date.parse('2026-10-14T12:00:00Z');
const line = (record) => `${JSON.stringify(record)}\n`;
const filler = (n) => line({ type: 'assistant', message: { content: 'x'.repeat(n) } });
const ai = (title) => line({ type: 'ai-title', aiTitle: title, sessionId: 's1' });
const custom = (title) => line({ type: 'custom-title', customTitle: title, sessionId: 's1' });

function transcript(...parts) {
  const path = join(tempRoot(), 'session.jsonl');
  writeFileSync(path, parts.join(''));
  return path;
}

test('readTitle returns the newest custom-title or ai-title record', () => {
  assert.deepEqual(readTitle(transcript(ai('Stary tytuł'), filler(50), ai('Biblioteka komponentów Codebusters'), filler(50))), { title: 'Biblioteka komponentów Codebusters', source: 'ai-title' });
  assert.deepEqual(readTitle(transcript(ai('Automatyczny'), custom('hub'), filler(10))), { title: 'hub', source: 'custom-title' });
  assert.equal(readTitle(transcript(filler(10))), null);
  assert.equal(readTitle(join(tempRoot(), 'missing.jsonl')), null);
});

test('readTitle finds a record far before the end and one split across chunks, Polish letters intact', () => {
  const path = transcript(ai('Moduł zerowy kursu agentów — pierwsza lekcja'), filler(300), filler(300));
  // 16-byte chunks split the title line, and its multi-byte letters, many times.
  assert.equal(readTitle(path, { chunkBytes: 16 }).title, 'Moduł zerowy kursu agentów — pierwsza lekcja');
  assert.equal(readTitle(path, { chunkBytes: 7 }).title, 'Moduł zerowy kursu agentów — pierwsza lekcja');
});

test('a transcript cut mid-line while Claude Code writes it: the broken line is skipped', () => {
  const path = transcript(ai('Pełny tytuł'), filler(20), '{"type":"ai-title","aiTitle":"Urwa');
  assert.equal(readTitle(path, { chunkBytes: 32 }).title, 'Pełny tytuł');
});

test('resolveTitles caches by transcript size and reads again only when the size changes', () => {
  const root = tempRoot();
  const path = transcript(ai('Tytuł A'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł A');
  // Same byte length, different title: the cached title is reused, so the file was not read again.
  writeFileSync(path, ai('Tytuł B'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł A');
  appendFileSync(path, ai('Tytuł C po zmianie'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł C po zmianie');
  const missing = resolveTitles(root, [{ sessionId: 's2', transcriptPath: join(root, 'nope.jsonl') }, { sessionId: 's3', transcriptPath: null }]);
  assert.equal(missing.get('s2'), null);
  assert.equal(missing.get('s3'), null);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, 'registry', 'titles.json'), 'utf8'))), ['s1']);
  // A torn cache file is not fatal.
  writeFileSync(join(root, 'registry', 'titles.json'), '{ torn');
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł C po zmianie');
});

test('the hook records transcript_path on UserPromptSubmit', () => {
  const event = buildEvent(fixture('UserPromptSubmit.json', { session_id: 's1', transcript_path: 'C:\\Users\\rafal\\.claude\\projects\\x\\s1.jsonl' }), { id: 'e1', at: 't' }).event;
  assert.equal(event.transcriptPath, 'C:\\Users\\rafal\\.claude\\projects\\x\\s1.jsonl');
});

test('the overview shows the transcript title, falls back to session_title, and marks launched sessions', () => {
  const root = tempRoot();
  const path = transcript(ai('Hub: mapa projektów i tytuły sesji'));
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = (sessionId, events) => { for (const e of events) appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), line({ ...e, sessionId })); };
  log('titled', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { cwd: 'C:\\repo', transcriptPath: path })]);
  log('plain', [ev('UserPromptSubmit', '2026-10-14T11:51:00Z', { cwd: 'C:\\repo', sessionTitle: 'probe-a', transcriptPath: join(root, 'gone.jsonl') })]);
  registerLaunched(root, { sessionId: 'plain', kind: 'background', project: 'repo', name: 'probe-a', at: 't' });
  const text = renderOverview(buildOverview(root, { now: NOW, commonDirOf: () => null }));
  assert.match(text, /\| titled Hub: mapa projektów i tytuły sesji \|/);
  assert.match(text, /\| plain probe-a \[background\] \|/);
});

test('retention drops the cached titles of deleted sessions', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'old.events.jsonl'), line(ev('SessionEnd', '2026-09-01T10:00:00Z', { sessionId: 'old', reason: 'other' })));
  appendFileSync(join(root, 'registry', 'alive.events.jsonl'), line(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'alive' })));
  writeFileSync(join(root, 'registry', 'titles.json'), JSON.stringify({ old: { title: 'x' }, alive: { title: 'y' } }));
  assert.equal(cleanup(root, NOW).titlesKept, 1);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, 'registry', 'titles.json'), 'utf8'))), ['alive']);
  assert.equal(existsSync(join(root, 'registry', 'old.events.jsonl')), false);
});
