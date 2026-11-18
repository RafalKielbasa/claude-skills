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

// Auto budget (spec §6): the number comes from `crm plan`, a person may only
// lower it (`--budget fixed`), and `--slots` survives only where the budget is
// fixed by design.
test('the budget is announced before dispatch and never raised silently', () => {
  assert.match(TEXT, /crm plan/);
  assert.match(TEXT, /before dispatching/i);
  assert.match(TEXT, /needsConfirmation/);
  assert.match(TEXT, /--budget fixed/);
  assert.match(TEXT, /--slots[\s\S]{0,200}since[\s\S]{0,40}full/);
  assert.match(TEXT, /never pass `--slots`/i);
});

// Step 2 alone, so a phrase elsewhere in the document cannot satisfy a gate pin.
const gateSection = () => {
  const at = TEXT.indexOf('## Step 2 — confirm');
  const end = TEXT.indexOf('## Step 3 — wave 0');
  assert.ok(at > 0 && end > at, 'Step 2 must be documented before Step 3');
  return TEXT.slice(at, end);
};

// The gate is decided by `crm plan`, not by the session's guess about who is
// watching, and silence is never consent (Rafal's global rule).
test('the gate asks only when needsConfirmation is true and treats silence as no answer', () => {
  const step2 = gateSection();
  assert.match(step2, /needsConfirmation[\s\S]{0,600}AskUserQuestion/);
  assert.match(step2, /timeout[\s\S]{0,200}(not (an )?answer|ask again)/i);
  assert.match(step2, /`Uruchom \(Rekomendowane\)`/);
  assert.match(step2, /`Odrzuć — stary budżet`/);
});

test('rejecting the budget re-plans under --budget fixed with a new runId', () => {
  assert.match(gateSection(), /`--budget fixed`[\s\S]{0,200}new `runId`/);
});

// Without an exit, a user who refuses the run outright would be asked forever.
test('an explicit cancel at the gate ends the run without dispatching', () => {
  const step2 = gateSection();
  assert.match(step2, /explicit cancel[\s\S]{0,300}ends the run/i);
  assert.match(step2, /dispatch nothing and run no further `crm` command/i);
});

test('waves 1 and 2 dispatch one agent per part, logged with the part label', () => {
  assert.match(TEXT, /one Sonnet agent per part/i);
  assert.match(TEXT, /one Haiku agent per part/i);
  assert.match(TEXT, /crm dispatched --run <runId> --wave axis --label <part label>/);
  assert.match(TEXT, /crm dispatched --run <runId> --wave verify --label <part label>/);
  assert.match(TEXT, /crm parts --run <runId>/);
  assert.match(TEXT, /one agent per part, never one (agent )?per finding/i);
});

// Anti-goal A1: triage fingerprints are built from `finding.axis`, so a part
// label there would silently resurrect every recorded suppression.
test('a part agent echoes the axis id, never the part label', () => {
  assert.match(TEXT, /\{\{AXIS_ID\}\}[\s\S]{0,200}never the part label/i);
});

test('Step 3b marks a failed part, not the whole axis', () => {
  assert.match(TEXT, /--incomplete[\s\S]{0,300}part label/i);
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
  const step1 = section('## Step 1 — plan', '## Step 2 — confirm');
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

// G4: a finder failure costs one line in the conversation as well as in the
// report; the report alone is read after the run, the conversation during it.
test('after the wait, each finder that did not work is named in one Polish line', () => {
  const step5 = section('## Step 5 — assemble', '## Step 6 — wave 2');
  assert.match(step5, /one line in Polish per finder/i);
  assert.match(step5, /not `ok`, `disabled` or `nothing-to-scan`/);
  assert.match(step5, /wording `raport\.md` uses for that status/);
  assert.match(step5, /`image-not-pulled`[\s\S]{0,200}`docker pull <image>`/);
});

test('send never names the finder in a GitHub comment', () => {
  const send = section('## Mode `send`', '## Mode `fix`');
  assert.match(send, /never names the finder/i);
  assert.match(send, /`sonnet`, `codex`, `semgrep`/);
  assert.match(send, /`\(semgrep: <check_id>\)`/);
});

test('the extra-finders budget line follows the switches and the axes that will scan', () => {
  const step1 = section('## Step 1 — plan', '## Step 2 — confirm');
  assert.match(step1, /settings\.codex\.enabled && settings\.codex\.find/);
  assert.match(step1, /settings\.semgrep\.enabled/);
  assert.match(step1, /`when` matches at least one file of (its|their) slot/);
  assert.match(step1, /omit the whole line/i);
});

test('the global template splits secrets and debug-leftovers only above 40 files', async () => {
  const { parseConfigDoc } = await import('../lib/config.mjs');
  const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'global.md'), 'utf8');
  const doc = parseConfigDoc(text);
  for (const id of ['secrets', 'debug-leftovers']) {
    assert.equal(doc.axes.find((axis) => axis.id === id).max_files_per_part, 40, id);
  }
  assert.equal(doc.settings.budget.confirm_above, 20);
  assert.equal(doc.settings.budget.max_agents, 41);
  assert.equal(doc.settings.budget.max_files_per_part, 12);
});

// Z1 and Z2 (2026-11-18): the two universal axes whose absence let PR #217
// through with zero findings. Both live in the global template so every
// repository gets them without editing its own config.
test('the global template carries the correctness and issue-conformance axes', async () => {
  const { parseConfigDoc, mergeConfig, validateConfig } = await import('../lib/config.mjs');
  const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'global.md'), 'utf8');
  const doc = parseConfigDoc(text);
  assert.deepEqual(validateConfig(mergeConfig(doc, { settings: {}, axes: [], ignoredSections: [] })), []);
  const correctness = doc.axes.find((axis) => axis.id === 'correctness');
  assert.equal(correctness.when, 'always');
  assert.equal(correctness.rank, 'always');
  assert.equal(correctness.severity_default, 'blocking');
  assert.deepEqual(correctness.needs, []);
  assert.match(correctness.checklist, /existing user/i);
  assert.match(correctness.checklist, /condition/i);
  assert.match(correctness.checklist, /edge case/i);
  const conformance = doc.axes.find((axis) => axis.id === 'issue-conformance');
  assert.deepEqual(conformance.needs, ['issue']);
  assert.equal(conformance.rank, 'always');
  assert.equal(conformance.severity_default, 'blocking');
  assert.match(conformance.checklist, /acceptance criterion/i);
  assert.match(conformance.checklist, /test/i);
  assert.match(conformance.checklist, /another task/i);
  assert.match(conformance.checklist, /Figma/);
});

// Z5: the PR #217 session picked the `Explore` agent type ("locates code; it
// doesn't review") and prefixed every prompt with a `git diff` command, so no
// agent opened a file. The type and the prompt are now fixed by the document.
test('agents are dispatched as a reviewing agent type with the template as the whole prompt', () => {
  const step3 = section('## Step 3 — wave 0', '## Step 3b');
  assert.match(step3, /general-purpose/);
  assert.match(step3, /never[\s\S]{0,80}`Explore`/i);
  assert.match(step3, /whole prompt/i);
  assert.match(step3, /nothing before it and nothing after it/i);
  assert.match(TEXT.slice(TEXT.indexOf('## Rules that do not bend')), /filled template is the whole prompt/i);
});

test('every prompt is told the repository root from the plan', () => {
  assert.match(section('## Step 3 — wave 0', '## Step 3b'), /\{\{REPO_ROOT\}\}[\s\S]{0,200}`repoRoot`/);
  assert.match(section('## Step 4 — wave 1', '## Step 5 — assemble'), /\{\{REPO_ROOT\}\}/);
  assert.match(section('## Step 6 — wave 2', '## Step 7 — codex'), /\{\{REPO_ROOT\}\}/);
});

// Z3: `risks` used to be dropped after the brief returned.
test('the brief risks reach the axis agents', () => {
  assert.match(section('## Step 3 — wave 0', '## Step 3b'), /`summary`[\s\S]{0,200}`risks`/);
  assert.match(section('## Step 4 — wave 1', '## Step 5 — assemble'), /\{\{RISKS\}\}[\s\S]{0,300}`risks`/);
});

// Z4: `[]` with no sign of work is a part nobody reviewed.
test('wave 1 replies go through crm collect, and a part with no sign of review is incomplete', () => {
  const step4 = section('## Step 4 — wave 1', '## Step 5 — assemble');
  assert.match(step4, /crm collect --run <runId> --replies/);
  assert.match(step4, /`incomplete`[\s\S]{0,300}Step 3b/);
  const step3b = section('## Step 3b', '## Step 4 — wave 1');
  assert.match(step3b, /no finding and no file[\s\S]{0,300}--incomplete/i);
});

// Z2: the issue text comes from `crm plan`; the Figma comparison stays with
// the session because a subagent has no Figma tools.
test('the issue reaches the plan and the axis that needs it', () => {
  const step1 = section('## Step 1 — plan', '## Step 2 — confirm');
  assert.match(step1, /--issue <n>/);
  assert.match(step1, /skippedNoIssue/);
  assert.match(step1, /closingIssuesReferences/);
  const step4 = section('## Step 4 — wave 1', '## Step 5 — assemble');
  assert.match(step4, /\{\{ISSUE\}\}[\s\S]{0,300}`issueSection`/);
  assert.match(step4, /\{\{DIFF_NOTE\}\}[\s\S]{0,300}`target\.diffCommand`/);
});

// Z6: wave 2 judges a finding against the same rules wave 1 found it by.
test('wave 2 is given the checklist and the issue of the part it verifies', () => {
  const step6 = section('## Step 6 — wave 2', '## Step 7 — codex');
  assert.match(step6, /\{\{CHECKLIST\}\}[\s\S]{0,200}Step 4/);
  assert.match(step6, /\{\{ISSUE\}\}[\s\S]{0,200}Step 4/);
});

test('wave 2 gets the diff command Step 4 gave, and the note is right about created files', () => {
  const step6 = section('## Step 6 — wave 2', '## Step 7 — codex');
  assert.match(step6, /\{\{DIFF_NOTE\}\}[\s\S]{0,200}Step 4/);
  const step4 = section('## Step 4 — wave 1', '## Step 5 — assemble');
  assert.doesNotMatch(step4, /prints nothing for a file the change created/);
  assert.match(step4, /every line of (it|such a file) is new/);
});

test('Step 10 lists every finding the threshold cut, not only their number', () => {
  const step10 = section('## Step 10 — finish', '## Mode `init`');
  assert.match(step10, /`belowThreshold`/);
  assert.match(step10, /`file:lines`[\s\S]{0,200}`note`/);
});

// The pattern review-does-not-check-pr-against-its-issue names `recheck` too:
// `recheck 198` (2026-10-09) confirmed 3/3 remarks while the branch carried
// another task's changes, found only by reading the issue by hand.
test('recheck checks the PR against the issues it closes', () => {
  const recheck = section('## Mode `recheck`', '## Mode `send`');
  assert.match(recheck, /closingIssuesReferences/);
  assert.match(recheck, /gh issue view/);
  assert.match(recheck, /ticked or not/i);
  assert.match(recheck, /outside the issue's scope|scope does not cover/i);
  assert.match(recheck, /quotes the issue sentence/i);
  assert.match(recheck, /element issue \| status \| dowód na tipie/);
  assert.match(TEXT, /\| `\/code-review-master recheck <n> \[reviewer\]` \|[^\n]*issues? it closes/);
});

test('views named by the issue are checked in Figma by the session itself', () => {
  const figma = section('## Step 4b — Figma', '## Step 5 — assemble');
  assert.match(figma, /yourself/i);
  assert.match(figma, /no Figma tools/i);
  assert.match(figma, /wave 2 cannot open Figma/i);
  assert.match(figma, /one line[\s\S]{0,200}Polish/i);
});
