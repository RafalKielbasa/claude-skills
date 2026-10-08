---
name: daily
description: >-
  Processes one standup (DAILY) recording into a note and the two review queues — `wpisy.yaml`
  (knowledge candidates) and `zadania.yaml` (task candidates) — then walks Rafał through every
  uncertain passage and every candidate one card at a time, behind the gate
  `docs/spotkania-kolejki.md` defines, and on his final approval executes what he approved and
  publishes to Slack. Triggers: "przetwórz daily", "notatka z daily", `/daily [date] [time]`. Not
  for whole-day offsites or short working sessions (PLANNING) — those go through `/spotkanie`.
  Not for the weekly project or trends reports — those stay in n8n (`29_weekly_project_report`,
  `31_daily_trends_digest`).
---

# /daily — standup processing

Invocation: `/daily`, `/daily <date>`, `/daily <date> <time>`. Artifacts live in
`planning/daily/<YYYY-MM-DD>-<HHMM>/`: `notatka.md`, `wpisy.yaml`, `zadania.yaml`,
`statuses.json`. One recording is one directory — a day can hold more than one standup, or a
standup and a working session, so the key is date **and** time, never date alone.

Template: `szablony/notatka.md`, next to this file. ALWAYS fill the template, never improvise its
structure. When filling it, replace the `<!-- -->` comment examples with real content and delete
the comment markers — real content never stays inside a comment.

The queue file schema, the gate, the execution order and the deduplication rules are defined once,
in `docs/spotkania-kolejki.md`, and shared with `/spotkanie`. This skill points at that document
instead of restating it — read it before Steps 6, 7 and 8 below.

## 1. Modes

- **`/daily` (no argument).** Run `kb-client pending --json` (`tools/kb-client`). The result is an
  array of `{ date, time, name, url }`; `time` is `null` for recordings whose file name carries no
  time — those are `OFFSITE` candidates, out of scope here, skip them. For every remaining
  `{ date, time }` pair, apply the same three checks `.claude/hooks/nagrania-check.ps1` uses, so
  this report and the hook's never disagree on what is unprocessed: an exact
  `planning/daily/<date>-<time>/notatka.md`; an exact `planning/robocze/<date>-<time>-*/notatka.md`
  (the matching directory alone does not count — a run interrupted before the note was written
  still leaves the recording unprocessed); and a `**Źródła:**` line naming this transcript's file
  name in any `notatka.md` under `planning/` (a whole-day note can merge several transcripts,
  including time-keyed ones). List the ones matching none of the three, one line each (date, time,
  file name), and stop — this mode only reports, it never processes anything.
- **`/daily <date> <time>`.** If `planning/daily/<date>-<time>/notatka.md` already exists, this is
  a re-entry. With `**Status:** szkic`, skip Steps 2–5 — never rebuild the note or a queue file
  over decisions already made at the gate. If `wpisy.yaml`, `zadania.yaml` or `statuses.json` is
  missing, the earlier run stopped inside Step 6: build the missing file(s) only, by Step 6's
  rules, then go to Step 7; with all three present, go straight to Step 7. With
  `**Status:** finalna`, build nothing and ask nothing: report which `approved` entries are not
  yet `indexed`, `created` or `commented`, and whether the note carries the `**Opublikowano:**`
  marker ("Execution order" in `docs/spotkania-kolejki.md`) — anything outstanding, publication
  included, runs on "przetwórz" (Step 8) — or that everything is done, and stop. Otherwise process
  exactly that recording.
- **`/daily <date>`, no time.** The candidates for that date are the pending recordings (or file
  names already sitting in `planning/transkrypty/`) plus every `planning/daily/<date>-<time>/`
  whose `notatka.md` is still `szkic`; a time found both ways counts once.
  - Exactly one → proceed with it, as if the time had been given (re-entry included).
  - More than one → list the times found, ask Rafał which one, and wait. Absence of an answer is
    not a choice.
  - None → say plainly that nothing is pending for that date and stop.

## 2. Fetching the transcript

If `planning/transkrypty/` already holds a file for this `<date>-<time>`, use it — do not fetch
again. Otherwise fetch `<date>-<time>-transkrypt.md` from Drive with the Drive MCP tools into
`planning/transkrypty/`.

- No Drive tooling in the session → say so plainly, ask Rafał for a manual copy into
  `planning/transkrypty/`, then stop.
- Not on Drive either → say plainly that n8n has not processed this recording yet, and stop —
  create nothing.

## 3. The raw transcript, when needed

The collector writes two files per recording: the redacted `<date>-<time>-transkrypt.md` and the
raw `<date>-<time>-transkrypt-surowy.md`. Read the redacted file by default.

Fetch the raw file only when a `— [wycięto: …] —` marker sits exactly where a finding, a decision,
an action item or a person's status is missing — i.e. the redaction removed the one passage this
note needs. Fetch it the same way as the redacted file (Drive MCP tools, or ask for a manual copy
if unavailable) into `planning/transkrypty/`, read only the passage that motivated the fetch, and
add a short note in `notatka.md` at that point that the raw transcript was consulted. The raw file
is deleted with everything else once Rafał accepts the note (Step 7) — it never enters git or the
vector store, same as the redacted one.

## 4. Type check

Read the spoken declaration at the opening of the transcript (e.g. "to jest daily").

- Declared type is not `daily` → stop and point at `/spotkanie` (`OFFSITE` or `PLANNING`) — build
  no note here.
- No declaration at all → ask Rafał which type this recording is, one question, and wait. Proceed
  only once he confirms `daily`.

## 5. Building the note

Create `planning/daily/<date>-<time>/notatka.md` from the template.

- **Źródła.** Fill the `**Źródła:**` metadata line with the one transcript file name this run
  consumed (the redacted `<date>-<time>-transkrypt.md`, from Step 2) — this is how
  `.claude/hooks/nagrania-check.ps1` and this skill's own no-argument mode (Step 1) recognise the
  recording as processed, so it stops being reported as pending.
- **Attendees and statuses.** The transcript is diarised; some speakers may state their own name,
  others may be addressed by name and answer in the first person — either counts as
  identification. A speaker who never provides that basis stays `Mówca A` / `Mówca B` / … even
  when only one plausible name is left once the others are accounted for — **elimination by "who
  else could it be" is a guess, not identification, and this skill never guesses a name.** Fill one
  `### <person>` block per speaker with `zrobione` / `plan` / `blokery` from what they said; a
  bullet with nothing said stays empty rather than invented.
- **Ustalenia, decyzje, action items.** Classify each relevant passage the way `/spotkanie` does —
  copy person and deadline only where they were spoken. An action item missing a person or a
  deadline gets status `do doprecyzowania`, resolved by Rafał editing the file at the gate, not by
  a mid-build question.
- **Never invent content.** A passage that is ambiguous — unclear reference, cut short, disputed
  between speakers — is quoted verbatim and flagged with the `⚠` marker `docs/spotkania-kolejki.md`
  defines ("Uncertain passages") instead of interpreted.

## 6. Building the queues

Derive one knowledge candidate per `ustalenie`/`decyzja` worth keeping, and one task candidate per
action item, into `wpisy.yaml` and `zadania.yaml` — schema, statuses and the `[YYYY-MM-DD, daily:
<topic>] ` text prefix exactly as `docs/spotkania-kolejki.md` defines. Never turn an uncertain
passage — the one Step 5 quoted and flagged instead of interpreting — into a candidate;
`docs/spotkania-kolejki.md`'s `wpisy.yaml` section states this exclusion once, for every skill that
builds this file. Propose each knowledge candidate's category per skill `baza-wiedzy`'s rules; an
ambiguous fit is a best guess corrected by Rafał at the gate, not a question asked now.

**Deduplication, run before the gate opens:**

- Knowledge: one `kb-client similar --category <c> --file <path> --json` call per candidate —
  write the candidate's exact text to a scratch file first (any path under this meeting's own
  artifact directory, deleted right after the call) and pass that path; `--text` on the command
  line would let the shell mangle backticks and quotes the candidate text may contain, silently
  sending a different string to the embedding than the one that gets upserted. `--text` stays only
  for a short ad-hoc check typed straight on the command line. Classify the result against the
  current numbers in `docs/spotkania-kolejki.md`'s "Thresholds" section — that document is the
  only place the two values live, so read it fresh each time rather than trusting a number written
  here. A match inside the upper bound comes back as `action: update` (`similar_to`,
  `similar_text`, `distance` filled), for Rafał to judge at the gate rather than being
  auto-classified `duplicate`; outside it, or no match, is `action: new`.
- Tasks: one read of the kanban board — target repository and board named once in
  `docs/spotkania-kolejki.md`'s "Deduplication before the gate" section, not restated here —
  matching by topic, drafts included. A match is `duplicate` (left `proposed`; the gate offers keeping it rejected first); a
  matched topic carrying new information is `supplement`; no match is `new`. That same section
  also carries the degradation rule for when `docs/ticket-conventions.md` is absent — read it
  before creating anything.
- Resolve `assignee` per the "Task assignment" rule in `docs/spotkania-kolejki.md`: an explicit
  declaration in the meeting first, the responsibility matrix in `docs/ticket-conventions.md` by
  the task's domain second, `null` otherwise — read that section rather than re-deriving the
  order here. A candidate the rule cannot resolve — including when `docs/ticket-conventions.md`
  itself is missing — leaves `assignee: null` and adds one visible `#` comment directly above that
  candidate's block in `zadania.yaml`, naming the person or domain and why; never a guessed login.
- **Both dedup calls degrade instead of blocking.** When `kb-client similar` cannot reach n8n,
  every knowledge candidate becomes `action: new` with `distance: null`, `similar_to: null`,
  `similar_text: null`, plus one visible `#` comment at the top of `wpisy.yaml` stating
  deduplication was unavailable. The same applies to the board read for tasks: every candidate
  becomes `action: new` with `related_item: null`, plus the same kind of comment in
  `zadania.yaml`. Either outage must not stop note-taking — it continues straight to the gate.

Write `statuses.json` as the array `kb-client publish --statuses` expects: one object per person,
`{ "person", "done": [...], "plans": [...], "blockers": [...] }`, built from the same `## Statusy`
content as the note.

## 7. The gate

Read "The gate" in `docs/spotkania-kolejki.md` fresh and run it with all five phases in one
sitting: summary, `⚠` passages, `wpisy.yaml`, `zadania.yaml`, final screen. The whole note appears
only on the final screen, with every walk decision already applied. In phase 2 a resolution that
touches a person's status is written to both `## Statusy` and `statuses.json`.

On the final screen:

- **Akceptuj i wykonaj** is Rafał's acceptance of the note and his approval of the queues in one
  answer. In this order: change `**Status:** szkic` to `**Status:** finalna` in `notatka.md`;
  delete every file from `planning/transkrypty/` except `.gitkeep` — redacted and raw alike,
  neither ever enters git or the vector store; then run Step 8.
- **Jeszcze nie** stops with nothing executed. The note stays `szkic`, `planning/transkrypty/` is
  left as it is, and `/daily <date> <time>` (or `/daily <date>`) later re-enters here (Step 1).

`finalna` is written only on **Akceptuj i wykonaj** — a status the model wrote for itself is not
Rafał's approval. Do not run git commands yourself: committing the finalised artifacts follows this
repository's normal commit flow.

## 8. Execution

Runs on **Akceptuj i wykonaj** (Step 7), or on "przetwórz" when an earlier execution was
interrupted. If `notatka.md` does not read `**Status:** finalna`, execute nothing and go to Step 7
— execution never starts from a draft. Follow the execution order in `docs/spotkania-kolejki.md`
exactly, including its two easiest mistakes and its orphan-cleanup step:

- An `approved` knowledge entry with `action: update` upserts under the `entry_id` copied verbatim
  from `similar_to` — never a freshly built one. `action: new` builds
  `planning/daily/<date>-<time>/<id>-<slug>`. Write `status: indexed` in `wpisy.yaml` the moment
  the upsert succeeds.
- Once the approved entries above are upserted, run the orphan cleanup
  `docs/spotkania-kolejki.md`'s "Execution order" section defines: list every entry under this
  meeting's `entry_id` prefix and delete any with no counterpart in the current `wpisy.yaml`.
- An `approved` task creates the issue (or, for `supplement`, comments on the existing one), is
  added to the board's `Backlog` column with its assignee, and its number is written to **both**
  `zadania.yaml` (`issue`, `status: created`/`commented`) **and** the note's `## Action items` row
  — the note and the board must agree.
- `rejected` and `duplicate` entries are left exactly as they are — no operation runs for them.
- Then publish, unless the note already carries `**Opublikowano:**`: `kb-client publish --type
  daily --date <date> --title "<title>" --file planning/daily/<date>-<time>/notatka.md --statuses
  planning/daily/<date>-<time>/statuses.json`. On success, write the marker into the note as
  "Execution order" defines.
- Write every result immediately after the operation that produced it succeeds, so an interrupted
  run resumes on the next "przetwórz" instead of repeating.
- Report what was written where: entries indexed, issues created or commented, and the publish
  result.

## Rules

- The raw transcript never enters git or the vector store, in this skill or through any path it
  triggers; only the processed note content is indexed.
- One question per message when asking Rafał anything, here or in `/spotkanie`. Absence of an
  answer is never approval — not for a choice of recording, not for a meeting type, not for the
  gate.
- When a session opens with the `SessionStart` hook's report of an unprocessed recording, offer to
  process the date it names and wait for Rafał's answer — do not start on the report alone.
