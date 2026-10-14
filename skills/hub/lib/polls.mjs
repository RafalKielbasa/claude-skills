// Polls of `claude agents --json` (spec §5.2, §5.4). A failed poll is recorded with its error and
// never counts as evidence that a session vanished.
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { pollsPath, registryDir } from './paths.mjs';

// A hung CLI must not freeze the watcher or block overview/prepare/register; a timeout surfaces as result.error.
export const POLL_TIMEOUT_MS = 30000;

export function runPoll({ run = spawnSync, at = new Date().toISOString() } = {}) {
  const result = run('claude', ['agents', '--json'], { encoding: 'utf8', timeout: POLL_TIMEOUT_MS });
  if (result.error || result.status !== 0) {
    return { at, ok: false, error: String(result.error?.message || result.stderr || `exit ${result.status}`).slice(0, 300) };
  }
  try {
    const list = JSON.parse(result.stdout);
    return {
      at,
      ok: true,
      sessions: list.map((s) => ({
        sessionId: s.sessionId ?? null,
        id: s.id ?? null,
        name: s.name ?? null,
        kind: s.kind ?? null,
        status: s.status ?? null,
        state: s.state ?? null,
        cwd: s.cwd ?? null,
      })),
    };
  } catch (error) {
    return { at, ok: false, error: `unparsable: ${error.message}` };
  }
}

export function appendPoll(root, poll) {
  mkdirSync(registryDir(root), { recursive: true });
  appendFileSync(pollsPath(root), `${JSON.stringify(poll)}\n`, 'utf8');
}

export function readPolls(root) {
  if (!existsSync(pollsPath(root))) return [];
  return readFileSync(pollsPath(root), 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function lastOkPoll(polls) {
  return [...polls].reverse().find((poll) => poll.ok) ?? null;
}

export function pollEntry(poll, sessionId) {
  return poll?.sessions?.find((s) => s.sessionId === sessionId) ?? null;
}

// Vanished: the last two successful polls both miss the session. Failed polls are skipped, and so are
// polls taken before the session's first event (`since`): they cannot have seen a session that did not exist yet.
export function isVanished(polls, sessionId, since = null) {
  const ok = polls.filter((poll) => poll.ok && (!since || poll.at > since));
  if (ok.length < 2) return false;
  return ok.slice(-2).every((poll) => !pollEntry(poll, sessionId));
}
