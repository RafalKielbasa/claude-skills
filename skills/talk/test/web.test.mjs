import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { agentConfig } from '../lib/agent-config.mjs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the vendored files match the hashes in VERSION.txt', () => {
  const version = read('../web/vendor/VERSION.txt');
  for (const name of ['elevenlabs-client.iife.js', 'libsamplerate.worklet.js']) {
    const hash = createHash('sha256').update(readFileSync(new URL(`../web/vendor/${name}`, import.meta.url))).digest('hex');
    assert.match(version, new RegExp(`${hash} \\*${name.replace('.', '\\.')}`));
  }
});

test('the page loads only local files, all with the token', () => {
  const html = read('../web/talk.html');
  assert.doesNotMatch(html, /https?:\/\//);
  for (const [, src] of html.matchAll(/src="([^"]+)"/g)) assert.match(src, /\?t=__TOKEN__$/);
});

test('the page has the label and the three buttons', () => {
  const html = read('../web/talk.html');
  assert.match(html, /id="who"/);
  assert.match(html, /<button id="start"[^>]*>Rozpocznij rozmowę<\/button>/);
  assert.match(html, /<button id="pause"[^>]*>Przerwa<\/button>/);
  assert.match(html, /<button id="stop"[^>]*>Zakończ rozmowę<\/button>/);
});

test('the duration message the page waits for is the one the agent speaks', () => {
  const message = agentConfig({}).conversation_config.agent.max_conversation_duration_message;
  assert.ok(read('../web/talk.mjs').includes(`const DURATION_MESSAGE = '${message}';`));
});
