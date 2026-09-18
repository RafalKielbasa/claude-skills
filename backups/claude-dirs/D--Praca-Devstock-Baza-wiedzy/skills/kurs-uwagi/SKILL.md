---
name: kurs-uwagi
description: Applies Rafał's inline remarks — `[UWAGA: ...]` lines written straight into video/scenariusz.md — one at a time, propagates each applied change to every dependent lesson file, then deletes the markers it applied. Use when Rafał says "nanieś uwagi", "przejdź przez uwagi", "poprawki ze scenariusza", or points at a scenariusz that contains [UWAGA: ...] markers.
---

# /kurs-uwagi — apply inline remarks from a scenariusz

Input: a lesson path, e.g. `kursy/<slug>/modul-01-x/lekcja-02-y`.
Output: `video/scenariusz.md` edited only where the remarks point, **every dependent lesson
file brought into line with those edits**, plus a report at a review gate. Everything runs in
the main session — no subagents, no Workflow.

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
   `video/konspekt-nagrania.md`, `video/dane-do-nagrania.md` (both only for
   `typ_video: demo`), `video/prezentacja.yaml` (only for `typ_video: prezentacja`).
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
7. **Propagate to every file the change touches.** A lesson says the same thing in up to four
   places. A change that lands in the scenariusz alone is a rozjazd, and it surfaces at
   recording time — after the content gate, when Rafał is already clicking. Walk every applied
   change and bring its counterparts into line:

   | what changed in the scenariusz | where the same thing also lives |
   |---|---|
   | a literal typed or pasted on screen: chat question, node / credential / sheet / field name, field value | `artykul.md` (the step telling the reader to type it), `video/konspekt-nagrania.md` (the numbered step), `video/dane-do-nagrania.md` (the "Do wklejenia i wpisania na ekranie" table and the blocks under it) |
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
     across `artykul.md`, `video/konspekt-nagrania.md`, `video/dane-do-nagrania.md` and
     `video/prezentacja.yaml`. A single hit means the job is half done. Quote the grep and its
     count in the report — "sprawdziłem" without a number is not a check.
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
   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`; narration, konspekt and the
   cheat sheet (`video/dane-do-nagrania.md`, copied into the plan's "Do wpisania" column and the
   blocks under each segment table) are all plan sources, so the plan is genuinely stale after
   any of them changed. Read its warnings — a step that suddenly pairs
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
