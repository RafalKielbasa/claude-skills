---
name: sprint
description: >-
  Use when Rafał runs the weekly sprint planning at the Monday daily, or resumes one that stopped
  — `/sprint`, `/sprint <YYYY-MM-DD>`, "zaplanuj sprint", "przegląd sprintu", "nowy sprint",
  "dokończ sprint". Not for processing the Monday daily recording (that is `/daily`), and not for
  changing the `29_weekly_project_report` / `31_daily_trends_digest` reports themselves (n8n).
---

# /sprint — Monday sprint planning

One run plans one weekly sprint (Monday–Sunday) for the whole team on the main board
`devstock-org#3`; archiving Done still runs on all four boards of
`tools/board-tracker/trackers.json`. The skill reads, proposes and records decisions; every GitHub
write is done by the board-tracker CLI, and only after Rafał answers **Akceptuj i wykonaj**.
Design: `docs/superpowers/specs/2026-11-03-weekly-sprints-planning-loop-design.md`; its amendments
"2026-11-05: one main board" and "2026-11-06: fixes after the rehearsal" win over the sections
before them.

The walk is meant for about 15 minutes of a daily. A card that does not fit one screen, or a
proposal that names themes instead of issues, makes the team plan from scratch anyway — that is
the failure this skill exists to prevent.

## Artifacts and commands

`<date>` is the sprint's Monday. Everything lives in `planning/sprinty/<date>/`:

| File | Holds | Written |
|---|---|---|
| `zrodla/` | the two reports, `review.json` (or, on a first run, `done-count.json`), `candidates.json`, `outcome.json` (only with a previous sprint) | Step 1 |
| `zrodla/calibration.json` | one factor per person and one proposal ratio from `BT sprint-capacity` | Step 2c |
| `sprint.md` | the Polish note, filled from `szablony/sprint.md` next to this file; it is also the Slack post | card by card, final content after execution |
| `sprint.json` | machine state, exactly the schema in the JSDoc at the top of `tools/board-tracker/src/sprint-apply.js` | card by card from the first card that writes it (Step 2b or 2c) on; `results` only by `sprint-apply`, plus the one edit of Step 9.4 |

Fill the template, never improvise its structure:

- Delete every `<!-- … -->` block whole, examples included — never uncomment an example.
- Leave no `{{…}}` placeholder: `### {{OSOBA}}` becomes one `### <name>` per team member, in
  `team.json` order, plus `### Bez osoby` last only when an item has no assignee.
- A section or person heading with nothing under it gets one stated line: on a first run
  „— (pierwszy sprint)” in the sections about the previous sprint (`## Przegląd poprzedniego
  sprintu`, `## Zrobione poza planem`, `## Przeniesione i odrzucone`), „brak” everywhere else.
- On a first run `## Przegląd poprzedniego sprintu` loses its table header: it holds the report
  lines and the `Praktykanci` lines from Step 2, or „— (pierwszy sprint)” when it has neither.

Run every command from the repo root, and every `BT` and `KB` command with the Bash tool (Git Bash),
never PowerShell: PowerShell redirects re-encode the JSON (a BOM, the console codepage) and mangle
Polish titles.

- `BT` = `node tools/board-tracker/src/cli.js`. Not `npm --prefix tools/board-tracker run bt`: npm
  runs the script inside `tools/board-tracker`, so a relative `--file` misses, and npm's header
  line breaks the JSON a redirect saves. Every `BT` command prints JSON; exit 0 is success.
- `KB` = `npm --prefix tools/kb-client run kb --` (it needs its `.env` and finds the repo root
  itself).

## Invocation

`/sprint [<YYYY-MM-DD>] [tekst]` — the first word is the date only when it has the form
`YYYY-MM-DD`; everything after the optional date is free text that pre-fills the availability card
(Step 2c), e.g. `/sprint Grzegorz 3; Szymon urlop`.

- No date → today's local date, if today is a Monday. Otherwise ask one question — which
  Monday: [A] the most recent Monday (the reports carry the Monday date even when the meeting
  moved to another day), [B] the next Monday — and wait.
- A date → it must be a Monday; otherwise say so and ask the same one question.
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
| `sprint.md` reads `finalna`, or `sprint.json` has any entry in `results` | approved, execution interrupted | Step 9.3 — no board reads, no walk cards (only Step 9.4's recovery card after a failure) |
| anything else | walk not approved yet | Step 1 |

An empty `results` never means approved: `sprint.json` exists from Step 2b or 2c on, long
before the final screen. Only `finalna` (written at Step 9.3) or a written result proves approval.

Re-entering the walk: reports already in `zrodla/` are reused, the reads of Step 1 run again and
overwrite `review.json` (or `done-count.json`), `outcome.json` and `candidates.json`, and every
card for which `sprint.json` or `sprint.md` already records a decision proposes that decision as
its recommended option.

## Step 1. Inputs

1. **Folder.** First, before any report fetch or redirect: `mkdir -p planning/sprinty/<date>/zrodla`.
2. **Reports.** For `<date>-weekly-project-report.md` (`29`) and `<date>-daily-trends-digest.md`
   (`31`):
   - `planning/sprinty/<date>/zrodla/<name>` exists → it counts as fetched; do not call `KB`.
   - Otherwise `KB report --name <name>`. Exit 0 → the file is now in `zrodla/`. A non-zero exit
     whose message starts with `Brak` → one line „Brak raportu `<name>` na Drive — idę dalej bez
     niego.” Any other message → quote it, say the report is unavailable, and go on without it
     (Rafał can copy the file into `zrodla/` and rerun `/sprint <date>`).
   - A missing report never stops the run.
3. **Previous sprint** = the latest `planning/sprinty/<D>/sprint.json` with `<D>` before `<date>`
   whose `sprint.md` reads `finalna` (a walk never approved never reached the boards). Found →
   `BT sprint-review --sprint <D> --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/review.json`, then
   `BT sprint-outcome --review planning/sprinty/<date>/zrodla/review.json --previous planning/sprinty/<D>/sprint.json --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/outcome.json`.
   None → first run: no previous sprint to review, but the final screen still needs the Done
   count and the review card the interns' week, so
   `BT sprint-review --sprint <date − 7 days> --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/done-count.json`,
   and use only its `boards[].doneCount` and `interns` — nothing else from that file (no sprint was
   approved for that week, so its `planned` and `unplanned` are not a previous sprint).
4. `BT sprint-candidates --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/candidates.json`.
5. A `BT` read that exits non-zero → quote its `error` (the redirected file holds
   `{ "ok": false, "error" }`) and stop: no cards without the boards. Nothing has been written to
   GitHub.
6. Create `sprint.md` from the template if it is missing: `{{OD}}–{{DO}}` = Monday–Sunday as
   `DD.MM–DD.MM`, `**Status:** szkic`, `**Źródła:**` = the report names that loaded,
   comma-separated, or `brak`.

What the inputs hold:

- `review.json`: `{ sprint, end, boards: [{ board, doneCount }], planned: Entry[], unplanned: Entry[], interns: Entry[] }`,
  Entry `{ board, ref, title, url, status, state, closed, stateReason, closedAt, assignees, estimate }`.
  `boards` covers all four boards, because archiving does. `planned` and `unplanned` are main-board
  only: `planned` = issues carrying the previous sprint; `unplanned` = issues finished that week
  without it. `stateReason` = GitHub's close reason (`COMPLETED`, `NOT_PLANNED`, `DUPLICATE`,
  `REOPENED`) or null; `NOT_PLANNED` and `DUPLICATE` mean closed without the work, so `unplanned`
  and `interns` never hold them. `estimate` = the board's `Estimate` (number or null),
  here and in `candidates.json`. `interns` = the other three boards' issues with at least one
  assignee and every assignee outside `team.json`, closed in the reviewed week or open in state
  `in_progress`; only the `Praktykanci` section of Step 2 uses them. `done-count.json` has this
  same shape.
- `candidates.json`: `{ items: Candidate[], projectWork: Candidate[] }`, Candidate
  `{ board, ref, title, url, status, state, assignees, labels, createdAt, sprintStart, estimate }`.
  `items` = open main-board issues in backlog, ready, in progress or blocked, unassigned or assigned
  to someone on the team list, without the `type: epic` label; `board` is the board key
  `<owner>#<number>`, here always `devstock-org#3`; copy it into `sprint.json` as is. `projectWork`
  = the other three boards' open issues in state `in_progress` or `ready` with at least one
  team-list assignee; read-only, used only for the `Bez karty` lines (Step 5) and the answer to
  `dodaj <ref>` (Step 4), never written to `sprint.json`.
- `outcome.json`: the draft of the previous sprint's outcome, `{ sprint, items: [{ board, ref, assignees, planned, done, start, remaining, proposed: null, settle }], availability: [] }`
  — one entry per `planned`, then per `unplanned` item; `start` = the estimate settled a week ago,
  `assignees` = team-list logins only; `settle` tells Step 2b what to ask (`"remaining"`,
  `"effort"`, or null = nothing).
- `29` file: one `## <name> (<repo>)` section per repository with lists of done issues, merged PRs,
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
- Polish, one screen: at most about 20 lines; an issue is `<ref> — title` (title cut to 60
  characters), never a theme. One exception: the final screen (Step 8) may run longer and uses a
  compact form — per person one line of refs with their estimates, titles only for new issues:
  `Grzegorz: #790 (2), #810 (0,5)`.
- **Short refs.** On cards and on the final screen a main-board issue is written `#n`, which always
  means `devstock-org/devstock-team#n`; past 2000 characters Claude Code hides a whole preview, and
  the full prefix repeated on every item is what pushes the final screen there. A ref from another
  repository keeps `owner/repo#n`: `Bez karty` lines, `Praktykanci` lines and the `29` report lines
  of Step 2. A correction may use either form, and `#n` resolves to the main board. `sprint.json`,
  `sprint.md` and `## Zadania w projektach` always hold the full ref.
- Every answer is written before the next question: to `sprint.md`, and from Step 2b on to
  `sprint.json` (Steps 2b and 2c write only `sprint.json`). "przerwij" in "Other" stops the walk;
  what is written stays.
- The first card that writes `sprint.json` (Step 2b, else Step 2c) creates it: `"sprint": "<date>"`,
  empty `goals`, `items`, `drop`, `newIssues` and `cleanup`, `"archiveDone": true`, `"results": {}`.

`sprint.json` entries, exactly these keys:

| List | Entry |
|---|---|
| `goals` | `{ "id": "g1", "text" }` — 1 to 3, ids `g1`–`g3` in order |
| `items` | `{ "board", "ref", "goal": "g1" \| null, "assignee": "<login>" \| null, "estimate", "proposed" }` — `assignee` only when the meeting named someone not already among the item's assignees |
| `drop` | `{ "board", "ref", "toBacklog": true \| false, "estimate" }` — `estimate` = the remaining work Step 2b settled, else null |
| `newIssues` | `{ "key": "n1", "repo", "title", "body", "assignee", "goal", "domain", "size", "estimate", "proposed" }` — `key` without `/` or `#`; `repo` always `devstock-org/devstock-team`; `domain` and `size` always set |
| `cleanup` | `{ "board", "ref", "action": "close" \| "keep" }` |
| `capacity` | `{ "login", "board", "days", "factor" }` — Step 2c, one per team member |
| `outcome` | `{ "sprint": "<D>", "items": [ … ], "availability": [{ "login", "board", "days" }] }` — Step 2b, the `outcome.json` draft with the settled values, `availability` one per corrected person; absent on a first run |

Plus `"sprint": "<date>"`, `"archiveDone": true`, `"results": {}`. Every `board` is
`devstock-org#3`; `sprint-apply` rejects any other board and any other `newIssues[].repo`. A ref
appears once across `items`, `drop` and `cleanup`. A login comes only from `team.json`; a name not
on it stays unassigned and the card says so. Numbers are JSON numbers (`1.5`), never strings:
`estimate` and `proposed` a multiple of 0.5, at least 0.5 (`proposed` may be null); `days` a
multiple of 0.5, at least 0; `factor` as `calibration.json` gives it (0.3–1.5); in `outcome.items`,
`start`, `remaining` and `proposed` null or a multiple of 0.5, at least 0.

Cards write days with a comma (`1,5 d`).

### Estimating

Used by Steps 2b, 4, 5 and 6. An estimate is the workdays needed to finish the issue from its
current state: for a started issue the work left, not its original size and not only this week's
slice. Where an item's value comes from, first match wins:

| Source | Card shows | `estimate` | `proposed` |
|---|---|---|---|
| this sprint's `sprint.json` already holds the entry (re-entry) | `— <n> d` | kept | kept |
| a carry-over whose remaining work Step 2b settled | `— <n> d` | that remaining work | null |
| the board's `Estimate` (`estimate` in `candidates.json` / `review.json`) | `— <n> d` | that value; off the 0.5 grid → the nearest 0.5, at least 0.5 (so it gets rewritten) | null |
| none of these | `— ~<n> d` | the value the card settles | Claude's proposal |

Claude's proposal:

1. Once per card, before showing it: `BT sprint-issues --refs <ref,ref,…>` with the card's refs
   that need a proposal (at most 50 per call; a ref a correction adds later gets its own call) →
   `{ issues: [{ ref, title, body, labels, closed } | { ref, error }] }`, `body` cut to 500
   characters. An `{ ref, error }` entry or a non-zero exit → judge from the title alone and say
   so in one line.
2. Raw proposal: workdays to finish, judged from that text, the labels (a `size/*` label
   included) and similar items settled in earlier `planning/sprinty/*/sprint.json` files. A new
   issue has no ref: judge from the title and body you drafted.
3. Multiply by `ratio` from `calibration.json` (its one entry; null, a failed command or no file
   → 1), round to the nearest 0.5, at least 0.5. Step 2b skips only the ratio (its
   proposals are not calibrated, and `calibration.json` is written only after it, in Step 2c);
   its proposals are still rounded to the nearest 0.5, at least 0.5.
4. `proposed` records that number; `estimate` the settled one — the same unless corrected.

"Other" `<ref> <dni> d` sets that item's `estimate`; `proposed` stays.

### Load

- Owners of an item = its current team-list assignees (`assignees` in `candidates.json`, else in
  `review.json`) plus its `assignee`; of a new issue, its `assignee`. Logins compare
  case-insensitively; anyone not in `team.json` is ignored.
- load(person) = the sum of `estimate ÷ owners` over the `items` and `newIssues` that the person
  owns — every entry already in `sprint.json` plus the card's own (they replace the card's earlier
  entries). An item without an owner counts for nobody and is summed in a `Bez osoby` line.
- capacity(person) = `capacity[].days × factor` from `sprint.json`, rounded to the nearest 0.5.
- Card line: `<imię> <load>/<capacity> d`, with `⚠` appended when load > capacity, e.g.
  `Grzegorz 4/2,5 d ⚠`; `Bez osoby <load> d`, e.g. `Bez osoby 1 d`. `⚠` is a warning: it never
  blocks a card, and the only option it adds is **Tylko bez ⚠** on a person card (Step 5).
- An item whose share (`estimate ÷ owners`) alone exceeds an owner's capacity, when that capacity
  is above 0, gets „większe niż tydzień tej osoby, podzielić?” after its estimate (`⚠` already
  flags a capacity of 0).

## Step 2. Review card

- **Previous sprint exists.** One table `| Cel | Wynik | Zrobione | Niezrobione |`, one row per
  previous goal. A goal's issues = previous `items` with that goal plus its created `newIssues`,
  looked up in `review.json` `planned` by ref (case-insensitive); done = `state` `done` or
  `closed: true`, unless `stateReason` is `NOT_PLANNED` or `DUPLICATE` — then `Niezrobione` as
  `<ref> (zamknięte bez realizacji)`, counted as not done. A previous item missing from `planned`
  left the sprint during the week: found in `candidates.json` `items` → `Niezrobione` as
  `<ref> (wyjęte ze sprintu)`, counted as not done; found in neither file → `Niezrobione` as
  `<ref> (brak na tablicy)`, left out of `Wynik`. Neither is a leftover (Step 6). Proposed
  `Wynik`: all done → `osiągnięty`; some → `częściowo`; none, or no issue → `nie`. Then a row
  `Bez celu` for `planned` refs absent from the previous `sprint.json` (only if any), and always
  the row `Zrobione poza planem` with the `unplanned` refs (`—` when empty). Cells hold refs only;
  more than 5 → the first 5 and `+N`.
- **First run.** No goal rows: the card shows only what the loaded reports say. Each `29` list
  (done, stale with days, waiting PRs) is exactly one line: its label, the count when the report
  gives one, at most 3 refs (a stale ref with its days), then `+N`. `31`: blockers, one line per
  person who has a blocker. Nothing else from the boards; the one exception is `Praktykanci`, from `done-count.json`. No report loaded and no
  `interns` → skip the card with one line and go to Step 2c (Step 2b is skipped on a first run).
- **`Praktykanci`, previous sprint and first run alike.** After the table or the report lines, a
  heading `Praktykanci`, then one line per login in `interns` (`review.json`, on a first run
  `done-count.json`), sorted by login, in the form below, at most 5 lines, then `+N`. No `interns`
  → the section is left out.

  ```
  <login>: zrobione <ref>, <ref>; w toku <ref>
  ```

  `zrobione` = entries with `closed: true`, `w toku` = the others. A part with no refs is left out;
  an issue with two interns appears under both.
- Options: **Zatwierdź** · **Popraw** (nothing written; Rafał types the change).
- On **Zatwierdź**: the table (first run: the report lines) and the `Praktykanci` lines go to
  `## Przegląd poprzedniego sprintu`, each `Praktykanci` line written as `- Praktykanci: <line>`;
  the full `unplanned` list with titles goes to `## Zrobione poza planem` (first run:
  `— (pierwszy sprint)`).
- Known gap, no action: an issue outside the sprint closed on the meeting's Monday before the
  meeting is archived by that meeting's run (`archiveDone`), so it never appears in a review and
  its effort never reaches the calibration.

## Step 2b. Remaining-work card

Question „Pozostała praca”. The card settles what `outcome.json` leaves open, in its order:

- `settle: "remaining"` (planned, not done): `<ref> — <title> — było <start> d, zostało ~<proposal> d`;
- `settle: "effort"` (done outside the plan, or planned without an estimate a week ago):
  `<ref> — <title> — zrobione, ~<proposal> d` (a value from the board's `Estimate` without `~`);
- `settle: null` — not shown: a done item keeps last week's estimate; a not-done item without one,
  and one closed as `NOT_PLANNED` or `DUPLICATE` (`done: false` whatever its start), adds no done
  days.

Proposals per "Estimating", except that a `"remaining"` item's remaining work is always Claude's
proposal (its board `Estimate` is last week's `start`); a not-done item's remaining work is at
least 0,5. More than 15 lines →
several cards of at most 15 („Pozostała praca (1/2)”, …), each asked and written in turn.

- "Other": `<ref> zostało <dni>` (remaining work), `<ref> <dni> d` (effort), `<imię> faktycznie
  <dni>` (the person's week went differently than declared — illness, leave).
- Options: **Zatwierdź** · **Popraw**.
- Write on **Zatwierdź**: `outcome` into `sprint.json` = the `outcome.json` draft with the
  settled values — `remaining` of a `"remaining"` item, `start` (the effort) of an `"effort"` item;
  `proposed` = Claude's value, null when it came from the board; `settle` unchanged —
  and the `faktycznie` corrections as `outcome.availability` entries
  `{ login, board: "devstock-org#3", days }`, one per corrected person (`[]` without any). Nothing
  goes to `sprint.md`.
- Skip with one line on a first run (no `outcome`). With a previous sprint but no entry with a
  `settle`, skip the card and still write the draft unchanged as `outcome`: the calibration counts
  the previous sprint only through it.

## Step 2c. Availability card

On every run, after Step 2b (the previous sprint enters the calibration only once `outcome` is in
`sprint.json`).

1. `BT sprint-capacity --dir planning/sprinty --sprint <date> --team .claude/skills/sprint/team.json > planning/sprinty/<date>/zrodla/calibration.json`
   → `{ sprint, window, factors: [{ login, board, factor, source, available, done }], ratios: [{ board, ratio, settled, proposed }] }`;
   `factors` has one entry per login, `ratios` one entry.
   Never compute a factor or a ratio yourself. A non-zero exit → quote its `error`, use factor 1.0
   for everyone and no ratio, say so in one line, and go on.
2. Pre-fill, per person, from the first source that names them: the invocation text (read with the
   "Other" vocabulary below; a part that does not parse is quoted in one line on the card), then
   `capacity` already in this sprint's `sprint.json` (re-entry), then the previous sprint's
   `capacity` (`days` only). A person no source names has an empty cell.

The card, question „Dostępność”:

- A table `| Osoba | Dni |`, team members in `team.json` order. A cell is `<dni>`, or
  `<dni> → <pojemność>` when that person's factor in `calibration.json` is not 1 (`pojemność` =
  days × factor, rounded to the nearest 0.5); zero days is a bare `0`. An empty cell shows `—`.
- One line naming the empty cells, which count as 0: „liczę 0: Grzegorz, Szymon”.
- From the second sprint on (`window` not empty), one line from the ratio: `(ratio − 1) × 100`
  rounded to a whole percent with its sign, „Moje estymaty: +30%”; under 5% either way, „Moje
  estymaty: bez zmian”; `ratio` null, „Moje estymaty: brak danych”.
- "Other": `<imię> <dni>`, `<imię> urlop` or `<imię> 0` (absent the whole week),
  `<imię> jak tydzień temu` (that person's `days` from the previous sprint's `capacity`; none →
  say so, change nothing), `reszta <dni>` (every team member the same text does not name, whatever
  the card showed for them); several separated by `;` or `,`, and `reszta` needs no separator:
  „Bart 1, Mateusz 2 reszta 5”. `<imię>` resolves through `team.json` as in Step 4. A correction
  on the card changes only the people it names, or with `reszta` everyone.
- Options: **Zatwierdź dostępność** · **Popraw**.
- **Every cell empty** (a first run without text) → no card yet, because a card cannot take typed
  numbers on sight. Ask in chat, one line: „Napisz dostępność w czacie, np. »Bart 1, Mateusz 2
  reszta 5«.” End the turn and wait; no reply is not approval. Read the reply with the vocabulary
  above, then show the card with those numbers to approve.
- Write on **Zatwierdź dostępność**: `capacity` into `sprint.json` — one entry per team member,
  `board: "devstock-org#3"`, `days` as settled (empty → 0), `factor` from `calibration.json` (1
  when the command failed). Nothing goes to `sprint.md`.

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
- Write: `goals` into `sprint.json` (Step 2c created the file at the latest; on re-entry replace
  only `goals` and remove the `items` and `newIssues` of a goal id that no longer exists), and
  `## Cele` as a numbered list.

## Step 4. Work cards, one per goal

- **Proposed issues**: `candidates.json` `items` whose title or labels name this goal's work
  directly, grouped by person (team-list name of the assignee; `Bez osoby` for unassigned), each
  with its status and, last on the line, its estimate ("Estimating"). Each person group opens with
  one load line ("Load"), e.g. `Grzegorz 4/2,5 d ⚠`. When unsure whether an issue serves the goal,
  leave it out — a short list is right, padding is wrong. An issue chosen for an earlier goal is
  not proposed again.
- **Z poprzedniego sprintu**: unfinished `planned` items that serve this goal, marked
  `przenoszę` (carried over unless the card drops them), with the remaining work Step 2b settled
  as their estimate, listed only here, not again above.
- **No issue behind the goal** (nothing proposed, nothing carried): the card says `BRAK ISSUE dla
  tego celu`; options **Utwórz issue teraz** · **Zostaw bez issue**. Otherwise **Akceptuj** ·
  **Popraw**.
- Corrections in "Other" (the person cards, Step 5, use the same vocabulary and lookup):
  - remove: `bez <ref>`, or keep only some: `tylko <ref>, <ref>`;
  - add: `dodaj <ref>` — the ref must be in `candidates.json` `items`, or in `review.json` `planned`
    or `unplanned`, whose entry gives its board. A ref in `candidates.json` `projectWork` → say it
    has no card on the main board and to use `nowe issue: <title> <ref>`; anything else → say it is
    not a sprint candidate on the main board. Either way, change nothing;
  - assign: `<ref> dla <imię>` (also `dodaj <ref> dla <imię>`) — `<imię>` is a team-list name in
    any grammatical form („dla Anny” → Anna) or a login, resolved through `team.json`; `assignee` =
    that login unless it is already among the item's assignees (then `null`); a name not on the
    list → say so and change nothing;
  - drop a carry-over: `odrzuć <ref>`, `odrzuć <ref> do Backlogu` only for an In progress one;
  - estimate: `<ref> <dni> d`;
  - new issue: `nowe issue: <title>`, optionally with a project task's ref in the form
    `owner/repo#n` (`nowe issue: <title> <ref>`) and `… dla <imię>`.

  `dla <imię>` adds an assignee and never removes the current one, so the item's load then splits
  between both ("Load"). When the item already had a team-list assignee, the corrected work or
  person card says so in one line.
- **New issue**: draft `{ key: "n<k>", repo, title, body, assignee, goal, domain, size, estimate, proposed }`.
  `repo` is always `devstock-org/devstock-team`; the card asks no repository question. `title` is
  Polish and never carries `DT-<n>:` (`sprint-apply` adds it). `body`: 2–4 Polish lines — the goal,
  the sprint dates, „z /sprint”. A `<ref>` named in `nowe issue:` adds, after those lines, an empty
  line, `## Zadania w projektach` and `- <ref>`, one line per ref, no checkboxes. Its estimate is
  Claude's proposal ("Estimating"), shown `— ~<n> d`; "Other" `<dni> d` on this card corrects it.
  Always propose `domain` (dev, marketing, product, sales, company, other) per
  `docs/ticket-conventions.md`, and `size` from the estimate: S up to 1 d, M up to 3 d, L up to
  5 d, XL above.
  `assignee` = the login of the team member named by `dla <imię>`, resolved through `team.json`;
  without one, `null`, shown on the card as „bez osoby”. Show it as its own card (**Akceptuj** ·
  **Popraw**), then this work card again.
- Write on **Akceptuj**: replace this goal's entries — `items` with `goal: "g<K>"`, `drop` for
  carry-overs dropped here, `newIssues` with this goal, each with `estimate` and `proposed` (a
  drop's `estimate` = the remaining work Step 2b settled, else null); in `## Skład sprintu` under
  each person `- <ref> <title> — cel <K>`, a new issue as `- nowe: <title> — cel <K>`.

## Step 5. Person cards, one per team member

- In `team.json` order. First line: the member's load ("Load"), e.g. `Grzegorz 2/1,5 d ⚠`; load 0
  and capacity 0 → `<imię> — brak dostępności i zadań`. Then pre-filled: the member's
  `candidates.json` `items` in state `in_progress` or `ready` (their login among `assignees`) in
  neither `items` nor `drop` of `sprint.json`, In progress first, then Ready, each line ending with
  its estimate ("Estimating"); carry-overs marked. Adding the items' shares in that order to the
  member's load, an item after which the load exceeds capacity gets `⚠` at the end of its line.
  Then one optional line: the member's plans from the `31` file.
- Last lines: `Bez karty: <ref> — <title>` from the member's `projectWork` (their login among
  `assignees`), at most 5, then `+N`; a ref that a new issue of this sprint already names in its
  body is left out. They do not count as item lines, never enter the sprint, and on consecutive
  cards stand only on the last one.
- At most 15 item lines per card. More → consecutive cards „<imię> (1/2)”, „<imię> (2/2)”, each
  asked and written in turn; the options of each act on that card's items only.
- Options: **Potwierdź** (all listed items enter the sprint without a goal) · **Nic więcej** (none
  of them enter). When some item lines have `⚠` and some do not, **Tylko bez ⚠** comes first: only
  the lines without `⚠` enter, which keeps the member within capacity. With `⚠` on every item line
  it would equal **Nic więcej**, so it is not offered. An empty list still asks — preview „Brak
  zadań In progress i Ready poza celami.” — so the member can add work by ref in "Other".
- "Other" uses Step 4's correction vocabulary and lookup. A ref added on this card goes to this
  member: `assignee` = the member's login from `team.json`, unless the member is already among
  its assignees (then `null`). `nowe issue: <title>`, with `<ref>` when it is the card for a
  `Bez karty` line, works as in Step 4's **New issue**, except: `goal: null` (the body says „poza
  celami” in place of the goal), `assignee` = the member's login unless `dla <imię>` names someone
  else, and after its own card comes this person card again.
- Write: `items` with `goal: null`, `estimate` and `proposed` (pre-filled items: `assignee: null`,
  the member is already assigned; **Tylko bez ⚠** writes only the lines without `⚠`), and the new
  issues accepted on the card, whichever option is chosen; `- <ref> <title> — poza celami` under
  the person, a new issue as `- nowe: <title> — poza celami`.

## Step 6. Leftovers card

- Leftovers = `planned` entries not done and not closed whose ref is in neither `items` nor
  `drop`. First run, or no leftovers → skip with one line.
- Each line: ref, title, status, assignees, and last its estimate ("Estimating": the remaining
  work Step 2b settled, when it did).
- Options, in this order: **Odrzuć wszystkie** first, the recommended one (Sprint value cleared,
  Status unchanged — dropping never changes Status on its own) · **Zostaw wszystkie w sprincie**
  · **Odrzuć, In progress do Backlogu** third, offered only when one of them is In progress (what
  **Odrzuć wszystkie** does, plus the In progress items move to Backlog). "Other" decides per item.
- Write: `drop` entries (`toBacklog: true` only for an In progress item sent to Backlog;
  `estimate` = the remaining work Step 2b settled, else null) or `items` with `goal: null`,
  `estimate` and `proposed`. `## Przeniesione i odrzucone`: `przeniesione:` every `planned` ref
  now in `items`; `odrzucone:` every `drop` (`odrzucone i do Backlogu:` with `toBacklog`).

## Step 7. Cleanup card (skippable)

- Source: `candidates.json` `items` (open main-board issues, no epics, no PRs) at least 30 days old
  on `<date>`, age from `createdAt`. The `29` file's cleanup list is not read: its oldest entries
  are epics and issues on no board, which never leave its head, so filtering it left an empty card
  every week. Keep an entry only when its state is not `in_progress` (age here is time since
  creation, not idle time, and person cards already show work in progress), its labels lack
  `zostaje`, and it is in neither `items` nor `drop` of `sprint.json`. Sort by age (oldest first;
  ties by ref) and keep **the 5 oldest**, or all of them when fewer. `board` = `devstock-org#3`.
- Nothing left → skip with one line.
- Each line: `<k>. <ref> — <title> (<N> dni) — zamknij|zostaje`, numbered from `1.` in that order,
  `<N>` = whole days from `createdAt` to `<date>`. Proposal: `zostaje` when the `31` statuses
  mention the issue, `zamknij` otherwise.
- Options: **Przyjmij propozycję** · **Wszystkie zostają** · **Pomiń w tym tygodniu** (nothing).
  "Other" changes single items by their number, e.g. „2 zostaje”.
- Write: `cleanup` entries (`zamknij` → `close`, `zostaje` → `keep`; **Pomiń** → `[]`);
  `## Porządki` with each decision, or „Pominięte w tym tygodniu.”

## Step 8. Final screen

- Question „Sprint DD.MM–DD.MM — ekran końcowy”, options **Akceptuj i wykonaj** · **Jeszcze nie**.
- Preview of **Akceptuj i wykonaj**: „SKUTEK: wykonuję wszystko poniżej na głównej tablicy,
  archiwizuję Done na czterech tablicach i publikuję sprint na #ai_summary”, then goals; the load
  table — team members × one column, cells `<load>/<capacity>` ("Load") with `⚠` where load >
  capacity, a person at 0/0 left out, plus a `Bez osoby` row (load only) when an item has no owner;
  items per person with their estimates in the compact form of "Cards", carry-overs and drops, new
  issues to create, cleanup decisions, closed by the path `planning/sprinty/<date>/sprint.md`.
- Preview of **Jeszcze nie**: „SKUTEK: nic nie wykonuję, decyzje zostają zapisane”, then what
  execution would do, in its order — archive Done on the four boards (`boards[].doneCount` per
  board and their total, from `review.json`, on a first run from `done-count.json`), set the
  Sprint on N items, assign N, ustaw Estimate na N pozycjach (items, new issues and drops whose
  `estimate` differs from the board value in `candidates.json` / `review.json`; every new issue
  counts, a drop with `estimate: null` does not), drop N (N to Backlog), create N issues, close
  N, label N `zostaje`.
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
     concerns — a goal → Step 3; a ref in `items`, or an item's `estimate` or `proposed` → the
     work or person card that chose it; in `drop` → Step 6; in `cleanup` → Step 7; a `newIssues`
     key → the work card of its goal, or the person card that created it when `goal` is null;
     `capacity` → Step 2c; `outcome` → Step 2b — then the final screen again. An error saying the
     main board has no Sprint iteration field, no iteration on `<date>`, or no Estimate number
     field is not a card: say the main board lacks it (`sprint-setup` and board fields are Rafał's
     call) and stop.
   - any other failure → quote it and stop; `sprint.md` stays `szkic`.
3. Write `**Status:** finalna` into `sprint.md` — the record of Rafał's approval; from now on
   re-entry resumes here.
4. `BT sprint-apply --file planning/sprinty/<date>/sprint.json` (no `--check`; it validates again
   and skips every op whose result is already `ok`).
   - `ok: true` → 5.
   - `ok: false` → never retry on your own, never publish. Ask one recovery card per "The gate":
     question „Wykonanie przerwane: <failed>”, the preview quoting `failed`, `error` and `hint`
     (when present) verbatim. Options that apply, recommended first:
     - **Issue już istnieje — podam ref** — only when `failed` is `create:<key>` and `error` says
       the issue may already exist; then it is the recommended one. Ask for the ref in one line.
       It must be in that entry's `repo` (case-insensitive) and `BT sprint-issues --refs <ref>`
       must return it; otherwise say so and ask again. Write
       `results["create:<key>"] = { "ok": true, "at": "<now, ISO>", "ref", "url", "title" }` —
       `url` = `https://github.com/<owner>/<repo>/issues/<n>`, `title` as `sprint-issues` returns
       it (as on GitHub) — the one edit of `results` the skill ever makes; then run 4 again.
     - **Zatrzymaj** — recommended when the first option does not apply. Say „Ponowne
       `/sprint <date>` wznowi od tej operacji.” and stop; `results` untouched. If `error` says an
       issue may already exist, repeat that: Rafał checks the repo before the rerun.
     - **Usuń tę pozycję i wznów** — only for a failure tied to one entry: `failed` is `sprint:`,
       `assign:`, `estimate:`, `drop:`, `backlog:`, `create:`, `board:`, `close:` or `keep:` with
       a ref or key, or `validate` with an `error` naming one ref of `items`, `drop` or `cleanup`.
       Never recommended: removing an entry changes the sprint. Remove that entry from its list
       in `sprint.json` (`items`, `drop`, `newIssues` or `cleanup`, by ref or key) and its line
       from `sprint.md`, never touching `results`; say in one line what was removed and which of
       its ops already ran on GitHub (they stay done); then run 4 again.

     When only **Zatrzymaj** applies (an `archive:` failure, a `validate` error naming no entry),
     ask no card: stop as **Zatrzymaj** does. Re-entry (Step 9.3) runs 4 again and, after a
     failure, asks the same card.
5. Write the final `sprint.md`: each `nowe: <title>` becomes the ref from
   `results["create:<key>"].ref`; `## Archiwizacja` gets one row per board from
   `results["archive:<board>"].archived`; `## Porządki` states what was closed and labelled;
   `## Przeniesione i odrzucone` is written from `sprint.json` whether or not Step 6 ran —
   `przeniesione:` every `items` ref that is in `review.json` `planned`, `odrzucone:` every `drop`
   (`odrzucone i do Backlogu:` with `toBacklog`); `## Dostępność i obciążenie` gets one row per
   team member in `team.json` order, cells `<zaplanowane>/<dostępne>` — load ("Load") over
   `capacity[].days`, never the capacity — `—` when both are 0, plus a
   `Bez osoby` row (planned days only) when an item has no owner. No capacity, factor or `⚠`
   in `sprint.md` (Rafał's decision „Co pokazuje opublikowana notatka sprintu” (D1), variant
   A). Then apply the template rules of "Artifacts and commands" to every section: no `<!--`, no
   `{{`, no empty section or person heading left.
6. Unless `sprint.md` already carries the marker:
   `KB publish --type sprint --date <date> --title "Sprint DD.MM–DD.MM" --file planning/sprinty/<date>/sprint.md`.
   On success add `> **Opublikowano:** <YYYY-MM-DD HH:MM>` directly below `**Status:**`. On failure
   quote it and stop; a rerun publishes.
7. Commit the folder per this repo's commit rule (`CLAUDE.md`, `CLAUDE.local.md`): run
   `git branch --show-current` first; `git add -- planning/sprinty/<date>` then
   `git commit -m "docs(sprint): sprint <date>" -- planning/sprinty/<date>`. Never `git add -A`,
   never push. If the rule forbids committing on the current branch, leave the files and say so.
8. Report: goals, items, created issues, drops, cleanup, archived counts, the number of
   `estimate:` results with `written: true`, publish time, commit hash and branch.

## Common mistakes

| Mistake | Instead |
|---|---|
| Treating `sprint.json` with empty `results` as approved and running `sprint-apply` | Approval = `finalna` or a written result (Re-entry) |
| Running `sprint-apply` (even `--check`) before **Akceptuj i wykonaj** | The walk only writes files |
| Calling `KB report` for a file already in `zrodla/` | It counts as fetched; `KB` refuses an existing file anyway |
| Reviewing a previous sprint on the first run | No earlier approved `sprint.json` → only `done-count.json`, and only its `doneCount` and `interns` |
| Keeping four goals, or dropping one yourself | Ask which to drop |
| Padding a goal with loosely related issues | Flag `BRAK ISSUE`, offer **Utwórz issue teraz** |
| Writing `DT-<n>:` into a `newIssues` title | `sprint-apply` numbers it |
| Cleanup from the `29` file or other boards (Part B handled them), or more than 5 entries | Only `candidates.json` `items` at least 30 days old and not in progress, the 5 oldest |
| A `kodozercy/*` or other project ref in `items` | Only main-board cards; project work without a card is a `Bez karty` line |
| `devstock-org/devstock-team#n` on a card or the final screen, or `#n` in `sprint.json` or `sprint.md` | `#n` on cards and the final screen; the full ref in the files, and on `Bez karty` and `Praktykanci` lines |
| A card asking for availability while every cell is empty | Ask in chat first; the card only approves the numbers |
| Retrying after `ok: false` on your own | Show `failed`/`error` and ask the Step 9.4 recovery card; a rerun resumes |
| Editing `results` other than through **Issue już istnieje — podam ref** (Step 9.4) | `results` is written by `sprint-apply`; that option is the one allowed edit |
| Computing factors or ratios yourself | Take them from `calibration.json` (`BT sprint-capacity`) |
| Capacity, factor or `⚠` in `sprint.md` | Only `zaplanowane/dostępne` there; the rest stays on the cards |
| An `items`/`newIssues` entry's `proposed` set for a value taken from the board or from Step 2b | `proposed: null` |
| An estimate as a string (`"2,5"`) or off the grid (`2.4`) | A number, a multiple of 0.5 (`2.5`) |
