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
