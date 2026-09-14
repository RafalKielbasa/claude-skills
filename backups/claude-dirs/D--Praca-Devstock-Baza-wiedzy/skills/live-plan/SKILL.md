---
name: live-plan
description: Build the pre-work plan for a live event — time budget, backward calendar from the broadcast date, bottlenecks, and work blocks covering positioning, landing page, paid campaign, mail sequence, demo environment, run of show, visuals, giveaway, offer, broadcast production and rehearsal. Use when Rafał asks what has to happen before a live and by when ("prace przed", "plan przed livem", "co musimy zdążyć"). NOT for the on-air minute plan, which is live-script.
---

# /live-plan — build the pre-work plan for a live event

Result: a pre-work plan in `knowledge-base/marketing/`, tracked by `live.yaml`'s
`documents.prework`, built from the approved concept's decisions. Unlike
`documents.concept`, nothing downstream reads `status.prework` or
`documents.prework` — this plan exists for Rafał's own scheduling, not as a
gate for `live-demo`, `live-script`, `live-boards`, `live-gift` or
`live-report`. Say that plainly at the end of every run (§10).

## 1. What this skill owns

Exactly one status key (`status.prework`) and one documents key
(`documents.prework`) in the event's `live.yaml`, plus the file that key
governs. It reads `documents.concept` and `status.concept` as its only
upstream input and never writes to them. It never touches any other stage key
(`status.demo`, `status.script`, `status.boards`, `status.gift`,
`status.report`), never edits the event's own directory tree
(`live-events/<date>-<slug>/`) — that tree belongs to `live-new` and the
per-stage skills that build real assets — and it gates nothing downstream: no
other skill's own gate may depend on `status.prework`, ever (§10, Rules).

## 2. Path resolution rule — read this before touching any `documents.*` field

`knowledge-base/marketing/` is not renamed to a uniform pattern when a skill
starts managing it — see `live-concept`'s SKILL.md §2 for the full argument
against guessing filenames; it is not repeated here, only restated for this
skill's own two fields:

1. **If `documents.prework` holds a path, that path is the document.** Read
   it directly. Never pattern-match a filename, never assume a naming
   convention.
2. **Only when `documents.prework` is `null` is there no document yet.** A
   naming pattern applies only to a document this skill is about to create:
   `live-<YYYY-MM-DD>-prace-przed.md` under `knowledge-base/marketing/`. The
   August event's own `live-agenci-ai-prace-przed.md` predates this skill and
   keeps its slug name forever — it is never renamed to match a pattern
   invented after the fact.
3. **The moment a new document is created, its path is written into
   `documents.prework` in the same write as the status change** (§9). A
   document on disk that the manifest does not point at does not exist as far
   as the next reader of this event is concerned — Rafał included, the next
   time any skill or a plain file listing is his only way back to it.

The same rule governs the one upstream field this skill reads:
`documents.concept`. Its path always comes from the manifest, never from a
filename guess — on the August event it points at
`live-agenci-ai-mapa-decyzji.md`, on the September event at
`live-2026-09-21-koncepcja.md`; neither name is predictable from the event's
date alone, and this skill never tries to predict it.

## 3. Which event, and the gate on `status.concept`

**Resolving the argument.** Accept a full folder path
(`live-events/<date>-<slug>/`, trailing slash tolerated), a bare folder name
(`<date>-<slug>`), or a bare date (`<date>`) — match it against the folder
names under `live-events/`.

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event (a typo'd
  date or slug is the usual cause).
- More than one match — cannot happen for a bare date (each date owns exactly
  one folder) or a full/bare folder name (unique by construction); if it ever
  does, list every match and ask Rafał to pick.
- **No argument at all** — list every `live-events/*/live.yaml` whose
  `status.concept` is `approved` and whose `status.prework` is **not**
  `approved` (`missing` or `draft`) — these are the events where pre-work
  planning is actually actionable right now. Exactly one such event → use it,
  announcing which. None → say plainly why (either no event has an approved
  concept yet, or every event with an approved concept already has an
  approved pre-work plan) and ask Rafał which event to work on — he may want
  to revise an already-approved plan. More than one → ask Rafał to pick,
  naming them.

Read the resolved event's `live.yaml`. Check `status.concept` before doing
anything else — this is a hard gate, not a warning:

- **Not `approved`** (`missing` or `draft`) → stop. Name the event, name the
  exact current value of `status.concept`, and, per §2, whether
  `documents.concept` is `null` or points at a draft. Say plainly that a
  pre-work plan needs an approved concept to build a calendar and a block
  list against, and stop there — do not derive a calendar, do not ask about
  blocks, do not touch `live.yaml`. Rafał's next step is `/live-concept` on
  this event, not this skill.
- **`approved`** → continue to §4.

## 4. Does a pre-work plan already exist

Per §2, if `documents.prework` is not `null`, that path is the existing plan
— read it:

1. Show Rafał a short summary — the milestone table's date range and the
   block list's letters and names — together with the current
   `status.prework` value.
2. Ask explicitly: work from it and revise, or leave it alone.
   - **Leave it alone** → stop here. Write nothing, change nothing in
     `live.yaml`. `git status --short` stays exactly as it was.
   - **Revise, and `status.prework` is `draft`** → nothing was signed off, so
     continue straight to §5; there is nothing to protect yet.
   - **Revise, and `status.prework` is `approved`** → tell Rafał plainly that
     continuing will drop `status.prework` to `draft` until he re-approves the
     revised version at §9's gate, and get one explicit confirmation of that
     specific consequence before touching anything. On confirmation, write
     `status.prework: draft` to `live.yaml` immediately — a small, isolated
     edit, independent of the larger write in §9, so the manifest never
     claims an approved status for a plan that is mid-revision. Declining
     this confirmation is the same as leaving it alone: stop, write nothing.

If `documents.prework` is `null`, there is nothing to confirm — continue
straight to §5; this run creates a new plan (and mints its filename from the
date-based pattern in §2 once §9 writes it).

## 5. Read the concept before deriving anything

Read the document at `documents.concept` (per §2 — never a filename guess) in
full. It is the only source for §7's block proposals and for §8's bottleneck
candidates — never invent a block or a bottleneck the concept doesn't
support. Pull out, specifically:

- the decisions the concept recorded (goal, core demo, presentation
  principle, the free/paid boundary, the offer, and whatever else the
  conversation surfaced) — each is a candidate work block for §7;
- anything the concept flagged as still open (a decision map's "Otwarte
  pytania dla zespołu" section, or equivalent) — each open item is a
  candidate bottleneck for §8, the same way unresolved questions drove the
  August plan's own bottlenecks and its §5 index of blocking decisions;
- the event's `date` from `live.yaml` — the only field §6's calendar needs.

## 6. Derive the backward calendar

**Business days are Monday through Friday.** Saturday and Sunday are never a
milestone date and never count toward any offset in this section — skip them
silently when walking the calendar, the same way the August plan's own
business-day count did (`knowledge-base/marketing/live-agenci-ai-prace-przed.md`
§1: "11 dni roboczych" between 12.08 and 26.08, spread across three runs split
by two weekends).

Two separate counts — do not conflate them:

1. **Time budget (template §1).** Count business days from today (inclusive)
   through the business day immediately before the broadcast (inclusive) —
   the broadcast day itself is never counted as work time. State the count
   and the actual date range ("N dni roboczych: DD.MM–DD.MM"), the same shape
   as the August plan's own §1.
2. **Milestone calendar (template §2).** Anchor every milestone to the
   broadcast date `D` itself, never to today — a milestone's date must not
   move just because the skill happens to run on a different day. Walk
   backward from `D` one business day at a time. This is the canonical
   sequence, verified to reproduce the August event's own §2 exactly:

   | Offset from `D` | Milestone |
   |---|---|
   | `D` (BD-0) | **LIVE** |
   | BD-1 | Próba generalna |
   | BD-2 | Demo zamrożone; transmisja przetestowana; follow-up gotowy |
   | BD-3 | Prezent gotowy; koszyk / płatność przetestowane |
   | BD-4 | Scenariusz zamknięty i slajdy gotowe; demo działa end-to-end |
   | BD-5 | Komunikacja do zamkniętej grupy (np. VIP) wysłana |
   | BD-6 | Start płatnej kampanii + pierwsza wysyłka do bazy |
   | BD-7 | Landing rejestracji live'a opublikowany |
   | BD-8 | Spotkanie zespołu — decyzje z koncepcji domknięte |
   | BD-9 | Pozycjonowanie (tytuł + obietnica) domknięte |

   Convert each offset to an absolute date by walking back from `D`, skipping
   weekends. Never write a milestone on a Saturday or Sunday, and never
   express an offset as "N dni przed" in the finished document — template §2
   wants a `Data` column holding a real calendar date, not a formula.
3. **Short runway.** When fewer than 9 business days separate today from `D`,
   the full ten-row table above does not fit. Do not silently drop the
   earliest rows: name the compression as a bottleneck in §8 ("N dni
   roboczych zamiast 9 — kamienie milowe X, Y, Z przypadają na jeden dzień"),
   then collapse the earliest rows (BD-9, BD-8, … working inward) onto the
   earliest date that is still on or after today. **Collapsed milestones stay
   separate rows sharing that one `Data` value — never merge their text into
   one row:** each keeps its own name and its own "Zależy od" entry, because
   merging would erase exactly the dependency order among the collapsed items
   that a short runway most needs to make visible (e.g. "Landing rejestracji"
   still depends on "Spotkanie zespołu" even once both fall on the same
   calendar day). Never schedule a milestone in the past — if fitting all ten
   rows would require that, the shortage itself is the bottleneck to report,
   not a reason to invent a milestone before today.
4. **"Zależy od" column.** Fill it once §7's block list exists — a
   milestone's dependency is the block(s) whose completion it certifies (e.g.
   "Landing live'a" depends on the positioning block being locked), never a
   vague "wcześniejsze ustalenia".

## 7. Blocks — one question per message

Propose a block list from what §5 pulled out of the concept — one block per
work area the concept's decisions actually imply: positioning, landing page,
paid campaign, mail sequence, demo environment, run of show, visuals,
giveaway, offer, broadcast production, rehearsal. The August event's A–N
(`knowledge-base/marketing/live-agenci-ai-prace-przed.md` §4) is the worked
example of shape and granularity, not a checklist every event must satisfy —
some events need fewer blocks, some need one this list doesn't name.

Ask Rafał, one question per message, never batching:

1. Show the proposed block list and ask which apply to this event — he may
   drop, rename, or add freely; the concept's decisions are the source, not
   this skill's imagination.
2. For each block that applies, ask who owns it — a name, or "NIEPRZYPISANY —
   do rozstrzygnięcia" if the concept left it genuinely open, the way the
   August plan flagged its block I explicitly rather than guessing an owner.

Each confirmed block gets a **Termin** — the milestone from §6 it feeds, not
an independently invented deadline. A block with no corresponding milestone
is a sign either the calendar is missing a row or the block does not belong
in this plan.

Each confirmed block also gets its own **Blokada** — what specifically stops
it from starting: another block, an unresolved decision from §5, or literally
"brak — do zrobienia od razu" if nothing does. This is not redundant with the
milestone's own "Zależy od" column: several blocks routinely share one
`Termin` (the August plan's own Fri 21.08 carries blocks F, G and H at once),
and that shared milestone-level dependency cannot also express that block G
specifically waits on block F finishing first — only a per-block field can.
Never leave it blank; "brak" is a real answer, silence is not.

## 8. Bottlenecks

State two or three explicitly, never zero — a plan without named bottlenecks
is a wish list, not a plan. Sources, in order of priority:

1. any compression §6 had to apply to fit the milestone calendar into a short
   runway;
2. any open question §5 found in the concept that blocks a specific block
   from §7 (`5.N`-style cross-references, if the concept numbered its open
   questions the way the August decision map did);
3. any single person or single day carrying disproportionate load — the
   August plan's own §3.3 ("ścieżka krytyczna zbiega się na Rafale": one
   person owns 7 of 14 blocks, three of them sharing one deadline) is the
   worked example of what this looks like.

Each bottleneck names a fallback — what happens if it materializes — never
just a diagnosis on its own. Write the finished list into template §3, one
`### N.M` subsection per bottleneck plus its fallback.

## 9. Gate: show, then write

Show Rafał the composed plan in full — all five template sections. Three
outcomes:

- **Decline** — anything short of a clear yes to saving. Write nothing to
  disk, change nothing in `live.yaml`. The working tree is exactly as it was
  before this run (beyond the isolated `draft` edit from §4, if that path was
  taken).
- **Save but do not sign off** — write the file per §2 (the existing path if
  revising, the freshly minted `live-<YYYY-MM-DD>-prace-przed.md` path if
  creating), set `status.prework: draft`, and — only when a new document was
  just created — write its path into `documents.prework` in this same write
  (§2 rule 3). If revising an existing path, `documents.prework` already
  holds it; leave it untouched.
- **Explicit approval** — same write as above, `status.prework: approved`.

## 10. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from the
   repository root (or `npm run validate-live` from `tools/course-pipeline`).
   Fix and rewrite before reporting success if it flags this event's
   manifest; nothing else in the repo should need touching to make it pass.
2. State plainly that everything is left uncommitted.
3. Say explicitly that this plan gates nothing downstream: `live-demo`,
   `live-script`, `live-boards`, `live-gift` and `live-report` do not read
   `status.prework` or `documents.prework` at all, unlike the hard gate this
   skill itself just enforced on `status.concept` in §3. A pre-work plan left
   at `draft`, or skipped entirely, never blocks another skill from running —
   it exists for Rafał's own scheduling, so downstream work can proceed in
   parallel regardless of this stage's status.

## Rules

- One question per message during the block conversation (§7) — never bundle
  the "which blocks apply" question with the "who owns it" question.
- **Never guess a filename under `knowledge-base/marketing/`.** Every read of
  `documents.concept` or `documents.prework` goes through the manifest field
  (§2); a new plan's path is minted only per §2's date-based pattern and
  written back into `documents.prework` in the same write that changes
  `status.prework` (§9).
- Every milestone date in template §2 is an absolute calendar date, never a
  relative phrase ("dwa tygodnie przed", "tydzień wcześniej").
- `status` values are exactly `missing`, `draft`, `approved` — nothing else,
  matching every other manifest in `live-events/`.
- **This skill gates nothing downstream** (§10). If a later skill's own
  SKILL.md is ever found to depend on `status.prework` or `documents.prework`,
  that is a defect in that skill, not a reason to change this one.
- The gate on `status.concept` (§3) is hard, never a warning — unlike
  `live-concept`'s own soft gate on the previous event's report.
- Never invent a block, a bottleneck, or a milestone the concept and the
  calendar in §6 don't actually support.
- Every block's **Blokada** field is filled — "brak — do zrobienia od razu"
  if nothing blocks it — never left silently blank (§7, template §4).
- Template comments (`<!-- -->`) never survive into a written document — they
  are worked examples to replace, not content to keep.
