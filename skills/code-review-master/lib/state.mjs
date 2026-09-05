import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SCHEMA = 1;

export function emptyState() {
  return {
    // Keyed by mode, like `file_cursor` already is: a `full` audit's
    // truncation backlog must not leak into `working`, `branch`, `since` or
    // `pr` runs that have nothing to do with it.
    schema: SCHEMA, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
    pending_files: {}, triage: [], runs: [],
  };
}

export function statePath(repoDir) {
  return join(repoDir, '.claude', 'review', 'state.json');
}

export function readState(repoDir) {
  let raw;
  try {
    raw = readFileSync(statePath(repoDir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return emptyState();
    throw err;
  }
  const state = JSON.parse(raw);
  if (state.schema !== SCHEMA) {
    throw new Error(`state.json has schema ${state.schema}, this build understands ${SCHEMA}`);
  }
  const merged = { ...emptyState(), ...state };
  // `pending_files` used to be a flat array, before it was keyed by mode. An
  // array read as a map yields undefined for every mode, so the backlog would
  // be dropped in silence and the array's indices would become permanent keys
  // in a file a person reads. The old contents cannot be assigned to a mode —
  // they were recorded without one — so they are discarded, but deliberately
  // and in one place rather than by accident in three.
  if (Array.isArray(merged.pending_files)) merged.pending_files = {};
  return merged;
}

// Temp file plus rename, so an interrupted run never leaves half a state file.
export function writeState(repoDir, state) {
  const target = statePath(repoDir);
  mkdirSync(dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, target);
}
