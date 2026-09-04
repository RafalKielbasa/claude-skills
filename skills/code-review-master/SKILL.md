---
name: code-review-master
description: Use for an automated, multi-agent code review of a repository — triggers like "zrób review", "sprawdź kod", "code review this branch/PR", an explicit `/code-review-master` invocation, and unattended nightly or CI invocations of it. Reviews a bounded set of axes (security, quality, conventions, whatever `.claude/review/config.md` defines) with a subagent budget that is computed and announced before anything is dispatched, then writes a Polish report. NOT for reviewing a course student's homework against a task's acceptance criteria — that is `review-pracy-domowej`. NOT the bundled `/code-review` plugin, which is a different, single-session reviewer with no fixed subagent budget.
---

# code-review-master

Throughout this document:

- `<skill>` means the directory this file lives in — `~/.claude/skills/code-review-master`.
- `<repo>` means the repository under review — the current working directory unless the user names another path.
- `crm <cmd> ...` is shorthand for `node <skill>/bin/crm.mjs <cmd> --repo <repo> ...`. Always add `--json` so the output is one machine-readable line; parse it with your own JSON reading, never by eye.
- `<runId>` is the `runId` field `crm plan` returned for this run. Every later `crm` call in the same run passes `--run <runId>`.

## Overview

This skill runs a fixed-axis code review of `<repo>` by dispatching Sonnet agents to find issues and Haiku agents to verify and summarize them, then hands the survivors to `codex` for a second opinion before writing a Polish report. The subagent budget for a run is `selection.agents` — always `1 + 2 × selection.selected.length` — computed once by `bin/crm.mjs` before a single agent runs, and it is not negotiable by this document or by the user mid-run; the only way to change it is `--slots`, applied before dispatch in Step 2 and never after. This document, `findings.json`, `state.json`, and every prompt filled in below are English; `raport.md` and whatever this skill says to the user in conversation are the only two things that are Polish.

## Invocation

| Command | Reviews |
|---|---|
| `/code-review-master` | Uncommitted changes — staged, unstaged, and untracked (`--mode working`). The default ad hoc review. |
| `/code-review-master branch [ref]` | Everything on the current branch since it diverged from `ref` (default `main`). |
| `/code-review-master pr <n>` | The files PR `<n>` changes, read from `gh pr view`. |
| `/code-review-master since` | Everything since `state.json`'s `last_reviewed_sha` — the incremental/nightly mode. |
| `/code-review-master full [path]` | The whole tree, or `path` within it, paged across runs by `state.json`'s `file_cursor`. |
| `/code-review-master ask [path]` | Questions about the latest report (or the run at `path`) and triage verdicts. Dispatches no agents — see "Mode `ask`" below. |
| `/code-review-master fix [ids]` | Applies codex-confirmed fixes from the latest run. Interactive only — see "Mode `fix`" below. |
| `/code-review-master init` | Drafts `.claude/review/config.md` for a repository that has none — see "Mode `init`" below. |

Any command may end with `--slots <n>`, honoured only as described in Step 2.

## Step 0 — check the main model

The skill does not choose which model this session runs on — the session does, before this document is ever loaded. If the session is running on Haiku or Sonnet, say one line to the user (in Polish, like every line this skill says to the user): planning and prose will be weaker on this model, and Opus or Fable is the model this skill is designed for. Then continue with the review on whatever model is actually running. Never refuse over it — a weaker model finishing the review is worth more than a refusal blocking it.

## Step 1 — plan

Before the first `crm plan` of a fresh session, make sure the universal axes exist: if `~/.claude/review/global.md` is absent, copy `<skill>/templates/global.md` there. Skip silently when it is already present — it may carry the user's own edits, and this skill never overwrites it. Without this file the `secrets` and `debug-leftovers` axes, and the report's register rules, are silently missing from every repository, not just this one.

Run `crm plan --mode <mode> ...` with exactly the extra flags the mode needs, nothing more:

- `working` (bare `/code-review-master`) — no extra flags.
- `branch [ref]` — `--base <ref>` only when the user named one; omit it to let `crm plan` default to `main`.
- `pr <n>` — `--pr <n>`, required.
- `since` — no extra flags; `crm plan` reads the base from `state.json` itself.
- `full [path]` — `--path <p>` only when the user named a subpath.

Read the result:

- **Exit code 2** — `crm plan` refused to run in a way it recognized: no `.claude/review/config.md` in `<repo>`, a `config.md` that fails validation, or a `--slots` value that is not a positive integer between 1 and 20 (including one passed without a terminal). Stop, and show the user the process's stderr message verbatim. Do not guess a fix and retry.
- **Any other non-zero exit** — something broke that `crm plan` did not anticipate (a bad git ref, a `since` run with no prior `last_reviewed_sha`, and so on). Stop, show the user the raw error, and do not proceed to Step 3 with a run that produced no `plan.json`.
- **`empty: true`** — there is nothing in scope to review. Tell the user so, in one line, and stop. Dispatch nothing.
- **Otherwise** — before dispatching a single agent, print the budget to the user in Polish:

  `Budżet: {selection.agents} agentów (1 brief + {selection.selected.length} osi + {selection.selected.length} weryfikacji). Wybrane osie: {axisId, axisId, ...}. Pominięte (on-touch): {selection.skippedOnTouch.join(', ') || '—'}. W kolejce: {selection.deferred.join(', ') || '—'}.`

  This is the number the whole run is held to. `crm finish` (Step 10) checks the dispatch ledger against exactly this figure.

## Step 2 — raise the budget only on request

Pass `--slots <n>` to the `crm plan` call in Step 1 only when the user typed a number in their own invocation of this skill (e.g. `/code-review-master branch main --slots 8`). Never infer a value, never suggest one, never default one yourself — the budget line in Step 1 already tells the user what the default would review, and raising it is their call alone.

In a non-interactive run (nightly, CI, any invocation with no one at the keyboard to answer a prompt), never pass `--slots`, regardless of what a config file or environment variable might suggest. `crm plan` enforces the same rule independently — it exits 2 without a TTY — so this is belt and suspenders, not the only guard, but the instruction on this side must hold too: an unattended run must not be able to raise its own agent budget.

## Step 3 — wave 0 (brief)

Build `{{SUMMARY_INPUT}}`: the deduplicated union of `files` across every entry in `selection.selected`, one per line as `path (+added/-removed)`. Files belonging only to a skipped or deferred axis are left out — the brief exists to inform the axes that will actually run.

Dispatch **one Haiku agent** with `<skill>/prompts/brief.md`, `{{SUMMARY_INPUT}}` substituted. Give the subagent a tool set that **excludes the subagent-dispatch tool**, so it cannot dispatch further agents. This is what bounds the budget from the agents' side: the tool this skill replaces let a dispatched agent dispatch more, which is how a five-agent review became sixty processes. Every prompt this skill sends also says outright not to dispatch or spawn further agents, as a second line of defence.

**Log the dispatch before waiting for the result** — run

```
crm dispatched --run <runId> --wave brief --label brief
```

before reading the agent's answer, not after. Do the same for **every** agent in **every** wave below, always before waiting on it. The ledger records what was *spent*, and an agent costs from the moment it starts, not from the moment it answers; logging on return would leave a hung or crashed agent unrecorded, since a return is exactly what it never produced. Be precise about what `crm finish` (Step 10) does and does not catch: it fails the run — exit 2 — when the ledger *exceeds* the announcement or names an axis the plan never selected, and it only *warns* on stderr when the ledger falls short. A short ledger does not stop the run — see Step 3b for what to do about it.

Keep the agent's `summary` field; it becomes `{{SUMMARY}}` in Step 4.

## Step 3b — when an agent does not come back usable

An agent may hang, crash, or return output that cannot be parsed; the dispatch itself may fail before any agent starts. All four cases are handled the same way, and the first rule is the one that matters:

**Never re-dispatch within a run.** The budget was announced before anything started and it does not grow afterwards — that is the whole promise. A retry is a second agent, and a run that quietly buys itself another agent when one fails is exactly the unbounded behaviour this skill exists to prevent. If an axis must be covered, start a new run: it announces its own budget, in front of the user. This is why `crm finish` (Step 10) treats a ledger exceeding the announcement as a defect with no exception — there is no legitimate way to get there.

What to record depends on which wave failed:

- **The brief agent (wave 0).** Continue with an empty change summary and tell the user in one line, in Polish, that the brief did not return. The brief is not load-bearing: the file-to-axis assignment comes from `crm plan`, not from the brief, so its loss costs the axis agents a summary and a risk ordering, not their inputs. Nothing is marked incomplete, because no axis went unreviewed.
- **An axis agent (wave 1).** Record that entry's `axisId`, carry it to Step 8 as `--incomplete <ids>`, and continue. The report's coverage block then names it as not reviewed — **an axis that was paid for and produced nothing must never be presented as covered.**
- **A verification agent (wave 2).** `crm score` gives every finding no agent scored a confidence of `0` and files it under `belowThreshold`, so that axis's findings vanish from the report entirely. Record that `axisId` as incomplete too. This is the quietest of the four failures: the axis loses its findings without losing its heading, so without the marker it reads as a clean axis that nobody actually judged.

## Step 4 — wave 1 (axis agents)

For **each entry** in `selection.selected`, in a **single message** so all of them run concurrently:

- `{{AXIS_ID}}` — the entry's `axisId`.
- `{{CHECKLIST}}` — the entry's `axes[]` checklists concatenated, each preceded by its own axis id as a heading when the entry groups more than one axis, so a grouped agent still knows which rule belongs to which axis.
- `{{SUMMARY}}` — the `summary` string from wave 0.
- `{{FILES}}` — the entry's `files`, one per line as `path (+added/-removed)`. Never paste file contents into the prompt; the agent reads each file itself with its own `Read` tool.

Dispatch **one Sonnet agent per entry** with `<skill>/prompts/axis.md` filled as above. **Its tool set excludes the subagent-dispatch tool**, same reasoning as Step 3. **Log the dispatch before waiting for the result** — `crm dispatched --run <runId> --wave axis --label <axisId>` — for each one, same reasoning as Step 3. If one does not come back usable, follow Step 3b.

Collect every agent's JSON array (parse the fenced block if it wrapped one) into a single array and write it to `<repo>/.claude/review/reports/<runId>-raw.json`.

## Step 5 — assemble

Run:

```
crm assemble --run <runId> --raw <repo>/.claude/review/reports/<runId>-raw.json
```

This validates every finding's evidence against the actual file content, dedupes, applies triage suppression carried in `state.json`, and **assigns the finding ids** (`f-01`, `f-02`, …). It runs before wave 2 because wave 2 scores by id — an id that does not exist yet cannot be scored.

Tell the user, in one line and in Polish, how many findings `rejectedForEvidence` discarded for evidence that was missing or could not be found verbatim in the file — a finding that fails this check never reaches a person.

## Step 6 — wave 2 (verification)

For **each entry** in `selection.selected` — the same entries wave 1 used, not one call per finding — dispatch **one Haiku agent** with `<skill>/prompts/verify.md`, `{{FINDINGS}}` filled with the subset of `assemble`'s returned findings whose `axis` field equals this entry's `axisId` (every finding wave 1 produced already carries that exact string back, since `prompts/axis.md` has the agent echo `{{AXIS_ID}}` into it), carrying their assigned `id`s. An entry whose axis produced no findings still gets its agent, with an empty `{{FINDINGS}}` array — the agent returns `[]` immediately, and the wave stays at exactly `selection.selected.length` agents regardless of what wave 1 found. **One agent per axis, never one per finding**: that per-finding pattern is the specific mistake this skill exists to not repeat.

**Its tool set excludes the subagent-dispatch tool**, same reasoning as Step 3, batched exactly as `prompts/verify.md` expects. **Log the dispatch before waiting for the result** — `crm dispatched --run <runId> --wave verify --label <axisId>` — for each one, same reasoning as Step 3. If one does not come back usable, follow Step 3b.

Collect every agent's JSON array into one array, write it to `<repo>/.claude/review/reports/<runId>-scores.json`, then run:

```
crm score --run <runId> --scores <repo>/.claude/review/reports/<runId>-scores.json
```

This merges the confidences in by finding id and drops anything under its severity's threshold.

## Step 7 — codex

Run:

```
crm codex --run <runId>
```

If the returned `status` is not `ok` (`skipped`, `unavailable`, `timeout`, `unparsable`), tell the user in one line, in Polish, what happened and continue — a codex failure never blocks the run, it only means the surviving findings ship without a second opinion.

## Step 8 — prose

For each finding still in `findings.json` after Step 7, write `{title, body}` in Polish: two to three sentences naming the function and the line, following the register rules in `~/.claude/review/global.md` (referent named, no passive voice hiding the actor, `file:line` for every code reference). Write the whole map, keyed by finding id, to `<repo>/.claude/review/reports/<runId>-prose.json`, then run:

```
crm render --run <runId> --prose <repo>/.claude/review/reports/<runId>-prose.json
```

Add `--incomplete <ids>` (the axis ids Step 3b recorded, comma-separated) when Step 3b recorded any at all this run; omit the flag entirely otherwise. This writes `raport.md`, with an axis named by `--incomplete` marked in its coverage block as not reviewed instead of silently reading as clean.

## Step 9 — artifact

**Interactive runs only. Skip this step silently, saying nothing, when the session has no one at the keyboard** — a nightly or CI invocation has nowhere to hand a URL. Unlike `--slots` (Step 2) and mode `fix`, `crm artifact` itself carries no TTY check: the CLI process's own stdout is piped for `--json` on every call this document makes, interactive or not, so "is a person watching" is a fact only this document's caller can know, not something the subprocess can infer from its own I/O. The judgment is yours to make, not the CLI's to enforce.

Run:

```
crm artifact --run <runId> --out <scratchpad>/review-<runId>.html
```

`<scratchpad>` is this session's own scratch/temp directory (named in your system prompt, if one is provided) — never a path inside `<repo>`, since the file is a publishing intermediate, not a review artefact the repository should carry. This reads `findings.json`, `plan.json`, and the `prose.json` Step 8 wrote, and fills `<skill>/templates/artifact.html` with the run's data: coverage and spend restated as page chrome, one card per finding with its severity badge, its codex verdict as a second badge when one exists, the evidence quote in a horizontally-scrolling block, its Polish body, and a link into the code when the repository has a recognized GitHub remote. It also carries axis and severity filters and a live count.

Then publish the written file with the `Artifact` tool: a one-sentence `description` and a `favicon` on this artifact's first publish only. **`crm artifact` already wrote `Review <repo>` into the file's own `<title>` tag** — the `Artifact` tool never overrides a `<title>` already present in the file, so there is nothing to pass as `title` here, and trying to pass one is a wasted step, not a stronger one. That title is deliberately the same on every run of this repository: it is a name, not a summary, so it stays stable while the description and the gallery's own timestamp are what tell one run's artifact apart from another's.

**Never build the page by hand-substituting into the template.** The escaping in `lib/embed.mjs` — not a string replace performed by this document — is what keeps a `</script>` quoted inside a finding's evidence from closing the data block and injecting markup into a page you may hand someone a URL to.

Record the returned URL by carrying it to Step 10 as `--artifact <url>`.

**A new artifact per run. Never redeploy over a previous run's URL** — comparing one run's findings against another's is the point of keeping a history of them, and redeploying would erase the earlier run's page out from under anyone who still has its link open.

## Step 10 — finish

Run:

```
crm finish --run <runId>
```

This checks the dispatch ledger recorded by every `crm dispatched` call in this run against the budget Step 1 announced, and only then sets the exit code from the gate. If the ledger holds more agents than were announced, or names an axis label the plan never selected, this exits 2 — the run is broken, and that is a defect in how this document was followed, not a review verdict. Report an exit 2 as a defect, not as "the review failed." A ledger shorter than the announced budget does not fail this step — it prints a warning to stderr instead (see Step 3), because Step 3b's `--incomplete` handling is how that case is meant to be resolved, not an error to fix after the fact.

On success, show the user (in Polish) the path to `raport.md` and the headline counts (findings by severity, how many codex confirmed).

## Mode `init`

`/code-review-master init` drafts `.claude/review/config.md` for a repository that does not have one yet. Its CLI half, `crm detect`, only reports what it found in the repository — `{ name, remote, packageManager, languages, lintCommands, docs, topLevelDirs }`. Turning that report and the repository's own documents into review axes is this document's judgment, not the CLI's.

1. Run `crm detect`. Read every document it lists under `docs`, plus `AGENTS.md` and `CLAUDE.md` at the repository root when either is present — `detect`'s own `docs` pattern already catches both there, but say this step explicitly so a repository that keeps them somewhere `detect` does not scan is not silently missed.
2. Draft `.claude/review/config.md` in memory from `<skill>/templates/config.md`: fill `{{REPO_NAME}}` with `detect`'s `name` and `{{REPO_SUMMARY}}` with one or two sentences describing what the repository is. Turn each coherent group of rules found in those documents into one `##` axis section — an `id`, a `when` derived from the directories the rules concern (rules that only ever discuss `apps/api` become `when: apps/api/**`, not `when: always`), a `rank`, and a checklist written in the document's own words rather than paraphrased.
3. **Ask about gaps instead of inventing them.** Three cases call for a question to the user, not a guess: an axis whose `when` cannot be inferred because no directory is named or implied by the source document, a rule that names a tool `detect`'s `languages` and `lintCommands` say the repository does not actually use, or a severity you are not confident about.
4. **Show the user the complete drafted `config.md` and wait for approval.** Until that approval arrives, `init` writes nothing at all — not `config.md`, not the `.gitignore` line, not even the `.claude/review/` directory. A repository the user declines to configure must look exactly as untouched as one this skill has never run on.
5. After approval, write `.claude/review/config.md` and append `.claude/review/reports/` to the repository's `.gitignore`. Tell the user, in Polish, that `state.json` is deliberately left tracked — the run history and triage record belong with the repository, not with one machine's working copy.
6. When a source document was lifted wholesale into an axis's checklist — `docs/review-guide.md` is the case in `saas app` — **propose**, as a separate question asked only after the first approval, reducing that document to a heading plus a pointer at `.claude/review/config.md`. Never do this unasked: people other than this skill still read that document on its own.

## Mode `ask`

`/code-review-master ask [path]` opens a conversation over a finished report. It never runs a review of its own.

1. With no `path`, run `crm latest`. `runId: null` means no run has ever produced a report in this repository — say so, in Polish, and stop; there is nothing to discuss yet. A `path` names the run to open instead of asking `crm latest` for the newest one.
2. Read `findings.json` and `raport.md` for that run. Answer the user's questions from them.
3. When the user challenges a finding — "czy to na pewno problem", "skąd to wiesz" — **read the actual code** with `Read` and `Grep`, not from memory of the report's prose. Answer only from what you see there: either bring firmer evidence than the report already carries, or say plainly that the finding was a false positive. Never defend a finding you cannot re-confirm by reading the file yourself.
4. **Dispatch no subagents in this mode, ever.** The agent budget belongs to the review that produced the report, not to a conversation about it — this holds even for a question a second opinion would genuinely help answer.
5. Recording a verdict on a finding: `crm triage --run <runId> --id <f-NN> --verdict accepted|rejected|deferred --scope here|everywhere --reason "<one line>" [--until YYYY-MM-DD]`. For `rejected` and `deferred`, **ask for the reason if the user did not give one, and wait for their answer before running `crm triage`.** The CLI refuses a blank reason, but it cannot tell a real reason from a plausible one you supplied yourself — so asking and then answering on the user's behalf satisfies the check and defeats it. A later report's silence is unreadable without a reason that is actually theirs.
6. `show-suppressed` runs `crm suppressed` and shows the user the resulting list; `restore <fingerprint>` runs `crm suppressed --restore <fingerprint>`.
7. Never commit. This mode only ever changes `state.json`, through `crm triage`, and that file is left uncommitted like every other artefact this skill touches.

## Mode `fix`

`/code-review-master fix [ids]` implements the findings codex confirmed in the latest run. **Interactive only.** In a non-interactive run — nightly, CI, any invocation with no one at the keyboard to answer a prompt — refuse before touching anything and say why, in Polish: a scheduled or CI run that edits code unattended is a different product with a different risk profile. This is not left to your discretion — `crm fixable` itself exits 2 without a terminal, so the flow cannot start unattended even if this section were ignored.

1. Run `crm latest` (unless the user named a run); `runId: null` means there is no report to fix from — say so and stop.
2. Run `crm fixable --run <runId> [--ids <ids>]`. It returns `{ fixable, skipped }` — a finding is fixable only when codex's verdict on it was `confirms` and it still carries a `confidence`. A finding with neither has never been scored, which `crm fixable` treats as skipped rather than fixable — a guard against a `findings.json` that never went through `crm score`, not a second confidence threshold on top of the one `crm score` already applied.
3. **Show the user the full list**: what will be attempted (`fixable`) and what is skipped, with the reason `crm fixable` gave for each skip. **Wait for approval before editing a single file.** Nothing in this mode touches the working tree before that approval arrives.
4. **Before implementing any single fix, ask whether it would change scope, add a dependency, or do something irreversible.** If it would, that fix is not this mode's to make: set it aside for the separate list below and move to the next one. Make this judgement per fix, before touching that fix's files — never as a pass over the work afterwards, because by then an irreversible edit is already in the working tree.
5. Implement each remaining fix yourself. `codex.fix` is advice: judge it before writing it, and reject it when it is wrong, stating why.
6. Follow the repository's own conventions. Where the repository has tests covering the touched behaviour, run them before moving to the next fix.
7. Present the fixes set aside by the pre-check as their own list, with what each would change and why it exceeds this mode, and stop for the user. These were never attempted, and the closing table must say so rather than showing them as skipped for some other reason.
8. Afterwards, present a table: finding id, what it said, your assessment, applied or not, and why. **A rejected remark with no stated reason is worse than a bad remark applied**, because the trace of the decision disappears either way, and a stated reason is the only thing that survives it.
9. **Never commit.** Every edit this mode makes is left uncommitted in the working tree; say so explicitly, in Polish, in the closing summary.

## Rules that do not bend

- **Never commit.** No mode of this skill runs `git add`, `git commit`, or `git push`; every edit — a fix, a written `config.md`, a `.gitignore` line — is left uncommitted in the working tree for the user to review and commit themselves.
- Every subagent's tool set excludes the subagent-dispatch tool, and every prompt this skill sends also says outright not to dispatch or spawn further agents.
- Verification is one agent per axis, never one agent per finding.
- A non-interactive run never applies a fix and never raises the budget with `--slots`.
- A finding without evidence found verbatim in the file is discarded by `crm assemble` before anyone reads it, never reported on the strength of its wording alone.
