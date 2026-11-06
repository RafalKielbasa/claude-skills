---
name: board-tracker
description: Use when a "[board-tracker]" brief is in the session context and the session is about to change something (files, git, GitHub, n8n); when the user asks what to do next ("co dalej?", "co mam zrobić", "co robimy", "co z backlogu"); when the user asks to bind the session to an issue or to open one for the current work ("przypnij do #N", "załóż na to issue"); at "Raport po zadaniu"; when work on a bound issue is finished; and for the one-time inventory ("board-tracker inventory", "inwentaryzacja tablicy"). Keeps the user's GitHub boards the source of truth for their work. NOT for writing tickets for other people from a spec (github-tickets) and NOT for meeting action items (/daily, /spotkanie).
---

# Board tracker

## Overview

The user's part of the team's GitHub boards is the source of truth for what they work on. This skill
binds each session's work to an issue, proposes an issue when there is none, leaves a trail in it,
moves statuses and proposes what to take next. A deterministic CLI does every GitHub read and write;
this skill only decides. Design: `docs/superpowers/specs/2026-10-09-board-tracker-design.md` in the
`devstock-org/devstock-team` repository, with the amendment "one main board" in
`docs/superpowers/specs/2026-11-03-weekly-sprints-planning-loop-design.md` (Part D).

**The rule that shapes everything else: the work the user asked for never waits for the board, and
nothing on the board is created, closed, reassigned, or moved anywhere except to in progress at
binding, without their explicit "tak".** No answer is not consent. When a question times out, say in
one sentence that you are waiting and ask again; never pick an option for them.

## The CLI

The brief gives the command prefix (`CLI: node "…/cli.js"`) and the session id. Without a brief
(for example a session started before the hook existed) use `node "D:/Praca/Devstock/Baza wiedzy/tools/board-tracker/src/cli.js"` and the session id
`manual-<YYYYMMDD-HHMM>` fixed for the rest of the session.

| Command | Use |
|---|---|
| `pool --cwd <session cwd>` | matching pool |
| `search --tracker <owner/repo> --q <keywords>` | someone else's issue in the given tracker; a card of the main board when the tracker is the main board's repository |
| `mine` | every open issue of the user on the boards, any status (inventory phase 2) |
| `candidates` | ranking input |
| `bind --session <id> --ref <owner/repo#n>` | record a binding (moves the user's own issue to in progress) |
| `create --session <id> --title <t> --body-file <f> --domain <d> --size <s> [--epic <n>] [--status <state>]` | new card on the main board, in progress, bound. The form for sessions in `devstock-org/devstock-team` and in repositories listed in `boardOnlyRepos` of `trackers.json` |
| `create-task --session <id> --cwd <session cwd> --title <t> --body-file <f> [--status <state>] (--card <ref> \| --card-title <t> --card-body-file <f> --domain <d> --size <s> [--epic <n>])` | new issue in the session's project repository, in progress, bound, plus its link on a main-board card: an existing one (`--card`) or a new one. Refused in `devstock-org/devstock-team` and in `boardOnlyRepos` repositories ("use create") |
| `link --card <ref> --task <ref>` | add the task's link to the card's body (section `## Zadania w projektach`); skips a link that is already there |
| `ensure --ref <ref> [--status <state>] [--epic <n>]` | finish a half-done create |
| `assign --ref <ref>` | add the user as assignee |
| `trail --session <id> --ref <ref> --body-file <f>` | post or edit this session's trail comment |
| `status --ref <ref> --to <backlog\|ready\|in_progress\|in_review\|done\|blocked>` | set a status (done also closes) |
| `close --ref <ref> --reason not_planned` | close as not planned |

Every command prints JSON. `ok: false` carries `error`, sometimes `hint` (show it to the user
verbatim and stop that operation) and, for `create` and `create-task`, `next` (run those commands,
in order, instead of running the creating command again). Never retry a failing command in a loop.
Write every body (issue, card, trail) to a file in the session's scratchpad directory and pass its
path.

`link --card <ref> --task <ref>` prints `{ ok: true, card, task, added }`; `added: false` means the
link was already in the card's body, which is fine.

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
| certain, assigned to the user | the request names the issue (#N, DT-n, CP-n), or the topic matches the title and body of exactly one pool issue | `bind`; one line `Przypinam do #N <tytuł>` (+ `→ w toku` when `moved`) |
| certain, not assigned to the user | as above, but the issue is someone else's or unassigned | card "Cudze issue" |
| uncertain | 2–3 issues fit, or none fits clearly | ask which one, listing them, or "nowe" |
| none | nothing in the pool fits | `search` the session's tracker with 2–4 keywords; a fit → card "Cudze issue". Otherwise, in `devstock-org/devstock-team` or a `boardOnlyRepos` repository → card "Nowe issue"; in a project repository → first look for a main-board card (below), then card "Nowe issue, praca spoza tablicy" in the project form |

   **Main-board card for the work (project repository only).** Before the project-form card, run
   `search --tracker <dtRepo> --q <2–4 keywords>`, where `<dtRepo>` is the main board's repository
   (`devstock-org/devstock-team`). A card that covers the
   work goes into the card's line "Karta na głównej tablicy" and `create-task` is given
   `--card <ref>`: only the link is added, no new card. No fit, or the search fails: propose a new
   card in the same line.

   When `bind` returns `closed: true`, the issue is already closed: say so and ask the user whether
   to reopen it (`gh issue reopen <n> --repo <repo>`, then `status --to in_progress`) or to bind
   the work elsewhere.
3. Do the requested work in the same answer. Only the binding or the issue waits.
4. If you bind to a backlog item or propose a new issue while a ready item in the brief or the pool
   has a target date within 3 days, add one sentence naming that item.
5. A topic change later in the session repeats these steps; a session may hold several bindings.
   "nie zakładaj" leaves that topic unbound until the session ends; do not ask about it again.

### Which card form

| Session's repository | Card | Command on "tak" |
|---|---|---|
| a project repository (any repository with its own board, other than the two rows below) | "Nowe issue, praca spoza tablicy" (project form) | `create-task` |
| `devstock-org/devstock-team` | "Nowe issue" | `create` |
| a repository listed in `boardOnlyRepos` of `trackers.json` (it has no board of its own) | "Nowe issue" | `create` |

In a `boardOnlyRepos` session the brief names the session's own repository, and `#N` still means a card
in `devstock-org/devstock-team`: that repository's own issues are never bound, even when a number matches.

`create-task` itself refuses the last two rows with "use create"; when you see that, show the "Nowe
issue" card and use `create`.

### Card "Nowe issue"

For sessions in `devstock-org/devstock-team` and in `boardOnlyRepos` repositories.

```
**Nowe issue, praca spoza tablicy**
Tytuł: DT-?: <tytuł po polsku, bez prefiksu, do 80 znaków>
Domena: <dev|marketing|product|sales|company|other> · Rozmiar: <S|M|L|XL> · Epik: <#65 …|brak>
Opis: <2–4 zdania: cel, kontekst, gdzie żyje praca (repo, ścieżka specu lub planu)>
Po założeniu: w toku, przypięte do tej sesji.
**tak** / **popraw: …** / **nie zakładaj**
```

- Domain follows the split in `docs/ticket-conventions.md` of the `devstock-team` repository
  (dev = technical, marketing = promotion, product = product and courses, sales = offer and clients,
  company = company matters, other = everything else).
- Size is your estimate of effort, S smallest, XL largest; when unsure pick M and let the user
  correct it.
- Epic: one of #65 aplikacja saas, #122 System tworzenia treści
  dydaktycznych (the epics the spec names), or none. Use another epic only
  when the user names it.
- On "tak": write the body file, run `create`, answer with one line: `Założone <tytuł z wyniku>
  (<url>), w toku, przypięte.` On `ok: false`: run each `next` command; with a `hint`, show it and
  stop. On `collision: true`: tell the user the number is duplicated; do not renumber. On
  `collision: null` the post-create check could not run: tell the user in one sentence and continue.
- A `create` that fails before the issue is known returns `created`. On `created: false` the issue
  does not exist: tell the user, and `create` may be run again. On `created: 'unknown'` never run
  `create` again: show the user the `title`, `failed` and `lookupFailed` messages and let them check
  the board.
- On "popraw: …": apply it and show the card again.

### Card "Nowe issue" in a project repository

```
**Nowe issue, praca spoza tablicy**
Tytuł: <tytuł po polsku, do 80 znaków>
Opis: <2–4 zdania: cel, kontekst>
Karta na głównej tablicy: <ref tytuł karty, którą ta praca dopełnia>
  albo nowa karta: DT-?: <tytuł> · Domena: <…> · Rozmiar: <S|M|L|XL> · Epik: <#… |brak>
Po założeniu: w toku, przypięte do tej sesji, odnośnik na karcie.
**tak** / **popraw: …** / **nie zakładaj**
```

- Show one of the two card lines: the existing card when the `search` above found one, a new card
  otherwise. Domain, size and epic follow the rules of the card above.
- The issue is created in the session's project repository; its title has no `DT-?:` prefix.
- On "tak": write the issue body to a file (the "Opis" text) and, for a new card, the card body to a
  second file. Then run, in one call:
  - existing card: `create-task --session <id> --cwd <session cwd> --title <t> --body-file <f> --card <ref>`
  - new card: `create-task --session <id> --cwd <session cwd> --title <t> --body-file <f> --card-title <t> --card-body-file <f> --domain <d> --size <s> [--epic <n>]`

  On `ok: true` answer with one line naming the issue and the card: `Założone <title> (<url>), w
  toku, przypięte; karta <card> (<nowa|istniejąca>), odnośnik dodany.` When `linkAdded` is `false`
  the link was already on the card: say `odnośnik już był`. When `cardCreated` is `true` the card is
  new. On `collision: true` (present when the card was created) tell the user the card number is
  duplicated, as for `create`; do not renumber.
- `ok: false` is read as for `create`, in this order:
  - **`error` only** (no `ref`, no `created`): the command was refused before anything was written.
    Show `error` (and `hint`) to the user. If it says "use create", this is a session in
    `devstock-org/devstock-team` or a `boardOnlyRepos` repository: show the "Nowe issue" card and
    use `create` on "tak".
  - **`created` and `failed`, no `ref`**: the issue's own creation failed. With `created: false`
    the issue does not exist: tell the user, and `create-task` may be run again. With
    `created: 'unknown'` never run it again: show `title` and `failed` and let the user check the
    board.
  - **`ref` present**: the issue exists (`ref`, `url`) but a later step failed (`failed` says which;
    `done` lists the steps that finished). Run each command in `next`, in order. `next` can hold
    `ensure` lines for the task and for the card (when the card was created but a later card step
    failed, an `ensure --ref <card>` comes before the `link`); run those too, in order. A line
    `link --card <card ref> --task <ref>` that follows a `create …` line in `next` is filled with
    the ref that `create` returned. That `create` is the card's, and `create` binds by default:
    after this recovery the session is bound to the card as well as to the task, so the trail
    also goes to the card. With `cardCreated: 'unknown'` the card may already exist, so `next`
    offers neither `create` nor `link`: run the `ensure` and `bind` lines it does hold (they
    concern the task), skip only the card and the link, show `failed` to the user and let them
    check the board; do not create the card yourself. If a `next` command fails, stop, show it
    to the user and do not retry. With a `hint`, show it and stop.
  - Never run `create-task` again once `ref` is present.
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
   ask the user to choose: reopen it (`gh issue reopen <n> --repo <repo>`, then
   `status --to in_progress`) or bind the work to another issue.

## Status proposals

When the goal in the issue's title and body is reached and verified, propose, do not set:
`#N: cel osiągnięty (<jedno zdanie, dowód>). Przesunąć do Done?` or `… do In review, bo <czeka PR /
czeka na akceptację>?`. On "tak": `status --to done` or `--to in_review`. After done, show the
ranking.

The permission classifier often refuses `status --to done` and `close` after a short "tak" or "ok"
(„[External System Writes]”), while `bind` and `trail` pass. Run each such write in its own call,
in exactly the form the user approved. On a refusal do not retry, rephrase or switch shells: answer
with the same command as one line the user runs in this session with the `!` prefix, built from the
brief's CLI prefix (`! node "…/cli.js" status --ref <ref> --to done`; `!` runs Git Bash, so no
PowerShell syntax). Their run counts as the write; then show the ranking.

## Ranking

**Triggers:** the brief's daily section, after done, "co dalej?", a session that starts without a
task.

1. Use the brief's candidate list or `candidates`.
2. Drop the items this session is already bound to, epics (label `type: epic`, or sub-issues > 0), issues blocked by an open issue, and
   blocked-status items.
3. Order: ready before backlog → target date → Priority P0/P1/P2 (boards that have the field only)
   → same epic as the work just finished or currently bound → age, oldest first. You may reorder,
   giving a reason taken from the issue's content.
4. Show the top 3:

| # | Issue | Status | Dlaczego teraz |
|---|---|---|---|

5. Below the table, at most 2 issues that look obsolete (the body says the task is moot, or the
   work is visibly done elsewhere): `Do zamknięcia? <ref> <tytuł>: <powód>`. On "tak":
   `close --reason not_planned`.

On the user's pick: `status --to in_progress`, `bind`, then start. An item of size L or XL whose
body links no spec starts with `superpowers:brainstorming`; anything else starts directly.

## Inventory (one-time, re-runnable)

Run only when the user asks for it. Window: the 30 days before today.

1. Dispatch four parallel `Explore` subagents, one per source, each returning threads as
   `{title, evidence[], looks_done: bool}`:
   - `docs/superpowers/specs/` of the `devstock-team` repository (a spec without a plan, or a
     plan not carried out);
   - `docs/superpowers/plans/` of the same repository (unchecked `- [ ]` tasks);
   - Claude project memory of the repositories on the boards, under `~/.claude/projects/` (both
     `d--` and `D--` style keys on Windows): items waiting, postponed or due later;
   - `git log` of the repositories on the boards (topics, and whether a pending item was done
     later).
2. Merge into threads, drop `looks_done`, match each against `mine` plus `pool` so a thread with
   an issue gets "to już jest #N" instead of a new issue.
3. Write `planning/board-tracker/<YYYY-MM-DD>-inventory.yaml` in the `devstock-team` repository, in
   the shape the spec's "Inventory" section shows, and commit it.
4. Phase 1, one card per thread: title, domain, size, epic, proposed status (backlog = not
   started, in_progress = half done, in_review = waiting for the user's acceptance), evidence.
   Answers: **tak** / **popraw: …** / **pomiń** / **to już jest #N**. Write each decision to the
   file immediately.
5. Phase 2, each of the user's open issues from `mine` (every status, blocked included): keep /
   status:<state> / close as not planned, with a reason. If `mine` returns `truncated: true`, tell
   the user the list is incomplete before the first card. Write each decision immediately.
6. Final screen: every decision in one table. On the user's approval execute: `create` with
   `--status <proposed>` for approved threads, `trail` with the evidence for "to już jest #N",
   `status` and `close` for phase 2. Write each result (`issue`, `decision: done`) to the file right
   after its operation, then commit. An interrupted inventory resumes at the first undecided card
   or the first unexecuted approved entry.

## Red flags

| Thought | Reality |
|---|---|
| "It's a one-line fix, no need to bind" | If it changes something, bind it. Small fixes usually belong to an existing issue. |
| "I'll create the issue now, they can fix it later" | Creation waits for "tak". |
| "They didn't answer the card, so yes" | No answer means no issue. Say you are waiting; ask again. |
| "I'll wait for the card before starting the work" | The work starts at once; only the issue waits. |
| "Each report gets its own comment" | One comment per issue per session; the CLI edits it; the body is cumulative. |
| "Tests pass, I'll move it to Done" | Done is proposed, never set without "tak". |
| "Someone else's issue fits, bind it" | Card "Cudze issue" first. |
| "create failed, run it again" | Never: run the `next` commands (`ensure`, `bind`, `link`). |
| "The work is in a project repository, so it needs its own new card" | Search the main board first; a card that covers the work only gets the link. |
| "The brief is long, skip the 1–3 lines" | The lines are how the user sees their board; always show them. |
