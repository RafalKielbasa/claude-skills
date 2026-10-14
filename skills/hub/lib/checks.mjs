// The six pre-send checks (spec §6.2). Pure apart from gitInfo; every failure carries its check
// number and a message the hub shows Rafal verbatim.
import { spawnSync } from 'node:child_process';
import { sha256 } from './text.mjs';
import { pollEntry } from './polls.mjs';
import { templateProblems } from './compose.mjs';
import { shownState } from './journal.mjs';

export function gitInfo(cwd, run = spawnSync) {
  const git = (...args) => {
    const result = run('git', ['-C', cwd, ...args], { encoding: 'utf8' });
    return result.status === 0 ? result.stdout.trim() : null;
  };
  if (!cwd) return { repoRoot: null, branch: null, sha: null };
  return {
    repoRoot: git('rev-parse', '--show-toplevel'),
    branch: git('symbolic-ref', '--short', '-q', 'HEAD') || null,
    sha: git('rev-parse', 'HEAD'),
  };
}

const ACTIVE = ['pending', 'sent', 'held'];

// The confirm* flags carry Rafal's explicit answer after the hub asked (spec §6.2): resend the same
// text (check 3), send now to a busy session (check 5), send to a waiting session (check 6).
export function runChecks({ record, records, poll, derived, git, text, confirmWaiting = false, confirmBusy = false, confirmResend = false }) {
  const failures = [];
  const { baseline } = record;

  // 1. Alive under the baseline sessionId, and the only live session with its name, because
  //    SendMessage addresses sessions by name.
  let entry = null;
  if (!poll?.ok) {
    failures.push({ check: 1, message: `cannot verify the target: claude agents --json failed: ${poll?.error ?? 'no poll'}` });
  } else {
    entry = pollEntry(poll, baseline.sessionId);
    if (!entry) {
      const candidates = poll.sessions.filter((s) => baseline.name && s.name === baseline.name).map((s) => s.sessionId);
      failures.push({ check: 1, message: `target ${baseline.sessionId} is not alive`, candidates });
    } else if (!entry.name) {
      failures.push({ check: 1, message: `target ${baseline.sessionId} is alive but has no name; SendMessage addresses sessions by name` });
    } else if (poll.sessions.filter((s) => s.name === entry.name).length > 1) {
      failures.push({ check: 1, message: `name ${entry.name} matches several live sessions; SendMessage would be ambiguous` });
    }
  }

  // 2. Same cwd, repository root and branch (or commit when HEAD is detached).
  if ((derived.cwd ?? '').toLowerCase() !== (baseline.cwd ?? '').toLowerCase()) {
    failures.push({ check: 2, message: `cwd changed: ${baseline.cwd} -> ${derived.cwd}` });
  }
  if (git.repoRoot !== baseline.repoRoot) failures.push({ check: 2, message: `repository root changed: ${baseline.repoRoot} -> ${git.repoRoot}` });
  const before = baseline.branch ?? baseline.sha;
  const now = baseline.branch ? git.branch : git.sha;
  if (before !== now) failures.push({ check: 2, message: `${baseline.branch ? 'branch' : 'commit'} changed: ${before} -> ${now}` });

  // 3. No active record with the same text for this session (`pending` covers delivery-unknown).
  const duplicates = records.filter((r) => r.id !== record.id && r.sessionId === record.sessionId && r.textHash === record.textHash && ACTIVE.includes(r.state));
  if (duplicates.length && !confirmResend) failures.push({ check: 3, message: `the same text is already ${duplicates.map((r) => `${shownState(r)} (${r.id})`).join(', ')}` });

  // 4. Exactly the approved text, with the template it needs.
  if (sha256(text) !== record.textHash) failures.push({ check: 4, message: 'the text changed since approval' });
  for (const problem of templateProblems(text, record.path)) failures.push({ check: 4, message: problem });

  // 5. Idle, unless Rafal chose "send now": the message then cuts in between tool calls and is
  //    derived as a queued prompt (spec §5.2). A delayed send simply runs every check again.
  if (!confirmBusy && (derived.phase === 'working' || (entry && entry.status !== 'idle'))) {
    failures.push({ check: 5, message: `the session is busy (${entry?.status ?? derived.phase})` });
  }

  // 6. Not waiting, unless Rafal confirmed after the warning.
  if (derived.waiting && !confirmWaiting) {
    failures.push({ check: 6, message: `the session waits for ${derived.waiting.kind}; gates are answered in the session itself` });
  }
  return failures;
}
