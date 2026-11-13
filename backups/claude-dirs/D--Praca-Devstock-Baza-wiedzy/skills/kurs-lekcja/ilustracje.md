# Article illustrations — reference

Read by `/kurs-lekcja` (steps 3a, 3d, 3f, 3g, 7), `/kurs-video` (screenshots before the film gate) and
`/kurs-ilustracje` (backfill). Spec: `docs/superpowers/specs/2026-11-12-article-illustrations-automation-design.md`
(sections 5, 5.1, 7.2–7.8). The tool lives in `tools/course-pipeline` (`src/illustrations/`); nothing is drawn or
exported by hand.

## Choosing the kind

Rafał's choice rules (spec 5, "Choice rules"), applied with judgement:

| Kind | When | Never |
|---|---|---|
| `screenshot` | the paragraph describes a concrete screen of the tool and the lesson (`typ_video: demo`) has a konspekt step that shows it | in a `prezentacja` lesson (`npm run validate` fails it); for a screen the konspekt does not show |
| `board` | the content is structure with text: steps, a comparison, a flow or list, a labelled diagram; optionally a model image in its slot (`board.image`, shape `steps` only) | as decoration |
| `model` | a scene, metaphor or mood without text | with text the learner must read: text goes on a board, never into a model image |

- **Model images:** at most `illustrations.modelImagesPerArticle` of `kurs.yaml` per article (`agenty-ai`: 1). It is
  a maximum, not a target: place fewer when no scene fits. Only standalone `kind: model` orders count; a model image
  in a board's slot is part of the board. A course without the `illustrations` block gets no model image at all,
  standalone or in a slot; say so at the gate.
- **Boards and screenshots:** as many as the article's teaching needs, no target number. Each gives the learner a
  concrete gain (a structure to remember, a screen to recognise, a comparison to hold), and its `reason` names that
  gain. A board or screenshot that does not help its paragraph is worse than none.
- **`reason`:** one Polish sentence, shown at the gate: what the learner gains and why this kind.

## Files

| Path (in the lesson folder) | What | Who writes it |
|---|---|---|
| `artykul.md` | `![alt](artykul-grafiki/NN-slug.png)` on its own line, a blank line before and after | the agent (new lesson) or `wstaw` (backfill) |
| `artykul-grafiki/zrodla/NN-slug.yaml` | the order; same name as the PNG | the agent; `produced:` only by the tool |
| `artykul-grafiki/NN-slug.png` | the image, or the placeholder of a pending screenshot | the tool |
| `artykul-grafiki/zrodla/NN-slug-slot.png`, `-slot.json` | the slot image of a board and its hash | the tool |
| `review-zrzutow.md` | the privacy review report, with each screenshot's sha256 | `prywatnosc` |

`NN` is the position in the article (`01`, `02`, …), `slug` kebab-case ASCII. Captions (`**Ilustracja N.** …`) are
written by `/kurs-redakcja` in a new lesson and by `wstaw` in a backfilled one; the order's `caption` feeds `wstaw`
only.

## Order v2

Common keys:

| Key | Required | Content |
|---|---|---|
| `version` | yes | `2` |
| `kind` | yes | `board`, `model` or `screenshot` |
| `reason` | yes | Polish sentence: the gain and why this kind |
| `anchor` | yes | the sentence of the paragraph the image stands under, quoted from the article (whitespace and U+00A0 may differ) |
| `alt` | for `wstaw` | Polish alt text; in a new lesson the alt lives in the image line, so the order may leave it out |
| `caption` | for `wstaw` | Polish caption, a full sentence ending with a period, without `**Ilustracja N.**` (the tool adds and numbers it) |
| `privacyAccepted` | no, screenshot only | `{ hash: <64-hex sha256 printed by prywatnosc>, note: "<RRRR-MM-DD>: <słowa Rafała>" }`, written only on Rafał's explicit acceptance of a privacy finding; a re-rendered PNG has another sha256 and needs a new acceptance |
| `produced` | never by hand | written by the tool: hash, renderer, model, take, second, `pending: true` on a placeholder, `privacy` verdict |

Kind blocks:

- **`board`:** `shape` `steps` | `comparison` | `flow`; `title`; `steps` and `flow`: `items`, 2–6 lines; `comparison`:
  `columns`, exactly 2, each `{ title, items }`; `image: { prompt }` only with `steps` (English prompt of the slot
  image). The board renders in the theme named by `motyw` of `video/plansze.yaml` or `video/prezentacja.yaml`; a lesson
  with neither file gets no board.
- **`model`:** `prompt` in English, describing the scene only. The tool adds the course style references and the
  no-text and no-frame rules.
- **`screenshot`:** rectangles are in recording pixels (the take's frame, 1920×1080 in `agenty-ai`).
  - `screen` (required, Polish): what the screen shows; written at step 3a and printed on the placeholder board;
  - `konspekt`: a verbatim fragment of exactly one konspekt step, written after step 3d; it survives renumbering of
    the konspekt; `npm run validate` fails a quote that matches no step or several (it names them);
  - `step`: automat step number of `znaczniki.json`, overrides `konspekt`; only when the tool asks for it;
  - `source`: index of the take in `video/montaz/zrodla.json`; resolved automatically, set only when the tool asks;
  - `moment`: `action` (default with default frames: right after the framed action) or `end` (default with own
    frames: the end of the step);
  - `crop`: `film` (default: what the film showed at that moment), `full`, or `{ x, y, w, h }`;
  - `frames`: `elements` (default: the box of the element the step's action touched) or a list of `{ x, y, w, h }`;
  - `labels`: `[{ text, frame, side }]`, `frame` the index in `frames`, `side` `left` | `right` | `top` | `bottom`;
  - `blur`: extra `{ x, y, w, h }` blurred on top of every blur of `video/montaz/edl.json` that covers the moment.

**Typography:** every Polish text field (`reason`, `anchor`, `screen`, `alt`, `caption`, board texts, labels,
`privacyAccepted.note`) gets U+00A0 after one-letter words (`a i o u w z`), like the article. `npm run validate`
fails `screen`, `alt`, `caption`, board texts and labels without it. Prompts are English and exempt. The examples
below avoid one-letter words so they can be copied as they are.

### Examples

```yaml
version: 2
kind: board
reason: Trzy części agenta mają nazwy do zapamiętania, więc plansza tekstowa; obrazek slotu daje jej klimat kursu.
anchor: Dziś budujemy sam szkielet pracownika.
board:
  shape: steps
  title: Trzy klocki Bibliotekarza
  items:
    - "Czat - usta: tu klient zadaje pytanie"
    - "Model Claude - głowa: tu powstaje odpowiedź"
    - "Pamięć - notes: agent pamięta rozmowę"
  image:
    prompt: >-
      A friendly digital librarian character at a small desk, built from three clearly separate parts:
      a speech bubble window as its mouth, a glowing processor head as its brain, a small open notebook
      as its short-term memory. One clear focal point, readable at a small size.
```

```yaml
version: 2
kind: model
reason: Scena bez tekstu, która oswaja metaforę pracownika (usta, głowa, notes), więc obraz modelu.
anchor: Bibliotekarz dostanie czat (usta), model (głowę) oraz pamięć krótkotrwałą.
model:
  prompt: >-
    A friendly digital librarian character made of three clearly separate parts working together: a speech
    bubble window as its mouth, a glowing processor head as its brain, a small open notebook as its memory.
    An empty bookshelf next to it. Wide landscape composition, one clear focal point.
```

```yaml
version: 2
kind: screenshot
reason: Kursant ma rozpoznać ten ekran na własnym koncie, więc zrzut nagrania.
anchor: Na dole ekranu pojawia się przycisk "Open Chat".
alt: Kanwa n8n, węzeł czatu, przycisk Open Chat na dole ekranu.
caption: Wyzwalacz czatu oraz przycisk, który otwiera czat testowy.
screenshot:
  screen: Kanwa n8n, jeden węzeł czatu, przycisk Open Chat na dole.
  konspekt: Dodaj wyzwalacz czatu
  frames:
    - { x: 916, y: 488, w: 96, h: 96 }
    - { x: 998, y: 991, w: 124, h: 36 }
  labels:
    - { text: Wyzwalacz czatu, frame: 0, side: right }
    - { text: Tu otworzysz czat testowy, frame: 1, side: left }
```

## Commands

From `tools/course-pipeline`; `<lekcja>` is `../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.

| Command | What it does |
|---|---|
| `npm run ilustracje -- <lekcja> --dry-run` | per order `<nazwa>: <kind> → do zrobienia` or `pominięta`, then `wywołania modelu: N` and the cost line `koszt: …`; no network call |
| `npm run ilustracje -- <lekcja>` | the real run: model images (paid), boards, screenshots, placeholders; prints the cost line before the first paid call; `OK:` / `POMINIĘTO: <nazwa> (bez zmian)` / `BŁĄD:` per order; an unchanged order makes no model call and keeps its PNG byte-identical |
| `npm run ilustracje -- <lekcja> --tylko <nazwa>` | one order (`<nazwa>` = file name without `.yaml`), e.g. after a remark changed it |
| `npm run ilustracje -- <lekcja> --nowa-wersja <nazwa>` | a new picture for an unchanged model order or slot image (paid); only on Rafał's request — a changed prompt regenerates without it |
| `npm run ilustracje -- <lekcja> --rodzaj screenshot` | screenshots only (also `board`, `model`); ffmpeg and Chrome, no paid call |
| `npm run ilustracje -- prywatnosc <lekcja>` | privacy review of every produced screenshot whose PNG changed since its last review: one Gemini call (a few cents), report `review-zrzutow.md`; `--dry-run` lists what would go, no call |
| `npm run ilustracje -- wstaw <lekcja>` | backfill only: inserts the image and caption lines of every order not yet referenced, renumbers captions; `--dry-run` prints the lines |
| `npm run validate -- <lekcja>` | checks the orders: schema, typography, model-image limit, no screenshot in `prezentacja`, konspekt quote matching exactly one step; warns about an order without an image line and an image without an order |

## Placeholders and screenshot production

- Until the lesson is montaged (`video/montaz/zrodla.json` and `edl.json`), a screenshot order produces a
  placeholder board ("Zrzut ekranu pojawi się po nagraniu" plus `screen`), marked `produced.pending: true`.
  Validation and the staging send pass it; the prod publish refuses it.
- After the montage, `--rodzaj screenshot` replaces placeholders with frames of the takes in `zrodla.json`, at a moment
  the film showed, with the film's blurs. A still blurs every e-mail address, the course account included.
- A step that cannot be resolved (no take, step missing, no markers, the film did not show the step, a popup source
  without its own markers) fails with `BŁĄD:` and the reason. Propose a board in its place; never pick another frame
  or another step.

## Privacy review

`prywatnosc` prints per screenshot `OK:`, `POMINIĘTO:` (pending, or unchanged since the last review),
`OSTRZEŻENIE:` (finding accepted for this PNG) or `BŁĄD:` (finding without acceptance, or an invalid order); exit 1
on any `BŁĄD`. A `BŁĄD` blocks that screenshot until it is fixed (a `blur` rectangle or another `crop` in the order,
then `--tylko <nazwa>` and `prywatnosc` again) or Rafał accepts the finding explicitly; then write `privacyAccepted`
with the sha256 the `BŁĄD` line printed, the date and his words. Never write it without his words.

## Failures

| Message | What to do |
|---|---|
| `model nie zwrócił obrazu po 3 próbach` | no loop: propose a board in its place (same name and image line, `kind: board`, `--tylko <nazwa>`) and say so at the gate |
| `spending cap`, `Brak GEMINI_API_KEY` | stop, tell Rafał; no retry |
| `BŁĄD: plansza "…": …` (text overflows or too small) | shorten the text or change the shape; never edit the theme |
| `lekcja bez motywu` | the lesson has neither `video/plansze.yaml` nor `video/prezentacja.yaml`; boards wait for one |
| `zamówienie zrzutu nie wskazuje kroku` | add `konspekt` |
| `samodzielnych obrazów modelu …` | too many standalone model orders for the course limit: turn one into a board or drop it |
