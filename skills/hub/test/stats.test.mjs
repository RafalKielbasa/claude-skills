import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertStats, renderStats, BASELINE } from '../lib/stats.mjs';
import { recordHook, readEvents } from '../lib/registry.mjs';
import { tempRoot } from './helpers.mjs';

// Local-time stamps, as the command groups days and hours by the local clock.
const t = (day, h, m = 0, s = 0) => new Date(2026, 10, day, h, m, s).getTime();
const iso = (ms) => new Date(ms).toISOString();
const alert = (at, fields = {}) => ({ type: 'alert', at, code: 'a1', key: `${fields.sessionId ?? 's1'}|${at}`, sessionId: 's1', project: 'Baza wiedzy', name: 'n', kind: 'decision', mode: 'listening', ...fields });
const prompt = (sessionId, at) => ({ id: `${sessionId}${at}`, at: iso(at), event: 'UserPromptSubmit', sessionId });
const post = (sessionId, at) => ({ id: `${sessionId}${at}`, at: iso(at), event: 'PostToolUse', sessionId });
const session = (sessionId, events, extra = {}) => ({ sessionId, events, hub: false, dialog: false, ...extra });

test('totals, per active day and per hour with an alert', () => {
  const alerts = [
    alert(t(2, 10, 1)), alert(t(2, 10, 2)), alert(t(2, 10, 3)), alert(t(2, 10, 4)), alert(t(2, 10, 5)),
    alert(t(2, 11, 1)),
    alert(t(3, 9, 1)), alert(t(3, 9, 2)),
  ];
  const stats = alertStats({ alerts, sessions: [], since: null });
  assert.equal(stats.total, 8);
  assert.equal(stats.activeDays, 2);
  assert.equal(stats.perDay, 4);
  // hours hold 5, 1 and 2 alerts -> sorted 1, 2, 5
  assert.deepEqual(stats.perHour, { median: 2, p90: 5, max: 5 });
});

test('share per project, largest first', () => {
  const alerts = [alert(t(2, 10)), alert(t(2, 11), { project: 'app' }), alert(t(2, 12)), alert(t(2, 13))];
  const { shares } = alertStats({ alerts, sessions: [], since: null });
  assert.deepEqual(shares, [{ project: 'Baza wiedzy', count: 3, share: 0.75 }, { project: 'app', count: 1, share: 0.25 }]);
});

test('since drops earlier alerts and walks', () => {
  const alerts = [alert(t(1, 10)), alert(t(2, 10)), { type: 'walk', at: t(1, 12), waiting: 9 }, { type: 'walk', at: t(2, 12), waiting: 3 }];
  const stats = alertStats({ alerts, sessions: [], since: '2026-11-02' });
  assert.equal(stats.total, 1);
  assert.deepEqual(stats.walks, { count: 1, median: 3, max: 3 });
});

test('alerts naming the session he typed in last, and how many were answered within 5 minutes', () => {
  const sessions = [
    session('s1', [prompt('s1', t(2, 9, 55)), prompt('s1', t(2, 10, 4)), prompt('s1', t(2, 12, 30))]),
    session('s2', [prompt('s2', t(2, 9, 0)), prompt('s2', t(2, 11, 59))]),
    session('hub', [prompt('hub', t(2, 12, 0))], { hub: true }),
  ];
  const alerts = [
    alert(t(2, 10, 0), { sessionId: 's1' }), // last typed: s1 (9:55); its next prompt 10:04 is within 5 min
    alert(t(2, 12, 0, 30), { sessionId: 's1' }), // last typed: s2 (11:59); the hub prompt at 12:00 does not count
    alert(t(2, 12, 1), { sessionId: 's2' }), // last typed: s2; no later prompt, so typed last but not answered
  ];
  const stats = alertStats({ alerts, sessions, since: null });
  assert.deepEqual(stats.typedLast, { count: 2, share: 2 / 3, answeredIn5: 1 });
});

test('gates come from the events, so a gate answered in 30 s with no alert lands in under 1 min', () => {
  const stop = (at, marker = 'B?') => ({ id: `stop${at}`, at: iso(at), event: 'Stop', sessionId: 's1', marker });
  const s = session('s1', [
    stop(t(2, 10, 0)), prompt('s1', t(2, 10, 0, 30)), // 30 s, never alerted
    stop(t(2, 11, 0)), prompt('s1', t(2, 11, 3)), // 3 min
    stop(t(2, 12, 0)), prompt('s1', t(2, 12, 20)), // 20 min
    stop(t(2, 13, 0)), prompt('s1', t(2, 15, 0)), // 2 h
    stop(t(2, 16, 0), null), // a Stop without a marker is no gate
    stop(t(2, 17, 0)), // none
  ]);
  const hubSession = session('hub', [stop(t(2, 10, 0))], { hub: true });
  const forkSession = session('fork', [stop(t(2, 10, 0))], { dialog: true });
  const { gates } = alertStats({ alerts: [], sessions: [s, hubSession, forkSession], since: null });
  assert.equal(gates.total, 5);
  assert.deepEqual(gates.buckets, { under1: 0.2, to5: 0.2, to30: 0.2, over30: 0.2, none: 0.2 });
});

test('gates before since are left out', () => {
  const s = session('s1', [{ id: 'a', at: iso(t(1, 10)), event: 'Stop', sessionId: 's1', marker: 'B?' }, { id: 'b', at: iso(t(2, 10)), event: 'Stop', sessionId: 's1', marker: 'B?' }]);
  assert.equal(alertStats({ alerts: [], sessions: [s], since: '2026-11-02' }).gates.total, 1);
});

test('permissions come from permission_prompt notifications, to the next event of another kind', () => {
  const note = (at) => ({ id: `n${at}`, at: iso(at), event: 'Notification', kind: 'permission_prompt', sessionId: 's1' });
  const s = session('s1', [
    note(t(2, 10, 0)), post('s1', t(2, 10, 0, 40)), // 40 s, never alerted
    note(t(2, 11, 0)), note(t(2, 11, 1)), post('s1', t(2, 11, 4)), // the second notification does not end the first
    note(t(2, 12, 0)), post('s1', t(2, 12, 0, 40)),
    note(t(2, 18, 0)), // none
  ]);
  const { permissions } = alertStats({ alerts: [], sessions: [s], since: null });
  assert.equal(permissions.total, 4);
  assert.equal(permissions.none, 1);
  assert.deepEqual(permissions.buckets, { under1: 0.5, to5: 0.5, to30: 0, over30: 0 });
});

test('walks: items waiting at the start, median and max', () => {
  const alerts = [{ type: 'walk', at: t(2, 8), waiting: 4 }, { type: 'walk', at: t(3, 8), waiting: 10 }, { type: 'walk', at: t(4, 8), waiting: 7 }, { type: 'walk', at: t(5, 8), waiting: 0 }];
  assert.deepEqual(alertStats({ alerts, sessions: [], since: null }).walks, { count: 4, median: 5.5, max: 10 });
});

test('hub sessions and dialog forks are left out of every row', () => {
  const alerts = [alert(t(2, 10), { sessionId: 'hub' }), alert(t(2, 10, 1), { sessionId: 'fork' }), alert(t(2, 10, 2), { sessionId: 's1' })];
  const sessions = [session('hub', [], { hub: true }), session('fork', [], { dialog: true }), session('s1', [])];
  assert.equal(alertStats({ alerts, sessions, since: null }).total, 1);
});

test('empty input gives zeros, not NaN', () => {
  const stats = alertStats({ alerts: [], sessions: [], since: null });
  assert.equal(stats.total, 0);
  assert.equal(stats.perDay, 0);
  assert.equal(stats.gates.total, 0);
  assert.ok(!renderStats(stats).includes('NaN'));
});

test('renderStats names the baseline and its place, in Polish, with a row per measure of spec section 10', () => {
  const alerts = [alert(t(2, 10)), alert(t(2, 11), { kind: 'permission' })];
  const text = renderStats(alertStats({ alerts, sessions: [], since: '2026-11-01' }));
  assert.match(text, /2026-11-01/);
  assert.match(text, /2026-11-05-hub-approvals-voice-alerts-design\.md/);
  assert.match(text, /§10/);
  for (const label of ['Alerty łącznie', 'na godzinę', 'Baza wiedzy', 'wpisał ostatnio', 'Decyzje', 'Uprawnienia', 'Przeglądy']) {
    assert.ok(text.includes(label), label);
  }
  assert.ok(text.includes(BASELINE.total));
});

test('an event with an unreadable time and a walk with a non-numeric count are ignored, not NaN', () => {
  const s = session('s1', [
    { id: 'x', at: 'garbage', event: 'UserPromptSubmit', sessionId: 's1' },
    { id: 'y', at: undefined, event: 'PostToolUse', sessionId: 's1' },
    { id: 'g', at: iso(t(2, 10)), event: 'Stop', sessionId: 's1', marker: 'B?' },
    prompt('s1', t(2, 10, 0, 20)),
  ]);
  const alerts = [{ type: 'walk', at: t(2, 8), waiting: 'many' }, { type: 'walk', at: t(2, 9), waiting: 4 }, { type: 'walk', at: t(2, 9, 1) }];
  const stats = alertStats({ alerts, sessions: [s], since: null });
  assert.deepEqual(stats.walks, { count: 1, median: 4, max: 4 });
  assert.deepEqual(stats.gates.buckets, { under1: 1, to5: 0, to30: 0, over30: 0, none: 0 });
  assert.ok(!renderStats(stats).includes('NaN'));
});

test('gates and permissions from events written by the real recordHook', () => {
  const root = tempRoot();
  const hook = (input, at, id) => recordHook(root, { session_id: 'real', cwd: 'C:\repo', prompt_id: 'p', ...input }, { id, at });
  hook({ hook_event_name: 'Stop', last_assistant_message: 'Pytanie.\n⏸ Czeka na decyzję: wariant A czy B?' }, iso(t(2, 10)), 'e1');
  hook({ hook_event_name: 'UserPromptSubmit', prompt: 'A' }, iso(t(2, 10, 0, 30)), 'e2');
  hook({ hook_event_name: 'Stop', last_assistant_message: 'Gotowe.' }, iso(t(2, 11)), 'e3'); // no marker, no gate
  hook({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, iso(t(2, 12)), 'e4');
  hook({ hook_event_name: 'Notification', notification_type: 'idle_prompt' }, iso(t(2, 12, 0, 5)), 'e5'); // not recorded
  hook({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { description: 'x' } }, iso(t(2, 12, 0, 20)), 'e6');
  const sessions = [session('real', readEvents(root, 'real').events)];
  const stats = alertStats({ alerts: [], sessions, since: null });
  assert.equal(stats.gates.total, 1);
  assert.equal(stats.gates.buckets.under1, 1);
  assert.equal(stats.permissions.total, 1);
  assert.equal(stats.permissions.buckets.under1, 1);
});
