---
name: live-concept
description: Run the decision conversation for a live event and write it down — the decision map (goal, core demo, free/paid boundary, giveaway, offer) and the concept document grounded in the previous event's numbers. Use when Rafał is deciding what a live should be about ("koncepcja live'a", "o czym robimy live", "mapa decyzji"). NOT for the minute-by-minute run of show, which is live-script.
---

# /live-concept — decide what the live is about

Result: a concept document in `knowledge-base/marketing/`, tracked by
`live.yaml`'s `documents.concept`, usually written alongside a companion
decision map (untracked — see §2 and §8 for why). Every other stage
(`live-plan`, `live-demo`, `live-script`, `live-boards`, `live-gift`,
`live-report`) reads `documents.concept` as its own starting point, so this is
the first per-stage skill to run on a freshly scaffolded event.
`live-<YYYY-MM-DD>-koncepcja.md` and `live-<YYYY-MM-DD>-mapa-decyzji.md` are the filenames
this skill mints for a **brand-new** document — see §2 for why an existing one
is never renamed to match.

## 1. What this skill owns

Exactly one status key (`status.concept`) and one documents key
(`documents.concept`) in the event's `live.yaml`, plus the file(s) that key
governs — and, as a second owned field, `promise` itself: this is the only
skill that ever writes it, turning `live-new`'s scaffolding placeholder
(`"(TBD — do ustalenia w /live-concept)"`) into the real one-sentence
commitment the conversation in §6 settles on, written in §8. It never touches
`status.prework`, `status.demo` or any other stage key, never edits the
event's own directory tree (`live-events/<date>-<slug>/`) — that tree belongs
to `live-new` and the other per-stage skills — and never writes the
minute-by-minute run of show (`documents.script`, owned by `live-script`).

## 2. Path resolution rule — read this before touching any `documents.*` field

`knowledge-base/marketing/` is not renamed to a uniform pattern when a skill
starts managing it — doing that would force a vector-database re-index for no
functional gain. `live-events/2026-08-27-agenci-ai/live.yaml`'s
`documents.concept` already points at `live-agenci-ai-mapa-decyzji.md`, a
slug-named file that predates this skill; `documents.report` on that same
event points at `live-agenci-ai-raport-wynikowy.md`. Neither matches a
date-based pattern, and neither ever will. The manifest exists precisely so no
skill has to guess:

1. **If `documents.<stage>` holds a path, that path is the document.** Read it
   directly. Never pattern-match a filename, never assume a naming convention,
   never look for a "companion" file next to it by guessing a name — if it
   is not named in a `documents.*` field, treat it as not existing for the
   purposes of this skill.
2. **Only when `documents.<stage>` is `null` is there no document yet.** A
   naming pattern applies only to a document this skill is about to create:
   `live-<YYYY-MM-DD>-koncepcja.md` for the concept document,
   `live-<YYYY-MM-DD>-mapa-decyzji.md` for its companion decision map.
3. **The moment a new document is created, its path is written into
   `documents.concept` in the same write as the status change** (§8). A
   document on disk that the manifest does not point at is invisible to every
   later skill — `live-plan`, `live-demo`, and everything downstream read
   `documents.concept`, not a directory listing.

This rule governs every `documents.*` read in this skill: this event's own
`documents.concept` (§3), the previous event's `documents.report` and
`documents.concept` (§4, §5) — all of them come from the manifest field, never
from a filename guess.

## 3. Which event, and does a concept already exist

**Resolving the argument.** Accept a full folder path
(`live-events/<date>-<slug>/`, trailing slash tolerated), a bare folder name
(`<date>-<slug>`), or a bare date (`<date>`) — match it against the folder
names under `live-events/`. Given no argument, use the rule below instead of
asking for one outright.

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event (a typo'd date
  or slug is the usual cause).
- More than one match — cannot happen for a bare date (each date owns exactly
  one folder, enforced when the folder was created) or a full/bare folder name
  (unique by construction), but if it ever does, list every match and ask
  Rafał to pick.
- **No argument at all** — list every `live-events/*/live.yaml` whose
  `status.concept` is not `approved` (`missing` or `draft`). Exactly one such
  event → use it, announcing which. None → there is no obvious next event
  (every concept is already approved); ask Rafał which event to work on — he
  may want to revise one that is already signed off. More than one → ask
  Rafał to pick, naming them.

Read the resolved event's `live.yaml`. Per §2, if `documents.concept` is not
`null`, that path is the existing artifact — read that exact file (whatever
shape it turns out to be: a full concept document, or, for an older event like
August, a decision map that was never split out into a separate concept
document — either way, it is what `documents.concept` says it is, not what a
filename pattern would predict):

1. Show Rafał a short summary of what was read — title, date, one paragraph of
   gist — together with the current `status.concept` value.
2. Ask explicitly: work from it and revise, or leave it alone.
   - **Leave it alone** → stop here. Write nothing, change nothing in
     `live.yaml`. This is the decline path, and it must leave `git status
     --short` exactly as it was.
   - **Revise, and `status.concept` is `draft`** → nothing was signed off, so
     continue straight to §4; there is nothing to protect yet.
   - **Revise, and `status.concept` is `approved`** → tell Rafał plainly that
     continuing will drop `status.concept` to `draft` until he re-approves the
     revised version at the closing gate (§8), and get one explicit
     confirmation of that specific consequence before touching anything. On
     confirmation, write `status.concept: draft` to `live.yaml` immediately —
     a small, isolated edit, independent of the larger write in §7-§8 — so the
     manifest never claims an approved status for content that is mid-revision.
     Declining this confirmation is the same as leaving it alone: stop, write
     nothing.

If `documents.concept` is `null`, there is nothing to confirm — continue
straight to §4; this run will create a new concept document (and, per §2,
mint its filename from the date-based pattern once §7 composes it).

## 4. Gate: the previous event's report (warning, never a block)

Find the previous event: among every OTHER `live-events/*/live.yaml`, the one
with the latest `date` strictly before this event's `date`. None exists (this
is the first event ever) → say so and skip straight to §5; there is no prior
report to ground numbers in.

Otherwise read the previous event's `status.report`:

- **`approved`** → proceed silently, no warning needed.
- **`draft` or `missing`** → name exactly what is missing (the status value,
  and whether `documents.report` is `null` — per §2, never guess a report
  filename if it is) and ask Rafał explicitly whether to continue anyway. This
  is a warning, never a block — two events legitimately overlap (a concept can
  be written for the next live while the previous one is still being reported
  on). Proceed only on an explicit yes; a decline here stops the run the same
  way declining §3 does (nothing written, nothing changed).

## 5. Read before asking

Once the gate clears, read, when they exist — both taken from the previous
event's `live.yaml` fields per §2, never from a filename pattern:

- the previous event's report, at `documents.report`;
- the previous event's concept, at `documents.concept`;
- `knowledge-base/marketing/tematy-na-live-*.md`.

Summarise for Rafał in one message before the conversation starts: what the
numbers say (attendance, funnel, sales, benchmark against earlier events),
what the audience explicitly asked for, and — your own read, flagged as such —
what is worth repeating from the previous event and what is not. This
grounds the conversation in §6; do not start asking decisions cold.

## 6. Conversation

One question per message, never batch. Work through the decisions in the
order `templates/decision-map.md` lays out: goal of the live, core demo,
presentation principle, the free/paid boundary (the giveaway), and the offer —
plus any further decisions this particular event's conversation surfaces
(format, division of responsibilities, date and traffic source, whatever
actually comes up). For each decision, record the options considered, not
only the winner — the decision map's table exists precisely so a rejected
option and its trade-off survive, not just the final call.

Also ask Rafał directly, as its own question, for the live's promise — the
one sentence the audience should be able to repeat back afterwards, in his
own words. Record it verbatim; it is what `live-script` will later quote
unparaphrased in the opening block and `live-boards` on the title board (§8
writes it into `live.yaml`, replacing `live-new`'s `(TBD` placeholder).

## 7. Compose the documents

Fill the concept template from the conversation entirely from what Rafał
actually said in §6 and what §5 established as fact. Fill the decision-map
template too, in every case below — §6 requires recording
options considered for every decision this run's conversation touches, and
that record has to live somewhere. Fill every `<!-- -->` template comment with
real content and delete the comment; never leave a worked example standing in
for real content. This is drafting, held in context — nothing touches disk
yet; §8 is the write gate.

Where each document is saved depends on what §3 found, resolved into exactly
three cases — check them in this order, never skip straight to a guess:

1. **Revising, and a decision map already exists at this event's own canonical
   path** (`knowledge-base/marketing/live-<date>-mapa-decyzji.md`). Checking
   for this one file is not the guessing §2 forbids: it is the single path
   this skill itself ever writes a decision map to, so its presence or absence
   is a fact this skill can verify about its own past output — unlike the
   concept document, whose provenance can predate this skill entirely (August,
   September) and whose path must therefore always come from
   `documents.concept`, never from a probe. Both documents exist — revise both, writing
   back to their own paths: the concept to `documents.concept`'s path, the
   decision map to the canonical path just confirmed.
2. **Revising, and no decision map exists at that canonical path** — the
   September state: `documents.concept` points at a real concept document
   (`live-2026-09-21-koncepcja.md`), but `live-2026-09-21-mapa-decyzji.md`
   does not exist anywhere. The concept exists; the record of *why* is either
   missing or lives only inside the concept's own prose. Write a **fresh**
   decision map now, at the canonical path, holding whatever decisions this
   run's conversation actually revisited — never silently skip it, because a
   decision discussed in §6 and written down nowhere is a decision lost. This
   new decision map is dated today and only needs to cover what this run
   discussed; it is not a reconstruction of history that predates this run.
3. **Creating** (`documents.concept` was `null` at the start of this run) —
   mint `live-<YYYY-MM-DD>-koncepcja.md` for the concept document and
   `live-<YYYY-MM-DD>-mapa-decyzji.md` for its companion decision map, both
   under `knowledge-base/marketing/`.

Never rename an existing path (the concept's, or a decision map found under
case 1) to the date-based pattern just to look uniform — per §2, an existing
path is read and written back exactly where it already is.

## 8. Gate: show, then write

Show Rafał both composed documents in full. Three outcomes:

- **Decline** — anything short of a clear yes to saving. Write nothing to
  disk, change nothing in `live.yaml`. The working tree is exactly as it was
  before this run (beyond the isolated `draft` edit from §3, if that path was
  taken).
- **Save but do not sign off** — write the file(s) per whichever of §7's three
  cases applied, set `status.concept: draft`, write the promise recorded in
  §6 into `live.yaml`'s `promise` field, and — only in §7's case 3 (a new
  concept document was just created) — write its path into `documents.concept`
  in this same write (per §2 rule 3). The `promise` write happens every time,
  regardless of which of §7's three cases applied — it is what replaces
  `live-new`'s `(TBD` placeholder on a first run, and what records a revised
  promise on any later one. In §7's cases 1 and 2, `documents.concept`
  already holds the concept's right path; leave it untouched. The
  companion decision map — whether found in case 1, freshly written in case 2,
  or freshly written in case 3 — is never itself referenced by a
  `documents.*` key — it is the working paper behind the concept, the same
  way the September event's cheat sheet exists without a `documents.*` entry
  of its own (see `live-events/2026-09-21-mail-z-zalacznikiem/README.md`'s
  note on `documents.script`). `documents.concept` names the stage's own
  self-contained artifact — the concept document is written to read standalone
  (see its §0) — the decision map is process history, findable by convention
  (§7's canonical path) even though no manifest field names it.
- **Explicit approval** — same write as above, `status.concept: approved`.

## 9. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from the
   repository root (or `npm run validate-live` from `tools/course-pipeline`).
   Fix and rewrite before reporting success if it flags this event's manifest;
   nothing else in the repo should need touching to make it pass.
2. State plainly that everything is left uncommitted.
3. Point at the next step: `/live-plan` (the pre-work plan) or `/live-demo`
   (the demo build) — both gate hard on `status.concept: approved`, unlike
   this skill's own soft gate on the previous event's report in §4. A concept
   saved only as `draft` will block them until Rafał comes back and approves
   it.

## Rules

- One question per message during the conversation (§6) — never bundle two
  decisions into one prompt.
- **Never guess a filename under `knowledge-base/marketing/`.** Every read of
  an existing *concept* document goes through `documents.concept` (§2); a
  decision map has no manifest field, so its existence is only ever checked at
  the one canonical path this skill itself always uses (§7), never guessed at
  a different name. A newly minted *concept* path is written back into
  `documents.concept` in the same write that changes `status.concept` (§8) —
  a concept document nothing points at does not exist as far as the next
  skill is concerned. A decision map stays unlisted in the manifest by design
  (§7, §8) — findable by convention, not by a manifest field.
- Never invent a number. Every figure quoted in the concept document's §1
  must trace back to a file this run actually read (the previous report, the
  previous concept, `tematy-na-live-*.md`) — not to what a previous live
  "probably" did.
- `status` values are exactly `missing`, `draft`, `approved` — nothing else,
  matching every other manifest in `live-events/`.
- Template comments (`<!-- -->`) never survive into a written document — they
  are worked examples to replace, not content to keep.
- The previous-event gate (§4) warns; it never refuses outright. The
  overwrite check (§3) and the write gate (§8) do refuse, by simply writing
  nothing when Rafał declines.
