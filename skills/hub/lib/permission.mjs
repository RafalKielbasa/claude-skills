// The logic of the PermissionRequest hook (spec §5, §6.1): when it stays out, when a call it holds was
// answered elsewhere, what it prints, and whether a decision really was typed by Rafal.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isAlive } from './owner.mjs';
import { heartbeatPath } from './paths.mjs';
import { readOutcome } from './pending.mjs';
import { samePath } from './projects.mjs';
import { codeEntry, itemByCode, readQueue, withQueue } from './queue.mjs';
import { isDialogName } from './waits.mjs';
import { hubTranscriptPaths, typedCommands } from './transcript.mjs';

const HUB_CLOSED_MS = 5 * 60 * 1000;
// A gap this long between the hook's 2 s rounds means the computer slept.
const ROUND_GAP_MS = 30 * 1000;
const HUB_STALE_GRACE_MS = 60 * 1000;
const DECISION_MAX_AGE_MS = 15 * 1000;
// Date.now() differs by up to 15 ms between Node processes on Windows (measured), so a decision the hook reads the
// moment it stands must not count as one from the future. This much reach past the decision opens nothing.
const CLOCK_SKEW_MS = 100;
const USED_RECORDS_KEPT = 50;
const OUTCOME_WAIT_MS = 10000;
const OUTCOME_POLL_MS = 100;
const CALL_MAX = 200;
const ASK_TOOLS = new Set(['AskUserQuestion', 'ExitPlanMode']);
// Observed values; anything else passes through, which costs Rafal the hub's answer and stalls nothing.
const WAITING_ENTRYPOINTS = new Set(['cli', 'claude-vscode']);
const ENDING_EVENTS = new Set(['UserPromptSubmit', 'Stop', 'StopFailure', 'SessionEnd']);
const DENY_MESSAGE = 'Rafał odmówił tego wywołania z huba. Nie obchodź tej odmowy: zakończ turę i napisz, czego potrzebowałeś.';

const toMs = (value) => (typeof value === 'number' ? value : Date.parse(value));

export function hubRunning(root, now = Date.now()) {
  try {
    return now - statSync(heartbeatPath(root)).mtimeMs < HUB_CLOSED_MS;
  } catch {
    return false;
  }
}

// One round of the hook's look at the hub (spec §6.1). `! pauza` is for leaving the computer, and on waking the
// heartbeat is old until the watcher's 5 s timer writes it, so a gap over 30 s skips the round's check. The hub counts
// as stopped only when the heartbeat stayed stale through `graceMs` of the hook's own waking time.
export function nextHubWatch(prev, { now, running, graceMs = HUB_STALE_GRACE_MS }) {
  const gap = now - prev.wasAt;
  if (running || gap > ROUND_GAP_MS) return { wasAt: now, staleMs: 0, gone: false };
  const staleMs = prev.staleMs + Math.max(0, gap);
  return { wasAt: now, staleMs, gone: staleMs >= graceMs };
}

// Claude Code enforces the hook's `timeout` only while it lives. `value` is CLAUDE_PID; unset or
// unusable is no signal, so it never ends a hook that could still be answered.
export function sessionProcessGone(value, alive = isAlive) {
  const pid = Number(value);
  return Number.isInteger(pid) && pid > 0 && !alive(pid);
}

// `name` from <jobDir>/state.json, null on any failure.
export function readJobName(jobDir) {
  if (!jobDir) return null;
  try {
    const name = JSON.parse(readFileSync(join(jobDir, 'state.json'), 'utf8'))?.name;
    return typeof name === 'string' ? name : null;
  } catch {
    return null;
  }
}

// Why the hook returns at once with no decision, or null when it should wait. `root` is there for a
// new hub tab: hub-sessions.json is refreshed only by the overview, so it may not be listed yet.
export function passThroughReason({ input, root, hubRunning: running, hubSessions, entrypoint, jobName }) {
  if (!running) return 'hub-closed';
  if (hubSessions.hub.includes(input.session_id) || (root && input.cwd && samePath(input.cwd, root))) return 'hub-session';
  const launchedFork = hubSessions.launched.some((item) => item.sessionId === input.session_id && isDialogName(item.name));
  if (isDialogName(jobName) || launchedFork) return 'dialog-fork';
  if (ASK_TOOLS.has(input.tool_name)) return 'ask-tool';
  if (!WAITING_ENTRYPOINTS.has(entrypoint)) return 'entrypoint';
  return null;
}

// The first event showing the prompt was answered in the session. The input hash, not the target,
// tells the calls apart: two Bash calls can share a description or have none.
export function laterEvent(events, record) {
  const startedAt = toMs(record.startedAt);
  const answers = (event) => ENDING_EVENTS.has(event.event)
    || (event.event === 'PostToolUse' && event.tool === record.tool && event.inputHash === record.inputHash);
  return events.find((event) => toMs(event.at) > startedAt && answers(event)) ?? null;
}

// Only the exact verb `ok` allows. `deny` never carries `interrupt`.
export function hookOutput(verb) {
  const decision = verb === 'ok' ? { behavior: 'allow' } : { behavior: 'deny', message: DENY_MESSAGE };
  return { hookSpecificOutput: { hookEventName: 'PermissionRequest', decision } };
}

const isFresh = (at, now) => typeof at === 'number' && Number.isFinite(at) && at <= now + CLOCK_SKEW_MS && now - at <= DECISION_MAX_AGE_MS;

// The first record no decision has used, marked used in the same step, so one typing opens one decision. A busy lock
// counts as not found: the hook searches again.
function takeTypedRecord(root, records) {
  if (records.length === 0) return null;
  try {
    return withQueue(root, (state) => {
      const used = state.usedTypedRecords ?? [];
      const free = records.find((record) => !used.includes(record.uuid));
      if (free) state.usedTypedRecords = [...used, free.uuid].slice(-USED_RECORDS_KEPT);
      return free ?? null;
    });
  } catch {
    return null;
  }
}

// Accepts a decision only for the queue item of this very record, and only when the command was typed in a hub
// session after that item got its code and within the 15 s before the decision, each typing once (spec §5). A
// decision that is no longer fresh gets no search. One search, without retries; the hook repeats it.
export function verifyDecision({ root, record, decision, now = Date.now() }) {
  const verdict = (accepted, reason, typedAt = null) => ({ accepted, reason, typedAt, at: new Date(now).toISOString() });
  if (decision?.verb !== 'ok' && decision?.verb !== 'nie') return verdict(false, 'bad-verb');
  if (!isFresh(decision.at, now)) return verdict(false, 'stale-decision');
  const item = itemByCode(readQueue(root), decision.code);
  if (!item || item.pendingId !== record.id || typeof item.codeAt !== 'number') return verdict(false, 'no-item');
  const window = { fromMs: Math.max(item.codeAt, decision.at - DECISION_MAX_AGE_MS), toMs: decision.at };
  const typed = takeTypedRecord(root, hubTranscriptPaths(root).flatMap((path) => typedCommands(path, decision.verb, item.code, window)));
  return typed ? verdict(true, null, typed.timestamp) : verdict(false, 'not-typed');
}

// The literal command for Bash, never the model-written description; other tools keep their target.
export function shownCall(record) {
  const raw = typeof record.input?.command === 'string' ? record.input.command : record.target;
  const line = String(raw ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
  return line.length > CALL_MAX ? `${line.slice(0, CALL_MAX)}…` : line;
}

// Best effort, so a busy queue cannot cost the answer that was already decided.
export function markAnswered(root, code, now = Date.now()) {
  try {
    withQueue(root, (state) => {
      const item = itemByCode(state, code);
      if (item && !item.answeredAt) item.answeredAt = now;
    });
  } catch {
    // see above
  }
}

function outcomeLine(code, name, outcome) {
  if (outcome.accepted) return [`${code}: ${outcome.verb === 'ok' ? 'zatwierdzone' : 'odrzucone'}`, name, outcome.call].filter(Boolean).join(' · ');
  if (outcome.reason === 'not-typed') return `${code}: nic nie zatwierdzono, bo tej komendy nie wpisano w zakładce huba`;
  return `${code}: nic nie zatwierdzono (${outcome.reason})`;
}

// `HUB outcome`, read-only: the hook's verdict on the last decision of a code. The code entry holds that decision
// and its name, because the item can leave the queue first. Writes and removes nothing, so a model running it
// approves nothing; `cleanup` removes old outcomes.
export async function decisionOutcome(root, rawCode, { waitMs = OUTCOME_WAIT_MS } = {}) {
  const code = String(rawCode).toLowerCase();
  const entry = codeEntry(readQueue(root), code);
  if (!entry?.decision) return { accepted: false, text: `${code}: nie ma decyzji do sprawdzenia` };
  const limit = Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : OUTCOME_WAIT_MS;
  const deadline = Date.now() + limit;
  for (;;) {
    const outcome = readOutcome(root, entry.decision.pendingId, entry.decision.attempt);
    if (outcome) return { accepted: outcome.accepted === true, text: outcomeLine(code, entry.name, outcome) };
    if (Date.now() >= deadline) return { accepted: false, text: `${code}: brak odpowiedzi hooka po 10 s. Zobacz, czy prompt w sesji ${entry.name} nadal czeka.` };
    await new Promise((resolve) => setTimeout(resolve, OUTCOME_POLL_MS));
  }
}
