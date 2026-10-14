import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup } from '../lib/retention.mjs';
import { readPolls } from '../lib/polls.mjs';
import { recordJudgment, readJudgments } from '../lib/judgments.mjs';
import { tempRoot, ev } from './helpers.mjs';

test('retention deletes old ended sessions with their last-message directory, and old polls only', () => {
  const root = tempRoot();
  const registry = join(root, 'registry');
  mkdirSync(join(registry, 'old.last'), { recursive: true });
  writeFileSync(join(registry, 'old.last', 'e.md'), 'x');
  appendFileSync(join(registry, 'old.events.jsonl'), `${JSON.stringify(ev('SessionEnd', '2026-09-01T10:00:00Z', { sessionId: 'old', reason: 'other' }))}\n`);
  appendFileSync(join(registry, 'recent.events.jsonl'), `${JSON.stringify(ev('SessionEnd', '2026-10-13T10:00:00Z', { sessionId: 'recent', reason: 'other' }))}\n`);
  appendFileSync(join(registry, 'alive.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-09-01T10:00:00Z', { sessionId: 'alive' }))}\n`);
  appendFileSync(join(registry, 'polls.jsonl'), `${JSON.stringify({ at: '2026-09-01T10:00:00Z', ok: true, sessions: [] })}\n${JSON.stringify({ at: '2026-10-14T10:00:00Z', ok: true, sessions: [] })}\n`);
  mkdirSync(join(root, 'projects', 'app'), { recursive: true });
  writeFileSync(join(root, 'projects', 'app', 'journal.jsonl'), '{}\n');
  recordJudgment(root, { sessionId: 'old', stopId: 'e1', verdict: 'question', at: '2026-09-01T10:00:00Z' });
  recordJudgment(root, { sessionId: 'alive', stopId: 'e2', verdict: 'other', at: '2026-09-01T10:00:00Z' });

  const result = cleanup(root, Date.parse('2026-10-14T12:00:00Z'));
  assert.deepEqual(result.removed, ['old']);
  assert.deepEqual(readJudgments(root).map((j) => j.sessionId), ['alive']);
  assert.equal(result.judgmentsKept, 1);
  assert.equal(existsSync(join(registry, 'old.events.jsonl')), false);
  assert.equal(existsSync(join(registry, 'old.last')), false);
  assert.equal(existsSync(join(registry, 'recent.events.jsonl')), true);
  assert.equal(existsSync(join(registry, 'alive.events.jsonl')), true);
  assert.equal(readPolls(root).length, 1);
  assert.equal(existsSync(join(root, 'projects', 'app', 'journal.jsonl')), true);
});
