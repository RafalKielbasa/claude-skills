# code-review-master — automatic budget (axis parts) — design

**Index:** [.claude/projects/code-review-master.md](../projects/code-review-master.md)

Founding spec:
[2026-09-04-code-review-master-design.md](2026-09-04-code-review-master-design.md) (referred to
below as "the founding spec"). Skill: `~/.claude/skills/code-review-master` (referred to as
`<skill>`). Builds on the extra-finders change
([2026-11-12-code-review-master-extra-finders-design.md](2026-11-12-code-review-master-extra-finders-design.md)),
whose code is built but not yet reviewed by Rafal.

## 1. Intent

Rafal's goal is maximum review quality: no regression and no defect reaching deployed code. Today
the agent budget is fixed — `settings.budget.slots` (5) caps how many axes run, and
`max_files_per_axis` (40) caps how many files one axis agent reads. Raising it takes a manual
`--slots <n>`, which Rafal has to remember and size himself.

Two measured consequences in `saas app` (21 `pr` runs, `.claude/review/reports/*-plan.json`):

- In 9 of 21 runs at least one woken axis was deferred. A `pr` run has no "next run" to catch it,
  so that PR was never reviewed on that axis (e.g. `20260908-065549-dmpn` deferred
  `rate-limiting`, `landing-visibility`, `payments-stripe`, `debug-leftovers`).
- One Sonnet agent read up to 38 files on one axis (`20260914-063205-jkgf`). The assumption,
  not measured, is that rarer checklist items get dropped at that size.

The change: in `working`, `branch` and `pr` the skill computes the budget itself from the size of
the change — every woken axis gets an agent, and an axis with many files is split into **parts**,
each its own agent with the same checklist. Rafal only rejects the budget when it is too large.

The founding decision stays intact (`<skill>/PURPOSE.md`): the ceiling is a number returned by a
tested function, announced before any dispatch, held by the dispatch ledger in `crm finish`, and
no agent is ever re-dispatched within a run. Only the formula changes.

## 2. Decisions taken by Rafal (2026-11-17)

| Decision | Choice |
|---|---|
| What scales the budget | woken axes **and** splitting large axes into parts (variant A) |
| Where splitting lives | `parts[]` inside the axis's `selection.selected` entry; `axisId` unchanged (variant A) |
| D1 Rejection gate | ask only above a threshold, `budget.confirm_above` = **20 agents**; on rejection run the old fixed budget |
| D2 Unattended runs | auto budget in `pr` / `branch` / `working` also unattended, never above `budget.max_agents` |
| D3 Split threshold | `budget.max_files_per_part: 12`, overridable per axis; `secrets` and `debug-leftovers` split only above 40 files (`max_files_per_part: 40`) — refinement of the original `split: false`, pending Rafal's confirmation (§12) |
| D4 Modes and `--slots` | auto in `working`, `branch`, `pr`; `--slots` only in `since` and `full`, refused (exit 2) elsewhere |

Interpretation recorded here, to be confirmed by Rafal at spec review: "D1 A, budżet podnieśmy do
20" is read as `confirm_above: 20` — runs up to 20 agents start without a question; the default
`max_agents` ceiling (§5.3) is a separate number.

## 3. Goals, non-goals, anti-goals

**Goals**

- G1. In `working`, `branch` and `pr`, every axis woken by the change gets at least one agent;
  `selection.deferred` is empty unless the hard ceiling (§5.3) forces rotation.
- G2. No axis agent is handed more than `max_files_per_part` files, unless the ceiling forces
  larger parts (§5.3).
- G3. No changed file is dropped by truncation in these modes; `max_files_per_axis` does not apply.
- G4. The budget is announced before wave 0 and held by the ledger exactly as today.
- G5. Above `confirm_above`, an interactive run waits for Rafal before dispatching anything.

**Non-goals**

- No change to `since` and `full`: fixed `slots`, rotation, truncation, `--slots` as today.
- No change to `ask`, `recheck`, `send`, `fix`, `init` beyond what reads `selection` (§7).
- No change to the extra finders' invocation (codex finder and Semgrep stay one process each).
- No automatic grouping of axes (founding spec §5.3 step 4 stands).
- No re-dispatch of a failed part (founding rule stands; Step 3b applies per part).

**Anti-goals** — a failure even if it technically works when:

- A1. A finding's `axis` carries a part label (`code-quality#2`). Triage fingerprints are built
  from `finding.axis` (`<skill>/lib/triage.mjs:26`); a part label would silently resurrect
  every suppression Rafal recorded.
- A2. An unattended run waits for a prompt, or exceeds `max_agents`.
- A3. A finding is scored by no verifier because it was assigned to no part, and so vanishes
  under `belowThreshold` with confidence 0.
- A4. A part whose agent failed reads as covered in `raport.md` or the artifact.
- A5. A changed file in an auto-budget mode is reviewed by no agent and the report does not say so.

## 4. Current behaviour (for reference)

`crm plan` (`<skill>/bin/crm.mjs:222-259`) calls `selectAxes` (`<skill>/lib/axes.mjs:60`):
wake axes, assign files, drop empty axes, collapse `group:` members into one unit, order by
`rank` then `state.axis_cursor`, take the first `slots` units (`axes.mjs:105`), defer the rest,
truncate each unit's ranked file union to its cap (`axes.mjs:113-117`). `agents =
1 + 2 × selected.length`. `crm finish` (`crm.mjs:644-668`) fails when the ledger exceeds
`agents` or names a label not equal to some `selected[].axisId`. `--slots` needs
`--interactive` (`crm.mjs:51-58`).

## 5. Planning with parts

### 5.1 Data shape

Each `selection.selected` entry keeps every current field (`axisId`, `group`, `axes`, `files`,
`skippedFiles`) and gains:

```json
"parts": [
  { "label": "code-quality#1", "index": 1, "of": 3, "files": [ ...file objects... ] },
  { "label": "code-quality#2", "index": 2, "of": 3, "files": [ ... ] },
  { "label": "code-quality#3", "index": 3, "of": 3, "files": [ ... ] }
]
```

- An entry with one part has `parts: [{ label: <axisId>, index: 1, of: 1, files }]` — the label
  is the bare `axisId`, so a run without splitting has exactly today's ledger labels.
- `entry.files` stays the full (untruncated) file list of the entry; the parts partition it:
  every file in exactly one part.
- `selection` gains `budgetMode: 'auto' | 'fixed'`, `partCount` (sum of `parts.length`),
  `confirmAbove`, `maxAgents`, `partSizeFloor` (`null`, or the raised floor from §5.3), and
  `needsConfirmation` (`budgetMode === 'auto' && agents > confirmAbove && !unattended`, see §6.2).
- Each entry gains `partSize` — the size actually used for that entry after §5.3.
- `agents = 1 + 2 × partCount` (0 when nothing is selected). In `fixed` mode every entry has one
  part, so the formula reduces to today's.

### 5.2 Algorithm in `auto` mode

1. Wake, assign, drop empties, collapse groups — unchanged.
2. Take **every** unit; no `slots` cut, no truncation.
3. Per entry, the part size is `max_files_per_part` from the first defined of: any member axis's
   `max_files_per_part` (the largest, mirroring how `max_files` picks the largest member cap
   today), else `settings.budget.max_files_per_part`. The per-axis `max_files` and
   `budget.max_files_per_axis` are fixed-mode settings and are ignored in auto mode (G3).
4. Number of parts for an entry = `ceil(files / size)`.
5. Partition files into that many parts, **balanced by churn** (`added + removed`): sort by the
   existing `rank()` order, then assign each file to the part with the lowest churn total so far
   (ties → lower index). Carried files (`carried: true`, churn 0) spread by count. Parts are
   then re-sorted internally in `rank()` order for a stable prompt.
6. `nextAxisCursor` is computed as today (all units are "taken").

### 5.3 The hard ceiling

`settings.budget.max_agents` (default **41**, i.e. 20 parts) is the most a run may cost in `auto`
mode, interactive or not. When `1 + 2 × partCount` exceeds it:

1. Raise a global **floor** on part size step by step, starting at
   `settings.budget.max_files_per_part + 1`. Each entry's `partSize` becomes
   `max(own size from §5.2 step 3, floor)` — an entry with a per-axis size above the floor is left
   alone until the floor passes it. Recompute part counts after each step; stop when the total
   fits or every entry is one part. No file is dropped. `selection.partSizeFloor` records the
   final floor (`null` when the ceiling never bit).
2. If one part per entry still exceeds the ceiling (more woken units than `(max_agents − 1) / 2`),
   fall back to today's ordering for the overflow: keep units in `rank` / cursor order up to the
   ceiling and defer the rest — the same `deferred` mechanism, reported the same way.

The floor goes into `selection.partSizeFloor`, so the budget line can say parts were enlarged.

### 5.4 `fixed` mode

`since` and `full` always; `working`, `branch`, `pr` only after a rejection (§6.2). Exactly
today's algorithm (`slots`, rotation, `max_files_per_axis` truncation), each entry with one part.
`--slots` applies only here.

## 6. Announcing, confirming, rejecting

### 6.1 Budget line (Step 1)

The Polish line names parts when any entry has more than one:

`Budżet: {agents} agentów (1 brief + {partCount} części w {selected.length} osiach + {partCount} weryfikacji). Osie: code-quality (3 części), security-tenancy, …`

and, when §5.3 enlarged parts, a line saying the part size was raised from 12 to N to fit the
ceiling of `max_agents`. Plural forms follow `lib/report.mjs`'s `plural()` (three forms).
Unchanged when there is no split.

### 6.2 Gate (interactive only)

When `selection.needsConfirmation` is true **and** someone is at the keyboard, the skill prints
the budget line plus a per-entry table (axis, parts, files per part) and waits, through
`AskUserQuestion`, for one of: `Uruchom (Rekomendowane)` / `Odrzuć — stary budżet`. Silence or a
timeout is not consent (Rafal's global rule): ask again.

On rejection the skill runs `crm plan` again with the same mode flags plus `--budget fixed`,
which produces a **new `runId`** under today's fixed algorithm. The rejected run's `plan.json`
stays on disk with no ledger and no report; `crm latest` must not return it (it selects by
report today — the builder verifies this holds).

**How "unattended" is known — a mechanical signal, not the session's judgement.** The wrappers
(`scripts/review.sh`, `scripts/review.ps1`) and `ci/code-review.yml` export
`CRM_UNATTENDED=1` before starting `claude -p`. `crm plan` reads it and sets
`needsConfirmation: false` whenever it is set; the session asks if and only if
`needsConfirmation` is true. Reasons: an unattended `claude -p` run that tried to ask would hit
`AskUserQuestion`, which is not in the wrappers' `ALLOWED_TOOLS` (`scripts/review.sh:96`) and
is denied under `--permission-prompts none` — and Rafal's "silence is not consent, ask again" rule
would turn that denial into a stall (A2). Conversely, an interactive session must not skip the
gate on its own guess (G5). Without the variable `crm plan` assumes someone may be watching; an
unattended path that bypasses the wrappers therefore asks and stalls rather than overspending,
which is the safe direction. `crm plan` itself never prompts.

### 6.3 `--slots` and `--budget`

- `--slots` in `working`, `branch` or `pr` without `--budget fixed`: exit 2,
  `--slots applies to since and full; working, branch and pr size their own budget`.
  With `--budget fixed` it keeps today's meaning (still requires `--interactive`).
- `--budget fixed` is accepted in every mode, needs no `--interactive` (it can only lower spend),
  and is the only way back to the old algorithm in auto modes.
- The wrappers (`scripts/review.sh`, `scripts/review.ps1`) pass neither flag; they only export
  `CRM_UNATTENDED=1` (§6.2).

## 7. Dispatch and downstream

### 7.1 Wave 1 (Step 4)

One Sonnet agent per **part**, all parts of all entries in a single message. The prompt is
`prompts/axis.md` as today, with:

- `{{AXIS_ID}}` — the entry's `axisId` (never the part label; A1).
- `{{FILES}}` — the part's files.
- New `{{PART_NOTE}}` — empty for a single-part entry; otherwise a short paragraph: this is part
  `i` of `n` of the axis; the other parts' files (listed by path) are reviewed by other agents;
  read them when a cross-file behaviour needs it, but report findings only on lines of your own
  files.

Ledger: `crm dispatched --wave axis --label <part label>`.

### 7.2 Assignment of findings to parts (Step 6)

After `crm assemble`, each finding is assigned to a part by `finding.file`: the part of its
entry that contains that file. A finding whose file is in none of the entry's parts — possible for
codex-finder findings and in principle for a Sonnet agent citing another part's file — goes to the
part whose files it shares a directory prefix with most, falling back to part 1. This mapping is
computed by a new `crm parts --run <runId>` command (returns `{ <part label>: [finding ids] }`),
not by the session, so it is testable and A3 is held by code.

### 7.3 Wave 2

One Haiku verifier per part, `{{FINDINGS}}` = that part's findings (possibly `[]`). Ledger label
= part label. `crm score` unchanged (it joins by finding id).

### 7.4 `crm finish`

`allowedLabels` = every part label of every entry (which equals `axisId` for single-part
entries). Over-budget and stray-label checks unchanged otherwise.

### 7.5 Step 3b and `--incomplete`

`--incomplete` accepts part labels as well as axis ids. A failed part marks only that part:
`raport.md` and the artifact show `**Nie przejrzano**: code-quality (część 2 z 3, N plików)`.
A failed verifier for a part is recorded the same way. Axis ids still work (whole axis).

### 7.6 Report and artifact

- `Zużycie:` line in `lib/report.mjs:129-131` and the artifact's spend line
  (`templates/artifact.html:411`) count parts: `1 brief + {partCount} części ({n} osi) +
  {partCount} weryfikacji`; unchanged wording when `partCount === selected.length`.
- Coverage stays per axis. Findings keep grouping by `finding.axis`.
- `Ponad limit…` line cannot fire in auto mode (no truncation); stays for fixed mode.

### 7.7 Unchanged

`crm assemble`, `crm score`, `crm codex`, triage, `send`, `fix`, `recheck`, the codex finder and
Semgrep (they map to entry `axisId` as today; §7.2 handles their parts).

## 8. Configuration

| Key | Where | Default | Meaning |
|---|---|---|---|
| `budget.confirm_above` | settings | 20 | Interactive auto runs above this many agents ask first |
| `budget.max_agents` | settings | 41 | Hard ceiling in auto mode, interactive or not |
| `budget.max_files_per_part` | settings | 12 | Part size before splitting |
| `max_files_per_part` | axis | — | Per-axis override (largest member wins in a group) |

`budget.slots`, `budget.max_files_per_axis` and the per-axis `max_files` keep their meaning for
fixed mode only. `validateConfig` checks positive integers and `confirm_above < max_agents`.

Rollout touches files outside `<skill>`:

- `<skill>/templates/global.md` and `<skill>/templates/config.md` — new budget keys;
  `max_files_per_part: 40` on `secrets` and `debug-leftovers` in `global.md`. These two axes are
  `when: always`, so they receive every changed file; a hard "never split" would hand one agent
  150 files on a large `branch` run and, on a context failure, mark the blocking-by-default
  `secrets` axis as not reviewed (Step 3b). Splitting them at 40 keeps them cheap on ordinary PRs
  (one part up to 40 files, as today's cap) without dropping files on huge ones.
- `~/.claude/review/global.md` — Rafal's own copy; Step 1 never overwrites it, so the two
  `max_files_per_part: 40` lines and budget keys must be added by hand, **with Rafal's approval at
  the acceptance step**. Without them `secrets` and `debug-leftovers` split at 12 like any other
  axis (costly, not wrong).
- `saas app/.claude/review/config.md` — no change required; its `budget` line keeps fixed-mode
  values.

## 9. Testing

- `test/axes.test.mjs`: auto mode takes every unit; partition covers every file exactly once;
  churn balancing; per-axis override; floor leaves larger per-axis sizes alone; ceiling enlarges
  parts before deferring;
  ceiling overflow defers by rank/cursor; fixed mode byte-identical to today on existing fixtures.
- `test/cli.test.mjs`: `--slots` refused in auto modes; `--budget fixed` path; `needsConfirmation`;
  `crm parts` mapping incl. a codex finding on a file outside every part; `finish` accepts part
  labels and rejects an unknown `#n`.
- `test/report.test.mjs`, `test/artifact.test.mjs`: spend line with parts, incomplete part.
- `test/skill.test.mjs`: Steps 1, 2, 3b, 4, 6 mention parts, gate and `--budget fixed`.
- `test/wrapper.test.mjs`, `test/wrapper-ps1.test.mjs`: both wrappers export `CRM_UNATTENDED=1`;
  `crm plan` under it returns `needsConfirmation: false` above `confirm_above`.
- Replay (sanity check, reported, not a pass/fail test — `saas app`'s `config.md` may have changed
  since): feed `selectAxes` the `target.files` stored in two past `plan.json` files under the
  current configuration and report the budgets. Expected at the configuration of the time:
  - `20260914-063205-jkgf` (38 files): `secrets` 1 part (40-file part size, §8), `code-quality`
    4, `security-tenancy` 1, `web-frontend+web-design-system` 4, `debug-leftovers` 1,
    `payments-stripe` 1 → 12 parts, **25 agents** (asks: above 20).
  - `20260908-065549-dmpn` (11 files): 9 units, none above 12 files → 9 parts, **19 agents**
    (no question); today it ran 11 agents and deferred 4 axes.
  A difference from these numbers must be explained by a configuration change or it is a bug.

## 10. Acceptance

A real interactive `pr` run in `saas app` on a PR large enough to split (≥ 13 files on some
splittable axis): budget announced with parts, gate shown only above 20, ledger matches, report
coverage correct, no suppression resurrected (compare `suppressed` count with the previous run).

## 11. Left to the builder

- Exact Polish wording of the gate and enlarged-parts lines, within §6.1's content.
- Internal structure of `selectAxes` (a separate `planParts` function is fine).
- The `{{PART_NOTE}}` text, within §7.1's content.
- The order in which wave-1 parts are listed in the single dispatch message.

## 12. Calls made by the author (for Rafal to check)

Settled after the builder check, not discussed with Rafal:

- Unattended runs are recognised by `CRM_UNATTENDED=1` exported by the wrappers and CI, not by
  the session's judgement (§6.2).
- In auto mode the per-axis `max_files` and `budget.max_files_per_axis` are ignored (§5.2).
- Under the ceiling a global part-size floor rises; per-axis sizes above the floor stay (§5.3).
- A rejected plan is never returned by `crm latest`: it selects runs by `*-findings.json`
  (`<skill>/bin/crm.mjs:770-772`), and a rejected plan writes none.
- The plan is built on the current working tree of `<skill>`, including the extra-finders code
  that Rafal has not reviewed yet; changes from that review may force rework in tasks touching
  `crm finish`, `crm codex-find` and `planSemgrepJobs`.

Pending Rafal's confirmation:

- `confirm_above: 20` reading of "budżet podnieśmy do 20" (§2).
- `secrets` / `debug-leftovers` split at 40 instead of never (§2 D3, §8).
