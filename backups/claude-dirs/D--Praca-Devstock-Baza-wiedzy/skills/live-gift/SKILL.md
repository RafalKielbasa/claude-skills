---
name: live-gift
description: Produce the giveaway package for a live event — the step-by-step setup instructions for viewers, the screencast narration, and the voice-over package generated with the course voice. Use when Rafał prepares what the audience receives for staying to the end ("prezent na live", "narracja do prezentu", "lektor do prezentu"). Requires the giveaway workflow to be exported to the event's prezent/ first — this skill writes around that export, it does not build the automation.
---

# /live-gift — produce the giveaway package for a live event

Result: the event's `prezent/` — the setup instructions viewers read
(`prezent/instrukcja.md`, tracked as `documents.gift`), the screencast
narration that follows those same steps (`prezent/narracja.md`), and the
voice-over package generated from it with the course's own ElevenLabs voice
(`prezent/lektor/`, built by the `lektor` CLI subcommand —
`tools/course-pipeline/src/lektor-package.js`). Rafał builds the giveaway
itself in n8n and exports it into `prezent/` before this skill can do
anything (§3) — this skill writes only what explains and narrates that
export, never the automation.

## 1. What this skill owns

Exactly one status key (`status.gift`) and one documents key
(`documents.gift`) in the event's `live.yaml`, plus three things under the
event's own `prezent/`:

| File | Destination | Tracked by |
|---|---|---|
| Setup instructions | `<event>/prezent/instrukcja.md` | `documents.gift` |
| Screencast narration | `<event>/prezent/narracja.md` | fixed path, not a manifest field (same convention as `live-script`'s satellite files, its own §3 rule 2 — `prezent/` is a fixed, permanent directory this skill alone populates, per `live-new`'s own README table, so there is no shared-directory collision to avoid and no naming pattern to guess) |
| Voice-over package | `<event>/prezent/lektor/` (mp3s + `spis.md`) | not tracked at all — build output, regenerated from `narracja.md` on demand, the same way `plansze/out/` is build output for `live-boards`. `.gitignore` already excludes it (`live-events/**/prezent/lektor/`, plus `*.mp3`/`*.mp4` directly under `prezent/`) |

The instructions and the narration are always written together (like
`live-script`'s bundle, §1 there) — a narration that has drifted from the
instructions it's supposed to follow is worse than no narration, because
nobody would think to doubt it on the day.

It never touches `status.concept`, `status.prework`, `status.demo`,
`status.script`, `status.boards` or `status.report`, and never writes to
`seed/`, `prompts/`, `workflows/` (`live-demo`'s), `runbook/`
(`live-script`'s) or `plansze/` (`live-boards`'s) — only to the event's own
`prezent/`. **`kursy/` is not this skill's tree and is never touched, read
or written by it under any circumstance**, even though it drives the same
`lektor` CLI subcommand that `/kurs-video` (track B) also calls.

## 2. Resolving the event argument

Accept a full folder path (`live-events/<date>-<slug>/`, trailing slash
tolerated), a bare folder name (`<date>-<slug>`), or a bare date (`<date>`)
— matched against the folder names under `live-events/`.

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event.
- More than one match — cannot happen for a bare date or a full/bare folder
  name (both unique by construction); if it ever does, list every match and
  ask Rafał to pick.
- **No argument at all** — list every `live-events/*/live.yaml` that passes
  both halves of §3's gate (`status.concept: approved` and a `*.json` file
  present directly under its `prezent/`) and whose `status.gift` is **not**
  `approved` (`missing` or `draft`) — these are the events where producing
  the gift package is actually actionable. Exactly one such event → use it,
  announcing which. None → say plainly why (no event clears both gate halves
  yet, or every event that does already has an approved gift) and ask Rafał
  which event to work on. More than one → ask Rafał to pick, naming them.

## 3. Gate: two halves, both required

Once an event is resolved, check both halves before touching anything else
— a hard gate, matching every other per-stage skill's gate on its own
predecessor, except this one has two conditions instead of one:

1. **`status.concept` must be `approved`.** Read it from `live.yaml`.
2. **An exported giveaway workflow JSON must exist in the event's
   `prezent/`.** This is not a `documents.*` field — there is no manifest
   slot for it, it is simply whatever Rafał's n8n export dropped there
   (the August event's own `prezent/podsumowanie-z-kalendarza.json` is the
   worked example, named after the automation, not after a fixed pattern).
   Check for at least one `*.json` file directly under `<event>/prezent/`
   (the directory may not even exist yet for a new event — that also counts
   as "no JSON found", not an error to fix by creating an empty folder).

Both conditions are independent; **name exactly which half failed** when
stopping, because the two failures point to different next actions:

- **`status.concept` not `approved`** → stop. Name the event and the exact
  current value of `status.concept`. Say plainly that a gift narrated
  against an unapproved concept explains a giveaway decision that might
  still move. Rafał's next step is `/live-concept`, not this skill.
- **`status.concept` is `approved` but no `*.json` sits under `prezent/`**
  → stop. Say plainly that there is nothing to narrate yet: Rafał builds the
  giveaway automation in n8n and exports it into `<event>/prezent/` first
  (§4); this skill writes around that export, it does not create it.
- **Both conditions fail** → stop, naming both, in the order above.
- **Both conditions hold** → continue to §5.

## 4. This skill does not build the giveaway

Rafał designs and builds the giveaway automation in n8n himself and exports
it as a workflow JSON into the event's `prezent/` — that JSON is §3's second
gate condition. This skill's whole job starts only once that export exists:
it writes the instructions that walk a viewer through importing and
configuring that exact export, the narration that walks a screen recording
through the same steps, and the voice-over spoken over that recording. It
never edits the exported JSON, never opens n8n on Rafał's behalf, and never
invents a step the export doesn't actually require.

## 5. Does gift material already exist

Per the standing ruling on document paths, `documents.gift` is read from
`live.yaml`, never guessed from a directory listing:

- **`documents.gift` is `null`** — nothing to confirm. This run creates the
  instructions and the narration for the first time; proceed to §6.
- **`documents.gift` holds a path** — read the existing `instrukcja.md` in
  full, read `prezent/narracja.md` at its fixed path, and check whether
  `prezent/lektor/spis.md` exists. Show Rafał a short summary — the current
  step count and titles, the current `status.gift`, and, if `spis.md`
  exists, its file count and total duration — before deciding whether to
  revise:
  - **Leave it alone** → stop here. Write nothing, change nothing in
    `live.yaml`. `git status --short` stays exactly as it was.
  - **Revise, `status.gift` is `draft`** → nothing was signed off yet;
    proceed straight to §6.
  - **Revise, `status.gift` is `approved`** → tell Rafał plainly that
    continuing drops `status.gift` to `draft` until this run's own gate
    (§12) signs it off again, and get one explicit confirmation of that
    specific consequence before touching anything. On confirmation, write
    `status.gift: draft` immediately, as its own isolated edit, independent
    of the larger write in §12 — the manifest never claims an approved gift
    while the package is mid-revision. Declining is the same as leaving it
    alone: stop, write nothing further.

## 6. Instructions first

The narration in §7 follows the steps written here, so the steps have to be
settled before a single sentence of narration exists. Open the exported JSON
from §3 to see which nodes actually need a credential (a node with no
`credentials` filled in is exactly the "red triangle" the August instructions
describe) — that tells you how many setup steps exist and in what order,
the same way the August export's three uncredentialed nodes became steps 3,
4 and 5 of its instructions.

Draft `<event>/prezent/instrukcja.md` from `templates/instructions.md`:
`## Co dokładnie dostaniesz`, `## Czego potrzebujesz, zanim zaczniesz`, then
one `## Krok N. <action>` per real step, then `## Kiedy coś nie działa` and
`## Co możesz zmienić, gdy już działa`. Written for someone who has never
opened n8n: every step names exactly what the viewer clicks and exactly
what they should see afterwards, never "configure the node". Every account
or key the viewer needs (and its honest cost — a free tier's time limit or
a card requirement, said now, not on day fifteen) goes in the "czego
potrzebujesz" table before step 1.

Do not show this to Rafał yet in isolation — §7 drafts the narration
against these same steps first, and §8 shows both together.

## 7. Narration second

From `templates/narration.md`, draft `<event>/prezent/narracja.md`: YAML
frontmatter (`typ: demo`), then one `## [ekran: screencast] <title>` per
instructions step that actually has something to show on screen, in the
same order as §6 — a step with nothing to screen-record (an account
signup that happens before recording starts, in the August instructions'
own step 1) gets no segment, and two adjacent steps that look like one
continuous action on screen may share a segment (the August narration
folds steps 3+4 into "Kalendarz i poczta" and steps 6+7 into "Godzina,
strefa i test"). `[AKCJA: ...]` lines direct the person recording and never
reach the voice-over; everything else in a segment is plain prose, spoken
aloud, quoting every proper noun and spelling every TTS-hostile name
phonetically per `kursy/_wspolne/redakcja.md` (`n8n` → `"en osiem en"`,
`JSON` → `dżejson`) — read only, this skill never writes to `kursy/`.

This file is `lektor`'s literal input (§9) — the shape has to be exact, not
approximate. It parses under the same `parsujScenariusz` the `lektor`
command itself calls, and this skill's own `templates/narration.md` is
verified against that parser.

## 8. Show both drafts, then stage them

Show Rafał the drafted instructions and the drafted narration together in
one message — they were written as one decision (§6, §7) and are reviewed
as one. Ask: keep them, revise, or leave everything alone (same three-way
choice as §5's revise branch, folded in here for a first-time draft).

Once Rafał says to proceed, write both drafts to a staging path inside the
gitignored render tree, never to the real paths yet:
`prezent/out/.review/instrukcja.md` and `prezent/out/.review/narracja.md`.
Because `live-events/**/out/` is gitignored at any depth (same fact
`live-boards` relies on for its own `.review` staging, its SKILL.md §1),
this write is invisible to `git status` regardless of what happens next —
declining later (§12) needs no manual cleanup beyond deleting this one
folder.

## 9. Check the voice before spending credits

The `lektor` command reads the voice from `ELEVENLABS_VOICE_ID` in
`tools/course-pipeline/.env`; the event's `live.yaml` records which voice
this event uses in `environment.elevenlabs_voice_id`. They can disagree,
and the mismatch is silent — the only symptom is a finished package spoken
in the wrong voice, discovered by listening to it. Check both **before**
running `lektor`, which is the point in this skill where money is actually
spent:

```bash
cd tools/course-pipeline
grep ELEVENLABS_VOICE_ID .env
grep elevenlabs_voice_id ../../live-events/<event>/live.yaml
```

- **They agree** → continue to §10.
- **They differ** → stop. Show both values verbatim and ask Rafał which one
  is right. **Never edit `.env`** — that file is Rafał's. If the manifest's
  value is the mistake, this skill corrects `environment.elevenlabs_voice_id`
  in `live.yaml` as its own isolated write (independent of §12's larger
  write, the same pattern §5 uses for an isolated `draft` demotion) once
  Rafał confirms the correction. If `.env` is the mistake, tell Rafał to fix
  it himself and stop this run — re-check both values after he says it's
  fixed; do not proceed on his word alone, because the whole point of this
  check is that a wrong value is not visible from the conversation.

## 10. Generate the voice-over

From `tools/course-pipeline`, run `lektor` against the **staged** narration,
writing into a **staged** package directory — not the real paths yet. Pass
the event's own `title` from `live.yaml` through `--tytul`, quoted: without
it, `generateLektorPackage` falls back to naming the shipped `spis.md` after
the staging directory's own name (`.review`) rather than the event, since the
narration is staged, not read from its real `prezent/narracja.md` path:

```bash
cd tools/course-pipeline
npm run lektor -- ../../live-events/<event>/prezent/out/.review/narracja.md -o ../../live-events/<event>/prezent/out/.review/lektor --tytul="<title from live.yaml>"
```

Read the command's own output before telling Rafał anything succeeded: `OK:
<N> plików lektora — spis: <path>` means it worked; `BŁĄD: ...` means it did
not run at all (a common cause: a segment with no screencast text, or one
over the model's character limit — fix the staged narration and re-run,
never retry blindly). This step calls the real ElevenLabs API through
`generujAudioSegmentu` and spends real credits — it is not undone by a later
decline at §12, the same way a render's CPU-time is not refunded by
`live-boards` deleting its own `.review` folder on decline.

The output directory is git-ignored, so nothing here shows up in
`git status` regardless of what §12 decides — say this in the conversation
so nobody expects mp3 files to appear in the diff.

## 11. Do not delete old audio

The file name carries a fingerprint of the text and the voice settings (see
`lektor-package.js`'s own header comment) — an edited paragraph produces a
new file at next generation; the previous take stays on disk untouched.
Before showing Rafał anything, compare the staged `spis.md`'s file list
against whatever already sits in the **real** `prezent/lektor/` (from an
earlier run of this skill, if any):

- Files the new `spis.md` lists are **current** — these are what a revision
  of this package would use.
- Files present in the real `prezent/lektor/` but absent from the new
  `spis.md` are **stale** — they match an earlier version of the text or
  voice settings. Name them to Rafał explicitly and say he can delete them
  once he's sure he doesn't need that take. **This skill never deletes them
  itself, at any gate outcome** — a stale file surviving a decline or a
  draft save is not a defect.

## 12. Gate: show, then write for real

Rafał has already seen the drafted text (§8) and can now listen to the
staged package and read the staged `spis.md` (§10, §11). Three outcomes:

- **Decline** — anything short of a clear yes to keeping it. Delete
  `prezent/out/.review/` entirely. Nothing under `prezent/instrukcja.md`,
  `prezent/narracja.md`, `prezent/lektor/` or `live.yaml` was ever touched,
  so `git status --short` is exactly as it was before this run, except for
  the isolated `draft` demotion from §5 or the isolated voice-id correction
  from §9, if either path was taken (both recorded a real, already-true
  fact, not a draft of this run's output).
- **Save but do not sign off** — copy the staged `instrukcja.md` to
  `prezent/instrukcja.md` and the staged `narracja.md` to
  `prezent/narracja.md` (overwriting, if this is a revision). Copy every
  staged file under `prezent/out/.review/lektor/` into the real
  `prezent/lektor/` — an **add**, never a wipe-and-rebuild (§11): existing
  files there are left exactly alone, and the new `spis.md` replaces the old
  one only because it is the current listing, not because the old audio it
  no longer mentions was deleted. Delete `prezent/out/.review/`. Set
  `status.gift: draft`, and — only when this run created the instructions
  for the first time — write `live-events/<event>/prezent/instrukcja.md`
  into `documents.gift` in this same write. If revising an existing
  document, `documents.gift` already holds this path; leave it untouched.
- **Explicit approval** — same file operations as above, `status.gift:
  approved`.

There is no fourth outcome.

## 13. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from
   the repository root (or `npm run validate-live` from
   `tools/course-pipeline`). Fix and rewrite before reporting success if it
   flags this event's manifest.
2. State plainly that everything is left uncommitted.
3. State plainly that `prezent/lektor/` and any stray `.mp3`/`.mp4` directly
   under `prezent/` stay out of `git status` by design (`.gitignore`) —
   `instrukcja.md` and `narracja.md` are the only new files a diff will
   ever show.
4. **Closing is uncommitted work, not this skill's job**: Rafał records his
   own silent screen capture and lays the voice-over package over it in his
   own editor, exactly as with track B of the course pipeline. This skill
   stops at delivering the package — it does not touch OBS, does not touch
   any editor project, and produces no final video.
5. **Ending at `draft`**: say plainly that the gift is not yet the one to
   hand out at the end of the broadcast — no gate elsewhere in this
   pipeline is known to block on `status.gift` today, but an unsigned-off
   package is still a draft regardless.
6. **Ending at `approved`**: say plainly that `prezent/instrukcja.md` and
   the current files in `prezent/lektor/` (per its `spis.md`) are the
   event's gift of record.

## Rules

- **The gate has two independent halves** (§3) — `status.concept:
  approved`, and a `*.json` file under the event's `prezent/`. Name exactly
  which one failed; never collapse both into one generic "not ready" stop.
- **This skill never builds, edits or invents the giveaway automation**
  (§4). It writes only what explains and narrates an export Rafał already
  made.
- **Instructions are settled before narration is drafted** (§6, §7) — the
  narration's segments and order are derived from the instructions' steps,
  never the other way around.
- **The voice check runs before any paid call, and stops on a
  disagreement it shows in full** (§9). This skill never edits `.env`;
  a manifest correction is the only file it may touch on that path, and
  only with Rafał's confirmation.
- **Old audio is reported, never deleted** (§11), at every gate outcome
  including a save.
- `status` values are exactly `missing`, `draft`, `approved` — nothing
  else.
- This skill never writes to `seed/`, `prompts/`, `workflows/`, `runbook/`,
  `plansze/` or `kursy/` under any circumstance (§1).
- **Never write or edit anything at the real `prezent/instrukcja.md` or
  `prezent/narracja.md` path until §12's gate says save or approve.**
  Drafting happens at `prezent/out/.review/` (§8), which is gitignored
  precisely so a decline leaves nothing behind to clean up by hand beyond
  deleting that one folder.
