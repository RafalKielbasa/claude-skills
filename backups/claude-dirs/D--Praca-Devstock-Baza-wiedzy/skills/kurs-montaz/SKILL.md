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

(A lesson in scope of the narration sync - `kurs.yaml` `montaz.narration_sync_from` - follows "Narration
sync" in step 4 instead of the 4 s pause limit, the 1.25× warning and the hold + pause advice below; every
other rule of this section still applies. A lesson out of scope follows this section unchanged.)

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
| zoom | `zoom` + rectangle, at most 2x (`MONTAZ_MAKS_ZOOM`: a smaller rectangle does not zoom further) | text is unreadable at 1080p, or the narrator dwells on one detail ("powiększ kadr") |
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
   The one exception is a lesson in scope of the narration sync: there `sync` (and only `sync`) moves
   `od`/`do` and removes execution waits; do not skip the "Narration sync" subsection of step 4 there.
   **Course without kurs.yaml `oprawa`:** ask Rafał only for intro and outro and write them with the
   sources gate, passing the recordings exactly as listed in the existing `zrodla.json`, in the same
   order (EDL `zrodlo` indexes point into that list). **Course with `oprawa`** (`oprawaKursu: true` in
   the list): ask nothing - intro and outro come from the course, and `zrodla.json` written by the
   automation already has them as `null`. Then add highlights, pauses and boards (step 4 effects part; in a lesson
   in scope of the narration sync `sync` writes the pauses, so add only highlights and boards) and go on with the
   sample gate (a lesson without a ticket).
   **Lesson with a production ticket** (`video/ticket.yaml`, gate "bilet produkcyjny (G1)" of
   `/kurs-nagrywanie`; spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
   sections 9, 11 and 12): the montage runs without a gate. The state above is the same, but the sample
   gate (step 5) and Rafał's review of the full montage (steps 6 and 7) do not exist: you still fill the EDL,
   run `sprawdz`, `probka` per segment and `kontrola`, and review every control sheet yourself, then go on to
   `/kurs-video` stage 2. Montage warnings reach the lesson card through `npm run karta -- buduj`; whatever
   you cannot settle and the warnings do not carry goes to the card with
   `npm run karta -- dopisz ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --json '<entry>'` (kind `miejsce`,
   `zrodlo: "montaz"`; fields in `/kurs-nagrywanie`, section "Karta lekcji (lekcja z biletem)"; the tool
   refuses an entry with an e-mail address or a key-shaped string). In a course without `oprawa`, the intro and
   outro decision is settled on the G1 card ("bilet produkcyjny (G1)") before the ticket is written; this skill
   never asks for it and never stops on a gate. If it is missing, the ticket was written wrongly: stop with a
   message naming the missing intro/outro decision (a G1 top-up, not a new gate), and never pick them yourself. Commits: `git branch --show-current` first, then
   `git commit -m … -- <paths>` (`git add -- <path>` only for a path that is not tracked yet, right before
   that commit; a path with changes this session did not make is not committed and the turn names it; no
   push); `video/karta.json` goes into the lesson's next commit. A lesson without a ticket keeps every gate
   below.
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
     Rectangles are in source pixels: on a 3840x2160 source (a 4K take) they are twice as large as on a 1920x1080 one, so always read them from `montaz klatka`. The still reaches you scaled down, so do not read pixels off the view: count the grid cells and multiply (one cell is 1/16 of the width, 240 source px on a 4K take and 120 on a 1080p one; the command prints it as `siatka co N px`).
   - `dzwieki`, `przejscie`: optional (see the palette and "Pace comes first").
   - `wstawki`: `[{ z, od, do }]` — from `od` to `do` (narration seconds, at least 1 s) the
     picture is a still of second `z` of the recording, cross-faded in and out; highlights in
     that time draw on the still. Use it when the narration order differs from the recording
     order (the narrator explains a field after the panel with it has closed). Read the
     rectangle with `klatka --akapit=ID --czas=S` inside the insert: it returns the still.
   - `wyciszenia`: `[[od, do]]` in seconds of the paragraph's narration — a narrator artifact
     (a drawn-out "uuu", a breath, a stray sound in a pause) replaced with silence; timing does
     not change. Find it on a spectrogram (a flat block of one pitch without consonants) and put
     both edges in the quiet around it; `sprawdz` and the render reject an edge inside speech. In a lesson
     with a ticket `kontrola-lektora --zastosuj` (`/kurs-video` step 4b) may already have added mutes: keep
     them and put yours next to them.
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
   **Narration sync - lessons in scope only** (spec `docs/superpowers/specs/2026-11-04-nagrywanie-narration-sync-design.md`).
   A lesson is in scope when `kurs.yaml` has `montaz: { narration_sync_from: "M.L" }` and the lesson's
   module and lesson number are at or after it (`agenty-ai`: from 3.1). `sync-sheet` and `sync` refuse a
   lesson outside the key and say why; a course without the key never syncs. A lesson out of scope follows
   every rule above and in "Pace comes first" unchanged - do not use this subsection there. Rafał explicitly
   asking for an older lesson means lowering the key in `kurs.yaml` or passing `--poza-zakresem` to both
   commands (the report records it). On the sync path the following replaces the "Fit" bullet, the 4 s limit
   on `pauzy` and the "hold + pause" advice of "Pace comes first":
   - The 4 s pause limit does not apply: a pause in a synced paragraph may be up to 6 s. The "Fit"
     paragraph and the 1.25× warning do not apply either; the report flags tempo above 4× instead. Do not
     buy time by hand: `sync` owns `pauzy` of a synced paragraph and overwrites them, and nothing is cut for pace.
     `wyciecia` stay for mistakes and foreign screens.
   - Transit pace (spec `docs/superpowers/specs/2026-11-10-nagrywanie-transit-pace-design.md`). A lesson at or after
     `kurs.yaml` `montaz.transit_from` (`agenty-ai`: 3.4) plays transit at 3x: helper motion that shows no narrated
     step - clicks of the helpers in `montaz.transit_helpers` (`chatToggleHide`, `chatToggleOpen`, `closeNodeView`) and
     unnamed windows of the actions in `montaz.transit_helper_actions` (`open_node`), hovers, scrolls and `wait_for` the narration does not name, and the stands and short gaps between them. `sync`
     finds these chains and writes them to `transit_ranges` on every run (do not edit it); a `'break'` range is a chain
     that ends at a pinned sentence and plays in the break before that sentence. The agent only pairs sentences with
     actions. With transit, a break may be up to 7.5 s on an entry that has `transit_ranges` (6 s otherwise). A
     lesson before `transit_from` follows the rules above unchanged.
   - Only `sync` moves `od`/`do` (the lead-in rule below). `oczekiwania` that overlap an execution
     (`run_workflow`, `run_step`, `send_chat_message`) are removed by `sync`.
   - A standing screen keeps 1 s: a declared still wait, and the still ranges `sync` finds with `freezedetect`
     (`n=0.0008`, at least 1.5 s) on each recording with markers, cached in `work/stills/`. It takes out the window
     of every marker action (an execution, and also a click, hover, scroll or typing), a cut or a declared wait,
     splits the rest at every anchor, drops what is shorter than 1.5 s, and writes `still_ranges` on every run, so do
     not edit that field. A source without markers gets none and the report names it. `freezedetect` does not see a
     moving pointer (it is too small for the threshold), which is why the action windows are taken out; a pointer
     movement outside them and a small canvas change can still read as still, so check the `K` tiles.
   - The rule: a stretch runs from a sentence pinned to an action up to the next pinned sentence, or to the paragraph's
     end. `N` is its narration time, `R` its recording time with standing screens at 1 s, `E = R - N`, and `L` the break
     limit: 5 s for a stretch with at least 3 s of an execution action in its recording, 6 s for any other stretch.
     Waiting for an execution counts as action.

     | Case | While the narrator talks | After the narration |
     | --- | --- | --- |
     | `R <= N` | normal speed, then the last frame of the action holds until `N` ends | no break |
     | `0 < E <= L` | normal speed for `N` | silent break of `E` seconds, normal speed |
     | `E > L` | normal speed for `N` | silent break of exactly `L`, the excess sped up evenly to fit (tempo `E / L`) |

   Procedure, in this order:
   1. If the lesson has boards (`video/plansze.yaml`), run `npm run montaz -- plansze <lekcja>` first
      (`sync` needs its speech-to-text cache; cents on the first run, cached by file hash - if it asks
      for a paid first run on a lesson, stop and tell Rafał). Then run
      `npm run montaz -- sync-sheet <lekcja> [--segment=N]`. It writes `video/montaz/work/sync-sheet.md`:
      for each paragraph the sentences (start, cut point, text), the actions of its recording range
      (step number, `akcja`, `lokator`, `tStart`, `tKoniec`), its waits with their kind (`execution` or
      `still`) and any board covering it, in narration seconds. Actions come from `znaczniki.json` next
      to the raw recording named in `zrodla.json`. With transit the sheet also has a header line about the action
      anchor (the second the pointer starts toward the target), two more action columns `rola` (`pomocnicza`, `najazd`
      or `akcja`) and `wejście` (`tylko ruch pomocniczy` or `krok dydaktyczny`, empty for a helper), and a line
      `Nazwane bez kotwicy (named_actions): …` listing what is already kept in `named_actions`.
   2. Write `kotwice` into `edl.json` for every synced paragraph, replacing what the paragraph had, by
      these rules. A `kotwice` pair is `[recording second, paragraph narration second]`; the narration
      second is the sentence's "cięcie pauzy" value from the sheet (`zdania`), because a break must sit
      in the narrator's silence.
      - Pin a sentence that names a visible action to the start of the pointer's travel: a marked element's
        `tStart`; an action with a window the window's `tStart`; only an unmarked action in a take without windows
        (opening a node by double-click, a rename) the frame where the pointer starts toward the target, read with
        `klatka` and `indeks`, because in a 4K take a still range can hide the travel.
      - Never pin a sentence to a helper unless the narration names that motion. An element the narration names that
        no pin can carry (the second action of one sentence, a hover the narrator points with) goes to the paragraph's
        `named_actions` as its `tStart` (recording seconds); `named_actions` is kept across runs, and `sync` itself adds
        the lead-in pins it drops and first-sentence pins within 1 s of `od`.
      - Pin a sentence about a result to the `tKoniec` of the action that produced it.
      - Two actions in one sentence: pin the first, the second follows at normal speed.
      - A sentence that only explains gets no anchor and stays in the current stretch.
      - A sentence that starts under a board gets no anchor. An action there is pinned to the first
        sentence after the board.
      - The first sentence of a paragraph needs an anchor only when its action starts more than 1 s after
        `od`. It is written as `[tStart, 0]` and handled by the lead-in rule below. Its action is the one the
        sentence names: a `close_node`, `zoomToFit` or `logsToggle` at `od` that the sentence does not name is the
        tail of the previous step, so pin the `+` click or the opened node after it.
      - A lead-in moves everything before its action into the previous paragraph. The exception: write no lead-in
        over a `close_node` or a click when the previous paragraph's last stretch in `sync-report.md` has `R < N`, because
        the moved action plays early and its result holds under the narrator (in 3.1, 7:6 showed the empty canvas for
        6.3 s under a sentence about the panel). With transit the exception applies only when the sheet's `wejście`
        column for the first action says `krok dydaktyczny` (also when the screen changes at once between `od` and the
        action, such as the tab switch in 3:2 of 3.4). With `tylko ruch pomocniczy` write the lead-in: the chain
        plays after the previous paragraph's narration. `sync` refuses a lead-in written over a
        didactic entry while the previous paragraph's last stretch has `R < N`: it returns an error naming the
        paragraph and the `[t, 0]` pin and writes nothing (no `edl.json`, no archive, no report), so there is nothing to
        restore. Remove that pin from the paragraph's anchors and accept the no-anchor flag, or pin the action to a
        sentence inside the paragraph (5:5 in 3.1).
      - A first sentence can name an action recorded in the previous paragraph's range (a step with
        `bez_narracji: true` in `video/nagrywanie.yaml`, 9:8 "Uruchamiam jeszcze raz" in 3.2). Write `[tStart, 0]` here
        too, with `tStart` before `od`: the shared boundary moves back. If it cannot move, `sync` stops and says so.
      - Both values must increase. When the narration order differs from the recording order, use a
        `wstawka` as today.
      In a take with action windows (`actionWindows` in `znaczniki.json`) every action has a row in the sheet, an
      element or a window, and you pin the action to that row's `tStart`: a window's start is where the action begins,
      so a named `open_node` window counts as named only when the pin falls within [−0.05, +0.3] s of it, and a pin
      read from frames lands later and misses it.
      The frame rule below is for a take without `actionWindows`, where marker coverage is partial: `elementy` exist only for
      actions with a located element (the drag in
      3:2, "Przeciągam do niego identyfikator", has none, so take it from the end of the previous element).
      When a sentence has no matching row, or the source has no markers (a human retake), read the second
      from frames (`klatka`, `indeks --od=S --do=S --co=1`) as above; for such a source decide each wait's kind
      from frames too: `waitKind` says `still` for every wait there, so `sync` keeps them all and you remove a wait that is an execution. In a take without windows the step's `dzialania` in `video/nagrywanie.yaml` list what the rows leave out (`rename_node`,
      `pick_resource`, `set_parameter`, `switch_tab`, `compose_prompt`), which tells you what to look for. There, a result
      that appears with a `switch_tab` or an `open_node` is pinned to the frame where it appears, not to the end of
      the action before it. A sentence naming a typed value is pinned to the pointer leaving for that field: the nearest
      row can be a `hover` of another field (2:5 "Limit dwadzieścia" in 3.2 sits after `hover returnAllField`), and
      that `K` tile shows the old value. A sentence whose start is marked `~` has no cut point: do not anchor it, anchor its neighbour.
      The rows of the sheet can be shifted against the sentences (3:6 in 3.2: the "Wybieram" row sits in a comma pause).
      The speech-to-text check of `sync` names the right silence; pin the cut point of the row standing in that silence,
      even when that row shows another sentence. When no row stands in that silence (7:5 in 3.1), pin the middle of the
      silence; the error gives only the sentence's second, so measure the silence with `wykryjCisze` (`src/montaz-zdania.js`).
      Typing reads as a standing screen, so a `compose_prompt` can run ahead of the narrator reading it: pin each read
      line to the moment it starts typing, because a pin splits the still range (7:3 in 3.3).
   3. Run `npm run montaz -- sync <lekcja> [--segment=N]`. It recomputes from `kotwice`, so it can run
      again after every correction, except for the boundaries a run moves: a lead-in (applied and removed from `kotwice`)
      and a hand-over under a board (step 4). Both stay moved, and a pin later corrected past the new `do` is refused as out of range.
      An EDL synced with a lead-in before transit existed has no `named_actions` entry for that lead-in; `sync` plays
      the previous paragraph's end chain in the break only when the next entry is a lead-in of the same source whose `named_actions` holds
      the boundary second (`endPinned`, `src/montaz-sync.js`), so that chain plays in place. A re-recorded lesson is paired from
      scratch: every `npm run nagrywanie -- edl <lekcja> --run <nazwa> [--nadpisz]` (tools/nagrywanie, `/kurs-nagrywanie`
      step 6) clears `kotwice` and `narration_sync`.
      To change one, restore `od`/`do` from the newest `video/montaz/archiwum/edl-before-sync-<time>.json`, the copy `sync`
      makes before it first writes an EDL with no synced paragraph, and pair again. When the restored boundary undoes a
      lead-in, also delete that lead-in's recording second from the `named_actions` of the paragraph that had it (the one
      after the restored boundary): `sync` wrote it there when it dropped the pin, and left there it keeps the element at
      that second named, so a helper there stays didactic. `sync`: applies the lead-in rule (the previous
      paragraph's `do` and this paragraph's `od` both become `tStart`, nothing is cut; a lesson's first
      paragraph or a change of source keeps its lead-in and goes in the report), writes `still_ranges`, computes each
      stretch, replaces `pauzy`, removes `execution` waits, sets `narration_sync: true`, checks the silences and
      the speech-to-text cut points (a mismatch above 0.3 s is an error naming the right silence;
      without a cache the check is skipped and the report says so), and stops with all errors at once.
      It writes `video/montaz/work/sync-report.md`: film length, per paragraph the stretches with `N`,
      `R`, break, hold and tempo, tempo above 4×, paragraphs with two or more actions and no anchor, a lead-in undone
      by a hand-over (only on the run that makes the hand-over), and excluded paragraphs. With transit it adds a
      `- ruch pomocniczy:` scope line, a `ruch pomocniczy` column per stretch, `## Ruch pomocniczy` (chains and their
      total, recording time against film time), `## Długie akcje po zdaniu` and the flags `transit-tempo` (a chain above
      6x) and `transit-body-dropped` (a break chain's body got no room, so its picture is
      dropped: watch the place and check the pins). Read these after every `sync`. Paragraphs with `pomin`, `video_inserts` or `rozmycie` stay on the old rules
      and are listed; a `do: null` paragraph has nothing to sync. If an overlay of that kind is added
      to an already synced paragraph, `sync` stops naming it: remove the overlay, run `sync`, add it back
      with a rectangle and times read from the new picture.
   4. Boards: the recording does not advance under a board. `sync` holds one frame under it and starts
      the action at the first sentence after the board; no silent break sits under a board (any other
      break there is an error naming the sentence). A paragraph with no sentence starting outside a
      board hands its recording range to the next paragraph of the same source; the report lists an
      action that stays hidden. Transit never plays under a board. Where a board closes on a pinned sentence, the
      narrator's silence does not absorb the chain: the whole chain goes into the break after the board leaves. A chain
      that still remains under a board stops `sync` with the existing `… leży pod planszą` error.
   5. Re-read every highlight the report lists (`zoom`, `ramka`, `skupienie`, `strzalka`, `napis` in a
      synced paragraph) with `npm run montaz -- klatka <lekcja> --akapit=ID --czas=S`. Highlights are
      timed in narration seconds but the picture under them has changed, so each rectangle is read
      again from the new frame.
   6. `npm run montaz -- sprawdz <lekcja> [--segment=N]`, then `probka`/`kontrola` as in step 5. Besides the
      A, Z and R tiles, `kontrola` adds a `K` tile after every anchor (`K1`, `K2`…) next to the sentence
      pinned there. Open every `K` tile: the action the sentence names must be on screen at that
      moment. A lead-in that `sync` consumed has no `K` tile: its check is the paragraph's `A` tile and the previous
      paragraph's `Z` tile, which shows what that paragraph now holds under the narrator. No `K` tile can show that,
      because no pin is wrong. A highlight's frame can show it too. Fix a wrong pin in `kotwice`, run `sync` again and repeat until all `K` tiles are right,
      before rendering. A `K` tile's label comes from the nearest row of the sheet, so a shifted row labels it with the
      wrong sentence (3:6 in 3.2): trust the pin, not the label. `montaz render` overwrites its own
      `nagranie-z-lektorem.mp4` without a copy, so copy the old one to `video/archiwum/` first if it may be needed.
   7. Run the final `npm run montaz -- sync <lekcja> --karta` once, after the last correction: it adds
      the flagged places from the report to the lesson card as places to watch, with the long actions from
      `## Długie akcje po zdaniu`. Do not run it on every
      iteration. `--karta` only appends, so before a second re-cut's `--karta`, remove the stale `synchronizacja` entries by hand.
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
   **Lesson with a ticket: no sample gate.** Do the same work as your own check, without showing, asking or
   waiting: for each screencast segment `probka --segment=N` and `kontrola --segment=N`, mute narrator
   artifacts with `wyciszenia`, review every control sheet by the rules above (A/Z pairs, R tiles, every Z
   against the next A, sync frames around anchored sentences) and fix mismatches in the EDL and re-render
   yourself. Then go straight to the full render in step 6. A mismatch the EDL cannot fix (material missing
   in the recording) goes to the card as a `miejsce` entry. Without a ticket this gate applies unchanged.
6. **Full render.** Fill the remaining paragraphs, `sprawdz`, then
   `npm run montaz -- render <lekcja>`. If the command refuses because `nagranie-z-lektorem.mp4`
   "nie pochodzi z montażu automatycznego", that file is a manual export. Ask Rafał whether to
   replace it; only on yes run `render <lekcja> --nadpisz`, which moves the old file to
   `video/archiwum/`. Then `npm run montaz -- kontrola <lekcja>` and review every sheet as in
   step 5. Fix, re-render, review again until every pair matches.
   **Lesson with a ticket:** no question and no review by Rafał. `render` overwrites a
   `nagranie-z-lektorem.mp4` that the montage made itself without asking (the tool allows it); a refusal
   "nie pochodzi z montażu automatycznego" means a manual export and still asks, as above. You review every
   control sheet yourself; accepted warnings (speed above 1.25×, a shot under 1.2 s, an effect under a board)
   reach the card through `buduj`. Without a ticket nothing changes here.
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
   **Lesson with a ticket:** straight to `/kurs-video` stage 2 in the same turn, with no sample to show and
   nothing to wait for; the avatar engine comes from `kurs.yaml` `video.avatar_engine`, so its gate asks
   nothing. The one gate is "film z kartą lekcji (G5)" of `/kurs-video` step 5, where Rafał judges
   `final.mp4` with `video/lesson-card.md`; remarks about the montage come back here as above.
8. **Close.** Without a ticket changes stay uncommitted — Rafał commits. Montage leaves nothing to commit in the
   lesson: `video/montaz/` (EDL included) and the media are git-ignored. List what was produced
   and where it lies on disk. In a lesson with a ticket the card entries you wrote
   (`video/karta.json`) are the one tracked output: in this repository the session commits it with the
   lesson's next commit by the rules in step 1 (pathspec, `git add --` only for an untracked path, foreign
   changes skipped and named, no push).

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
