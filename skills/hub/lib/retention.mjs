// Retention (spec §8.2): event logs and last-message directories of sessions ended more than 14
// days ago are deleted together, with the hub's judgments of their turns and their cached titles;
// polls.jsonl keeps the last 14 days. Journals, sent texts, dialogs and Codex threads are never touched.
import { rmSync, writeFileSync, existsSync } from 'node:fs';
import { listSessionIds, readEvents } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls } from './polls.mjs';
import { pruneJudgments } from './judgments.mjs';
import { pruneTitles } from './titles.mjs';
import { eventLogPath, lastDir, pollsPath } from './paths.mjs';

export const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

export function cleanup(root, now = Date.now()) {
  const removed = [];
  for (const sessionId of listSessionIds(root)) {
    const derived = deriveSession(readEvents(root, sessionId).events);
    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > RETENTION_MS) {
      rmSync(eventLogPath(root, sessionId), { force: true });
      rmSync(lastDir(root, sessionId), { recursive: true, force: true });
      removed.push(sessionId);
    }
  }
  let pollsKept = 0;
  if (existsSync(pollsPath(root))) {
    const kept = readPolls(root).filter((poll) => now - Date.parse(poll.at) <= RETENTION_MS);
    writeFileSync(pollsPath(root), kept.map((poll) => JSON.stringify(poll)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    pollsKept = kept.length;
  }
  const remaining = new Set(listSessionIds(root));
  const judgmentsKept = pruneJudgments(root, remaining);
  const titlesKept = pruneTitles(root, remaining);
  return { removed, pollsKept, judgmentsKept, titlesKept };
}
