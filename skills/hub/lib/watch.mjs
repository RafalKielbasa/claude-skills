// State transitions the watcher prints (spec §5.5): waiting for a decision or permission, a
// problem, a turn ended, a new session or a /clear continuation. Nothing else, so Monitor never
// stops the source for being too chatty.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { watchStatePath } from './paths.mjs';

export function snapshot(rows) {
  return Object.fromEntries(rows.map((row) => [row.sessionId, {
    label: row.state,
    detail: row.detail,
    name: row.name,
    project: row.project,
    continuedFrom: row.continuedFrom,
    // Unique per Stop: a new turn end under an unchanged label still shows as a change.
    lastStop: row.lastStop,
  }]));
}

const who = (sessionId, s) => `${s.project} ${sessionId.slice(0, 8)}${s.name ? ` ${s.name}` : ''}`;

export function transitions(prev, next) {
  const lines = [];
  for (const [sessionId, s] of Object.entries(next)) {
    const before = prev[sessionId];
    if (!before) {
      lines.push(s.continuedFrom
        ? `continued after /clear: ${s.project}${s.name ? ` ${s.name}` : ''} ${s.continuedFrom.slice(0, 8)} -> ${sessionId.slice(0, 8)}`
        : `new session: ${who(sessionId, s)}`);
    }
    if (before?.label === s.label && before?.detail === s.detail) {
      // A new Stop under the same label (a turn that ended while no watcher ran). Old state files
      // without lastStop add no lines.
      if (before && 'lastStop' in before && 'lastStop' in s && before.lastStop !== s.lastStop) {
        if (s.label === 'turn ended') lines.push(`turn ended: ${who(sessionId, s)}`);
        else if (s.label === 'waiting for decision') lines.push(`waiting for decision: ${who(sessionId, s)} — ${s.detail}`);
      }
      continue;
    }
    if (s.label === 'waiting for decision') lines.push(`waiting for decision: ${who(sessionId, s)} — ${s.detail}`);
    else if (s.label === 'waiting for permission') lines.push(`waiting for permission: ${who(sessionId, s)}`);
    else if (s.label === 'problem') lines.push(`problem: ${who(sessionId, s)} — ${s.detail}`);
    else if (s.label === 'turn ended' && before && before.label !== 'turn ended') lines.push(`turn ended: ${who(sessionId, s)}`);
  }
  return lines;
}

// An unreadable state file (a torn write) counts as no state, so the watcher seeds again instead of failing on every tick.
export function readWatchState(root) {
  if (!existsSync(watchStatePath(root))) return { state: null, unreadable: false };
  try {
    return { state: JSON.parse(readFileSync(watchStatePath(root), 'utf8')), unreadable: false };
  } catch {
    return { state: null, unreadable: true };
  }
}

// A persistent failure prints one line, not one per tick.
export function errorReporter(print) {
  let last = null;
  return {
    fail(message) {
      if (message === last) return;
      last = message;
      print(`watcher error: ${message}`);
    },
    ok() {
      last = null;
    },
  };
}

export function writeWatchState(root, state) {
  mkdirSync(root, { recursive: true });
  writeFileSync(watchStatePath(root), JSON.stringify(state), 'utf8');
}
