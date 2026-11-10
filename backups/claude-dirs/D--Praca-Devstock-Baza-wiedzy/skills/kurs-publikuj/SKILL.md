---
name: kurs-publikuj
description: Publikacja zatwierdzonych treści lekcji (artykuł, quiz, ćwiczenia) oraz aktywności wideo z ID Vimeo na PROD platformy CodeBusters przez tools/course-pipeline publish --env=prod, wyłącznie na jawne "na prod". "Opublikuj" i "wdróż" znaczą prod. Staging wypełnia się sam — wysyłają go skille produkcyjne według sekcji "Wysyłka na staging" tego skilla; tu także lista zaległych lekcji na stagingu ("wrzuć zaległe na staging"). NIE dla wgrywania plików na Vimeo (to robi /kurs-video po akceptacji filmu) i NIE dla tworzenia kursu w CMS.
---

# /kurs-publikuj — publish approved lesson content to CodeBusters prod

Thin wrapper around `npm run publish` in `tools/course-pipeline`. The command does the mapping,
the validation, the HTTP call and the YAML write-back; this skill owns the order, the gates and
the report. It never edits YAML by hand and never maps content itself.

Spec: `docs/superpowers/specs/2026-09-11-course-publish-endpoint-design.md`;
staging: `docs/superpowers/specs/2026-11-10-content-deploy-video-activity-design.md`.
Command reference: `tools/course-pipeline/README.md`, section "Publikacja na CodeBusters".

Input: a course, module or lesson path (`kursy/<slug>`, `kursy/<slug>/modul-NN-x`,
`kursy/<slug>/modul-NN-x/lekcja-NN-y`). This skill publishes to prod only. "Opublikuj" and
"wdróż" mean prod, but the run starts only on an explicit "na prod" (or an equally explicit
phrase) in this conversation. A request to put something on staging gets one sentence:
"staging wypełnia się sam, gdy skille produkcyjne kończą lekcję", plus a pointer to the section
"Zaległe na stagingu" below for lessons that did not make it.

## Procedure

1. **Entry gate.** Stop with a precise instruction when any of these is missing:
   - the path exists and `typSciezki` would accept it (course, module or lesson);
   - `tools/course-pipeline/.env` has `CODEBUSTERS_PROD_URL` and `CODEBUSTERS_PROD_SECRET`
     (check with `grep -c CODEBUSTERS_PROD_ tools/course-pipeline/.env`, never print the
     secret);
   - `kurs.yaml` has a non-empty `platformIds.prod.courseId` (Rafał creates the `Course` in the
     CMS by hand and pastes the id).
2. **Plan.** Run
   `cd tools/course-pipeline && npm run publish -- <path> --env=prod --dry-run`
   and show the `PLAN` block verbatim: per module `create`/`update` of the `Lesson`, per
   artefact `create` / `update` / `skip (reason)`. Validation errors printed by the command end
   the procedure here; report them verbatim.
3. **GATE: Rafał approves the plan.** Wait for an explicit yes. No answer is not approval. A
   timeout of the question tool is not approval either — say you are waiting and ask again.
4. **Publish.** The same command without `--dry-run`. Show the output verbatim. After `OK`, list
   every created and updated activity with Admin UI links:
   `<CODEBUSTERS_PROD_URL>/activities/<id>` and `<CODEBUSTERS_PROD_URL>/lessons/<id>`.
5. **Error.** One call, no automatic retry. Show the `BŁĄD …` lines verbatim, say which ids the
   command already wrote to YAML (it prints `zapisano ID: …`), and wait. A retry happens only on
   Rafał's explicit "ponów". For `BŁĄD 409` with an existing activity id: show the id and the
   `lekcja.yaml` path the command printed and ask whether to write it in; do not write it
   unasked.
6. **Close.** List the changed files (`kurs.yaml`, each `lekcja.yaml`) and propose a
   Conventional Commits message, e.g. `kurs(agenty-ai): modul-00 opublikowany na prod`.
   Rafał commits. A prod publish writes `status.publikacja: prod`; the prod gate is the content
   conditions the command checks plus Rafał's approval of the plan in step 3.

## Wysyłka na staging (wołają ją inne skille)

Written once here; `/kurs-lekcja`, `/kurs-zadania`, `/kurs-redakcja`, `/kurs-uwagi` and
`/kurs-video` point at this section at their own moments and do not copy it. The send puts
whatever a lesson has ready on the CodeBusters staging CMS as published activities: the article
and the quiz or exercises already at `do_review`, the video when `lekcja.yaml` has a Vimeo id.

- **Command**, foreground, once, after the calling skill's own validation passed:
  `cd tools/course-pipeline && npm run publish -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --env=staging`
  `--env=staging` is written out even though staging is the command's default. No gate, no
  plan, no Rafał approval: the send is not a gate and never blocks the calling skill.
- **What the turn shows:** one line per created or updated activity, ending in
  ` → <CMS url>/activities/<id>` (the command prints it), or the skip line verbatim:
  `POMINIĘTO: kurs bez Course na stagingu (brak platformIds.staging.courseId)` or
  `POMINIĘTO: brak CODEBUSTERS_STAGING_URL w tools/course-pipeline/.env` (also `_SECRET`).
  A skip exits 0 and is not an error; the skill reports it and continues.
- **Partial result:** every `BŁĄD: …` line (one per distinct message: a quiz with three errors
  prints three, a broken `numer` prints one line for all its elements), then
  `CZĘŚCIOWO: na staging poszło to, co przeszło walidację — pominięte elementy wyżej`, shown
  verbatim with the same command as the retry command (a rerun continues as update). The calling
  skill continues: its gate, its status change and the Vimeo upload stand.
- **Failed module** (the run goes on with the next one):
  `NIEPOWODZENIE: na stagingu nie przeszły moduły: <n> — pozostałe wysłane; ponowne uruchomienie kontynuuje jako update`.
  Show it verbatim with the retry command; the calling skill continues.
- **`BŁĄD 409` naming an existing activity** (the CLI line says "wpisz to id do lekcja.yaml:
  platformIds.staging.activityIds.<key>"): show it verbatim. The id goes into `lekcja.yaml` only
  on Rafał's yes (spec 7.4); the calling skill never writes it on its own. The `zapisano ID: …`
  line of a send is shown too.
- **Stale activity:**
  `NIEAKTUALNE NA STAGINGU: <lesson>/<key> → <url>/activities/<id> — usuń ręcznie w CMS, potem: npm run publish -- zapomnij <ścieżka lekcji> <key>`.
  The same applies to the `409` line `  aktywność zmieniła rodzaj — usuń ją ręcznie w CMS: <url>/activities/<id>, potem: npm run publish -- zapomnij …`.
  Rafał deletes the activity in the CMS. `zapomnij` runs only on his word, after he says it is
  deleted:
  `cd tools/course-pipeline && npm run publish -- zapomnij ../../kursy/<slug>/modul-NN-x/lekcja-NN-y <key>`
  prints `OK: usunięto platformIds.staging.activityIds.<key> (<id>) z lekcja.yaml`, or
  `BŁĄD: lekcja nie ma platformIds.staging.activityIds.<key>` (exit 1). The next send then creates
  the activity afresh.
- **Staging rebuild:** a line starting `ODBUDOWA STAGINGU: …` means a CMS deploy reset staging and
  the send rebuilt it in the same run. Show it to Rafał verbatim; it is not an error and the
  calling skill continues.
- **Never `--env=prod`** from this section or from any skill other than `/kurs-publikuj` after an
  explicit "na prod". A staging send never writes `status.publikacja`; only a prod publish does.
- The command loads `tools/course-pipeline/.env` itself; do not add `--env-file`. Secrets are
  never printed.
- The send writes `platformIds.staging` into `lekcja.yaml` and `kurs.yaml`. The calling skill
  leaves them uncommitted unless its own rule (e.g. the ticketed lesson commit in `/kurs-video`)
  says otherwise.

## Zaległe na stagingu

Lessons whose content was ready before this mechanism existed, or whose send failed and nobody
reran it. Used when Rafał asks to catch up staging ("wrzuć zaległe na staging").

1. List (read-only):
   `cd tools/course-pipeline && npm run publish -- zalegle ../../kursy/<slug>[/modul-NN-x]`
   It prints `ZALEGŁE NA STAGINGU (lekcji: N):` and one line per lesson with what is missing, or
   `OK: brak zaległych na stagingu`, or a `POMINIĘTO:` line (stop, report it). An empty list
   (`OK: …`) is reported as is when Rafał only asked what is overdue. When he asked to refill
   staging, an empty list is not the end: `--wykonaj` still reads staging and rebuilds it after a
   reset (step 3), so continue to step 2.
2. Show the list and **wait for Rafał's "OK"**. No answer, and a question-tool timeout, are not
   approval. Nothing is sent before it, also when the list is empty.
3. Send: the same command with `--wykonaj`. It prints the per-activity lines as in the section
   above and ends with
   `PODSUMOWANIE: lekcji wysłanych <n>, elementów pominiętych <dropped>, nieaktualnych na stagingu <stale>, modułów nieudanych <failed>`.
4. Report with a table: lessons sent | elements skipped | stale on staging | failed modules, the
   numbers from `PODSUMOWANIE`, then every `BŁĄD`, `NIEAKTUALNE NA STAGINGU` and `NIEPOWODZENIE`
   line verbatim. A non-zero exit is a report, not a retry; a retry only on Rafał's "ponów".
5. Commit: list the changed `lekcja.yaml` and `kurs.yaml` files and commit them under the
   repository's rule for this working tree (in "Baza wiedzy": `git commit -m … -- <paths>` on the
   day branch, never push); elsewhere propose the Conventional Commits message and Rafał commits.

## Rules

- `preview` is for testing the endpoint before it is merged to `main`. Say so when asked to use
  it, and remind that a preview deploy reseeds the database, so ids stored under
  `platformIds.preview` become stale after every deploy.
- No file ever goes to Vimeo from here. A staging send may create the `Course` and prune dead ids
  from the YAML files only as the staging rebuild after a reset (spec 7.9); it never deletes
  anything on the CMS — the endpoint cannot delete, and the skill does not ask it to. The recording reaches Vimeo through `/kurs-video`
  (step 6, `npm run vimeo`) in a course with `vimeo.automat: true`, which also writes its id into
  `lekcja.yaml`; in other courses Rafał uploads it himself and writes the id by hand.
- **The video activity has no status gate**: `publish` sends it whenever `lekcja.yaml` carries
  `vimeo: "<numeric id>"`, at position `N*10` — before the article. `status.video` stays a
  production note. So the moment Rafał lets you run the command IS the decision to publish the
  recording; if a lesson row says `video: create` and he did not expect it, stop and ask.
- Course with `oprawa: { znak_ai: true }` in `kurs.yaml`: publish refuses a lesson video whose
  local `video/final.mp4` has no valid AI-mark acceptance (`video/znak-ai/akceptacja.json`: sha256 of the
  file and the mark configuration unchanged) - the fix is a new `/kurs-video` render, never a bypass. A
  missing `final.mp4` on this machine (also after a failed render moved it to the archive) is a refusal too:
  publish the video from the machine that rendered and accepted it.
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
