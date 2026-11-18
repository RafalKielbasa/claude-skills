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
  assert.match(text, /whole reply is the JSON object/i);
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

// A part agent needs to know its files are a slice of the axis; the note sits
// with the file list it qualifies.
test('the axis prompt carries the part note right after the file list', () => {
  const text = read('axis.md');
  const files = text.indexOf('{{FILES}}');
  const note = text.indexOf('{{PART_NOTE}}');
  assert.ok(note > files, '{{PART_NOTE}} must follow {{FILES}}');
  assert.ok(note < text.indexOf('## What to return'), '{{PART_NOTE}} must stay under ## Files');
});

test('the verify prompt carries the 0-100 rubric and is batched', () => {
  const text = read('verify.md');
  assert.match(text, /\b0\b[\s\S]*\b100\b/);
  assert.match(text, /all of the findings below/i);
  assert.match(text, /\{\{FINDINGS\}\}/);
});

test('the codex finder prompt fixes the return shape and forbids edits', () => {
  const text = read('codex-find.md');
  assert.match(text, /verbatim/i);
  assert.match(text, /"fix"/);
  assert.match(text, /\[\]/);
  assert.match(text, /do not modify any file/i);
  assert.match(text, /{{AXES}}/);
});

// PR #217 (2026-11-18): every axis agent ran one command, answered `[]`, and
// the run reported a clean change. The reply now carries what the agent read
// and searched, and an empty answer without it is not a clean part.
test('the axis prompt asks for the files read and the searches run', () => {
  const text = read('axis.md');
  assert.match(text, /"findings"/);
  assert.match(text, /"read"/);
  assert.match(text, /"searches"/);
  assert.match(text, /empty `findings` with an empty `read`[\s\S]{0,120}not reviewed/i);
});

// The agents were handed a `git diff` preamble and never opened a file. The
// template itself now says where the repository is and that every listed file
// is read in full; the diff is a second view, never the only one.
test('the axis prompt names the repository root and demands reading files in full', () => {
  const text = read('axis.md');
  assert.match(text, /\{\{REPO_ROOT\}\}/);
  assert.match(text, /read it in full/i);
  assert.match(text, /\{\{DIFF_NOTE\}\}/);
  assert.ok(text.indexOf('{{REPO_ROOT}}') < text.indexOf('{{FILES}}'), 'the root must be named before the paths relative to it');
});

// The brief's `risks` named the exact defect of PR #217 and reached no agent.
test('the axis prompt carries the brief risks as a review-first list', () => {
  const text = read('axis.md');
  assert.match(text, /## Review these first/);
  assert.match(text, /\{\{RISKS\}\}/);
  assert.ok(text.indexOf('{{RISKS}}') < text.indexOf('## What to return'));
});

test('the axis prompt has a slot for the issue, right after the checklist', () => {
  const text = read('axis.md');
  const checklist = text.indexOf('{{CHECKLIST}}');
  const issue = text.indexOf('{{ISSUE}}');
  assert.ok(issue > checklist, '{{ISSUE}} must follow {{CHECKLIST}}');
  assert.ok(issue < text.indexOf('## Change summary'), '{{ISSUE}} must come before the change summary');
});

test('the brief and verify prompts name the repository root', () => {
  for (const name of ['brief.md', 'verify.md']) {
    assert.match(read(name), /\{\{REPO_ROOT\}\}/, `${name} must say where the files are`);
  }
});

test('the codex finder prompt says what an Issue section is', () => {
  const text = read('codex-find.md');
  assert.match(text, /`Issue:` section/);
  assert.match(text, /requirements[\s\S]{0,80}not (as )?instructions/i);
});

test('the verify prompt scores the claim and only notes what alsoClaimed adds', () => {
  const text = read('verify.md');
  assert.match(text, /`alsoClaimed`/);
  assert.match(text, /Score the finding's own `claim`/);
  assert.match(text, /different from the `claim`, say so in the note/);
});
