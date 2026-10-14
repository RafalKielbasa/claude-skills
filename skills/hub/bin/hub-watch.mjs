#!/usr/bin/env node
// The hub watcher (spec §5.5), started by the hub through Monitor. Prints one line per state
// transition. It reacts to registry file changes and, every interval, polls `claude agents --json`
// and rescans all event logs, so a missed file notification is reconciled at the next interval.
// The previous states live in watch-state.json, so a re-armed watcher reports what changed while
// no watcher ran. The first run ever only records the states and prints nothing.
// Usage: node hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000]
import { watch, mkdirSync } from 'node:fs';
import { hubRoot, registryDir } from '../lib/paths.mjs';
import { runPoll, appendPoll } from '../lib/polls.mjs';
import { buildOverview } from '../lib/overview.mjs';
import { snapshot, transitions, readWatchState, writeWatchState, errorReporter } from '../lib/watch.mjs';

const args = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--interval-ms=')));
const intervalArg = process.argv.slice(2).find((arg) => arg.startsWith('--interval-ms='));
const intervalMs = intervalArg ? Number(intervalArg.split('=')[1]) : 120000;
const root = hubRoot();
const errors = errorReporter((line) => console.log(line));

function tick(withPoll) {
  try {
    if (withPoll) appendPoll(root, runPoll());
    const next = snapshot(buildOverview(root).rows);
    const { state: prev, unreadable } = readWatchState(root);
    if (unreadable) console.log('watcher state unreadable; seeded again from the current overview');
    if (prev) for (const line of transitions(prev, next)) console.log(line);
    writeWatchState(root, next);
    errors.ok();
  } catch (error) {
    errors.fail(error.message);
  }
}

tick(!args.has('--no-poll'));
if (!args.has('--once')) {
  mkdirSync(registryDir(root), { recursive: true });
  let pending = null;
  watch(registryDir(root), () => {
    clearTimeout(pending);
    pending = setTimeout(() => tick(false), 500);
  });
  setInterval(() => tick(!args.has('--no-poll')), intervalMs);
}
