// Locations of the hub data (spec §4.1). Every function takes the data root explicitly, so tests
// run against a temporary directory and never touch the real ~/.claude/hub (HUB_DATA overrides it).
import { homedir } from 'node:os';
import { realpathSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';

export function hubRoot(env = process.env) {
  return env.HUB_DATA || join(homedir(), '.claude', 'hub');
}

// Session ids and project names become file names; anything outside a safe set is replaced.
export function safeId(id) {
  return String(id || 'unknown').replace(/[^A-Za-z0-9-]/g, '_');
}

export function safeName(name) {
  return String(name || 'unknown').replace(/[<>:"/\\|?*\s]+/g, '-');
}

export const registryDir = (root) => join(root, 'registry');
export const eventLogPath = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.events.jsonl`);
export const lastDir = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.last`);
export const pollsPath = (root) => join(registryDir(root), 'polls.jsonl');
export const titlesPath = (root) => join(registryDir(root), 'titles.json');
export const hubSessionsPath = (root) => join(root, 'hub-sessions.json');
export const projectsConfigPath = (root) => join(root, 'projects.json');
export const watchStatePath = (root) => join(root, 'watch-state.json');
export const judgmentsPath = (root) => join(root, 'judgments.jsonl');
export const projectDir = (root, project) => join(root, 'projects', safeName(project));
export const journalJsonlPath = (root, project) => join(projectDir(root, project), 'journal.jsonl');
export const journalMdPath = (root, project) => join(projectDir(root, project), 'journal.md');
export const sentDir = (root, project) => join(projectDir(root, project), 'sent');
export const draftsDir = (root, project) => join(projectDir(root, project), 'drafts');
export const dialogsDir = (root, project) => join(projectDir(root, project), 'dialogs');
export const codexDir = (root, project) => join(projectDir(root, project), 'codex');

// A directory a command names on its command line and then writes into must be exactly
// <root>/projects/<project>/<kind>/<name>, after `..` and links are resolved: the hub writes only
// into its data root (spec §8.2). The canonical path, or null.
export function ownedDir(root, dir, kind) {
  let real;
  let base;
  try {
    real = realpathSync.native(resolve(String(dir)));
    base = realpathSync.native(resolve(root));
  } catch {
    return null;
  }
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  const kindDir = dirname(real);
  return same(basename(kindDir), kind) && same(dirname(dirname(kindDir)), join(base, 'projects')) ? real : null;
}
