import { matchGlob, globSpecificity } from './glob.mjs';
import { buildParts } from './parts.mjs';
import { DEFAULT_SETTINGS } from './config.mjs';

function wakes(axis, files) {
  if (axis.when === 'always') return true;
  return files.some((file) => axis.when.some((pattern) => matchGlob(pattern, file.path)));
}

function specificityFor(axis, path) {
  if (axis.when === 'always') return 0;
  let best = 0;
  for (const pattern of axis.when) {
    if (matchGlob(pattern, path)) best = Math.max(best, globSpecificity(pattern));
  }
  return best;
}

function filesFor(axis, files) {
  return axis.when === 'always'
    ? [...files]
    : files.filter((file) => axis.when.some((pattern) => matchGlob(pattern, file.path)));
}

// Specificity is taken across every axis sharing the slot. Scoring a file
// against only the first member would give a file matched by a later member's
// glob a specificity of 0 and understate it.
function bestSpecificity(axes, path) {
  let best = 0;
  for (const axis of axes) best = Math.max(best, specificityFor(axis, path));
  return best;
}

// Ranking keys, in the order spec §7 step 3 fixes: churn descending, then how
// specifically the axis glob matched, then size ascending so truncation gives
// up the files most expensive to read. Path is the final tiebreak, only so the
// result is stable across runs.
function rank(axes, files) {
  return [...files].sort((a, b) => {
    // Carried files fill whatever room is left after this run's own changes.
    // Ranking them first was the opposite of right: a backlog from an earlier
    // truncation would push out the very files the user just edited, and the
    // report would still claim the axis was covered.
    if (Boolean(a.carried) !== Boolean(b.carried)) return a.carried ? 1 : -1;
    const churn = (b.added + b.removed) - (a.added + a.removed);
    if (churn !== 0) return churn;
    const spec = bestSpecificity(axes, b.path) - bestSpecificity(axes, a.path);
    if (spec !== 0) return spec;
    if (a.size !== b.size) return a.size - b.size;
    // Code-unit comparison, not `localeCompare`: `lib/target.mjs`'s `full`-mode
    // cursor compares paths the same primitive way, and when churn and
    // specificity are tied — the common case for a `full` audit, where every
    // file has churn 0 — this tiebreak is what actually decides which files
    // are kept vs. carried. A different ordering here than the cursor uses
    // would misalign which files are considered "already past the cursor".
    return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
  });
}

// Order matters and is the whole point: wake, assign, drop empties, only then
// spend slots. An axis that would have received no file must not consume one.
export function selectAxes({ axes, files, settings, state, slotsOverride = null, budgetMode = 'fixed', unattended = false, hasIssue = false }) {
  const auto = budgetMode === 'auto';
  // Auto mode has no slot count; its bound is `max_agents` (spec §5.3).
  const slots = auto ? null : slotsOverride ?? settings.budget.slots;
  const configuredCap = settings.budget.max_files_per_axis;
  // `slice(0, null)` is `slice(0, 0)`, so a misconfigured cap would hand every
  // axis an empty file list and select nothing at all — a silent no-op review.
  // Fail open instead: reviewing everything costs visibly, reviewing nothing
  // costs invisibly.
  const maxFilesDefault = Number.isInteger(configuredCap) && configuredCap > 0 ? configuredCap : Infinity;

  const skippedOnTouch = [];
  const skippedNoIssue = [];
  const emptyAfterAssignment = [];
  const candidates = [];

  // No truncation here. A file is only given up once the slot that will review
  // it is known, because a grouped slot's cap can be larger than a narrow
  // member's and would have had room for the file that member dropped.
  for (const axis of axes) {
    if (!wakes(axis, files)) { skippedOnTouch.push(axis.id); continue; }
    // Checked after `wakes`: an axis no file touches is asleep for that reason,
    // whatever else it needs. Named separately so the report can say the task
    // was never checked instead of listing the axis as untouched.
    if ((axis.needs ?? []).includes('issue') && !hasIssue) { skippedNoIssue.push(axis.id); continue; }
    const mine = filesFor(axis, files);
    if (mine.length === 0) { emptyAfterAssignment.push(axis.id); continue; }
    candidates.push({ axis, files: mine });
  }

  // Grouped axes collapse into a single slot entry, keeping every checklist.
  const units = [];
  const byGroup = new Map();
  for (const candidate of candidates) {
    const group = candidate.axis.group;
    if (group === null) { units.push({ group: null, members: [candidate] }); continue; }
    if (!byGroup.has(group)) { const unit = { group, members: [] }; byGroup.set(group, unit); units.push(unit); }
    byGroup.get(group).members.push(candidate);
  }

  const rankOf = (unit) => (unit.members.some((m) => m.axis.rank === 'always') ? 0 : 1);
  const cursor = state.axis_cursor ?? [];
  const cursorIndex = (unit) => {
    const at = cursor.indexOf(unit.members[0].axis.id);
    return at === -1 ? Number.MAX_SAFE_INTEGER : at;
  };
  const ordered = [...units].sort((a, b) => {
    if (rankOf(a) !== rankOf(b)) return rankOf(a) - rankOf(b);
    if (cursorIndex(a) !== cursorIndex(b)) return cursorIndex(a) - cursorIndex(b);
    return units.indexOf(a) - units.indexOf(b);
  });

  // The ceiling is the budget guarantee, so unlike the file caps it fails
  // closed: a misconfigured value means the default ceiling, never none.
  const maxAgents = positiveInteger(settings.budget.max_agents)
    ? settings.budget.max_agents
    : DEFAULT_SETTINGS.budget.max_agents;
  const plan = auto
    ? planParts(ordered, settings.budget, maxAgents)
    : planSlots(ordered, slots, maxFilesDefault);
  const { taken, left, selected } = plan;

  const takenIds = taken.flatMap((u) => u.members.map((m) => m.axis.id));
  const leftIds = left.flatMap((u) => u.members.map((m) => m.axis.id));
  // An axis that slept this run keeps the position it had earned. Dropping it
  // from the cursor would send it to the back on the run it next wakes —
  // behind an axis that was just served — which inverts the fairness the
  // rotation exists to provide.
  const participated = new Set([...takenIds, ...leftIds]);
  // `known` prunes ids of axes deleted from the configuration. Without it the
  // cursor grows without bound: a deleted axis can never become a candidate, so
  // it can never be "participating", so it would be carried forward forever.
  const known = new Set(axes.map((axis) => axis.id));
  const dormant = (state.axis_cursor ?? []).filter((id) => known.has(id) && !participated.has(id));

  const partCount = selected.reduce((sum, entry) => sum + entry.parts.length, 0);
  const agents = selected.length === 0 ? 0 : 1 + 2 * partCount;
  const confirmAbove = settings.budget.confirm_above;

  return {
    selected,
    skippedOnTouch,
    skippedNoIssue,
    emptyAfterAssignment,
    deferred: leftIds,
    slots,
    agents,
    truncated: selected.some((entry) => entry.skippedFiles.length > 0),
    nextAxisCursor: [...leftIds, ...dormant, ...takenIds],
    budgetMode: auto ? 'auto' : 'fixed',
    partCount,
    confirmAbove,
    maxAgents,
    partSizeFloor: plan.partSizeFloor,
    // A fixed budget was already sized by the user; only an auto-sized run
    // over the threshold asks, and an unattended run has no one to ask.
    needsConfirmation: auto && agents > confirmAbove && !unattended,
  };
}

const positiveInteger = (n) => Number.isInteger(n) && n > 0;

// A grouped entry reviews the union of its members' files, not the first
// member's, ranked once across all of them.
function unionOf(unit) {
  const memberAxes = unit.members.map((m) => m.axis);
  const byPath = new Map();
  for (const member of unit.members) for (const file of member.files) byPath.set(file.path, file);
  return {
    axisId: memberAxes.map((axis) => axis.id).join('+'),
    group: unit.group,
    axes: memberAxes,
    union: rank(memberAxes, [...byPath.values()]),
  };
}

// Fixed budget: the first `slots` units, each truncated once — here — against
// the entry's own cap, each reviewed as a single part.
function planSlots(ordered, slots, maxFilesDefault) {
  const taken = ordered.slice(0, slots);
  const left = ordered.slice(slots);
  const selected = taken.map((unit) => {
    const { union, ...entry } = unionOf(unit);
    const capOf = (axis) => (positiveInteger(axis.max_files) ? axis.max_files : maxFilesDefault);
    const cap = Math.max(...entry.axes.map(capOf));
    const kept = union.slice(0, cap);
    const truncatedFrom = union.length > kept.length ? union.length : null;
    // Every kept file carries the slot's truncation count, so a consumer
    // reading one file's metadata cannot conclude the slot was complete.
    const files = kept.map((file) => ({ ...file, truncatedFrom }));
    return {
      ...entry,
      files,
      skippedFiles: union.slice(cap).map((file) => file.path).sort(),
      parts: [{ label: entry.axisId, index: 1, of: 1, files }],
      partSize: null,
    };
  });
  return { taken, left, selected, partSizeFloor: null };
}

// Auto budget (spec §5.2–§5.3): every unit, no truncation, files split into
// parts. Over `max_agents`, parts grow under a rising global floor before any
// unit is deferred, so coverage is traded for depth only as a last resort.
function planParts(ordered, budget, ceiling) {
  // A misconfigured part size fails open, as `max_files_per_axis` does: one
  // part per entry rather than a division by null. The ceiling never does.
  const baseSize = positiveInteger(budget.max_files_per_part) ? budget.max_files_per_part : Infinity;

  // Units beyond what one part each can afford are deferred in `ordered`
  // order, exactly where fixed mode would cut with `slots = room`. Cutting
  // before raising the floor keeps the floor sized to the files actually
  // reviewed; the selection is the same either way, since an overflowing
  // run leaves every taken entry at one part.
  const room = Math.floor((ceiling - 1) / 2);
  const taken = ordered.slice(0, room);
  const left = ordered.slice(room);

  const plans = taken.map((unit) => {
    const entry = unionOf(unit);
    // The largest member size wins, mirroring how `max_files` picks a group's cap.
    const own = entry.axes.map((axis) => axis.max_files_per_part).filter(positiveInteger);
    return { ...entry, ownSize: own.length > 0 ? Math.max(...own) : baseSize };
  });
  const sizeAt = (p, floor) => Math.max(p.ownSize, floor ?? 0);
  const partsAt = (p, floor) => Math.max(1, Math.ceil(p.union.length / sizeAt(p, floor)));
  const countAt = (floor) => plans.reduce((sum, p) => sum + partsAt(p, floor), 0);

  let floor = null;
  while (1 + 2 * countAt(floor) > ceiling && plans.some((p) => partsAt(p, floor) > 1)) {
    floor = floor === null ? baseSize + 1 : floor + 1;
  }

  const selected = plans.map(({ union, ownSize, ...entry }) => {
    const partSize = sizeAt({ ownSize }, floor);
    const files = union.map((file) => ({ ...file, truncatedFrom: null }));
    return { ...entry, files, skippedFiles: [], parts: buildParts(entry.axisId, files, partSize), partSize };
  });
  return { taken, left, selected, partSizeFloor: floor };
}

// Fixed modes are the ones whose size is chosen by a person (`since`, `full`) or
// explicitly by `--budget fixed`; the rest size themselves from the target.
export function budgetModeFor(mode, budgetFlag) {
  return budgetFlag === 'fixed' || mode === 'since' || mode === 'full' ? 'fixed' : 'auto';
}

// Same key set as a real selection, so a consumer never branches on an empty
// target; the keys are pinned against `selectAxes` by a test.
export function emptySelection(settings, budgetMode) {
  const maxAgents = positiveInteger(settings.budget.max_agents)
    ? settings.budget.max_agents
    : DEFAULT_SETTINGS.budget.max_agents;
  return {
    selected: [],
    skippedOnTouch: [],
    skippedNoIssue: [],
    emptyAfterAssignment: [],
    deferred: [],
    slots: budgetMode === 'fixed' ? settings.budget.slots : null,
    agents: 0,
    truncated: false,
    nextAxisCursor: [],
    budgetMode,
    partCount: 0,
    confirmAbove: settings.budget.confirm_above,
    maxAgents,
    partSizeFloor: null,
    needsConfirmation: false,
  };
}
