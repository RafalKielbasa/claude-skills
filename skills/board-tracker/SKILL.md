---
name: board-tracker
description: Use when a "[board-tracker]" brief is in the session context and the session is about to change something (files, git, GitHub, n8n); when the user asks what to do next ("co dalej?", "co mam zrobić", "co robimy", "co z backlogu"); when the user asks to bind the session to an issue or to open one for the current work ("przypnij do #N", "załóż na to issue"); at "Raport po zadaniu"; when work on a bound issue is finished; and for the one-time inventory ("board-tracker inventory", "inwentaryzacja tablicy"). Keeps Rafał's GitHub boards the source of truth for his work. NOT for writing tickets for other people from a spec (github-tickets) and NOT for meeting action items (/daily, /spotkanie).
---

# Board tracker

## Overview

Rafał's part of four GitHub boards is the source of truth for what he works on. This skill binds
each session's work to an issue, proposes an issue when there is none, leaves a trail in it, moves
statuses and proposes what to take next. A deterministic CLI does every GitHub read and write; this
skill only decides. Design: `docs/superpowers/specs/2026-10-09-board-tracker-design.md` in
`D:\Praca\Devstock\Baza wiedzy`.

**The rule that shapes everything else: the work Rafał asked for never waits for the board, and
nothing on the board is created, closed, reassigned, or moved anywhere except to in progress at
binding, without his explicit "tak".** No answer is not consent. When a question times out, say in
one sentence that you are waiting and ask again; never pick an option for him.

## The CLI

The brief gives the command prefix (`CLI: node "…/cli.js"`) and the session id. Without a brief
(for example a session started before the hook existed) use
`node "D:/Praca/Devstock/Baza wiedzy/tools/board-tracker/src/cli.js"` and the session id
`manual-<YYYYMMDD-HHMM>` fixed for the rest of the session.

| Command | Use |
|---|---|
| `pool --cwd <session cwd>` | matching pool |
| `search --tracker <owner/repo> --q <keywords>` | someone else's issue in the session's tracker |
| `mine` | every open issue of Rafał on the four boards, any status (inventory phase 2) |
| `candidates` | ranking input |
| `bind --session <id> --ref <owner/repo#n>` | record a binding (moves the user's own issue to in progress) |
| `create --session <id> --title <t> --body-file <f> --domain <d> --size <s> [--epic <n>] [--status <state>]` | new DT issue, in progress, bound |
| `ensure --ref <ref> [--status <state>] [--epic <n>]` | finish a half-done create |
| `assign --ref <ref>` | add Rafał as assignee |
| `trail --session <id> --ref <ref> --body-file <f>` | post or edit this session's trail comment |
| `status --ref <ref> --to <backlog\|ready\|in_progress\|in_review\|done\|blocked>` | set a status (done also closes) |
| `close --ref <ref> --reason not_planned` | close as not planned |

Every command prints JSON. `ok: false` carries `error`, sometimes `hint` (show it to Rafał
verbatim and stop that operation) and, for `create`, `next` (run those commands, in order, instead
of `create`). Never retry a failing command in a loop. Write every body (card body, trail) to a
file in the session's scratchpad directory and pass its path.

## Session start

From the brief, the first answer carries 1–3 lines in Polish, for example
`Tablica: w toku #412, #98 · gotowe #96 (termin 11.10) · ⚠ 3 alarmy`, inside the user's usual
answer format. "Board unavailable: …" becomes one line quoting the message; the work goes on.

When the brief contains "First session today", also show the alarm list briefly and the top 3 from
"Ranking", even when the session already has a concrete task. Then do the task.

## Binding

**When:** right before the first action in the session that changes something: a file edit, a git
commit, a GitHub write, an n8n change. Reading, explaining, reviewing and answering do not bind.

1. Run `pool --cwd <session cwd>`.
2. Decide:

| Result | When | Do |
|---|---|---|
| certain, assigned to Rafał | the request names the issue (#N, DT-n, CP-n), or the topic matches the title and body of exactly one pool issue | `bind`; one line `Przypinam do #N <tytuł>` (+ `→ w toku` when `moved`) |
| certain, not assigned to Rafał | as above, but the issue is someone else's or unassigned | card "Cudze issue" |
| uncertain | 2–3 issues fit, or none fits clearly | ask which one, listing them, or "nowe" |
| none | nothing in the pool fits | `search` the session's tracker with 2–4 keywords; a fit → card "Cudze issue"; otherwise card "Nowe issue" |

   When `bind` returns `closed: true`, the issue is already closed: say so and ask Rafał whether
   to reopen it (`gh issue reopen <n> --repo <repo>`, then `status --to in_progress`) or to bind
   the work elsewhere.
3. Do the requested work in the same answer. Only the binding or the issue waits.
4. If you bind to a backlog item or propose a new issue while a ready item in the brief or the pool
   has a target date within 3 days, add one sentence naming that item.
5. A topic change later in the session repeats these steps; a session may hold several bindings.
   "nie zakładaj" leaves that topic unbound until the session ends; do not ask about it again.

### Card "Nowe issue"

```
**Nowe issue, praca spoza tablicy**
Tytuł: DT-?: <tytuł po polsku, bez prefiksu, do 80 znaków>
Domena: <dev|marketing|product|sales|company|other> · Rozmiar: <S|M|L|XL> · Epik: <#10 …|brak>
Opis: <2–4 zdania: cel, kontekst, gdzie żyje praca (repo, ścieżka specu lub planu)>
Po założeniu: w toku, przypięte do tej sesji.
**tak** / **popraw: …** / **nie zakładaj**
```

- Domain follows the split in `docs/ticket-conventions.md` (dev = technical, marketing =
  promotion, product = product and courses, sales = offer and clients, company = company matters,
  other = everything else).
- Size is your estimate of effort, S smallest, XL largest; when unsure pick M and let Rafał
  correct it.
- Epic: one of #10 firmowa baza wiedzy, #65 aplikacja saas, #122 System tworzenia treści
  dydaktycznych, #128 Kurs agentów AI (the epics the spec names), or none. Use another epic only
  when Rafał names it.
- On "tak": write the body file, run `create`, answer with one line: `Założone <tytuł z wyniku>
  (<url>), w toku, przypięte.` On `ok: false`: run each `next` command; with a `hint`, show it and
  stop. On `collision: true`: tell Rafał the number is duplicated; do not renumber. On
  `collision: null` the post-create check could not run: tell Rafał in one sentence and continue.
- A `create` that fails before the issue is known returns `created`. On `created: false` the issue
  does not exist: tell Rafał, and `create` may be run again. On `created: 'unknown'` never run
  `create` again: show Rafał the `title`, `failed` and `lookupFailed` messages and let him check
  the board.
- On "popraw: …": apply it and show the card again.

### Card "Cudze issue"

```
**Praca pasuje do <ref> <tytuł>** (przypisane: <login>|nieprzypisane)
Dopisać Cię jako assignee i przypiąć sesję?
**tak** / **nie, nowe issue** / **nie przypinaj**
```

On "tak": `assign`, then `bind`.

## Trail ("Raport po zadaniu")

For every binding the session worked on since the start:

1. Collect this session's commits for the topic: `git log --since=<session start> --format=%h %s`
   in each repository touched.
2. Write the trail body in Polish. It is **cumulative**: the CLI edits the session's one comment,
   so the body must hold everything done in this session for the issue, not only the latest part.

```
**Sesja <YYYY-MM-DD>** (Claude Code, `<repo>`)
- Zrobione: <co zrobione, konkretnie>
- Commity: `<repo>@<hash>`, …
- Dokumenty: `<ścieżka specu/planu>`, …
- Następny krok: <jeden konkretny krok>
```

3. Run `trail`. Add to the report the line `Tablica: #N, ślad: <url>`; a session without a binding
   gets `Tablica: sesja bez przypięcia`.
4. When `trail` returns `closed: true`, someone closed the issue during the session: say so and
   ask Rafał to choose: reopen it (`gh issue reopen <n> --repo <repo>`, then
   `status --to in_progress`) or bind the work to another issue.

## Status proposals

When the goal in the issue's title and body is reached and verified, propose, do not set:
`#N: cel osiągnięty (<jedno zdanie, dowód>). Przesunąć do Done?` or `… do In review, bo <czeka PR /
czeka na akceptację>?`. On "tak": `status --to done` or `--to in_review`. After done, show the
ranking.

## Ranking

**Triggers:** the brief's daily section, after done, "co dalej?", a session that starts without a
task.

1. Use the brief's candidate list or `candidates`.
2. Drop the items this session is already bound to, epics (label `type: epic`, or sub-issues > 0), issues blocked by an open issue, and
   blocked-status items.
3. Order: ready before backlog → target date → Priority P0/P1/P2 (kodozercy boards only) → same
   epic as the work just finished or currently bound → age, oldest first. You may reorder, giving a
   reason taken from the issue's content.
4. Show the top 3:

| # | Issue | Status | Dlaczego teraz |
|---|---|---|---|

5. Below the table, at most 2 issues that look obsolete (the body says the task is moot, or the
   work is visibly done elsewhere): `Do zamknięcia? <ref> <tytuł>: <powód>`. On "tak":
   `close --reason not_planned`.

On Rafał's pick: `status --to in_progress`, `bind`, then start. An item of size L or XL whose body
links no spec starts with `superpowers:brainstorming`; anything else starts directly.

## Inventory (one-time, re-runnable)

Run only when Rafał asks for it. Window: the 30 days before today.

1. Dispatch five parallel `Explore` subagents, one per source, each returning threads as
   `{title, evidence[], looks_done: bool}`:
   - `docs/superpowers/specs/` of `D:\Praca\Devstock\Baza wiedzy` (a spec without a plan, or a
     plan not carried out);
   - `docs/superpowers/plans/` of the same repository (unchecked `- [ ]` tasks);
   - `D:\Notatki\notatki\praca-z-claude.md` (the newest "Następny krok" per topic; a later entry
     supersedes an earlier one);
   - Claude project memory of the four repositories under `~/.claude/projects/` (both `d--` and
     `D--` keys): items waiting, postponed or due later;
   - `git log` of the four repositories (topics, and whether a pending item was done later).
2. Merge into threads, drop `looks_done`, match each against `mine` plus `pool` so a thread with
   an issue gets "to już jest #N" instead of a new issue.
3. Write `planning/board-tracker/<YYYY-MM-DD>-inventory.yaml` in the shape the spec's "Inventory"
   section shows, and commit it.
4. Phase 1, one card per thread: title, domain, size, epic, proposed status (backlog = not
   started, in_progress = half done, in_review = waiting for Rafał's acceptance), evidence.
   Answers: **tak** / **popraw: …** / **pomiń** / **to już jest #N**. Write each decision to the
   file immediately.
5. Phase 2, each of Rafał's open issues from `mine` (every status, blocked included): keep /
   status:<state> / close as not planned, with a reason. If `mine` returns `truncated: true`, tell
   Rafał the list is incomplete before the first card. Write each decision immediately.
6. Final screen: every decision in one table. On Rafał's approval execute: `create` with
   `--status <proposed>` for approved threads, `trail` with the evidence for "to już jest #N",
   `status` and `close` for phase 2. Write each result (`issue`, `decision: done`) to the file right
   after its operation, then commit. An interrupted inventory resumes at the first undecided card
   or the first unexecuted approved entry.

## Red flags

| Thought | Reality |
|---|---|
| "It's a one-line fix, no need to bind" | If it changes something, bind it. Small fixes usually belong to an existing issue. |
| "I'll create the issue now, he can fix it later" | Creation waits for "tak". |
| "He didn't answer the card, so yes" | No answer means no issue. Say you are waiting; ask again. |
| "I'll wait for the card before starting the work" | The work starts at once; only the issue waits. |
| "Each report gets its own comment" | One comment per issue per session; the CLI edits it; the body is cumulative. |
| "Tests pass, I'll move it to Done" | Done is proposed, never set without "tak". |
| "Someone else's issue fits, bind it" | Card "Cudze issue" first. |
| "create failed, run it again" | Never: run the `next` commands (`ensure`, `bind`). |
| "The brief is long, skip the 1–3 lines" | The lines are how Rafał sees his board; always show them. |
