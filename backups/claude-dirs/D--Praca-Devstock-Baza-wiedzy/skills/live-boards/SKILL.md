---
name: live-boards
description: Produce the on-air boards for a live event — one board per [CUE] in the run of show, written as a prezentacja.yaml presentation map and rendered with the existing slide generator into a navigable deck plus a PDF fallback. Use when Rafał needs the visuals for a live ("plansze na live", "deck na antenę", "slajdy na transmisję"). NOT for course slides, which are part of kurs-lekcja and kurs-video.
---

# /live-boards — render the on-air boards for a live event

Result: the event's `plansze/prezentacja.yaml` — a presentation map covering
every board the run of show actually needs, one entry per distinct board
name — rendered through the existing slide generator (`npm run slajdy`,
`tools/course-pipeline/src/cli.js:23`) into a clickable HTML deck plus a PDF
fallback. This skill **never writes board HTML by hand**: the generator
exists precisely so nobody has to (see §8).

The map is read from, and quotes, the run of show `live-script` writes
(`documents.script`) — specifically its `[CUE]` markers. `live-script`'s own
SKILL.md, §8, defines the `[CUE]` convention this skill depends on: every
cue names what changes on screen, and a board that recurs is introduced
once and referred back to by name afterwards. This skill's own job is to
turn that convention into slides — the hard part is the identity rule in
§5, not the generator call in §7.

## 1. What this skill owns

Exactly one status key (`status.boards`) and one `documents` key
(`documents.boards`) in the event's `live.yaml`, plus one file this skill
alone writes and re-writes: `<event>/plansze/prezentacja.yaml`, tracked by
`documents.boards`.

Unlike `live-script`, this stage has no separate "document to read" and
"artifact to render" split — the presentation map **is** the document.
There is nothing else to write alongside it: no host sheet, no plan B, no
satellite file. Rendering (§7) produces `plansze/out/` (HTML, PDF, and, on
request, a PNG sequence) — that is build output, not a tracked document,
regenerated from the map on demand, the same way `out/` is build output for
a course lesson's own deck. `.gitignore` already excludes every
`live-events/**/out/` directory, at any depth. That single fact is what
makes §6 possible: a *draft* deck can be rendered for Rafał to actually
look at — not just described in prose — without leaving a trace in `git
status`, before the map has earned its permanent place at
`plansze/prezentacja.yaml`.

It never touches `status.concept`, `status.prework`, `status.demo`,
`status.script`, `status.gift` or `status.report`, and never writes to
`seed/`, `prompts/`, `workflows/` (`live-demo`'s), `runbook/`
(`live-script`'s) or `prezent/` (`live-gift`'s) — only to the event's own
`plansze/`. **`kursy/` is not this skill's tree and is never touched, read
or written by it under any circumstance**, even though it shares a
renderer with `kurs-lekcja` and `kurs-video`.

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
  `status.script` is `approved` and whose `status.boards` is **not**
  `approved` (`missing` or `draft`) — these are the events where building
  the deck is actually actionable. Exactly one such event → use it,
  announcing which. None → say plainly why (no event has an approved
  script yet, or every event with one already has approved boards) and ask
  Rafał which event to work on. More than one → ask Rafał to pick, naming
  them.

## 3. Gate: `status.script` must be `approved`

Read the resolved event's `live.yaml` and check `status.script` before
touching anything else — a hard gate, matching every other per-stage
skill's gate on its own predecessor:

- **Not `approved`** (`missing` or `draft`) → stop. Name the event, name
  the exact current value of `status.script`, and whether `documents.script`
  is `null` or points at a draft run of show. Say plainly that a deck built
  against an unapproved run of show describes cues that may still move —
  boards built from a `[CUE]` list that changes tomorrow are boards built
  twice. Do not proceed to §4. Rafał's next step is `/live-script`, not this
  skill.
- **`approved`** → continue to §4.

## 4. Does a map already exist

Per the standing ruling on document paths, `documents.boards` is read from
`live.yaml`, never guessed from a directory listing:

- **`documents.boards` is `null`** — nothing to confirm. This run creates
  the map for the first time; proceed straight to §5.
- **`documents.boards` holds a path** — read the existing map in full and
  show Rafał a short summary (every board's name and `cues:`, plus the
  current `status.boards`) before deciding whether to revise:
  - **Leave it alone** → stop. Write nothing, change nothing in
    `live.yaml`. `git status --short` stays exactly as it was.
  - **Revise, `status.boards` is `draft`** → nothing was signed off yet;
    proceed straight to §5.
  - **Revise, `status.boards` is `approved`** → tell Rafał plainly that
    continuing drops `status.boards` to `draft` until this run's own gate
    (§10) signs it off again, and get one explicit confirmation of that
    specific consequence before touching anything. On confirmation, write
    `status.boards: draft` immediately, as its own isolated edit,
    independent of the larger write in §10 — the manifest never claims
    approved boards while the map is mid-revision. Declining is the same
    as leaving it alone: stop, write nothing further.

## 5. The cue-to-board contract, stated before any extraction

Read this before opening the run of show. It is the one thing this skill
must get right, and it is easy to get wrong by counting the wrong unit.

**The board — not the cue — is the unit.** A `[CUE]` line names a scene
and, optionally, a board (per `live-script`'s own convention, §8 rule 2:
the first cue introducing a board describes it in full; every later cue
that keeps it on screen refers back to it by name). This skill turns that
already-disciplined list into a presentation map through three rules:

1. **Board identity is the board's name, slugified.** Two cues naming the
   same board — the offer board returning in Q&A, the studio scene
   recurring between blocks — produce **one** entry in the map, listed
   once, with every clock position it appears at recorded in a `cues:`
   list on that entry (a bookkeeping field this skill writes and the
   generator ignores — see the template's own header comment). The August
   event's own offer-corner board is the worked example: cued at block 9
   and again at block 11, it is one board (`oferta-rog`) with
   `cues: ["1:28", "1:41"]`, not two.
2. **A cue that names only a scene produces no board.** Switching to the
   studio camera, or splitting the screen into three application windows,
   is a vision-mixer instruction, not a slide. Two cues in the August
   run of show are exactly this — block 3's "Szkielet" / "Akt 1" scene
   switch and block 5's "Akt 2" screen layout — and neither has a board
   in `plansze/`. If a cue's text describes only what camera or window
   layout is on screen, with no plansza or overlay named, it produces
   nothing here.
3. **A board may exist with no cue of its own** when it is a standing
   overlay running across several blocks — a countdown is the standing
   example. These go into the map with `cues: []` and a comment saying
   which block(s) it runs under — **and this skill asks Rafał to confirm
   each one rather than inventing it.** A board nobody cues is exactly as
   much of a defect as a cue naming a board nobody can describe; both are
   caught in §6, before any YAML is written.

**So the count to expect is distinct board names, not `[CUE]` occurrences,
and the two numbers legitimately differ.** Verified against
`live-events/2026-08-27-agenci-ai/runbook/scenariusz-live.md`: `grep -c
"\[CUE\]"` on that file returns 13, of which 2 are not cue instances at all
(the legend's own definition of the marker, and a changelog line that
mentions `[CUE]` by name) — 11 real cues, matching `live-script`'s own
count. Applying the three rules above: 2 cues are scene-only (block 3,
block 5, clause 2 → 0 boards), 9 cues touch a board, and of those 9 one
board (`oferta-rog`) is touched twice (block 9 and block 11, clause 1 → one
entry), and one cue (block 11) also introduces a further board
(`kolejny-live`, the "next live" closer, itself conditional on Robert
having a date) in the same breath as it re-touches `oferta-rog`. Net: 9
distinct boards — `tytul`, `agent-vs-chatbot`, `prezent-zapowiedz`,
`glosowanie`, `prezent-nazwa`, `oferta`, `oferta-rog`, `licznik-15min`,
`kolejny-live` — which is exactly the 9 files the event shipped
(`01-tytul.html` … `08-licznik-15min.html`, `10-kolejny-live.html`;
`plansze/README.md`'s own "Co gdzie siedzi" table confirms the same 9
boards at the same blocks). No board in that event exists under clause 3
(every board there has at least one introducing cue) — the countdown is
cued once, at block 10, and simply persists afterward without being
re-named, which is not the same thing as having no cue at all. The
09-numbered board the file names skip (`~~09 kod prezentu~~`) is neither a
cue nor a shipped board: it was cut from the run of show before the event,
so it appears in neither count and needs no clause to explain.

## 6. Extract, confirm, and draft the map for review

1. Read `documents.script` from `live.yaml` in full — this is the run of
   show, never guessed from a filename pattern; it is never `null` once
   `status.script` is `approved` (§3), so this always resolves to a real
   file.
2. Walk every `[CUE]` marker in order and apply §5's three rules by hand.
   For each board, note: its name, every block and clock position where a
   cue names it, and whether it is introduced in full at its first mention
   (per `live-script`'s own §8 rule 3 — a board is described once, in
   full, at its first cue).
3. **Show Rafał the resulting board list before writing any YAML** — one
   line per board: its name, the clock position(s) for its `cues:` list,
   and a one-sentence description of what it shows. Flag explicitly:
   - any cue that names a board with not enough content in the run of show
     to describe it (nothing to render from — ask what it should say,
     never invent copy);
   - any board that seems to need a `cues: []` entry (§5 clause 3) — name
     which blocks it would run under and get an explicit yes from Rafał
     before adding it; a standing overlay this skill assumed rather than
     confirmed is a defect, not a convenience.
4. Once Rafał has confirmed the list, draft the actual YAML content
   following `templates/prezentacja.yaml` as the worked example — copy its
   structure, then replace every slide with the confirmed board list,
   never the other way around (the template's four boards are
   illustrative, not a quota). Field names come from
   `tools/course-pipeline/src/deck.js` — the code, not
   `docs/superpowers/specs/2026-08-21-generator-slajdow-design.md` — even
   though the two agree today; where they ever disagree, the code wins.
   Two rules that are easy to miss because YAML doesn't enforce them:
   - **`liczba` (the field, on the `liczba` layout) is always a string.**
     `liczba: 40` would let YAML turn it into a number and lose the unit
     (`40` instead of `"40 min"` or `"1470 zł"`) — quote it whenever it
     isn't self-evidently text already.
   - **A `grafika` field's `plik` path is resolved relative to the deck
     directory** and must exist on disk before a render is attempted — an
     image referenced but missing is a hard error in `sprawdzDeck`, not a
     silent blank. If a board needs a graphic, stage the asset alongside
     the draft map in the same directory structure it will finally occupy
     (`grafiki/<file>` next to `prezentacja.yaml`) before rendering it.
   **Quote `promise` from `live.yaml` verbatim** wherever it appears on
   screen — almost always the title board's subtitle. Paraphrasing it here
   is the same defect `live-script`'s own §6 forbids for the run of show:
   the script, the boards and the landing page use the identical sentence.
   **If `promise` still begins with `(TBD`** — `live-new`'s scaffolding
   placeholder — refuse to draft the title board: the concept conversation
   that was supposed to replace it never happened, or never finished, and
   putting the placeholder on the title board is worse than stopping here.
   Tell Rafał plainly and point him at `/live-concept` to record the real
   promise first; this is a hard refusal, not a warning.
5. Write this drafted content to a **staging path inside the gitignored
   render tree**, never to the real `plansze/prezentacja.yaml` yet:
   `plansze/out/.review/prezentacja.yaml` (plus `plansze/out/.review/grafiki/`
   for any staged assets). Because `live-events/**/out/` is
   gitignored at every depth (§1), this write is invisible to `git status`
   regardless of what Rafał decides next — nothing has to be undone by
   hand if he declines.

## 7. Render the draft, then show it to Rafał

From `tools/course-pipeline`, render the **staging copy**, not the real
path (there is no real path yet — see §6, step 5):

```
npm run slajdy -- ../../live-events/<event>/plansze/out/.review --tryb=live --pdf
```

No `--motyw` flag is needed here: the map's own `motyw:` field (§6 step 4)
already names the identity, and the flag exists only to override it for a
one-off comparison, not to be required on every render.

Read the command's own output before telling Rafał anything succeeded:
`OSTRZEŻENIE:` lines are warnings (out-of-range list lengths, a
non-portable layout, unsupported inline syntax) and don't block the
render, but surface every one of them to Rafał — a warning about a
`punkty` list running to 7 items is a board that will visibly overflow on
air. `BŁĄD:` means the render did not happen at all; fix the draft and
re-run before doing anything else.

**Always pass `--pdf`.** Once a render succeeds, tell Rafał exactly where
the two artefacts landed —
`plansze/out/.review/out/prezentacja.html` (open it, click through it) and
`plansze/out/.review/out/prezentacja.pdf` (the fallback) — since this
skill has no way to display the rendered deck inside the conversation
itself; Rafał has to open the file to actually judge it. Proceed to §10
only once he has looked (§8 and §9 below are standing reference material,
not a step in between).

## 8. Do not hand-write board HTML

The August event's own boards (`live-events/2026-08-27-agenci-ai/plansze/*.html`,
`deck.html`, `export-png.ps1`, `export-pdf.ps1`) predate the
generator entirely — they were written by hand because nothing else
existed yet, and are the direct reason the generator was built at all:
`docs/superpowers/specs/2026-08-21-generator-slajdow-design.md`'s own
"Problem" section names "deck na live „Agenci AI" (27.08.2026)" as the
trigger, in so many words. They
stay in the repo **as a historical record**, not as a pattern to copy
forward. Every board this skill produces from here on goes through
`prezentacja.yaml` and the generator (§7) — never a bespoke HTML file,
never a hand-edited copy of one of the August files, regardless of how
close a new board's content is to an old one.

## 9. Known gap: no transparent background

The generator has no transparent-background rendering mode. Every board it
produces — HTML, PDF, or a PNG sequence via `--tryb=auto` — is an opaque,
full-bleed slide. The August event's original boards were transparent
1920×1080 HTML files meant to sit as OBS browser sources over live camera
scenes; the event then moved to a self-contained deck clicked from the
host's own laptop (`plansze/README.md`'s own "decyzja z 26.08"), which made
transparency moot for that broadcast, not for this generator.

**If Rafał needs overlay boards for OBS again — a browser source
composited over a camera scene, not a slide shown on its own — stop and
say so plainly.** That is a generator change (a transparent-background
render mode), not something this skill can improvise. Do not hand-write a
transparent HTML file to route around the gap — that is exactly the
historical pattern §8 says not to repeat, and it would produce a board
this skill cannot re-render from the map the next time content changes.

## 10. Gate: show, then write for real

Rafał has already seen the board list (§6) and the rendered draft (§7).
Three outcomes:

- **Decline** — anything short of a clear yes to keeping it. Delete
  `plansze/out/.review/` entirely. Nothing under `plansze/prezentacja.yaml`
  or `live.yaml` was ever touched, so there is nothing else to undo — `git
  status --short` is exactly as it was before this run, except for the
  isolated `draft` demotion from §4, if that path was taken (that edit
  recorded a real, already-true fact: the map was being revised).
- **Save but do not sign off** — copy the staged
  `plansze/out/.review/prezentacja.yaml` (and any staged `grafiki/`) to
  their real, permanent path at `plansze/prezentacja.yaml` (and
  `plansze/grafiki/`), then re-run §7's render command against the real
  `plansze/` directory so `plansze/out/prezentacja.html` and
  `plansze/out/prezentacja.pdf` exist at their real location too. Delete
  `plansze/out/.review/`. Set `status.boards: draft`, and — only when this
  run created the map for the first time — write
  `live-events/<event>/plansze/prezentacja.yaml` into `documents.boards`
  in this same write (§1: the map is both the tracked document and the
  render source; there is nothing else to point at). If revising an
  existing map, `documents.boards` already holds this path — leave it
  untouched.
- **Explicit approval** — same write as above, `status.boards: approved`.

There is no fourth outcome.

## 11. Closing

After a save (draft or approved):

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from
   the repository root (or `npm run validate-live` from
   `tools/course-pipeline`). Fix and rewrite before reporting success if it
   flags this event's manifest.
2. State plainly that everything is left uncommitted.
3. **Re-render the PDF after every later edit to the map.** The PDF in
   `plansze/out/` is a frozen snapshot of whatever the map said at the last
   render — editing `prezentacja.yaml` and forgetting to re-run §7 leaves
   the fallback showing yesterday's wording, which is worse than no
   fallback at all, because nobody would think to doubt it on the day.
4. **Ending at `draft`**: say plainly that the deck is not yet the one to
   walk into the broadcast with — no gate elsewhere in this pipeline is
   known to block on `status.boards` today, but an unsigned-off deck is
   still a draft regardless.
5. **Ending at `approved`**: say plainly that `plansze/prezentacja.yaml`
   and its rendered output are the event's boards of record.

## Rules

- **Board identity is the board's name, not the cue that mentions it**
  (§5). Never create two map entries for one board because two different
  blocks cue it — merge into one entry with both clock positions in
  `cues:`.
- **A cue that names only a scene never becomes a board** (§5 clause 2).
- **A cueless standing overlay is never invented — it is confirmed with
  Rafał, by name, before it goes into the map** (§5 clause 3, §6).
- **Never write or edit anything at the real `plansze/prezentacja.yaml`
  path until §10's gate says save or approve.** Drafting happens at
  `plansze/out/.review/` (§6, §7), which is gitignored precisely so a
  decline leaves nothing behind to clean up by hand beyond deleting that
  one folder.
- **Never hand-write board HTML** (§8). Every board goes through
  `prezentacja.yaml` and the generator, with no exception for "just this
  once" or "it's basically the same as an old one."
- **`liczba` is always a string in the map** — never let YAML infer a
  number from it.
- **`promise` is quoted verbatim wherever it appears on a board** — same
  rule `live-script` applies to the run of show, for the same reason (the
  script, the boards and the landing page must never say it three
  different ways).
- **A `promise` still starting with `(TBD` is a hard refusal, not a
  warning** (§6) — point Rafał at `/live-concept` instead of drafting the
  title board.
- **No transparent-background workaround** (§9). A request for OBS overlay
  boards is refused with an explanation, not solved with a hand-written
  file.
- `status` values are exactly `missing`, `draft`, `approved` — nothing
  else.
- This skill never writes to `seed/`, `prompts/`, `workflows/`, `runbook/`,
  `prezent/` or `kursy/` under any circumstance (§1).
- **Always pass `--pdf`** when rendering, staged or real (§7) — the PDF
  fallback is not optional polish.
