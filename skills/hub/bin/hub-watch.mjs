#!/usr/bin/env node
// The hub watcher (spec §5.5), started by the hub through Monitor. Prints one line per state
// transition. It reacts to registry file changes and, every interval, polls `claude agents --json`
// and rescans all event logs, so a missed file notification is reconciled at the next interval.
// The previous states live in watch-state.json, so a re-armed watcher reports what changed while
// no watcher ran. The first run ever only records the states and prints nothing. A watcher that
// keeps running stops, without writing its state, once the claude process that started it is gone
// (P14). It also speaks: a wait that is 60 s old is said aloud by a separate process, without a model,
// and printed as an `announce:` line (lib/alerts.mjs). Every tick and every 5 s it writes the heartbeat
// file that tells the permission hook the hub is open.
// Usage: node hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000] [--owner-pid=<pid>] [--owner-check-ms=10000] [--alert-check-ms=5000]
import { watch, mkdirSync } from 'node:fs';
import { hubRoot, registryDir } from '../lib/paths.mjs';
import { runPoll, appendPoll } from '../lib/polls.mjs';
import { buildOverview } from '../lib/overview.mjs';
import { snapshot, transitions, readWatchState, writeWatchState, errorReporter, debouncer } from '../lib/watch.mjs';
import { processTable, findOwner, isAlive } from '../lib/owner.mjs';
import { createAlerts, touchHeartbeat } from '../lib/alerts.mjs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => !arg.includes('=')));
const value = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const intervalMs = Number(value('interval-ms') ?? 120000);
const once = flags.has('--once');
const root = hubRoot();
const errors = errorReporter((line) => console.log(line));
const alertErrors = errorReporter((line) => console.log(line));
// The overview rows of the last successful tick and when they were built: the 5 s alert pass works on them and
// does not rebuild the overview. Null until one overview has succeeded, and the alert pass does nothing until then.
let current = null;

// Only a watcher that keeps running needs an owner; a single --once tick cannot outlive it.
let owner = null;
if (!once) {
  owner = value('owner-pid') ? Number(value('owner-pid')) : findOwner(processTable(), process.pid);
  if (!owner) console.log('watcher: no claude process among its ancestors; it will not stop with the hub session');
}

const alerts = createAlerts({
  root, print: (line) => console.log(line), onError: (message) => alertErrors.fail(message), onOk: () => alertErrors.ok(), rows: () => current, owner,
});

function stopIfOrphaned() {
  if (owner && !isAlive(owner)) {
    console.log(`watcher stopped: its hub session (process ${owner}) has ended`);
    process.exit(0);
  }
}

function tick(withPoll) {
  stopIfOrphaned();
  touchHeartbeat(root);
  try {
    if (withPoll) appendPoll(root, runPoll());
    const rows = buildOverview(root).rows;
    current = { rows, rowsAt: Date.now() };
    const next = snapshot(rows);
    const { state: prev, unreadable } = readWatchState(root);
    // The owner may have ended while the overview was built: check again right before the write.
    stopIfOrphaned();
    if (unreadable) console.log('watcher state unreadable; seeded again from the current overview');
    if (prev) for (const line of transitions(prev, next)) console.log(line);
    writeWatchState(root, next);
    errors.ok();
  } catch (error) {
    errors.fail(error.message);
  }
  return alerts.pass();
}

await tick(!flags.has('--no-poll'));
if (once) {
  await alerts.drain();
} else {
  mkdirSync(registryDir(root), { recursive: true });
  watch(registryDir(root), debouncer(() => tick(false)));
  setInterval(() => tick(!flags.has('--no-poll')), intervalMs);
  setInterval(() => {
    stopIfOrphaned();
    touchHeartbeat(root);
    alerts.pass();
  }, Number(value('alert-check-ms') ?? 5000));
  setInterval(stopIfOrphaned, Number(value('owner-check-ms') ?? 10000));
}
