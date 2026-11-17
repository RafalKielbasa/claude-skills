# code-review-master auto budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In `working`, `branch` and `pr` runs, `crm plan` sizes the agent budget itself: every woken axis gets an agent, large axes are split into parts with one agent each, under a hard ceiling, with a confirmation gate above 20 agents.

**Architecture:** A new pure module `lib/parts.mjs` partitions an entry's files into churn-balanced parts, maps findings to parts, and describes part labels. `selectAxes` gains an `auto` budget mode that takes every unit and attaches `parts[]`; `fixed` mode is today's algorithm plus single-part `parts[]`. `bin/crm.mjs` chooses the mode, reads `CRM_UNATTENDED`, adds `crm parts`, and lets `crm finish` accept part labels. `SKILL.md` dispatches one agent per part in waves 1 and 2.

**Tech Stack:** Node.js ESM, `node:test`, no dependencies. Skill at `~/.claude/skills/code-review-master` (`<skill>` below).

**Spec:** [`D:\Notatki\notatki\.claude\specs\2026-11-17-code-review-master-auto-budget-design.md`](../specs/2026-11-17-code-review-master-auto-budget-design.md)

## Global Constraints

- Defaults: `budget.confirm_above: 20`, `budget.max_agents: 41`, `budget.max_files_per_part: 12`; `secrets` and `debug-leftovers` carry `max_files_per_part: 40` in `templates/global.md`.
- Auto modes: `working`, `branch`, `pr`. Fixed modes: `since`, `full`, and any mode with `--budget fixed`.
- `agents = 1 + 2 × partCount` (0 when nothing is selected).
- A single-part entry's part label is its bare `axisId`; a multi-part label is `<axisId>#<n>`, `n` from 1.
- `finding.axis` is always an entry `axisId`, never a part label (spec A1).
- `--slots` without `--budget fixed` in an auto mode: exit 2 with `--slots applies to since and full; working, branch and pr size their own budget`.
- Unattended signal: environment variable `CRM_UNATTENDED=1`, exported by both wrappers; `crm plan` sets `needsConfirmation: false` when it is set.
- Code, comments, tests in English; strings shown to Rafal in Polish (`raport.md`, conversation lines in `SKILL.md`).
- `~/.claude` has no commit rule of its own: **no commits** — every task leaves its changes uncommitted; Rafal reviews and commits. The plan file itself lives in the vault, which commits on its own.
- `~/.claude/review/global.md` (Rafal's copy) is edited only in Task 9, after Rafal approves the exact lines.
- Baseline before Task 1: `cd <skill> && npm test` → `tests 285`, `pass 284`, `fail 0`, `skipped 1`. Every task ends with `fail 0`.

## Review Focus

1. A finding on a file that belongs to no part of its entry (codex-finder or a Sonnet agent quoting another part's file) must still reach exactly one verifier — Task 5 test `parts maps a finding on a foreign file to the part with the longest shared directory prefix`.
2. A run of only `split`-sized-40 axes plus small axes (typical 1–12-file PR) must produce exactly today's ledger labels and agent count — Task 3 test `an auto run under the part size has one part per entry labelled by axisId`.
3. Carried files (`carried: true`, churn 0) must not all land in one part — Task 2 test `zero-churn files spread by count`.
4. A ceiling hit with many units where even one part per entry is too many must defer by rank/cursor exactly like fixed mode, not drop files from kept entries — Task 3 test `ceiling overflow with one part per entry defers the lowest-ranked units`.
5. An unattended run above 20 agents must never set `needsConfirmation` — Task 4 test `CRM_UNATTENDED=1 turns off the confirmation gate`.

---

### Task 1: Configuration keys

**Files:**
- Modify: `<skill>/lib/config.mjs:3-21` (`DEFAULT_SETTINGS.budget`), `:41-58` (`sectionToAxis`), `:100-148` (`validateConfig`)
- Modify: `<skill>/templates/global.md:2` and the `secrets` / `debug-leftovers` yaml blocks; `<skill>/templates/config.md:2`
- Test: `<skill>/test/config.test.mjs`, `<skill>/test/skill.test.mjs`

**Interfaces:**
- Produces: `settings.budget = { slots, max_files_per_axis, confirm_above, max_agents, max_files_per_part }`; axis object gains `max_files_per_part: number | null`.

- [ ] **Step 1: Write the failing tests** in `test/config.test.mjs`:
  - `defaults carry the auto-budget keys`: `DEFAULT_SETTINGS.budget` deep-equals `{ slots: 5, max_files_per_axis: 40, confirm_above: 20, max_agents: 41, max_files_per_part: 12 }`.
  - `an axis may override max_files_per_part`: parsing an axis block with `max_files_per_part: 40` yields `axis.max_files_per_part === 40`; without it, `null`.
  - `bad auto-budget values are refused`: `validateConfig` reports a problem matching `/max_files_per_part/` for axis value `0`, `/budget.max_agents/` for `0`, and `/confirm_above.*max_agents/` when `confirm_above: 41, max_agents: 41`.
  - In `test/skill.test.mjs`, `the global template splits secrets and debug-leftovers only above 40 files`: both yaml blocks in `templates/global.md` contain `max_files_per_part: 40`, and its front matter contains `confirm_above: 20`, `max_agents: 41`, `max_files_per_part: 12`.
- [ ] **Step 2: Run** `node --test test/config.test.mjs test/skill.test.mjs` → the four new tests FAIL.
- [ ] **Step 3: Implement.** Add the three budget defaults; `sectionToAxis` reads `meta.max_files_per_part ?? null`; `validateConfig` checks `confirm_above`, `max_agents`, `max_files_per_part` are positive integers, `confirm_above < max_agents`, and per-axis `max_files_per_part` is `null` or a positive integer (same wording style as the `max_files` check at `config.mjs:118-120`). Templates: front matter `budget: { slots: 5, max_files_per_axis: 40, confirm_above: 20, max_agents: 41, max_files_per_part: 12 }` in both; `max_files_per_part: 40` in the `secrets` and `debug-leftovers` yaml blocks.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 2: `lib/parts.mjs` — partition and part labels

**Files:**
- Create: `<skill>/lib/parts.mjs`
- Test: `<skill>/test/parts.test.mjs`

**Interfaces:**
- Produces:
  - `partLabel(axisId: string, index: number, of: number): string` — `axisId` when `of === 1`, else `` `${axisId}#${index}` ``.
  - `partition(rankedFiles: File[], count: number): File[][]` — `count` non-empty arrays (when `rankedFiles.length >= count`), every file in exactly one, each array in input order.
  - `buildParts(axisId: string, rankedFiles: File[], size: number): Part[]` where `Part = { label, index, of, files }`, `of = max(1, ceil(files.length / size))`.
  - `File` is the existing target file object `{ path, added, removed, size, carried? }`.

- [ ] **Step 1: Write the failing tests** in `test/parts.test.mjs`:
  - `a part label is the bare axis id when there is one part`: `partLabel('code-quality', 1, 1) === 'code-quality'`, `partLabel('a+b', 2, 3) === 'a+b#2'`.
  - `every file lands in exactly one part`: 25 files, `partition(files, 3)` → 3 arrays, concatenated paths sorted equal input paths sorted.
  - `parts are balanced by churn`: churns `[100, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]` (ranked, highest first) into 2 parts → part sums `100` and `100`.
  - `zero-churn files spread by count`: 6 files with `added: 0, removed: 0`, 3 parts → each part has 2 files.
  - `each part keeps the ranked input order`: for any part, indices of its files in the input are increasing.
  - `buildParts sizes parts by ceil(files / size)`: 25 files, size 12 → 3 parts, labels `x#1..x#3`, `of === 3`; 12 files, size 12 → 1 part labelled `x`.
- [ ] **Step 2: Run** `node --test test/parts.test.mjs` → FAIL (module missing).
- [ ] **Step 3: Implement `partition`** with this greedy rule (the tests do not fully determine tie-breaking):

```js
// For each file in ranked order: pick the part with the lowest churn total;
// ties → fewer files; ties → lower index. Push the file there.
```

  Then `buildParts` calls `partition(rankedFiles, of)` and attaches `label/index/of`.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 3: `selectAxes` auto mode and the ceiling

**Files:**
- Modify: `<skill>/lib/axes.mjs:60-153`
- Test: `<skill>/test/axes.test.mjs`

**Interfaces:**
- Consumes: `buildParts` (Task 2); settings keys (Task 1).
- Produces: `selectAxes({ axes, files, settings, state, slotsOverride = null, budgetMode = 'fixed', unattended = false })` returning today's fields plus:
  - `budgetMode`, `partCount`, `confirmAbove`, `maxAgents`, `partSizeFloor: number | null`, `needsConfirmation: boolean`;
  - per entry: `parts: Part[]`, `partSize: number | null` (null in fixed mode);
  - `slots: null` in auto mode;
  - `agents = selected.length === 0 ? 0 : 1 + 2 * partCount`.
  - Default `budgetMode = 'fixed'` keeps every existing caller and test byte-compatible apart from the added fields.

- [ ] **Step 1: Write the failing tests** in `test/axes.test.mjs` (use the file's existing `axis`, `file`, `settings`, `state` helpers; `n` files = `Array.from({length:n}, (_, i) => file(`f${i}.ts`))`):
  - `fixed mode gives each entry one part labelled by its axisId`: existing 7-axis case → `partCount === 5`, `agents === 11`, every `entry.parts.length === 1`, `entry.parts[0].label === entry.axisId`, `budgetMode === 'fixed'`.
  - `auto mode takes every woken unit`: same 7 axes, `budgetMode: 'auto'` → `selected.length === 7`, `deferred` is `[]`, `agents === 15`, `slots === null`.
  - `an auto run under the part size has one part per entry labelled by axisId`: 3 `always` axes, 12 files → `partCount === 3`, labels equal axis ids.
  - `auto mode does not truncate`: one axis with `max_files: 5`, `settings.budget.max_files_per_axis: 5`, 30 files → `entry.files.length === 30`, `skippedFiles` `[]`, `truncated === false`.
  - `a large axis is split by max_files_per_part`: 1 axis, 38 files → `parts.length === 4`, `partSize === 12`, `agents === 9`.
  - `a per-axis max_files_per_part wins, largest member in a group`: axis `secrets` with `max_files_per_part: 40` and 38 files → 1 part; group of members with `12` and `40` → `partSize === 40`.
  - `the ceiling raises a floor before deferring`: 3 axes × 38 files, `max_agents: 13` → no deferral, `partSizeFloor > 12`, `agents <= 13`, every file of every entry still in its parts.
  - `the floor leaves a larger per-axis size alone`: axis A 38 files default size, axis B 80 files `max_files_per_part: 40`, `max_agents: 9` → B `partSize === 40` while floor `< 40`, `agents <= 9`.
  - `ceiling overflow with one part per entry defers the lowest-ranked units`: 6 `always`-woken axes (2 with `rank: 'always'`), `max_agents: 7` → `selected.length === 3`, the two `rank: 'always'` axes selected, `deferred.length === 3`.
  - `ceiling overflow follows the rotation cursor exactly like fixed mode`: 6 axes `a..f` (all `rank: 'rotate'`, 1 file each), `state.axis_cursor: ['d', 'e', 'f', 'a', 'b', 'c']`; auto with `max_agents: 7` and fixed with `slots: 3` on the same input → equal `selected.map(s => s.axisId)` (`['d','e','f']`), equal `deferred`, equal `nextAxisCursor`.
  - `needsConfirmation follows confirm_above and unattended`: 7 axes, `confirm_above: 11` → auto `needsConfirmation === true`; same with `unattended: true` → `false`; fixed mode → `false`.
- [ ] **Step 2: Run** `node --test test/axes.test.mjs` → new tests FAIL.
- [ ] **Step 3: Implement.** Keep wake/assign/group/order code. Branch after `ordered`:
  - fixed: today's `slots` cut and truncation; attach `parts: [{ label: axisId, index: 1, of: 1, files: kept }]`, `partSize: null`.
  - auto: rank each unit's full union with `rank()`; own size = max of members' `max_files_per_part` where non-null, else `settings.budget.max_files_per_part`; `partSize = max(own, floor ?? 0)`; parts via `buildParts`. Ceiling loop per spec §5.3:

```js
// floor = null; while (1 + 2*partCount > maxAgents && some entry has >1 part):
//   floor = floor === null ? max_files_per_part + 1 : floor + 1; rebuild parts.
// If still over: take = floor((maxAgents - 1) / 2) units in `ordered` order,
//   the rest go to `left` (deferred) exactly as fixed mode does.
```

  `nextAxisCursor` keeps today's formula over `taken`/`left`.
- [ ] **Step 4: Run** `npm test` → `fail 0` (all pre-existing axes tests pass unchanged).
- [ ] **Step 5: Leave uncommitted.**

---

### Task 4: `crm plan` — mode selection, `--budget fixed`, `--slots`, `CRM_UNATTENDED`

**Files:**
- Modify: `<skill>/bin/crm.mjs:47-60` (`readSlots`), `:222-259` (`plan`); `<skill>/lib/axes.mjs` (add `budgetModeFor`, `emptySelection`)
- Test: `<skill>/test/cli.test.mjs`, `<skill>/test/axes.test.mjs`

**Interfaces:**
- Consumes: `selectAxes` (Task 3).
- Produces:
  - `budgetModeFor(mode: string, budgetFlag: string | true | undefined): 'auto' | 'fixed'` in `<skill>/lib/axes.mjs` — `'fixed'` when `budgetFlag === 'fixed'` or `mode` is `since` / `full`, else `'auto'`.
  - `emptySelection(settings, budgetMode): Selection` in `<skill>/lib/axes.mjs` — the empty-target selection with every Task 3 field: `selected: [], skippedOnTouch: [], emptyAfterAssignment: [], deferred: [], agents: 0, partCount: 0, slots: budgetMode === 'fixed' ? <slots> : null, truncated: false, budgetMode, confirmAbove, maxAgents, partSizeFloor: null, needsConfirmation: false, nextAxisCursor: []`.
  - `crm plan` output `selection` with Task 3's fields; flag `--budget fixed` (any other value → exit 2 `--budget accepts only "fixed"`).

- [ ] **Step 1: Write the failing tests:**
  - `axes.test.mjs` `the budget mode follows the mode and the --budget flag`: `budgetModeFor` returns `'auto'` for `working`, `branch`, `pr`; `'fixed'` for `since`, `full`; `'fixed'` for each of the five with `'fixed'`. (`pr` and `since` need `gh` / a prior checkpoint end to end, so the full mode matrix is pinned here, not through the CLI.)
  - `axes.test.mjs` `an empty selection has the same shape as a real one`: `Object.keys(emptySelection(settings(), 'auto')).sort()` equals the sorted keys of a non-empty auto `selectAxes` result.
  - In `test/cli.test.mjs` (use `run`, `makeRepo`, `writeFiles`, `CONFIG`):
  - `working and branch plan with the auto budget`: `plan --mode working` and `plan --mode branch --base <first commit sha>` → `selection.budgetMode === 'auto'`.
  - `full plans with the fixed budget`: `plan --mode full` → `budgetMode === 'fixed'`.
  - `an empty target still carries the auto-budget fields`: clean tree, `plan --mode working` → `empty === true`, `selection.budgetMode === 'auto'`, `selection.needsConfirmation === false`, `selection.partCount === 0`.
  - `--budget fixed returns the old algorithm in an auto mode`: `plan --mode working --budget fixed` → `budgetMode === 'fixed'`, no `--interactive` needed.
  - `--slots is refused in an auto mode`: `plan --mode working --slots 3 --interactive` → exit 2, stderr matches `/--slots applies to since and full/`; with `--budget fixed --slots 3 --interactive` → `selection.slots === 3`.
  - Update the existing `a bare --slots without --interactive is refused, and accepted with it` to use `--mode full` (or `--budget fixed`), so it still tests the `--interactive` rule.
  - `CRM_UNATTENDED=1 turns off the confirmation gate`: config with `confirm_above: 2, max_agents: 41` and two `always` axes → without env `needsConfirmation === true`; with `env: { ...process.env, CRM_GLOBAL_CONFIG: <dir>/no-global.md, CRM_UNATTENDED: '1' }` → `false`.
- [ ] **Step 2: Run** `node --test test/cli.test.mjs` → new tests FAIL.
- [ ] **Step 3: Implement.** `budgetMode = budgetModeFor(mode, args.budget)`; validate `--budget`; the empty-target branch at `crm.mjs:239-241` returns `selection: emptySelection(config.settings, budgetMode)`; in `readSlots` (or right after it) refuse `--slots` when `budgetMode === 'auto'` with the exact Global Constraints message, checked before the `--interactive` check; pass `budgetMode` and `unattended: process.env.CRM_UNATTENDED === '1'` to `selectAxes`.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 5: `crm parts` and part labels in `crm finish`

**Files:**
- Modify: `<skill>/lib/parts.mjs` (add `assignFindings`), `<skill>/bin/crm.mjs` (new `parts` command; `finish` at `:653`)
- Test: `<skill>/test/parts.test.mjs`, `<skill>/test/cli.test.mjs`

**Interfaces:**
- Consumes: `selection.selected[].parts` (Task 3).
- Produces:
  - `assignFindings(selected: Entry[], findings: Finding[]): { parts: Record<label, string[]>, unassigned: string[] }` — every part label of every entry is a key (possibly `[]`); values are finding ids in input order; a finding whose `axis` equals no entry `axisId` goes to `unassigned`.
  - `crm parts --run <runId>` reads `plan.json` and `findings.json`, prints `assignFindings(plan.selection.selected, data.findings)`.

- [ ] **Step 1: Write the failing tests:**
  - `parts.test.mjs` `a finding goes to the part holding its file`: entry with parts `q#1: [a/x.ts]`, `q#2: [b/y.ts]`, finding `{id:'f-01', axis:'q', file:'b/y.ts'}` → `parts['q#2']` equals `['f-01']`, `parts['q#1']` equals `[]`.
  - `parts maps a finding on a foreign file to the part with the longest shared directory prefix`: parts `q#1: [apps/web/a.tsx]`, `q#2: [apps/api/b.ts]`, finding file `apps/api/c.ts` → `q#2`; finding file `README.md` (no shared prefix) → `q#1`.
  - `a finding on an unknown axis is reported, not dropped`: axis `zzz` → `unassigned` equals its id.
  - `single-part entries are keyed by their axisId`: one-part entry `secrets` → key `secrets`.
  - `cli.test.mjs` `finish accepts part labels and refuses an unknown part`: write a `plan.json` through `plan` on a config with `max_files_per_part: 1` and 2 changed files (→ labels `quality#1`, `quality#2`, agents 5), log `brief`, `axis quality#1`, `axis quality#2`, `verify quality#1`, `verify quality#2`, finish an empty run → exit 0; a separate run logging `axis quality#3` → exit 2, stderr matches `/did not select: quality#3/`.
- [ ] **Step 2: Run** `node --test test/parts.test.mjs test/cli.test.mjs` → FAIL.
- [ ] **Step 3: Implement.** Prefix = number of leading equal `/`-separated directory segments; ties → lower part index. In `finish`, `allowedLabels = new Set(selected.flatMap((s) => (s.parts ?? [{ label: s.axisId }]).map((p) => p.label)))` — the `?? ` fallback keeps `plan.json` files written before this change finishable.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 6: Report and artifact — spend line and incomplete parts

**Files:**
- Modify: `<skill>/lib/parts.mjs` (add `describeIncomplete`), `<skill>/lib/report.mjs:129-134`, `<skill>/bin/crm.mjs` (`render` `:561-563`, `artifact` `:601-603`), `<skill>/templates/artifact.html:410-421`
- Test: `<skill>/test/parts.test.mjs`, `<skill>/test/report.test.mjs`, `<skill>/test/artifact.test.mjs`

**Interfaces:**
- Produces: `describeIncomplete(selected: Entry[], labels: string[], lang: 'pl' | 'en'): string[]` — an axis id → itself; a part label of a multi-part entry → `code-quality (część 2 z 3, 12 plików)` / `code-quality (part 2 of 3, 12 files)` with Polish three-form plural (`plik`/`pliki`/`plików`); an unknown label → itself.
- `render` passes `describeIncomplete(..., 'pl')` to `renderReport`; `artifact` embeds `describeIncomplete(..., 'en')` as `incomplete`.

- [ ] **Step 1: Write the failing tests:**
  - `parts.test.mjs` `an incomplete part is described with its position and size` (both languages, 1/2/5 files for plural forms).
  - `report.test.mjs` `the spend line counts parts when an axis was split`: selection with 2 entries, one with 3 parts, `partCount: 4`, `agents: 9` → report contains `Zużycie: 9 agentów (1 brief + 4 części w 2 osiach + 4 weryfikacje).`
  - `report.test.mjs` `the spend line is unchanged without a split`: existing fixture → still contains today's `(1 brief + … osi + … weryfikacj…)` wording.
  - `artifact.test.mjs` `the page counts parts in the spend line`: the template source contains `partCount` in the spend-line code.
  - `cli.test.mjs` `render and artifact describe an incomplete part`: a planned run with `max_files_per_part: 1` and 2 changed files (labels `quality#1`, `quality#2`), finished through `assemble` and `score` with empty arrays; `render --incomplete quality#2` → `raport.md` contains `quality (część 2 z 2, 1 plik)`; `artifact --incomplete quality#2 --out <tmp>.html` → the embedded payload's `incomplete` equals `['quality (part 2 of 2, 1 file)']`.
- [ ] **Step 2: Run** `node --test test/parts.test.mjs test/report.test.mjs test/artifact.test.mjs test/cli.test.mjs` → FAIL.
- [ ] **Step 3: Implement.** In `report.mjs` use `selection.partCount ?? chosen.length`; when it differs from `chosen.length`, print `1 brief + {P} {część|części|części} w {N} {osi|osiach} + {P} {weryfikacja|weryfikacje|weryfikacji}` — `plural()` for the two counts, and the locative `w 1 osi` / `w N osiach` (N ≠ 1); else today's line. Artifact: same branch in English: `1 brief + P axis parts across N axes + P verifications`.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 7: Wrappers export `CRM_UNATTENDED=1`

**Files:**
- Modify: `<skill>/scripts/review.sh:118-131`, `<skill>/scripts/review.ps1:149-168`; comments in both that say "No --slots and no --interactive here" gain one sentence on the variable.
- Test: `<skill>/test/wrapper.test.mjs`, `<skill>/test/wrapper-ps1.test.mjs`

**Interfaces:**
- Produces: the `claude -p` child of both wrappers sees `CRM_UNATTENDED=1`.

- [ ] **Step 1: Write the failing tests:**
  - `wrapper.test.mjs` `the wrapper marks the session as unattended`: extend `stub()` with an option that also writes `printf '%s' "$CRM_UNATTENDED" > "${dir}/env.txt"`; after `runWrapper`, `env.txt` equals `1`.
  - `wrapper-ps1.test.mjs` `review.ps1 marks the session as unattended` (with the file's `{ skip }` guard): write a temp `claude-stub.cmd` containing `@echo %CRM_UNATTENDED%> "<dir>\env.txt"` and `@exit /b 0`; run `review.ps1 -Repo <tmp git repo> -Mode since` with `env: { ...process.env, CRM_CLAUDE_BIN: <stub path> }`, ignoring the exit code (the gate fails without a real run); `env.txt` trimmed equals `1`. If `crm begin` needs a `.claude/review/` directory first, create it in the temp repo before running.
- [ ] **Step 2: Run** `node --test test/wrapper.test.mjs test/wrapper-ps1.test.mjs` → FAIL.
- [ ] **Step 3: Implement.** `review.sh`: `export CRM_UNATTENDED=1` before the `claude -p` subshell. `review.ps1`: `$env:CRM_UNATTENDED = '1'` before `Push-Location` (the wrapper's process ends with the run, so no restore is needed). `ci/code-review.yml` needs no change: it calls `review.sh`.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 8: Axis prompt and `SKILL.md`

**Files:**
- Modify: `<skill>/prompts/axis.md` (new `{{PART_NOTE}}` after `{{FILES}}`), `<skill>/SKILL.md` Overview `:17`, Invocation `:34`, Step 1 `:52-70`, Step 2 `:72-76`, Step 3 `:84-90`, Step 3b `:96-104`, Step 4 `:125-135`, Step 6 `:159-171`, Steps 8–10 `--incomplete` wording, "Rules that do not bend" `:292-300`; `<skill>/PURPOSE.md` "Historia ewolucji" (one dated line).
- Test: `<skill>/test/skill.test.mjs`, `<skill>/test/prompts.test.mjs`

**Interfaces:**
- Consumes: `selection.needsConfirmation`, `partCount`, `partSizeFloor`, `parts[]`; `crm parts` output (Task 5); `--budget fixed` (Task 4).

- [ ] **Step 1: Write / update the failing tests** in `test/skill.test.mjs`:
  - Replace `the budget is announced before dispatch and never raised silently`: TEXT matches `/crm plan/`, `/before dispatching/i`, `/needsConfirmation/`, `/--budget fixed/`, `/--slots[\s\S]{0,200}since[\s\S]{0,40}full/`.
  - `the gate asks only when needsConfirmation is true and treats silence as no answer`: TEXT matches `/needsConfirmation[\s\S]{0,600}AskUserQuestion/` and `/timeout[\s\S]{0,200}not (an )?answer|ask again/i`.
  - `waves 1 and 2 dispatch one agent per part, logged with the part label`: TEXT matches `/one Sonnet agent per part/i`, `/one Haiku agent per part/i`, `/crm dispatched --run <runId> --wave axis --label <part label>/`, `/crm parts --run <runId>/`.
  - `a part agent echoes the axis id, never the part label`: TEXT matches `/\{\{AXIS_ID\}\}[\s\S]{0,200}never the part label/i`.
  - `Step 3b marks a failed part, not the whole axis`: TEXT matches `/--incomplete[\s\S]{0,300}part label/i`.
  - Update `Verification is one agent per axis` assertions (if any test pins that sentence) to `one agent per part, never one per finding`.
  - `prompts.test.mjs`: `axis.md` contains `{{PART_NOTE}}`.
- [ ] **Step 2: Run** `node --test test/skill.test.mjs test/prompts.test.mjs` → FAIL.
- [ ] **Step 3: Edit `SKILL.md`** (English, Polish only in quoted user-facing lines):
  - Overview: budget is `selection.agents = 1 + 2 × selection.partCount`, computed by `crm plan`; auto in `working/branch/pr`, fixed in `since/full`.
  - Step 1: budget line per spec §6.1 (parts named only when an entry has more than one; extra line when `partSizeFloor` is not null).
  - Step 2 rewritten as "confirm or reject": ask through `AskUserQuestion` only when `needsConfirmation` is true, options `Uruchom (Rekomendowane)` / `Odrzuć — stary budżet`, show a per-entry table (axis, parts, files per part); a timeout or "proceed using your best judgment" is not an answer — say one line and ask again; on rejection rerun `crm plan` with the same flags plus `--budget fixed` and continue with the new `runId`. `--slots` paragraph limited to `since`/`full` (and `--budget fixed`).
  - Step 3: `{{SUMMARY_INPUT}}` unchanged (deduplicated union of entry `files`).
  - Step 4: one Sonnet agent per part, all in one message; `{{AXIS_ID}}` = entry `axisId`, never the part label; `{{FILES}}` = the part's files; `{{PART_NOTE}}` empty for one part, else spec §7.1's paragraph listing the other parts' paths; ledger label = part label.
  - Step 6: run `crm parts --run <runId>` after `crm assemble`; one Haiku agent per part with that part's ids; `unassigned` non-empty → one Polish line naming the ids (they stay unscored).
  - Step 3b / 8 / 9: `--incomplete` takes part labels or axis ids.
  - Step 10 and Rules: ledger checked against part labels; "Verification is one agent per part, never one agent per finding"; "A non-interactive run never applies a fix and never raises the budget above `max_agents`".
  - `axis.md`: insert `{{PART_NOTE}}` under `## Files` after `{{FILES}}`.
  - `PURPOSE.md`: one line dated 2026-11-17 in the existing format, naming spec and this plan.
- [ ] **Step 4: Run** `npm test` → `fail 0`.
- [ ] **Step 5: Leave uncommitted.**

---

### Task 9: Replay and rollout (needs Rafal)

**Files:**
- Read only: `D:\Praca\Devstock\Projekty\saas app\.claude\review\reports\20260914-063205-jkgf-plan.json`, `...\20260908-065549-dmpn-plan.json`, `...\config.md`
- Modify after approval only: `~/.claude/review/global.md`

- [ ] **Step 1: Replay.** A throwaway script in the session scratchpad (not in `<skill>`) imports `<skill>/lib/config.mjs` and `<skill>/lib/axes.mjs`, loads `templates/global.md` merged with `saas app`'s `config.md`, and calls `selectAxes({ ..., files: plan.target.files, budgetMode: 'auto', state: { axis_cursor: [] } })` for both runs. Expected per spec §9: `jkgf` 12 parts / 25 agents / `needsConfirmation: true`; `dmpn` 9 parts / 19 agents / `false`. Report the actual numbers; a difference not explained by a `config.md` change since those dates is a bug to fix before Step 2.
- [ ] **Step 2: Show Rafal the exact lines** for `~/.claude/review/global.md` (budget keys in front matter, `max_files_per_part: 40` on `secrets` and `debug-leftovers`) and wait for approval. Apply only after it.
- [ ] **Step 3: Final `npm test`** → `fail 0`; report counts against the baseline (285 tests).
- [ ] **Step 4: Leave uncommitted;** propose a Conventional Commits message, e.g. `feat(code-review-master): automatic agent budget with axis parts`.

Acceptance (spec §10) is a separate step after Rafal's review: a real interactive `pr` run in `saas app` on a PR large enough to split.
