import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { makeRepo, writeFiles, git } from '../test-helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');

// Every call below passes `--repo <dir>` for a throwaway repository this test
// file just built, so by default we point CRM_GLOBAL_CONFIG at a file that
// does not exist inside that same throwaway directory — a path a stray
// `~/.claude/review/global.md` on the machine running the suite can never
// reach. That makes every `run()` call merge exactly the repository's own
// config.md, whether or not it goes through `loadConfig` (`plan`, `score`,
// `finish`), without having to single those commands out here. `opts.env`
// still wins when a test needs a specific global.md of its own (see the
// isolation test below) or a specific CRM_GLOBAL_CONFIG of its own.
const run = (args, opts = {}) => {
  const repoIndex = args.indexOf('--repo');
  const env = repoIndex === -1
    ? process.env
    : { ...process.env, CRM_GLOBAL_CONFIG: join(args[repoIndex + 1], 'no-global.md') };
  return execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env, ...opts });
};

const CONFIG = `---
budget: { slots: 2, max_files_per_axis: 5 }
---

# demo

## Quality

\`\`\`yaml
id: quality
when: always
rank: always
\`\`\`

- Explicit return types.
`;

// Drives a planned run to `finish` with zero findings — enough to exercise
// state.json's post-finish shape without needing a real raw/scores payload.
function finishEmptyRun(dir, runId) {
  const raw = join(dir, `${runId}-raw.json`);
  writeFileSync(raw, '[]');
  run(['assemble', '--repo', dir, '--run', runId, '--raw', raw, '--json']);
  const scores = join(dir, `${runId}-scores.json`);
  writeFileSync(scores, '[]');
  run(['score', '--repo', dir, '--run', runId, '--scores', scores, '--json']);
  run(['finish', '--repo', dir, '--run', runId, '--json']);
}

test('plan reports an empty target without selecting any axis', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, true);
  assert.equal(out.selection.agents, 0);
});

test('plan announces the budget for a real change', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, false);
  assert.equal(out.selection.selected.length, 1);
  assert.equal(out.selection.agents, 3);
});

// Previously, pending_files was injected before the empty-target check, so a
// clean tree with a truncation backlog waiting was reported non-empty — the
// nightly `since` run stopped being free on a day with no commits, the
// promise the whole unattended story rests on.
test('a clean tree with a pending backlog still reports empty', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, {
    '.claude/review/config.md': CONFIG,
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
      pending_files: { working: ['a.ts'] }, triage: [], runs: [],
    }),
  });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config+state']);
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, true, 'a pending backlog must not make a genuinely clean tree look non-empty');
});

// pending_files must be keyed by mode, like file_cursor already is — a `full`
// audit's truncation remainder must not surface as carried files in an
// unrelated `working` run. Uses a genuinely non-empty target (not a clean
// tree) so this actually exercises the carried-file injection, rather than
// passing merely because the empty-target check returns first.
test('a pending backlog recorded under one mode does not leak into another', () => {
  const dir = makeRepo({ 'a.ts': 'x\n', 'backlog.ts': 'y\n' });
  writeFiles(dir, {
    '.claude/review/config.md': CONFIG,
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
      pending_files: { full: ['backlog.ts'] }, triage: [], runs: [],
    }),
  });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config+state']);
  writeFiles(dir, { 'a.ts': 'x\ny\n' }); // a genuine working-tree change
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, false);
  const paths = out.target.files.map((f) => f.path);
  assert.equal(paths.includes('backlog.ts'), false, 'a `full` backlog must not surface as a carried file in a `working` run');
  assert.deepEqual(paths, ['a.ts']);
});

// B5: `.claude/review/**` was added to templates/config.md's own exclude
// list, but a repo config.md written before that change (like CONFIG here,
// which sets no `exclude` at all) falls back to DEFAULT_SETTINGS.exclude —
// which was still `[]`. `crm finish` rewrites the tracked state.json on
// every run, so without this default an otherwise-clean tree never looks
// clean again after the first run.
test('a repo config with no explicit exclude still ignores its own review bookkeeping', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, {
    '.claude/review/config.md': CONFIG,
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
      pending_files: {}, triage: [], runs: [],
    }),
  });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config+state']);
  // A run rewrites its own tracked state.json without anything else
  // changing — exactly what `crm finish` does on every run.
  writeFiles(dir, {
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: 'deadbeef', axis_cursor: [], file_cursor: {},
      pending_files: {}, triage: [], runs: [{ id: 'r1', artifact_url: null, exit: 0 }],
    }),
  });
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, true, 'a review\'s own rewritten state.json must not make the tree look dirty');
});

// Only `since` may advance state.json's incremental checkpoint. Any other
// mode advancing it meant an ad-hoc review swallowed commits the nightly run
// had not seen — and they were never reviewed by anything afterwards.
test('a `working` run leaves the incremental checkpoint untouched', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const seedSha = git(dir, 'rev-parse', 'HEAD');
  writeFiles(dir, {
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: seedSha, axis_cursor: [], file_cursor: {},
      pending_files: {}, triage: [], runs: [],
    }),
    'a.ts': 'x\ny\n',
  });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  finishEmptyRun(dir, plan.runId);
  const state = JSON.parse(readFileSync(join(dir, '.claude', 'review', 'state.json'), 'utf8'));
  assert.equal(state.last_reviewed_sha, seedSha, 'only `since` may advance the checkpoint');
});

test('a `since` run advances the incremental checkpoint to the new head', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const seedSha = git(dir, 'rev-parse', 'HEAD');
  writeFiles(dir, {
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: seedSha, axis_cursor: [], file_cursor: {},
      pending_files: {}, triage: [], runs: [],
    }),
  });
  writeFiles(dir, { 'a.ts': 'x\ny\n' });
  execFileSync('git', ['-C', dir, 'add', 'a.ts']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'change']);
  const newHead = git(dir, 'rev-parse', 'HEAD');
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'since', '--json']));
  finishEmptyRun(dir, plan.runId);
  const state = JSON.parse(readFileSync(join(dir, '.claude', 'review', 'state.json'), 'utf8'));
  assert.equal(state.last_reviewed_sha, newHead);
});

test('a bare `--slots` without --interactive is refused, and accepted with it', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--slots', '3', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /--slots needs --interactive/);
  }
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--slots', '3', '--interactive', '--json']));
  assert.equal(out.selection.slots, 3);
});

// Node's own uncaught-exception exit is 1 — the same code that means "a
// blocking finding survived". Without a catch around the dispatch, any
// unanticipated throw (here: `git rev-parse HEAD` in a repo with no commits)
// collapsed the two into the same, indistinguishable exit code.
//
// The assertion on stderr's content changed with B4: this failure class has
// no other diagnosis, so the catch now reports `err.stack`, not just
// `err.message` — deliberately including the "    at " frames the previous
// version of this test refused. A previous version of this same test
// asserted the opposite (no "    at " lines); that assertion tested the
// pre-B4 behaviour and is superseded, not merely relaxed.
test('an unanticipated failure exits 2 with its stack, not 1 with none', () => {
  const dir = mkdtempSync(join(tmpdir(), 'crm-nocommit-'));
  execFileSync('git', ['-C', dir, 'init', '-q', '-b', 'main']);
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'an unanticipated throw must not fall through to Node\'s own exit 1');
    assert.match(String(err.stderr), /\n\s+at /, 'the one failure class with no other diagnosis must carry its stack');
  }
});

// B4: writeJson(reportPath(...)) and the final stdout write used to sit
// *outside* the try/catch, so a broken reports directory bypassed the
// controlled exit-2 path entirely and fell through to Node's own
// uncaught-exception exit 1 — indistinguishable from "a blocking finding
// survived". Forcing `.claude/review/reports` to exist as a plain file (not
// a directory) makes the tail's own `mkdirSync(..., { recursive: true })`
// throw, without touching `command(args)` itself, which is what isolates
// this test to the tail rather than to plan's own logic.
test('a broken reports directory in the tail exits 2, not 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  writeFileSync(join(dir, '.claude', 'review', 'reports'), 'not a directory');
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'a broken reports directory must not exit 1 like an unrelated Node crash');
  }
});

test('a missing config.md exits 2 with a readable message', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /config\.md/);
  }
});

test('finish exits 1 when a blocking finding survives', () => {
  const dir = makeRepo({ 'a.ts': 'const course = findFirst({ where: { id } });\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'const course = findFirst({ where: { id } });\nchanged\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  const raw = join(dir, 'raw.json');
  writeFileSync(raw, JSON.stringify([{
    axis: 'quality', file: 'a.ts', lines: [1, 1], severity: 'blocking',
    claim: 'query without tenant filter', evidence: 'const course = findFirst({ where: { id } });',
  }]));
  const assembled = JSON.parse(run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', raw, '--json']));
  assert.deepEqual(assembled.findings.map((f) => f.id), ['f-01'], 'assemble assigns ids before verification');
  const scores = join(dir, 'scores.json');
  writeFileSync(scores, JSON.stringify([{ id: 'f-01', confidence: 95, note: 'confirmed' }]));
  run(['score', '--repo', dir, '--run', plan.runId, '--scores', scores, '--json']);
  try {
    run(['finish', '--repo', dir, '--run', plan.runId, '--json']);
    assert.fail('should have exited 1');
  } catch (err) {
    assert.equal(err.status, 1);
  }
});

test('a finding verification never scored is treated as unconfirmed, not as passing', () => {
  const dir = makeRepo({ 'a.ts': 'const course = findFirst({ where: { id } });\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'const course = findFirst({ where: { id } });\nchanged\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  const raw = join(dir, 'raw.json');
  writeFileSync(raw, JSON.stringify([{
    axis: 'quality', file: 'a.ts', lines: [1, 1], severity: 'blocking',
    claim: 'query without tenant filter', evidence: 'const course = findFirst({ where: { id } });',
  }]));
  run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', raw, '--json']);
  const scores = join(dir, 'scores.json');
  writeFileSync(scores, JSON.stringify([]));
  const scored = JSON.parse(run(['score', '--repo', dir, '--run', plan.runId, '--scores', scores, '--json']));
  assert.equal(scored.kept, 0);
  assert.equal(scored.belowThreshold, 1);
});

test('a subcommand run out of order exits 2, not 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  try {
    run(['finish', '--repo', dir, '--run', plan.runId, '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'a missing artefact is a broken run, not a failed gate');
    assert.match(String(err.stderr), /findings\.json/);
  }
});

test('a bare --slots is refused rather than read as 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--slots', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /--slots needs a number/);
  }
});

test('two plans in the same minute get distinct run ids', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const first = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'])).runId;
  const second = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'])).runId;
  assert.notEqual(first, second, 'colliding run ids overwrite each other\'s ledger');
});

test('a missing --raw file exits 2, not 1', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  try {
    run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', join(dir, 'nope.json'), '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /--raw points at/);
  }
});

test('gate exits with the code finish recorded for the latest run', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, {
    '.claude/review/state.json': JSON.stringify({
      schema: 1, runs: [{ id: '20260101-000000-abcd', artifact_url: null, exit: 1 }],
    }),
  });
  try {
    run(['gate', '--repo', dir, '--json']);
    assert.fail('should have exited 1');
  } catch (err) {
    assert.equal(err.status, 1);
  }
});

test('gate exits 2 when no run has ever reached finish', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  try {
    run(['gate', '--repo', dir, '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'no recorded run is a broken wrapper invocation, not a review verdict');
    assert.match(String(err.stderr), /no run recorded/);
  }
});

// B2: a force-push, rebase, squash-merge or `git gc` can make state.json's
// last_reviewed_sha unreachable. Before this fix `since` exited 2 forever
// with git's own "bad revision" message, and SKILL.md tells the caller that
// exit 2 means stop and never retry — so the nightly job was dead until a
// human hand-edited state.json. The fabricated sha here never existed in any
// repository, standing in for "a sha this clone can no longer reach".
test('since with an unreachable baseline exits 2 naming the reseed recovery', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, {
    '.claude/review/config.md': CONFIG,
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      axis_cursor: [], file_cursor: {}, pending_files: {}, triage: [], runs: [],
    }),
  });
  try {
    run(['plan', '--repo', dir, '--mode', 'since', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2, 'a lost baseline must fail in the same recognized way as any other crm plan refusal');
    assert.match(String(err.stderr), /deadbeefdeadbeefdeadbeefdeadbeefdeadbeef/, 'the message must name the lost sha');
    assert.match(String(err.stderr), /crm reseed/, 'the message must name the documented recovery');
  }
});

test('reseed moves the checkpoint to HEAD and reports both values', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, {
    '.claude/review/state.json': JSON.stringify({
      schema: 1, last_reviewed_sha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      axis_cursor: [], file_cursor: {}, pending_files: {}, triage: [], runs: [],
    }),
  });
  const head = git(dir, 'rev-parse', 'HEAD');
  const out = JSON.parse(run(['reseed', '--repo', dir, '--json']));
  assert.equal(out.previous, 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
  assert.equal(out.now, head);
  const state = JSON.parse(readFileSync(join(dir, '.claude', 'review', 'state.json'), 'utf8'));
  assert.equal(state.last_reviewed_sha, head, 'reseed must actually persist the new checkpoint, not just report it');
});

// B2: the first-run seed used to fire for any mode, including `pr` — whose
// head sha is read from the GitHub API (`headRefOid`) and need not exist in
// this local clone at all. Seeding last_reviewed_sha with it would leave a
// later `since` run unable to resolve its own baseline, the exact failure
// this fix's other two changes exist to recover from. `finish` is driven
// directly here (bypassing `crm plan --mode pr`, which needs a real `gh`)
// because finish trusts plan.json's own `target.head` verbatim regardless of
// how that file was produced.
test('a first run in pr mode leaves the checkpoint null', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const runId = '20260101-000000-abcd';
  writeFiles(dir, {
    [`.claude/review/reports/${runId}-plan.json`]: JSON.stringify({
      runId, mode: 'pr',
      target: { mode: 'pr', base: 'basesha', head: 'prheadshanotinthisclone0000000000000000', files: [] },
      empty: false,
      selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0, nextAxisCursor: [] },
    }),
  });
  finishEmptyRun(dir, runId);
  const state = JSON.parse(readFileSync(join(dir, '.claude', 'review', 'state.json'), 'utf8'));
  assert.equal(state.last_reviewed_sha, null,
    'a pr-mode first run must not seed the checkpoint with a head this clone may not have');
});

// Pins the fix for the test-isolation defect this file's `run` helper exists
// to close: `loadConfig` used to read a fixed `~/.claude/review/global.md`,
// so the whole suite's result depended on whether that file existed on the
// machine running it, and on what was in it. `CRM_GLOBAL_CONFIG` makes the
// global path an explicit input instead. This test deliberately points it at
// a real file — everywhere else in this file the `run` helper points it at a
// path that does not exist, which is the isolation this test exists to
// verify actually works, not merely to assume it.
test('a global config outside the repository does not change a run', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const globalFile = join(dir, 'global.md');
  writeFileSync(globalFile, '---\n---\n\n## Extra\n\n```yaml\nid: extra\nwhen: always\nrank: always\n```\n\n- an axis the repository never asked for.\n');
  const withGlobal = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'],
    { env: { ...process.env, CRM_GLOBAL_CONFIG: globalFile } }));
  const without = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json'],
    { env: { ...process.env, CRM_GLOBAL_CONFIG: join(dir, 'nope.md') } }));
  assert.equal(withGlobal.selection.selected.length, 2, 'the global axis is inherited when one is configured');
  assert.equal(without.selection.selected.length, 1, 'and absent when none is');
});
