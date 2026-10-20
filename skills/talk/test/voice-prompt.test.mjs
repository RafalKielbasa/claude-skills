import { test } from 'node:test';
import assert from 'node:assert/strict';
import { endMessage, voiceStartPrompt } from '../lib/voice-prompt.mjs';

test('the end message starts with KONIEC ROZMOWY and names prompt.md with its sections', () => {
  const m = endMessage('C:/d');
  assert.ok(m.startsWith('KONIEC ROZMOWY'));
  for (const s of ['prompt.md', 'Cel', 'Kontekst', 'Decyzje z uzasadnieniem', 'Ograniczenia', 'Oczekiwany rezultat']) assert.ok(m.includes(s), s);
});

test('the voice role pins the decision prefix, the end message and the dialog files', () => {
  const p = voiceStartPrompt({ projectName: 'repo', sourceId: 'abcdef12-0000', dialogDir: 'C:/d', snapshot: { git: true, cwd: 'C:/r', at: 'T' } });
  for (const s of ['Decyzja do potwierdzenia:', 'KONIEC ROZMOWY', 'decisions.md', 'open-questions.md', 'prompt.md', 'Polish', 'gate marker', 'Markdown']) assert.ok(p.includes(s), s);
});

test('the introduction turn reads the git snapshot so the first question does not wait for it', () => {
  const p = voiceStartPrompt({ projectName: 'notatki', sourceId: 'abcdef12', dialogDir: 'C:/d', snapshot: { git: true, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /Before you introduce yourself, read .*status\.txt.*log\.txt.*diff\.patch/s);
});

test('without a git snapshot the role gives no read instruction', () => {
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.doesNotMatch(p, /Before you introduce yourself/);
  assert.doesNotMatch(p, /diff\.patch/);
  assert.match(p, /not a git work tree/);
});

test('a subject from /talk reaches the role, and no subject leaves it out', () => {
  const snapshot = { git: false, cwd: 'C:/r', at: 'T' };
  assert.match(voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot, subject: 'plan 3' }), /plan 3/);
  assert.doesNotMatch(voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot }), /start with/);
});
