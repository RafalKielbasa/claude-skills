import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonical, sha256, parseCrossSession, decodeEntities, markerText, summarize } from '../lib/text.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

test('canonical form ignores CRLF and trailing whitespace', () => {
  assert.equal(canonical('a\r\nb  \n\n'), 'a\nb');
  assert.equal(sha256('Cel\r\nx\n'), sha256('Cel\nx'));
  assert.notEqual(sha256('a'), sha256('b'));
});

test('the S4 wrapper yields the sender name and the inner text', () => {
  const parsed = parseCrossSession(fixture('cross-session-UserPromptSubmit.json').prompt);
  assert.equal(parsed.fromName, 'notatki-7a');
  assert.equal(parsed.fromMode, 'prompting');
  assert.equal(parsed.from, 'uds:\\\\.\\pipe\\LOCAL\\cc-msg-4f2bd183e38230e3700d0e561d3ecf0a');
  assert.equal(parsed.inner, 'Probe S4: reply with the single word RECEIVED.');
});

test('a multi-line inner text and CRLF line ends survive the wrapper', () => {
  const prompt = '<cross-session-message from="x" from-name="hub" from-mode="auto">\r\nline 1\nline 2 <&>\r\n</cross-session-message>';
  assert.equal(parseCrossSession(prompt).inner, 'line 1\nline 2 <&>');
});

test('a plain prompt is not a cross-session message', () => {
  assert.equal(parseCrossSession('zażółć gęślą jaźń'), null);
  assert.equal(parseCrossSession('<cross-session-message from="x">no newline</cross-session-message>'), null);
});

test('entity decoding covers the escapes an XML-like wrapper could use', () => {
  assert.equal(decodeEntities('a &lt;b&gt; &amp; &quot;c&quot; &#39;d&apos;'), 'a <b> & "c" \'d\'');
  assert.equal(decodeEntities('&amp;lt;'), '&lt;');
});

test('the gate marker is read only from the last line', () => {
  assert.equal(markerText('Pytanie?\n\n⏸ Czeka na decyzję: wybierz A albo B\n'), 'wybierz A albo B');
  assert.equal(markerText('⏸ Czeka na decyzję: stare\nGotowe.'), null);
  assert.equal(markerText(''), null);
});

test('a summary is one line and at most the given length', () => {
  assert.equal(summarize('a\n\nb   c'), 'a b c');
  const long = summarize('x'.repeat(300), 10);
  assert.equal(long.length, 10);
  assert.ok(long.endsWith('…'));
});
