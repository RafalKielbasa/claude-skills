// The append-only registry (spec §4.1, §5.1): one event log per session, one last-message file per
// Stop. Writers only append or create files named by a fresh event id, so concurrent hooks of one
// session never overwrite each other (probe S3).
import { appendFileSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildEvent } from './events.mjs';
import { registryDir, eventLogPath, lastDir } from './paths.mjs';

export function recordHook(root, input, { id, at }) {
  const built = buildEvent(input, { id, at });
  if (!built) return null;
  const { event, lastMessage } = built;
  mkdirSync(registryDir(root), { recursive: true });
  if (lastMessage !== undefined) {
    const dir = lastDir(root, event.sessionId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${id}.md`), lastMessage, 'utf8');
  }
  appendFileSync(eventLogPath(root, event.sessionId), `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

// Events of one session with their line index; a broken line is counted, never fatal.
export function readEvents(root, sessionId) {
  const path = eventLogPath(root, sessionId);
  if (!existsSync(path)) return { events: [], broken: 0 };
  const events = [];
  let broken = 0;
  readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    try {
      events.push({ ...JSON.parse(line), index });
    } catch {
      broken += 1;
    }
  });
  return { events, broken };
}

export function listSessionIds(root) {
  const dir = registryDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.events.jsonl'))
    .map((name) => name.slice(0, -'.events.jsonl'.length));
}

// A full sessionId, or a prefix of exactly one (the overview shows 8 characters, finding A1).
export function resolveSessionId(root, value) {
  const wanted = String(value ?? '');
  const ids = listSessionIds(root);
  if (ids.includes(wanted)) return { sessionId: wanted };
  const hits = wanted ? ids.filter((id) => id.startsWith(wanted)) : [];
  if (hits.length === 1) return { sessionId: hits[0] };
  return { error: hits.length ? `ambiguous session id ${wanted}: ${hits.join(', ')}` : `no session ${wanted} in the registry` };
}

export function lastMessagePath(root, stopEvent) {
  return stopEvent?.lastFile ? join(registryDir(root), stopEvent.lastFile) : null;
}
