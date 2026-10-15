import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeMessage, questionnaireRequest, templateProblems } from '../lib/compose.mjs';
import { runChecks, gitInfo } from '../lib/checks.mjs';
import { findDelivery, classifyNotice, applyNotice } from '../lib/confirm.mjs';
import { shownState, renderJournal } from '../lib/journal.mjs';
import { sha256 } from '../lib/text.mjs';

const AT = '2026-10-14T10:00:00.000Z';
const FIVE = '**Cel**\nx\n**Kontekst**\nx\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nnapisz plan i stop';
const answers = composeMessage({
  path: 'questionnaire-answers', project: 'sandbox', sessionId: 'abcdef123456', at: AT,
  body: `${FIVE}\n**Pytania i odpowiedzi**\nTemat: nazwa pliku\n1. Jaka nazwa? → notatki.md`,
});

test('the header line opens every message and is part of the approved text', () => {
  assert.match(answers, /^\[hub · questionnaire-answers · sandbox · abcdef12 · 2026-10-14 10:00\]\n\n\*\*Cel\*\*/);
  assert.throws(() => composeMessage({ path: 'other', project: 'p', sessionId: 's', at: AT, body: 'x' }), /unknown path/);
});

test('the questionnaire request keeps the fixed wording in the five sections', () => {
  const text = questionnaireRequest({ topic: 'nazwa pliku', max: 3 });
  assert.match(text, /decyzje o: nazwa pliku/);
  assert.match(text, /Liczba pytań: najwyżej 3\./);
  assert.match(text, /Nie edytuj plików\./);
  assert.match(text, /znacznikiem bramki i nie zaczynaj pracy/);
  const request = composeMessage({ path: 'questionnaire-request', project: 'p', sessionId: 's1', at: AT, body: text });
  assert.deepEqual(templateProblems(request, 'questionnaire-request'), []);
});

test('template check: every path needs the five sections, questionnaire answers also their block', () => {
  assert.deepEqual(templateProblems(answers, 'questionnaire-answers'), []);
  const noResult = answers.replace('**Oczekiwany rezultat**', '');
  assert.deepEqual(templateProblems(noResult, 'questionnaire-answers'), ['missing section Oczekiwany rezultat']);
  const noAnswers = composeMessage({ path: 'questionnaire-answers', project: 'p', sessionId: 's1', at: AT, body: FIVE });
  assert.deepEqual(templateProblems(noAnswers, 'questionnaire-answers'), ['missing section Pytania i odpowiedzi']);
  const direct = composeMessage({ path: 'direct', project: 'p', sessionId: 's1', at: AT, body: FIVE });
  assert.deepEqual(templateProblems(direct, 'direct'), []);
  const bare = composeMessage({ path: 'direct', project: 'p', sessionId: 's1', at: AT, body: 'Uruchom testy.' });
  assert.equal(templateProblems(bare, 'direct').length, 5);
  assert.deepEqual(templateProblems(FIVE, 'direct'), ['missing header line']);
});

const baseline = { sessionId: 's1', name: 'probe-a', cwd: 'C:\\repo', repoRoot: 'C:/repo', branch: 'main', sha: 'abc' };
const text = composeMessage({ path: 'direct', project: 'p', sessionId: 's1', at: AT, body: FIVE });
const record = { id: 'r1', path: 'direct', sessionId: 's1', textHash: sha256(text), baseline, state: 'approved' };
const poll = { ok: true, sessions: [{ sessionId: 's1', name: 'probe-a', status: 'idle' }] };
const derived = { phase: 'turn-ended', cwd: 'C:\\repo', waiting: null };
const git = { repoRoot: 'C:/repo', branch: 'main', sha: 'abc' };
const checks = (overrides = {}) => runChecks({ record, records: [record], poll, derived, git, text, ...overrides }).map((f) => f.check);

test('all six checks pass for an approved, unchanged message to an idle session', () => {
  assert.deepEqual(checks(), []);
});

test('check 1: dead target with a same-name candidate, ambiguous name, nameless target, failed poll', () => {
  const restarted = runChecks({ record, records: [record], poll: { ok: true, sessions: [{ sessionId: 's2', name: 'probe-a', status: 'idle' }] }, derived, git, text });
  assert.equal(restarted[0].check, 1);
  assert.deepEqual(restarted[0].candidates, ['s2']);
  assert.deepEqual(checks({ poll: { ok: true, sessions: [...poll.sessions, { sessionId: 's3', name: 'probe-a', status: 'idle' }] } }), [1]);
  assert.deepEqual(checks({ poll: { ok: true, sessions: [{ sessionId: 's1', name: null, status: 'idle' }] } }), [1]);
  assert.deepEqual(checks({ poll: { ok: false, error: 'boom' } }), [1]);
});

test('check 2: changed cwd, repository root, branch, and commit when detached', () => {
  assert.deepEqual(checks({ derived: { ...derived, cwd: 'C:\\other' } }), [2]);
  assert.deepEqual(checks({ git: { ...git, branch: 'feature' } }), [2]);
  const detached = { ...record, baseline: { ...baseline, branch: null, sha: 'abc' } };
  assert.deepEqual(runChecks({ record: detached, records: [detached], poll, derived, git: { ...git, branch: null, sha: 'def' }, text }).map((f) => f.check), [2]);
});

test('gitInfo reads the repository without optional locks', () => {
  const calls = [];
  gitInfo('C:\\repo', (cmd, args) => { calls.push(args); return { status: 0, stdout: 'x\n' }; });
  assert.ok(calls.length === 3 && calls.every((args) => args[0] === '--no-optional-locks' && args[1] === '-C'));
});

test('check 3: the same text already pending, sent or held for the session, unless a resend was confirmed', () => {
  for (const state of ['pending', 'sent', 'held']) {
    assert.deepEqual(runChecks({ record, records: [record, { ...record, id: 'r0', state }], poll, derived, git, text }).map((f) => f.check), [3]);
  }
  assert.deepEqual(runChecks({ record, records: [record, { ...record, id: 'r0', state: 'not-sent' }], poll, derived, git, text }).map((f) => f.check), []);
  const [unknown] = runChecks({ record, records: [record, { ...record, id: 'r0', state: 'pending' }], poll, derived, git, text });
  assert.match(unknown.message, /delivery-unknown \(r0\)/);
  assert.deepEqual(runChecks({ record, records: [record, { ...record, id: 'r0', state: 'pending' }], poll, derived, git, text, confirmResend: true }), []);
});

test('checks 4, 5 and 6: changed text, busy session unless "send now", waiting session unless confirmed', () => {
  assert.deepEqual(checks({ text: `${text} edited` }), [4]);
  assert.deepEqual(checks({ poll: { ok: true, sessions: [{ ...poll.sessions[0], status: 'busy' }] } }), [5]);
  assert.deepEqual(checks({ derived: { ...derived, phase: 'working' } }), [5]);
  assert.deepEqual(checks({ derived: { ...derived, phase: 'working' }, poll: { ok: true, sessions: [{ ...poll.sessions[0], status: 'busy' }] }, confirmBusy: true }), []);
  assert.deepEqual(checks({ derived: { ...derived, waiting: { kind: 'decision' } } }), [6]);
  assert.deepEqual(checks({ derived: { ...derived, waiting: { kind: 'decision' } }, confirmWaiting: true }), []);
});

test('delivery needs the hub from-name and a matching inner-text hash after the send', () => {
  const pending = { textHash: 'h1', sentAt: '2026-10-14T10:00:00Z' };
  const ups = (fields) => ({ event: 'UserPromptSubmit', at: '2026-10-14T10:00:05Z', fromName: 'hub', innerHash: 'h1', ...fields });
  assert.ok(findDelivery(pending, [ups()]));
  // The entity-decoded hash is a diagnostic only; it never confirms delivery.
  assert.equal(findDelivery(pending, [ups({ innerHash: 'x', innerHashDecoded: 'h1' })]), null);
  assert.equal(findDelivery(pending, [ups({ fromName: 'other' })]), null);
  assert.equal(findDelivery(pending, [ups({ innerHash: 'x' })]), null);
  assert.equal(findDelivery(pending, [ups({ at: '2026-10-14T09:00:00Z' })]), null);
});

test('after a confirmed resend one delivery confirms only the newest record', () => {
  const older = { textHash: 'h1', sentAt: '2026-10-14T10:00:00Z' };
  const newer = { textHash: 'h1', sentAt: '2026-10-14T10:10:00Z' };
  const delivered = { id: 'e9', event: 'UserPromptSubmit', at: '2026-10-14T10:10:05Z', fromName: 'hub', innerHash: 'h1' };
  assert.equal(findDelivery(newer, [delivered]).id, 'e9');
  assert.equal(findDelivery(older, [delivered], 'hub', new Set(['e9'])), null);
  const earlier = { ...delivered, id: 'e5', at: '2026-10-14T10:00:05Z' };
  assert.equal(findDelivery(newer, [earlier, delivered]).id, 'e9');
  assert.equal(findDelivery(older, [earlier, delivered], 'hub', new Set(['e9'])).id, 'e5');
});

test('the S4 notices are classified, with their msg_id', () => {
  const held = 'Your message to another session was held by that session (recipient: uds:\\\\.\\pipe\\LOCAL\\cc-msg-eabc; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59). NOT delivered: its Claude has not seen it.';
  const refused = 'Your message to another session was refused (recipient: uds:\\\\.\\pipe\\LOCAL\\cc-msg-140f; msg_id: ae0a2392-2eee-4b3c-b277-1b34e22ccc21): that session is not accepting cross-session messages';
  assert.deepEqual(classifyNotice(held), { kind: 'held', msgId: '4b8b0732-2830-4c04-8f38-ca22dfe06e59' });
  assert.deepEqual(classifyNotice(refused), { kind: 'refused', msgId: 'ae0a2392-2eee-4b3c-b277-1b34e22ccc21' });
  assert.equal(applyNotice({ state: 'pending' }, { kind: 'held' }, held).state, 'held');
  assert.equal(applyNotice({ state: 'held' }, { kind: 'refused' }, refused).state, 'not-sent');
  assert.equal(applyNotice({ state: 'held' }, { kind: 'released' }, 'released').state, 'pending');
  const delivered = { state: 'sent', evidence: { eventId: 'e1', at: 't' } };
  assert.equal(applyNotice(delivered, { kind: 'released' }, 'released').state, 'sent');
  assert.equal(applyNotice(delivered, { kind: 'refused' }, refused).state, 'sent');
});

test('a pending record shows as delivery-unknown, also when the tool result was never stored', () => {
  assert.equal(shownState({ state: 'pending' }), 'delivery-unknown');
  assert.equal(shownState({ state: 'pending', msgId: 'm' }), 'delivery-unknown');
  assert.equal(shownState({ state: 'approved' }), 'approved');
  assert.match(renderJournal([{ id: 'r2', approvedAt: AT, sessionId: 's1abcdefg', path: 'direct', state: 'pending' }]), /\| delivery-unknown \| no tool result recorded \|/);
  assert.match(renderJournal([{ id: 'r1', approvedAt: AT, sessionId: 's1abcdefg', name: 'probe-a', path: 'direct', state: 'held', notice: 'held by that session' }]), /\| r1 \| .* \| held \| held by that session \|/);
});
