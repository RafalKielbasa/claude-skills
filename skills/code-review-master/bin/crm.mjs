#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';
import { collectTarget, isEmpty } from '../lib/target.mjs';
import { selectAxes } from '../lib/axes.mjs';
import { assemble, validateFinding, applyThresholds } from '../lib/findings.mjs';
import { recordTriage } from '../lib/triage.mjs';
import { renderReport } from '../lib/report.mjs';
import { buildCodexPrompt, runCodex } from '../lib/codex.mjs';
import { blobLink } from '../lib/links.mjs';
import { embedJson } from '../lib/embed.mjs';
import { exitCode } from '../lib/gate.mjs';
import { readState, writeState } from '../lib/state.mjs';
import { selectFixable } from '../lib/fixable.mjs';

// This skill's own directory, needed to locate `templates/artifact.html`
// regardless of which repository `--repo` names — the template ships with
// the skill, not with the repository under review.
const HERE = dirname(fileURLToPath(import.meta.url));

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) { out._.push(token); continue; }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; continue; }
    out[key] = next;
    i += 1;
  }
  return out;
}

// The budget may only be raised by a person, explicitly passing --interactive,
// with a sane number. Wrapper discipline is not enough: any CI step could call
// this — and TTY detection could not either, since stdout is piped for --json
// on every call this skill makes, interactive session or not.
function readSlots(args) {
  if (args.slots === undefined) return null;
  // A bare `--slots` parses as `true`, and `Number(true)` is 1 — so forgetting
  // the number would silently *lower* the budget instead of raising it.
  if (args.slots === true) fail('--slots needs a number, for example --slots 8');
  if (!args.interactive) fail('--slots needs --interactive: an unattended run may not raise the agent budget');
  const value = Number(args.slots);
  if (!Number.isInteger(value) || value < 1 || value > 20) fail(`--slots must be an integer between 1 and 20, got "${args.slots}"`);
  return value;
}

const reviewDir = (repo) => join(repo, '.claude', 'review');
const runningPath = (repo) => join(reviewDir(repo), '.running');
const reportPath = (repo, runId, name) => join(reviewDir(repo), 'reports', `${runId}-${name}`);

function loadConfig(repo) {
  const repoPath = join(reviewDir(repo), 'config.md');
  if (!existsSync(repoPath)) fail(`no .claude/review/config.md in ${repo} — run "/code-review-master init" first`);
  // Overridable so this path — the developer's own home directory — is not
  // load-bearing for anything that must be reproducible. This is
  // configuration selection, not a safety bypass: nothing about it weakens a
  // guard, it only says which global.md to merge in, the same document
  // Step 1 of SKILL.md already lets the user hand-edit. A test suite whose
  // outcome depends on whether *this developer's* machine happens to have
  // `~/.claude/review/global.md`, and what is in it, is not a suite anyone
  // else can trust — see test/cli.test.mjs's `run` helper, which points this
  // at a path inside each test's own throwaway repo so every run merges
  // exactly the repository's own config.md, regardless of the machine it
  // runs on.
  const globalPath = process.env.CRM_GLOBAL_CONFIG
    ?? join(homedir(), '.claude', 'review', 'global.md');
  const globalDoc = existsSync(globalPath)
    ? parseConfigDoc(readFileSync(globalPath, 'utf8'))
    : { settings: {}, axes: [], ignoredSections: [] };
  const config = mergeConfig(globalDoc, parseConfigDoc(readFileSync(repoPath, 'utf8')));
  const problems = validateConfig(config);
  if (problems.length > 0) fail(`config.md problems:\n- ${problems.join('\n- ')}`);
  return config;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// Exit 1 means "the review failed you"; exit 2 means "the run broke". A missing
// artefact is the second, so it must not reach Node's uncaught-exception exit,
// which is also 1 and would make the two indistinguishable to CI.
function readRunFile(repo, runId, name) {
  const path = reportPath(repo, runId, name);
  if (!existsSync(path)) {
    fail(`run ${runId} has no ${name} — the pipeline order is plan, assemble, score, codex, render, artifact, finish`);
  }
  return readJson(path);
}

// Same contract for caller-supplied paths. A wave agent that failed to write
// its output is a broken run, not a failed gate, and must not exit 1.
function readInputFile(path, flag) {
  if (path === undefined || path === true) fail(`${flag} needs a file path`);
  if (!existsSync(path)) fail(`${flag} points at ${path}, which does not exist`);
  return readJson(path);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function gitRemote(repo) {
  try {
    // git writes "No such remote" to stderr, which Node forwards to ours; a
    // repository with no remote is a normal case, not something to print.
    return execFileSync('git', ['-C', repo, 'remote', 'get-url', 'origin'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

const COMMANDS = {
  plan(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const state = readState(repo);
    const mode = args.mode ?? 'working';
    const slotsOverride = readSlots(args);
    const target = collectTarget(repo, mode, {
      base: mode === 'since' ? state.last_reviewed_sha : args.base,
      pr: args.pr, path: args.path, cursor: state.file_cursor[mode],
      exclude: config.settings.exclude,
    });
    // Seconds and a random suffix, because two `plan` calls in the same minute
    // would otherwise share a runId and overwrite each other's plan.json and
    // dispatch ledger — and `finish` would then check one run's ledger against
    // another run's announced budget.
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const runId = `${stamp.slice(0, 8)}-${stamp.slice(8)}-${Math.random().toString(36).slice(2, 6)}`;
    if (isEmpty(target)) {
      return { runId, mode, target, empty: true, selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0 } };
    }
    // Files a truncated earlier run of THIS mode gave up come back at the head
    // of the queue, otherwise the same low-churn files lose every ranking
    // forever. Injected only now, after the emptiness check above returns —
    // a clean tree must stay empty even with a backlog waiting, or the
    // nightly `since` run stops being free on a day with no commits, which is
    // the promise the whole unattended story rests on. Keyed by mode, like
    // `file_cursor` already is, so a truncated `full` audit's remainder
    // cannot leak into `working`, `branch`, `since` or `pr` runs.
    const known = new Set(target.files.map((f) => f.path));
    for (const path of state.pending_files?.[mode] ?? []) {
      if (known.has(path) || !existsSync(join(repo, path))) continue;
      target.files.push({ path, added: 0, removed: 0, size: statSync(join(repo, path)).size, carried: true });
    }
    const selection = selectAxes({
      axes: config.axes, files: target.files, settings: config.settings, state, slotsOverride,
    });
    return { runId, mode, target, empty: false, selection, settings: config.settings, axes: config.axes };
  },

  dispatched(args) {
    const repo = args.repo ?? process.cwd();
    const path = reportPath(repo, args.run, 'dispatch.json');
    const ledger = existsSync(path) ? readJson(path) : [];
    ledger.push({ wave: args.wave, label: args.label ?? '', at: new Date().toISOString() });
    writeJson(path, ledger);
    return { logged: ledger.length };
  },

  // Written by the wrapper before it starts the session, removed by `finish`.
  // Without it `gate` has no way to tell "this run finished" from "this run
  // died and the newest entry belongs to last night" — and the second case
  // would report last night's verdict as today's.
  begin(args) {
    const repo = args.repo ?? process.cwd();
    mkdirSync(reviewDir(repo), { recursive: true });
    writeFileSync(runningPath(repo), `${new Date().toISOString()}\n`, 'utf8');
    return { started: true };
  },

  // The wrapper's half of the gate: run after `claude -p` returns, it exits
  // with the code the review itself decided on.
  gate(args) {
    const repo = args.repo ?? process.cwd();
    if (existsSync(runningPath(repo))) {
      const started = readFileSync(runningPath(repo), 'utf8').trim();
      fail(`a run started at ${started} never reached crm finish — treating it as broken, `
        + 'not as the verdict of whatever ran before it');
    }
    const state = readState(repo);
    const last = state.runs.at(-1);
    if (!last) fail('no run recorded in state.json — the review did not reach crm finish');
    if (last.exit === null || last.exit === undefined) {
      fail(`run ${last.id} never recorded an exit code — the review did not reach crm finish`);
    }
    process.stdout.write(`${JSON.stringify({ run: last.id, exit: last.exit })}\n`);
    process.exit(last.exit);
  },

  // The documented recovery from a lost baseline. Deliberately manual: what to
  // do about the commits between the lost sha and now is a judgement about
  // risk, not something a nightly job should decide for the user.
  reseed(args) {
    const repo = args.repo ?? process.cwd();
    const state = readState(repo);
    const head = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const previous = state.last_reviewed_sha;
    state.last_reviewed_sha = head;
    writeState(repo, state);
    return { previous, now: head };
  },

  // Ids are assigned here, before verification, because wave 2 scores by id.
  assemble(args) {
    const repo = args.repo ?? process.cwd();
    const state = readState(repo);
    const sourceOf = (path) => readFileSync(join(repo, path), 'utf8');
    const rejected = [];
    const valid = [];
    for (const finding of readInputFile(args.raw, '--raw')) {
      const check = validateFinding(finding, sourceOf);
      if (!check.ok) { rejected.push({ claim: finding.claim, why: check.why }); continue; }
      valid.push(finding);
    }
    const out = assemble({
      run: { id: args.run, mode: args.mode ?? null },
      findings: valid, triage: state.triage, today: new Date().toISOString().slice(0, 10),
    });
    out.rejectedForEvidence = rejected;
    writeJson(reportPath(repo, args.run, 'findings.json'), out);
    return {
      findings: out.findings.map((f) => ({ id: f.id, axis: f.axis, file: f.file, lines: f.lines, severity: f.severity, claim: f.claim, evidence: f.evidence })),
      suppressed: out.suppressed.length,
      rejectedForEvidence: rejected.length,
    };
  },

  score(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const path = reportPath(repo, args.run, 'findings.json');
    const data = readRunFile(repo, args.run, 'findings.json');
    const byId = new Map(readInputFile(args.scores, '--scores').map((s) => [s.id, s]));
    for (const finding of data.findings) {
      const score = byId.get(finding.id);
      finding.confidence = score ? score.confidence : 0;
      finding.verifyNote = score ? (score.note ?? '') : 'not scored — verification returned nothing for this id';
    }
    const { kept, dropped } = applyThresholds(data.findings, config.settings.confidence_threshold);
    data.findings = kept;
    data.belowThreshold = dropped.map((f) => ({ id: f.id, confidence: f.confidence, claim: f.claim }));
    writeJson(path, data);
    return { kept: kept.length, belowThreshold: dropped.length };
  },

  codex(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const path = reportPath(repo, args.run, 'findings.json');
    const data = readRunFile(repo, args.run, 'findings.json');
    // The skip must be persisted like any other outcome. Leaving it out made the
    // report's label a coincidence of a default rather than a recorded fact, so
    // "codex was switched off" and "the codex step never ran" looked identical.
    if (!config.settings.codex.enabled || data.findings.length === 0) {
      data.codexStatus = config.settings.codex.enabled ? 'nothing-to-judge' : 'disabled';
      writeJson(path, data);
      return { status: data.codexStatus };
    }
    const result = runCodex(buildCodexPrompt(data.findings),
      { cwd: repo, timeoutMs: config.settings.codex.timeout_s * 1000 });
    for (const finding of data.findings) {
      finding.codex = result.verdicts[finding.id] ?? { verdict: 'unsure', reason: result.status, fix: null };
    }
    data.codexStatus = result.status;
    writeJson(path, data);
    return { status: result.status, judged: Object.keys(result.verdicts).length };
  },

  render(args) {
    const repo = args.repo ?? process.cwd();
    const data = readRunFile(repo, args.run, 'findings.json');
    const plan = readRunFile(repo, args.run, 'plan.json');
    // An axis named here was selected and paid for but produced nothing this
    // skill can stand behind — the report must say so, not stay silent and
    // let "Osie w tym przebiegu" imply it was reviewed like the others.
    const incomplete = args.incomplete
      ? String(args.incomplete).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const markdown = renderReport({
      run: { id: args.run, mode: plan.mode, base: plan.target.base, head: plan.target.head },
      selection: plan.selection, findings: data.findings, suppressed: data.suppressed,
      prose: args.prose ? readInputFile(args.prose, '--prose') : {},
      codexStatus: data.codexStatus ?? 'skipped', remote: gitRemote(repo), incomplete,
    });
    const out = reportPath(repo, args.run, 'raport.md');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, markdown, 'utf8');
    return { report: out, bytes: markdown.length };
  },

  // Interactive-only per SKILL.md Step 9 — that restriction is enforced by the
  // calling document (there is a terminal to publish the result to, or the
  // step is skipped), not by this command. Unlike `--slots` and `fixable`,
  // there is no `--interactive` gate here either: "is a person watching to
  // receive a URL" is a fact only the calling document knows, not something
  // worth encoding as a flag this command would refuse to run without.
  artifact(args) {
    const repo = args.repo ?? process.cwd();
    if (args.out === undefined || args.out === true) fail('--out needs a file path');
    const data = readRunFile(repo, args.run, 'findings.json');
    const plan = readRunFile(repo, args.run, 'plan.json');
    // The prose written in Step 8 is the only Polish text tied to a finding —
    // findings.json itself is English by contract (see SKILL.md's Overview).
    // Without this merge the page would have no body to show for any finding.
    // Optional, the way `crm render`'s --prose is: a zero-finding run may
    // legitimately have no prose.json at all, and failing here would tell the
    // model to report a defect that is not one.
    const prosePath = reportPath(repo, args.run, 'prose.json');
    const prose = existsSync(prosePath) ? readJson(prosePath) : {};
    const remote = gitRemote(repo);
    // Same contract as `crm render`'s --incomplete: an axis named here was
    // selected and paid for but produced nothing this skill can stand behind —
    // the page must say so, not stay silent and let the coverage line imply it
    // was reviewed like the others.
    const incomplete = args.incomplete
      ? String(args.incomplete).split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const findings = data.findings.map((finding) => {
      const text = prose[finding.id];
      return {
        ...finding,
        // `?.` and `??`, not a truthiness check on the whole entry: a prose
        // entry present but missing one field would otherwise render the
        // literal string "undefined" as a heading. Same fallback wording
        // report.mjs uses for a finding prose never covered, so the two
        // renderings of one run never disagree.
        title: text?.title ?? `${finding.claim} [bez opisu]`,
        body: text?.body ?? '',
        link: blobLink(remote, plan.target.head, finding.file, finding.lines),
      };
    });
    const template = readFileSync(join(HERE, '..', 'templates', 'artifact.html'), 'utf8');
    // Named for the repository, not the run: a title is a name, not a summary,
    // and it must stay stable across that repository's runs so people find the
    // artifact by it. The run itself is told apart by the publish-time
    // description and the gallery's own timestamp, not by this string. The
    // trailing-separator trim keeps a `--repo` ending in `/` or `\` from
    // splitting to an empty trailing segment, which would otherwise title the
    // page just "Review " with nothing after it.
    const title = `Review ${repo.replace(/[\\/]+$/, '').split(/[\\/]/).pop()}`;
    const page = template
      .replace('{{TITLE}}', title)
      .replace('{{DATA}}', embedJson({
        run: { id: args.run, mode: plan.mode, head: plan.target.head },
        selection: plan.selection, findings, suppressed: data.suppressed.length,
        // Both honesty markers `raport.md` already carries, mirrored into the
        // page the user may hand someone else — matched wording, in
        // templates/artifact.html, against lib/report.mjs's, so the two
        // renderings of one run cannot disagree.
        incomplete, codexStatus: data.codexStatus ?? 'skipped',
      }));
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, page, 'utf8');
    return { page: args.out, findings: data.findings.length };
  },

  finish(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const data = readRunFile(repo, args.run, 'findings.json');
    const plan = readRunFile(repo, args.run, 'plan.json');
    // The ledger is the mechanical half of the budget guarantee: the plan says
    // what may run, this says what did, and a mismatch fails the run.
    const ledgerPath = reportPath(repo, args.run, 'dispatch.json');
    const ledger = existsSync(ledgerPath) ? readJson(ledgerPath) : [];
    const allowedLabels = new Set(plan.selection.selected.map((s) => s.axisId));
    const stray = ledger.filter((entry) => entry.wave !== 'brief' && !allowedLabels.has(entry.label));
    if (ledger.length > plan.selection.agents) {
      fail(`dispatch ledger holds ${ledger.length} agents, the announced budget was ${plan.selection.agents}`);
    }
    if (stray.length > 0) {
      fail(`dispatch ledger names axes the plan did not select: ${stray.map((e) => e.label).join(', ')}`);
    }
    // A short ledger is not a broken run — an agent may have been logged as
    // incomplete on purpose (Step 3b) rather than retried. It is still worth
    // a warning: nothing else in this pipeline notices a dispatch that was
    // announced and never happened.
    if (ledger.length < plan.selection.agents) {
      process.stderr.write(`warning: dispatch ledger holds ${ledger.length} agents, `
        + `the announced budget was ${plan.selection.agents} — the shortfall was not logged as dispatched\n`);
    }

    const state = readState(repo);
    // Only `since` owns the incremental checkpoint. Letting any mode advance it
    // meant an ad-hoc review swallowed commits the nightly run had not seen —
    // and they were never reviewed by anything afterwards. The seed lets the
    // first run bootstrap it, but never from `pr`, whose head sha comes from
    // the GitHub API and need not exist in this clone at all.
    if (plan.mode === 'since' || (state.last_reviewed_sha === null && plan.mode !== 'pr')) {
      state.last_reviewed_sha = plan.target.head;
    }
    state.axis_cursor = plan.selection.nextAxisCursor ?? state.axis_cursor;
    // Files the caps ranked out are remembered by path and jump the queue next
    // run of the SAME mode. Keyed by mode, like `file_cursor`: a truncated
    // `full` audit's remainder must not surface as carried files in a
    // `working`, `branch`, `since` or `pr` run. Without the mode key at all,
    // spec §4.3 rule 3 — "the next run picks up the remainder" — was a
    // sentence nothing implemented correctly.
    state.pending_files = {
      ...state.pending_files,
      [plan.mode]: [...new Set(plan.selection.selected.flatMap((s) => s.skippedFiles))].sort(),
    };
    if (plan.mode === 'full') {
      const listed = plan.target.files.map((f) => f.path);
      const reviewed = new Set(plan.selection.selected.flatMap((s) => s.files.map((f) => f.path)));
      const lastReviewed = listed.filter((path) => reviewed.has(path)).at(-1);
      // Only move the cursor when something was actually reviewed. Advancing on
      // an empty pass would reset to the start of the repository, making "read
      // nothing this time" indistinguishable from "finished, wrap around".
      if (lastReviewed !== undefined) {
        state.file_cursor = { ...state.file_cursor, full: listed.find((path) => path > lastReviewed) ?? '' };
      }
    }
    state.runs = [...state.runs, { id: args.run, artifact_url: args.artifact ?? null, exit: null }].slice(-50);
    writeState(repo, state);
    const code = exitCode({
      findings: data.findings, gate: config.settings.gate, gateOnDisputed: config.settings.gate_on_disputed,
    });
    // Recorded, not only returned. `crm finish` runs inside the Claude session,
    // and `claude -p` exits with its own status — so a wrapper reading only the
    // process code would see 0 for every run and the CI gate would never fail.
    state.runs[state.runs.length - 1].exit = code;
    writeState(repo, state);
    // The run reached its end, so the sentinel the wrapper wrote comes down.
    // Anything that leaves it in place is a run that died on the way here.
    try { rmSync(runningPath(repo)); } catch { /* absent when run outside a wrapper */ }
    process.stdout.write(`${JSON.stringify({ exit: code, findings: data.findings.length })}\n`);
    process.exit(code);
  },

  triage(args) {
    const repo = args.repo ?? process.cwd();
    const path = reportPath(repo, args.run, 'findings.json');
    const data = readRunFile(repo, args.run, 'findings.json');
    const finding = data.findings.find((f) => f.id === args.id);
    if (!finding) fail(`no finding ${args.id} in run ${args.run}`);
    const state = recordTriage(readState(repo), finding, {
      verdict: args.verdict, scope: args.scope ?? 'here', reason: args.reason ?? '', until: args.until ?? null,
    });
    writeState(repo, state);
    finding.triage = { verdict: args.verdict, scope: args.scope ?? 'here', reason: args.reason ?? '' };
    writeJson(path, data);
    return { id: args.id, verdict: args.verdict };
  },

  suppressed(args) {
    const repo = args.repo ?? process.cwd();
    const state = readState(repo);
    if (args.restore) {
      state.triage = state.triage.filter((entry) => entry.fingerprint !== args.restore);
      writeState(repo, state);
      return { restored: args.restore, remaining: state.triage.length };
    }
    return { triage: state.triage };
  },

  detect(args) {
    const repo = args.repo ?? process.cwd();
    const tracked = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const has = (path) => tracked.includes(path);
    const pkg = has('package.json') ? JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')) : null;
    const byExtension = { ts: 'typescript', tsx: 'typescript', js: 'javascript', py: 'python', go: 'go', rs: 'rust' };
    const languages = [...new Set(tracked
      .map((path) => byExtension[path.split('.').pop()])
      .filter(Boolean))];
    return {
      name: pkg?.name ?? repo.split(/[\\/]/).pop(),
      remote: gitRemote(repo),
      packageManager: has('pnpm-lock.yaml') || has('pnpm-workspace.yaml') ? 'pnpm'
        : has('yarn.lock') ? 'yarn' : has('package-lock.json') ? 'npm' : null,
      languages,
      lintCommands: Object.fromEntries(Object.entries(pkg?.scripts ?? {})
        .filter(([name]) => ['lint', 'typecheck', 'test', 'format:check'].includes(name))),
      docs: tracked.filter((path) => /^(docs\/|AGENTS\.md$|CLAUDE\.md$|CONTRIBUTING\.md$)/.test(path)),
      topLevelDirs: [...new Set(tracked.map((path) => path.split('/')[0]).filter((seg) => !seg.includes('.')))],
    };
  },

  latest(args) {
    const repo = args.repo ?? process.cwd();
    const dir = join(reviewDir(repo), 'reports');
    if (!existsSync(dir)) return { runId: null };
    const ids = [...new Set(readdirSync(dir)
      .map((name) => /^(.+?)-findings\.json$/.exec(name)?.[1])
      .filter(Boolean))].sort();
    const runId = ids.at(-1) ?? null;
    if (runId === null) return { runId: null };
    return { runId, report: reportPath(repo, runId, 'raport.md'), findings: reportPath(repo, runId, 'findings.json') };
  },

  fixable(args) {
    const repo = args.repo ?? process.cwd();
    // Listing what could be fixed is the first step of fixing, so the same
    // explicit-flag requirement applies here as to `--slots`: an unattended run
    // must not be able to start this flow. There is deliberately no way past
    // this — an escape hatch for tests is an escape hatch in production too.
    if (!args.interactive) fail('fix needs --interactive: an unattended run never edits code');
    const data = readRunFile(repo, args.run, 'findings.json');
    return selectFixable(data.findings, args.ids);
  },
};

const args = parseArgs(process.argv.slice(2));
const name = args._[0];
const command = COMMANDS[name];
if (!command) fail(`unknown command "${name ?? ''}" — expected one of ${Object.keys(COMMANDS).join(', ')}`);
let result;
try {
  result = command(args);
  if (name === 'plan') {
    const repo = args.repo ?? process.cwd();
    writeJson(reportPath(repo, result.runId, 'plan.json'), result);
  }
  process.stdout.write(`${JSON.stringify(result, null, args.json ? 0 : 2)}\n`);
} catch (err) {
  // Anything unanticipated is a broken run, not a review verdict. Node's own
  // uncaught-exception exit is 1, which already means "a blocking finding
  // survived" — the two must not collapse. The stack goes with it because this
  // is the failure class with no other diagnosis.
  fail(err && err.stack ? err.stack : String(err));
}
