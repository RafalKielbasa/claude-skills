import { execFileSync } from 'node:child_process';
import { statSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { matchGlob } from './glob.mjs';

const ISSUE_FIELDS = 'number,title,body,url';

// One issue's text, from the repository `slug` names or, without one, from the
// repository under review. A failed fetch keeps the issue in the list with a
// null body: the caller must be able to say "issue 9 could not be read" rather
// than treat the task as having no requirements.
function fetchIssue(callGh, number, slug, url = null) {
  try {
    const parsed = JSON.parse(callGh(['issue', 'view', String(number),
      ...(slug ? ['--repo', slug] : []), '--json', ISSUE_FIELDS]));
    return { number: parsed.number ?? Number(number), title: parsed.title ?? null,
      body: parsed.body ?? null, url: parsed.url ?? url };
  } catch {
    return { number: Number(number), title: null, body: null, url };
  }
}

// The text an axis that needs the issue is given: one section per issue.
export function renderIssues(issues) {
  return issues.map((issue) => {
    const heading = `### Issue #${issue.number}${issue.title ? ` — ${issue.title}` : ''}${issue.url ? ` (${issue.url})` : ''}`;
    const body = typeof issue.body === 'string' && issue.body.trim() !== ''
      ? issue.body.trim()
      : '(the text of this issue could not be fetched — report that instead of guessing its requirements)';
    return `${heading}\n\n${body}`;
  }).join('\n\n');
}

// The command that shows what the change did to one file: the caller appends
// the path. Forward slashes, because the command is run in a POSIX shell and a
// Windows path's backslashes would be read there as escapes.
function diffCommandFor(repoDir, mode, base, head) {
  const prefix = `git -C "${resolve(repoDir).replace(/\\/g, '/')}" diff`;
  if (mode === 'working') return `${prefix} HEAD --`;
  if (mode === 'branch' || mode === 'since') return `${prefix} ${base} ${head} --`;
  // Three dots: the PR's own changes, from its merge base, not everything the
  // base branch gained since.
  if (mode === 'pr') return `${prefix} ${base}...${head} --`;
  return null;
}

// A file the change deleted has no size on disk; rank it as the cheapest to read.
function sizeOf(repoDir, path) {
  try {
    return statSync(join(repoDir, path)).size;
  } catch {
    return 0;
  }
}

function git(repoDir, args) {
  return execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// `git diff --numstat` prints "added<TAB>removed<TAB>path"; binary files print "-".
function parseNumstat(out) {
  return out.split('\n').filter(Boolean).map((line) => {
    const [added, removed, ...rest] = line.split('\t');
    return { path: rest.join('\t'), added: added === '-' ? 0 : Number(added), removed: removed === '-' ? 0 : Number(removed) };
  });
}

function mergeFiles(lists) {
  const byPath = new Map();
  for (const file of lists.flat()) {
    const seen = byPath.get(file.path);
    if (seen) { seen.added += file.added; seen.removed += file.removed; continue; }
    byPath.set(file.path, { ...file });
  }
  return [...byPath.values()];
}

// A brand-new file has no diff to count lines from — `git diff --numstat`
// simply never sees it — so it needs its own count, or it ranks below every
// modified file on the churn key, the opposite of its actual risk: a new file
// is entirely unreviewed code, not a small edit.
function lineCount(repoDir, path) {
  try {
    const text = readFileSync(join(repoDir, path), 'utf8');
    if (text === '') return 0;
    // Matches how `git diff --numstat` counts an added file: a trailing
    // newline is the line terminator, not a further empty line.
    return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
  } catch {
    // Binary content, or the file is gone by the time this runs — treat it as
    // the cheapest to review rather than fail the whole target collection.
    return 0;
  }
}

function untrackedFiles(repoDir) {
  return git(repoDir, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .map((path) => ({ path, added: lineCount(repoDir, path), removed: 0 }));
}

export function collectTarget(repoDir, mode, opts = {}) {
  const exclude = opts.exclude ?? [];
  const head = git(repoDir, ['rev-parse', 'HEAD']).trim();
  let base = null;
  let prHead = null;
  let files = [];
  // `opts.gh` is injected by the tests so the PR and issue paths are covered
  // without a live pull request; production passes nothing and the real gh runs.
  const callGh = opts.gh ?? ((args) => execFileSync('gh', args,
    { cwd: repoDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  const issues = [];

  if (mode === 'working') {
    files = mergeFiles([
      parseNumstat(git(repoDir, ['diff', '--numstat'])),
      parseNumstat(git(repoDir, ['diff', '--numstat', '--cached'])),
      untrackedFiles(repoDir),
    ]);
    base = head;
  } else if (mode === 'branch') {
    const against = opts.base ?? 'main';
    base = git(repoDir, ['merge-base', 'HEAD', against]).trim();
    files = parseNumstat(git(repoDir, ['diff', '--numstat', `${base}..HEAD`]));
  } else if (mode === 'since') {
    base = opts.base ?? null;
    if (base === null) throw new Error('since mode needs a base sha; state.json has none — run another mode first');
    // A force-push, rebase, squash-merge or `git gc` can make the recorded
    // baseline unreachable in this clone — and so can a first `since` run
    // after `pr` seeded it with a headRefOid from the GitHub API, which need
    // not exist locally at all. Left unchecked, `git diff` would surface
    // git's own "bad revision" message instead of naming the recovery.
    try {
      git(repoDir, ['cat-file', '-e', `${base}^{commit}`]);
    } catch {
      throw new Error(`the recorded baseline ${base} is not in this repository any more `
        + '(a force-push, rebase or gc will do that). Run '
        + `\`crm reseed --repo ${repoDir}\` to set the checkpoint to the current HEAD and `
        + 'review from there, accepting that anything between the lost baseline and now '
        + 'goes unreviewed.');
    }
    files = parseNumstat(git(repoDir, ['diff', '--numstat', `${base}..HEAD`]));
  } else if (mode === 'pr') {
    const parsed = JSON.parse(callGh(['pr', 'view', String(opts.pr), '--json',
      'files,headRefOid,baseRefOid,closingIssuesReferences']));
    // Both SHAs come from the PR, never from the local checkout: a CI runner's
    // HEAD is a merge commit, and blob links built from it point nowhere.
    base = parsed.baseRefOid;
    prHead = parsed.headRefOid;
    files = parsed.files.map((f) => ({ path: f.path, added: f.additions, removed: f.deletions }));
    // The issue may live in another repository than the pull request, so each
    // is read from the repository its own reference names.
    for (const ref of parsed.closingIssuesReferences ?? []) {
      const owner = ref.repository?.owner?.login;
      const name = ref.repository?.name;
      issues.push(fetchIssue(callGh, ref.number, owner && name ? `${owner}/${name}` : null, ref.url ?? null));
    }
  } else if (mode === 'full') {
    const listed = git(repoDir, ['ls-files', ...(opts.path ? [opts.path] : [])]).split('\n').filter(Boolean);
    const from = opts.cursor ? listed.findIndex((p) => p >= opts.cursor) : 0;
    files = listed.slice(from === -1 ? listed.length : from).map((path) => ({ path, added: 0, removed: 0 }));
    base = head;
  } else {
    throw new Error(`unknown mode "${mode}"`);
  }

  files = files
    .filter((file) => !exclude.some((pattern) => matchGlob(pattern, file.path)))
    .map((file) => ({ ...file, size: sizeOf(repoDir, file.path) }));
  // Code-unit comparison, not locale-aware: the `full`-mode cursor above
  // (`>=`) and the cursor advance in bin/crm.mjs's `finish` (`>`) both compare
  // paths the same primitive way. `localeCompare` orders mixed-case paths
  // differently, which let this sort's order disagree with the cursor's — an
  // audit whose only purpose is completeness was silently dropping files.
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  // Issues the caller named (`--issue`), read from the repository under review.
  // One already brought in by the pull request is not fetched twice.
  for (const number of opts.issues ?? []) {
    if (issues.some((issue) => issue.number === Number(number))) continue;
    issues.push(fetchIssue(callGh, number, null));
  }
  // The PR number rides along in plan.json so later stages (the Semgrep
  // changed-line filter) can ask gh for the same diff without re-parsing CLI args.
  return {
    mode, base, head: prHead ?? head, pr: mode === 'pr' ? Number(opts.pr) : null, files, issues,
    diffCommand: diffCommandFor(repoDir, mode, base, prHead ?? head),
  };
}

export function isEmpty(target) {
  return target.files.length === 0;
}
