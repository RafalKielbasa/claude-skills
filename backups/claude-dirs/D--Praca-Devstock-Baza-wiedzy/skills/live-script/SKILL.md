---
name: live-script
description: Write the run of show for a live event — the minute-by-minute script with [CUE] markers for the vision mixer, the host's one-page sheet, the plan B list, the OBS staging notes and the pre-live checklist. Use when Rafał prepares what happens on air and when ("scenariusz live'a", "minutówka", "ściąga dla prowadzącego", "plany B"). NOT for the boards themselves, which live-boards renders from the [CUE] markers this skill writes.
---

# /live-script — write the run of show for a live event

Result: the event's whole runbook, built from the approved demo and the
concept's own promise — the minute-by-minute run of show (tracked as
`documents.script`), the host's one-page sheet, the plan B table, the OBS
staging notes and the pre-live checklist. `live-boards` reads `status.script`
as its own hard gate and reads every `[CUE]` marker this skill writes as its
own input — a cue that names no board, or names a board no earlier cue
introduced, produces a nameless or broken deck on air. Getting the `[CUE]`
convention right is the one thing this skill exists to do (§8).

## 1. What this skill owns

Exactly one status key (`status.script`) and one documents key
(`documents.script`) in the event's `live.yaml`, plus four fixed files this
skill alone writes:

| File | Destination | Tracked by |
|---|---|---|
| Run of show | `<event>/runbook/scenariusz-live.md` | `documents.script` |
| Host's sheet | `knowledge-base/marketing/live-<date>-sciaga-prowadzacego.md` | fixed path, not a manifest field (§3) |
| Plan B | `<event>/runbook/plany-b.md` | fixed path, not a manifest field (§3) |
| OBS staging notes | `<event>/runbook/scenografia-obs.md` | fixed path, not a manifest field (§3) |
| Pre-live checklist | `<event>/runbook/pre-live-checklist.md` | fixed path, not a manifest field (§3) |

All five are written together, every time this skill writes anything (§10) —
none of the four satellite files has its own status, so a bundle where only
the run of show got refreshed would silently drift from it; this skill never
produces that state.

It never touches `status.concept`, `status.prework`, `status.demo`,
`status.boards`, `status.gift` or `status.report`. It never writes to
`seed/`, `prompts/` or `workflows/` (those are `live-demo`'s), to `plansze/`
(`live-boards`'s) or to `prezent/` (`live-gift`'s) — only to the event's own
`runbook/` and to the one host-sheet file under `knowledge-base/marketing/`.
**`kursy/` is not this skill's tree and is never touched, read or written by
it under any circumstance.**

## 2. Resolving the event argument

Accept a full folder path (`live-events/<date>-<slug>/`, trailing slash
tolerated), a bare folder name (`<date>-<slug>`), or a bare date (`<date>`)
— matched against the folder names under `live-events/`.

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event.
- More than one match — cannot happen for a bare date or a full/bare folder
  name (both unique by construction); if it ever does, list every match and
  ask Rafał to pick.
- **No argument at all** — list every `live-events/*/live.yaml` whose
  `status.demo` is `approved` and whose `status.script` is **not** `approved`
  (`missing` or `draft`) — these are the events where writing the run of show
  is actually actionable. Exactly one such event → use it, announcing which.
  None → say plainly why (no event has an approved demo yet, or every event
  with one already has an approved script) and ask Rafał which event to work
  on. More than one → ask Rafał to pick, naming them.

## 3. Path resolution rule — read this before touching any file this skill owns

`live-concept`'s SKILL.md §2 and `live-demo`'s SKILL.md §3 make the same
argument for `knowledge-base/marketing/` and `docs/superpowers/specs/`: a
shared directory holding documents from several stages is never renamed to a
uniform pattern once a document exists there, so every read of a
`documents.<stage>` field goes through the manifest, never a filename guess.
This skill's five files split into three different cases:

1. **The run of show is a `documents.script` field.** If it holds a path,
   that path is the run of show — read it directly, never pattern-match a
   filename. Only when it is `null` is there no run of show yet, and only
   then does a naming pattern apply — but unlike `documents.concept` or
   `documents.demo`, that pattern is not date-based, because `runbook/` is a
   fixed, permanent directory this skill alone populates (§1): there is no
   shared-directory collision to avoid, so the new path is always
   `live-events/<date>-<slug>/runbook/scenariusz-live.md`. This matches the
   August event's own `documents.script` exactly — that file predates this
   skill and already sits at this name. **The moment a new run of show is
   created, its path is written into `documents.script` in the same write as
   the status change** (§10) — a file on disk the manifest does not point at
   is invisible to `live-boards` and to every later reader.
2. **The plan B, OBS staging and pre-live checklist files are not
   `documents.*` fields at all**, the same way `live-demo`'s `seed/`,
   `prompts/` and `workflows/KONWENCJE.md` are not: `live-new` reserves
   `<event>/runbook/` for this skill alone before this skill ever runs, so
   there is nothing to guess and nothing to mint — read and write these three
   files at their fixed relative paths (`runbook/plany-b.md`,
   `runbook/scenografia-obs.md`, `runbook/pre-live-checklist.md`), always,
   for every event.
3. **The host's sheet lives under a shared directory
   (`knowledge-base/marketing/`) but is not a `documents.*` field either** —
   this skill owns exactly one documents key (`documents.script`, rule 1).
   Its path is still never guessed from a directory listing: it is computed
   deterministically from the event's own `date` field in `live.yaml` —
   `knowledge-base/marketing/live-<date>-sciaga-prowadzacego.md` — the same
   fixed pattern the September event's own host sheet already sits at
   (`live-2026-09-21-sciaga-prowadzacego.md`, written before this skill
   existed). Computing a path from a manifest field is not the same act as
   pattern-matching a filename against an ambiguous set of candidates; this
   is the one case in this skill where the fixed pattern applies even though
   an older document already exists at it, precisely because the brief fixes
   this pattern rather than leaving it to be minted freely the way
   `documents.concept` or `documents.demo` are.

## 4. Gate: `status.demo` must be `approved`

Once an event is resolved (by argument or by §2's default), read its
`live.yaml` and check `status.demo` before doing anything else — this is a
hard gate, not a warning, matching every other per-stage skill's gate on its
own predecessor:

- **Not `approved`** (`missing` or `draft`) → stop. Name the event, name the
  exact current value of `status.demo`, and, per `live-demo`'s own §3, whether
  `documents.demo` is `null` or points at a draft spec. Say plainly that a
  run of show written against an unapproved demo describes a show that does
  not exist — a rehearsed, approved demo is the only thing that tells this
  skill what the audience will actually see. Do not proceed to §5. Rafał's
  next step is `/live-demo approve` (or `/live-demo` if no design exists at
  all), not this skill.
- **`approved`** → continue to §5.

## 5. Does a run of show already exist

Per §3 rule 1, if `documents.script` is not `null`, that path is the existing
run of show — read it in full, and also check whether the four satellite
files (§1) are present at their fixed paths:

1. Show Rafał a short summary — the current minutówka (block names and
   time ranges), the current `status.script` value, and, if any of the four
   satellite files is missing from disk despite `status.script` not being
   `missing`, name exactly which one and that it will be (re)written this
   run regardless, since the bundle is always written together (§1).
2. Ask explicitly: work from it and revise, or leave it alone.
   - **Leave it alone** → stop here. Write nothing, change nothing in
     `live.yaml`. `git status --short` stays exactly as it was.
   - **Revise, and `status.script` is `draft`** → nothing was signed off yet,
     continue straight to §6.
   - **Revise, and `status.script` is `approved`** → tell Rafał plainly that
     continuing will drop `status.script` to `draft` until this run's own
     gate (§10) signs it off again, and get one explicit confirmation of that
     specific consequence before touching anything. On confirmation, write
     `status.script: draft` immediately — a small, isolated edit, independent
     of §10's larger write, so the manifest never claims an approved script
     while the runbook is mid-revision. Declining is the same as leaving it
     alone: stop, write nothing.

If `documents.script` is `null`, there is nothing to confirm — continue
straight to §6; this run creates a new run of show (minted per §3 rule 1
once §10 writes it), and the four satellite files are created for the first
time.

## 6. Read the promise, the concept and the demo

Read `promise` from `live.yaml` — quote it later, verbatim, in the opening
block (§8; global constraint: the script, the boards and the landing page
must use the same exact words, so they cannot drift apart). **If `promise`
still begins with `(TBD`** — `live-new`'s scaffolding placeholder — refuse to
proceed: the concept conversation that was supposed to replace it never
happened, or never finished, and quoting the placeholder verbatim in the
opening block would put it on air. Tell Rafał plainly and point him at
`/live-concept` to record the real promise first; this is a hard refusal, not
a warning, and nothing in this skill is written until it clears. Read
`documents.concept` in full for framing, personas and any objections the
decision conversation already surfaced. Read `documents.demo` in full — the
approved spec is the only source for what the audience actually sees: the
trigger, the tools, the deliberately failing path, and, where the spec
already lays out its own on-air timing (a table like the September spec's
§5 "Dwa przebiegi na antenie"), that timing is authoritative for the demo's
own sub-blocks — never re-time a demo run the spec has already measured.

If an earlier event exists (an event folder with an earlier `date`) and its
`documents.report` is readable, read it too — it is the source of concrete,
counted numbers a host sheet and a plan B grounded in wishful thinking are
not (the September host sheet's own "w sierpniu oferta trwała 4 minuty z
zaplanowanych 13" is a report number, not an estimate).

**Prices, bonuses, refund terms and course-availability facts are never
carried over from an old document without saying so.** They live in the
product's own canon, not in this skill's memory of a previous event — flag
each one to Rafał as "to confirm on the day" rather than asserting it, the
same disclaimer the September host sheet already carries in its own closing
section.

## 7. Ask only what's missing — one question per message

Do not re-ask what §6 already answered. Ask Rafał, one question at a time,
for whatever the concept and the demo spec leave open and this skill's own
outputs need:

1. **Roles for this broadcast** — who hosts, who runs the demo, who moderates
   chat, who runs production/OBS — if not already fixed anywhere readable.
2. **Total runtime and platform**, if the concept doesn't already fix them.
3. **Every open decision the demo spec itself flags** — a table like
   `documents.demo`'s own "Otwarte decyzje" section lists things nobody has
   settled yet (who clicks on air, which branch is taken when the demo
   offers a choice, whether a giveaway idea collides with what the demo just
   showed). Surface each one by name and ask; never pick an option silently
   on Rafał's behalf, the same rule `live-demo`'s own design conversation
   (§7) applies to its own open questions.
4. **Anything about the offer, the giveaway pickup mechanism or its
   expiry window that §6 flagged as unconfirmed** — get an explicit answer
   before it goes into the host sheet's "must be said" list, never a
   guess carried over from an old event.

## 8. Build the minute plan first, blocks second

The clock is the constraint. Build the `## Minutówka` table (template
`run-of-show.md`) before drafting a single block's content: total runtime
from §7, the demo's own sub-block timing from §6 dropped in unchanged, and
everything else (hook, frame, transfer-to-viewer, gift tease, offer, Q&A,
gift pickup, close) sized to fit what's left. **A block that will not fit is
cut here** — dropped from the table, never left in and shortened later once
its `[CUE]`s and boards already reference it elsewhere.

Only once the table is final, write one `## Blok N · H:MM–H:MM — <name>`
per row, each with a goal, who leads it, its beats, its literal `[D]` lines
where something must be said word for word, and its `[CUE]` line(s) —
the convention below.

### The `[CUE]` convention

Verified against every `[CUE]` in `live-events/2026-08-27-agenci-ai/runbook/scenariusz-live.md`
(11 occurrences across its 11 blocks; two more mentions
of the literal string `[CUE]` in that file are the legend's own definition
and a changelog line referencing the marker by name, neither an actual cue
instance). All 11 real cues
parse under this rule:

1. **Every `[CUE]` names what changes on screen** — the scene switched to
   (`Scena „<name>"`), or, when the scene does not change from the previous
   cue, the overlay/graphic element that changes instead. This second form
   exists because block 10 of the August script does exactly this
   (`**Overlay z licznikiem 15 minut startuje teraz.**`, no scene name,
   because the scene is still "Studio" from the previous block) — a rule
   that required every cue to name a scene would call that a defect, and it
   is not one.
2. **Every `[CUE]` states what board is on screen**, where a board is
   expected: names it with enough content that a renderer needs no other
   source, the first time it appears; says explicitly that an
   already-introduced board persists (`plansza oferty zostaje w rogu
   ekranu`) when it does; and says explicitly that no board is on screen
   (`bez planszy`, `bez licznika`) when a viewer might otherwise expect one.
3. **One board, one introducing `[CUE]`.** A board that appears anywhere in
   the run of show is introduced, in full, by exactly one cue — the first
   block where it appears. Every later cue that keeps it on screen refers
   back to it by name; it is never re-described from scratch, and it is
   never introduced a second time as if it were new.

A cue that switches scene but says nothing about the board leaves
`live-boards` guessing; a cue that names a board no earlier cue introduced
gives it nothing to render from. Both are defects in this skill's own
output, not acceptable looseness.

## 9. Write the host sheet, plan B, OBS staging notes and pre-live checklist

Derive all four from the finished blocks — never draft them independently
of the run of show, or they drift from it the first time either changes:

- **Host sheet** (`templates/host-sheet.md`) — one short section per block,
  holding only the `[D]` lines and checklist items a host must say out loud,
  plus the offer section, the chat-signal table and the "never say" table.
- **Plan B** (`templates/plan-b.md`) — one table row per failure
  `documents.demo`'s own "Wariant zapasowy" section actually names for this
  event's demo — never a generic list of things that could go wrong with any
  live broadcast.
- **OBS staging notes** (`templates/obs-staging.md`) — one `## Scena:
  <name>` section per scene named anywhere across every block's `[CUE]`
  lines, its sources in z-order, which board (if any) belongs to it, and
  which block's `[CUE]` triggers a switch to it.
- **Pre-live checklist** (`templates/pre-live-checklist.md`) — grouped into
  the day before, the hour before, the fifteen minutes before and after the
  broadcast ends; every item states a pass condition readable off a screen
  ("koszyk pokazuje 1470 zł i oba bonusy bez wpisywania kodu"), never
  "sprawdź, czy działa".

## 10. Gate: show, then write

Show Rafał everything composed so far in one message: the full run of show
(every block plus the mapa obiekcji, karta kieszonkowa and changelog
section), the host sheet, the plan B table, the OBS staging notes and the
pre-live checklist. Three outcomes:

- **Decline** — anything short of a clear yes to saving. Write nothing to
  disk, change nothing in `live.yaml`. The working tree is exactly as it was
  before this run (beyond the isolated `draft` edit from §5, if that path
  was taken).
- **Save but do not sign off** — write all five files (the run of show at
  its path per §3 rule 1, the other four at their fixed paths per §3 rules
  2-3), set `status.script: draft`, and — only when a new run of show was
  just created — write its path into `documents.script` in this same write
  (§3 rule 1). If revising an existing path, `documents.script` already
  holds it; leave it untouched.
- **Explicit approval** — same write as above, `status.script: approved`.

There is no fourth outcome and no partial write: the five files are always
written together (§1), never some now and the rest on a later run.

## 11. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from
   the repository root (or `npm run validate-live` from
   `tools/course-pipeline`). Fix and rewrite before reporting success if it
   flags this event's manifest.
2. State plainly that everything is left uncommitted.
3. **Ending at `draft`**: say plainly that `live-boards` stays blocked —
   its own gate reads `status.script`, the same hard-gate pattern this
   skill's own §4 just applied to `status.demo` — until this skill (or a
   direct edit Rafał asks for) sets it to `approved`.
4. **Ending at `approved`**: say plainly that `live-boards` can now read
   this run of show's `[CUE]` markers and proceed.

## Rules

- One question per message during §7 — never bundle two open items, or a
  follow-up, into one prompt.
- **Never guess the run of show's filename.** Every read of an existing one
  goes through `documents.script` (§3 rule 1); a newly minted path is always
  `runbook/scenariusz-live.md` under the resolved event and is written back
  into `documents.script` in the same write that changes `status.script`
  (§10).
- **The four satellite files never get their own manifest field and are
  always rewritten together with the run of show** (§1, §10) — there is no
  such thing as an OBS staging file that is "newer" or "older" than the run
  of show it stages.
- **The promise's exact words appear in the opening block.** Paraphrasing it
  is a defect — the whole point is that the script, the boards and the
  landing page use the identical sentence (§6).
- **A `promise` still starting with `(TBD` is a hard refusal, not a
  warning** (§6) — point Rafał at `/live-concept` instead of drafting
  anything.
- **The `[CUE]` convention (§8) is not optional house style — it is this
  skill's one hard requirement.** A block missing a `[CUE]`, or a `[CUE]`
  that names a board no earlier cue introduced, is refused before the gate
  in §10, not shipped with a caveat.
- `status` values are exactly `missing`, `draft`, `approved` — nothing else.
- Template comments (`<!-- -->`) in every file under `templates/` never
  survive into a written document — they are worked examples and
  instructions to replace, not content to keep.
- A price, a bonus, a refund term or a claim about what is already recorded
  is never asserted from an old document without flagging it for
  day-of-broadcast confirmation (§6) — a host sheet that states a stale
  price as current is worse than one that admits it needs a check.
- This skill never writes to `seed/`, `prompts/`, `workflows/`, `plansze/`,
  `prezent/` or `kursy/` under any circumstance (§1).
