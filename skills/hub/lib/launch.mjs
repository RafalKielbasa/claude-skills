// Launching background sessions (spec §6.6; dialog forks, §6.5 step 2): the command line, the
// pre-launch checks, the output `claude --bg` prints, and the session's full id from a poll.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { sha256 } from './text.mjs';
import { templateProblems } from './compose.mjs';

// A Windows command line holds at most 32 767 characters; the rest is room for the other arguments.
export const MAX_PROMPT_CHARS = 30000;
export const LAUNCH_TIMEOUT_MS = 120000;
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// HUB_CLAUDE_CMD, a JSON array, replaces `claude` so tests run a fake CLI. `claude` is claude.exe,
// so spawnSync needs no shell and passes every argument, the prompt included, unchanged.
export function claudeCommand(env = process.env) {
  return env.HUB_CLAUDE_CMD ? JSON.parse(env.HUB_CLAUDE_CMD) : ['claude'];
}

export function newSessionArgs({ name, worktree, text }) {
  return ['--bg', '--name', name, ...(worktree ? ['-w', name] : []), text];
}

// `backgrounded · 0015e1eb · dlg-s12` (probes S6, S12).
export function parseBackgrounded(output) {
  const match = /backgrounded\s*·\s*([0-9a-f]{6,})\s*·\s*(\S+)/.exec(String(output ?? ''));
  return match ? { shortId: match[1], name: match[2] } : null;
}

// Runs `claude <args>` in `cwd`; a non-zero exit keeps the CLI's literal output (for example
// "Workspace not trusted", probe S10).
export function runClaude(args, { cwd, env = process.env, run = spawnSync } = {}) {
  const [cmd, ...prefix] = claudeCommand(env);
  const result = run(cmd, [...prefix, ...args], { cwd, env, encoding: 'utf8', timeout: LAUNCH_TIMEOUT_MS, windowsHide: true });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (result.error?.code === 'ETIMEDOUT') return { ok: false, unknown: true, output, error: `timeout after ${LAUNCH_TIMEOUT_MS / 1000} s: the launch outcome is unknown` };
  if (result.error) return { ok: false, output, error: result.error.message };
  if (result.status !== 0) return { ok: false, output, error: `exit ${result.status}: ${output}` };
  const parsed = parseBackgrounded(output);
  return parsed ? { ok: true, output, ...parsed } : { ok: false, output, error: `no "backgrounded" line in the output: ${output}` };
}

// The worktree layout of `-w <name>` (probe S10).
export function worktreeOf(dir, name) {
  return { path: join(dir, '.claude', 'worktrees', name), branch: `worktree-${name}` };
}

// Spec §6.6 step 6. Each failure names its check and carries a message the hub quotes.
export function launchChecks({ record, poll, text, dirExists }) {
  const failures = [];
  if (!dirExists) failures.push({ check: 'directory', message: `the project directory does not exist: ${record.baseline.cwd}` });
  if (!poll?.ok) failures.push({ check: 'name', message: `cannot verify the name: claude agents --json failed: ${poll?.error ?? 'no poll'}` });
  else if (poll.sessions.some((s) => s.name === record.name)) failures.push({ check: 'name', message: `a live session is already named ${record.name}` });
  if (sha256(text) !== record.textHash) failures.push({ check: 'text', message: 'the text changed since approval' });
  for (const problem of templateProblems(text, record.path)) failures.push({ check: 'text', message: problem });
  if (text.length > MAX_PROMPT_CHARS) failures.push({ check: 'length', message: `the text has ${text.length} characters; a launch takes at most ${MAX_PROMPT_CHARS}` });
  return failures;
}

// The full sessionId of a just-launched session: `claude --bg` prints a short id, and
// `claude agents --json` lists the session under it (probe S6). Polls again a few times.
export function findLaunched(pollOnce, shortId, { attempts = 5, waitMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const poll = pollOnce();
    const entry = poll.ok ? poll.sessions.find((s) => s.id === shortId || String(s.sessionId).startsWith(shortId)) : null;
    if (entry?.sessionId) return entry.sessionId;
    if (i < attempts - 1) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
  }
  return null;
}
