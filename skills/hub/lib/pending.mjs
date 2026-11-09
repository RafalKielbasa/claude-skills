// The files the PermissionRequest hook and the typed commands talk through. A pending record holds
// the full tool input, which the registry deliberately does not (spec §6.1), so it lives here and is
// deleted when closed. A hook killed at its limit cannot clean up: a record whose pid is gone counts
// as closed, and so does one past the hook's limit, since Windows can reuse a pid. The decision is the
// command's word to the hook, the outcome is the hook's answer.
import { appendFileSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { approvalsLogPath, asksPath, pendingDir, safeId } from './paths.mjs';
import { isAlive } from './owner.mjs';
import { writeAtomically } from './queue.mjs';

// safeId leaves no dot in an id, so only a record's own file has this form.
const RECORD_FILE = /^([^.]+)\.json$/;
// The hook's `timeout`, 28800 s.
const PENDING_LIMIT_MS = 8 * 60 * 60 * 1000;
const toMs = (value) => (typeof value === 'number' ? value : Date.parse(value));

const recordPath = (root, id) => join(pendingDir(root), `${safeId(id)}.json`);
const decisionPath = (root, id) => join(pendingDir(root), `${safeId(id)}.decision.json`);
const outcomePath = (root, id) => join(pendingDir(root), `${safeId(id)}.outcome.json`);

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeAtomically(path, JSON.stringify(value));
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function appendLine(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(value)}\n`, 'utf8');
}

export function writePending(root, record) {
  writeJson(recordPath(root, record.id), record);
  return record;
}

export function readPending(root, id) {
  return readJson(recordPath(root, id));
}

// Best effort, so a failed delete cannot cost a hook its answer: the record counts as closed anyway
// once the hook's pid is gone. The decision goes with it; the outcome stays for `HUB outcome`, and `cleanup` removes it.
export function closePending(root, id) {
  for (const path of [recordPath(root, id), decisionPath(root, id)]) {
    try {
      rmSync(path, { force: true });
    } catch {
      // see above
    }
  }
}

// The records of hooks still running. An unreadable file says nothing about its pid and is left alone.
export function listOpenPendings(root, { alive = isAlive, now = Date.now() } = {}) {
  let names;
  try {
    names = readdirSync(pendingDir(root));
  } catch {
    return [];
  }
  const open = [];
  for (const name of names) {
    const id = RECORD_FILE.exec(name)?.[1];
    const record = id ? readPending(root, id) : null;
    if (!record) continue;
    if (alive(record.pid) && !(now - toMs(record.startedAt) >= PENDING_LIMIT_MS)) open.push(record);
    else closePending(root, id);
  }
  return open;
}

export function writeDecision(root, id, decision) {
  writeJson(decisionPath(root, id), decision);
}

export function readDecision(root, id) {
  return readJson(decisionPath(root, id));
}

export function removeDecision(root, id) {
  rmSync(decisionPath(root, id), { force: true });
}

export function writeOutcome(root, id, outcome) {
  writeJson(outcomePath(root, id), outcome);
}

// Null unless the file holds this attempt, so a run never takes an earlier run's outcome for its own.
export function readOutcome(root, id, attempt) {
  const outcome = readJson(outcomePath(root, id));
  return outcome?.attempt === attempt ? outcome : null;
}

export function appendAsk(root, { sessionId, tool, at }) {
  appendLine(asksPath(root), { sessionId, tool, at });
}

// A broken line is skipped, never fatal.
export function readAsks(root) {
  let text;
  try {
    text = readFileSync(asksPath(root), 'utf8');
  } catch {
    return [];
  }
  const asks = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      asks.push(JSON.parse(line));
    } catch {
      // see above
    }
  }
  return asks;
}

export function appendApproval(root, line) {
  appendLine(approvalsLogPath(root), line);
}
