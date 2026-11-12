import { spawnSync } from 'node:child_process';
import { statSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { overlapsHunks } from './hunks.mjs';
import { matchGlob } from './glob.mjs';

const SEVERITY = {
  ERROR: 'blocking', CRITICAL: 'blocking', HIGH: 'blocking',
  WARNING: 'suggestion', MEDIUM: 'suggestion',
  INFO: 'nitpick', LOW: 'nitpick',
};

const DETAIL_MAX = 200;

// `--pull=never`: a missing image must fail fast instead of starting a
// download that can outlast the whole timeout budget (spec 6.4). The repository
// is mounted read-only, and nothing here goes through a shell, so a path with
// spaces or metacharacters is one argv element and nothing more.
export function buildSemgrepArgs({ repo, image, name, packs, files }) {
  return [
    'run', '--rm', '--pull=never', '--name', name,
    '-v', `${repo}:/src:ro`, '-w', '/src', image,
    'semgrep', 'scan', '--metrics=off', '--json', '--quiet',
    ...packs.flatMap((pack) => ['--config', pack]),
    // `--` so a changed file named like an option (`--exclude=x`) is a path.
    '--',
    ...files.map((file) => file.replaceAll('\\', '/')),
  ];
}

const firstSentence = (text) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  const match = /^.*?[.!?](?=\s|$)/.exec(flat);
  return match ? match[0] : flat;
};

// `axisId` is the slot's id, not the member axis whose rules matched: wave 2
// groups findings by slot id, so a member label would reach no verifier.
// Evidence is read from the file, never from `extra.lines`, which recent
// Semgrep versions replace with "requires login" when not signed in.
export function mapSemgrepResults(output, { axisId, sourceOf }) {
  return (output.results ?? []).map((result) => {
    const file = String(result.path).replace(/^\.\//, '');
    const lines = [result.start.line, result.end.line];
    const evidence = sourceOf(file).split(/\r?\n/).slice(lines[0] - 1, lines[1]).join('\n');
    return {
      axis: axisId,
      file,
      lines,
      severity: SEVERITY[String(result.extra?.severity).toUpperCase()] ?? 'suggestion',
      claim: `${firstSentence(result.extra?.message)} (semgrep: ${result.check_id})`,
      evidence,
      rule: result.check_id,
    };
  });
}

const firstLine = (text) => String(text ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean)?.slice(0, DETAIL_MAX);

const isFile = (path) => {
  try { return statSync(path).isFile(); } catch { return false; }
};

// Docker may print nothing on stderr; Semgrep then reports in its JSON `errors`.
const outputDetail = (stdout) => {
  try {
    const message = JSON.parse(stdout).errors?.[0]?.message;
    if (typeof message === 'string' && message.trim() !== '') return firstLine(message);
  } catch { /* not JSON */ }
  return firstLine(stdout);
};

const defaultHeadOf = (repo) => {
  const result = spawnSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  return String(result.stdout ?? '').trim();
};

// Every outcome carries the same fields, so the report can render any status
// without checking which ones exist.
// `hunks` is a Map, null, or a function returning either. A function is called
// only once a scan is certain: in `pr` mode it runs `gh pr diff`, a network call
// that every early status (not-in-mode, disabled, nothing-to-scan, a PR not
// checked out) would otherwise pay for nothing.
export function runSemgrep({ runId, repo, plan, settings, spawn = spawnSync, hunks, headOf = defaultHeadOf, now = Date.now }) {
  const image = settings.semgrep.image;
  const lazy = typeof hunks === 'function';
  const base = { findings: [], scannedAxes: [], outsideChange: 0, errors: 0, hunksAvailable: hunks instanceof Map, image };
  const stop = (status, extra = {}) => ({ ...base, status, ...extra });

  if (plan.mode !== 'pr' && plan.mode !== 'branch') return stop('not-in-mode');
  if (settings.semgrep.enabled === false) return stop('disabled');

  // One job per (slot, member axis with rules). Files absent on disk (deleted
  // in the change) cannot be mounted and scanned, so they never reach docker.
  const jobs = [];
  for (const entry of plan.selection.selected) {
    // isFile, not exists: a directory (a submodule listed by numstat) cannot be scanned.
    const present = entry.files.map((f) => f.path).filter((path) => isFile(join(repo, path)));
    for (const axis of entry.axes) {
      // Each member scans only its own files of the slot (spec 6.2), by the same
      // `when` matching lib/axes.mjs uses to assign files to an axis.
      const files = (axis.when ?? 'always') === 'always'
        ? present
        : present.filter((path) => (axis.when ?? []).some((pattern) => matchGlob(pattern, path)));
      if ((axis.semgrep ?? []).length > 0 && files.length > 0) {
        jobs.push({ slotId: entry.axisId, axisId: axis.id, packs: axis.semgrep, files });
      }
    }
  }
  if (jobs.length === 0) return stop('nothing-to-scan');

  // A pr's files on disk are whatever is checked out; scanning another
  // checkout would report on code the PR does not contain.
  const head = plan.mode === 'pr' ? headOf(repo) : null;
  if (plan.mode === 'pr' && head !== plan.target.head) {
    return stop('unavailable', {
      reason: 'pr-not-checked-out',
      detail: `HEAD ${head.slice(0, 7)} ≠ ${String(plan.target.head).slice(0, 7)}`,
    });
  }

  const sourceOf = (path) => readFileSync(join(repo, path), 'utf8');
  const budgetMs = settings.semgrep.timeout_s * 1000;
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    return stop('unavailable', { reason: 'docker-error', detail: `invalid semgrep.timeout_s: ${settings.semgrep.timeout_s}` });
  }
  let changed = hunks;
  if (lazy) {
    // A diff that cannot be computed fails open (unfiltered, and the report
    // says so), exactly like `changedHunks` returning null.
    try { changed = hunks(); } catch { changed = null; }
  }
  const hunksAvailable = changed instanceof Map;
  // Absolute, because an older Docker CLI reads a relative `-v` source as the
  // name of a volume, not as a directory, and mounts an empty one.
  const mountRepo = resolve(repo);
  const startedAt = now();
  const scannedAxes = [];
  const kept = [];
  let outsideChange = 0;
  let errors = 0;

  for (const [n, job] of jobs.entries()) {
    const name = `crm-${runId}-${n}`;
    const remaining = budgetMs - (now() - startedAt);
    if (remaining <= 0) return stop('timeout');
    let result;
    try {
      result = spawn('docker', buildSemgrepArgs({ repo: mountRepo, image, name, packs: job.packs, files: job.files }),
        { encoding: 'utf8', timeout: remaining, maxBuffer: 64 * 1024 * 1024 });
    } catch (err) {
      // A finder failure never fails the command; the report gets one line.
      return stop('unavailable', { reason: 'docker-error', detail: firstLine(err.message) });
    }
    if (result.error?.code === 'ETIMEDOUT') {
      // spawnSync kills the docker client, not the container it started.
      spawn('docker', ['rm', '-f', name], { encoding: 'utf8', timeout: 30000 });
      return stop('timeout');
    }
    if (result.error?.code === 'ENOENT') {
      return stop('unavailable', { reason: 'docker-missing', detail: firstLine(result.error.message) });
    }
    if (result.error) {
      return stop('unavailable', { reason: 'docker-error', detail: firstLine(result.error.message) });
    }
    if (result.status !== 0) {
      const stderr = String(result.stderr ?? '');
      const reason = /No such image|Unable to find image/i.test(stderr) ? 'image-not-pulled' : 'docker-error';
      return stop('unavailable', { reason, detail: firstLine(stderr) ?? outputDetail(result.stdout) ?? `docker exited with status ${result.status}` });
    }
    let output;
    try {
      output = JSON.parse(result.stdout);
    } catch {
      output = null;
    }
    if (!output || !Array.isArray(output.results)) {
      return stop('unparsable', { detail: firstLine(result.stderr) ?? firstLine(result.stdout) ?? 'no JSON results in output' });
    }
    // Exit 0 with `errors[]` is a partial scan (a file it could not parse, a
    // rule that failed): the results stand, but the report must say so.
    if (Array.isArray(output.errors)) errors += output.errors.length;
    let mapped;
    try {
      mapped = mapSemgrepResults(output, { axisId: job.slotId, sourceOf });
    } catch (err) {
      return stop('unparsable', { detail: firstLine(err.message) });
    }
    scannedAxes.push(job.axisId);
    for (const finding of mapped) {
      if (hunksAvailable && !overlapsHunks(changed, finding.file, finding.lines)) {
        outsideChange += 1;
      } else {
        kept.push(finding);
      }
    }
  }
  return { ...base, status: 'ok', findings: kept, scannedAxes, outsideChange, errors, hunksAvailable };
}
