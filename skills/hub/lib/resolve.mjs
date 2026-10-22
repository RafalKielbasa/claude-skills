// The source session of a fork, shared by `dialog start` and `voice resolve` (hub spec §6.5 step 2,
// voice spec §19.2 step 2). Pure: the poll and the two lookups come in, the resolution goes out.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pollEntry } from './polls.mjs';

// A live id is taken directly: when two live sessions share a name, Rafal chose this one. An id that
// is not live is resolved by name right before the launch: a restart keeps the name and changes the
// id, and a fork of a stale id answers from the ended session (D6). The cwd comes from the source's
// own hook events first: a hub-launched worktree session is polled with the main checkout's cwd,
// while its hook and its transcript name the worktree (voice spec §19.2, decision „Katalog roboczy
// w `dialog start`”, variant A).
//   derivedOf(id) → { cwd, transcriptPath, sessionTitle }; lastPollName(id) → string|null
export function resolveSource({ requested, poll, derivedOf, lastPollName }) {
  const requestedState = derivedOf(requested);
  let entry = pollEntry(poll, requested);
  let name = entry?.name ?? requestedState.sessionTitle ?? null;
  if (!entry) {
    name = requestedState.sessionTitle ?? lastPollName(requested) ?? null;
    if (!name) return { ok: false, name: null, candidates: [], error: `session ${requested} has no name; a fork resolves its source by name` };
    const candidates = poll.sessions.filter((s) => s.name === name);
    if (candidates.length !== 1) return { ok: false, name, candidates: candidates.map((s) => s.sessionId) };
    [entry] = candidates;
  }
  const twins = entry.name ? poll.sessions.filter((s) => s.name === entry.name && s.sessionId !== entry.sessionId).map((s) => s.sessionId) : [];
  const derived = entry.sessionId === requested ? requestedState : derivedOf(entry.sessionId);
  return {
    ok: true,
    source: { sessionId: entry.sessionId, name, status: entry.status ?? null, cwd: derived.cwd ?? entry.cwd ?? null, transcriptPath: derived.transcriptPath ?? null },
    twins,
    resolvedFrom: entry.sessionId === requested ? null : requested,
  };
}

// The transcript a fork resumes from (voice spec §19.2, finding F1): the path from the session's
// latest hook event, or, when no event names one, <projectsDir>/*/<id>.jsonl, as the talk CLI checks it.
export function findTranscript({ sessionId, transcriptPath, projectsDir }) {
  if (transcriptPath) return { transcriptPath, transcriptExists: existsSync(transcriptPath) };
  let dirs = [];
  try {
    dirs = readdirSync(projectsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  } catch { /* no projects directory, so no transcript */ }
  const found = dirs.map((entry) => join(projectsDir, entry.name, `${sessionId}.jsonl`)).find((path) => existsSync(path)) ?? null;
  return { transcriptPath: found, transcriptExists: Boolean(found) };
}
