# code-review-master — extra finders (codex as a finder, Semgrep) — design

**Index:** [.claude/projects/code-review-master.md](../projects/code-review-master.md)

Founding spec:
[2026-09-04-code-review-master-design.md](2026-09-04-code-review-master-design.md) (referred to
below as "the founding spec"). Skill: `~/.claude/skills/code-review-master` (referred to as
`<skill>`).

## 1. Intent

Rafal wants more certainty on important PRs. Today every finding in a report comes from the
wave-1 Sonnet axis agents (`<skill>/prompts/axis.md`); the Haiku verifiers and codex
(`<skill>/prompts/codex.md`) only judge what Sonnet already found. A problem no Sonnet agent
reported is invisible to the whole pipeline. This change adds two **independent finders** that
feed the same pipeline:

- **codex as a finder** — a second model family reading the same files against the same axis
  checklists;
- **Semgrep** — a deterministic scanner for the axes where rules beat judgement (secrets,
  security patterns).

Their findings go through exactly the same evidence check (`crm assemble`) and Haiku
verification (`crm score`) as Sonnet's. Where two finders independently point at the same place,
the report shows that agreement as a confidence signal.

## 2. Decisions taken by Rafal (2026-11-12)

| Decision | Choice |
|---|---|
| Which extra reviewers | codex as a finder **and** Semgrep (variant D) |
| Why | no specific past failure; more certainty on important PRs (variant C of "what failed") |
| Modes | `pr` and `branch` only; `working`, `since`, `full` unchanged |
| Trigger | **always** in `pr` and `branch`, no flag (variant B) |
| Semgrep installation | Docker image `semgrep/semgrep`, pinned (variant B) |

## 3. Goals, non-goals, anti-goals

**Goals**

- G1. Every `pr` and `branch` run gets findings from up to three sources: `sonnet`, `codex`,
  `semgrep`.
- G2. Each finding records its source(s); the report and the artifact show them.
- G3. No change to the Claude subagent budget `1 + 2 × selection.selected.length`.
- G4. A finder that fails (codex down, Docker not running, timeout, unparsable output) costs one
  line in the conversation and in the report, never the run.

**Non-goals**

- No new Claude subagents, no change to wave 0/1/2 dispatch.
- No change to `working`, `since`, `full`, `ask`, `recheck`, `init`.
- No masking of secrets quoted as evidence (true today for Sonnet's `secrets` axis too; a
  separate topic if it ever matters).
- No Gemini, Copilot, CodeQL.
- No tuning of Semgrep rule packs beyond the initial assignment in §6.3.

**Anti-goals** — the change is a failure even if it technically works when:

- A1. A codex or Semgrep finding reaches the report without passing `validateFinding`
  (`<skill>/lib/findings.mjs:11`) and the wave-2 Haiku score.
- A2. codex's verdict on a finding codex itself found is presented as a second opinion
  ("codex: potwierdza").
- A3. A finder failure blocks or breaks the run, or is silent.
- A4. Semgrep sends anything about the repository to semgrep.dev (metrics, code, repo name).
- A5. An unattended run (wrapper `scripts/review.ps1` / `review.sh`, CI) changes behaviour in a
  way that needs a person — e.g. waits for a prompt or pulls the Docker image without a timeout.

## 4. Current pipeline (for reference)

`crm plan` → wave 0 brief (Haiku) → wave 1 axis agents (Sonnet, one per `selection.selected`
entry) → raw JSON written by the session to `<runId>-raw.json` → `crm assemble` (evidence check,
dedupe by `fingerprint`, triage suppression, ids `f-NN`) → wave 2 verify (Haiku, one per entry) →
`crm score` (thresholds) → `crm codex` (judge, `lib/codex.mjs`) → prose → `crm render` →
`crm artifact` → `crm finish`. Files: `<skill>/bin/crm.mjs`, `<skill>/lib/*.mjs`,
`<skill>/SKILL.md` Steps 1–10.

## 5. codex as a finder

### 5.1 Command

New `crm codex-find --run <runId>`:

- Reads `<runId>-plan.json`. When `plan.mode` is not `pr` or `branch`, returns
  `{ status: 'not-in-mode' }` and writes nothing.
- When `settings.codex.enabled` is false or the new `settings.codex.find` is false, returns
  `{ status: 'disabled' }`.
- Otherwise builds a prompt from the new `<skill>/prompts/codex-find.md`: for **every** entry of
  `selection.selected`, its `axisId`, its checklist(s) (the same concatenation rule as SKILL.md
  Step 4 `{{CHECKLIST}}`), its severity default(s) and its `files`. One codex call per run, not
  one per axis.
- Runs codex through the existing spawn logic of `runCodex` (`lib/codex.mjs:55`): same
  `exec --sandbox read-only -`, prompt on stdin, same Windows `cmd.exe` fallback, same binary
  name check. The builder generalises `runCodex` to take the parser as a parameter rather than
  copying it.
- Timeout: new `settings.codex.find_timeout_s`, default 600 (finding reads every file; judging
  only reads cited lines, which is why the existing `timeout_s` stays 300).
- Output contract asked of codex: the same JSON array of findings as `prompts/axis.md`
  (`axis, file, lines, severity, claim, evidence`), plus an optional `fix` (one sentence).
- Parsing: take the last JSON array in stdout (codex prints prose around it, see
  `parseCodexVerdicts`). Drop — and count — any finding whose `axis` is not one of the selected
  `axisId`s or whose `file` is not in that axis's `files`.
- Writes `<runId>-codex-raw.json` (array, possibly empty) and returns
  `{ status, found, droppedOffAxis }`. `status` ∈ `ok | disabled | not-in-mode | unavailable |
  timeout | unparsable`. The status is also persisted into `plan.json`-adjacent run data so
  `render` can report it (builder's choice where; it must survive to `render` and `artifact`).

### 5.2 When it runs (SKILL.md)

Both finders must run concurrently with wave 1, in interactive sessions **and** in headless
`claude -p` runs started by `scripts/review.ps1` / `review.sh`, whose `--allowedTools` list does
not include harness background tools. So concurrency is owned by `crm`, not by the harness:

- `crm finders --run <runId> --start` spawns one detached worker process (Node, `detached`,
  `stdio: 'ignore'`, `windowsHide`) that runs `crm codex-find` and `crm semgrep` for that run
  concurrently and writes `<runId>-finders.json` with both statuses when both have ended. It
  returns at once with `{ started: true }`, or `{ started: false, reason: 'not-in-mode' }` outside
  `pr`/`branch`.
- `crm finders --run <runId> --wait` blocks until `<runId>-finders.json` exists or at most
  500 s (below the Bash tool's 600 s ceiling), returning the statuses or `{ status: 'pending' }`;
  the session calls it again on `pending`. A worker that died without writing the file is detected
  by a stale pid/heartbeat and reported as `unavailable` for both finders (builder's choice of
  mechanism).
- SKILL.md: Step 4 runs `crm finders --start` right before dispatching the wave-1 agents; Step 5
  starts with `crm finders --wait`.

`crm codex-find` and `crm semgrep` stay individually callable (tests, manual reruns). Neither the
worker nor the finders is a subagent, and neither is logged with `crm dispatched`; `crm finish`
budget logic is untouched. The wrapper's `--allowedTools` must allow the new `crm` subcommands if
it lists `crm` invocations individually (builder checks `scripts/review.ps1:151-164`).

### 5.3 Prompt

`prompts/codex-find.md` is English, mirrors `prompts/axis.md` (verbatim evidence, `[start, end]`
lines, escape rules, `[]` is a valid answer, judge only against the checklist), and states that
the finder must not modify any file. It does not include the wave-0 brief summary: codex runs
concurrently with wave 1 and starting it after the brief would serialise it.

## 6. Semgrep

### 6.1 Configuration

- New optional axis key `semgrep:` in the axis YAML block (`lib/config.mjs:sectionToAxis`), a list
  of rule-pack references, e.g. `semgrep: [p/secrets]`. Default `[]`. `validateConfig` checks it is
  a list of non-empty strings.
- New settings block, merged like `codex` in `mergeConfig`:
  `semgrep: { enabled: true, image: 'semgrep/semgrep:<pinned tag>', timeout_s: 300 }`.
  The builder pins a concrete tag that is at least two weeks old at build time; never `latest`.
- Rule packs are fetched from the semgrep.dev registry on each run (`--config p/...`), so the
  container needs network access and the rules drift over time while the engine stays pinned.
  Accepted for now: with `--metrics=off` the fetch is a rules download, not an upload. Vendoring
  the packs into the skill (`--network none`, local rule paths) is a later option, not this
  change.

### 6.2 Command

New `crm semgrep --run <runId>`:

- `not-in-mode` and `disabled` exactly as §5.1. Also `nothing-to-scan` when no selected entry has
  an axis with a non-empty `semgrep:` list.
- For each selected entry, for each of its axes with `semgrep:` rules: one `docker run` over that
  axis's files in this entry (an axis with no files in the run is not scanned):
  `docker run --rm -v <repo>:/src:ro -w /src <image> semgrep scan --metrics=off --json --quiet
  --config <pack> [--config <pack> …] <file> …`. Spawned with an argument array, no shell; `docker`
  is a real executable on Windows, so no `cmd.exe` fallback is needed. Paths are the repo-relative
  paths from `plan.json`, converted to forward slashes.
- One combined timeout budget `semgrep.timeout_s` for the whole command; a run that hits it
  returns `timeout`.
- Docker not installed or daemon not running → `unavailable` with the raw stderr in the result
  (one line is enough for the user).
- **Changed lines only.** Semgrep scans whole files, and packs like `p/security-audit` are noisy
  on old code. `crm semgrep` keeps only results whose `[start, end]` overlaps a `+` hunk of the
  change: for `branch`, `git diff -U0 <plan.target.base> HEAD -- <file>`; for `pr`, the patch from
  `gh pr diff <n>` (the PR's SHAs come from the GitHub API and need not exist in this clone, see
  `bin/crm.mjs:399-404`). This applies to every axis, `secrets` included, and matches the existing
  rule that a pre-existing issue on untouched lines scores 0 (`prompts/verify.md:7-9`). Results
  dropped by the filter are counted (`outsideChange`) and shown in the status line, not listed.
  When the hunks cannot be computed, the filter is not applied and the status line says so.
- Mapping each Semgrep result to a finding:
  - `axis` = the **slot's** `axisId` from `selection.selected` (e.g. `cms-security+cms-data` when
    `cms-security` shares group `cms` with `cms-data`, `lib/axes.mjs:120`), not the member axis
    whose `semgrep:` rules produced it — wave 2 groups findings by the slot `axisId`
    (SKILL.md Step 6), so a member-axis label would reach no verifier and score 0;
  - `file` = `path`; `lines` = `[start.line, end.line]`;
  - `evidence` = **read by `crm` from the file** at those lines, never taken from Semgrep's
    `extra.lines` (recent Semgrep versions replace it with "requires login" without an account);
  - `severity`: Semgrep `ERROR` → `blocking`, `WARNING` → `suggestion`, `INFO` → `nitpick`;
  - `claim` = first sentence of `extra.message`, followed by ` (semgrep: <check_id>)`;
  - `rule` = `check_id` (the field `buildCodexPrompt` already reads as `f.rule`).
- Writes `<runId>-semgrep-raw.json` and returns `{ status, found, scannedAxes }`; status persisted
  like codex-find's.

### 6.3 Initial rule assignment

- `secrets` axis (in `~/.claude/review/global.md` **and** `<skill>/templates/global.md`):
  `semgrep: [p/secrets]`. The skill never overwrites the user's `global.md` on its own (SKILL.md
  Step 1); this one edit is part of this change, approved here.
- `cms-security` axis in `code-busters-v2/.claude/review/config.md`: `semgrep: [p/security-audit]`.
  Left uncommitted in that repo, per its rules.
- `saas app` gets only the global `secrets` assignment; adding packs to its axes is out of scope.

### 6.4 Docker image on first use

The first `docker run` with an image that is not present pulls it, which can exceed
`timeout_s`. The command must not pull with an unbounded wait (A5): it runs with
`--pull never`, and a missing image returns `unavailable` with the reason "image not pulled".
The one-time `docker pull <image>` is a command for Rafal to run; the report line says so.

## 7. Assembly, sources and agreement

- `crm assemble` keeps its `--raw <file>` argument for the Sonnet output and additionally reads
  `<runId>-codex-raw.json` and `<runId>-semgrep-raw.json` when they exist. It stamps `source`
  itself — `sonnet`, `codex`, `semgrep` by file — overwriting anything a finder emitted, for the
  same reason `id` and `codex` are assigned last today (`lib/findings.mjs` comment in
  `assemble`).
- Every finding carries `sources: [...]` (one or more). Exact duplicates (same `fingerprint`)
  merge as today and union their `sources`.
- **Agreement**: two findings from different sources with the same `axis`, same `file` and
  overlapping `lines` are merged into one finding. A merged finding holds **at most one finding
  per source**: two Sonnet findings are never merged with each other through a codex finding that
  overlaps both; a finding that overlaps two candidates of another source merges with the one of
  larger overlap. The kept finding is the one with the higher severity (tie: Sonnet's, then
  Semgrep's, then codex's); it is recorded as `keptFrom: <source>`. The other's data is preserved
  as `alsoClaimed: [{ source, claim, severity, fix }]` so a different problem on overlapping lines
  is not lost. `lines` becomes the union span; `sources` the union. Overlap says "same place", not
  "same problem" — §8 treats it accordingly.
- Triage suppression (`isSuppressed`) runs after merging, as today. `fingerprint` is unchanged,
  so existing triage entries keep matching Sonnet-worded findings; a codex- or Semgrep-worded
  duplicate of a suppressed finding is not suppressed (accepted; a triage verdict with
  `--scope` already covers the case the user cares about).
- `rejectedForEvidence` entries carry `source`, and Step 5's one-line message gives the count per
  source.
- Wave 2 is unchanged: findings are grouped by `axis` regardless of source, still one Haiku agent
  per entry. The verifier sees `alsoClaimed` as part of the finding.

## 8. codex as judge (Step 7) and `fix`

- `crm codex` (judge) skips only findings whose `keptFrom` is `codex`. Such a finding gets
  `codex: { verdict: 'own', reason: 'found by codex — not cross-checked', fix: <codex's own fix or
  null> }`. (A2) A merged finding whose kept claim came from Sonnet or Semgrep goes to the judge
  like any other, even when codex is among its `sources`: codex then judges a claim it did not
  write, and its own claim on those lines stays in `alsoClaimed`.
- Report label for `own`: `codex: własne znalezisko`; the artifact badge follows the same label.
- `gate`: unchanged — `own` is not `rejects`, so it counts like any other finding.
- `selectFixable` (`lib/fixable.mjs`): a finding is fixable when `codex.verdict === 'confirms'`,
  **or** when `codex.verdict === 'own'` and `sources.length >= 2` (codex's claim kept, and an
  independent finder pointed at the same lines). A codex-only finding is skipped with the reason
  `found only by codex — no independent second opinion`.

## 9. Report, artifact, conversation

- Budget line (SKILL.md Step 1) gets a second line in pr/branch runs:
  `Dodatkowo (poza budżetem agentów): codex jako szukający, Semgrep dla osi: {axisIds with semgrep rules in this run, or —}.`
- `raport.md` header: one status line each for codex-find and Semgrep, in the style of the
  existing `CODEX_NOTE` map (`lib/report.mjs`), only in pr/branch runs.
- Each finding shows a source badge: `sonnet`, `codex`, `semgrep`, or joined with `+` when merged
  (e.g. `sonnet+codex`). Merged findings also show `alsoClaimed` claims.
- Coverage block: counts of findings kept per source and how many came from agreement.
- Artifact (`templates/artifact.html`): source badge and a source filter beside the existing axis
  and severity filters.
- Step 10 headline counts add the per-source split.
- Mode `send`: comment text does not name the source.

## 10. Testing

- Unit tests with injected `spawn`, like `codex.test.mjs` does for `runCodex`: codex-find parsing
  (last array, off-axis drop, file-not-in-axis drop), Semgrep JSON → findings mapping (severity
  map, evidence read from file, `extra.lines` ignored), Docker unavailable / `--pull never`
  missing image / timeout → statuses.
- `findings.test.mjs`: source stamping overrides emitted `source`; agreement merge (overlap vs
  adjacent lines, different axes not merged, severity and tie rule, `keptFrom`, `alsoClaimed`
  with severity and fix, one finding per source per merge).
- Semgrep hunk filter: result inside a `+` hunk kept, outside counted as `outsideChange`; hunks
  unavailable → unfiltered with the status note; slot `axisId` label for a grouped axis.
- `crm finders`: `--start` returns at once; `--wait` returns statuses, `pending` past its limit,
  `unavailable` for a dead worker.
- `crm codex` judge filter: `keptFrom: codex` skipped with `own`; merged with Sonnet kept → judged.
- `fixable.test.mjs`: `own` + single source skipped with the stated reason; `own` + two sources
  fixable.
- `config.test.mjs`: `semgrep:` key parsing and validation; settings merge.
- `cli.test.mjs`: `not-in-mode` for `working`/`since`/`full`; assemble reading the two side files.
- `skill.test.mjs`: SKILL.md sections mention the background start and the judge exclusion.
- Acceptance (manual, Rafal present): one real `pr` run in `code-busters-v2` and one real
  `branch` run, both with Docker running and the image pulled; plus one `pr` run with Docker
  stopped to see the `unavailable` line.

## 11. Left to the builder

- Where codex-find/Semgrep statuses are persisted between commands (§5.1, §6.2).
- The exact Semgrep tag (rule in §6.1).
- Whether `runCodex` is generalised or wrapped (§5.1), as long as the spawn logic exists once.
- Wording of `prompts/codex-find.md`, within §5.3.
- Updating `PURPOSE.md` "Historia ewolucji" with this change.

## 12. Calls made by Claude, not by Rafal

These were proposed in conversation and not objected to, but Rafal did not choose them:

- codex finder runs concurrently with wave 1 and without the wave-0 summary (§5.2, §5.3).
- Agreement merge rule and `alsoClaimed` (§7).
- codex's own findings skip the judge; `fix` requires a second source for them (§8).
- Semgrep scoped per axis via `semgrep:` key; initial packs `p/secrets` and `p/security-audit`
  (§6.3).
- `--pull never` plus a manual one-time pull (§6.4).
- Separate `find_timeout_s` 600 s (§5.1).

Settled after the builder check (2026-11-12), also Claude's calls:

- Concurrency owned by `crm finders --start/--wait` with a detached worker, so headless wrapper
  runs work without harness background tools (§5.2).
- Semgrep findings labelled with the slot `axisId`, not the member axis (§6.2).
- Semgrep results limited to changed lines (`+` hunks), `secrets` included; codex-find results are
  **not** filtered, because codex may report an untouched line the change breaks — Haiku judges
  those as it does Sonnet's (§6.2).
- Merge keeps at most one finding per source; `own` applies only when codex's claim is the kept
  one (§7, §8).
- Rule packs from the registry on each run; vendoring postponed (§6.1).
