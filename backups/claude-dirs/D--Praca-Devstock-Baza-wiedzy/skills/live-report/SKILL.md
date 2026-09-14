---
name: live-report
description: Write the post-event report for a live — registrations, attendance, campaign performance, funnel and sales, with the corrections and lessons that feed the next event's concept. Use after a broadcast when Rafał has the numbers ("raport z live'a", "jak poszedł live", "podsumowanie transmisji"). The skill does not fetch data: Rafał pastes numbers from YouTube Studio, Meta Ads and the landing page into a fixed input template.
---

# /live-report — write the post-event report for a live

Result: a report document in `knowledge-base/marketing/`, tracked by
`live.yaml`'s `documents.report`. Its `approved` state is what `/live-concept`
checks for the next event (`live-concept`'s own SKILL.md §4) — this is the
last skill in the pipeline, and its sign-off is what lets the next event's
concept conversation start grounded in real numbers instead of guesses.

This skill fetches nothing. Every number in the report comes from YouTube
Studio, Meta Ads, the landing page, MailerLite and the payment log — tools
this skill has no access to. Rafał reads them himself and pastes them into a
fixed input template (`templates/numbers-input.md`); this skill never queries
an API, never opens a browser, and never estimates a number nobody supplied.

## 1. What this skill owns

Exactly one status key (`status.report`) and one `documents` key
(`documents.report`) in the event's `live.yaml`, plus the one document that
key governs, under `knowledge-base/marketing/`.

It never touches `status.concept`, `status.prework`, `status.demo`,
`status.script`, `status.boards` or `status.gift`, and it writes nothing
under the event's own `live-events/<event>/` tree — unlike `live-script`,
`live-boards` and `live-gift`, this stage has no satellite files and no
render output of its own; `live-new`'s own directory skeleton has no
`report/` folder, because there is nothing here to stage or render. The
report is a single document, drafted in conversation and written once, the
same way `live-concept` and `live-plan` write directly to
`knowledge-base/marketing/` with no staging directory. **`kursy/` is not
this skill's tree and is never touched, read or written by it under any
circumstance.**

## 2. Resolving the event argument

Accept a full folder path (`live-events/<date>-<slug>/`, trailing slash
tolerated), a bare folder name (`<date>-<slug>`), or a bare date (`<date>`)
— matched against the folder names under `live-events/`.

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event.
- More than one match — cannot happen for a bare date or a full/bare folder
  name (both unique by construction); if it ever does, list every match and
  ask Rafał to pick.
- **No argument at all** — list every `live-events/*/live.yaml` whose `date`
  is in the past (§3's gate) and whose `status.report` is **not** `approved`
  (`missing` or `draft`) — these are the events a report can actually be
  written or finished for. Exactly one such event → use it, announcing
  which. None → say plainly why (no event has happened yet, or every past
  event already has an approved report) and ask Rafał which event to work
  on — he may want to revise one that is already signed off. More than one
  → ask Rafał to pick, naming them.

## 3. Gate: the event's `date` must be in the past

Read the resolved event's `date` from `live.yaml` and compare it to today's
actual calendar date:

- **`date` is after today** → stop. Name the event and the exact value of
  `date`. Say plainly that a report describes what happened, and this event
  has not happened yet — there is nothing to report. Do not proceed to §4.
- **`date` is today or earlier** → continue to §4.

**This is the only gate.** Deliberately, this skill does not check
`status.boards`, `status.gift` or `status.script` — a report describes what
actually happened on air and afterward, not what was planned for it, so a
draft or even a `missing` run of show, deck or gift package is not a reason
to block the report. State this plainly whenever the gate passes, so nobody
later adds a dependency on another stage's status here.

This is a hard gate, not a warning — unlike `/live-concept`'s own soft gate
on the *previous* event's report (`live-concept` SKILL.md §4), which asks
and proceeds on confirmation. There is no equivalent override here: a future
`date` always stops the run.

## 4. Does a report already exist

Per the standing ruling on document paths, `documents.report` is read from
`live.yaml`, never guessed from a filename pattern under
`knowledge-base/marketing/`:

- **`documents.report` is `null`** — nothing to confirm. This run creates
  the report for the first time; proceed to §5. When it is written (§9), its
  path is minted as `knowledge-base/marketing/live-<YYYY-MM-DD>-raport-wynikowy.md`,
  using the event's own `date` — the same
  `live-<YYYY-MM-DD>-<artifact>.md` pattern `/live-concept` uses for a new
  concept document, never applied to an existing path (the August event's own
  `live-agenci-ai-raport-wynikowy.md` predates this skill and is never
  renamed to match).
- **`documents.report` holds a path** — read the existing report in full and
  show Rafał a short summary (its `## 0` summary, its current `status.report`
  value, and whether it reads as closed or still provisional) before deciding
  whether to revise:
  - **Leave it alone** → stop here. Write nothing, change nothing in
    `live.yaml`. `git status --short` stays exactly as it was.
  - **Revise, `status.report` is `draft`** → nothing was signed off yet;
    proceed straight to §5.
  - **Revise, `status.report` is `approved`** → tell Rafał plainly that
    continuing drops `status.report` to `draft` until this run's own gate
    (§9) signs it off again, and get one explicit confirmation of that
    specific consequence before touching anything. On confirmation, write
    `status.report: draft` immediately, as its own isolated edit, independent
    of the larger write in §9 — the manifest never claims an approved report
    while it is mid-revision. Declining is the same as leaving it alone:
    stop, write nothing further.

When revising, the numbers already in the existing report are reference
material at best, never a substitute for §5 — a number quoted before can
turn out to have come from the wrong panel or the wrong date range (§6),
which is exactly the kind of mistake a revision exists to catch.

## 5. This skill fetches nothing — hand over the input template, then wait

State plainly, before asking for anything: this skill has no access to
YouTube Studio, Meta Ads Manager, the landing page's analytics, MailerLite or
the payment log. It will not estimate, round, or infer a number Rafał has not
supplied — an empty field stays empty and is written into the report as
"brak danych," never guessed at.

Show Rafał the full contents of `templates/numbers-input.md` in one message,
with its header's `<TYTUŁ>` and `<DATA>` placeholders filled from this
event's own `title` and `date`. This is a fixed form, not a free-form ask —
a free-form paste would leave this skill guessing which pasted number answers
which question, which is exactly what the fixed template exists to prevent.

Then **wait**. Rafał can answer inline in his reply or paste back a locally
filled copy of the template — either way, nothing is drafted from it until
it comes back. This skill creates no file for the filled-in numbers: they
live in the conversation until §9 writes the finished report to its real
path. If what comes back leaves fields blank, do not chase every one before
proceeding — ask once whether Rafał wants to fill any of them now or move on
with those marked as missing, and respect the answer.

## 6. Quote verbatim; name the source and the date range; show disagreements

These rules govern every number that ends up in the drafted report (§8):

1. **Quote every number exactly as Rafał wrote it.** Never round differently,
   never recompute a percentage he already gave, never convert a currency or
   a unit.
2. **Name the source and the date range next to the number**, and make the
   source specific — the exact panel or dashboard view, not just the product
   — taken from whatever Rafał wrote on that field in `numbers-input.md`,
   never just the metric's section heading. The August report's own worst
   correction (`live-agenci-ai-raport-wynikowy.md` §1) was an attendance
   figure announced right after the broadcast — 75 peak, 58 average — that
   turned out to come from a different panel than the one the report finally
   uses: "Wcześniejsze pochodziły z panelu transmisji, który liczy inaczej"
   (the earlier numbers came from the live-streaming panel, which counts
   differently). YouTube Studio's own figures for the same event, 64 and 52,
   are the ones the report treats as authoritative. Nothing about the date
   range was at fault here — a source label that only says "YouTube" would
   not have caught it either, since both panels are shown for the same
   event; only naming the *exact* panel does.
3. **Where two sources — or two moments — disagree on the same metric**
   (`numbers-input.md`'s own "inne liczby publicznie" field for attendance,
   its §8 discrepancies field, or anything else Rafał flags), report **both**
   numbers, name both sources, and say plainly which one this report uses
   going forward and why. Never pick one silently and drop the other.
4. **A ratio computed from two numbers Rafał did supply is not an estimate**
   — e.g. audience rotation from unique viewers ÷ peak concurrent, or cost
   per new contact from spend ÷ new contacts, when Rafał left that specific
   field blank in `numbers-input.md`. Compute it, and say plainly it was
   computed and from which two fields. This is different from inventing a
   number nobody supplied at all.

## 7. The qualitative debrief — one question at a time

`## 0` of `templates/report.md` needs content no platform reports: what
mattered most about how the broadcast actually went, the single zero-cost
change with the highest impact for next time, what would bring more people,
and what to measure next time that wasn't measured this time. None of that
is in `numbers-input.md` — it is Rafał's own read of the event, and only he
has it.

Once §5's numbers are in, ask for this in a short conversation, one question
per message, never batched:

1. What is the one thing about how the broadcast actually went that matters
   most for next time — a technical problem, a strong moment, something the
   chat reacted to?
2. If you had to name one change that costs nothing and would have the
   single biggest impact next time, what is it?
3. What would bring more people next time?
4. What should we measure next time that we didn't measure this time?
5. Anything about the giveaway or the sale worth recording beyond the
   numbers already given?

Every answer is attributed to Rafał in the draft the same way a number is
attributed to its source — this is judgment, not measurement, and the report
must not blur the two (§8).

## 8. Draft the report — separate measured from inferred

Compose `templates/report.md` from exactly two things: the numbers from §5/§6
and the debrief answers from §7. Fill every `<!-- -->` template comment with
real content and delete the comment; never leave a worked example standing in
for real content.

Throughout the draft:

- **A measured statement is a number from §5**, quoted per §6, with its
  source and date range. It reads as a fact.
- **An inferred statement is a conclusion or a recommendation** — it names
  which measured number(s), or which debrief answer, it rests on. A sentence
  that cannot be traced to one of those is a hypothesis and must say so in
  those words, not stand as a finding.
- `## 8. Co zmienić następnym razem` is the section `/live-concept` reads for
  the next event (its own SKILL.md §5) — write it so it stands on its own
  without the rest of the document, and keep the zero-cost changes, the
  team-decision items, and the "measure next time" items visibly separate,
  the same three-way split the August report uses in its own closing section.

Show Rafał the composed report in full before §9 — this is drafting, held in
context; nothing touches disk until the gate says so.

## 9. Gate: show, then write for real

Rafał has already seen the drafted report (§8). Three outcomes:

- **Decline** — anything short of a clear yes to keeping it. Write nothing.
  Nothing under `knowledge-base/marketing/` or `live.yaml` was ever touched
  (beyond the isolated `draft` demotion from §4, if that path was taken), so
  `git status --short` is exactly as it was before this run.
- **Save but do not sign off** — write the report to its real path (the
  existing `documents.report` path if this is a revision, or the newly
  minted `live-<YYYY-MM-DD>-raport-wynikowy.md` path per §4 if this is a
  first run). Set `status.report: draft`, and — only when this run created
  the document for the first time — write its path into `documents.report`
  in the same write. If revising, `documents.report` already holds this
  path; leave it untouched.
- **Explicit approval** — same write as above, `status.report: approved`.

There is no fourth outcome.

## 10. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from
   the repository root (or `npm run validate-live` from
   `tools/course-pipeline`). Fix and rewrite before reporting success if it
   flags this event's manifest.
2. State plainly that everything is left uncommitted.
3. **Ending at `draft`**: say plainly that `/live-concept`, when it next runs
   for a future event, will find `status.report` short of `approved` and
   warn about it rather than block (`live-concept` SKILL.md §4) — the concept
   conversation can still proceed on Rafał's word, but it starts one warning
   short of a clean read on this event's numbers.
4. **Ending at `approved`**: say plainly that this document is now what
   `/live-concept` will read as the previous event's report the next time it
   runs — the loop this pipeline exists to close.

## Rules

- **The only gate is the event's `date`** (§3) — never add a dependency on
  `status.boards`, `status.gift` or `status.script`. A report describes what
  happened, not what was approved beforehand.
- **This skill fetches nothing, ever.** No API call, no browser, no
  estimate of a number Rafał has not supplied (§5). A blank field is written
  as "brak danych," never guessed.
- **Every number is quoted verbatim with its source and date range** (§6).
  Where two sources disagree, both are shown and the choice between them is
  explained, never made silently.
- **Measured and inferred are never blurred** (§8). Every conclusion names
  the number(s) or debrief answer it rests on; anything that cannot be
  traced that way is a hypothesis, stated as one.
- **`## 8. Co zmienić następnym razem` stands on its own** (§8) — it is the
  one section the next event's `/live-concept` actually reads.
- One question per message during the debrief (§7) — never bundle two
  questions into one prompt.
- `status` values are exactly `missing`, `draft`, `approved` — nothing else.
- This skill never writes to `seed/`, `prompts/`, `workflows/`, `runbook/`,
  `plansze/`, `prezent/` or `kursy/` under any circumstance (§1).
- **Never write or edit anything at the real `knowledge-base/marketing/...`
  report path until §9's gate says save or approve.** The draft lives only
  in the conversation until then (§8) — there is no staging directory for
  this skill to clean up, because there is nothing here to render.
