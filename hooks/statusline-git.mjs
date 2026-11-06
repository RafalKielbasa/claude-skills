#!/usr/bin/env node
// Claude Code status line, read from the session JSON on stdin. First line: a gauge of the context
// window still available. Second line: the current git branch, the number of staged, unstaged and
// untracked files, the remote repository and the working directory; outside a git repository only
// the directory. Configured under `statusLine` in ~/.claude/settings.json.
import { spawnSync } from 'node:child_process';

const GAUGE_WIDTH = 10;
// A terminal cell has a fixed height, so a lower bar has to come from a partial block: U+2586 fills
// three quarters of the cell. Shade characters have no partial variants, so the empty part of the
// gauge is the same block in grey, which keeps both parts at one height.
const GAUGE_BLOCK = '▆';
// 256-color palette entries: unlike the base \x1b[32m, their shade does not depend on the terminal theme.
const GREEN = '\x1b[38;5;28m';
const GREY = '\x1b[38;5;240m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function parseSession(raw) {
  try {
    // trim() also drops the BOM a PowerShell pipe prepends, which JSON.parse rejects.
    return JSON.parse(raw.trim()) ?? {};
  } catch {
    return {};
  }
}

function formatTokens(count) {
  return count >= 1_000_000 ? `${Number((count / 1_000_000).toFixed(1))}M` : `${Math.round(count / 1000)}k`;
}

// The gauge fills with what is still available, so it drains as the conversation grows. Returns
// null while Claude Code reports no percentage, which it may do early in a session: a full bar
// there would claim a measurement nobody made.
function formatContext(contextWindow) {
  const remaining = contextWindow?.remaining_percentage;
  if (typeof remaining !== 'number') return null;
  const percent = Math.min(100, Math.max(0, Math.round(remaining)));
  const filled = Math.round((percent / 100) * GAUGE_WIDTH);
  const color = percent > 50 ? GREEN : percent > 20 ? YELLOW : RED;
  const bar = GAUGE_BLOCK.repeat(filled) + GREY + GAUGE_BLOCK.repeat(GAUGE_WIDTH - filled) + color;
  const size = contextWindow.context_window_size;
  const ofSize = typeof size === 'number' ? ` of ${formatTokens(size)}` : '';
  return `${color}context [${bar}] ${percent}% left${ofSize}${RESET}`;
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

const session = parseSession(raw);
const context = formatContext(session.context_window);
const line = formatLine(session.workspace?.current_dir ?? process.cwd());
console.log(context === null ? line : `${context}\n${line}`);
