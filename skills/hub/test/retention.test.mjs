import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync, existsSync, readdirSync, utimesSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup } from '../lib/retention.mjs';
import { readPolls } from '../lib/polls.mjs';
import { readAsks } from '../lib/pending.mjs';
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

test('retention removes pending leftovers and old asks, and keeps both logs', () => {
  const root = tempRoot();
  const pending = join(root, 'pending');
  mkdirSync(pending, { recursive: true });
  const now = Date.parse('2026-11-07T12:00:00Z');
  const old = new Date(now - 2 * 24 * 3600 * 1000);
  const write = (name, text = '{}') => writeFileSync(join(pending, name), text);
  const aged = (name) => {
    write(name);
    utimesSync(join(pending, name), old, old);
  };
  // a record whose hook is gone, with its decision; and one whose hook is alive, however old
  write('dead.json', JSON.stringify({ id: 'dead', pid: 111, startedAt: old.toISOString() }));
  write('dead.decision.json');
  write('live.json', JSON.stringify({ id: 'live', pid: 222, startedAt: old.toISOString() }));
  utimesSync(join(pending, 'live.json'), old, old);
  write('live.decision.json');
  aged('gone.outcome.json');
  aged('gone.decision.json');
  write('fresh.outcome.json');
  const asks = [
    { sessionId: 's', tool: 'AskUserQuestion', at: new Date(now - 25 * 3600 * 1000).toISOString() },
    { sessionId: 's', tool: 'AskUserQuestion', at: new Date(now - 3600 * 1000).toISOString() },
  ];
  writeFileSync(join(root, 'asks.jsonl'), `${asks.map((a) => JSON.stringify(a)).join('\n')}\n`);
  writeFileSync(join(root, 'alerts.jsonl'), '{"type":"alert"}\n');
  writeFileSync(join(root, 'approvals.jsonl'), '{"verb":"ok"}\n');

  const result = cleanup(root, now, { alive: (pid) => pid === 222 });
  assert.deepEqual(readdirSync(pending).sort(), ['fresh.outcome.json', 'live.decision.json', 'live.json']);
  assert.equal(result.pendingRemoved, 4);
  assert.equal(result.asksKept, 1);
  assert.equal(readAsks(root).length, 1);
  assert.equal(readAsks(root)[0].at, asks[1].at);
  assert.equal(existsSync(join(root, 'alerts.jsonl')), true);
  assert.equal(existsSync(join(root, 'approvals.jsonl')), true);
});

test('retention with no pending directory and no asks file reports zeros', () => {
  const result = cleanup(tempRoot(), Date.now());
  assert.equal(result.pendingRemoved, 0);
  assert.equal(result.asksKept, 0);
});

test('retention leaves asks.jsonl untouched when nothing is old, and keeps an ask with an unreadable time', () => {
  const root = tempRoot();
  const now = Date.parse('2026-11-07T12:00:00Z');
  const fresh = JSON.stringify({ sessionId: 's', tool: 'AskUserQuestion', at: new Date(now - 3600 * 1000).toISOString() });
  const broken = JSON.stringify({ sessionId: 's', tool: 'AskUserQuestion', at: 'not a time' });
  const text = `${fresh}\n\n${broken}\n`;
  writeFileSync(join(root, 'asks.jsonl'), text);
  const mtime = new Date(now - 5000);
  utimesSync(join(root, 'asks.jsonl'), mtime, mtime);
  assert.equal(cleanup(root, now).asksKept, 2);
  assert.equal(readFileSync(join(root, 'asks.jsonl'), 'utf8'), text); // byte for byte, so not rewritten
  assert.equal(statSync(join(root, 'asks.jsonl')).mtimeMs, mtime.getTime());
  // an old ask beside it is dropped and the unreadable one stays
  const old = JSON.stringify({ sessionId: 's', tool: 'AskUserQuestion', at: new Date(now - 30 * 3600 * 1000).toISOString() });
  writeFileSync(join(root, 'asks.jsonl'), `${old}\n${broken}\n`);
  assert.equal(cleanup(root, now).asksKept, 1);
  assert.deepEqual(readAsks(root).map((ask) => ask.at), ['not a time']);
});

test('retention removes a corrupt pending record only once it is a day old', () => {
  const root = tempRoot();
  const pending = join(root, 'pending');
  mkdirSync(pending, { recursive: true });
  const now = Date.parse('2026-11-07T12:00:00Z');
  const old = new Date(now - 2 * 24 * 3600 * 1000);
  writeFileSync(join(pending, 'bad-old.json'), '{not json');
  utimesSync(join(pending, 'bad-old.json'), old, old);
  writeFileSync(join(pending, 'bad-new.json'), '{not json');
  utimesSync(join(pending, 'bad-new.json'), new Date(now - 1000), new Date(now - 1000));
  const result = cleanup(root, now);
  assert.deepEqual(readdirSync(pending), ['bad-new.json']);
  assert.equal(result.pendingRemoved, 1);
});
