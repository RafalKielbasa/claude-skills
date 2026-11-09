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

// Session transcript records in the shape measured on real sessions (5a9651ac): a tool_use block in an
// assistant message, its tool_result in a user message, and the text „No” in a prompt leaves right after.
export const transcriptToolUse = (id, input, timestamp, { tool = 'Bash', ...fields } = {}) => ({
  type: 'assistant', isSidechain: false, message: { role: 'assistant', content: [{ type: 'tool_use', id, name: tool, input }] }, timestamp, ...fields,
});
export const transcriptToolResult = (id, timestamp, { block = {}, ...fields } = {}) => ({
  type: 'user', isSidechain: false, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: 'done', ...block }] }, timestamp, ...fields,
});
export const REFUSED_RESULT = { block: { is_error: true, content: "The user doesn't want to proceed with this tool use. The tool use was rejected." } };
export const transcriptInterrupted = (timestamp, fields = {}) => ({
  type: 'user', isSidechain: false, message: { role: 'user', content: [{ type: 'text', text: '[Request interrupted by user for tool use]' }] }, timestamp, ...fields,
});
export const jsonLines = (...records) => records.map((record) => `${JSON.stringify(record)}\n`).join('');
