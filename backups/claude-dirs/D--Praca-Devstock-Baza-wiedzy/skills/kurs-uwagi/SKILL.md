---
name: kurs-uwagi
description: Applies Rafał's inline remarks — `[UWAGA: ...]` lines written straight into video/scenariusz.md — one at a time, propagates each applied change to every dependent lesson file, then deletes the markers it applied. Use when Rafał says "nanieś uwagi", "przejdź przez uwagi", "poprawki ze scenariusza", or points at a scenariusz that contains [UWAGA: ...] markers. Also runs in auto mode, without gates, for the `[UWAGA: przebieg próbny, krok K: ...]` markers /kurs-nagrywanie writes in a lesson with a production ticket.
---

# /kurs-uwagi — apply inline remarks from a scenariusz

Input: a lesson path, e.g. `kursy/<slug>/modul-01-x/lekcja-02-y`.
Output: `video/scenariusz.md` edited only where the remarks point, **every dependent lesson
file brought into line with those edits**, plus a report at a review gate (in auto mode: a
commit and entries on the lesson card instead, see "Auto mode (dry-pass markers)"). Everything
runs in the main session — no subagents, no Workflow.

Talk to Rafał in Polish; this file is in English only because `CLAUDE.md` requires it of
skills. The marker, the file paths and the report labels stay Polish.

**This is not `/kurs-redakcja`.** Redakcja rewrites whole files for style and invalidates
every segment's TTS cache. This skill touches only what a marker points at — in the scenariusz
and in the files that repeat the same thing — so a lesson that is already rendered pays only
for the segments that actually changed.

## Procedure

1. **Entry gate and inventory of dependants.** `video/scenariusz.md` must exist and contain at
   least one `[UWAGA: ...]` line. Zero markers → stop and say so plainly. Do not offer
   `/kurs-redakcja` as a substitute; the user asked for remarks, not for a style pass.
   Then list which dependent files exist, because step 7 needs them: `artykul.md`,
   `video/konspekt-nagrania.md` (only for `typ_video: demo`), `video/prezentacja.yaml`
   (only for `typ_video: prezentacja`).
   Note `typ_video` and `status.tresc` from `lekcja.yaml` — steps 7, 9 and 10 branch on them.
2. **Inventory.** Read the whole scenariusz. Show a table before changing anything:
   number, segment (`NN — tytuł`, or `cały scenariusz` for a marker before the first
   heading), the sentence directly above the marker, and the remark text. Rafał must see
   that you read all of them.
3. **Classify, then ask once.** A remark that names its own fix ("zamień X na Y", "wytnij to
   zdanie") is applied without asking. Put into a single `AskUserQuestion` call, before any
   edit:
   - remarks that are signals rather than instructions ("to brzmi sztucznie", "za długie"),
   - remarks whose text is empty,
   - remarks whose application would override a course rule (see step 5).
   Wait for the answer. A timeout, or a hint to "proceed using your best judgment", is NOT
   consent — say you are waiting and ask again.
4. **Apply surgically in the scenariusz.** Edit only the places the remarks point at. Outside
   those places the file stays byte-identical: no reflowing, no re-punctuating, no "while I'm
   here" fixes. Scope inside this file: narration text and `[AKCJA: ...]` lines. Segment
   count, order, screen types and the frontmatter `typ:` never change — a remark asking for
   that belongs to `/kurs-lekcja`, and you say so instead of doing it. The other lesson files
   are not touched yet; they are step 7, after every remark has landed here.
5. **Rafał's remark outranks a course rule, but never silently.** If applying a remark
   contradicts `kursy/<slug>/wymowa.md`, the "Nietykalne" section of
   `kursy/_wspolne/redakcja.md`, or `kursy/_wspolne/profil-wypowiedzi.md`, apply it and name
   the overridden rule in the report. Narration you rewrite because of a remark follows the
   profile (its "Rdzeń: ruchy" and "Rytm: liczby" sections) - a remark changes what is said,
   not how Bartek says it. A quietly changed phonetic spelling comes back as inconsistent
   pronunciation in the next lesson.
6. **Delete what you applied, keep what you did not.** An applied marker's line disappears.
   A remark you did not apply — disputed, needing Rafał's decision, or rejected — keeps its
   line and goes into the report with the reason. Deleting a marker without making the change
   is a silent rejection and is forbidden.
7. **Propagate to every file the change touches.** A lesson says the same thing in up to three
   places. A change that lands in the scenariusz alone is a rozjazd, and it surfaces at
   recording time — after the content gate, when Rafał is already clicking. Walk every applied
   change and bring its counterparts into line:

   | what changed in the scenariusz | where the same thing also lives |
   |---|---|
   | a literal typed or pasted on screen: chat question, node / credential / sheet / field name, field value | `artykul.md` (the step telling the reader to type it), `video/konspekt-nagrania.md` (the numbered step, and its "Do wklejenia i wpisania na ekranie" section - the table and the blocks under it) |
   | an `[AKCJA: ...]` line: what is clicked, opened or shown, and in what order | `video/konspekt-nagrania.md` (the numbered step), and `artykul.md` where the article walks the same click |
   | a claim about the interface: a field invisible in some mode, a warning that does not appear, the name of a section or tab | `artykul.md`, `video/konspekt-nagrania.md` |
   | the outcome of a demo beat, or the point the beat is making | `artykul.md` (the matching `### Krok N` section) |
   | a slide's wording, for `typ_video: prezentacja` | `video/prezentacja.yaml` |
   | narration wording with no counterpart on screen or in the article | nothing — stop here |

   Four rules for the propagation itself:
   - **One direction only.** The scenariusz is the source of truth (`redakcja.md` →
     "Scenariusz jest źródłem prawdy") because it is the file Rafał verifies by clicking
     through the product. The other files follow it. Never edit the scenariusz to match them.
   - **Spelling is translated, not copied.** Narration carries names quoted and phonetic
     (`"Get Meni"`, `"en osiem en"`, `"Google Szits"`); `artykul.md`, the konspekt, the cheat
     sheet and `prezentacja.yaml` carry the original spelling (`Get Many`, `n8n`,
     `Google Sheets`). Carry the meaning across, not the string — see "Nazwy w scenariuszu"
     in `redakcja.md`.
   - **Search, never assume.** For every literal that changed, grep the OLD wording across all
     dependent files and fix every hit. These files use U+00A0 after one-letter words, so a
     pattern containing ` i `, ` w `, ` z ` can return zero on text that is certainly there —
     anchor on a fragment without one-letter words, or allow both space characters.
   - **Surgical there too.** In a dependent file you change only what the propagation
     requires. If a counterpart cannot be fixed without rewriting a whole section, that is
     still yours to do, but it goes into the report as a separate line, flagged as a rewrite.
   `video/plan-nagrania.md` is generated, never edited by hand: it refreshes in step 9.
8. **Self-check.** Before the gate, verify yourself:
   - segment count, order and screen types unchanged; frontmatter `typ:` unchanged,
   - proper names in narration follow `kursy/<slug>/wymowa.md`; any new phonetic spelling is
     appended to that list,
   - `[AKCJA: ...]` lines and segment titles keep names in their original spelling, per
     "Nazwy w scenariuszu" in `kursy/_wspolne/redakcja.md`,
   - no remark text leaked into narration,
   - **zero leftovers of the propagation:** for every literal you changed, grep its OLD form
     across `artykul.md`, `video/konspekt-nagrania.md` and `video/prezentacja.yaml`. A single
     hit means the job is half done. Quote the grep and its count in the report —
     "sprawdziłem" without a number is not a check.
9. **Statuses and validation.** If the scenariusz changed and `status.video` is
   `wyrenderowane` or `zaakceptowane`, set it to `brak` in `lekcja.yaml` — the render is now
   out of date, and a fresh `/kurs-video` costs TTS and HeyGen (for a demo lesson, also
   Rafał's manual edit). Say this out loud. `status.tresc` is not touched. The skill runs at
   any `status.tresc`, `zatwierdzona` included — a remark on an approved, rendered lesson is
   the main case this exists for.
   Then `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`
   (the lesson directory, not the course — errors from other lessons do not belong in this
   gate). Fix every ERROR **with one exception**: when you deliberately left a remark
   unapplied on a lesson at `status.tresc: zatwierdzona`, the validator reports
   `nienaniesione uwagi przy status.tresc zatwierdzona`. That error is the expected
   consequence of step 6, not a defect — do not "fix" it by deleting the marker. Quote it in
   the report and say which remark keeps it alive; it clears when Rafał decides that remark.
   Every other ERROR you fix.
   For `typ_video: demo` **at `status.tresc: zatwierdzona`**, regenerate the recording plan:
   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`; narration and konspekt are the
   plan's two sources - the konspekt's "Do wklejenia i wpisania na ekranie" section is copied
   into the plan's "Do wpisania" column and the blocks under each segment table - so the plan is
   genuinely stale after either changed. If the generator refuses with a message naming the old
   layout, stop and follow `/kurs-lekcja`, `Migracja lekcji ze starego układu` - do not convert
   the lesson inside this skill. Read its warnings — a step that suddenly pairs
   "po kolejności" is a naming rozjazd you introduced. At `szkic` or `do_review` do not run it
   — `generateRecordingPlan` refuses anything but approved content. Say in the report that the
   plan regenerates on approval instead.
10. **GATE: report for Rafał.** A table — remark → what you did → segment. Then: the
    propagation table (change → files updated → `plik:linia`), with any counterpart rewrite
    flagged separately; the grep counts from step 8; remarks left unapplied with reasons;
    rules overridden; the list of segments whose narration changed (exactly the set that will
    be re-synthesised; every other segment keeps its cached audio and avatar); status changes.
    Remind him the full diff is in the working tree. Apply his follow-up remarks directly and
    iterate.
11. **After Rafał approves.** If you made further edits, run validation again. Changes stay
    uncommitted — Rafał commits. Offer a Conventional Commits message, e.g.
    `kurs(<slug>): uwagi do scenariusza lekcji NN-y`.

## Auto mode (dry-pass markers)

Spec: `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`, sections 2.2 and
2.3. In a lesson with a production ticket (`video/ticket.yaml`), `/kurs-nagrywanie` step 4 runs
its scope test (the self-applied change bound, D1) on every `scenariusz` finding of a dry pass,
writes a marker for each finding within that bound (D1) and calls this skill in auto mode.

**Entry.** The run is in auto mode only when both hold: every marker it applies starts with
`przebieg próbny, krok`, and the lesson has a valid `video/ticket.yaml` (present, with `approved`,
`spent` within `budget`; `tools/nagrywanie` `sprawdz` warns about a refused one). Otherwise this
is the normal mode with all its gates. The marker is
`[UWAGA: przebieg próbny, krok K: <rozjazd>. Propozycja: <brzmienie>]`, where `<rozjazd>` quotes
the sentence that disagrees with the screen and `<brzmienie>` is its complete new wording (a
sentence, or a whole `[AKCJA: ...]` line). A marker `[UWAGA: przebieg próbny, krok K (decyzja G4):
<rozjazd>. Propozycja: <brzmienie>]` carries Rafał's own wording from his decision at the teaching
scope gate (G4): it is honoured only when `video/karta.json` has a `decyzja-g4` entry for step K,
and then applied verbatim, with no adaptation of any kind (steps 4 to 6 below do not touch its
text); without that entry it is an ordinary dry-pass marker. Any other marker in the file is Rafał's own: auto mode does not touch it, and it
keeps every gate of the normal mode (a normal run applies it, on his word). While his marker stays
at `status.tresc: zatwierdzona`, the validator error of step 9 is the documented exception, not a
defect.

**Against the normal procedure** (a step not listed runs unchanged):
- **Step 1, record what is already changed.** Before any edit, save `git diff HEAD -- <path>` (it
  also shows what someone staged) of every
  path the run may change (`video/scenariusz.md`, `artykul.md`, `video/konspekt-nagrania.md`,
  `video/plan-nagrania.md`, `lekcja.yaml`, `video/karta.json`, `kursy/<slug>/wymowa.md`). Step 11
  needs it to tell this run's changes from changes it did not make.
- **Step 2, no gate.** Build the inventory as usual but do not show it and do not wait. It reaches
  the lesson card through the `zmiana-tresci` entries of step 10, one per applied marker.
- **Step 3, no question.** The dry pass writes only instruction-type markers: the new wording is
  after `Propozycja:`. A dry-pass marker without a usable `Propozycja:` (empty, or a signal such as
  "brzmi źle" instead of a wording) is not applied.
- **Steps 4 to 6.** Apply surgically: replace the quoted sentence (or the `[AKCJA: ...]` line) above
  the marker with the proposal, adapted only to the course rules of step 5 (`kursy/<slug>/wymowa.md`,
  the "Nietykalne" section of `kursy/_wspolne/redakcja.md`, `kursy/_wspolne/profil-wypowiedzi.md`).
  Names keep the lesson's existing narration style: if the approved narration does not quote node
  names, the change does not quote them either; "Nazwy w scenariuszu" of `redakcja.md` applies only
  when the lesson already follows it. A dry-pass marker never outranks a course rule: step 5's
  override is for Rafał's remarks only. A `(decyzja G4)` marker is not adapted at all. Delete each
  applied marker's line.
- **Steps 7, 8 and 9 run unchanged**: propagation to `artykul.md` and `video/konspekt-nagrania.md`,
  the self-check with its grep counts, statuses, validation and the recording plan regeneration.
  Their results go into the hand-back below, not into a card for Rafał. In step 8 the lesson's
  naming style (steps 4 to 6) wins over the quoted-name check. A new phonetic spelling that
  step 8 appends to `kursy/<slug>/wymowa.md` is a course file, not a lesson path: commit it on its
  own right after step 11 (`kurs(<slug>): wymowa po przebiegu próbnym lekcji <n> (automat)`), by the
  same rules.
- **Step 11 comes before step 10.** Check the branch (`git branch --show-current`): it must be the
  branch this session commits to (in the main checkout of "Baza wiedzy" the branch of the day,
  `rafal-kielbasa/DD-MM-YYYY`). Any other branch means stop and ask Rafał: no commit, no branch
  switch, the changes stay in the working tree. The commit is
  `kurs(<slug>): lekcja <n> uwagi z przebiegu próbnego (automat)`, where `<n>` is `<modul>.<numer>`
  from `lekcja.yaml` (e.g. `1.3`), over the lesson files this run changed (`video/scenariusz.md`,
  `artykul.md`, `video/konspekt-nagrania.md`, `video/plan-nagrania.md`, `lekcja.yaml` when a status
  changed) plus `video/karta.json` when it holds entries not committed yet. Run
  `git diff HEAD -- <path>` on each and compare with what step 1 saved. The commit fails closed:
  a path that holds changes this run did not make (Rafał's or another session's, staged or not) is
  not committed at all; the other paths are committed with `git commit -m "<message>" -- <paths>`
  (pathspec; never `git add -A`, never a temporary index - other sessions share the index). A
  pathspec commit aborts on a path git does not track yet (`did not match any file(s) known to
  git`, e.g. the lesson's first `video/karta.json`), so a path for which
  `git ls-files --error-unmatch -- <path>` fails gets `git add -- <path>` right before the commit
  that names it; a tracked path is never `git add`ed. The turn and the hand-back name every path
  left uncommitted and why.
  `video/plan-nagrania.md` is generated from the scenariusz and the konspekt: when either is left
  out, leave the plan out too. After the commit, `git show --stat HEAD` lists only this run's files.
- **Step 10 becomes lesson-card entries.** After the commit, one entry per applied marker, from
  `tools/course-pipeline`:
  `npm run karta -- dopisz ../../kursy/<slug>/<modul>/<lekcja> --json '{"rodzaj":"zmiana-tresci","krok":K,"akapit":"S:A","przed":"<old sentence>","po":"<new sentence>","pliki":["video/scenariusz.md","artykul.md"],"commit":"<hash>","data":"RRRR-MM-DD"}'`.
  `akapit` is step K's `akapit` in the dry pass's `przebieg.json`; `pliki` lists the lesson files
  that change touched (lesson-relative); `commit` is the hash of step 11, `<hash> (częściowo:
  <pominięte ścieżki>)` when step 11 left some of that change's paths out, or `niezacommitowane`
  when it left all of them out (a `(decyzja G4)` marker gets its `zmiana-tresci` entry
  the same way, next to the `decyzja-g4` entry `/kurs-nagrywanie` writes). An entry the tool refuses
  (`BŁĄD:`, e.g. an e-mail address or a key-shaped token in it) is rewritten without that text,
  never dropped.

**Consent-variant marker** (spec section 10, "Consent variants"). `/kurs-nagrywanie` (its step 3) writes one for an
approved lesson whose on-screen Google sign-in still has a single consent paragraph:
`[UWAGA: przebieg próbny, krok K: <the sentence about Google's screen>. Propozycja: warianty consent | wspólne: <that
sentence without the part about Google's screen> | granted: <sentence> | incremental: <sentence> |
remembered: <sentence>]` (one line), where K is the `numer` of the `google_sign_in` step in `video/nagrywanie.yaml`.
Adding the three consent-variant paragraphs is a rewording within the self-applied change bound (D1) by the spec's own
call: only the sentence about Google's screen changes, and the beat (the account gets connected) is the same in all
three. For this marker, steps 4 to 6 work like this:
- the paragraph stays under the sign-in `[AKCJA: ...]` line, with the quoted sentence replaced by the `wspólne` text.
  The shared part left under that line (what the paragraph says before the quoted sentence, plus `wspólne`) is never
  empty: with no text between the sign-in line and the `WARIANT granted` line, `parsujScenariusz`
  (`tools/course-pipeline/src/scenariusz.js`) merges the two cues into one (`<sign-in>; WARIANT granted - …`). A
  marker whose `wspólne` is empty while nothing precedes the quoted sentence is unusable (a teaching scope (G4)
  trigger, below);
- right after it come three lines in this order, each followed by its own paragraph:
  `[AKCJA: WARIANT granted - Google pokazuje pełny ekran zgody z polami wyboru]`,
  `[AKCJA: WARIANT incremental - Google pokazuje tylko nowe uprawnienia]`,
  `[AKCJA: WARIANT remembered - Google nie pokazuje ekranu zgody]` - the lines `/kurs-lekcja` writes for a new lesson;
- each variant paragraph is the value's sentence followed by the rest of the original paragraph (everything after the
  quoted sentence), copied unchanged into all three. A narration fragment ends only at an `[AKCJA: ...]` line, so text
  left after the last variant paragraph would belong to it and be cut from the film with it;
- each value's sentence opens with its fixed sentence from `/kurs-lekcja`: "Google pyta o zgodę" (granted), "Google
  dopytuje tylko o nowe uprawnienia" (incremental), "Google pamięta zgodę i od razu łączy konto" (remembered), with
  names quoted the way the lesson's narration quotes them (e.g. `"Google" pyta o zgodę`). A marker whose sentences do
  not is unusable (a teaching scope (G4) trigger, below).

In step 7 the article is not touched: it still walks the reader through the consent the reader will see. The konspekt
gets, right after the sign-in step, three variant steps in the same order, one per `WARIANT` line - the convention of
`tools/nagrywanie/przyklady/kurs-przyklad/lekcja-warianty/video/plan-nagrania.md`, where every variant row has its own
step. Each variant step opens with the exact text of its line (`WARIANT granted - Google pokazuje pełny ekran zgody z
polami wyboru`, and so on) and goes on with the same action in all three (what the screen does once the account is
connected, e.g. "konto zostaje połączone, n8n wraca do węzła"). Every later konspekt step moves up by three, and so does
every reference to those numbers inside the konspekt: the rows of the "Do wklejenia i wpisania na ekranie" table, its
`### Krok N` headings, and the step numbers that "Przygotowanie przed nagraniem" and other konspekt prose cite. This
renumbering is the mechanical part of this marker, not a section rewrite. Without the variant steps the plan pairs the
segment's later konspekt steps with the `WARIANT` lines by position, so they get the wrong narration.
The regenerated plan (step 9) pairs each `WARIANT` line with its step by content and prints no new warning for that
segment. In that segment, a new `akcja "…" bez kroku w konspekcie` or a new `sparowany po kolejności, nie po treści`
on a `WARIANT` row means a variant step is missing or does not repeat its line (with all three missing, the later
steps take the `WARIANT` rows by position and `bez kroku` also names the segment's last, non-variant actions). The
same `sparowany po kolejności` also comes from a short non-variant cue of three words or fewer (e.g.
`[AKCJA: zapisz]`), even one paired with its right step; that one was there before the change. Fix the variant
steps before step 11. No plan warning catches a row or a `### Krok N` heading of "Do wklejenia i wpisania na
ekranie" left on its old number: after the shift the old number still names an existing step. Check each row and
heading against the text of its step. The backstops are `sprawdz` in `/kurs-nagrywanie` (a `z_planu` reference whose
plan step has no content to type: `plan-nagrania.md: krok N nie ma treści do wpisania`) and the dry pass. The
change moves `zrodla-hasz`, so `/kurs-nagrywanie` follows it with a dry pass of the whole lesson, as after any change;
the hand-back names the konspekt step after which numbers moved by three, because `video/nagrywanie.yaml` refers to plan steps by number. The
`zmiana-tresci` entry of step 10 has `przed` = the quoted sentence, `po` = `granted: …; incremental: …; remembered: …`,
`pliki` = `["video/scenariusz.md","video/konspekt-nagrania.md"]`, and `akapit` = the `akapit` of step K in
`video/nagrywanie.yaml` when no dry pass has run yet. A lesson already recorded and accepted (`status.video:
zaakceptowane`, e.g. 0.2) is not retrofitted: the marker stays in place and goes back to `/kurs-nagrywanie` with that
reason.

**A marker auto mode cannot apply surgically stays in place** and goes back to `/kurs-nagrywanie`
as a trigger of the teaching scope gate (G4) with the reason; never a guess. That covers: a
counterpart in a dependent file that needs a section rewrite (the normal mode would rewrite and
flag it; auto mode does not); a change of the segment count, order or screen types; a missing or
unusable `Propozycja:`; a proposal that would override a course rule (never for a `(decyzja G4)`
marker, which carries Rafał's word). When the trigger shows up only in step 7, after step 4 has
already changed the scenariusz, restore that sentence and the marker line (and undo any
counterpart already edited for it) before handing back, so the gate sees the lesson as it was.
When no marker was applied, nothing is committed and no card entry is written.

**Hand-back to `/kurs-nagrywanie`** (instead of the step 10 report): the applied markers (step,
sentence before, sentence after), the commit hash and branch, the markers left in place with
their reasons (each a teaching scope (G4) trigger), the step 8 grep counts, the validation
result, status changes, the segments whose narration changed, every path step 11 left
uncommitted with the reason, and - for a consent-variant marker - the konspekt step after which the step numbers moved
by three.

## Rules

- A remark is an instruction about a place, not a licence to edit the file. If you cannot tell
  which sentence a remark is about, that is a question for step 3, not a guess.
- **A remark applied only in the scenariusz is not applied, it is half applied.** The lesson is
  one document split across four files; whatever the viewer sees on screen has to say the same
  thing in every one of them. Propagation is not an optional extra step — leaving it out
  guarantees a rozjazd, and the rozjazd is found by Rafał at the recording, not by the
  validator.
- NEVER render video, generate content, or write quizzes — those are `/kurs-video`,
  `/kurs-lekcja`, `/kurs-zadania`.
- The pipeline blocks a forgotten marker in two places: `npm run validate` errors when markers
  survive at `status.tresc: zatwierdzona`, and `npm run video` refuses to start before its
  first paid API call. Neither is a substitute for finishing the job here, and neither catches
  a missed propagation — `validate` never compares files against each other, and
  `plan-nagrania` pairs steps by whole-step similarity, so a pair differing by one word pairs
  cleanly and warns about nothing.
- If Rafał wants the whole file reworked rather than these specific places, that is
  `/kurs-redakcja`. Say so instead of quietly widening the scope.
