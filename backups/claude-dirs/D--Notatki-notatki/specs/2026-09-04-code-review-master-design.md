# code-review-master — design

**Date:** 2026-09-04
**Status:** approved design, ready for implementation planning
**Owner:** Rafal Kielbasa

A global Claude Code skill that runs a configuration-driven code review of a
repository, under a hard agent budget, and produces a Polish report backed by
machine-readable findings.

---

## 1. Purpose

Existing review tooling in this setup is either repo-agnostic or unbounded:

- `docs/review-guide.md` in the `saas app` repo holds a real, repo-specific
  methodology (4 checklist sections, merge criteria, a reviewer comment
  template) but nothing executes it.
- The bundled `/code-review` plugin executes a review, but it is PR-shaped,
  English-only, knows no per-repo configuration beyond `CLAUDE.md`, and — the
  blocking problem — spawns **one verification agent per finding**. Five review
  agents returning a dozen findings each means sixty processes in the second
  wave.

`code-review-master` closes both gaps: the repository declares its own review
axes in a configuration file, and the skill executes them under a ceiling that
is known before the run starts and cannot grow with the size of the change.

## 2. Non-goals

- Not a replacement for lint, typecheck, or tests. Anything a tool already
  catches is an explicit false positive (see §5.1).
- Not a blind autofix tool. Fixes are applied only to findings that survived
  both the verification wave and the codex cross-check, and only in the modes
  §12 permits.
- Not a PR-comment bot beyond the single CI comment described in §13.
- Does not review repositories without a `.claude/review/config.md`. Instead it
  offers `init`.

## 3. Naming and invocation

Skill name: `code-review-master`. It does not reuse `code-review`, which the
official plugin already occupies; a name collision in the `/` menu would be a
daily papercut.

```
/code-review-master                     # working-tree diff (default)
/code-review-master branch [base]       # current branch vs base (default: main)
/code-review-master pr <number>         # GitHub pull request
/code-review-master since               # incremental, from the stored checkpoint
/code-review-master full [path]         # audit, resumed through a file cursor
/code-review-master ask [report]        # Q&A + triage over a finished report
/code-review-master fix [ids]           # implement findings codex confirmed
/code-review-master init                # draft a configuration for this repo
```

`since` is the nightly mode. `pr` is the CI mode.

## 4. Cost governor

This is the central constraint of the design; every other decision defers to it.

### 4.1 What is bounded

**Budget** (total agents per run) is bounded, not concurrency. Bounding
concurrency alone — running seven axes as a wave of five plus a wave of two —
limits latency while leaving spend unbounded, which is exactly the silent
substitution this design forbids.

### 4.2 The ceiling

A run is `1 brief + N axis agents + N verification agents`, where `N` is the
number of **axis slots** (default 5, declared in configuration). At the default
that is **11 subagent invocations, regardless of repository size or finding
count**.

| Wave | Agents | Model | Task |
|---|---|---|---|
| 0 | 1 | Haiku 4.5 | Change brief: file inventory, summary, file-to-axis assignment |
| 1 | ≤ N | Sonnet 5 | One per axis, each with a curated file list |
| 2 | ≤ N | Haiku 4.5 | Verification, **one per axis, batched** |

### 4.3 Rules that hold the ceiling

1. **No recursion.** Agents in waves 0–2 are dispatched without the `Agent`
   tool. A subagent cannot fan out further — not "should not", but has no
   mechanism.
2. **Batched verification.** A verification agent receives all findings for its
   axis at once and returns an array of scores. Finding count affects one
   prompt's length, never the process count.
3. **Excess target truncates scope, never adds agents.** When an axis is
   assigned more files than `max_files_per_axis` (default 40), the planner keeps
   the highest-risk files and the report states the shortfall and the cursor
   position. The remainder is picked up by the next run through the same
   checkpoint mechanism used by `since`. A full audit of a large repository
   spreads across several nights rather than across thirty agents in one.
4. **An empty target ends the run before wave 0.** A nightly run on a day with
   no commits costs zero agents. This is the single rule that makes unattended
   scheduling cheap.
5. **An axis with no assigned files after the brief is not dispatched.** The
   typical run costs less than the ceiling.
6. **The codex cross-check (§12) is one external process per run**, batched over
   all surviving findings. It is not a Claude subagent, does not draw on the
   agent budget, and — like verification — never scales with finding count.

### 4.4 Main model

The skill does not choose the main model — the main model is whatever the
session runs on. The skill checks it at entry and warns when the session runs on
Haiku or Sonnet that planning and report quality will degrade. Non-interactive
runs force the model in the wrapper script.

The main model never reads code in bulk. It reads configuration, builds the axis
task list, receives structured findings with quoted evidence, and writes the
report. Bulk reading is Sonnet's job; confirmation is Haiku's.

## 5. Configuration

Two layers. The repository layer is self-contained and wins on conflict.

### 5.1 Global — `~/.claude/review/global.md`

Lives outside the skill directory so that evolving the skill does not overwrite
it. The skill ships a template and creates the file on first run if absent.

Contents:

- Default budget (`slots: 5`), limits (`max_files_per_axis: 40`), confidence
  thresholds, model per wave.
- Report editorial rules, including the language (Polish) and the three
  severities — `blocking` / `suggestion` / `nitpick` — carried over from the
  reviewer comment template in `docs/review-guide.md`.
- **The false-positive list**, adopted from the bundled `/code-review` because it
  is proven:
  - pre-existing issues on lines the change did not touch;
  - anything a linter, typechecker, or compiler catches;
  - nitpicks a senior engineer would not raise;
  - findings deliberately silenced in code with a justified suppression comment;
  - functional changes that are plainly intentional and part of the broader
    change.
- Universal axes that make sense in any repository: secrets committed to the
  repo; `console.log` and commented-out code in production files.

A repository disables an inherited axis with `disable: [secrets]` or overrides it
by declaring an axis with the same `id`.

### 5.2 Per-repo — `<repo>/.claude/review/config.md`

Source of truth for the repository, written in English. YAML frontmatter for the
machine part; one `##` section per axis, each opening with a fenced YAML block
of axis metadata followed by the checklist in prose.

Frontmatter keys:

```
budget: { slots: 5, max_files_per_axis: 40 }
confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 }
gate: blocking            # exit 1 while a blocking finding survives
gate_on_disputed: true    # a finding codex rejects still fails the gate
codex: { enabled: true, timeout_s: 300 }
commands: { lint: pnpm lint, typecheck: pnpm typecheck }
exclude: ['**/node_modules/**', 'pnpm-lock.yaml', '**/*.snap']
disable: []               # inherited global axes to switch off
```

An axis section, as `init` would draft it for `saas app`:

> ## Security & tenant isolation
>
> ```yaml
> id: security-tenant
> when: ['apps/api/**']
> rank: always
> severity_default: blocking
> ```
>
> - Every endpoint is guarded by `JwtAuthGuard` or explicitly `@Public()`.
> - Tenant-scoped queries go through `TenantContextService`; a hardcoded
>   `tenantId` is a blocking finding.
> - **RLS policies enforce nothing today** — the app connects as a Postgres
>   superuser and nothing sets `app.current_tenant_id`. Never accept an RLS
>   policy as the reason a query may skip its tenant filter.

And the axis carrying the historical dimension borrowed from the bundled plugin:

> ## Git history context
>
> ```yaml
> id: git-history
> when: always
> rank: rotate
> tools: [git-log, git-blame]
> ```
>
> - Read `git log -p` and `git blame` for the touched lines. Flag a change that
>   reverts a deliberate fix, or repeats a bug fixed earlier in this repository.

Axis metadata keys:

| Key | Meaning |
|---|---|
| `id` | Stable identifier; used in findings, rotation cursor, and triage fingerprints |
| `when` | `always`, or a list of globs that wake the axis |
| `rank` | `always` (claims a slot whenever woken) or `rotate` (queues) |
| `group` | Optional; axes sharing a group share one slot |
| `severity_default` | Default severity for findings on this axis |
| `max_files` | Optional per-axis override of the global limit |
| `tools` | Optional extra capabilities, e.g. `git-log`, `git-blame` |

### 5.3 Resolving more axes than slots

Applied in order; the first two steps are free and usually sufficient:

1. **`on-touch` filter.** An axis the change does not touch is not dispatched. A
   diff confined to `apps/web` collapses seven axes to three with no decision and
   no loss — the migrations axis had nothing to inspect.
2. **Rank and rotation.** Slots go to woken `always` axes first; `rotate` axes
   fill the remainder round-robin from the cursor in `state.json`. An axis that
   misses out has first claim on the next run. Nightly rotation covers
   everything within a few runs.
3. **Explicit budget raise.** `--slots 8` prints the resulting budget
   (`8 axes, 17 agents`) and asks for confirmation before starting. **The
   non-interactive wrapper never passes this flag** unless a human writes it into
   the script. An unattended run cannot exceed the configured budget.
4. **Axis grouping** happens only through `group:` in configuration, never
   automatically. Automatic merging degrades an axis agent into the failure mode
   this design rejects: two checklists in context, the rarer items systematically
   dropped.

### 5.4 `init` mode

Reads the repository — `package.json`, lint and formatter configs, `AGENTS.md`,
`CLAUDE.md`, `docs/`, directory layout — and drafts `config.md`, then asks about
gaps rather than guessing. For `saas app` it lifts `docs/review-guide.md` and
`docs/conventions.md` into axes.

Because the repository configuration is the single source of truth, `init`
**proposes** reducing `docs/review-guide.md` to a heading plus a pointer at the
new file. It never does so unasked: that document is also read by people working
without Claude.

## 6. State and artifacts in the repository

```
<repo>/.claude/review/
  config.md      # source of truth
  state.json     # checkpoint: reviewed SHA, axis rotation cursor, file cursor, triage
  reports/       # per-run raport.md, findings.json, artifact URL
```

A run writes `reports/<run-id>-raport.md` and `reports/<run-id>-findings.json`,
where the run id is `YYYY-MM-DD-HHMM`.

`state.json` is committed; `reports/` is gitignored. A report is regenerable and
noisy in a diff. Triage — "I rejected this, and here is why" — is a decision that
must not be repeated on another machine or re-explained to CI.

`state.json` shape:

```json
{
  "schema": 1,
  "last_reviewed_sha": "a1f2e30",
  "axis_cursor": ["conventions", "git-history"],
  "file_cursor": { "full": "apps/api/src/courses/" },
  "triage": [
    { "fingerprint": "security-tenant|apps/api/src/x.ts|query-without-tenant",
      "verdict": "rejected", "scope": "here",
      "reason": "Endpoint is @Public() by design, see CP-71.",
      "at": "2026-09-04", "until": null }
  ],
  "runs": [{ "id": "2026-09-04-1830", "artifact_url": "https://..." }]
}
```

## 7. Run pipeline

**0. Entry.** Resolve mode and target. Check the main model. Merge `global.md`
with `config.md`. Load `state.json`. A missing `config.md` offers `init` on an
interactive run and waits for the answer; on a non-interactive run it exits 2
immediately, because there is nobody to answer.

**1. Collect the target.**

| Mode | Command |
|---|---|
| default | `git diff` plus `git diff --cached` on the working tree |
| `branch` | `git diff $(git merge-base HEAD <base>)..HEAD` |
| `pr` | `gh pr diff <number>` |
| `since` | `git diff <last_reviewed_sha>..HEAD` |
| `full` | file listing from `file_cursor`, honouring `exclude` |

An empty target ends the run here with exit 0 and a one-line message.

**2. Reduce axes and announce the budget.** Apply §5.3. Print the plan and the
projected agent count before dispatching anything.

**3. Wave 0 — brief (Haiku).** Produces the file inventory with sizes, a change
summary, and the file-to-axis assignment derived from `when` plus a risk
heuristic, truncated to `max_files_per_axis`. Returns JSON. From here on no agent
searches for files blindly.

The risk heuristic ranks a file for an axis by, in order: changed line count in
the target (descending); how specifically the axis `when` globs match the path (a
glob naming a directory beats `**`); file size (ascending, so the truncation
sacrifices the files most expensive to read). `full` mode has no changed lines,
so it falls through to the second key and then to path order from `file_cursor`.

**4. Wave 1 — axis agents (Sonnet), dispatched in one message.** Each receives
**only** its own axis checklist, the brief, and its file list. Return shape is
fixed:

```json
{ "axis": "security-tenant",
  "file": "apps/api/src/courses/courses.service.ts",
  "lines": [88, 94], "severity": "blocking",
  "claim": "Query filters by courseId without tenantId",
  "evidence": "const course = await this.prisma.course.findFirst({ where: { id } })" }
```

`evidence` is mandatory and must be a verbatim quote from the file. A finding
without a quote is dropped before anyone scores it — the cheapest false-positive
filter available.

**5. Deduplicate and apply triage.** Findings matching a stored rejection
(fingerprint: axis + file + normalised claim; `scope: everywhere` ignores the
file component) are dropped silently and counted in the report footer.

Claim normalisation, so that two runs phrase the same defect into the same
fingerprint: lowercase, collapse whitespace, strip punctuation, drop English
stop words, keep the first twelve remaining tokens joined by `-`. Identifiers
survive intact, which is what carries the meaning — `Query filters by courseId
without tenantId` and `query filters courseId, no tenantId` both normalise to
`query-filters-courseid-tenantid`.

**6. Wave 2 — verification (Haiku), one agent per axis, batched.** The agent
receives its axis's findings and **reads the code to confirm them**, scoring each
0–100 on the rubric adopted from `/code-review`. Thresholds depend on severity:
85 for `blocking`, 70 for `suggestion` and `nitpick`. A finding that cannot be
confirmed in the file scores 0 regardless of how convincing the claim reads.

**7. Codex cross-check (main model, one external process).** The surviving
findings go to `codex exec --sandbox read-only` in a single batched call, for an
independent second opinion. Detail in §12.

**8. Editorial pass (main model).** Group by axis, order by severity, write the
Polish prose, attach `file:line` references, the configuration rule that was
broken, and the codex verdict. The main model sees only filtered, confirmed
findings with quotes.

**9. Persist and gate.** Write `findings.json`, `raport.md`, publish the artifact
when interactive, update `state.json` (new SHA, cursors), exit per `gate`.

**10. Apply fixes (interactive only).** Findings endorsed by both verification
and codex are implemented. Detail in §12.

## 8. Agent contracts

| Agent | Tools | Must return |
|---|---|---|
| brief | Read, Grep, Glob, Bash(git) | JSON: inventory, summary, axis assignment |
| axis | Read, Grep, Glob, Bash(git) when `tools` grants it | JSON array of findings with mandatory `evidence` |
| verification | Read, Grep | JSON array of `{id, confidence, note}` |

None of them receives the `Agent` tool. None of them writes files.

## 9. Output artifacts

### 9.1 `findings.json`

```json
{
  "schema": 1,
  "run": { "id": "2026-09-04-1830", "mode": "since",
           "base": "6c0b497", "head": "a1f2e30",
           "axes_run": ["security-tenant", "code-quality"],
           "axes_skipped_on_touch": ["migrations-rls"],
           "axes_deferred": ["conventions"],
           "agents_used": 5 },
  "findings": [{
    "id": "f-03", "axis": "security-tenant", "severity": "blocking",
    "confidence": 92,
    "file": "apps/api/src/courses/courses.service.ts", "lines": [88, 94],
    "evidence": "const course = await this.prisma.course.findFirst({ where: { id } })",
    "title": "Zapytanie o kurs bez filtra tenanta",
    "body": "...", "rule": "config.md#security-tenant",
    "link": "https://github.com/.../blob/a1f2e30/apps/api/...#L88-L94",
    "codex": { "verdict": "confirms",
               "reason": "findFirst has no tenantId in where; caller does not scope it either",
               "fix": "Add tenantId from TenantContextService to the where clause." },
    "triage": null
  }],
  "suppressed": []
}
```

### 9.2 `raport.md`

Polish. The header carries the coverage and spend block:

```
Osie w tym przebiegu: code-quality, security-tenant, performance-db (3 z 7).
Pominięte przez on-touch: migrations-rls, react-patterns, git-history.
Czeka w rotacji: conventions.
Zużycie: 7 agentów (1 brief + 3 osie + 3 weryfikacje).
```

Then one group per axis, findings ordered by severity. Each finding gives:
severity, `file:line`, the verbatim code quote, two or three sentences on why
this is a problem **here**, and the configuration rule it breaks.

### 9.3 Report style rules

These live in `global.md` as an editorial instruction, not in the skill author's
head. They restate the user's global explanation rules:

- Every term names its referent. Not "something gets thrown", but
  "`apiRequest` throws `ApiError(401)` at `api-client.ts:124`".
- Passive voice must not hide the actor. If something is called, set, or
  cleared, name the function or the line that does it.
- Order and causality are explicit; "before" and "after" point at lines.
- Code references always as `file:line`; quote the fragment when the fragment is
  the point.

Worked example of the intended register: not "`tenantId` is not checked", but
"`CoursesService.findOne` (`courses.service.ts:88`) calls `findFirst` with `id`
alone, so another tenant's course returns a normal 200; `TenantContextService`
is injected but unused in this method."

### 9.4 Artifact

Published only on an interactive run. Grouped by axis, severity colour, filter by
axis and severity, a counter. Links resolve to GitHub blob URLs at the reviewed
SHA when the repository has a remote; without one, `file:line` remains as
copyable text. A new artifact per run — comparing this week's run with last
week's is the point — with URLs recorded in `state.json`.

## 10. Exit codes

| Code | Meaning |
|---|---|
| 0 | Clean, or `gate: none` |
| 1 | Blocking findings survived the threshold — CI must fail |
| 2 | The run itself failed: missing `config.md`, not a git repository, unknown or unresolvable target |

`gate` takes three values: `blocking` (exit 1 while a blocking finding survives
the threshold), `any` (exit 1 on any surviving finding), `none` (always exit 0
unless the run itself failed).

Separating 1 from 2 matters: a pipeline must distinguish "the review failed you"
from "the review broke". Collapsing them ends with the gate disabled after the
third spurious failure.

## 11. Q&A and triage mode

```
/code-review-master ask              # latest report in this repository
/code-review-master ask <path>       # a specific report
```

Loads `findings.json` and the report, answers questions about individual
findings, and **reads code** (`Read`, `Grep`) when asked to justify one —
returning either firmer evidence or an admission that it was a false positive.
It dispatches no subagents; this is a conversation, not a second run.

Verdicts are written back to `findings.json` and `state.json`:

| Verdict | Effect |
|---|---|
| `accepted` | Stays open; later runs repeat it until the code changes |
| `rejected` | Silenced together with the user's one-line reason |
| `deferred` | Skipped until a given date, then returns |

Rejection scope is `here` (this file and this claim) or `everywhere` (this claim
anywhere in the repository). **The reason is mandatory** — without it the silence
in a report three months later is unreadable.

The masking risk is real: a rejection can hide a later regression. Two
counterweights — the report footer always states how many findings were
suppressed, and the mode supports `show-suppressed` and `restore <id>`.

## 12. Codex cross-check and applying fixes

### 12.1 Why a second opinion

Waves 1 and 2 are the same model family disagreeing with itself. A Sonnet
finding confirmed by a Haiku reader shares the blind spots of both. `codex`,
already installed and already used in this setup to review implementation plans,
is a genuinely independent reader — and agreement across model families is a much
stronger signal than agreement within one.

### 12.2 The call

One `codex exec --sandbox read-only` process per run, batched over every finding
that survived §7 step 6. Read-only sandbox: codex inspects the repository and
judges, it does not write.

The prompt carries, for each finding: id, axis, `file:line`, the verbatim
evidence quote, the claim, and the configuration rule it is measured against. It
asks codex to return, per finding, one of three verdicts with a one-line reason:

| Verdict | Meaning |
|---|---|
| `confirms` | Real problem; codex saw it in the code |
| `rejects` | False positive, pre-existing, or explicitly intended |
| `unsure` | Cannot judge without context the sandbox does not give it |

Codex may also attach a `fix` — a concrete change it would make. That suggestion
is advice to the implementer, never applied unread.

A missing or unusable `codex` binary is not a failed run: the stage is skipped,
every finding records `codex: "unavailable"`, and the report says so in the
header. The review still produces its report and its exit code.

### 12.3 Where the verdict lands

`findings.json` gains `codex: { verdict, reason, fix }` per finding. The report
shows the verdict next to each finding, so a finding carrying **confirmed by both
verification and codex** is visibly different from one only Claude believes in.

The verdict does not silently change the gate. A `rejects` verdict lowers a
finding to the bottom of its section and marks it `sporne` (disputed); it does
not delete the finding, because codex is a second opinion, not an authority.
Whether a disputed blocking finding still fails the gate is set by
`gate_on_disputed: true|false` in configuration, default `true` — a security
finding that two readers disagree about is exactly the one a human should see.

### 12.4 Applying fixes

Only in interactive runs, and only after the report exists and you have said to
proceed. `/code-review-master fix [ids]` implements findings that carry
`verdict: confirms` from codex and passed their confidence threshold; naming ids
narrows it further.

The implementation follows the discipline already established for codex remarks
on implementation plans:

- each fix is judged before it is written — a codex `fix` suggestion that is
  wrong is rejected, with the reason stated;
- afterwards a table is presented: finding id, what it said, the assessment,
  applied or not, and why. **A rejected remark with no stated reason is worse
  than a bad remark applied, because the trace of the decision disappears.**
- a fix that changes scope, adds a dependency, or does something irreversible is
  not the skill's to decide: it is listed separately and waits for the user.

**Nothing is committed.** Changes are left in the working tree as uncommitted
edits, per the user's standing git rule. The skill states this in its closing
summary rather than staging or committing anything.

Unattended runs — `since` from the scheduler, `pr` from CI — **never apply
fixes**. They review, report, and exit. The fix step requires a person.

## 13. Non-interactive execution

**Mode detection.** No TTY means: no artifact, no questions, and `--slots` is
refused. Output is files on disk, a summary on stdout, and an exit code. An
unattended run cannot exceed the configured budget.

**`scripts/review.ps1`** — Windows Task Scheduler, mode `since`, log into
`reports/`. The wrapper forces the main model, because the default model of a
non-interactive session is not the one that should be planning the split of work.

**`scripts/review.sh` and a GitHub Actions job** — on `pull_request`, mode
`pr <number>`; the report is posted as **a single comment updated in place**, not
a new one per push; the gate acts through the exit code. Requires
`ANTHROPIC_API_KEY` in repository secrets.

Exact `claude -p` flags (output format, permission mode, model override) are to
be read from `claude --help` during implementation rather than written from
memory.

## 14. Rollout

1. Skill, `global.md` template, and `init` mode.
2. `init` against `saas app`; migrate `docs/review-guide.md` and the relevant
   parts of `docs/conventions.md` into axes; leave the old document as a pointer
   once the user approves.
3. Interactive modes (`default`, `branch`, `since`, `full`), then the codex
   cross-check, then `ask`, then `fix`.
4. `pr` mode, wrapper scripts, the Actions job, and the scheduled task.

## 15. Decisions deliberately not taken

- **No wave queueing.** Seven axes may cost seven agents or not run at all; they
  may not run as five plus two under a "still five at a time" label.
- **No automatic axis merging.** See §5.3 item 4.
- **No unattended fixing.** `fix` requires a person. A scheduled or CI run that
  edits code while nobody watches is a different product with a different risk
  profile.
- **Codex does not get a vote on the gate by default.** Its `rejects` verdict
  marks a finding disputed and demotes it in the report; `gate_on_disputed:
  false` is available but is not the default, because a finding two readers
  disagree about is the one worth a human's minute.
- **No expiry on rejections.** A rejection persists until cleared; the footer
  count and `show-suppressed` are the mitigation, not a timer.
