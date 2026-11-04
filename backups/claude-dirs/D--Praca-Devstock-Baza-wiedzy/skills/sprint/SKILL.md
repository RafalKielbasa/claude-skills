---
name: sprint
description: >-
  Use when Rafał runs the weekly sprint planning at the Monday daily, or resumes one that stopped
  — `/sprint`, `/sprint <YYYY-MM-DD>`, "zaplanuj sprint", "przegląd sprintu", "nowy sprint",
  "dokończ sprint". Not for processing the Monday daily recording (that is `/daily`), and not for
  changing the `29_weekly_project_report` / `31_daily_trends_digest` reports themselves (n8n).
---

# /sprint — Monday sprint planning

One run plans one weekly sprint (Monday–Sunday) for the whole team on the four boards of
`tools/board-tracker/trackers.json`. The skill reads, proposes and records decisions; every GitHub
write is done by the board-tracker CLI, and only after Rafał answers **Akceptuj i wykonaj**.
Design: `docs/superpowers/specs/2026-11-03-weekly-sprints-planning-loop-design.md`.

The walk is meant for about 15 minutes of a daily. A card that does not fit one screen, or a
proposal that names themes instead of issues, makes the team plan from scratch anyway — that is
the failure this skill exists to prevent.

## Artifacts and commands

`<date>` is the sprint's Monday. Everything lives in `planning/sprinty/<date>/`:

| File | Holds | Written |
|---|---|---|
| `zrodla/` | the two reports, `review.json` (or, on a first run, `done-count.json`), `candidates.json` | Step 1 |
| `sprint.md` | the Polish note, filled from `szablony/sprint.md` next to this file; it is also the Slack post | card by card, final content after execution |
| `sprint.json` | machine state, exactly the schema in the JSDoc at the top of `tools/board-tracker/src/sprint-apply.js` | card by card from the goals card on; `results` only by `sprint-apply` |

Fill the template, never improvise its structure:

- Delete every `<!-- … -->` block whole, examples included — never uncomment an example.
- Leave no `{{…}}` placeholder: `### {{OSOBA}}` becomes one `### <name>` per team member, in
  `team.json` order, plus `### Bez osoby` last only when an item has no assignee.
- A section or person heading with nothing under it gets one stated line: on a first run
  „— (pierwszy sprint)” in the sections about the previous sprint (`## Przegląd poprzedniego
  sprintu`, `## Zrobione poza planem`, `## Przeniesione i odrzucone`), „brak” everywhere else.
- On a first run `## Przegląd poprzedniego sprintu` loses its table header: it holds the report
  lines from Step 2, or „— (pierwszy sprint)” when no report loaded.

Run every command from the repo root:

- `BT` = `node tools/board-tracker/src/cli.js`. Not `npm --prefix tools/board-tracker run bt`: npm
  runs the script inside `tools/board-tracker`, so a relative `--file` misses, and npm's header
  line breaks the JSON a redirect saves. Every `BT` command prints JSON; exit 0 is success.
- `KB` = `npm --prefix tools/kb-client run kb --` (it needs its `.env` and finds the repo root
  itself).

## Invocation

- `/sprint` → today's local date, if today is a Monday. Otherwise ask one question — which
  Monday: [A] the most recent Monday (the reports carry the Monday date even when the meeting
  moved to another day), [B] the next Monday — and wait.
- `/sprint <date>` → `<date>` must be `YYYY-MM-DD` and a Monday; otherwise say so and ask the same
  one question.
- The team list `.claude/skills/sprint/team.json` (array of `{ "name", "login" }`, names as in the
  daily notes) must exist. If it does not, fetch nothing, write nothing, and stop with:
  „Brak listy zespołu `.claude/skills/sprint/team.json` (tablica `{ "name", "login" }`). Bez niej
  nie wiem, czyje zadania są kandydatami do sprintu — uzupełnij plik i uruchom `/sprint`
  ponownie.”

## Re-entry

The state of `planning/sprinty/<date>/` decides where a run starts:

| State | Meaning | Start at |
|---|---|---|
| `sprint.md` reads `**Status:** finalna` and carries `**Opublikowano:**` | done | report goals, item count, created issues and publish time; stop |
| `sprint.md` reads `finalna`, or `sprint.json` has any entry in `results` | approved, execution interrupted | Step 9.3 — no board reads, no cards |
| anything else | walk not approved yet | Step 1 |

An empty `results` never means approved: `sprint.json` exists from the goals card on, long
before the final screen. Only `finalna` (written at Step 9.3) or a written result proves approval.

Re-entering the walk: reports already in `zrodla/` are reused, the board reads of Step 1 run
again and overwrite `review.json` (or `done-count.json`) and `candidates.json`, and every card
for which `sprint.json` or `sprint.md` already records a decision proposes that decision as its
recommended option.

## Step 1. Inputs

1. **Reports.** For `<date>-weekly-project-report.md` (`29`) and `<date>-daily-trends-digest.md`
   (`31`):
   - `planning/sprinty/<date>/zrodla/<name>` exists → it counts as fetched; do not call `KB`.
   - Otherwise `KB report --name <name>`. Exit 0 → the file is now in `zrodla/`. A non-zero exit
     whose message starts with `Brak` → one line „Brak raportu `<name>` na Drive — idę dalej bez
     niego.” Any other message → quote it, say the report is unavailable, and go on without it
     (Rafał can copy the file into `zrodla/` and rerun `/sprint <date>`).
   - A missing report never stops the run.
2. **Previous sprint** = the latest `planning/sprinty/<D>/sprint.json` with `<D>` before `<date>`
   whose `sprint.md` reads `finalna` (a walk never approved never reached the boards). Found →
   `BT sprint-review --sprint <D> > planning/sprinty/<date>/zrodla/review.json`. None → first run:
   no previous sprint to review, but the final screen still needs the Done count, so
   `BT sprint-review --sprint <date> > planning/sprinty/<date>/zrodla/done-count.json`, and use
   only its `boards[].doneCount` — nothing else from that file (its `planned` and `unplanned`
   describe this week, not a previous sprint).
3. `BT sprint-candidates --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/candidates.json`
   (create `zrodla/` first when no report created it).
4. A `BT` read that exits non-zero → quote its `error` (the redirected file holds
   `{ "ok": false, "error" }`) and stop: no cards without the boards. Nothing has been written to
   GitHub.
5. Create `sprint.md` from the template if it is missing: `{{OD}}–{{DO}}` = Monday–Sunday as
   `DD.MM–DD.MM`, `**Status:** szkic`, `**Źródła:**` = the report names that loaded,
   comma-separated, or `brak`.

What the inputs hold:

- `review.json`: `{ sprint, end, boards: [{ board, doneCount }], planned: Entry[], unplanned: Entry[] }`,
  Entry `{ board, ref, title, url, status, state, closed, closedAt, assignees }`. `planned` =
  issues carrying the previous sprint; `unplanned` = issues finished that week without it.
- `candidates.json`: `{ items: [{ board, ref, title, url, status, state, assignees, labels, createdAt, sprintStart }] }`
  — open issues in backlog, ready, in progress or blocked, unassigned or assigned to someone on
  the team list. `board` is the board key `<owner>#<number>`; copy it into `sprint.json` as is.
- `29` file: one `## <name> (<repo>)` section per project with lists of done issues, merged PRs,
  stale items, waiting PRs and cleanup (age in days), then `## Narracja`. `31` file: the digest,
  then `## Statusy osób` (per person: done, plans, blockers).
- Previous `sprint.json`: its `goals`, `items[].goal`, and `newIssues[].goal` with the created
  ref in `results["create:<key>"].ref`.

## Cards

Every card follows "The gate" in `docs/spotkania-kolejki.md`:

- One `AskUserQuestion` per message, one card per question. The heading goes into the question
  text; the card goes into the `preview` of every option (the question window hides the chat),
  opened by one `SKUTEK:` line saying what that option writes.
- The recommended option is first. "Other" carries a correction: apply it, then ask the same card
  again with the corrected preview. **Popraw** writes nothing: ask for the change in one line,
  apply it, and ask the card again. Only Rafał's own goals are applied without asking again
  (Step 3).
- Chat between questions: one line confirming what the previous answer wrote.
- **No answer is not approval.** When `AskUserQuestion` returns without an answer (a timeout, or a
  hint to proceed on your own judgment), say plainly that you are waiting and ask the same
  question again. Never pick an option for Rafał.
- Polish, one screen: at most about 20 lines; an issue is `owner/repo#n — title` (title cut to 60
  characters), never a theme.
- Every answer is written to `sprint.md` (and, from Step 3 on, `sprint.json`) before the next
  question. "przerwij" in "Other" stops the walk; what is written stays.

`sprint.json` entries, exactly these keys:

| List | Entry |
|---|---|
| `goals` | `{ "id": "g1", "text" }` — 1 to 3, ids `g1`–`g3` in order |
| `items` | `{ "board", "ref", "goal": "g1" \| null, "assignee": "<login>" \| null }` — `assignee` only when the meeting named someone not already among the item's assignees |
| `drop` | `{ "board", "ref", "toBacklog": true \| false }` |
| `newIssues` | `{ "key": "n1", "repo", "title", "body", "assignee", "goal", "domain", "size" }` |
| `cleanup` | `{ "board", "ref", "action": "close" \| "keep" }` |

Plus `"sprint": "<date>"`, `"archiveDone": true`, `"results": {}`. A ref appears once across
`items`, `drop` and `cleanup`. A login comes only from `team.json`; a name not on it stays
unassigned and the card says so.

## Step 2. Review card

- **Previous sprint exists.** One table `| Cel | Wynik | Zrobione | Niezrobione |`, one row per
  previous goal. A goal's issues = previous `items` with that goal plus its created `newIssues`,
  looked up in `review.json` `planned` by ref (case-insensitive); done = `state` `done` or
  `closed: true`. A previous item missing from `planned` left the sprint during the week: found in
  `candidates.json` → `Niezrobione` as `<ref> (wyjęte ze sprintu)`, counted as not done; found in
  neither file → `Niezrobione` as `<ref> (brak na tablicy)`, left out of `Wynik`. Neither is a
  leftover (Step 6). Proposed `Wynik`: all done → `osiągnięty`; some → `częściowo`; none, or no
  issue → `nie`. Then a row `Bez celu` for `planned` refs absent from the previous `sprint.json`
  (only if any), and always the row `Zrobione poza planem` with the `unplanned` refs (`—` when
  empty). Cells hold refs only; more than 5 → the first 5 and `+N`.
- **First run.** No goal rows: the card shows only what the loaded reports say — `29`: number of
  done issues and up to 5 of them, stale items with days, waiting PRs; `31`: each person's
  blockers, one line each. Nothing from the boards. No report loaded → skip the card with one line
  and go to Step 3.
- Options: **Zatwierdź** · **Popraw** (nothing written; Rafał types the change).
- On **Zatwierdź**: the table (first run: the report lines) goes to `## Przegląd poprzedniego
  sprintu`, the full `unplanned` list with titles to `## Zrobione poza planem` (first run:
  `— (pierwszy sprint)`).

## Step 3. Goals card

- Propose up to three goals, each one sentence naming a concrete outcome this week, with its
  basis in brackets: an unfinished previous goal (`częściowo`/`nie` from Step 2), stale items
  (`29`), declared plans or blockers (`31`). Fewer is fine; a goal without a basis is not proposed.
- Options: **Przyjmij cele** · **Wpiszę własne** (nothing written; Rafał types them). With no
  basis at all, the preview says „Brak podstaw do propozycji — wpisz cele.” and **Wpiszę
  własne** comes first.
- Goals typed into "Other" or after **Wpiszę własne** are Rafał's final wording: write them as
  given — unless there are more than three. **More than three goals → write nothing and ask one
  question which to drop**: with four, one option per goal (`Usuń: <goal>`); with five or more,
  ask him to type the three to keep. Repeat until three or fewer remain. Never keep four, never
  drop one yourself.
- Write: `sprint.json` with the goals (create the file now with empty lists and `results: {}`;
  on re-entry replace only `goals` and remove the `items` and `newIssues` of a goal id that no
  longer exists), and `## Cele` as a numbered list.

## Step 4. Work cards, one per goal

- **Proposed issues**: `candidates.json` issues whose title or labels name this goal's work
  directly, grouped by person (team-list name of the assignee; `Bez osoby` for unassigned), each
  with its status. When unsure whether an issue serves the goal, leave it out — a short list is
  right, padding is wrong. An issue chosen for an earlier goal is not proposed again.
- **Z poprzedniego sprintu**: unfinished `planned` items that serve this goal, marked
  `przenoszę` (carried over unless the card drops them), listed only here, not again above.
- **No issue behind the goal** (nothing proposed, nothing carried): the card says `BRAK ISSUE dla
  tego celu`; options **Utwórz issue teraz** · **Zostaw bez issue**. Otherwise **Akceptuj** ·
  **Popraw**.
- Corrections in "Other" (the person cards, Step 5, use the same vocabulary and lookup):
  - remove: `bez <ref>`, or keep only some: `tylko <ref>, <ref>`;
  - add: `dodaj <ref>` — the ref must be in `candidates.json` or `review.json`, whose entry gives
    its board; otherwise say it is not an open item on the four boards and change nothing;
  - assign: `<ref> dla <imię>` (also `dodaj <ref> dla <imię>`) — `<imię>` is a team-list name in
    any grammatical form („dla Anny” → Anna) or a login, resolved through `team.json`; `assignee` =
    that login unless it is already among the item's assignees (then `null`); a name not on the
    list → say so and change nothing;
  - drop a carry-over: `odrzuć <ref>`, `odrzuć <ref> do Backlogu` only for an In progress one;
  - new issue: `nowe issue: <title>`, optionally `… dla <imię>`.
- **New issue**: draft `{ key: "n<k>", repo, title, body, assignee, goal, domain, size }`. `title`
  is Polish and never carries `DT-<n>:` (`sprint-apply` adds it in the DT repo). `body`: 2–4
  Polish lines — the goal, the sprint dates, „z /sprint”. `repo` = the tracker `repo` holding most
  of this goal's other items; none or a tie → one question with the candidate repos,
  recommended first. In `devstock-org/devstock-team` propose `domain` (dev, marketing, product,
  sales, company, other) and `size` (S, M, L, XL) per `docs/ticket-conventions.md`; elsewhere both
  `null`. `assignee` = the login of the team member named by `dla <imię>`, resolved through
  `team.json`; without one, `null`, shown on the card as „bez osoby”. Show it as its own card
  (**Akceptuj** · **Popraw**), then this work card again.
- Write on **Akceptuj**: replace this goal's entries — `items` with `goal: "g<K>"`, `drop` for
  carry-overs dropped here, `newIssues` with this goal; in `## Skład sprintu` under each person
  `- <ref> <title> — cel <K>`, a new issue as `- nowe: <title> — cel <K>`.

## Step 5. Person cards, one per team member

- In `team.json` order. Pre-filled: the member's `candidates.json` issues in state `in_progress` or
  `ready` (their login among `assignees`) in neither `items` nor `drop`; carry-overs marked. One
  optional last line: the member's plans from the `31` file.
- Options: **Potwierdź** (all listed enter the sprint without a goal) · **Nic więcej** (none of
  them enter). An empty list still asks — preview „Brak zadań In progress i Ready poza celami.” —
  so the member can add work by ref in "Other".
- "Other" uses Step 4's correction vocabulary and lookup. A ref added on this card goes to this
  member: `assignee` = the member's login from `team.json`, unless the member is already among
  its assignees (then `null`).
- Write: `items` with `goal: null` (pre-filled items: `assignee: null`, the member is already
  assigned); `- <ref> <title> — poza celami` under the person.

## Step 6. Leftovers card

- Leftovers = `planned` entries not done and not closed whose ref is in neither `items` nor
  `drop`. First run, or no leftovers → skip with one line.
- Each line: ref, title, status, assignees.
- Options, in this order: **Odrzuć wszystkie** first, the recommended one (Sprint value cleared,
  Status unchanged — dropping never changes Status on its own) · **Zostaw wszystkie w sprincie**
  · **Odrzuć, In progress do Backlogu** third, offered only when one of them is In progress (what
  **Odrzuć wszystkie** does, plus the In progress items move to Backlog). "Other" decides per item.
- Write: `drop` entries (`toBacklog: true` only for an In progress item sent to Backlog) or `items`
  with `goal: null`. `## Przeniesione i odrzucone`: `przeniesione:` every `planned` ref now in
  `items`; `odrzucone:` every `drop` (`odrzucone i do Backlogu:` with `toBacklog`).

## Step 7. Cleanup card (skippable)

- Source: the cleanup lists of every project section of the `29` file, merged. Keep an entry only
  when its repo is a tracker `repo` or alias in `trackers.json`, its ref is in `candidates.json` on
  that tracker's board (an open issue there — this also drops PRs, which `sprint-apply` cannot
  close), its labels lack `zostaje`, and it is in neither `items` nor `drop`. Sort by age
  (`createdAt`, oldest first; ties by ref) and keep **exactly the 5 oldest** — 5 across all
  boards together, never 5 per board. `board` = that tracker's board key.
- No `29` file, or nothing left → skip with one line.
- Each line: `<ref> — <title> (<N> dni) — zamknij|zostaje`, `<N>` = the age the `29` file
  gives. Proposal: `zostaje` when the `31` statuses mention the issue, `zamknij` otherwise.
- Options: **Przyjmij propozycję** · **Wszystkie zostają** · **Pomiń w tym tygodniu** (nothing).
  "Other" changes single items, e.g. „2 zostaje”.
- Write: `cleanup` entries (`zamknij` → `close`, `zostaje` → `keep`; **Pomiń** → `[]`);
  `## Porządki` with each decision, or „Pominięte w tym tygodniu.”

## Step 8. Final screen

- Question „Sprint DD.MM–DD.MM — ekran końcowy”, options **Akceptuj i wykonaj** · **Jeszcze nie**.
- Preview of **Akceptuj i wykonaj**: „SKUTEK: wykonuję wszystko poniżej na czterech tablicach i
  publikuję sprint na #ai_summary”, then goals, items per person, carry-overs and drops, new
  issues to create, cleanup decisions, closed by the path `planning/sprinty/<date>/sprint.md`.
- Preview of **Jeszcze nie**: „SKUTEK: nic nie wykonuję, decyzje zostają zapisane”, then what
  execution would do, in its order — archive Done on the four boards (`boards[].doneCount` per
  board and their total, from `review.json`, on a first run from `done-count.json`), set the
  Sprint on N items, assign N, drop N (N to Backlog), create N issues, close N, label N `zostaje`.
- "Other": a correction or „wróć do <karta>” → apply it or walk that card, then ask this question
  again.
- **Jeszcze nie** → stop. Nothing executed; `sprint.md` stays `szkic`, `results` stays `{}`.
- No answer → you are waiting; ask again. Nothing runs without **Akceptuj i wykonaj**.

## Step 9. Execution

Only after **Akceptuj i wykonaj**, or on re-entry with approval (start at 9.3).

1. Make `sprint.json` match the final screen exactly: the keys of "Cards" and nothing else,
   `archiveDone: true`, `results: {}`.
2. `BT sprint-apply --file planning/sprinty/<date>/sprint.json --check` (validates, reads boards,
   writes nothing):
   - `ok: true` → 3.
   - `failed: "validate"` → show `error` verbatim; nothing was written. Ask again the card it
     concerns — a goal → Step 3; a ref in `items` → the work or person card that chose it; in
     `drop` → Step 6; in `cleanup` → Step 7; a `newIssues` key → the work card of its goal — then
     the final screen again. An error saying a board has no Sprint iteration field or no
     iteration on `<date>` is not a card: say the boards lack this sprint (`sprint-setup` is
     Rafał's call) and stop.
   - any other failure → quote it and stop; `sprint.md` stays `szkic`.
3. Write `**Status:** finalna` into `sprint.md` — the record of Rafał's approval; from now on
   re-entry resumes here.
4. `BT sprint-apply --file planning/sprinty/<date>/sprint.json` (no `--check`; it validates again
   and skips every op whose result is already `ok`).
   - `ok: false` → show `failed` and `error` (and `hint` when present) verbatim, say „Ponowne
     `/sprint <date>` wznowi od tej operacji.”, and stop. Do not retry, do not touch `results`,
     do not publish. If `error` says an issue may already exist, repeat that: Rafał checks the
     repo before the rerun.
   - `ok: true` → 5.
5. Write the final `sprint.md`: each `nowe: <title>` becomes the ref from
   `results["create:<key>"].ref`; `## Archiwizacja` gets one row per board from
   `results["archive:<board>"].archived`; `## Porządki` states what was closed and labelled;
   `## Przeniesione i odrzucone` is written from `sprint.json` whether or not Step 6 ran —
   `przeniesione:` every `items` ref that is in `review.json` `planned`, `odrzucone:` every `drop`
   (`odrzucone i do Backlogu:` with `toBacklog`). Then apply the template rules of "Artifacts
   and commands" to every section: no `<!--`, no `{{`, no empty section or person heading left.
6. Unless `sprint.md` already carries the marker:
   `KB publish --type sprint --date <date> --title "Sprint DD.MM–DD.MM" --file planning/sprinty/<date>/sprint.md`.
   On success add `> **Opublikowano:** <YYYY-MM-DD HH:MM>` directly below `**Status:**`. On failure
   quote it and stop; a rerun publishes.
7. Commit the folder per this repo's commit rule (`CLAUDE.md`, `CLAUDE.local.md`): run
   `git branch --show-current` first; `git add -- planning/sprinty/<date>` then
   `git commit -m "docs(sprint): sprint <date>" -- planning/sprinty/<date>`. Never `git add -A`,
   never push. If the rule forbids committing on the current branch, leave the files and say so.
8. Report: goals, items per board, created issues, drops, cleanup, archived counts, publish time,
   commit hash and branch.

## Common mistakes

| Mistake | Instead |
|---|---|
| Treating `sprint.json` with empty `results` as approved and running `sprint-apply` | Approval = `finalna` or a written result (Re-entry) |
| Running `sprint-apply` (even `--check`) before **Akceptuj i wykonaj** | The walk only writes files |
| Calling `KB report` for a file already in `zrodla/` | It counts as fetched; `KB` refuses an existing file anyway |
| Reviewing a previous sprint on the first run | No earlier approved `sprint.json` → only `done-count.json`, and only its `doneCount` |
| Keeping four goals, or dropping one yourself | Ask which to drop |
| Padding a goal with loosely related issues | Flag `BRAK ISSUE`, offer **Utwórz issue teraz** |
| Writing `DT-<n>:` into a `newIssues` title | `sprint-apply` numbers it |
| Cleanup: 5 per board, or items from repos outside `trackers.json` | 5 oldest across all boards, registered repos only |
| Retrying after `ok: false`, or editing `results` | Show `failed`/`error`, stop; a rerun resumes |
