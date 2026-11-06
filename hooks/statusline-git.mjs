#!/usr/bin/env node
// Claude Code status line, read from the session JSON on stdin. First line: a gauge of the context
// window still available. Below it, the git parameters: the current branch, the number of staged,
// unstaged and untracked files, the remote repository and the working directory; outside a git
// repository only the directory. They take one green line for the directory Claude Code was launched
// in, plus up to three yellow lines for other working trees: the one the session's current directory
// is in, then the ones it edited files in, the most recent first. Configured under `statusLine` in
// ~/.claude/settings.json.
//
// Run with --record-edit, as a PostToolUse hook configured in the same file, the script records the
// working tree of an edited file instead. A session edits by absolute path, and
// workspace.current_dir does not follow those edits, so the status line has no other way to know.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const STATE_DIR = process.env.STATUSLINE_STATE_DIR ?? join(homedir(), '.claude', 'cache', 'statusline-dirs');
const STATE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_YELLOW_LINES = 3;

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

// Windows compares paths case-insensitively, and VS Code reports d:\ where a terminal reports D:\.
function normalizeDir(dir) {
  const full = resolve(dir);
  return process.platform === 'win32' ? full.toLowerCase() : full;
}

const workingTrees = new Map();

// The root of the working tree that holds `dir`, or `dir` itself outside a repository. A subdirectory
// shares its tree's git parameters, while a linked worktree has its own toplevel, branch and counters.
function workingTree(dir) {
  const key = normalizeDir(dir);
  if (!workingTrees.has(key)) {
    const top = git(dir, ['rev-parse', '--show-toplevel']);
    workingTrees.set(key, top === null ? key : normalizeDir(top.trim()));
  }
  return workingTrees.get(key);
}

function formatGitLines(terminalDir, sessionDir, editedTrees) {
  const terminalTree = workingTree(terminalDir);
  const greenDir = workingTree(sessionDir) === terminalTree ? sessionDir : terminalDir;
  const lines = [`${GREEN}${formatLine(greenDir)}${RESET}`];
  const shown = new Set([terminalTree]);
  for (const dir of [sessionDir, ...editedTrees]) {
    if (lines.length > MAX_YELLOW_LINES) break;
    const tree = workingTree(dir);
    if (shown.has(tree)) continue;
    shown.add(tree);
    lines.push(`${YELLOW}${formatLine(dir)}${RESET}`);
  }
  return lines;
}

// session_id comes from outside the script and names a file, so anything but a plain id is refused.
function stateFile(sessionId) {
  return typeof sessionId === 'string' && /^[\w-]+$/.test(sessionId) ? join(STATE_DIR, `${sessionId}.txt`) : null;
}

function readStateLines(file) {
  return existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];
}

// The most recent first. A failed read only costs the yellow lines, never the rest of the status.
function readEditedTrees(sessionId) {
  const file = stateFile(sessionId);
  if (file === null) return [];
  try {
    return readStateLines(file)
      .reverse()
      .filter((dir) => existsSync(dir));
  } catch {
    return [];
  }
}

function editedTree(event) {
  const changedFiles = event.tool_response?.bashEditDiff?.changedFiles;
  const paths = [
    event.tool_input?.file_path,
    event.tool_input?.notebook_path,
    ...(Array.isArray(changedFiles) ? changedFiles : []),
  ];
  for (const path of paths) {
    if (typeof path !== 'string') continue;
    const top = git(dirname(resolve(path)), ['rev-parse', '--show-toplevel']);
    if (top !== null) return top.trim();
  }
  return null;
}

function removeOldState() {
  const cutoff = Date.now() - STATE_RETENTION_MS;
  for (const name of readdirSync(STATE_DIR)) {
    const path = join(STATE_DIR, name);
    if (statSync(path).mtimeMs < cutoff) rmSync(path, { force: true });
  }
}

function recordEdit(event) {
  const file = stateFile(event.session_id);
  if (file === null) return;
  const tree = editedTree(event);
  if (tree === null) return;
  mkdirSync(STATE_DIR, { recursive: true });
  if (!existsSync(file)) removeOldState();
  // Appending keeps parallel edits from overwriting each other; skipping a repeat keeps the file small.
  if (readStateLines(file).at(-1) !== tree) appendFileSync(file, `${tree}\n`);
}

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

const session = parseSession(raw);
if (process.argv.includes('--record-edit')) {
  // A failure here only costs a status line hint, so it must never surface in the session as a hook error.
  try {
    recordEdit(session);
  } catch {}
} else {
  const sessionDir = session.workspace?.current_dir ?? process.cwd();
  const terminalDir = session.workspace?.project_dir ?? sessionDir;
  const context = formatContext(session.context_window);
  const gitLines = formatGitLines(terminalDir, sessionDir, readEditedTrees(session.session_id));
  console.log([...(context === null ? [] : [context]), ...gitLines].join('\n'));
}
