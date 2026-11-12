# code-review-master extra finders — Implementation Plan 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Index:** [.claude/projects/code-review-master.md](../projects/code-review-master.md)

**Goal:** In `pr` and `branch` runs, codex (as an independent finder) and Semgrep (in Docker) add findings to the same evidence check, verification and report as the Sonnet axis agents, with each finding's source shown.

**Architecture:** Two new finder commands (`crm codex-find`, `crm semgrep`) write side files next to the run's artefacts; a detached worker started by `crm finders --start` runs both concurrently with wave 1, and `crm finders --wait` collects them. `crm assemble` reads the side files, stamps `source`, merges findings from different sources that point at the same place, and the rest of the pipeline (score, judge, fix, render, artifact) learns the new fields.

**Tech Stack:** Node 24 ESM, `node:test`, `node:child_process`, Docker (`semgrep/semgrep` image), codex CLI, gh CLI. No npm dependencies.

**Spec:** `D:\Notatki\notatki\.claude\specs\2026-11-12-code-review-master-extra-finders-design.md` (§ numbers below refer to it).

**Code root:** `C:\Users\rafal\.claude\skills\code-review-master` (`<skill>` below). All paths in tasks are relative to it unless absolute.

## Global Constraints

- Finders run only when `plan.mode` is `pr` or `branch`; every other mode returns `not-in-mode` and writes nothing (§2, §5.1, §6.2).
- No new Claude subagents; the budget `1 + 2 × selection.selected.length` and `crm finish` ledger checks are untouched (§3 G3).
- A finder failure never fails a `crm` command: it is a status (`ok | disabled | not-in-mode | nothing-to-scan | unavailable | timeout | unparsable`), exit code 0 (§3 G4, A3).
- Semgrep always runs with `--metrics=off` and `--pull=never` (§3 A4, §6.4).
- Child processes are spawned with argument arrays, never through a shell, except the existing codex `cmd.exe` fallback (`lib/codex.mjs:55-73`), whose command line carries no data.
- New defaults: `codex: { enabled: true, timeout_s: 300, find: true, find_timeout_s: 600 }`, `semgrep: { enabled: true, image: 'semgrep/semgrep:<pinned tag from Task 0>', timeout_s: 300 }` (§5.1, §6.1).
- Source names are exactly `sonnet`, `codex`, `semgrep`; tie order wherever one is needed: `sonnet`, `semgrep`, `codex` (§7).
- `findings.json`, prompts, code and comments are English; `raport.md` text and conversation are Polish; the artifact page keeps its existing English labels.
- **No commits.** `~/.claude` has no commit rule, so every change stays uncommitted for Rafal; the same for `code-busters-v2`. Never `git add`, `commit`, or `push` in either repository. Never run `docker pull` — Task 0 hands it to Rafal.
- Test command (whole suite, from `<skill>`): `CRM_GLOBAL_CONFIG=/nonexistent node --test "test/*.test.mjs"`. Baseline before Task 1: 168 pass, 1 skipped, 0 fail.

## Review Focus

1. **Repository path with spaces or backslashes** (`D:\Praca\Devstock\Projekty\code-busters-v2`) in the Docker `-v` mount, and file paths reported back with forward slashes: the scan must work and findings must name repo-relative forward-slash paths. Pinned in Task 3 (`buildSemgrepArgs` test).
2. **`pr` run while the PR is not checked out locally** (`git rev-parse HEAD` ≠ `plan.target.head`): Semgrep would scan different code than GitHub's diff describes. Expected: Semgrep status `unavailable` with reason `pr-not-checked-out`, no findings. Pinned in Task 3.
3. **A file deleted or renamed in the change** is listed in `plan.json` but absent on disk: it must be skipped by Semgrep (no Docker error for the whole axis) and a codex finding citing it is rejected by `validateFinding` as today. Pinned in Task 3.
4. **Docker daemon not running, image not pulled, or a scan that hangs**: one status each, the run continues, a timed-out container is removed by name. Pinned in Task 3.
5. **The background worker dies** (killed, crashed) before writing `<runId>-finders.json`: `crm finders --wait` must not wait forever. Expected: both finders reported `unavailable` with reason `worker-died`. Pinned in Task 5.

---

## Task 0: Semgrep probe and image pin (with Rafal)

Not code. Produces the pinned tag and a real output fixture the later tasks test against.

**Files:**
- Create: `test/fixtures/semgrep-secrets-output.json`
- Create: `test/fixtures/semgrep-probe/leak.js` (one line: `const awsKey = "AKIAIOSFODNN7EXAMPLE";` — the AWS documentation example key, not a real one)

- [ ] **Step 1: Choose the tag.** Look up `semgrep/semgrep` tags on Docker Hub; pick the newest semver tag at least two weeks older than the day of execution. Record it in the Task 1 default.
- [ ] **Step 2: Hand the pull to Rafal.** Stop and ask Rafal to run `! docker pull semgrep/semgrep:<tag>`, explaining: downloads the image (several hundred MB) into the local Docker store; undo with `docker image rm semgrep/semgrep:<tag>`. Wait for his answer.
- [ ] **Step 3: Probe.** From `<skill>`:
  `docker run --rm --pull=never -v "<abs path of test/fixtures/semgrep-probe>:/src:ro" -w /src semgrep/semgrep:<tag> semgrep scan --metrics=off --json --quiet --config p/secrets leak.js`
  Expected: exit 0, JSON with `results[0].check_id`, `results[0].start.line`, `results[0].extra.severity`, `results[0].extra.message`. Note whether `extra.lines` is `"requires login"`.
- [ ] **Step 4: Save** the stdout as `test/fixtures/semgrep-secrets-output.json` (unchanged). If `p/secrets` returns no result or demands login, stop and report to Rafal before Task 3 — §6.3 depends on it.
- [ ] **Step 5: Probe the two failure shapes** and note exit code + stderr first line in the task report: (a) the same command with a non-existent tag (`semgrep/semgrep:0.0.0-missing`), (b) Docker Desktop stopped — **only if Rafal agrees to stop it**; otherwise take the shape from Docker docs and mark it unverified.

---

## Task 1: Configuration keys

**Files:**
- Modify: `lib/config.mjs:3-17` (`DEFAULT_SETTINGS`), `:31-46` (`sectionToAxis`), `:66-85` (`mergeConfig`), `:87-119` (`validateConfig`)
- Modify: `package.json` (test script)
- Test: `test/config.test.mjs`

**Interfaces:**
- Produces: `axis.semgrep: string[]` (default `[]`); `settings.codex.find: boolean`, `settings.codex.find_timeout_s: number`; `settings.semgrep: { enabled: boolean, image: string, timeout_s: number }`.

- [ ] **Step 1: Write failing tests** in `test/config.test.mjs`:
  - `an axis may list semgrep rule packs` — a section with ```` ```yaml\nid: s\nsemgrep: [p/secrets, p/security-audit]\n``` ```` parses to `axis.semgrep` deep-equal `['p/secrets', 'p/security-audit']`; an axis without the key has `[]`.
  - `a semgrep value that is not a list of non-empty strings is a configuration error` — `semgrep: p/secrets` (string) and `semgrep: ['']` each produce a problem containing `semgrep`.
  - `codex and semgrep settings merge key by key` — repo frontmatter `semgrep: { timeout_s: 60 }` keeps the default `image` and `enabled: true`; global `codex: { find: false }` + repo `codex: { timeout_s: 10 }` gives `find: false, timeout_s: 10, find_timeout_s: 600`.
  - `the semgrep image must be pinned` — `semgrep: { image: 'semgrep/semgrep:latest' }` and `semgrep: { image: 'semgrep/semgrep' }` each produce a problem containing `pinned`.
- [ ] **Step 2: Run** `node --test test/config.test.mjs` — expect the four new tests to FAIL.
- [ ] **Step 3: Implement** the defaults, `semgrep: meta.semgrep ?? []` in `sectionToAxis`, a `semgrep` merge line mirroring `codex`, and the two validations (image must contain `:` followed by something other than `latest`).
- [ ] **Step 4: Fix the test script** in `package.json` to `"test": "node --test \"test/*.test.mjs\""` (Node 24 rejects a bare directory: `Cannot find module '…\test'`).
- [ ] **Step 5: Run** the whole suite — expect 172 pass, 1 skipped, 0 fail.

---

## Task 2: Changed-line hunks and the PR number in `plan.json`

**Files:**
- Create: `lib/hunks.mjs`
- Modify: `bin/crm.mjs` `plan` (around `:162`, the returned object)
- Test: `test/hunks.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Produces:
  - `parseHunks(patch: string): Map<string, Array<[number, number]>>` — new-side added line ranges per file from a unified diff with any context size; a `+c,0` hunk adds nothing; path from the `+++ b/<path>` line; `+++ /dev/null` files are absent.
  - `overlapsHunks(hunks: Map, file: string, lines: [number, number]): boolean`
  - `changedHunks({ repo: string, plan: object, git?: (args: string[]) => string, gh?: (args: string[]) => string }): Map | null` — `branch`: `git -C <repo> diff -U0 <plan.target.base> HEAD`; `pr`: `gh pr diff <plan.pr>`; `null` when the call throws.
  - `plan.json` gains `pr: number | null`.

- [ ] **Step 1: Write failing tests** in `test/hunks.test.mjs`:
  - `added ranges are read from the new side` — patch with `@@ -3,0 +4,2 @@` and `@@ -10 +12 @@` for `+++ b/a.ts` → `[[4, 5], [12, 12]]`.
  - `a pure deletion adds no range` — `@@ -7,2 +6,0 @@` → no range for that file.
  - `a deleted file is absent` — `+++ /dev/null` → `hunks.has(path)` false.
  - `overlap is inclusive at both ends` — ranges `[[4, 5]]`: `[5, 9]` true, `[6, 9]` false, `[1, 4]` true.
  - `changedHunks returns null when the diff cannot be computed` — injected `gh` throws → `null`.
  - `changedHunks asks gh for the PR diff in pr mode` — injected `gh` records args → `['pr', 'diff', '42']`.
- [ ] **Step 2: Write a failing CLI test** in `test/cli.test.mjs`: `a branch plan records pr as null` — `plan --mode branch` writes `pr: null` into `plan.json` (the `pr` path needs a live `gh` and is covered by the `changedHunks` test above).
- [ ] **Step 3: Run** both files — new tests FAIL.
- [ ] **Step 4: Implement** `lib/hunks.mjs` and add `pr: args.pr === undefined ? null : Number(args.pr)` to the `plan` result.
- [ ] **Step 5: Run** the whole suite — all pass.

---

## Task 3: Semgrep finder

**Files:**
- Create: `lib/semgrep.mjs`
- Modify: `bin/crm.mjs` (new command `semgrep`)
- Test: `test/semgrep.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Consumes: `axis.semgrep`, `settings.semgrep` (Task 1); `changedHunks`, `overlapsHunks` (Task 2); `plan.json` `selection.selected[]` (`axisId`, `axes[]`, `files[]`), `target.head`, `mode`.
- Produces:
  - `buildSemgrepArgs({ repo: string, image: string, name: string, packs: string[], files: string[] }): string[]` — the `docker` argv: `run --rm --pull=never --name <name> -v <repo>:/src:ro -w /src <image> semgrep scan --metrics=off --json --quiet --config <p1> … <file> …`, files with `\` turned into `/`.
  - `mapSemgrepResults(output: object, { axisId: string, sourceOf: (path) => string }): Finding[]` — §6.2 mapping: `axis = axisId`, `lines = [start.line, end.line]`, `evidence` = those lines read through `sourceOf` joined with `\n`, `severity` from `ERROR|CRITICAL|HIGH → blocking`, `WARNING|MEDIUM → suggestion`, `INFO|LOW → nitpick`, anything else `suggestion`; `claim` = first sentence of `extra.message` + ` (semgrep: <check_id>)`; `rule = check_id`.
  - `runSemgrep({ repo, plan, settings, spawn?, hunks, headOf? }): { status, findings, scannedAxes: string[], outsideChange: number, hunksAvailable: boolean, image: string, reason?: string }` — rules come from each selected entry's member `axes[].semgrep`; `scannedAxes` lists member axis ids; `image` is echoed for the report line.
  - Side files: `<runId>-semgrep-raw.json` (array), `<runId>-semgrep-status.json` (the object without `findings`, plus `found`).
  - Command `crm semgrep --run <runId>` returns the status object.

Behaviour `runSemgrep` must have (tests below pin each):
- Mode not `pr`/`branch` → `not-in-mode`; `settings.semgrep.enabled === false` → `disabled`; no selected axis with a non-empty `semgrep` list and at least one existing file → `nothing-to-scan`.
- `pr` mode and `headOf(repo) !== plan.target.head` → `unavailable`, `reason: 'pr-not-checked-out'`.
- Files absent on disk are skipped before building args.
- One `docker` call per (slot, member axis with rules); container name `crm-<runId>-<n>`; per-call timeout = what is left of `settings.semgrep.timeout_s`.
- spawn `error.code === 'ENOENT'` → `unavailable`, `reason: 'docker-missing'`; non-zero exit with stderr matching `/No such image|Unable to find image/i` → `unavailable`, `reason: 'image-not-pulled'`; other non-zero exit → `unavailable`, `reason: 'docker-error'`; `ETIMEDOUT` → spawn `docker rm -f <name>`, status `timeout`; stdout not JSON → `unparsable`. Findings collected before a failing call are discarded (status is about the whole command).
- With `hunks` a Map: keep findings overlapping a hunk, count the rest in `outsideChange`; with `hunks === null`: keep all, `hunksAvailable: false`.

- [ ] **Step 1: Write failing tests** in `test/semgrep.test.mjs` (all with injected `spawn`, never real Docker):
  - `args mount the repository read-only and never pull` — repo `D:\\Praca\\My Repo`, files `['apps\\cms\\a.ts']` → argv contains `-v`, `D:\\Praca\\My Repo:/src:ro`, `--pull=never`, `--metrics=off`, `apps/cms/a.ts`; no element contains a shell metacharacter added by us.
  - `the probe output maps to a blocking secrets finding` — load `test/fixtures/semgrep-secrets-output.json`, `sourceOf` returning the probe file → one finding, `severity: 'blocking'`, `axis` equal to the passed `axisId`, `evidence` equal to the fixture line, `claim` ending with `(semgrep: <check_id>)`, `extra.lines` not used.
  - `a grouped slot labels findings with the slot id` — `axisId: 'cms-security+cms-data'` → finding `axis === 'cms-security+cms-data'`.
  - `results outside the change are counted, not kept` — hunks `{a.ts: [[10, 12]]}`, results at lines 11 and 40 → 1 finding, `outsideChange: 1`.
  - `without hunks nothing is filtered and the status says so` — `hunks: null` → both kept, `hunksAvailable: false`.
  - `a missing file is not handed to docker` — plan lists `gone.ts` (absent) and `a.ts` → spawned argv has `a.ts` and not `gone.ts`.
  - `a pr run on a different checkout does not scan` — `headOf` returns `abc`, `plan.target.head` `def` → `unavailable`, `pr-not-checked-out`, spawn never called.
  - `docker missing, image missing, daemon error, timeout, garbage` — five cases → statuses/reasons as listed above; the timeout case's second spawn call is `['rm', '-f', 'crm-<runId>-0']`.
- [ ] **Step 2: Write failing CLI tests** in `test/cli.test.mjs`:
  - `semgrep is not-in-mode outside pr and branch` — `plan --mode working` then `semgrep --run <id>` → `{ status: 'not-in-mode' }`, no `-semgrep-raw.json` file.
  - `semgrep with no rules in the plan has nothing to scan` — `branch` run, config without `semgrep:` → `nothing-to-scan`, status file written.
- [ ] **Step 3: Run** both files — new tests FAIL.
- [ ] **Step 4: Implement** `lib/semgrep.mjs` and the command (`headOf` default: `git -C <repo> rev-parse HEAD`; `hunks` from `changedHunks`).
- [ ] **Step 5: Run** the whole suite — all pass.

---

## Task 4: codex as a finder

**Files:**
- Create: `prompts/codex-find.md`
- Modify: `lib/codex.mjs` (extract spawn, add finder functions), `bin/crm.mjs` (new command `codex-find`)
- Test: `test/codex.test.mjs`, `test/prompts.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Consumes: `settings.codex.find`, `settings.codex.find_timeout_s` (Task 1).
- Produces:
  - `spawnCodex(prompt: string, { cwd, timeoutMs, binary?, spawn?, platform? }): { status: 'ok' | 'unavailable' | 'timeout', stdout: string, raw: string }` — the body of today's `runCodex` up to (not including) parsing. `runCodex` keeps its signature and return shape and calls it; existing `codex.test.mjs` tests stay green unchanged.
  - `buildCodexFindPrompt(selected: SelectedEntry[]): string` — fills `{{AXES}}` with, per entry: `### <axisId>`, severity default(s) (same wording rule as SKILL.md Step 4 `{{SEVERITY_DEFAULT}}`), the checklist(s) (same concatenation rule as `{{CHECKLIST}}`), and its files one per line as `path (+added/-removed)`.
  - `parseCodexFindings(stdout: string, selected: SelectedEntry[]): { findings: Finding[], droppedOffAxis: number } | null` — last parseable JSON array in stdout; drops a finding whose `axis` is not a selected `axisId` or whose `file` is not in that entry's `files`; keeps an optional `fix` string; `null` when no array parses.
  - `runCodexFind(selected, { cwd, timeoutMs, spawn?, platform? }): { status, findings, droppedOffAxis, raw }`
  - Side files: `<runId>-codex-raw.json`, `<runId>-codex-find-status.json` (`{ status, found, droppedOffAxis }`).
  - Command `crm codex-find --run <runId>`: `not-in-mode` / `disabled` (when `codex.enabled` or `codex.find` is false) as in §5.1, else runs with `find_timeout_s`.

`prompts/codex-find.md` content requirements (§5.3): reviewer role over the listed axes only; judge only against each axis's checklist; return only a JSON array of `{"axis", "file", "lines", "severity", "claim", "evidence", "fix"}` where `axis` is one of the listed axis ids verbatim and `fix` is one sentence or null; the `lines`/`evidence` rules copied from `prompts/axis.md:37-52`; `[]` is a valid answer; "Do not dispatch or spawn any further agents. Do not modify any file."

- [ ] **Step 1: Write failing tests** in `test/codex.test.mjs`:
  - `the find prompt lists every selected axis with its checklist and files` — two entries (`security`, `cms-security+cms-data` with two member axes) → prompt contains both ids as headings, both member checklists, `a.ts (+3/-1)`.
  - `findings are parsed from the last array in the output` — stdout `notes [1] ... [{"axis":"security","file":"a.ts",...}] done` → one finding.
  - `a finding on an axis or file outside the plan is dropped and counted` — one finding with `axis: 'other'`, one with `file: 'z.ts'` not in the entry → `findings.length === 0`, `droppedOffAxis === 2`.
  - `unparsable output is reported, not thrown` — `runCodexFind` with spawn returning `status 0, stdout 'no json'` → `status: 'unparsable'`.
  - `the finder reuses the Windows fallback` — spawn fails first with ENOENT on `win32` → second call is `cmd.exe /d /s /c codex exec --sandbox read-only -`, prompt only on stdin.
- [ ] **Step 2: Write a failing prompt test** in `test/prompts.test.mjs`: `the codex finder prompt fixes the return shape and forbids edits` — `codex-find.md` matches `/verbatim/i`, `/"fix"/`, `/\[\]/`, `/do not modify any file/i`, `/{{AXES}}/`.
- [ ] **Step 3: Write failing CLI tests**: `codex-find is not-in-mode outside pr and branch`; `codex-find honours codex.find: false` (branch run, config frontmatter `codex: { find: false }` → `disabled`, status file written, no raw file).
- [ ] **Step 4: Run** the three files — new tests FAIL.
- [ ] **Step 5: Implement** the prompt, `spawnCodex` extraction, finder functions and command.
- [ ] **Step 6: Run** the whole suite — all pass, including every pre-existing `codex.test.mjs` test unchanged.

---

## Task 5: Running both finders concurrently (`crm finders`)

**Files:**
- Modify: `bin/crm.mjs` (commands `finders`, `finders-worker`)
- Test: `test/cli.test.mjs`

**Interfaces:**
- Consumes: commands `codex-find`, `semgrep` (Tasks 3–4).
- Produces:
  - `crm finders --run <id> --start` → `{ started: true }`, or `{ started: false, reason: 'not-in-mode' }`. Spawns `process.execPath <skill>/bin/crm.mjs finders-worker --run <id> --repo <repo>` with `detached: true, stdio: 'ignore', windowsHide: true`, then `unref()`, and writes `<runId>-finders.pid` (the worker's pid).
  - `crm finders-worker` (internal): starts `codex-find` and `semgrep` as two concurrent child processes (async `spawn`, `--json`), parses each stdout line, and when both exit writes `<runId>-finders.json`: `{ codexFind: <status object>, semgrep: <status object>, finishedAt: ISO }`. A child that exits non-zero or prints no JSON becomes `{ status: 'unavailable', reason: 'command-failed' }` for that finder.
  - `crm finders --run <id> --wait [--max-s <n>]` (default 500): returns the content of `<runId>-finders.json` as soon as it exists; `{ status: 'pending' }` after `--max-s`; `{ codexFind: { status: 'unavailable', reason: 'worker-died' }, semgrep: { … same } }` — and writes that to `<runId>-finders.json` — when the pid in `<runId>-finders.pid` is no longer alive (`process.kill(pid, 0)` throws `ESRCH`) and the file is still missing. Sleep between checks without busy-waiting (`Atomics.wait` on a `SharedArrayBuffer`, 1 s).
  - `--wait` without a prior `--start` (no pid file, no result file) → exit 2 via `fail()` with a message naming `crm finders --start`.

- [ ] **Step 1: Write failing CLI tests** in `test/cli.test.mjs` (throwaway repo with a `main` commit and a feature branch commit; config frontmatter `codex: { enabled: false }`, no `semgrep:` axes, so the worker finishes in well under a second):
  - `finders start returns at once and wait collects both statuses` — `plan --mode branch`, `finders --start` → `started: true`; `finders --wait --max-s 20` → `codexFind.status === 'disabled'`, `semgrep.status === 'nothing-to-scan'`.
  - `finders do not start outside pr and branch` — `working` plan → `started: false`, `reason: 'not-in-mode'`, no pid file.
  - `a dead worker is reported, not waited on` — write `<runId>-finders.pid` containing a pid that is not alive (spawn `process.execPath -e ""`, wait for it to exit, use its pid) and no result file → `finders --wait --max-s 20` returns within 5 s with both `reason: 'worker-died'`.
  - `wait without start is a broken run` — exit code 2, stderr matches `/finders --start/`.
- [ ] **Step 2: Run** `node --test test/cli.test.mjs` — new tests FAIL.
- [ ] **Step 3: Implement** both commands. `finders-worker` is the only async command; the dispatcher at the bottom of `bin/crm.mjs` must await a returned promise before printing.
- [ ] **Step 4: Run** the whole suite — all pass; no orphan `node` processes left after the suite (check Task Manager or `tasklist | findstr node` before/after).

Note: the wrappers need no change — `scripts/review.ps1:114` already allows `Bash(node *)`, and Docker, codex and gh are spawned by `crm`, not by the session (§5.2 asked to check this).

---

## Task 6: Sources and agreement in `assemble`

**Files:**
- Modify: `lib/findings.mjs` (`dedupe`, `assemble`, new `mergeAgreement`), `bin/crm.mjs` `assemble` (`:217-237`)
- Test: `test/findings.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Consumes: side files `<runId>-codex-raw.json`, `<runId>-semgrep-raw.json` (Tasks 3–4).
- Produces, on every assembled finding: `sources: string[]` (sorted by tie order), `keptFrom: string`, `alsoClaimed: Array<{ source, claim, severity, fix }>`; `fix` from the codex finder kept on the finding when codex's claim is kept.
  - `mergeAgreement(findings: Finding[]): Finding[]` — §7 algorithm below.
  - `crm assemble` result gains `rejectedBySource: { sonnet: n, codex: n, semgrep: n }` and each `rejectedForEvidence` entry gains `source`.

`mergeAgreement` algorithm (the tests determine everything else):
```
order input by source tie order (sonnet, semgrep, codex), then file, then lines[0]
clusters = []
for f in input:
  candidates = clusters where axis == f.axis and file == f.file
               and f.source not in cluster.sources and lines overlap cluster.span
  pick the candidate with the largest overlap (first on a tie), else open a new cluster
  add f; cluster.span = union span
for each cluster: kept = highest severity, tie by source order;
  result = { ...kept, lines: span, sources, keptFrom: kept.source,
             alsoClaimed: others.map(o => ({ source, claim, severity, fix: o.fix ?? null })) }
```

- [ ] **Step 1: Write failing tests** in `test/findings.test.mjs`:
  - `a finder's own source field is overwritten by the file it came from` — codex raw finding with `source: 'sonnet'` → assembled `sources` deep-equal `['codex']`.
  - `findings from two sources on overlapping lines merge into one` — sonnet `a.ts [10, 14]` suggestion, codex `a.ts [12, 20]` blocking, same axis → one finding, `lines [10, 20]`, `severity 'blocking'`, `keptFrom 'codex'`, `sources ['sonnet', 'codex']`, `alsoClaimed[0].source === 'sonnet'`.
  - `adjacent lines, another file or another axis do not merge` — `[10, 14]` vs `[15, 20]`; same lines other file; same lines other axis → three pairs stay separate.
  - `two findings of one source never merge through a third` — sonnet `[10, 12]` and sonnet `[14, 16]`, codex `[11, 15]` → two findings remain; codex joins the one with larger overlap (tie → first, `[10, 12]`).
  - `equal severity keeps the sonnet claim` — sonnet and semgrep both blocking → `keptFrom 'sonnet'`.
  - `an exact duplicate across sources unions sources` — identical claim and evidence from sonnet and codex → one finding, both sources.
- [ ] **Step 2: Write a failing CLI test**: `assemble reads the finder side files and counts rejections per source` — branch run; `-raw.json` with one valid sonnet finding; `-codex-raw.json` with one finding whose evidence is invented; `-semgrep-raw.json` absent → `findings.length 1`, `rejectedBySource.codex === 1`, `rejectedBySource.semgrep === 0`.
- [ ] **Step 3: Run** both files — new tests FAIL.
- [ ] **Step 4: Implement.** `sources`, `keptFrom`, `alsoClaimed` are assigned in `assemble` after everything a finder could emit, next to `id`, `codex`, `triage` (`lib/findings.mjs` comment in `assemble`). Existing tests that deep-equal assembled findings get the three new fields added to their expectations — that is the only permitted edit to existing tests in this task.
- [ ] **Step 5: Run** the whole suite — all pass.

---

## Task 7: Judge exclusion and `fix` eligibility

**Files:**
- Modify: `bin/crm.mjs` `codex` (`:262-283`), `lib/fixable.mjs`
- Test: `test/fixable.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Consumes: `keptFrom`, `sources`, `fix` (Task 6).
- Produces: `finding.codex = { verdict: 'own', reason: 'found by codex — not cross-checked', fix: finding.fix ?? null }` for `keptFrom === 'codex'`; `crm codex` sends only the others to `buildCodexPrompt`; when none are left it records `codexStatus: 'nothing-to-judge'` without calling codex. `selectFixable` skip reason for a codex-only finding: exactly `found only by codex — no independent second opinion`.

- [ ] **Step 1: Write failing tests** in `test/fixable.test.mjs`:
  - `codex's own finding confirmed by another source is fixable` — `codex.verdict 'own'`, `sources ['sonnet', 'codex']`, `confidence 90` → in `fixable`.
  - `codex's own finding with no other source is skipped with the reason` — `sources ['codex']` → in `skipped` with the exact reason above.
- [ ] **Step 2: Write a failing CLI test**: `the judge skips findings whose kept claim is codex's` — `plan --mode branch`, then write `<runId>-findings.json` holding one finding with `keptFrom 'codex'` and nothing else, then `codex --run <id>` → `{ status: 'nothing-to-judge' }` (codex is never spawned, so the test needs no codex install) and the stored finding has `codex.verdict === 'own'`.
- [ ] **Step 3: Run** — new tests FAIL.
- [ ] **Step 4: Implement.**
- [ ] **Step 5: Run** the whole suite — all pass.

---

## Task 8: Report and artifact

**Files:**
- Modify: `lib/report.mjs`, `bin/crm.mjs` `render` and `artifact` (pass finder statuses), `templates/artifact.html`
- Test: `test/report.test.mjs`, `test/artifact.test.mjs`

**Interfaces:**
- Consumes: `<runId>-finders.json` (Task 5) — read by `render` and `artifact` when it exists, passed as `finders`; finding fields from Tasks 6–7.
- Produces: `renderReport({ …existing, finders = null })`; artifact payload gains `finders` and each finding keeps `sources`, `alsoClaimed`.

Exact Polish copy (report). `{n uwag}` means the existing `plural()` with `uwaga`/`uwagi`/`uwag`:
- codex finder, under the existing codex note: `ok` → `codex jako szukający: {n uwag} przed weryfikacją.`; `disabled` → `codex jako szukający wyłączony w konfiguracji.`; `unavailable` → `**codex jako szukający niedostępny** — uwagi pochodzą tylko od pozostałych źródeł.`; `timeout` → `**codex jako szukający przekroczył limit czasu** — uwagi pochodzą tylko od pozostałych źródeł.`; `unparsable` → `**odpowiedź codexa jako szukającego nieczytelna** — uwagi pochodzą tylko od pozostałych źródeł.`
- Semgrep: `ok` → `Semgrep (osie: {scannedAxes}): {n uwag} w zmienionych liniach, {outsideChange} poza zmianą pominięto.`, plus ` Filtr zmienionych linii niedostępny — wyniki niefiltrowane.` when `hunksAvailable` is false; `nothing-to-scan` → `Semgrep: żadna oś w tym przebiegu nie ma reguł.`; `disabled` → `Semgrep wyłączony w konfiguracji.`; `unavailable` + `image-not-pulled` → `**Semgrep niedostępny**: brak obrazu \`{image}\` — uruchom raz \`docker pull {image}\`.`; `unavailable` + `pr-not-checked-out` → `**Semgrep pominięty**: lokalny checkout nie jest tipem PR-a.`; other `unavailable` → `**Semgrep niedostępny** (Docker nie działa albo nie jest zainstalowany).`; `timeout` → `**Semgrep przekroczył limit czasu.**`
- Either finder `worker-died` → `**proces szukających przerwał pracę** — brak uwag od codexa jako szukającego i od Semgrepa.` (one line instead of both).
- Mode `pr`/`branch` with `finders === null` → `**krok szukających nie został wykonany** — uwagi pochodzą tylko od agentów Sonnet.`
- Sources line, only when `finders` is present: `Źródła uwag: sonnet {a}, codex {b}, semgrep {c}; wskazane przez więcej niż jedno źródło: {d}.` (counts over kept findings, a finding counted once per source in `sources`).
- Per-finding badge after the codex badge: `źródło: {sources joined with +}`; `CODEX_LABEL.own = 'codex: własne znalezisko'`.
- Under the evidence, for each `alsoClaimed`: `_Też w tym miejscu ({source}):_ {claim}`.
- Artifact (English, like its existing labels): `CODEX_LABEL.own = 'Codex: own finding'`; a `source` badge with the joined sources; a third `<select data-filter="source">` with options built from the sources present; finder status lines mirroring the report's meaning in English.

- [ ] **Step 1: Write failing tests** in `test/report.test.mjs`:
  - `each finder outcome is named for what it was` — table-driven over the statuses above; asserts the exact Polish line for each and that no raw enum (`/\b(unavailable|timeout|unparsable|not-in-mode)\b/`) appears.
  - `a finding shows its sources and what else was claimed at that place` — `sources ['sonnet','codex']`, one `alsoClaimed` → `źródło: sonnet+codex` and `_Też w tym miejscu (sonnet):_`.
  - `codex's own finding is not labelled as confirmed` — `codex.verdict 'own'` → contains `codex: własne znalezisko`, not `codex: potwierdza`.
  - `a working-mode report says nothing about finders` — mode `working`, `finders null` → no `szukając` and no `Źródła uwag`.
  - `a pr report whose finders never ran says so` — mode `pr`, `finders null` → the `krok szukających nie został wykonany` line.
- [ ] **Step 2: Write failing tests** in `test/artifact.test.mjs`: `the page carries sources and a source filter` — generated page contains `data-filter="source"` and the embedded payload has `findings[0].sources`.
- [ ] **Step 3: Run** both files — new tests FAIL.
- [ ] **Step 4: Implement.** Existing report/artifact tests keep passing unchanged.
- [ ] **Step 5: Run** the whole suite — all pass.

---

## Task 9: SKILL.md, configs, PURPOSE.md

**Files:**
- Modify: `SKILL.md` (Steps 1, 4, 5, 7, 10, Mode `fix`, Rules), `templates/global.md` (`secrets` axis), `PURPOSE.md` (Historia ewolucji), `test/skill.test.mjs`
- Modify (outside `<skill>`): `C:\Users\rafal\.claude\review\global.md` (`secrets` axis), `D:\Praca\Devstock\Projekty\code-busters-v2\.claude\review\config.md` (`cms-security` axis, around `:228-234`)

**Interfaces:**
- Consumes: every command and status from Tasks 3–8.

- [ ] **Step 1: Write failing tests** in `test/skill.test.mjs`:
  - `finders start before wave 1 and are collected before assemble` — the Step 4 section contains `crm finders --run <runId> --start`; the Step 5 section contains `crm finders --run <runId> --wait` and `pending`.
  - `the judge skips codex's own findings` — the Step 7 section matches `/own/` and `/keptFrom/`.
  - `the budget line names the extra finders outside the agent budget` — Step 1 section contains `Dodatkowo (poza budżetem agentów)`.
  - `the global template gives the secrets axis the secrets rule pack` — `templates/global.md` `secrets` block parses (via `parseConfigDoc`) to `semgrep: ['p/secrets']`.
- [ ] **Step 2: Run** `node --test test/skill.test.mjs` — new tests FAIL.
- [ ] **Step 3: Edit SKILL.md:**
  - Step 1: after the budget line, in `pr`/`branch` runs only, the second line `Dodatkowo (poza budżetem agentów): codex jako szukający, Semgrep dla osi: {member axis ids with non-empty semgrep in the selected entries, comma-separated, or —}.`
  - Step 4: before dispatching wave 1, in `pr`/`branch` runs, run `crm finders --run <runId> --start`; neither finder is an agent, never logged with `crm dispatched`.
  - Step 5: first `crm finders --run <runId> --wait`, repeated while it returns `pending`; then `crm assemble` as today; the one-line message gives `rejectedForEvidence` per source from `rejectedBySource`.
  - Step 7: `crm codex` judges only findings whose `keptFrom` is not `codex`; those get verdict `own`, which is not a second opinion.
  - Step 10: headline counts add the per-source split.
  - Mode `fix` step 2: a finding with verdict `own` is fixable only with a second source; the reason string from Task 7.
  - Rules that do not bend: one bullet — "Extra finders (codex as a finder, Semgrep) run only in `pr` and `branch`, are not agents, and their findings pass `crm assemble` and wave 2 like Sonnet's."
- [ ] **Step 4: Edit configs:** add `semgrep: [p/secrets]` to the `secrets` YAML block in `templates/global.md` and in `C:\Users\rafal\.claude\review\global.md`; add `semgrep: [p/security-audit]` to the `cms-security` YAML block in `code-busters-v2/.claude/review/config.md`. Format nothing else in those files.
- [ ] **Step 5: PURPOSE.md:** one "Historia ewolucji" line in the existing format: date 2026-11-12 (or the build date), what changed, why (more certainty on important PRs, decisions in the spec §2), result, source: the spec path and this plan's path.
- [ ] **Step 6: Run** the whole suite — all pass. Then `node bin/crm.mjs plan --repo D:/Praca/Devstock/Projekty/code-busters-v2 --mode branch --json` → exit 0 (the edited `config.md` validates); delete the `plan.json` it wrote under `code-busters-v2/.claude/review/reports/`.

---

## Task 10: Acceptance (with Rafal)

Manual, interactive, in a session in `D:\Praca\Devstock\Projekty\code-busters-v2`. Report results in `D:\Notatki\notatki\.claude\specs\YYYY-MM-DD-code-review-master-extra-finders-plan-1-acceptance.md` and update the project index.

- [ ] **Run A — `branch`:** on a branch Rafal names, Docker running, image pulled. Pass when: the budget line shows the `Dodatkowo` line; `raport.md` shows a codex-finder line and a Semgrep line with status `ok` (or a named, true reason); at least one finding shows `źródło:`; `crm finish` exit 0 or 1 (not 2).
- [ ] **Run B — `pr <n>`:** a PR Rafal names, checked out locally. Same pass criteria; additionally the Semgrep line counts `poza zmianą`.
- [ ] **Run C — Docker stopped** (Rafal stops Docker Desktop): `pr <n>` again. Pass when the Semgrep line reads `Semgrep niedostępny …` and the run completes.
- [ ] **Wall-clock note:** record each run's duration and the codex finder's share (from `<runId>-finders.json` `finishedAt` vs plan time) to judge cost; nothing is changed on that basis in this plan.
