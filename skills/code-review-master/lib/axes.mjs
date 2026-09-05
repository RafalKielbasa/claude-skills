import { matchGlob, globSpecificity } from './glob.mjs';

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
export function selectAxes({ axes, files, settings, state, slotsOverride = null }) {
  const slots = slotsOverride ?? settings.budget.slots;
  const configuredCap = settings.budget.max_files_per_axis;
  // `slice(0, null)` is `slice(0, 0)`, so a misconfigured cap would hand every
  // axis an empty file list and select nothing at all — a silent no-op review.
  // Fail open instead: reviewing everything costs visibly, reviewing nothing
  // costs invisibly.
  const maxFilesDefault = Number.isInteger(configuredCap) && configuredCap > 0 ? configuredCap : Infinity;

  const skippedOnTouch = [];
  const emptyAfterAssignment = [];
  const candidates = [];

  // No truncation here. A file is only given up once the slot that will review
  // it is known, because a grouped slot's cap can be larger than a narrow
  // member's and would have had room for the file that member dropped.
  for (const axis of axes) {
    if (!wakes(axis, files)) { skippedOnTouch.push(axis.id); continue; }
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

  const taken = ordered.slice(0, slots);
  const left = ordered.slice(slots);

  // A grouped slot reviews the union of its members' files, not the first
  // member's, and it is truncated once — here — against the slot's own cap.
  const selected = taken.map((unit) => {
    const memberAxes = unit.members.map((m) => m.axis);
    const capOf = (axis) => (Number.isInteger(axis.max_files) && axis.max_files > 0 ? axis.max_files : maxFilesDefault);
    const cap = Math.max(...memberAxes.map(capOf));
    const byPath = new Map();
    for (const member of unit.members) for (const file of member.files) byPath.set(file.path, file);
    const union = rank(memberAxes, [...byPath.values()]);
    const kept = union.slice(0, cap);
    const truncatedFrom = union.length > kept.length ? union.length : null;
    return {
      axisId: memberAxes.map((axis) => axis.id).join('+'),
      group: unit.group,
      axes: memberAxes,
      // Every kept file carries the slot's truncation count, so a consumer
      // reading one file's metadata cannot conclude the slot was complete.
      files: kept.map((file) => ({ ...file, truncatedFrom })),
      skippedFiles: union.slice(cap).map((file) => file.path).sort(),
    };
  });

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

  return {
    selected,
    skippedOnTouch,
    emptyAfterAssignment,
    deferred: leftIds,
    slots,
    agents: selected.length === 0 ? 0 : 1 + 2 * selected.length,
    truncated: selected.some((entry) => entry.skippedFiles.length > 0),
    nextAxisCursor: [...leftIds, ...dormant, ...takenIds],
  };
}
