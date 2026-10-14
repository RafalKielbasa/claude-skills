// The hub's judgment of a turn that ended without the gate marker (spec §5.4 state 7). The hub
// session reads the last message and records whether it waits for Rafal (`question`) or not
// (`other`). A judgment belongs to one Stop event, so the next turn needs a new one.
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { judgmentsPath } from './paths.mjs';

export const VERDICTS = ['question', 'other'];

export function recordJudgment(root, { sessionId, stopId, verdict, at }) {
  if (!VERDICTS.includes(verdict)) throw new Error(`unknown verdict ${verdict}; expected one of ${VERDICTS.join(', ')}`);
  const entry = { sessionId, stopId, verdict, at };
  mkdirSync(dirname(judgmentsPath(root)), { recursive: true });
  appendFileSync(judgmentsPath(root), `${JSON.stringify(entry)}\n`, 'utf8');
  return entry;
}

// A broken line is skipped, like in the event logs.
export function readJudgments(root) {
  if (!existsSync(judgmentsPath(root))) return [];
  const entries = [];
  for (const line of readFileSync(judgmentsPath(root), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skipped
    }
  }
  return entries;
}

// The latest verdict for this Stop, or null when the hub has not judged it.
export function judgmentFor(entries, sessionId, stopId) {
  let verdict = null;
  for (const entry of entries) if (entry.sessionId === sessionId && entry.stopId === stopId) verdict = entry.verdict;
  return verdict;
}

// Retention: keeps only the judgments of sessions whose event log still exists.
export function pruneJudgments(root, sessionIds) {
  if (!existsSync(judgmentsPath(root))) return 0;
  const kept = readJudgments(root).filter((entry) => sessionIds.has(entry.sessionId));
  writeFileSync(judgmentsPath(root), kept.map((entry) => JSON.stringify(entry)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
  return kept.length;
}
