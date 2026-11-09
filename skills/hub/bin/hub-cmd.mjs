#!/usr/bin/env node
// Commands Rafal types with `!` in the hub tab: `ok <code>` and `nie <code>` answer a waiting permission
// hook, `pauza` holds the alerts, `wracam` starts the walk through what waits. Exit code 0 when the
// command was accepted or done, 3 otherwise. `ok`/`nie` only write a decision and end: Claude Code writes the
// typed record to the transcript only after this command has ended (spec §5), and the hook accepts the
// decision after finding that record, so a model calling this file gets nothing. `HUB outcome` prints the verdict.
import { randomUUID } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { hubRoot, alertsLogPath } from '../lib/paths.mjs';
import { withQueue, itemByCode, codeEntry, openItems } from '../lib/queue.mjs';
import { readPending, writeDecision } from '../lib/pending.mjs';
import { isAlive } from '../lib/owner.mjs';

const hhmm = (ms) => {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

// What the item allows, or the sentence saying why not. A skipped item still waits, so its own code keeps
// naming it; an item with no hook behind it is answered in the session, also when it is a decision by its tool.
function lookup(root, state, code) {
  const item = itemByCode(state, code);
  const entry = codeEntry(state, code);
  if (!item && !entry) return { error: `${code}: nie ma takiej pozycji` };
  if (!item || !entry || item.answeredAt || entry.closedAt) return { error: `${code}: ta pozycja już nie czeka` };
  if (!item.answerable) return { error: `${code}: odpowiedz w sesji ${item.name}` };
  if (item.kind === 'decision') return { error: `${code} to decyzja: odpowiedz „${code} <tekst>”` };
  const pending = item.pendingId ? readPending(root, item.pendingId) : null;
  if (!pending || !isAlive(pending.pid)) return { error: `${code}: odpowiedz w sesji ${item.name}` };
  return { entry, pending };
}

// The attempt goes on the code entry, which outlives the item: after `allow` the tool runs and a watcher pass can
// drop the item before `HUB outcome` runs.
function answer(root, verb, rawCode) {
  const code = String(rawCode ?? '').toLowerCase();
  const attempt = randomUUID();
  const found = withQueue(root, (state) => {
    const result = lookup(root, state, code);
    if (result.entry) result.entry.decision = { pendingId: result.pending.id, attempt };
    return result;
  });
  if (found.error) return fail(found.error);
  writeDecision(root, found.pending.id, { verb, code, attempt, at: Date.now() });
  return done(`${code}: przyjęte, sprawdzam`);
}

function pause(root) {
  const pausedAt = withQueue(root, (state) => {
    if (state.mode !== 'paused' || !state.pausedAt) state.pausedAt = Date.now();
    state.mode = 'paused';
    return state.pausedAt;
  });
  return done(`Pauza od ${hhmm(pausedAt)}. Alerty wstrzymane, kolejka zbiera dalej.`);
}

function walk(root) {
  const waiting = withQueue(root, (state) => {
    const count = openItems(state).length;
    state.mode = count > 0 ? 'walking' : 'listening';
    state.pausedAt = null;
    // A current item left open would hold the walk in silence, so the oldest item is announced anew.
    state.walkCurrent = null;
    return count;
  });
  appendFileSync(alertsLogPath(root), `${JSON.stringify({ type: 'walk', at: Date.now(), waiting })}\n`, 'utf8');
  return done(waiting > 0 ? `Wracamy: czeka ${waiting}. Najstarsza idzie pierwsza.` : 'Nic nie czeka.');
}

const done = (text) => ({ text, code: 0 });
const fail = (text) => ({ text, code: 3 });

const [command, code] = process.argv.slice(2);
const root = hubRoot();
let result;
try {
  if (command === 'ok' || command === 'nie') result = answer(root, command, code);
  else if (command === 'pauza') result = pause(root);
  else if (command === 'wracam') result = walk(root);
  else result = fail('Użycie: ok <kod> | nie <kod> | pauza | wracam');
} catch (error) {
  result = fail(`Błąd: ${error.message}`);
}
process.stdout.write(`${result.text}\n`, () => process.exit(result.code));
