#!/usr/bin/env node
// The hub watcher (spec §5.5), started by the hub through Monitor. Prints one line per state
// transition. It reacts to registry file changes and, every interval, polls `claude agents --json`
// and rescans all event logs, so a missed file notification is reconciled at the next interval.
// The previous states live in watch-state.json, so a re-armed watcher reports what changed while
// no watcher ran. The first run ever only records the states and prints nothing. A watcher that
// keeps running stops, without writing its state, once the claude process that started it is gone
// (P14).
// Usage: node hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000] [--owner-pid=<pid>] [--owner-check-ms=10000]
import { watch, mkdirSync } from 'node:fs';
import { hubRoot, registryDir } from '../lib/paths.mjs';
import { runPoll, appendPoll } from '../lib/polls.mjs';
import { buildOverview } from '../lib/overview.mjs';
import { snapshot, transitions, readWatchState, writeWatchState, errorReporter } from '../lib/watch.mjs';
import { processTable, findOwner, isAlive } from '../lib/owner.mjs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => !arg.includes('=')));
const value = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const intervalMs = Number(value('interval-ms') ?? 120000);
const once = flags.has('--once');
const root = hubRoot();
const errors = errorReporter((line) => console.log(line));

// Only a watcher that keeps running needs an owner; a single --once tick cannot outlive it.
let owner = null;
if (!once) {
  owner = value('owner-pid') ? Number(value('owner-pid')) : findOwner(processTable(), process.pid);
  if (!owner) console.log('watcher: no claude process among its ancestors; it will not stop with the hub session');
}

function stopIfOrphaned() {
  if (owner && !isAlive(owner)) {
    console.log(`watcher stopped: its hub session (process ${owner}) has ended`);
    process.exit(0);
  }
}

function tick(withPoll) {
  stopIfOrphaned();
  try {
    if (withPoll) appendPoll(root, runPoll());
    const next = snapshot(buildOverview(root).rows);
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
}

tick(!flags.has('--no-poll'));
if (!once) {
  mkdirSync(registryDir(root), { recursive: true });
  let pending = null;
  watch(registryDir(root), () => {
    clearTimeout(pending);
    pending = setTimeout(() => tick(false), 500);
  });
  setInterval(() => tick(!flags.has('--no-poll')), intervalMs);
  setInterval(stopIfOrphaned, Number(value('owner-check-ms') ?? 10000));
}
