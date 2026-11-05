#!/usr/bin/env node
// Claude Code status line: the current git branch, the number of staged, unstaged and untracked
// files, the remote repository and the working directory. Reads the session JSON from stdin and
// prints one line; outside a git repository only the directory. Configured under `statusLine`
// in ~/.claude/settings.json.
import { spawnSync } from 'node:child_process';

function sessionDir(raw) {
  try {
    // trim() also drops the BOM a PowerShell pipe prepends, which JSON.parse rejects.
    return JSON.parse(raw.trim()).workspace?.current_dir ?? process.cwd();
  } catch {
    return process.cwd();
  }
}

function git(dir, args) {
  // --no-optional-locks: this runs every few seconds, and a status that refreshed the index
  // would take index.lock and could make a concurrent `git commit` fail.
  const result = spawnSync('git', ['--no-optional-locks', '-C', dir, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 256 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout : null;
}

function formatStatus(porcelain) {
  let head = '';
  let oid = '';
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('# branch.head ')) head = line.slice('# branch.head '.length);
    else if (line.startsWith('# branch.oid ')) oid = line.slice('# branch.oid '.length);
    else if (line.startsWith('? ')) untracked += 1;
    // An unmerged file still needs work in the tree; dropping it would make a conflict read as clean.
    else if (line.startsWith('u ')) unstaged += 1;
    else if (line.startsWith('1 ') || line.startsWith('2 ')) {
      // The XY field: X is the index against HEAD, Y is the worktree against the index, '.' is no change.
      if (line[2] !== '.') staged += 1;
      if (line[3] !== '.') unstaged += 1;
    }
  }
  const branch = head === '(detached)' ? `detached ${oid.slice(0, 7)}` : head;
  return `${branch} | staged ${staged} | unstaged ${unstaged} | untracked ${untracked}`;
}

// Reduces a remote URL to owner/name. The scheme and authority are removed first, so credentials
// embedded in an https URL never reach the screen.
function repoName(url) {
  return url
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*\//i, '')
    .replace(/^[^/\\:]+@[^/\\:]+:/, '')
    .replace(/(\.git)?\/*$/, '')
    .split(/[/\\]/)
    .slice(-2)
    .join('/');
}

function formatLine(dir) {
  // --untracked-files=all: the counter is files, not git's collapsed untracked directories.
  const porcelain = git(dir, ['status', '--porcelain=v2', '--branch', '--untracked-files=all']);
  if (porcelain === null) return dir;
  // Without a remote name, ls-remote resolves the branch's tracked remote, else origin, and
  // --get-url prints its URL without contacting it.
  const url = git(dir, ['ls-remote', '--get-url']);
  return [formatStatus(porcelain), url === null ? 'no remote' : repoName(url), dir].join(' | ');
}

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

console.log(formatLine(sessionDir(raw)));
