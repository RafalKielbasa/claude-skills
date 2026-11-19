// Live probe of both forks' permission rules (2026-11-19 fork permissions spec §6, plan 1 Task 5):
// the production settings of the /talk voice fork and of the hub's written fork, real `claude -p`
// calls with haiku, in five working-directory layouts built as dummy directories. Not a test file:
// `node --test test/*.test.mjs` never runs it.
// Usage (from the skill directory): node test/live/fork-permissions.mjs
//
// It deletes nothing and never writes into a real repository. It refuses to run when either probe
// root exists, so a stale file can never pass for a result.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeVoiceForkSettings } from '../../lib/settings.mjs';
import { forkSettings } from '../../../hub/lib/dialog.mjs';

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const C_ROOT = `C:/Users/rafal/hub-probes/fork-permissions/${stamp}`;
const D_ROOT = `D:/hub-probes/fork-permissions/${stamp}`;
const DENY_TEXT = 'denied by your permission settings';
const TIMEOUT_MS = 180000;

for (const root of [C_ROOT, D_ROOT]) {
  if (existsSync(root)) {
    console.error(`refusing to run: ${root} already exists`);
    process.exit(2);
  }
}

const LAYOUTS = [
  { id: 'd-plain', cwd: `${D_ROOT}/repo-plain`, kind: 'voice' },
  { id: 'd-space', cwd: `${D_ROOT}/Baza wiedzy`, kind: 'voice' },
  { id: 'd-worktree', cwd: `${D_ROOT}/repo-wt/.claude/worktrees/wt-probe`, kind: 'voice' },
  { id: 'c-dotclaude', cwd: `${C_ROOT}/home/.claude/hub`, kind: 'voice' },
  { id: 'hub-written', cwd: `${D_ROOT}/repo-hub`, kind: 'hub' },
];
const dialogDirOf = ({ id, kind }) => (kind === 'voice' ? `${C_ROOT}/dialogs/${id}` : `${C_ROOT}/hub/.claude/hub/projects/p/dialogs/${stamp}-probe`);

// The fork never gets the ElevenLabs key, as in lib/fork.mjs.
const childEnv = { ...process.env };
for (const name of Object.keys(childEnv)) if (name.toUpperCase() === 'ELEVENLABS_API_KEY') delete childEnv[name];

const norm = (p) => String(p ?? '').replace(/\\/g, '/').toLowerCase();
const textOf = (content) => (typeof content === 'string' ? content
  : Array.isArray(content) ? content.map((c) => (typeof c === 'string' ? c : c?.text ?? '')).join('') : JSON.stringify(content ?? ''));

// The Write calls on the target and their results, matched by tool_use_id (as callsOf in boundary.mjs).
function verdictOf(stdout, target) {
  const lines = String(stdout).split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const uses = new Set();
  const results = new Map();
  let denials = null;
  for (const l of lines) {
    const content = Array.isArray(l.message?.content) ? l.message.content : [];
    for (const c of content) {
      if (l.type === 'assistant' && c.type === 'tool_use' && c.name === 'Write' && norm(c.input?.file_path) === norm(target)) uses.add(c.id);
      if (l.type === 'user' && c.type === 'tool_result') results.set(c.tool_use_id, { isError: c.is_error === true, text: textOf(c.content) });
    }
    if (l.type === 'result') denials = l.permission_denials ?? null;
  }
  const matched = [...uses].map((id) => results.get(id)).filter(Boolean).at(-1) ?? null;
  return { attempted: uses.size > 0, result: matched, denials };
}

function probe({ cwd, dialogDir, settingsPath, kind, target }) {
  const ask = `Use the Write tool exactly once to create ${target} with the content ok. Use no other tool.`;
  const args = ['-p', ask, ...(kind === 'voice' ? ['--restricted'] : []), '--tools', 'Read,Grep,Glob,Edit,Write', '--strict-mcp-config',
    '--permission-mode', 'default', '--output-format', 'stream-json', '--verbose', '--settings', settingsPath, '--model', 'haiku', '--add-dir', dialogDir];
  const run = spawnSync('claude', args, { cwd, encoding: 'utf8', timeout: TIMEOUT_MS, env: childEnv, maxBuffer: 64 * 1024 * 1024 });
  const { attempted, result, denials } = verdictOf(run.stdout, target);
  return {
    target,
    existsAfter: existsSync(target),
    exit: run.status,
    ...(run.error ? { spawnError: run.error.message } : {}),
    attempted,
    toolResult: result ? { isError: result.isError, text: result.text.slice(0, 300) } : null,
    permissionDenials: denials,
    ...(result ? {} : { stderrTail: String(run.stderr ?? '').slice(-300) }),
  };
}

const started = Date.now();
const layouts = [];
for (const layout of LAYOUTS) {
  const dialogDir = dialogDirOf(layout);
  mkdirSync(layout.cwd, { recursive: true });
  mkdirSync(dialogDir, { recursive: true });
  let settingsPath;
  if (layout.kind === 'voice') settingsPath = writeVoiceForkSettings(dialogDir, layout.cwd);
  else {
    settingsPath = join(dialogDir, 'fork-settings.json');
    writeFileSync(settingsPath, `${JSON.stringify(forkSettings(dialogDir, layout.cwd), null, 2)}\n`, 'utf8');
  }
  const dialogWrite = probe({ ...layout, dialogDir, settingsPath, target: `${dialogDir}/probe-dialog.txt` });
  const repoWrite = probe({ ...layout, dialogDir, settingsPath, target: `${layout.cwd}/probe-repo.txt` });
  const denied = (call) => call.toolResult !== null && call.toolResult.text.includes(DENY_TEXT);
  const checks = layout.kind === 'voice'
    ? {
      dialogWriteCreated: dialogWrite.existsAfter,
      repoWriteAbsent: !repoWrite.existsAfter,
      repoWriteDeniedByRule: denied(repoWrite),
    }
    : {
      dialogWriteAttempted: dialogWrite.attempted && dialogWrite.toolResult !== null,
      dialogWriteNotDeniedByRule: dialogWrite.toolResult !== null && !denied(dialogWrite),
      repoWriteAbsent: !repoWrite.existsAfter,
      repoWriteDeniedByRule: denied(repoWrite),
    };
  layouts.push({ id: layout.id, kind: layout.kind, cwd: layout.cwd, dialogDir, settingsPath, dialogWrite, repoWrite, checks,
    passed: Object.values(checks).every(Boolean) });
  console.error(`[${layout.id}] ${Object.entries(checks).map(([k, v]) => `${k}=${v}`).join(' ')}`);
}

const summary = {
  ranAt: now.toISOString(),
  wallSeconds: Math.round((Date.now() - started) / 1000),
  claudeCalls: layouts.length * 2,
  roots: { c: C_ROOT, d: D_ROOT },
  layouts,
  passed: layouts.every((l) => l.passed),
};
writeFileSync(`${C_ROOT}/summary.json`, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`${C_ROOT}/summary.json passed=${summary.passed}`);
process.exit(summary.passed ? 0 : 1);
