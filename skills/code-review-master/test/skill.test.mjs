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
  for (const mode of ['branch', 'pr', 'since', 'full', 'ask', 'recheck', 'fix', 'init', 'send']) {
    assert.match(TEXT, new RegExp(`/code-review-master ${mode}`), `mode ${mode} is missing`);
  }
});

// `send` is the only mode that writes outside the working tree: a GitHub review
// is visible to the PR author the moment it is posted. The section must gate on
// approval, refuse unattended runs, and anchor every inline comment to a diff
// line, or GitHub rejects the whole review with 422.
test('send mode posts nothing before approval and anchors comments to the diff', () => {
  const at = TEXT.indexOf('## Mode `send`');
  const fixAt = TEXT.indexOf('## Mode `fix`');
  assert.ok(at > 0, 'Mode send heading is missing');
  assert.ok(fixAt > at, 'Mode send must be documented before Mode fix');
  const section = TEXT.slice(at, fixAt);
  assert.match(section, /wait for approval/i);
  assert.match(section, /interactive only/i);
  assert.match(section, /part of the diff/i);
  assert.match(section, /REQUEST_CHANGES/);
  assert.match(section, /never `?APPROVE`?/i);
  assert.match(section, /dispatch no subagents/i);
  assert.match(section, /never commit/i);
});

// The card move is a standing authorization for one transition only, so the
// section must tie it to a posted REQUEST_CHANGES and resolve the option by name.
test('send mode moves the linked card to To be fixed only after a blocking review', () => {
  const at = TEXT.indexOf('## Mode `send`');
  const section = TEXT.slice(at, TEXT.indexOf('## Mode `fix`'));
  assert.match(section, /\*\*Board card\.\*\*/);
  assert.match(section, /only when the posted review is `REQUEST_CHANGES`/i);
  assert.match(section, /`To be fixed`/);
  assert.match(section, /closingIssuesReferences/);
  assert.match(section, /never hard-coded/i);
  assert.match(section, /after a `COMMENT` review move nothing/i);
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

test('raising the budget and fixing both require an explicit --interactive flag', () => {
  assert.match(TEXT, /--interactive/);
  assert.match(TEXT, /crm fixable --run <runId> --interactive/);
});

test('Step 4 fills the axis prompt with the severity default', () => {
  assert.match(TEXT, /\{\{SEVERITY_DEFAULT\}\}/);
});

// B3: `crm render` (Step 8) and `crm artifact` (Step 9) are two renderings of
// the same run and must not disagree about which axes were actually
// reviewed. Step 9 used to omit `--incomplete` entirely, so an incomplete
// axis read as "not reviewed" in raport.md and as clean — silently — in the
// artifact, the same disclaimer mismatch the finding this skill fixed was
// about, just moved one file over.
test('crm artifact in Step 9 takes --incomplete on the same terms as crm render in Step 8', () => {
  const step8At = TEXT.indexOf('## Step 8 — prose');
  const step9At = TEXT.indexOf('## Step 9 — artifact');
  const step10At = TEXT.indexOf('## Step 10 — finish');
  assert.ok(step8At > 0, 'Step 8 heading is missing');
  assert.ok(step9At > step8At, 'Step 9 heading is missing or out of order');
  assert.ok(step10At > step9At, 'Step 10 heading is missing or out of order');
  const step8 = TEXT.slice(step8At, step9At);
  const step9 = TEXT.slice(step9At, step10At);
  assert.match(step8, /--incomplete <ids>/);
  assert.match(step9, /--incomplete <ids>/,
    'Step 9\'s crm artifact call must also accept --incomplete, or the artifact can never show an incomplete axis');
  assert.match(step9, /same terms as Step 8/i);
});

// Slices a Step section out of SKILL.md by its heading and the next heading.
const section = (from, to) => {
  const at = TEXT.indexOf(from);
  const end = TEXT.indexOf(to);
  assert.ok(at > 0, `${from} heading is missing`);
  assert.ok(end > at, `${to} must come after ${from}`);
  return TEXT.slice(at, end);
};

test('finders start before wave 1 and are collected before assemble', () => {
  const step4 = section('## Step 4 — wave 1', '## Step 5 — assemble');
  const step5 = section('## Step 5 — assemble', '## Step 6 — wave 2');
  assert.match(step4, /crm finders --run <runId> --start/);
  assert.match(step5, /crm finders --run <runId> --wait/);
  assert.match(step5, /pending/);
  assert.ok(step5.indexOf('crm finders') < step5.indexOf('crm assemble'),
    'the finders must be collected before crm assemble reads their side files');
});

test('the judge skips codex\'s own findings', () => {
  const step7 = section('## Step 7 — codex', '## Step 8 — prose');
  assert.match(step7, /\bown\b/);
  assert.match(step7, /keptFrom/);
});

test('the budget line names the extra finders outside the agent budget', () => {
  const step1 = section('## Step 1 — plan', '## Step 2 — raise');
  assert.match(step1, /Dodatkowo \(poza budżetem agentów\)/);
});

test('the global template gives the secrets axis the secrets rule pack', async () => {
  const { parseConfigDoc } = await import('../lib/config.mjs');
  const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'global.md'), 'utf8');
  const secrets = parseConfigDoc(text).axes.find((axis) => axis.id === 'secrets');
  assert.deepEqual(secrets.semgrep, ['p/secrets']);
});

test('the finders wait loop is capped and a poll is not a re-dispatch', () => {
  const step5 = section('## Step 5 — assemble', '## Step 6 — wave 2');
  assert.match(step5, /3 consecutive `pending`/);
  assert.match(step5, /not a re-dispatch/);
});
