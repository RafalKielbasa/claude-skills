---
name: kurs-uwagi
description: Applies Rafał's inline remarks — `[UWAGA: ...]` lines written straight into video/scenariusz.md — one at a time, then deletes the ones it applied. Use when Rafał says "nanieś uwagi", "przejdź przez uwagi", "poprawki ze scenariusza", or points at a scenariusz that contains [UWAGA: ...] markers.
---

# /kurs-uwagi — apply inline remarks from a scenariusz

Input: a lesson path, e.g. `kursy/<slug>/modul-01-x/lekcja-02-y`.
Output: `video/scenariusz.md` edited only where the remarks point, plus a report at a review
gate. Everything runs in the main session — no subagents, no Workflow.

Talk to Rafał in Polish; this file is in English only because `CLAUDE.md` requires it of
skills. The marker, the file paths and the report labels stay Polish.

**This is not `/kurs-redakcja`.** Redakcja rewrites the whole file for style and invalidates
every segment's TTS cache. This skill touches only what a marker points at, so a lesson that
is already rendered pays only for the segments that actually changed.

## Procedure

1. **Entry gate.** `video/scenariusz.md` must exist and contain at least one `[UWAGA: ...]`
   line. Zero markers → stop and say so plainly. Do not offer `/kurs-redakcja` as a
   substitute; the user asked for remarks, not for a style pass.
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
4. **Apply surgically.** Edit only the places the remarks point at. Outside those places the
   file stays byte-identical: no reflowing, no re-punctuating, no "while I'm here" fixes.
   Scope of an edit: narration text and `[AKCJA: ...]` lines. Segment count, order, screen
   types and the frontmatter `typ:` never change — a remark asking for that belongs to
   `/kurs-lekcja`, and you say so instead of doing it.
5. **Rafał's remark outranks a course rule, but never silently.** If applying a remark
   contradicts `kursy/<slug>/wymowa.md` or the "Nietykalne" section of
   `kursy/_wspolne/redakcja.md`, apply it and name the overridden rule in the report. A
   quietly changed phonetic spelling comes back as inconsistent pronunciation in the next
   lesson.
6. **Delete what you applied, keep what you did not.** An applied marker's line disappears.
   A remark you did not apply — disputed, needing Rafał's decision, or rejected — keeps its
   line and goes into the report with the reason. Deleting a marker without making the change
   is a silent rejection and is forbidden.
7. **Self-check.** Before the gate, verify yourself:
   - segment count, order and screen types unchanged; frontmatter `typ:` unchanged,
   - proper names in narration follow `kursy/<slug>/wymowa.md`; any new phonetic spelling is
     appended to that list,
   - `[AKCJA: ...]` lines and segment titles keep names in their original spelling, per
     "Nazwy w scenariuszu" in `kursy/_wspolne/redakcja.md`,
   - no remark text leaked into narration.
8. **Statuses.** If the scenariusz changed and `status.video` is `wyrenderowane` or
   `zaakceptowane`, set it to `brak` in `lekcja.yaml` — the render is now out of date, and a
   fresh `/kurs-video` costs TTS and HeyGen (for a demo lesson, also Rafał's manual edit).
   Say this out loud. `status.tresc` is not touched. The skill runs at any `status.tresc`,
   `zatwierdzona` included — a remark on an approved, rendered lesson is the main case this
   exists for.
9. **Validate.** `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`
   (the lesson directory, not the course — errors from other lessons do not belong in this
   gate). Fix every ERROR **with one exception**: when you deliberately left a remark
   unapplied on a lesson at `status.tresc: zatwierdzona`, the validator reports
   `nienaniesione uwagi przy status.tresc zatwierdzona`. That error is the expected consequence of step 6,
   not a defect — do not "fix" it by deleting the marker. Quote it in the report and say which
   remark keeps it alive; it clears when Rafał decides that remark. Every other ERROR you fix.
   For `typ_video: demo` **at `status.tresc: zatwierdzona`**, regenerate the recording plan:
   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`; narration changed, so the
   plan is genuinely stale. At `szkic` or `do_review` do not run it — `generateRecordingPlan`
   refuses anything but approved content. Say in the report that the plan regenerates on
   approval instead.
10. **GATE: report for Rafał.** A table — remark → what you did → segment. Then: remarks left
    unapplied with reasons; rules overridden; the list of segments whose narration changed
    (exactly the set that will be re-synthesised; every other segment keeps its cached audio
    and avatar); status changes. Remind him the full diff is in the working tree. Apply his
    follow-up remarks directly and iterate.
11. **After Rafał approves.** If you made further edits, run validation again. Changes stay
    uncommitted — Rafał commits. Offer a Conventional Commits message, e.g.
    `kurs(<slug>): uwagi do scenariusza lekcji NN-y`.

## Rules

- A remark is an instruction about a place, not a licence to edit the file. If you cannot tell
  which sentence a remark is about, that is a question for step 3, not a guess.
- NEVER render video, generate content, or write quizzes — those are `/kurs-video`,
  `/kurs-lekcja`, `/kurs-zadania`.
- The pipeline blocks a forgotten marker in two places: `npm run validate` errors when markers
  survive at `status.tresc: zatwierdzona`, and `npm run video` refuses to start before its
  first paid API call. Neither is a substitute for finishing the job here.
- If Rafał wants the whole file reworked rather than these specific places, that is
  `/kurs-redakcja`. Say so instead of quietly widening the scope.
