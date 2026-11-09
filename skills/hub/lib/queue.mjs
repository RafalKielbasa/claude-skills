// The queue state: everything waiting for Rafal, in one JSON file guarded by an exclusive lock file.
// Codes `a<n>` name items so a short command can address them; the lowest number not given in the
// last 24 h is used. Pure functions over a state object, plus the locked file access.
import { openSync, closeSync, readFileSync, writeFileSync, renameSync, unlinkSync, statSync, mkdirSync } from 'node:fs';
import { queuePath, queueLockPath } from './paths.mjs';

export const CODE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const LOCK_STALE_MS = 5000;
export const LOCK_WAIT_MS = 2000;
const POLL_MS = 10;

export function emptyQueue() {
  return {
    version: 1,
    mode: 'listening',
    pausedAt: null,
    seededAt: null,
    // When the overview rows behind the last reconcile were built: a pass with older rows does nothing.
    rowsAt: 0,
    lastAnnounced: null,
    walkCurrent: null,
    // { key, owners }: the owner pids of the watchers that announced this item of a walk (lib/alerts.mjs).
    walkSeen: null,
    usedPromptEvents: [],
    usedTypedRecords: [],
    codes: [],
    items: {},
  };
}

const validShape = (state) => Boolean(state) && typeof state === 'object' && Boolean(state.items) && Array.isArray(state.codes);

// Reads without the lock; a missing or corrupt file yields an empty queue.
export function readQueue(root) {
  try {
    const state = JSON.parse(readFileSync(queuePath(root), 'utf8'));
    if (validShape(state)) return state;
  } catch {
    // missing or corrupt
  }
  return emptyQueue();
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function acquireLock(path) {
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      return openSync(path, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST' && error.code !== 'EPERM' && error.code !== 'EBUSY') throw error;
    }
    let stolen = false;
    try {
      if (Date.now() - statSync(path).mtimeMs > LOCK_STALE_MS) {
        unlinkSync(path);
        stolen = true;
      }
    } catch {
      // the holder released the lock, or the steal failed: the deadline below bounds the retries
    }
    if (stolen) continue;
    if (Date.now() >= deadline) throw new Error(`queue lock busy: ${path}`);
    sleep(POLL_MS);
  }
}

export function writeAtomically(path, text) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, text);
  for (let attempt = 0; ; attempt += 1) {
    try {
      renameSync(temporary, path);
      return;
    } catch (error) {
      // On Windows an unlocked concurrent reader can briefly block the rename.
      if (attempt >= 20 || !['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) throw error;
      sleep(POLL_MS);
    }
  }
}

// Runs fn(state) under the lock and returns its result. The file is rewritten (temporary file, then
// rename) only when fn changed the state. A corrupt file starts from an empty queue with corruptAt set.
export function withQueue(root, fn) {
  mkdirSync(root, { recursive: true });
  const fd = acquireLock(queueLockPath(root));
  try {
    let raw = null;
    try {
      raw = readFileSync(queuePath(root), 'utf8');
    } catch {
      // missing file
    }
    let state = emptyQueue();
    let snapshot = JSON.stringify(state);
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw);
        if (!validShape(parsed)) throw new Error('shape');
        state = parsed;
        snapshot = JSON.stringify(parsed);
      } catch {
        state.corruptAt = Date.now();
      }
    }
    const result = fn(state);
    const text = JSON.stringify(state);
    if (text !== snapshot) writeAtomically(queuePath(root), text);
    return result;
  } finally {
    closeSync(fd);
    try {
      unlinkSync(queueLockPath(root));
    } catch {
      // already stolen
    }
  }
}

// The newest codes entry for a code, ignoring case; null when the code is malformed or unknown.
export function codeEntry(state, code) {
  const match = /^a([1-9]\d*)$/i.exec(String(code));
  if (!match) return null;
  const n = Number(match[1]);
  for (let i = state.codes.length - 1; i >= 0; i -= 1) {
    if (state.codes[i].n === n) return state.codes[i];
  }
  return null;
}

// The item holding a code, ignoring case; null when none does.
export function itemByCode(state, code) {
  const wanted = String(code).toLowerCase();
  return Object.values(state.items).find((item) => item.code && item.code.toLowerCase() === wanted) ?? null;
}

// Gives the lowest number not given in the last 24 h, records it in the codes table and, when the
// item exists, on the item. Entries older than 24 h are dropped: their numbers are free again.
export function giveCode(state, key, name, now) {
  state.codes = state.codes.filter((entry) => now - entry.at <= CODE_WINDOW_MS);
  const taken = new Set(state.codes.map((entry) => entry.n));
  let n = 1;
  while (taken.has(n)) n += 1;
  state.codes.push({ n, at: now, key, closedAt: null, name });
  const code = `a${n}`;
  const item = state.items[key];
  if (item) {
    item.code = code;
    item.codeAt = now;
  }
  return code;
}

// The newest codes entry given for a key, or null; entries older than 24 h do not count.
export function entryForKey(state, key, now) {
  for (let i = state.codes.length - 1; i >= 0; i -= 1) {
    const entry = state.codes[i];
    if (entry.key === key) return now - entry.at <= CODE_WINDOW_MS ? entry : null;
  }
  return null;
}

// Items nobody answered or skipped, oldest wait first.
export function openItems(state) {
  return Object.values(state.items)
    .filter((item) => !item.answeredAt && !item.skippedAt)
    .sort((a, b) => a.since - b.since);
}

function newItem(wait) {
  return {
    key: wait.key,
    sessionId: wait.sessionId,
    kind: wait.kind,
    since: wait.since,
    pendingId: wait.pendingId ?? null,
    answerable: Boolean(wait.answerable),
    askTool: wait.askTool ?? null,
    name: wait.name,
    project: wait.project,
    code: null,
    codeAt: null,
    announcedAt: null,
    silent: false,
    heldAt: null,
    answeredAt: null,
    answerRecordId: null,
    skippedAt: null,
    dawajAt: null,
  };
}

// Brings the items in line with the waits that exist now: new waits become items, ended waits drop
// theirs and close their code. A permission item whose hook ended while the prompt stays keeps its
// code, announcement and answer under the key of the remaining wait, and is no longer answerable.
export function reconcile(state, waits, now) {
  const byKey = new Map(waits.map((wait) => [wait.key, wait]));
  const successors = new Set();
  for (const item of Object.values(state.items)) {
    if (byKey.has(item.key)) continue;
    const successor = item.pendingId
      ? waits.find((wait) => !state.items[wait.key] && !successors.has(wait.key)
        && wait.sessionId === item.sessionId && wait.kind === 'permission' && wait.pendingId == null && wait.since >= item.since)
      : undefined;
    delete state.items[item.key];
    if (successor) {
      successors.add(successor.key);
      state.items[successor.key] = { ...item, key: successor.key, since: successor.since, pendingId: null, answerable: false };
    }
    const nextKey = successor ? successor.key : null;
    for (const entry of state.codes) {
      if (entry.key !== item.key || entry.closedAt) continue;
      if (nextKey) entry.key = nextKey;
      else entry.closedAt = now;
    }
    if (state.walkCurrent === item.key) state.walkCurrent = nextKey;
  }
  for (const wait of waits) {
    const item = state.items[wait.key];
    if (!item) {
      const fresh = newItem(wait);
      // A wait that vanished from the rows and returned under its key is the same wait: it keeps its
      // code and its announcement, so it speaks no second time. In a walk it also resumes as the current item.
      const entry = entryForKey(state, wait.key, now);
      if (entry) {
        fresh.code = `a${entry.n}`;
        fresh.codeAt = entry.at;
        fresh.announcedAt = entry.announcedAt ?? null;
        entry.closedAt = null;
        if (entry.walked && state.mode === 'walking' && !state.walkCurrent) state.walkCurrent = wait.key;
      }
      state.items[wait.key] = fresh;
    } else {
      item.name = wait.name;
      item.project = wait.project;
    }
  }
}
