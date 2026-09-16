---
name: kurs-publikuj
description: Publikacja zatwierdzonych treści lekcji (artykuł, quiz, ćwiczenia) oraz aktywności wideo z ID Vimeo na platformę CodeBusters przez tools/course-pipeline publish — staging domyślnie, prod tylko na jawne "na prod". Używaj, gdy Rafał chce wdrożyć/opublikować kurs, moduł albo lekcję na CodeBusters ("opublikuj moduł 0", "wdróż lekcję na staging", "wyślij na CodeBusters"). NIE dla wgrywania plików na Vimeo i NIE dla tworzenia kursu w CMS.
---

# /kurs-publikuj — publish approved lesson content to CodeBusters

Thin wrapper around `npm run publish` in `tools/course-pipeline`. The command does the mapping,
the validation, the HTTP call and the YAML write-back; this skill owns the order, the gates and
the report. It never edits YAML by hand and never maps content itself.

Spec: `docs/superpowers/specs/2026-09-11-course-publish-endpoint-design.md`.
Command reference: `tools/course-pipeline/README.md`, section "Publikacja na CodeBusters".

Input: a course, module or lesson path (`kursy/<slug>`, `kursy/<slug>/modul-NN-x`,
`kursy/<slug>/modul-NN-x/lekcja-NN-y`) and optionally an environment. Default `staging`.

## Procedure

1. **Entry gate.** Stop with a precise instruction when any of these is missing:
   - the path exists and `typSciezki` would accept it (course, module or lesson);
   - `tools/course-pipeline/.env` has `CODEBUSTERS_<ENV>_URL` and `CODEBUSTERS_<ENV>_SECRET`
     for the chosen environment (check with `grep -c CODEBUSTERS_<ENV>_ tools/course-pipeline/.env`,
     never print the secret);
   - `kurs.yaml` has a non-empty `platformIds.<env>.courseId` (Rafał creates the `Course` in the
     CMS by hand and pastes the id).
2. **Plan.** Run
   `cd tools/course-pipeline && npm run publish -- <path> --env=<env> --dry-run`
   and show the `PLAN` block verbatim: per module `create`/`update` of the `Lesson`, per
   artefact `create` / `update` / `skip (reason)`. Validation errors printed by the command end
   the procedure here; report them verbatim.
3. **GATE: Rafał approves the plan.** Wait for an explicit yes. No answer is not approval. A
   timeout of the question tool is not approval either — say you are waiting and ask again.
4. **Publish.** The same command without `--dry-run`. Show the output verbatim. After `OK`, list
   every created and updated activity with Admin UI links:
   `<CODEBUSTERS_<ENV>_URL>/activities/<id>` and `<CODEBUSTERS_<ENV>_URL>/lessons/<id>`.
5. **Error.** One call, no automatic retry. Show the `BŁĄD …` lines verbatim, say which ids the
   command already wrote to YAML (it prints `zapisano ID: …`), and wait. A retry happens only on
   Rafał's explicit "ponów". For `BŁĄD 409` with an existing activity id: show the id and the
   `lekcja.yaml` path the command printed and ask whether to write it in; do not write it
   unasked.
6. **Prod.** Only when Rafał says "na prod" (or an equally explicit phrase) in this
   conversation. "Wdróż" or "opublikuj" alone means staging. Before a prod run check that every
   lesson in scope has `status.publikacja` equal to `staging` or `prod`
   (`grep -n "publikacja:" <lesson>/lekcja.yaml`); refuse otherwise and say which lesson blocks.
   Then steps 2–4 again with `--env=prod`, including the gate.
7. **Close.** List the changed files (`kurs.yaml`, each `lekcja.yaml`) and propose a
   Conventional Commits message, e.g. `kurs(agenty-ai): modul-00 opublikowany na staging`.
   Rafał commits.

## Rules

- `preview` is for testing the endpoint before it is merged to `main`. Say so when asked to use
  it, and remind that a preview deploy reseeds the database, so ids stored under
  `platformIds.preview` become stale after every deploy.
- No file ever goes to Vimeo from here, no `Course` creation, no deletions — the endpoint cannot
  delete, and the skill does not ask it to. Rafał uploads the recording to Vimeo himself and
  writes its id into `lekcja.yaml`.
- **The video activity has no status gate**: `publish` sends it whenever `lekcja.yaml` carries
  `vimeo: "<numeric id>"`, at position `N*10` — before the article. `status.video` stays a
  production note. So the moment Rafał lets you run the command IS the decision to publish the
  recording; if a lesson row says `video: create` and he did not expect it, stop and ask.
- The video's `totalTime` comes from `video/final.mp4` in the lesson folder, when that file is
  there. It is not in git, so on a fresh clone — and for every tor B lesson assembled by hand —
  the video publishes without a duration. That is allowed, never a reason to block.
- Never edit `platformIds` or `status.publikacja` by hand; the command owns them. The one
  exception is step 5's `409` case, and only after Rafał says yes.
- Never print secrets. `.env` values are checked for presence only.
- Publish validates **only what it sends** — the article, the quiz and the exercises. An
  unfinished video track never blocks it: `[UWAGA: …]` markers in `video/scenariusz.md`, a missing
  deck or konspekt, a stale `plan-nagrania.md` are all out of scope for `publish`. For the full
  lesson check run `npm run validate -- <ścieżka>` separately.
- Republishing a quiz recreates its tasks. Learners' quiz solutions are scored by question
  position, so reordering or removing a question after learners have answered re-scores their
  history. Warn Rafał in the plan step (step 3) whenever a quiz row says `update`.
