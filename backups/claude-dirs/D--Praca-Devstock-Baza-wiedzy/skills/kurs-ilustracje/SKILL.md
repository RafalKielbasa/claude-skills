---
name: kurs-ilustracje
description: 'Backfill of article illustrations into one lesson whose content is already approved (`status.tresc: zatwierdzona`) — writes the orders, inserts only image and caption lines into artykul.md, produces boards, model images and screenshots from the recorded takes, runs the screenshot privacy review and stops at a per-lesson gate; on Rafał''s OK sends the lesson to staging and commits. Use when Rafał says "uzupełnij ilustracje", "dodaj grafiki do lekcji …", "ilustracje do zatwierdzonych lekcji", "następna lekcja do ilustracji". NOT for a new lesson or one still in review (that is /kurs-lekcja, which places illustrations while writing), and never prod (that is /kurs-publikuj).'
---

# /kurs-ilustracje — illustrations for an approved lesson (backfill)

Approved lessons written before the illustration tool have no images. This skill adds them without
rewriting a word of approved prose: only image lines, caption lines and the blank lines around them change in
`artykul.md`. Spec: `docs/superpowers/specs/2026-11-12-article-illustrations-automation-design.md`, section 7.8.
Reference for choice rules, the order schema, commands and messages: `.claude/skills/kurs-lekcja/ilustracje.md`
— read it whole before the first order.

Talk to Rafał in Polish; this file is in English because new skills are. Order texts are Polish; paths and the
CLI's `OK:` / `BŁĄD:` lines stay as printed. All commands run from `tools/course-pipeline`, `<lekcja>` is
`../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.

## Which lesson

- **One lesson per run.** The next lesson starts only in a new run, after the previous one's gate.
- **Order:** `agenty-ai` module 0, then 1, 2, 3, then lesson 4.1 (`modul-04-inzynier-pair-programming/lekcja-01-przeplyw-to-json`).
- **Pick, without a path from Rafał:**
  1. First a started, unfinished lesson: walk the order and, for each lesson that has `artykul-grafiki/zrodla/`,
     run `git status --porcelain -- kursy/<slug>/<modul>/<lekcja>/artykul.md kursy/<slug>/<modul>/<lekcja>/artykul-grafiki`
     and `git log --oneline -1 -- kursy/<slug>/<modul>/<lekcja>/artykul-grafiki/zrodla`. Any output of the first
     (uncommitted orders, PNGs or an `artykul.md` changed by `wstaw`), or no commit from the second, means its
     backfill never passed the gate: resume that lesson (re-runs skip what is done) and start no other.
  2. Only when there is none: the first lesson in the order with `status.tresc: zatwierdzona` and no
     `artykul-grafiki/zrodla/`.
  A path Rafał names wins (say so when another lesson is started and unfinished); a lesson he names that is
  already started is resumed, not redone.
- **Entry gate:** `status.tresc` must be `zatwierdzona`; otherwise stop and point to `/kurs-lekcja`.
- **What the lesson gets:**

| Lesson | Kinds |
|---|---|
| `demo`, montaged, every take of `video/montaz/zrodla.json` (`nagrania[].sciezka`) on disk | boards, model images, screenshots made straight away |
| `demo`, a take of `zrodla.json` missing on disk | boards and model images only; the gate names the missing take |
| `prezentacja` (`agenty-ai`: `agent-vs-automatyzacja`, `uczciwosc-rodo`, `granice-mocy`) | boards and model images only |
| approved, not recorded (no `video/montaz/`, e.g. 4.1) | boards, model images, screenshot placeholders (`pending`) |

## Procedure

1. **Read** `artykul.md`, `video/scenariusz.md`, `video/konspekt-nagrania.md` (demo), `lekcja.yaml` and the
   `illustrations` block of `kurs.yaml` (model image limit), all in full.
2. **Orders.** Place illustrations by the choice rules of `ilustracje.md` and write one order per image into
   `artykul-grafiki/zrodla/NN-slug.yaml`, `NN` in article order. Every order has `alt` and `caption` (`wstaw` needs
   both; caption without the `**Ilustracja N.**` prefix, a full sentence ending with a period). Every Polish field
   has U+00A0 after one-letter words (`a i o u w z`) — there is no later pass in this skill. Screenshot orders (only
   where the table above allows them) get `screen` and a `konspekt` quote of exactly one konspekt step.
   **Anchor** on a sentence of a plain paragraph, quoted from the article: never inside a list, a table, a
   blockquote (the `> 🎬 **Też w wideo**` callout included), a heading or a code block — an image inserted after a
   list item splits the list. The anchor must match exactly one paragraph.
   Then `npm run validate -- <lekcja>`: fix every error in the orders. The warning `zamówienie bez linii obrazka`
   is expected until step 4.
3. **Dry runs and consent, once per run.** `npm run ilustracje -- wstaw <lekcja> --dry-run` prints each image and
   caption line and the paragraph it goes under: check every placement. A refusal (anchor not found or found
   twice, `wstawienie zmieniłoby zatwierdzony tekst`) means: fix the order's anchor, never the article.
   `npm run ilustracje -- <lekcja> --dry-run` gives `wywołania modelu: N` and the cost line `koszt: …`. Ask Rafał
   once for the paid calls of this run: that cost line plus, when the lesson gets screenshots, the privacy review
   (Gemini, a few cents, one call). Wait for his answer; no answer and a timeout are not consent, and without
   consent the run stops here with `artykul.md` untouched. "Bez przeglądu zrzutów" skips the paid call of step 6;
   the stills are then unreviewed (step 6).
4. **Insert:** `npm run ilustracje -- wstaw <lekcja>`, which prints `OK: wstawiono <n> grafik`.
5. **Produce.** `npm run ilustracje -- <lekcja>`: every image at once, screenshots straight from the takes in
   `video/montaz/zrodla.json`. On a failure follow the table "Failures" of `ilustracje.md`: a model image that
   failed 3 attempts or a screenshot whose step cannot be resolved becomes a proposed board (same name, same image
   line), and the gate says so.
6. **Privacy** (only when real screenshots were made; rules and the rectangle steps: section "Privacy review" of
   `ilustracje.md`). The tool blurs only what the film blurred plus the order's `screenshot.blur`; it detects no
   address. Open every still yourself first: any e-mail address, the course account included, gets a
   `screenshot.blur` rectangle in recording pixels (or another `crop`), then
   `npm run ilustracje -- <lekcja> --tylko <nazwa>` and a look at the new PNG. Then
   `npm run ilustracje -- prywatnosc <lekcja>`, report `review-zrzutow.md` in the lesson folder. A `BŁĄD` blocks
   that screenshot until it is fixed the same way (then `prywatnosc` again); an e-mail address is always fixed,
   never accepted. Any other finding may instead be accepted by Rafał explicitly at the gate; only then write
   `privacyAccepted`, and then run `npm run ilustracje -- prywatnosc <lekcja>` again before the commit: the PNG is
   unchanged since its review, so there is no model call; the run prints `OSTRZEŻENIE` for that screenshot and
   rewrites `review-zrzutow.md` with `zaakceptowany: tak`. Without the review the stills are unreviewed: they reach
   staging only after Rafał has looked at each PNG and said so explicitly, or after the review runs. Prod
   (`/kurs-publikuj`) refuses every screenshot whose current PNG has neither a review with verdict `ok` nor
   Rafał's acceptance of that PNG (`privacyAccepted` with its sha256), so an unreviewed still needs one of them
   before prod.
7. **Validate:** `npm run validate -- <lekcja>`, zero errors; read every warning.
8. **GATE per lesson.** Show:
   - the article diff, `git diff -- <path of artykul.md>`, verbatim: image and caption lines only; anything else
     means the run broke the rule — stop and say so;
   - a table `nr | rodzaj | powód | plik | prywatność`: kind, `reason`, the full PNG path, the privacy verdict of
     a screenshot (`nieprzejrzany` without the review, `-` for the rest); placeholders marked; for unreviewed
     stills ask Rafał to look at each PNG and quote his answer in the gate report; next to a screenshot's kind the
     recorded step it shows (`produced.via` of its order, also printed in its `OK:` line, e.g.
     `konspekt "…" → plan 6 → automat 7`);
   - the cost line, every image turned into a proposed board, a missing take, a course without `illustrations`;
   - that `status.tresc` stays `zatwierdzona`.
   Wait for Rafał's explicit answer. A remark on an image changes its order, then
   `npm run ilustracje -- <lekcja> --tylko <nazwa>` (a new model picture of an unchanged order only on his request:
   `npm run ilustracje -- <lekcja> --nowa-wersja <nazwa>`). A remark on `alt` or `caption` changes the order and the
   same line in `artykul.md` (`wstaw` never touches an image already referenced). Removing an image: delete its
   order, PNG, image line and caption line, then `npm run ilustracje -- wstaw <lekcja>` renumbers the captions.
9. **After Rafał's OK:**
   - staging send by the section "Wysyłka na staging (wołają ją inne skille)" of
     `.claude/skills/kurs-publikuj/SKILL.md` (read it; do not call `/kurs-publikuj`); a lesson with placeholders
     goes to staging as it is; a still with an unresolved `BŁĄD`, or unreviewed without Rafał's explicit words
     about each PNG, holds the send until it is resolved;
   - commit: `git branch --show-current` first; commit only on the day branch `rafal-kielbasa/DD-MM-YYYY` by the
     rule of `CLAUDE.local.md` ("Gałąź dnia"); any other branch: stop and ask. `git add --` for untracked paths
     only, then
     `git commit -m "kurs(<slug>): lesson <M.L> article illustrations (backfill)" -- <paths>` with the lesson's
     `artykul.md`, `artykul-grafiki/`, `review-zrzutow.md` and the `lekcja.yaml` / `kurs.yaml` the staging send
     changed. A `privacyAccepted` written at the gate is in `review-zrzutow.md` only after `prywatnosc` ran again
     (step 6); run it before the commit. A path with changes this run did not make is left out and named. Never
     `--amend`, never push. Report the hash and the branch.

## Rules

- `status.tresc` never changes; the approved prose never changes. Only `wstaw` writes `artykul.md`, except a
  remark on an image or caption line at the gate.
- Never prod. Prod goes only through `/kurs-publikuj` on Rafał's "na prod"; it refuses an article with a
  placeholder or with a screenshot whose current PNG has neither a review `ok` nor Rafał's acceptance (also with
  `--only=article`). Module-2 lessons already on prod reach it again only that way.
- No loop on paid calls: re-runs skip unchanged orders; a failing model image stops after 3 attempts.
- A screenshot never comes from another frame or step than its order resolves to; when it cannot, propose a board.
- No still shows an e-mail address, the course account included; `privacyAccepted` never covers one.
