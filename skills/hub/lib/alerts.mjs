// The spoken-alert schedule (spec §4.1, §4.2, §6.3). `markDue` decides, on the queue state, which
// waits are due to speak; `announce` claims one under the lock, so two watchers never speak the same
// wait; `createAlerts` runs the passes and speaks the due waits one at a time, with no model involved.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { alertsLogPath, heartbeatPath } from './paths.mjs';
import { withQueue, reconcile, giveCode, openItems, entryForKey } from './queue.mjs';
import { collectWaits } from './waits.mjs';
import { listOpenPendings, readAsks } from './pending.mjs';
import { sentence, speak } from './speech.mjs';
import { anyLiveVoice, dialogRootOf } from './voicelive.mjs';

export const ALERT_DELAY_MS = 60 * 1000;
export const CATCH_UP_MS = 10 * 60 * 1000;

const isOpen = (item) => Boolean(item) && !item.answeredAt && !item.skippedAt;

// Mutates `silent`, `heldAt`, `seededAt`, and in a walk `mode` and `walkCurrent`; returns the waits to
// speak now, oldest first.
export function markDue(state, waits, now, { voiceLive = false } = {}) {
  if (state.seededAt == null) {
    for (const wait of waits) {
      if (state.items[wait.key]) state.items[wait.key].silent = true;
    }
    state.seededAt = now;
    return [];
  }
  if (state.mode === 'paused') return [];
  if (state.mode === 'walking') {
    if (isOpen(state.items[state.walkCurrent])) return [];
    state.walkCurrent = null;
    const open = openItems(state);
    if (open.length === 0) {
      state.mode = 'listening';
      return [];
    }
    if (voiceLive || now - open[0].since < ALERT_DELAY_MS) return [];
    const wait = waits.find((candidate) => candidate.key === open[0].key);
    return wait ? [wait] : [];
  }
  const due = [];
  for (const wait of waits) {
    const item = state.items[wait.key];
    if (!item || item.announcedAt || item.silent || item.answeredAt || item.skippedAt) continue;
    const age = now - item.since;
    if (age < ALERT_DELAY_MS) continue;
    if (voiceLive) {
      item.heldAt ??= now;
      continue;
    }
    if (age > CATCH_UP_MS && !item.heldAt) {
      item.silent = true;
      continue;
    }
    due.push(wait);
  }
  return due.sort((a, b) => a.since - b.since);
}

// Claims the wait under the lock. Nothing is claimed when the mode no longer allows the alert, or the
// item was announced (listening), or is the current one or not first in turn (walk): another watcher got there first,
// or `wracam` flipped the mode while entries waited in the speech queue.
export function announce(root, wait, now, { owner = null } = {}) {
  return withQueue(root, (state) => {
    const item = state.items[wait.key];
    const walking = state.mode === 'walking';
    const claimable = item && state.mode !== 'paused' && isOpen(item)
      && (walking ? !isOpen(state.items[state.walkCurrent]) : !item.announcedAt && !item.silent);
    if (!claimable) return { code: item?.code ?? null, announced: false };
    const code = item.code ?? giveCode(state, item.key, item.name, now);
    item.announcedAt = now;
    state.lastAnnounced = code;
    const entry = entryForKey(state, item.key, now);
    if (entry) {
      entry.announcedAt = now;
      if (walking) entry.walked = true;
    }
    if (walking) {
      state.walkCurrent = item.key;
      const seen = state.walkSeen?.key === item.key ? state.walkSeen.owners : [];
      state.walkSeen = { key: item.key, owners: owner == null || seen.includes(owner) ? seen : [...seen, owner] };
    }
    appendFileSync(alertsLogPath(root), `${JSON.stringify({
      type: 'alert', at: now, code, key: item.key, sessionId: item.sessionId, project: item.project, name: item.name, kind: item.kind, mode: state.mode,
    })}\n`, 'utf8');
    return { code, announced: true };
  });
}

// A watcher that starts on a walk under an owner that has not announced the current item belongs to a hub tab that
// has not shown it, so that item speaks once there. The hub's Monitor re-arms the watcher of one tab every 30 min, with
// the same owner, and a wait speaks once, also when two tabs re-arm in turns. A watcher with no owner says nothing
// about the tab.
export function takeOverWalk(state, owner) {
  if (state.mode === 'walking' && owner != null && !(state.walkSeen?.owners ?? []).includes(owner)) state.walkCurrent = null;
}

// Tells the hook the hub is open (it passes through as `hub-closed` once the file is older than 5 min).
// A failed write must never stop the watcher.
export function touchHeartbeat(root) {
  try {
    mkdirSync(root, { recursive: true });
    writeFileSync(heartbeatPath(root), String(Date.now()), 'utf8');
  } catch {
    // see above
  }
}

// Session titles are untrusted text: a control character must not split or fake a watcher line.
const oneLine = (text) => String(text ?? '').replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ').trim();

export function announceLine(code, wait) {
  const who = `${wait.project} ${wait.shortId} ${oneLine(wait.name)}`;
  return wait.kind === 'permission' ? `announce: ${code} permission: ${who}` : `announce: ${code} decision: ${who} — ${oneLine(wait.detail)}`;
}

const FAILURE_MAX = 200;

// `rows` returns the overview rows of the latest successful tick with the time they were built,
// `{ rows, rowsAt }`, or null before any tick succeeded. Nothing is reconciled until it returns rows:
// an empty list standing in for a failed overview would close every item.
export function createAlerts({ root, env = process.env, print, onError = () => {}, onOk = () => {}, speakFn = speak, clock = Date.now, rows, owner = null }) {
  let started = false;
  const fifo = [];
  const queued = new Set();
  let working = null;
  let lastFailure = null;

  async function speakNext() {
    while (fifo.length > 0) {
      const wait = fifo.shift();
      try {
        // A voice conversation that began while this entry waited must not be talked over. The item stays
        // unannounced, so the next pass sets its `heldAt`.
        if (await anyLiveVoice(dialogRootOf(env))) continue;
        const { code, announced } = announce(root, wait, clock(), { owner });
        if (!announced) continue;
        print(announceLine(code, wait));
        try {
          await speakFn(sentence(wait), { env });
          lastFailure = null;
        } catch (error) {
          const message = oneLine(error.message).slice(0, FAILURE_MAX);
          if (message !== lastFailure) print(`speech failed: ${message}`);
          lastFailure = message;
        }
      } catch (error) {
        onError(error.message);
      } finally {
        queued.delete(wait.key);
      }
    }
  }

  function kick() {
    if (!working) working = speakNext().finally(() => { working = null; });
  }

  const waitsOf = (source, now) => collectWaits({ rows: source.rows, pendings: listOpenPendings(root), asks: readAsks(root), now });

  // One pass over the cached overview rows: reconcile the queue, mark what is due, hand it to the speaker.
  // The rows are read again after the voice probe, which can take seconds, and the queue remembers the
  // time of the rows it was last reconciled with: a pass holding older rows (another watcher's tick, or a
  // tick of this one, got there first) changes nothing instead of reviving a wait that was closed.
  async function pass() {
    try {
      const before = rows();
      if (!before) return;
      const voiceLive = waitsOf(before, clock()).length > 0 && await anyLiveVoice(dialogRootOf(env));
      const source = rows();
      const now = clock();
      const waits = waitsOf(source, now);
      const { due, corrupt } = withQueue(root, (state) => {
        const unreadable = state.corruptAt != null;
        delete state.corruptAt;
        if (!started) takeOverWalk(state, owner);
        if (source.rowsAt < (state.rowsAt ?? 0)) return { due: [], corrupt: unreadable };
        state.rowsAt = source.rowsAt;
        reconcile(state, waits, now);
        return { due: markDue(state, waits, now, { voiceLive }), corrupt: unreadable };
      });
      started = true;
      if (corrupt) print('queue state unreadable; seeded again');
      for (const wait of due) {
        if (queued.has(wait.key)) continue;
        queued.add(wait.key);
        fifo.push(wait);
      }
      kick();
      onOk();
    } catch (error) {
      onError(error.message);
    }
  }

  async function drain() {
    while (working) await working;
  }

  return { pass, drain };
}
