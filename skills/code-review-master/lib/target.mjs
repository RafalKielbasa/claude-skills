import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { matchGlob } from './glob.mjs';

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

function untrackedFiles(repoDir) {
  return git(repoDir, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .map((path) => ({ path, added: 0, removed: 0 }));
}

export function collectTarget(repoDir, mode, opts = {}) {
  const exclude = opts.exclude ?? [];
  const head = git(repoDir, ['rev-parse', 'HEAD']).trim();
  let base = null;
  let prHead = null;
  let files = [];

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
    files = parseNumstat(git(repoDir, ['diff', '--numstat', `${base}..HEAD`]));
  } else if (mode === 'pr') {
    // `opts.gh` is injected by the tests so the PR path is covered without a
    // live pull request; production passes nothing and the real gh runs.
    const callGh = opts.gh ?? ((args) => execFileSync('gh', args,
      { cwd: repoDir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
    const parsed = JSON.parse(callGh(['pr', 'view', String(opts.pr), '--json', 'files,headRefOid,baseRefOid']));
    // Both SHAs come from the PR, never from the local checkout: a CI runner's
    // HEAD is a merge commit, and blob links built from it point nowhere.
    base = parsed.baseRefOid;
    prHead = parsed.headRefOid;
    files = parsed.files.map((f) => ({ path: f.path, added: f.additions, removed: f.deletions }));
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
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { mode, base, head: prHead ?? head, files };
}

export function isEmpty(target) {
  return target.files.length === 0;
}
