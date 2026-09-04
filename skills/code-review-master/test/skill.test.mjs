import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'SKILL.md'), 'utf8');

test('frontmatter names the skill and its triggers', () => {
  assert.match(TEXT, /^---\nname: code-review-master\n/);
  assert.match(TEXT, /description: .*review/i);
});

test('every mode from the spec is documented', () => {
  for (const mode of ['branch', 'pr', 'since', 'full', 'ask', 'fix', 'init']) {
    assert.match(TEXT, new RegExp(`/code-review-master ${mode}`), `mode ${mode} is missing`);
  }
});

test('the main model is checked at entry but never blocks the run', () => {
  assert.match(TEXT, /Haiku or Sonnet/);
  assert.match(TEXT, /Never refuse over it/i);
});

// Anchored on the step headings, not on where a command name happens to appear.
// The earlier version compared `indexOf('crm score')`, which broke twice when a
// step above merely mentioned that command in passing — a test that fails for a
// reason unrelated to what it claims to check is worse than no test.
test('assemble is documented before verification, so ids exist to score by', () => {
  const assembleAt = TEXT.indexOf('## Step 5 — assemble');
  const verifyAt = TEXT.indexOf('## Step 6 — wave 2');
  assert.ok(assembleAt > 0, 'Step 5 heading is missing');
  assert.ok(verifyAt > assembleAt, 'verification must be documented after assemble');
  assert.match(TEXT, /scores by id/i);
});

test('the budget is announced before dispatch and never raised silently', () => {
  assert.match(TEXT, /crm plan/);
  assert.match(TEXT, /before dispatching/i);
  assert.match(TEXT, /--slots/);
  assert.match(TEXT, /never pass `--slots`/i);
});

test('every subagent is denied the dispatch tool, stated as a property of its tools', () => {
  assert.match(TEXT, /excludes the subagent-dispatch tool/);
  // The old phrasing "dispatch it without the Agent tool" reads equally as an
  // instruction to the orchestrator, which then has no way to dispatch at all.
  assert.equal(/without the `?Agent`? tool/i.test(TEXT), false,
    'ambiguous phrasing: it must be the subagent\'s tool set that excludes it');
  assert.equal(/grant(ing)? (them |the )?(the )?`?Agent`? tool|allow[a-z]* (them )?to (dispatch|spawn)/i.test(TEXT), false,
    'no sentence may re-grant fan-out to a subagent');
});

test('every dispatch is logged, so the budget is checked and not merely stated', () => {
  assert.match(TEXT, /crm dispatched/);
  assert.match(TEXT, /crm finish[\s\S]{0,600}ledger/i);
});

test('the skill states that it never commits', () => {
  assert.match(TEXT, /never commit/i);
});

test('unattended runs are barred from fixing', () => {
  assert.match(TEXT, /non-interactive[\s\S]{0,400}never (apply|applies)/i);
});
