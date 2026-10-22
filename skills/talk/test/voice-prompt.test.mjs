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

test('outward actions go into prompt.md only under Ograniczenia, waiting for Rafal in text, and the read-back says so', () => {
  assert.match(endMessage('C:/d'), /Push, tickety, GCP.*tylko do \*\*Ograniczenia\*\*.*słowo Rafała w tekście, nigdy do \*\*Oczekiwany rezultat\*\*/);
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /say in the read-back that the session stops before that action and waits for Rafal's word in text/);
  assert.match(p, /push, tickets, GCP.*only under \*\*Ograniczenia\*\*.*never under \*\*Oczekiwany rezultat\*\*/);
});

test('the role tells the fork that the stopped talk start notification is its own running bridge', () => {
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /`talk\.mjs start` task with the status stopped \("didn't finish before the previous session ended"\) is the bridge of this very conversation, still running: it is not a failure/);
});

test('the role says a blocked write cannot be approved by Rafal and leaves the decision in the transcript', () => {
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /You run in the background without a window: Rafal cannot approve a blocked write\. If a write is refused, say once that the decision stays in the transcript, and do not retry\./);
});

test('after a break note a read-back that was not confirmed is read back again', () => {
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /A message may begin with a note in parentheses that Rafal came back after a break or that the call was renewed after its time limit\. A decision you read back before that note and Rafal has not confirmed is read back again before his confirmation counts/);
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
