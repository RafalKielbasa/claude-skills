// Shared test helpers: a fresh temporary hub data root per test and fixture loading with overrides.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function tempRoot() {
  return mkdtempSync(join(tmpdir(), 'hub-test-'));
}

export function fixture(name, overrides = {}) {
  const base = JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
  return { ...base, ...overrides };
}

// A registry event as the hook would write it, for derive/overview tests.
let counter = 0;
export function ev(event, at, fields = {}) {
  counter += 1;
  return { id: `e${counter}`, at, event, sessionId: 's1', cwd: 'C:\\repo', promptId: 'p1', index: counter, ...fields };
}
