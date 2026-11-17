import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectAxes } from '../lib/axes.mjs';
import { DEFAULT_SETTINGS } from '../lib/config.mjs';

const axis = (id, when, rank = 'rotate', extra = {}) => ({
  id, when, rank, group: null, severity_default: 'suggestion',
  max_files: null, tools: [], heading: id, checklist: `- check ${id}`, ...extra,
});

const file = (path, added = 1, size = 100) => ({ path, added, removed: 0, size });

const settings = (over = {}) => ({ ...DEFAULT_SETTINGS, ...over, budget: { ...DEFAULT_SETTINGS.budget, ...over.budget } });
const state = (over = {}) => ({ axis_cursor: [], ...over });

test('an axis no file wakes is skipped and costs nothing', () => {
  const out = selectAxes({
    axes: [axis('api', ['apps/api/**']), axis('web', ['apps/web/**'])],
    files: [file('apps/web/page.tsx')],
    settings: settings(), state: state(),
  });
  assert.deepEqual(out.selected.map((s) => s.axisId), ['web']);
  assert.deepEqual(out.skippedOnTouch, ['api']);
  assert.equal(out.agents, 3);
});

test('the agent count is 1 + 2 per selected axis and never exceeds the slot budget', () => {
  const axes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => axis(id, 'always'));
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings(), state: state() });
  assert.equal(out.selected.length, 5);
  assert.equal(out.agents, 11);
  assert.equal(out.deferred.length, 2);
});

test('always-ranked axes claim slots before rotate-ranked ones', () => {
  const axes = [axis('r1', 'always'), axis('a1', 'always', 'always'), axis('r2', 'always')];
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings({ budget: { slots: 2 } }), state: state() });
  assert.equal(out.selected[0].axisId, 'a1');
  assert.equal(out.selected.length, 2);
});

test('the rotation cursor gives a deferred axis first claim next run', () => {
  const axes = [axis('a', 'always'), axis('b', 'always'), axis('c', 'always')];
  const first = selectAxes({ axes, files: [file('x.ts')], settings: settings({ budget: { slots: 1 } }), state: state() });
  assert.deepEqual(first.selected.map((s) => s.axisId), ['a']);
  const second = selectAxes({
    axes, files: [file('x.ts')], settings: settings({ budget: { slots: 1 } }),
    state: state({ axis_cursor: first.nextAxisCursor }),
  });
  assert.deepEqual(second.selected.map((s) => s.axisId), ['b']);
});

test('axes sharing a group share one slot and review the union of their files', () => {
  const axes = [
    axis('q1', ['api/**'], 'rotate', { group: 'quality' }),
    axis('q2', ['web/**'], 'rotate', { group: 'quality' }),
  ];
  const out = selectAxes({
    axes, files: [file('api/a.ts'), file('web/b.tsx')],
    settings: settings({ budget: { slots: 1 } }), state: state(),
  });
  assert.equal(out.selected.length, 1);
  assert.equal(out.selected[0].group, 'quality');
  assert.equal(out.agents, 3);
  assert.deepEqual(out.selected[0].files.map((f) => f.path).sort(), ['api/a.ts', 'web/b.tsx']);
  assert.deepEqual(out.selected[0].axes.map((a) => a.id), ['q1', 'q2'], 'both checklists travel with the slot');
});

test('files are ranked by churn first, and truncation is reported', () => {
  const axes = [axis('api', ['apps/api/**', '**'])];
  const files = [file('apps/api/a.ts', 1), file('apps/api/b.ts', 90), file('apps/api/c.ts', 40)];
  const out = selectAxes({
    axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 2 } }), state: state(),
  });
  assert.deepEqual(out.selected[0].files.map((f) => f.path), ['apps/api/b.ts', 'apps/api/c.ts']);
  assert.equal(out.selected[0].files[0].truncatedFrom, 3);
  assert.deepEqual(out.selected[0].skippedFiles, ['apps/api/a.ts']);
  assert.equal(out.truncated, true);
});

// Previously this asserted the carried file outranked fresh churn — exactly
// backwards. A backlog from an earlier truncation must not push out the file
// the user just changed this run, or the report would claim the axis was
// covered while missing the one file that actually motivated the review.
test('a file carried over from a truncated run does not outrank this run\'s own changes', () => {
  const axes = [axis('api', ['apps/api/**'])];
  const files = [
    file('apps/api/hot.ts', 500),
    { ...file('apps/api/carried.ts', 0), carried: true },
  ];
  const out = selectAxes({
    axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 1 } }), state: state(),
  });
  assert.deepEqual(out.selected[0].files.map((f) => f.path), ['apps/api/hot.ts']);
});

// The regression this guards: carried files ranking first used to displace a
// run's own genuinely-changed files entirely, so a working tree with real
// edits could end up reviewing an unmodified backlog instead of the edits.
test('carried files fill only the room left after this run\'s own changes', () => {
  const axes = [axis('api', ['apps/api/**'])];
  const files = [
    file('apps/api/changed1.ts', 50),
    file('apps/api/changed2.ts', 30),
    { ...file('apps/api/carried1.ts', 0), carried: true },
    { ...file('apps/api/carried2.ts', 0), carried: true },
  ];
  const out = selectAxes({
    axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 2 } }), state: state(),
  });
  assert.deepEqual(out.selected[0].files.map((f) => f.path), ['apps/api/changed1.ts', 'apps/api/changed2.ts']);
  assert.deepEqual(out.selected[0].skippedFiles, ['apps/api/carried1.ts', 'apps/api/carried2.ts']);
});

test('size breaks a tie in churn and specificity, smallest first', () => {
  const axes = [axis('api', ['apps/api/**'])];
  const files = [file('apps/api/big.ts', 5, 9000), file('apps/api/small.ts', 5, 40)];
  const out = selectAxes({
    axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 1 } }), state: state(),
  });
  assert.deepEqual(out.selected[0].files.map((f) => f.path), ['apps/api/small.ts']);
});

test('an axis whose files all fall outside its globs is dropped, not merely empty', () => {
  const out = selectAxes({
    axes: [axis('api', ['apps/api/**'])], files: [file('apps/web/x.tsx')],
    settings: settings(), state: state(),
  });
  assert.deepEqual(out.selected, []);
  assert.equal(out.agents, 0, 'no axis means no run at all');
});

test('slotsOverride raises the budget only when passed explicitly', () => {
  const axes = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => axis(id, 'always'));
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings(), state: state(), slotsOverride: 6 });
  assert.equal(out.selected.length, 6);
  assert.equal(out.agents, 13);
});

// A narrow member must not throw away files the shared slot had room for.
test('a grouped slot truncates once, against its own cap', () => {
  const axes = [
    axis('narrow', ['api/**'], 'rotate', { group: 'q', max_files: 1 }),
    axis('wide', ['web/**'], 'rotate', { group: 'q', max_files: 40 }),
  ];
  const files = [file('api/a.ts', 10), file('api/b.ts', 5), file('api/c.ts', 1), file('web/d.tsx', 7)];
  const out = selectAxes({ axes, files, settings: settings(), state: state() });
  assert.equal(out.selected.length, 1);
  assert.equal(out.selected[0].files.length, 4, 'the slot cap is 40, so nothing is given up');
  assert.deepEqual(out.selected[0].skippedFiles, []);
  assert.equal(out.truncated, false);
});

test('when the union itself overflows, every kept file reports the truncation', () => {
  const axes = [
    axis('one', ['a/**'], 'rotate', { group: 'q' }),
    axis('two', ['b/**'], 'rotate', { group: 'q' }),
  ];
  const files = [
    ...Array.from({ length: 25 }, (_, i) => file(`a/${i}.ts`, 30 - i)),
    ...Array.from({ length: 25 }, (_, i) => file(`b/${i}.ts`, 5)),
  ];
  const out = selectAxes({ axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 40 } }), state: state() });
  assert.equal(out.selected[0].files.length, 40);
  assert.equal(out.selected[0].skippedFiles.length, 10);
  assert.ok(out.selected[0].files.every((f) => f.truncatedFrom === 50),
    'a consumer reading any one file must not conclude the slot was complete');
  assert.equal(out.truncated, true);
});

// The failure this guards against is subtle: an axis that sleeps for one run
// used to lose its queue position and come back behind an axis just served.
test('an axis that sleeps for a run is not overtaken by one that was just served', () => {
  const all = [axis('a', ['a/**']), axis('b', ['b/**']), axis('c', ['c/**'])];
  const one = settings({ budget: { slots: 1 } });
  const everything = [file('a/1.ts'), file('b/1.ts'), file('c/1.ts')];

  const run1 = selectAxes({ axes: all, files: everything, settings: one, state: state() });
  assert.deepEqual(run1.selected.map((s) => s.axisId), ['a']);

  // Only b is touched; a and c sleep and must keep the claim they earned.
  const run2 = selectAxes({ axes: all, files: [file('b/1.ts')], settings: one, state: state({ axis_cursor: run1.nextAxisCursor }) });
  assert.deepEqual(run2.selected.map((s) => s.axisId), ['b']);

  const run3 = selectAxes({ axes: all, files: everything, settings: one, state: state({ axis_cursor: run2.nextAxisCursor }) });
  assert.notEqual(run3.selected[0].axisId, 'b', 'the axis served last run must not be served again first');
  assert.deepEqual(run3.selected.map((s) => s.axisId), ['c']);
});

// The cursor must not become a graveyard of ids for axes that no longer exist.
test('an axis deleted from the configuration is pruned from the cursor', () => {
  const remaining = [axis('a', 'always'), axis('b', 'always')];
  const out = selectAxes({
    axes: remaining, files: [file('x.ts')],
    settings: settings({ budget: { slots: 1 } }),
    state: state({ axis_cursor: ['gone', 'b', 'a'] }),
  });
  assert.equal(out.nextAxisCursor.includes('gone'), false);
  assert.deepEqual([...out.nextAxisCursor].sort(), ['a', 'b']);
});

test('a nonsensical file cap reviews everything rather than silently nothing', () => {
  const out = selectAxes({
    axes: [axis('a', 'always')], files: [file('x.ts'), file('y.ts')],
    settings: settings({ budget: { slots: 5, max_files_per_axis: null } }), state: state(),
  });
  assert.equal(out.selected.length, 1);
  assert.equal(out.selected[0].files.length, 2);
});

test('no configuration of axes and files can exceed the budget', () => {
  for (let count = 1; count <= 40; count += 1) {
    const axes = Array.from({ length: count }, (_, i) => axis(`ax${i}`, 'always'));
    const files = Array.from({ length: count }, (_, i) => file(`f${i}.ts`, i));
    for (const slots of [1, 3, 5, 8]) {
      const out = selectAxes({ axes, files, settings: settings({ budget: { slots } }), state: state() });
      assert.ok(out.selected.length <= slots, `selected ${out.selected.length} with ${slots} slots`);
      assert.equal(out.agents, out.selected.length === 0 ? 0 : 1 + 2 * out.selected.length);
    }
  }
});

// --- auto budget: parts and the ceiling ---

const many = (n, prefix = 'f') => Array.from({ length: n }, (_, i) => file(`${prefix}${i}.ts`));
const seven = () => ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => axis(id, 'always'));
const allFiles = (entry) => entry.parts.flatMap((p) => p.files.map((f) => f.path)).sort();

test('fixed mode gives each entry one part labelled by its axisId', () => {
  const out = selectAxes({ axes: seven(), files: [file('x.ts')], settings: settings(), state: state() });
  assert.equal(out.budgetMode, 'fixed');
  assert.equal(out.partCount, 5);
  assert.equal(out.agents, 11);
  for (const entry of out.selected) {
    assert.equal(entry.parts.length, 1);
    assert.equal(entry.parts[0].label, entry.axisId);
    assert.equal(entry.partSize, null);
  }
  assert.equal(out.partSizeFloor, null);
  assert.equal(out.needsConfirmation, false);
});

test('auto mode takes every woken unit', () => {
  const out = selectAxes({ axes: seven(), files: [file('x.ts')], settings: settings(), state: state(), budgetMode: 'auto' });
  assert.equal(out.budgetMode, 'auto');
  assert.equal(out.selected.length, 7);
  assert.deepEqual(out.deferred, []);
  assert.equal(out.agents, 15);
  assert.equal(out.slots, null);
});

test('an auto run under the part size has one part per entry labelled by axisId', () => {
  const axes = ['a', 'b', 'c'].map((id) => axis(id, 'always'));
  const out = selectAxes({ axes, files: many(12), settings: settings(), state: state(), budgetMode: 'auto' });
  assert.equal(out.partCount, 3);
  assert.deepEqual(out.selected.map((e) => e.parts.map((p) => p.label)), [['a'], ['b'], ['c']]);
});

test('auto mode does not truncate', () => {
  const out = selectAxes({
    axes: [axis('a', 'always', 'rotate', { max_files: 5 })], files: many(30),
    settings: settings({ budget: { max_files_per_axis: 5 } }), state: state(), budgetMode: 'auto',
  });
  assert.equal(out.selected[0].files.length, 30);
  assert.deepEqual(out.selected[0].skippedFiles, []);
  assert.equal(out.truncated, false);
  assert.ok(out.selected[0].files.every((f) => f.truncatedFrom === null));
});

test('a large axis is split by max_files_per_part', () => {
  const out = selectAxes({ axes: [axis('a', 'always')], files: many(38), settings: settings(), state: state(), budgetMode: 'auto' });
  const [entry] = out.selected;
  assert.equal(entry.parts.length, 4);
  assert.equal(entry.partSize, 12);
  assert.equal(out.agents, 9);
  assert.deepEqual(entry.parts.map((p) => p.label), ['a#1', 'a#2', 'a#3', 'a#4']);
  assert.deepEqual(allFiles(entry), entry.files.map((f) => f.path).sort(), 'parts partition the entry files');
});

test('a per-axis max_files_per_part wins, largest member in a group', () => {
  const single = selectAxes({
    axes: [axis('secrets', 'always', 'rotate', { max_files_per_part: 40 })], files: many(38),
    settings: settings(), state: state(), budgetMode: 'auto',
  });
  assert.equal(single.selected[0].parts.length, 1);
  assert.equal(single.selected[0].partSize, 40);

  const grouped = selectAxes({
    axes: [
      axis('narrow', 'always', 'rotate', { group: 'g', max_files_per_part: 12 }),
      axis('wide', 'always', 'rotate', { group: 'g', max_files_per_part: 40 }),
    ],
    files: many(38), settings: settings(), state: state(), budgetMode: 'auto',
  });
  assert.equal(grouped.selected[0].partSize, 40);
  assert.equal(grouped.selected[0].parts.length, 1);
});

test('the ceiling raises a floor before deferring', () => {
  const axes = ['a', 'b', 'c'].map((id) => axis(id, 'always'));
  const out = selectAxes({
    axes, files: many(38), settings: settings({ budget: { max_agents: 13 } }), state: state(), budgetMode: 'auto',
  });
  assert.deepEqual(out.deferred, []);
  assert.equal(out.selected.length, 3);
  assert.ok(out.partSizeFloor > 12, `floor ${out.partSizeFloor}`);
  assert.ok(out.agents <= 13, `agents ${out.agents}`);
  for (const entry of out.selected) {
    assert.equal(entry.files.length, 38);
    assert.deepEqual(allFiles(entry), entry.files.map((f) => f.path).sort());
  }
});

test('the floor leaves a larger per-axis size alone', () => {
  const out = selectAxes({
    axes: [axis('A', ['a/**']), axis('B', ['b/**'], 'rotate', { max_files_per_part: 40 })],
    files: [...many(38, 'a/'), ...many(80, 'b/')],
    settings: settings({ budget: { max_agents: 9 } }), state: state(), budgetMode: 'auto',
  });
  const b = out.selected.find((e) => e.axisId === 'B');
  assert.equal(b.partSize, 40);
  assert.ok(out.partSizeFloor !== null && out.partSizeFloor < 40, `floor ${out.partSizeFloor}`);
  assert.ok(out.agents <= 9, `agents ${out.agents}`);
  assert.deepEqual(out.deferred, []);
});

test('ceiling overflow with one part per entry defers the lowest-ranked units', () => {
  const axes = [
    axis('r1', 'always'), axis('r2', 'always'), axis('a1', 'always', 'always'),
    axis('r3', 'always'), axis('a2', 'always', 'always'), axis('r4', 'always'),
  ];
  const out = selectAxes({
    axes, files: [file('x.ts')], settings: settings({ budget: { max_agents: 7 } }), state: state(), budgetMode: 'auto',
  });
  assert.equal(out.selected.length, 3);
  const ids = out.selected.map((e) => e.axisId);
  assert.ok(ids.includes('a1') && ids.includes('a2'), `selected ${ids}`);
  assert.equal(out.deferred.length, 3);
  assert.equal(out.agents, 7);
});

test('ceiling overflow follows the rotation cursor exactly like fixed mode', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
  const axes = ids.map((id) => axis(id, [`${id}/**`]));
  const files = ids.map((id) => file(`${id}/1.ts`));
  const cursor = ['d', 'e', 'f', 'a', 'b', 'c'];
  const auto = selectAxes({
    axes, files, settings: settings({ budget: { max_agents: 7 } }), state: state({ axis_cursor: cursor }), budgetMode: 'auto',
  });
  const fixed = selectAxes({
    axes, files, settings: settings({ budget: { slots: 3 } }), state: state({ axis_cursor: cursor }),
  });
  assert.deepEqual(auto.selected.map((s) => s.axisId), ['d', 'e', 'f']);
  assert.deepEqual(auto.selected.map((s) => s.axisId), fixed.selected.map((s) => s.axisId));
  assert.deepEqual(auto.deferred, fixed.deferred);
  assert.deepEqual(auto.nextAxisCursor, fixed.nextAxisCursor);
});

test('needsConfirmation follows confirm_above and unattended', () => {
  const s = settings({ budget: { confirm_above: 11 } });
  const base = { axes: seven(), files: [file('x.ts')], settings: s, state: state() };
  const auto = selectAxes({ ...base, budgetMode: 'auto' });
  assert.equal(auto.confirmAbove, 11);
  assert.equal(auto.maxAgents, 41);
  assert.equal(auto.needsConfirmation, true);
  assert.equal(selectAxes({ ...base, budgetMode: 'auto', unattended: true }).needsConfirmation, false);
  assert.equal(selectAxes(base).needsConfirmation, false);
});

test('no auto configuration of axes and files can exceed max_agents', () => {
  for (const maxAgents of [3, 7, 13, 41]) {
    for (let count = 1; count <= 25; count += 4) {
      const axes = Array.from({ length: count }, (_, i) => axis(`ax${i}`, 'always'));
      const out = selectAxes({
        axes, files: many(60), settings: settings({ budget: { max_agents: maxAgents } }), state: state(), budgetMode: 'auto',
      });
      assert.ok(out.agents <= maxAgents, `${out.agents} agents with max ${maxAgents} and ${count} axes`);
      assert.equal(out.agents, 1 + 2 * out.partCount);
      assert.equal(out.selected.length + out.deferred.length, count);
    }
  }
});
