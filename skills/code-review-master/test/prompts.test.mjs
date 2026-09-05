import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'prompts');
const read = (name) => readFileSync(join(DIR, name), 'utf8');

test('every prompt forbids spawning further agents', () => {
  for (const name of readdirSync(DIR)) {
    if (name === 'codex.md') continue;
    assert.match(read(name), /do not (dispatch|spawn)/i, `${name} must forbid fan-out`);
  }
});

test('the verify prompt separates "could not find it" from "not sure about it"', () => {
  const text = read('verify.md');
  assert.match(text, /could not find the cited evidence/i);
  assert.match(text, /not-found and not-sure are different/i);
});

test('the axis prompt fixes the shape of lines and how to encode evidence', () => {
  const text = read('axis.md');
  assert.match(text, /\[start, end\] pair/);
  assert.match(text, /\[88, 88\]/);
  assert.match(text, /escape it as one/i);
  assert.match(text, /whole reply is the JSON array/i);
  assert.equal(/nothing before it, nothing after it/.test(text), false,
    'the fence exception must not contradict the surrounding rule');
});

test('the axis prompt demands verbatim evidence and fixes the return shape', () => {
  const text = read('axis.md');
  assert.match(text, /verbatim/i);
  assert.match(text, /"evidence"/);
  assert.match(text, /\{\{CHECKLIST\}\}/);
  assert.match(text, /\{\{FILES\}\}/);
});

// A configured severity_default reaches no agent unless the prompt actually
// says to use it — otherwise a user who set one on an axis (e.g. `secrets:
// blocking`) is entitled to believe it does something, when it never does.
test('the axis prompt tells the agent to default to the axis\'s configured severity', () => {
  const text = read('axis.md');
  assert.match(text, /\{\{SEVERITY_DEFAULT\}\}/);
  assert.match(text, /axis's configured default/i);
});

test('the verify prompt carries the 0-100 rubric and is batched', () => {
  const text = read('verify.md');
  assert.match(text, /\b0\b[\s\S]*\b100\b/);
  assert.match(text, /all of the findings below/i);
  assert.match(text, /\{\{FINDINGS\}\}/);
});
