#!/usr/bin/env node
// Global Claude Code hook (spec §4, §5.1): records one event per call into the hub registry.
// It never blocks a session: every failure ends with exit code 0 and no output.
import { randomUUID } from 'node:crypto';
import { hubRoot } from '../lib/paths.mjs';
import { recordHook } from '../lib/registry.mjs';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  try {
    recordHook(hubRoot(), JSON.parse(raw), { id: randomUUID(), at: new Date().toISOString() });
  } catch {
    // never block a session
  }
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
