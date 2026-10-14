import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveSession } from '../lib/derive.mjs';
import { runPoll, appendPoll, readPolls, isVanished } from '../lib/polls.mjs';
import { displayState, linkContinuations } from '../lib/display.mjs';
import { isWithin, projectFor, aliasErrors } from '../lib/projects.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';
import { tempRoot, ev } from './helpers.mjs';

const NOW = Date.parse('2026-10-14T12:00:00Z');

function writeLog(root, sessionId, events) {
  mkdirSync(join(root, 'registry'), { recursive: true });
  for (const event of events) appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), `${JSON.stringify({ ...event, sessionId })}\n`);
}

const poll = (at, sessions) => ({ at, ok: true, sessions });
const agent = (sessionId, status = 'idle', extra = {}) => ({ sessionId, id: sessionId.slice(0, 8), name: null, kind: 'interactive', status, state: null, cwd: null, ...extra });

test('runPoll records success, a non-zero exit and unparsable output', () => {
  const ok = runPoll({ run: () => ({ status: 0, stdout: JSON.stringify([{ sessionId: 's1', status: 'busy', state: 'blocked' }]) }), at: 't' });
  assert.equal(ok.ok, true);
  assert.equal(ok.sessions[0].state, 'blocked');
  assert.equal(runPoll({ run: () => ({ status: 1, stderr: 'boom' }), at: 't' }).error, 'boom');
  assert.match(runPoll({ run: () => ({ status: 0, stdout: 'x' }), at: 't' }).error, /^unparsable/);
  let seen;
  runPoll({ run: (_cmd, _args, options) => { seen = options; return { status: 0, stdout: '[]' }; }, at: 't' });
  assert.equal(seen.timeout, 30000);
  const timedOut = runPoll({ run: () => ({ error: new Error('spawnSync claude ETIMEDOUT'), status: null }), at: 't' });
  assert.equal(timedOut.ok, false);
  assert.match(timedOut.error, /ETIMEDOUT/);
});

test('a session vanishes only after two successful polls without it; failed polls do not count', () => {
  const polls = [poll('t1', [agent('s1')]), poll('t2', []), { at: 't3', ok: false, error: 'boom' }];
  assert.equal(isVanished(polls, 's1'), false);
  assert.equal(isVanished([...polls, poll('t4', [])], 's1'), true);
});

test('appendPoll and readPolls round-trip and skip a broken line', () => {
  const root = tempRoot();
  appendPoll(root, poll('t1', []));
  appendFileSync(join(root, 'registry', 'polls.jsonl'), 'broken\n');
  assert.equal(readPolls(root).length, 1);
});

test('display priority: ended, problem, permission, decision, uncertain, working, turn ended', () => {
  const base = { phase: 'working', phaseSince: 'a', lastEventAt: '2026-10-14T11:00:00Z', waiting: null, problem: null };
  assert.equal(displayState({ ...base, phase: 'ended', endedAt: 'x' }, { now: NOW }).label, 'ended');
  assert.equal(displayState({ ...base, problem: 'rate_limit' }, { now: NOW }).detail, 'rate_limit');
  assert.equal(displayState(base, { vanished: true, now: NOW }).detail, 'vanished');
  assert.equal(displayState({ ...base, waiting: { kind: 'permission', since: 's' } }, { now: NOW }).label, 'waiting for permission');
  assert.equal(displayState({ ...base, waiting: { kind: 'decision', since: 's', text: 'A?' } }, { now: NOW }).detail, 'A?');
  assert.equal(displayState(base, { entry: { status: 'busy' }, now: NOW }).label, 'uncertain');
  assert.equal(displayState({ ...base, lastEventAt: '2026-10-14T11:55:00Z' }, { entry: { status: 'busy' }, now: NOW }).label, 'working');
  const ended = displayState({ ...base, phase: 'turn-ended' }, { entry: { status: 'idle', state: 'blocked' }, now: NOW });
  assert.equal(ended.label, 'turn ended');
  assert.equal(ended.judge, true);
});

test('turn ended without the marker: "probably waiting for you" only after the hub judged a question', () => {
  const ended = { phase: 'turn-ended', phaseSince: '2026-10-14T11:50:00Z', lastEventAt: '2026-10-14T11:50:00Z', waiting: null, problem: null };
  const idle = { status: 'idle' };
  assert.equal(displayState(ended, { entry: idle, now: NOW, judgment: 'question' }).label, 'probably waiting for you');
  const other = displayState(ended, { entry: idle, now: NOW, judgment: 'other' });
  assert.equal(other.label, 'turn ended');
  assert.equal(other.judge, false);
  assert.equal(displayState(ended, { entry: idle, now: NOW, judgment: null }).judge, true);
  assert.equal(displayState({ ...ended, waiting: { kind: 'decision', since: 's', text: 'A?' } }, { entry: idle, now: NOW, judgment: 'question' }).label, 'waiting for decision');
});

test('only a session whose cwd equals the hub root is the hub; one in a sub-directory is not', () => {
  const root = tempRoot();
  writeLog(root, 'hub1', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: `${root}\\` })]);
  writeLog(root, 'inside', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: join(root, 'projects', 'app') })]);
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(readHubSessions(root).hub, ['hub1']);
  assert.deepEqual(overview.rows.map((row) => row.sessionId), ['inside']);
});

test('a /clear pair with the same title is linked; an untitled one is not', () => {
  const old = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'a', sessionTitle: 'probe-role' }), ev('SessionEnd', '2026-10-14T10:05:00Z', { sessionId: 'a', reason: 'clear' })]);
  const next = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:05:10Z', { sessionId: 'b', sessionTitle: 'probe-role' })]);
  const untitledOld = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'c' }), ev('SessionEnd', '2026-10-14T10:05:00Z', { sessionId: 'c', reason: 'clear' })]);
  linkContinuations([old, next, untitledOld]);
  assert.equal(old.continuedTo, 'b');
  assert.equal(next.continuedFrom, 'a');
  assert.equal(untitledOld.continuedTo, undefined);
});

test('project matching: segment boundaries, case, longest root, duplicate roots, git fallback', () => {
  assert.equal(isWithin('C:\\repo\\src', 'C:\\repo'), true);
  assert.equal(isWithin('C:\\repo-old', 'C:\\repo'), false);
  assert.equal(isWithin('c:\\REPO', 'C:\\repo'), true);
  const aliases = { outer: 'C:\\work', inner: 'C:\\work\\app' };
  assert.equal(projectFor('C:\\work\\app\\x', aliases, () => null), 'inner');
  assert.equal(projectFor('C:\\work\\other', aliases, () => null), 'outer');
  assert.deepEqual(aliasErrors({ a: 'C:\\x', b: 'c:\\X\\' }), ['aliases a, b share the root c:\\x']);
  assert.equal(projectFor('C:\\repos\\app\\.claude\\worktrees\\wt', {}, () => 'C:\\repos\\app\\.git'), 'app');
  assert.equal(projectFor('C:\\loose\\dir', {}, () => null), 'dir');
});

test('the overview excludes the hub, SessionEnd-only logs, /clear predecessors and day-old ends', () => {
  const root = tempRoot();
  writeLog(root, 'hub1', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: root })]);
  writeLog(root, 'ghost', [ev('SessionEnd', '2026-10-14T11:00:00Z', { reason: 'other' })]);
  writeLog(root, 'old', [ev('UserPromptSubmit', '2026-10-12T10:00:00Z'), ev('SessionEnd', '2026-10-12T11:00:00Z', { reason: 'other' })]);
  writeLog(root, 'work', [
    ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1', sessionTitle: 'probe-a' }),
    ev('Stop', '2026-10-14T11:51:00Z', { promptId: 'w1', marker: 'A czy B?', lastFile: 'work.last/x.md' }),
  ]);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { sandbox: 'C:\\repo' } }));
  appendPoll(root, poll('2026-10-14T11:59:00Z', [agent('work', 'idle', { state: 'blocked' })]));

  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(overview.rows.map((row) => row.sessionId), ['work']);
  const [row] = overview.rows;
  assert.equal(row.project, 'sandbox');
  assert.equal(row.state, 'waiting for decision');
  assert.equal(row.waitingFor, 'A czy B?');
  assert.equal(row.rawState, 'blocked');
  assert.deepEqual(readHubSessions(root).hub, ['hub1']);

  const text = renderOverview(overview);
  assert.match(text, /\| sandbox \| work probe-a \| waiting for decision \|/);
});

test('a broken event line and an unreadable projects.json do not break the overview', () => {
  const root = tempRoot();
  writeLog(root, 'work', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1' })]);
  appendFileSync(join(root, 'registry', 'work.events.jsonl'), '{"half a line\n');
  writeFileSync(join(root, 'projects.json'), '{ not json');
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(overview.rows.map((row) => row.state), ['working']);
  assert.match(renderOverview(overview), /projects.json: unreadable: /);
});

test('the overview reports a failed last poll and alias errors', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { a: 'C:\\x', b: 'C:\\x' } }));
  appendPoll(root, { at: 't', ok: false, error: 'spawn claude ENOENT' });
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  const text = renderOverview(overview);
  assert.match(text, /Last poll of claude agents --json failed: spawn claude ENOENT/);
  assert.match(text, /projects.json: aliases a, b share the root/);
});

test('a session newer than the last two polls is not vanished', () => {
  const polls = [poll('2026-10-14T10:00:00Z', []), poll('2026-10-14T10:01:00Z', [])];
  assert.equal(isVanished(polls, 's1', '2026-10-14T10:02:00Z'), false);
  assert.equal(isVanished(polls, 's1', '2026-10-14T09:00:00Z'), true);
});

test('a corrupt hub-sessions.json does not break the overview and is repaired', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'hub-sessions.json'), '{ broken');
  writeLog(root, 'hub1', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: root })]);
  writeLog(root, 'work', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1' })]);
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(overview.rows.map((row) => row.sessionId), ['work']);
  assert.match(renderOverview(overview), /hub-sessions.json: unreadable: /);
  assert.deepEqual(readHubSessions(root).hub, ['hub1']);
});
