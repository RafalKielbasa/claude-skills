import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAskTracker } from '../web/ask-tracker.mjs';

test('an answer to an interrupted ask with nothing else pending is resent, with the question', () => {
  const t = createAskTracker();
  const a = t.start('który wybór jest najtrudniejszy?');
  t.interrupted();
  assert.deepEqual(t.answered(a, 'Format pliku.'), { resend: true, text: 'Odpowiedź Claude na pytanie „który wybór jest najtrudniejszy?”, której nie usłyszałeś: Format pliku.' });
  const b = t.start('drugie');
  assert.deepEqual(t.answered(b, 'Tak.'), { resend: false, text: 'Tak.' });
});

test('a re-issued ask delivers the answer, so the interrupted one is not resent, in either order', () => {
  const t = createAskTracker();
  const first = t.start('q');
  t.interrupted();
  const repeat = t.start('q');
  assert.equal(t.answered(first, 'A').resend, false);  // the repeat is still pending
  assert.equal(t.answered(repeat, 'A').resend, false); // the repeat was not interrupted
  const u = createAskTracker();
  const first2 = u.start('q');
  u.interrupted();
  const repeat2 = u.start('q');
  assert.equal(u.answered(repeat2, 'A').resend, false);
  assert.equal(u.answered(first2, 'A').resend, false); // already delivered by the repeat
});

test('an interruption with no ask pending marks nothing', () => {
  const t = createAskTracker();
  t.interrupted();
  const a = t.start('pytanie');
  assert.equal(t.answered(a, 'odpowiedź').resend, false);
});

test('a new ask with the text of an earlier delivered one is not suppressed', () => {
  const t = createAskTracker();
  const a = t.start('q');
  assert.equal(t.answered(a, 'A').resend, false);
  const b = t.start('q');
  t.interrupted();
  assert.equal(t.answered(b, 'B').resend, true);
});
