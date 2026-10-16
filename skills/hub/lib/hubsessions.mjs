// hub-sessions.json (spec §4.1): the hub's own sessions, recognised by events whose cwd equals the
// hub data root (this also covers the new id after /clear; a session in a sub-directory is not the
// hub), and sessions the hub launched.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { hubSessionsPath } from './paths.mjs';
import { samePath } from './projects.mjs';
import { readPolls } from './polls.mjs';

// A corrupt file yields empty lists and an error line instead of throwing; refreshHubSessions rewrites it.
export function readHubSessions(root) {
  if (!existsSync(hubSessionsPath(root))) return { hub: [], launched: [] };
  try {
    const data = JSON.parse(readFileSync(hubSessionsPath(root), 'utf8'));
    return { hub: data.hub ?? [], launched: data.launched ?? [] };
  } catch (error) {
    return { hub: [], launched: [], error: `unreadable: ${error.message}` };
  }
}

function writeHubSessions(root, data) {
  mkdirSync(root, { recursive: true });
  writeFileSync(hubSessionsPath(root), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function refreshHubSessions(root, derivedList) {
  const data = readHubSessions(root);
  const hub = new Set(data.hub);
  for (const derived of derivedList) {
    if (derived.cwd && samePath(derived.cwd, root)) hub.add(derived.sessionId);
  }
  const next = { hub: [...hub], launched: data.launched };
  if (data.error || next.hub.length !== data.hub.length) writeHubSessions(root, next);
  return { ...next, error: data.error ?? null };
}

// The from-names the hub's own messages carry (spec §6.3, P10): `hub` for a hub started with
// --name hub, and every name the polls gave a session registered as hub. A hub started without a
// name, for example in a VS Code panel, is called <folder>-<2 hex> (hub-ba).
export function hubSenderNames(root, polls = readPolls(root)) {
  const ids = new Set(readHubSessions(root).hub);
  const names = new Set(['hub']);
  for (const poll of polls) {
    for (const session of poll.sessions ?? []) if (ids.has(session.sessionId) && session.name) names.add(session.name);
  }
  return names;
}

export function registerLaunched(root, entry) {
  const data = readHubSessions(root);
  const launched = data.launched.filter((item) => item.sessionId !== entry.sessionId);
  launched.push(entry);
  writeHubSessions(root, { hub: data.hub, launched });
  return entry;
}
