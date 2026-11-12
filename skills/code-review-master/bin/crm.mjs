#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';
import { collectTarget, isEmpty } from '../lib/target.mjs';
import { selectAxes } from '../lib/axes.mjs';
import { assemble, validateFinding, applyThresholds } from '../lib/findings.mjs';
import { recordTriage } from '../lib/triage.mjs';
import { renderReport } from '../lib/report.mjs';
import { buildCodexPrompt, runCodex, runCodexFind } from '../lib/codex.mjs';
import { effectiveDeadlineMs, failureDetail, killProcessTree, startWorker } from '../lib/finders.mjs';
import { runSemgrep } from '../lib/semgrep.mjs';
import { changedHunks } from '../lib/hunks.mjs';
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

// The finders result exists only for pr/branch runs where `crm finders` ran;
// absence is meaningful (the report says the step did not run), so it is null
// here rather than a failure.
function readFinders(repo, runId) {
  const path = reportPath(repo, runId, 'finders.json');
  return existsSync(path) ? readJson(path) : null;
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

// Temp file + rename, so a reader polling for the file (`finders --wait`) can
// never observe a half-written document.
function writeJsonAtomic(path, value) {
  // Per-process name: two writers (worker and a `--wait` declaring it dead) must
  // not rename each other's half-written temp file.
  const tmp = `${path}.${process.pid}.tmp`;
  writeJson(tmp, value);
  renameSync(tmp, path);
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// `kill(pid, 0)` sends no signal; it only asks whether the pid can be
// signalled. ESRCH means the process is gone (also on Windows); EPERM means it
// exists but belongs to someone else, which still counts as alive.
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code !== 'ESRCH';
  }
}

// How long the worker may live: the slowest finder's own timeout plus slack
// for startup, the diff (`gh pr diff`) and I/O. Past this the worker gives up
// on whatever is still running, so `--wait` can never be stuck on `pending`.
const workerDeadlineMs = (settings) =>
  (Math.max(settings.codex.find_timeout_s, settings.semgrep.timeout_s) + 120) * 1000;

// Runs one finder as a child `crm` process. `done` resolves to its status
// object plus its own timings and never rejects: a finder that crashes must
// not take the other one's result down with it. `expire()` kills the child
// and settles `done` as a worker-deadline timeout (no-op once settled).
function runFinderChild(command, repo, runId) {
  const startedAt = new Date();
  let settled = false;
  let settle;
  const done = new Promise((resolve) => { settle = resolve; });
  const finish = (status) => {
    if (settled) return;
    settled = true;
    const finishedAt = new Date();
    settle({ ...status, startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt - startedAt });
  };
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url), command, '--run', runId, '--repo', repo, '--json'],
    { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const failed = (detail) => finish({ status: 'unavailable', reason: 'command-failed', detail });
  child.on('error', (err) => failed(String(err.message).slice(0, 200)));
  child.on('close', (code) => {
    const firstStderr = stderr.split(/\r?\n/).map((l) => l.trim()).find((l) => l !== '') ?? '';
    if (code !== 0) return failed(failureDetail(code, stderr));
    const line = stdout.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '').at(-1);
    try {
      const parsed = JSON.parse(line);
      if (parsed === null || typeof parsed !== 'object') throw new Error('not an object');
      return finish(parsed);
    } catch {
      return failed(firstStderr.slice(0, 200) || 'no JSON on stdout');
    }
  });
  const expire = () => {
    if (settled) return;
    killProcessTree(child);
    // Grandchildren (codex, docker) can keep the pipes open after the crm
    // child dies; destroying our ends lets the worker's event loop drain.
    child.stdout.destroy();
    child.stderr.destroy();
    finish({ status: 'timeout', reason: 'worker-deadline' });
  };
  return { done, expire };
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

const readSideFile = (repo, runId, name) => {
  const path = reportPath(repo, runId, name);
  return existsSync(path) ? readJson(path) : [];
};

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
    const rejectedBySource = { sonnet: 0, codex: 0, semgrep: 0 };
    // `source` is stamped from the file a finding came from, never from what the
    // finder wrote in it. A side file is read only when this run's finders
    // result says that finder ended `ok`: a file left by an earlier attempt, or
    // by a finder the worker was declared dead around, would otherwise reach
    // the report while its header says that finder produced nothing.
    const finders = readFinders(repo, args.run);
    const finderFile = (key, name) => (finders?.[key]?.status === 'ok' ? readSideFile(repo, args.run, name) : []);
    const inputs = [
      ['sonnet', readInputFile(args.raw, '--raw')],
      ['semgrep', finderFile('semgrep', 'semgrep-raw.json')],
      ['codex', finderFile('codexFind', 'codex-raw.json')],
    ];
    for (const [source, list] of inputs) {
      for (const raw of list) {
        const finding = { ...raw, source };
        const check = validateFinding(finding, sourceOf);
        if (!check.ok) { rejected.push({ claim: finding.claim, why: check.why, source }); rejectedBySource[source] += 1; continue; }
        valid.push(finding);
      }
    }
    const out = assemble({
      run: { id: args.run, mode: args.mode ?? null },
      findings: valid, triage: state.triage, today: new Date().toISOString().slice(0, 10),
    });
    out.rejectedForEvidence = rejected;
    out.rejectedBySource = rejectedBySource;
    writeJson(reportPath(repo, args.run, 'findings.json'), out);
    // This projection is what wave 2 verifies (SKILL.md Step 6), so it carries
    // `sources` and `alsoClaimed`: a verifier that never sees another finder's
    // claim at the same lines cannot say it describes a different problem.
    return {
      findings: out.findings.map((f) => ({
        id: f.id, axis: f.axis, file: f.file, lines: f.lines, severity: f.severity, claim: f.claim, evidence: f.evidence,
        sources: f.sources, alsoClaimed: f.alsoClaimed,
      })),
      suppressed: out.suppressed.length,
      rejectedForEvidence: rejected.length,
      rejectedBySource,
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
    // codex must not confirm a claim it wrote itself: those findings get an
    // 'own' verdict and only the rest go to the judge.
    const toJudge = [];
    for (const finding of data.findings) {
      if (finding.keptFrom === 'codex') {
        finding.codex = { verdict: 'own', reason: 'found by codex — not cross-checked', fix: finding.fix ?? null };
      } else toJudge.push(finding);
    }
    if (toJudge.length === 0) {
      data.codexStatus = 'nothing-to-judge';
      writeJson(path, data);
      return { status: data.codexStatus };
    }
    const result = runCodex(buildCodexPrompt(toJudge),
      { cwd: repo, timeoutMs: config.settings.codex.timeout_s * 1000 });
    for (const finding of toJudge) {
      finding.codex = result.verdicts[finding.id] ?? { verdict: 'unsure', reason: result.status, fix: null };
    }
    data.codexStatus = result.status;
    writeJson(path, data);
    return { status: result.status, judged: Object.keys(result.verdicts).length };
  },

  // Same persistence contract as `semgrep`: status file plus identical stdout,
  // raw file only on `ok`. The mode gate comes first so a working/since/full
  // run leaves no files behind, then the switches, then the slow codex call.
  'codex-find'(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const plan = readRunFile(repo, args.run, 'plan.json');
    if (plan.mode !== 'pr' && plan.mode !== 'branch') return { status: 'not-in-mode' };
    const statusPath = reportPath(repo, args.run, 'codex-find-status.json');
    const { codex } = config.settings;
    if (!codex.enabled || !codex.find) {
      const summary = { status: 'disabled', found: 0, droppedOffAxis: 0 };
      writeJson(statusPath, summary);
      return summary;
    }
    const result = runCodexFind(plan.selection.selected,
      { cwd: repo, timeoutMs: codex.find_timeout_s * 1000 });
    const summary = { status: result.status, found: result.findings.length, droppedOffAxis: result.droppedOffAxis };
    if (result.status === 'ok') {
      writeJson(reportPath(repo, args.run, 'codex-raw.json'), result.findings);
    } else {
      // Why it failed: the first non-empty line of what codex printed.
      const line = String(result.raw ?? '').split(/\r?\n/).map((l) => l.trim()).find((l) => l !== '');
      if (line) summary.detail = line.slice(0, 200);
    }
    writeJson(statusPath, summary);
    return summary;
  },

  // Writes its own status file and prints the same object, because the worker
  // that runs this in the background reads stdout and `assemble` reads the
  // files. `not-in-mode` writes nothing: no finder ran, so nothing to report.
  semgrep(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const plan = readRunFile(repo, args.run, 'plan.json');
    // Passed as a function: `runSemgrep` computes the diff (a gh call in pr
    // mode) only after every status that ends without a scan is ruled out.
    const result = runSemgrep({
      runId: args.run, repo, plan, settings: config.settings, hunks: () => changedHunks({ repo, plan }),
    });
    if (result.status === 'not-in-mode') return { status: 'not-in-mode' };
    const { findings, ...status } = result;
    const summary = { ...status, found: findings.length };
    if (result.status === 'ok') writeJson(reportPath(repo, args.run, 'semgrep-raw.json'), findings);
    writeJson(reportPath(repo, args.run, 'semgrep-status.json'), summary);
    return summary;
  },

  // The two finders are slow (codex, Docker) and independent of the Sonnet
  // axis agents, so the session starts them right before dispatching the axes
  // and collects them before `assemble`. A detached worker owns the children
  // because a headless `claude -p` run has no harness background tools.
  finders(args) {
    const repo = args.repo ?? process.cwd();
    const pidPath = reportPath(repo, args.run, 'finders.pid');
    const resultPath = reportPath(repo, args.run, 'finders.json');
    if (args.start) {
      const plan = readRunFile(repo, args.run, 'plan.json');
      if (plan.mode !== 'pr' && plan.mode !== 'branch') return { started: false, reason: 'not-in-mode' };
      // A re-run with the same id must not be answered with the old result.
      const ageLimitMs = workerDeadlineMs(loadConfig(repo).settings) + 60 * 1000;
      if (existsSync(pidPath)) {
        const previous = Number(readFileSync(pidPath, 'utf8').trim());
        if (Number.isInteger(previous) && pidAlive(previous) && Date.now() - statSync(pidPath).mtimeMs <= ageLimitMs) {
          return { started: false, reason: 'already-running' };
        }
      }
      // The previous attempt's status and raw files go too: a finder that this
      // attempt does not get to (worker killed, deadline) must not be reported
      // from them, nor `--wait` keep an old status for a worker declared dead.
      for (const name of ['finders.json', 'codex-raw.json', 'codex-find-status.json', 'semgrep-raw.json', 'semgrep-status.json']) {
        rmSync(reportPath(repo, args.run, name), { force: true });
      }
      return startWorker(spawn, {
        command: process.execPath,
        args: [fileURLToPath(import.meta.url), 'finders-worker', '--run', args.run, '--repo', repo],
        pidPath,
      });
    }
    if (!args.wait) fail('finders needs --start or --wait');
    if (!existsSync(pidPath) && !existsSync(resultPath)) {
      fail(`run ${args.run} has no finders to wait for — call "crm finders --start" first`);
    }
    // A bare `--max-s` parses as `true`, and `Number(true)` is 1.
    if (args['max-s'] === true) fail('--max-s needs a number of seconds, for example --max-s 20');
    const maxS = args['max-s'] === undefined ? 500 : Number(args['max-s']);
    if (!Number.isFinite(maxS) || maxS < 0) fail(`--max-s must be a non-negative number, got "${args['max-s']}"`);
    const deadline = Date.now() + maxS * 1000;
    let ageLimitMs = null;
    for (;;) {
      if (existsSync(resultPath)) return readJson(resultPath);
      const pid = existsSync(pidPath) ? Number(readFileSync(pidPath, 'utf8').trim()) : NaN;
      // A live pid is not proof: Windows and Linux reuse pids, so a pid file
      // older than the worker's own deadline names some other process.
      if (Number.isInteger(pid) && ageLimitMs === null) ageLimitMs = workerDeadlineMs(loadConfig(repo).settings) + 60 * 1000;
      const stale = Number.isInteger(pid) && Date.now() - statSync(pidPath).mtimeMs > ageLimitMs;
      if (Number.isInteger(pid) && (stale || !pidAlive(pid))) {
        // The worker renames the result into place right before it exits, so
        // look once more before declaring it dead.
        if (existsSync(resultPath)) return readJson(resultPath);
        // A finder that finished before the worker died left its own status
        // file; keep that instead of reporting it as lost.
        const own = (name) => {
          const path = reportPath(repo, args.run, name);
          return existsSync(path) ? readJson(path) : { status: 'unavailable', reason: 'worker-died' };
        };
        const summary = { codexFind: own('codex-find-status.json'), semgrep: own('semgrep-status.json'),
          finishedAt: new Date().toISOString() };
        writeJsonAtomic(resultPath, summary);
        return summary;
      }
      if (Date.now() >= deadline) return { status: 'pending' };
      sleepSync(Math.min(1000, Math.max(0, deadline - Date.now())));
    }
  },

  // Internal: spawned detached by `finders --start`. Exits by itself once both
  // children have, so nothing is left running after the result file exists.
  async 'finders-worker'(args) {
    const repo = args.repo ?? process.cwd();
    const { settings } = loadConfig(repo);
    // The env override can only shorten the worker's life; it exists so a test
    // can exercise the deadline without a finder that really hangs.
    const deadlineMs = effectiveDeadlineMs(workerDeadlineMs(settings), process.env.CRM_FINDERS_DEADLINE_MS);
    const finders = [runFinderChild('codex-find', repo, args.run), runFinderChild('semgrep', repo, args.run)];
    let expired = false;
    const timer = setTimeout(() => { expired = true; finders.forEach((f) => f.expire()); }, deadlineMs);
    const [codexFind, semgrep] = await Promise.all(finders.map((f) => f.done));
    clearTimeout(timer);
    writeJsonAtomic(reportPath(repo, args.run, 'finders.json'),
      { codexFind, semgrep, finishedAt: new Date().toISOString() });
    // Past the deadline a killed finder's grandchildren may still hold handles;
    // the result is written, so leave without waiting for them.
    if (expired) process.exit(0);
    return { done: true };
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
      finders: readFinders(repo, args.run),
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
        finders: readFinders(repo, args.run),
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
  // Only `finders-worker` is async; every other command stays synchronous.
  if (result instanceof Promise) result = await result;
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
