import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SCHEMA = 1;

export function emptyState() {
  return {
    schema: SCHEMA, last_reviewed_sha: null, axis_cursor: [], file_cursor: {},
    pending_files: [], triage: [], runs: [],
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
  return { ...emptyState(), ...state };
}

// Temp file plus rename, so an interrupted run never leaves half a state file.
export function writeState(repoDir, state) {
  const target = statePath(repoDir);
  mkdirSync(dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, target);
}
