---
name: kurs-montaz
description: Automatic track B montage for a demo lesson — fits Rafał's silent screen recording to the voice-over package (video/lektor/ + spis.md) paragraph by paragraph, cuts retakes and waits, adds zoom and highlight frames where the narration points, and writes video/nagranie-z-lektorem.mp4 in place of the manual editor (CapCut) step; intro and outro (from the gate, or from kurs.yaml `oprawa` when the course has it) are attached unchanged by /kurs-video. Starts with a decision gate where Rafał picks the lesson and gives the path to the screen recording, plus intro and outro only in a course without kurs.yaml `oprawa`. Use when Rafał says "zmontuj lekcję", "zrób montaż nagrania", "dopasuj nagranie do lektora", "montaż zamiast CapCuta", "dodaj intro i outro do lekcji". NOT for generating the voice-over package, avatars or final.mp4 (that is /kurs-video), and NOT for live-event gift screencasts.
---

# /kurs-montaz — automatic montage of a track B lesson

Track B (`typ_video: demo`) has one manual step between the two stages of `/kurs-video`: Rafał
lays the voice-over chunks over his silent screen recording in an editor and exports
`video/nagranie-z-lektorem.mp4`. This skill does that step with `npm run montaz` in
`tools/course-pipeline`. The command cuts, retimes, highlights and renders; this skill owns the
gate, the editing decisions (the EDL) and the review. It never decides for Rafał which recording,
intro or outro belong to a lesson.

Spec: `docs/superpowers/specs/2026-10-02-kurs-montaz-design.md`.
Command reference: `npm run montaz -- pomoc` and `tools/course-pipeline/README.md`, section
"Tor B: montaż automatyczny (`/kurs-montaz`)".

Talk to Rafał in Polish; this file is in English only because the repo rule for new skills
requires it. Paths, file names and the CLI's `OK:` / `BŁĄD:` lines stay Polish.

Input: optionally a lesson path (`kursy/<slug>/modul-NN-x/lekcja-NN-y`). Without it the gate
offers the candidates.
Output: `video/nagranie-z-lektorem.mp4` (rendered), `video/montaz/edl.json` (the editing
decisions), `video/montaz/zrodla.json` (local paths from the gate), and a hand-off to
`/kurs-video` for the final assembly. The whole `video/montaz/` folder is git-ignored.

All commands below run from `tools/course-pipeline`:
`cd tools/course-pipeline && npm run montaz -- <podkomenda> <lekcja> [flagi]`. The lesson path is
relative to that directory (`../../kursy/...`). When `npm run` itself fails on Windows with
"System nie może odnaleźć określonej ścieżki", run the same command as
`node src/cli.js montaz <podkomenda> …`. It is the same entry point without npm's script shell.

## Pace comes first (overriding rule)

The viewer must always have enough time to understand what is on screen. The montage is calm and
readable first, engaging second, and never chaotic or rushed. Matching every cut to the narration
frame by frame is not the goal; understanding is.

**the narrator introduces it → the screen shows it → the viewer gets time to take it in → only
then the next step.**

- **Buy time with pauses, not speed.** When an action needs a moment to be seen (a panel opens,
  a result appears, a value lands in a field), stop the narrator: a `pauzy` entry inserts silence
  at a sentence boundary while the picture keeps going, and the next sentence resumes after it.
  Typical pauses are 0.8–2 s; up to 4 s for a result the viewer must read. A held or near-still
  screen for a few seconds is fine. A sped-up recording is not: the engine warns above 1.25×.
- **The picture never runs ahead of the narration.** It may lag slightly. An anchor (`kotwice`)
  holds the state before an action until the narrator gets there; a pause placed at an action's
  sentence makes that action start when the narrator resumes.
- **One thing at a time.** Do not move to the next step because the recorded action has finished:
  if the narrator is still on the current stage, the current screen stays. Judge each scene by
  meaning, not by length.
- **One step, one shot.** Show every click the narration names in one continuous shot: the
  pointer travelling to the target, the click, the result. Start the shot before the pointer
  starts moving, so the viewer sees where it goes and where exactly it clicks; a click must
  never fall inside a cross-fade. The pointer's travel and the click play at natural speed
  (at most 1.25×); only a moment where the pointer stands still (hovering, a list waiting, a
  settings panel that opens and closes) becomes an `oczekiwanie`. Never chop a sequence into
  sub-second fragments to fit fast narration: buy the time with pauses at the sentence ends and
  let the picture lag slightly. The check warns about any shot under 1.2 s on screen.
- **Best take, whole transitions.** Rafał records some scenes more than once. Pick the take
  where the pointer moves naturally and everything is visible, not the first one. The step
  between two paragraphs (closing a form, opening a node, the "+" click, a new chat session,
  resizing a panel) belongs on screen: at the end of the previous paragraph (in the silence
  after its last sentence, with a pause there if needed) or at the start of the next one. Make
  the junction continuous (the next paragraph starts where the previous one ended) instead of
  cross-fading two near-identical screens with a different layout, which shows a double image.
  Take a still for a "▶ START" paragraph from the moment just before the next step, and never
  let a browser pop-up flash inside an `oczekiwanie`.
- **Calm transitions are automatic.** A cut inside a paragraph and a paragraph that starts
  somewhere else in the recording cross-fade (0.4 s); highlights fade in and out; zooms ease in
  over 0.8 s. Force a hard cut with `"przejscie": "ciecie"` only when the jump itself is the point.
- **Alive, not busy.** Use effects where they help the viewer see or remember something, chosen
  for what is on screen right now. Never add an effect just so something moves.

## Effects palette

Pick what fits the moment; this is a palette, not a checklist. Every effect fades in and out on
its own. All times are seconds of the paragraph's narration (from `zdania`); rectangles and arrow
tips are pixels of the recording, read from `klatka --akapit=ID --czas=S` (step 4).

| effect | EDL | use it when |
| --- | --- | --- |
| hold + pause | `pauzy: [{ po, czas }]` | an action or result needs a moment before the narrator moves on |
| zoom | `zoom` + rectangle | text is unreadable at 1080p, or the narrator dwells on one detail ("powiększ kadr") |
| camera move | `zoom` + `cel` rectangle | the eye should travel from one place to another (field → its result, a list top → bottom) |
| frame | `ramka` | the narrator names one field while it is being set; the rest dims |
| focus | `skupienie` | one element among many similar ones (a log entry, one rule in a long text); the rest blurs |
| arrow | `strzalka` + tip + `kierunek` | a small target the viewer could miss (an icon, a toggle, a tab); not inside a zoom |
| callout | `napis` + `tekst` + `pozycja` | one key fact worth remembering, in the narrator's words, ≤ 80 characters |
| sound | `dzwieki: [{ plik, od, glosnosc }]` | sparingly, under a key moment; files only from `kursy/_wspolne/dzwieki/` |
| insert | `wstawki: [{ z, od, do }]` | the narrator talks about something that is no longer on screen (a field in a panel that has already closed): a still from second `z` of the recording, with a frame on the field |

Limits the check enforces or warns about: one zoom/frame/focus at a time (an arrow or a callout
may accompany it); a frame or focus longer than 6 s; highlights covering more than 25% of the film;
an arrow during a zoom. A callout repeats or condenses what the narrator says; it never adds a
claim of its own. If `kursy/_wspolne/dzwieki/` is empty, use no sounds and do not invent files.

## Procedure

1. **Entry gate.** Run `npm run montaz -- zrodla --lista`. It prints JSON with every demo lesson
   (`gotowa`, `powod`, `maMontaz`, `maEdl`, `maZrodla`), the newest recordings in the recordings
   folder (path, date, length, resolution) and the intro and outro (`oprawa`). Intro and outro
   are shared by all courses and live in the repo at `kursy/_wspolne/oprawa/intro.mp4` and
   `outro.mp4` (`oprawa.katalog`); without those files `oprawa` falls back to the last used
   ones on this machine. A lesson is ready
   when its content is approved and stage 1 of `/kurs-video` produced both `video/lektor/spis.md`
   and the avatars. If the lesson Rafał named is not ready, stop and say why, quoting `powod`;
   stage 1 belongs to `/kurs-video`, not to this skill.
   **Recorded by the automation** (`/kurs-nagrywanie`, course with `nagrywanie: { automat: true }`):
   `zrodla.json` and `edl.json` already exist, with every paragraph's recording range, waits and
   skipped variants taken from the automation's step markers. Skip steps 2-4 (sources, index, ranges)
   and never move `od`/`do`, `oczekiwania` or `pomin` - they match the voice-over frame by frame.
   **Course without kurs.yaml `oprawa`:** ask Rafał only for intro and outro and write them with the
   sources gate, passing the recordings exactly as listed in the existing `zrodla.json`, in the same
   order (EDL `zrodlo` indexes point into that list). **Course with `oprawa`** (`oprawaKursu: true` in
   the list): ask nothing - intro and outro come from the course, and `zrodla.json` written by the
   automation already has them as `null`. Then add highlights, pauses and boards (step 4 effects part)
   and go on with the sample gate.
2. **GATE: lesson and sources.** One `AskUserQuestion` call before any other work: four questions in a
   course without kurs.yaml `oprawa`, two (lekcja, nagranie ekranu) in a course with it (`oprawaKursu: true`
   in the list - intro and outro are decided once per course and attached by `/kurs-video`):
   - **Lekcja** — the ready lessons as options (up to four), "Other" for a path. Mark a lesson
     with `maMontaz: true`: its current `nagranie-z-lektorem.mp4` may be a manual export.
   - **Nagranie ekranu** — the newest recordings as options, each labelled with date and length.
     "Other" takes a path, or several paths separated by `;` in recording order.
   - **Intro** and **Outro** (only without kurs.yaml `oprawa`) — the file from `oprawa` as the first option, marked
     "(Recommended)" when it is the shared one from `kursy/_wspolne/oprawa/`; "Brak intro" /
     "Brak outro" as the other. "Other" takes a path. When the shared file is missing, say that
     it belongs in `oprawa.katalog` as `intro.mp4` / `outro.mp4`.
   No answer is not approval. A timeout of the question tool is not approval either — say you are
   waiting and ask again. Never pick a recording yourself, and in a course without kurs.yaml `oprawa` never
   pick an intro or outro yourself either, even when only one candidate exists.
   When the lesson already has `video/montaz/zrodla.json` (`npm run montaz -- zrodla <lekcja>`
   shows it), show the saved paths first and ask whether they stay (in a course with `oprawa` show the
   course's intro/outro decision instead of saved intro/outro paths). Then save the answer:
   `npm run montaz -- zrodla <lekcja> --nagranie=<plik> [--nagranie=<plik2>] (--intro=<plik>|--bez-intro) (--outro=<plik>|--bez-outro)`;
   in a course with `oprawa` without any intro/outro flag:
   `npm run montaz -- zrodla <lekcja> --nagranie=<plik> [--nagranie=<plik2>]` (a flag there is an error).
   The command checks every file with ffprobe: a recording needs video, intro and outro need
   video and sound. A `BŁĄD` goes back to Rafał verbatim, with the question asked again.
3. **Index the recording.** `npm run montaz -- indeks <lekcja>` (add `--zrodlo=N` for the second
   and later recordings). It builds a proxy, `indeks.md` with activity windows and stillness
   ranges, and contact sheets every 10 s in `video/montaz/work/indeks/NN/`. Read `indeks.md`,
   then the sheets. For each paragraph, find the moment of its action:
   - The action text in `spis.md` is cut at 60 characters. The full action and paragraph text
     are in `video/audio/timecodes.json` (`action`, `text`). The recording followed
     `video/plan-nagrania.md`, so its step order is the order to expect.
   - Rafał records with retakes. Take the **last complete take** of an action, not the first.
   - Narrow down with denser sheets: `indeks <lekcja> --od=S --do=S --co=1`, and `--co=0.25`
     around the clicks you will anchor.
   - `npm run montaz -- zdania <lekcja> [--segment=N]` writes `work/zdania[-segment-NN].md`: the
     start of every sentence in seconds of its paragraph, read from the narrator's pauses, and the
     "cięcie pauzy" column: the middle of the silence before it. A start marked `~` is an
     estimate from letter counts (no pause there, so no cut point); anchor it with extra margin.
4. **EDL.** `npm run montaz -- edl <lekcja>` creates `video/montaz/edl.json` with one entry per
   paragraph, or merges a changed `spis.md` into an existing one. Decisions survive only on
   paragraphs whose text did not change. Fill each entry:
   - `od` / `do`: seconds of the recording covering the action. Use `do: null` for a still frame
     at `od`: a paragraph with no action, or the "▶ START SEGMENTU" paragraph before anything
     happens.
   - `oczekiwania`: ranges where the screen waits (loading, a model answering) or stands still
     inside a step (a settings panel between the click and the canvas). Each shrinks to 0.5 s and
     keeps the shot continuous. Use `bezruch` from `indeks.md` to find them.
   - `wyciecia`: ranges to drop: mistakes, a retake's false start, mouse wandering.
   - `kotwice`: `[second of the recording, second of the paragraph]` pairs. One per action the
     narrator introduces: the recording second where the action starts, the paragraph second
     where the sentence about it starts (from `zdania`). The engine holds the last frame before
     the action until then and speeds up a stretch only when the narration has already moved on.
     Place the recording second 0.2–0.3 s **before** the first frame of the action: sheet times
     are ±0.25 s, and the held frame must show the state before the action, not its start. Both
     values must increase, and an anchor must not fall inside a cut or a wait.
   - `pauzy`: `{ po, czas }` — silence inserted into the narration at second `po` of the
     paragraph, `czas` seconds long, up to 4 s. Take `po` from the "cięcie pauzy" column of
     `zdania`, never from the sentence start: the start is the first sound of the word, and a
     pause there clips it. Everything timed at or after `po` moves later by `czas`; a highlight
     ending at `po` lasts through the pause. Use a pause instead of a speed-up and wherever an
     action or a result needs to be seen. `sprawdz` and the render measure the narrator's
     recording and reject a pause that does not sit in its silence, naming the point to use
     instead. A pause at second 0 or at the very end usually belongs to the neighbouring
     paragraph, and the message says so.
   - `zaznaczenia` (see the effects palette): timed in **seconds of the paragraph's narration**,
     rectangles and arrow tips in **pixels of the recording**. A highlight starts when the
     narrator names the thing it points at, never earlier, and lasts only while it is the
     subject. Most paragraphs need none.
   - `dzwieki`, `przejscie`: optional (see the palette and "Pace comes first").
   - `wstawki`: `[{ z, od, do }]` — from `od` to `do` (narration seconds, at least 1 s) the
     picture is a still of second `z` of the recording, cross-faded in and out; highlights in
     that time draw on the still. Use it when the narration order differs from the recording
     order (the narrator explains a field after the panel with it has closed). Read the
     rectangle with `klatka --akapit=ID --czas=S` inside the insert: it returns the still.
   - `wyciszenia`: `[[od, do]]` in seconds of the paragraph's narration — a narrator artifact
     (a drawn-out "uuu", a breath, a stray sound in a pause) replaced with silence; timing does
     not change. Find it on a spectrogram (a flat block of one pitch without consonants) and put
     both edges in the quiet around it; `sprawdz` and the render reject an edge inside speech.
   - Read rectangles **only** from `npm run montaz -- klatka <lekcja> --akapit=ID --czas=S`:
     the full-resolution frame shown at that second of the paragraph's narration (with a grid
     every 1/16 of the width). Take `--czas` from the middle of the highlight. The screen often
     changes inside a paragraph (a panel opens, logs switch view), so a frame from another moment
     puts the frame on an empty spot. Never read rectangles from contact sheets: a thumbnail is ¼
     of the width and the guess lands on the wrong field.
   - Look at the whole range of every paragraph on dense sheets, not only its actions, and cut
     every screen the narration does not need: another application the narrator does not mention
     (copying a token, a password manager prompt), browser bars ("press Esc to exit full
     screen"), notifications, mouse wandering.
   - Fit: each stretch between anchors (a paragraph without anchors is one stretch) that is
     longer than its share of the narration is sped up evenly. Above 1.25× the check warns: add a
     pause, a cut, or accept a small lag by moving the anchor later. A stretch shorter than its
     share ends on a held frame, which is fine.
   Check with `npm run montaz -- sprawdz <lekcja> [--segment=N]`. All errors come at once; fix
   them all before the next check.
   **Boards (plansze) - only when `kurs.yaml` has `montaz: { plansze: true }` and the lesson has
   `video/plansze.yaml`** (spec `docs/superpowers/specs/2026-10-06-plansze-w-montazu-design.md`).
   A board is a slide in the course theme (points revealed one by one, optional pixel-art loop) or a
   photo, laid over the whole frame while the narrator explains and the screen stands still. Run
   `npm run montaz -- plansze <lekcja>` once after the EDL exists: it transcribes the voice-over
   package (ElevenLabs speech-to-text, cents, cached by file hash), renders the boards and their
   reveal stages, checks that stages never move the layout, and prints the board times on the
   current EDL with the phrases it heard. Check that every board starts and ends on the phrase it
   names. A phrase it cannot find is an error with the nearest candidates - fix `plansze.yaml`, never
   guess. Render and sample lay the boards on by themselves (times recomputed from the EDL every
   time, no paid call); they refuse when `plansze.yaml`, the theme or a graphic changed since this
   step, or when the voice-over changed - then run this step again. An EDL effect hidden under a
   board for longer than the fade is a warning: move the effect or accept it.
   If the course turns boards on but the lesson has no `video/plansze.yaml`, say so to Rafał at the
   start and offer `/kurs-lekcja` to write it (this skill never writes lesson content); montage
   without boards stays valid.
5. **GATE: sample.** Fill the EDL for the first screencast segment only, then
   `npm run montaz -- probka <lekcja> --segment=N` and `npm run montaz -- kontrola <lekcja> --segment=N`.
   Listen to the narration of the sample for narrator artifacts in the pauses and mute them with
   `wyciszenia` before showing it.
   Look at every control sheet against `kontrola.md`. Each tile pair (A = start, Z = end) must
   show what the action column says, and every R tile (the middle of a highlight) must show the
   highlight on the thing the narrator names — not on an empty spot or a neighbouring field.
   Compare every Z tile with the A tile of the next paragraph: a different state (a form open,
   then the canvas; an old chat, then an empty one) means a step was cut out between them — find
   it in the recording and show it (see "Best take, whole transitions").
   Then check sync: take frames from the sample just after each anchored sentence starts (and
   just before it) and confirm that no action shows up before the sentence that introduces it.
   Fix mismatches before showing anything. Then give Rafał the sample path
   (`video/montaz/work/probka-segment-NN.mp4`) and ask whether the pace, the pauses, the
   transitions and the effects work. Wait for an explicit yes. His remarks change the EDL; re-render the
   sample (unchanged paragraphs come from the clip cache). The rest of the lesson starts only
   after the yes.
6. **Full render.** Fill the remaining paragraphs, `sprawdz`, then
   `npm run montaz -- render <lekcja>`. If the command refuses because `nagranie-z-lektorem.mp4`
   "nie pochodzi z montażu automatycznego", that file is a manual export. Ask Rafał whether to
   replace it; only on yes run `render <lekcja> --nadpisz`, which moves the old file to
   `video/archiwum/`. Then `npm run montaz -- kontrola <lekcja>` and review every sheet as in
   step 5. Fix, re-render, review again until every pair matches.
7. **Hand-off to `/kurs-video`.** The stage 2 render belongs to `/kurs-video`. Its own gate on the
   avatar engine still applies, and `--avatar=mcp` is the safe choice when the avatars are
   already there. Avatars always live in the lesson's own `video/avatar/` (stage 1 writes them
   there, stage 2 reads them from there), so the gate never asks for an avatar path. Stage 2
   puts the opening and closing avatar around the screen recording, attaches the intro and
   outro (from kurs.yaml `oprawa` when the course has it, otherwise from `zrodla.json`) and assembles
   `video/final.mp4`. In a course with `oprawa.znak_ai` it also burns in the AI mark between them and
   hands over the film only after the mark's control gate (`video/znak-ai/raport.md`). Tell Rafał that, and that `final.mp4` is his to watch at the
   `/kurs-video` acceptance gate. Montage remarks from that gate come back here: change the EDL,
   then `render`, then `/kurs-video` stage 2 again.
8. **Close.** Changes stay uncommitted — Rafał commits. Montage leaves nothing to commit in the
   lesson: `video/montaz/` (EDL included) and the media are git-ignored. List what was produced
   and where it lies on disk.

## Rules

- In a course with kurs.yaml `oprawa.znak_ai`, `montaz render` also writes `video/montaz/obszary-filmu.json`
  (where highlights, boards and automation actions are on screen) for the AI mark's corner guard. Nothing to
  do by hand; a course without the key gets no new file.
- **Intro, outro and avatars are never modified.** No trimming, no fades, no loudness changes, no
  re-voicing. `/kurs-video` re-encodes them to the common clip format (1920×1080, 30 fps, AAC
  48 kHz) only because concat needs one format; what is seen and heard stays as delivered.
- The source recording is read-only. Everything this skill produces besides the three output
  files lives in `video/montaz/work/`, which is disposable.
- Narration is cut only at the `spis.md` timecodes and at the `pauzy` points of the EDL, which
  sit in the silence before a sentence (the "cięcie pauzy" column of `montaz zdania`, checked
  against the recording) — never at a silence guessed by length. A paragraph pause is not told
  apart from a natural one by length (`PARAGRAPH_PAUSE_TRACK_B_S` in `src/config.js`). Every
  narration range gets an 8 ms fade in and out, so a cut that still lands next to a sound does
  not click; paragraphs that follow each other in one file are joined without a cut.
- No paid API. This skill never calls TTS or HeyGen and never runs `npm run video` itself
  without the `/kurs-video` gate. The one exception is `montaz plansze` (speech-to-text of the
  voice-over package, cents, cached) and only in a course that turns boards on - tell Rafał before
  the first run on a lesson.
- Never change `lekcja.yaml`. `status.video` belongs to `/kurs-video`.
- A changed narration means a new voice-over package from `/kurs-video` stage 1 first, then
  `npm run montaz -- edl` to merge. Paragraphs whose text changed lose their decisions and must
  be filled again.
- The manual editor stays a valid path. If Rafał prefers to edit a lesson himself, the pipeline
  reads his export the same way; this skill then has nothing to do.
- NEVER write or edit lesson content, quizzes or the scenariusz — those are `/kurs-lekcja`,
  `/kurs-uwagi`, `/kurs-zadania`.
