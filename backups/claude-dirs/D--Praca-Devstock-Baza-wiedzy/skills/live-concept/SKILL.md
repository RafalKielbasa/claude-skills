---
name: live-concept
description: Run the decision conversation for a live event and write it down — the decision map (goal, core demo, free/paid boundary, giveaway, offer) and the concept document grounded in the previous event's numbers. Use when Rafał is deciding what a live should be about ("koncepcja live'a", "o czym robimy live", "mapa decyzji"). NOT for the minute-by-minute run of show, which is live-script.
---

# /live-concept — decide what the live is about

Result: two documents in `knowledge-base/marketing/` — a decision map
(`live-<date>-mapa-decyzji.md`, from `templates/decision-map.md`) and a concept
document (`live-<date>-koncepcja.md`, from `templates/concept.md`) — plus
`live.yaml`'s `status.concept` and `documents.concept` updated to match. Every
other stage (`live-plan`, `live-demo`, `live-script`, `live-boards`,
`live-gift`, `live-report`) reads `documents.concept` as its own starting
point, so this is the first per-stage skill to run on a freshly scaffolded
event.

## 1. What this skill owns

Exactly one status key (`status.concept`) and one documents key
(`documents.concept`) in the event's `live.yaml`, plus the two files those
keys point at (or feed into — see §6 on why only the concept document is
tracked in the manifest). It never touches `status.prework`, `status.demo` or
any other stage key, never edits the event's own directory tree
(`live-events/<date>-<slug>/`) — that tree belongs to `live-new` and the other
per-stage skills — and never writes the minute-by-minute run of show
(`documents.script`, owned by `live-script`).

## 2. Which event, and does a concept already exist

Resolve which event this run is for:

- **Given an argument** (a date, a slug, or a folder name) — match it against
  `live-events/*/live.yaml` by date, by the slug portion of the folder name,
  or by the full folder name. Exactly one match → proceed. Zero or more than
  one → say so and ask which event, naming the candidates.
- **Given no argument** — list every `live-events/*/live.yaml` whose
  `status.concept` is not `approved` (`missing` or `draft`). Exactly one such
  event → use it, announcing which. None → there is no obvious next event
  (every concept is already approved); ask Rafał which event to work on —
  he may want to revise one that is already signed off. More than one → ask
  Rafał to pick, naming them.

Read that event's `live.yaml`. If `documents.concept` is not `null`, an
artifact already exists:

1. Read it (and the decision map alongside it, if a `live-<date>-mapa-decyzji.md`
   exists next to it) and show Rafał a short summary — title, date, one
   paragraph of gist — together with the current `status.concept` value.
2. Ask explicitly: work from it and revise, or leave it alone.
   - **Leave it alone** → stop here. Write nothing, change nothing in
     `live.yaml`. This is the decline path, and it must leave `git status
     --short` exactly as it was.
   - **Revise, and `status.concept` is `draft`** → nothing was signed off, so
     continue straight to §3; there is nothing to protect yet.
   - **Revise, and `status.concept` is `approved`** → tell Rafał plainly that
     continuing will drop `status.concept` to `draft` until he re-approves the
     revised version at the closing gate (§7), and get one explicit
     confirmation of that specific consequence before touching anything. On
     confirmation, write `status.concept: draft` to `live.yaml` immediately —
     a small, isolated edit, independent of the larger write in §6-§7 — so the
     manifest never claims an approved status for content that is mid-revision.
     Declining this confirmation is the same as leaving it alone: stop, write
     nothing.

If `documents.concept` is `null`, there is nothing to confirm — continue
straight to §3.

## 3. Gate: the previous event's report (warning, never a block)

Find the previous event: among every OTHER `live-events/*/live.yaml`, the one
with the latest `date` strictly before this event's `date`. None exists (this
is the first event ever) → say so and skip straight to §4; there is no prior
report to ground numbers in.

Otherwise read the previous event's `status.report`:

- **`approved`** → proceed silently, no warning needed.
- **`draft` or `missing`** → name exactly what is missing (the status value,
  and whether `documents.report` is `null`) and ask Rafał explicitly whether
  to continue anyway. This is a warning, never a block — two events legitimately
  overlap (a concept can be written for the next live while the previous one is
  still being reported on). Proceed only on an explicit yes; a decline here
  stops the run the same way declining §2 does (nothing written, nothing
  changed).

## 4. Read before asking

Once the gate clears, read, when they exist:

- the previous event's report (`documents.report`);
- the previous event's concept (`documents.concept`);
- `knowledge-base/marketing/tematy-na-live-*.md`.

Summarise for Rafał in one message before the conversation starts: what the
numbers say (attendance, funnel, sales, benchmark against earlier events),
what the audience explicitly asked for, and — your own read, flagged as such —
what is worth repeating from the previous event and what is not. This
grounds the conversation in §5; do not start asking decisions cold.

## 5. Conversation

One question per message, never batch. Work through the decisions in the
order `templates/decision-map.md` lays out: goal of the live, core demo,
presentation principle, the free/paid boundary (the giveaway), and the offer —
plus any further decisions this particular event's conversation surfaces
(format, division of responsibilities, date and traffic source, whatever
actually comes up). For each decision, record the options considered, not
only the winner — the decision map's table exists precisely so a rejected
option and its trade-off survive, not just the final call.

## 6. Compose the documents

Fill both templates from the conversation — `templates/decision-map.md` into
a draft of `live-<date>-mapa-decyzji.md`, `templates/concept.md` into a draft
of `live-<date>-koncepcja.md` — entirely from what Rafał actually said in §5
and what §4 established as fact. Fill every `<!-- -->` template comment with
real content and delete the comment; never leave a worked example standing in
for real content. This is drafting, held in context — nothing touches disk
yet; §7 is the write gate.

## 7. Gate: show, then write

Show Rafał both composed documents in full. Three outcomes:

- **Decline** — anything short of a clear yes to saving. Write nothing to
  disk, change nothing in `live.yaml`. The working tree is exactly as it was
  before this run (beyond the isolated `draft` edit from §2, if that path was
  taken).
- **Save but do not sign off** — write both files to
  `knowledge-base/marketing/`, set `documents.concept` to the concept
  document's path (`live-<date>-koncepcja.md`) and `status.concept: draft`.
  The decision map is written alongside it but is not itself referenced by any
  `documents.*` key — it is the working paper behind the concept, the same way
  the September event's cheat sheet exists without a `documents.*` entry of
  its own (see `live-events/2026-09-21-mail-z-zalacznikiem/README.md`'s note
  on `documents.script`). `documents.concept` names the stage's own
  self-contained artifact — the concept document is written to read standalone
  (see its §0), the decision map is process history.
- **Explicit approval** — same write as above, `status.concept: approved`.

## 8. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from the
   repository root (or `npm run validate-live` from `tools/course-pipeline`).
   Fix and rewrite before reporting success if it flags this event's manifest;
   nothing else in the repo should need touching to make it pass.
2. State plainly that everything is left uncommitted.
3. Point at the next step: `/live-plan` (the pre-work plan) or `/live-demo`
   (the demo build) — both gate hard on `status.concept: approved`, unlike
   this skill's own soft gate on the previous event's report in §3. A concept
   saved only as `draft` will block them until Rafał comes back and approves
   it.

## Rules

- One question per message during the conversation (§5) — never bundle two
  decisions into one prompt.
- Never invent a number. Every figure quoted in the concept document's §1
  must trace back to a file this run actually read (the previous report, the
  previous concept, `tematy-na-live-*.md`) — not to what a previous live
  "probably" did.
- `status` values are exactly `missing`, `draft`, `approved` — nothing else,
  matching every other manifest in `live-events/`.
- Template comments (`<!-- -->`) never survive into a written document — they
  are worked examples to replace, not content to keep.
- The previous-event gate (§3) warns; it never refuses outright. The
  overwrite check (§2) and the write gate (§7) do refuse, by simply writing
  nothing when Rafał declines.
