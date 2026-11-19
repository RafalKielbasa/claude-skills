---
name: planowanie
description: >-
  Use when Rafał prepares the team's Friday planning meeting — `/planowanie [<YYYY-MM-DD>]`,
  "przygotuj planowanie", "propozycje na piątek", "co proponujesz na piątkowe spotkanie". Not for
  processing the meeting's recording (that is `/spotkanie transkrypt <data>`), not for Monday
  sprint planning (`/sprint`), and not for an offsite agenda (`/spotkanie przygotuj`).
---

# /planowanie — Friday planning document

One run writes the document for the Friday planning meeting: for every project of `projects.json`,
up to `proposals` (default three) development proposals with a checkable basis, and a proposal of Backlog cards for the
next sprint. Afterwards Rafał processes the recording with `/spotkanie transkrypt <date>`, which
creates the tasks, and `/sprint` reads both files on Monday.
Design: `docs/superpowers/specs/2026-11-19-weekly-sprints-friday-planning-design.md`.

The skill only reads and writes files in this repository: no GitHub, board, Slack, n8n or vector
knowledge base writes. Everything the team reads is in Polish.

The failure this skill exists to prevent: a proposal that names a theme instead of a thing to
build, or one without a basis, so the team plans from scratch anyway.

## Files

| Path | Holds |
|---|---|
| `projects.json` (next to this file) | the project registry: `key`, `name`, `areas?`, `proposals?` (how many proposals, default 3), `match`, `exclude?`, `kb`, `repos`, `web`, `outside?` |
| `assign-cards.mjs` (next to this file) | assigns cards to projects; tested by `node --test ".claude/skills/planowanie/tests/*.test.mjs"` |
| `szablony/agenda.md` | the document template |
| `szablony/brief.md` | the research subagent's prompt and return format |
| `planning/<date>-agenda.md` | the document; `/spotkanie transkrypt <date>` loads exactly this path as the agenda |
| `planning/planowanie/<date>/zrodla/` | `candidates.json`, `review.json`, `assignment.json`, one `<key>.md` per subagent |

Run every command from the repo root, and every `BT` command (`BT` = `node
tools/board-tracker/src/cli.js`) with the Bash tool, never PowerShell: PowerShell redirects
re-encode the JSON and mangle Polish titles.

## Step 1. Date

- `/planowanie <YYYY-MM-DD>` → that date. No argument → today when today is a Friday, otherwise
  the nearest coming Friday. Say the date you took in the first line of your answer.
- `<monday>` = the date's Monday (date − 4 days for a Friday; for another weekday, the Monday of
  the same week). The current sprint starts on `<monday>`.
- `{{OD}}–{{DO}}` = the next Monday to Sunday after the date, as `DD.MM–DD.MM`.
- `planning/<date>-agenda.md` exists:
  - it carries `planowanie tygodniowe` → say it will be overwritten and wait for Rafał's „tak”;
    no answer is not consent;
  - it does not → it is someone else's agenda: stop and say so; never overwrite it.

## Step 2. Inputs

1. `mkdir -p planning/planowanie/<date>/zrodla`.
2. Board, with the team list of `/sprint`:
   - `BT sprint-candidates --team .claude/skills/sprint/team.json > planning/planowanie/<date>/zrodla/candidates.json`
   - `BT sprint-review --sprint <monday> --team .claude/skills/sprint/team.json > planning/planowanie/<date>/zrodla/review.json`

   A non-zero exit → quote the `error` from the file and stop: no document without the board.
3. Daily notes `planning/daily/<D>-*/notatka.md` for every `<D>` from `<monday>` to the date:
   `## Ustalenia`, `## Decyzje`, `## Zaparkowane`, and action items with status `do doprecyzowania`.
4. Previous planning:
   - the newest `planning/<D>-notatka.md` whose `planning/<D>-agenda.md` carries `planowanie
     tygodniowe`, with `<D>` before the date;
   - none (first run) → the newest planning note by the rule of `/spotkanie przygotuj` step 1
     (`planning/*-notatka.md` and `planning/robocze/*/notatka.md`, daily excluded).

   From it take the open action items and parked threads (document point 1) and the rejected and
   parked ideas (`{{REJECTED}}` of every brief).
5. Current sprint: `planning/sprinty/<monday>/sprint.json`, when it exists: its `goals` and the
   goal of each item.
6. Assignment:
   `node .claude/skills/planowanie/assign-cards.mjs --registry .claude/skills/planowanie/projects.json --candidates planning/planowanie/<date>/zrodla/candidates.json --review planning/planowanie/<date>/zrodla/review.json > planning/planowanie/<date>/zrodla/assignment.json`.
   A non-zero exit → quote its stderr line and stop.

Projects with `outside: true` (edu-saas, Rzęsownia, FUD: the client runs them, or they are out of
scope) are not part of the meeting: `assign-cards.mjs` puts their cards in `outside`, and Steps 3–7
skip them: no code paths, no subagent, no section, none of their cards in the sprint proposal.
"Each project" below means each project without `outside`.

## Step 3. Code paths

For each `repos` key of a project, find the row of the table „Ścieżki lokalne repo” in
`CLAUDE.local.md` whose first cell equals the key, and check the folder exists (`ls`). Found →
the absolute path goes into that project's `{{CODE_PATHS}}`. No row, no file, or no folder → the
line `brak ścieżki lokalnej dla <key>`. Never guess a path and never search the disk for one.
A project with empty `repos` gets `{{CODE_PATHS}}` = „Kod projektu jest w repozytorium, w
ścieżkach `kb`.”

## Step 4. Research subagents

Fill `szablony/brief.md` once per project:

| Placeholder | Value |
|---|---|
| `{{PROJECT}}` | the project's `projects.json` entry as JSON |
| `{{CODE_PATHS}}` | Step 3 |
| `{{MAX}}` | the project's `proposals`, 3 when absent |
| `{{CARDS}}` | the project's `open` cards from `assignment.json` as `<ref> <title> (<state>)`, then its `done` cards the same way under the line „Zrobione w tym tygodniu:” |
| `{{DAILY}}` | the Step 2.3 passages that name the project or one of its `match` fragments, each with its note's date; „brak” when none |
| `{{REJECTED}}` | Step 2.4's rejected and parked ideas, all projects; „brak” when none |

Dispatch all projects' subagents **in one message** (`Agent`, `subagent_type: general-purpose`),
one per project, so they run in parallel. Save each return verbatim to
`planning/planowanie/<date>/zrodla/<key>.md`.

## Step 5. Checks

For each return, in this order:

- Not in the brief's format, empty, or the subagent failed → the project's section gets one line
  `Brak propozycji: <powód>` and no proposals.
- Drop a proposal without `Podstawa`.
- Drop a proposal that repeats an idea of `{{REJECTED}}`.
- A proposal with `Karta: nowa` whose idea an open card of the project already covers → replace
  `nowa` with that card's ref.
- Keep at most the project's `proposals` (3 when absent). Add none of your own and do not rewrite a proposal's substance.

## Step 6. Sprint proposal

- Pool: `open` cards of every project and of `unassigned.open` (never `outside`), in state `backlog` or `ready`,
  whose `sprintStart` is not `<monday>` (cards of the current sprint are carried over by `/sprint`
  itself). A card from `unassigned.open` gets `—` in `Projekt`.
- Each row is `| <full ref> <title> | <Osoba> | <Projekt> | <Dlaczego> |`, e.g.
  `| devstock-org/devstock-team#875 Kalendarz: widok standardowy | Wiktor | Kodożercy | decyzja z daily 17.11 |`.
  `/sprint` (Step 1 item 8) reads the refs from this cell, so the full ref comes first.
- A card enters the table only with a reason, one phrase, from these sources:
  - a decision, plan or action item in this week's daily notes naming the card (its ref or its
    `DT-<n>` number);
  - a goal of the current sprint (Step 2.5) the card serves and that is not done;
  - a proposal of this document that names the card in `Karta`.
- At most 5 cards per project and 15 in total; with more, keep the cards with a daily decision
  first, then goal cards, then the oldest `createdAt`.
- `Osoba` = the `team.json` name of the first assignee, `—` when unassigned. No capacity
  arithmetic: availability is Monday's question.
- `{{W_TOKU}}` = per team member, in `team.json` order, the number of `open` cards (all projects
  and unassigned) with `sprintStart` = `<monday>` and that member's login among `assignees`;
  members with 0 left out; „brak” when nobody has one.
- `{{BEZ_PROJEKTU}}` = the count of `unassigned.open`, then „najstarsze:” and at most 5 refs by
  `createdAt`.

## Step 7. Document

Fill `szablony/agenda.md` into `planning/<date>-agenda.md`:

- `{{DATA}}` = the date; `{{ZRODLA}}` as the template's comment shows.
- Point 1 from Step 2.4; „brak” under the table header and under „Wątki zaparkowane poprzednio”
  when there is nothing.
- One `## <n>. <name> (10 min)` block per project, in `projects.json` order, numbered from 2
  (`{{PROJEKT}}` = `name`): `Kontekst:` = the `STAN` lines plus `kod: brak ścieżki lokalnej dla
  <key>` lines from Step 3; `Propozycje:` = the checked proposals in the template's one-item form;
  `Materiały:` = each basis once, a path as `- <path>`, a URL as `- <URL>`, a ref as `- <ref>`.
- The last block `## {{N}}. Propozycja sprintu {{OD}}–{{DO}} (15 min)`, `{{N}}` = the next number.
- Delete every `<!-- … -->` block, examples included. Leave no `{{…}}`. Check:
  `grep -c "{{" planning/<date>-agenda.md` prints `0`.
- A project section longer than one screen is cut at the proposals, never at the basis.

## Step 8. Hand-off

1. Show Rafał, in Polish, one screen: the full path of the document in a code block, one line per
   project (`<name>: <n> propozycji` and `kod: brak` where it applies), the number of sprint
   candidates, and every missing source (a failed subagent, a missing path, no sprint.json).
   End the turn there and wait for his answer; no answer, a timeout or "proceed using your best
   judgment" is not consent.
2. Apply his corrections to the file and show what changed; repeat until he accepts.
3. Only after his acceptance, commit the document and `planning/planowanie/<date>/` under the repository's day-branch rule
   (`CLAUDE.local.md`, „Gałąź dnia”): check `git branch --show-current` first, commit with
   pathspec (`git commit -m "…" -- <paths>`), never `--amend`, never push. Message:
   `docs(planning): Friday planning document for <date>`.

## Common mistakes

| Mistake | Instead |
|---|---|
| A proposal like „rozwinąć grywalizację” | A thing to build: „Misje dzienne ze zdrapką na dashboardzie” |
| A proposal from memory, with no `Podstawa` | Drop it; fewer proposals is fine |
| Guessing a code path for Rzęsownia, FUD or MustBeMVP | `brak ścieżki lokalnej dla <key>` and go on |
| Dispatching subagents one after another | All in one message |
| Moving a card, setting a sprint or creating an issue | Never: the meeting decides, `/spotkanie` creates the tasks |
| Running `BT` in PowerShell | Bash tool only |
| Overwriting an agenda that is not `planowanie tygodniowe` | Stop and say so |
