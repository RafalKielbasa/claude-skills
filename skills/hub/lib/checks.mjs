// The five blocking pre-send checks and the check 6 notice (spec §6.2, U1). Pure apart from
// gitInfo; every failure and notice carries its check number and a message the hub shows Rafal
// verbatim.
import { spawnSync } from 'node:child_process';
import { sha256 } from './text.mjs';
import { pollEntry } from './polls.mjs';
import { templateProblems } from './compose.mjs';
import { shownState } from './journal.mjs';

export function gitInfo(cwd, run = spawnSync) {
  const git = (...args) => {
    // --no-optional-locks: reading a session's repository must not refresh its index file (spec §8.2).
    const result = run('git', ['--no-optional-locks', '-C', cwd, ...args], { encoding: 'utf8' });
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
// text (check 3), send now to a busy session (check 5). A waiting session no longer blocks (U1):
// a `confirmWaiting` key from an older caller is ignored.
export function runChecks({ record, records, poll, derived, git, text, confirmBusy = false, confirmResend = false }) {
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

  return failures;
}

// 6. A notice, not a block (U1): the session waits for a decision (the gate text follows) or for
//    permission. One "wyślij" is enough; the hub quotes the notice to Rafal with the send result.
export function waitingNotice(derived) {
  const waiting = derived?.waiting;
  if (!waiting) return [];
  const message = waiting.kind === 'decision'
    ? `the session waits for decision${waiting.text ? `: ${waiting.text}` : ''}`
    : 'the session waits for permission; the message queues until Rafal answers the prompt in the session';
  return [{ check: 6, message }];
}
