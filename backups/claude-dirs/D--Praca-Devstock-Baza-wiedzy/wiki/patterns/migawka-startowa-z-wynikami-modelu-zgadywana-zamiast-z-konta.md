# migawka-startowa-z-wynikami-modelu-zgadywana-zamiast-z-konta

- **Skill:** kurs-nagrywanie (step 3, `start_state` of a lesson that continues the previous one)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Some lessons start from the account state the previous lesson left behind, and that state can hold text a model
wrote during the previous lesson's recording. In 3.3 these were the summaries the 3.2 agent wrote into the price-list
sheet. The `start_state` declaration got made-up text "in the style of" those values instead of the values themselves.
The reset writes the declaration onto the account, so it would have overwritten the cells the 3.2 film shows. The
continuity between the two films would be broken without any error.

## Przyczyna źródłowa
A model's output from a previous recording is not in the repo. It exists only on the account. The writer of
`nagrywanie.yaml` worked from the repo (the previous lesson's konspekt and prompts). For the missing values the
writer reconstructed plausible content: the old comment said "3.2's summaries came from Haiku and are not in the
repo: the three below follow 3.2's chain prompt … over the PDF text". `sprawdz` and `proba` do not read the account,
so they cannot catch this. Only `preview-start-state` shows what the reset would change.

## Dowody
- 2026-11-03, session 8e329826-e681-498d-a1e3-e48dd7c84bc0 (claude.ai id not available; agenty-ai lesson 3.3, #847):
  `video/nagrywanie.yaml`, the sheet rows of the price list. The three "ok" summaries (Zielen Hurt, Kwiatuszek,
  Donice Plus) were written by hand from the PDF text and the 3.2 prompt. They differed from the account's cells in
  wording and in row order. Fix in `7c059a37`: values copied from `preview-start-state` (cells A3:C5, in the order
  the 3.2 loop wrote them), so that "3.3 starts from the sheet 3.2's film shows".

## Rozwiązanie
In `start_state`, a value the previous lesson's model or automation produced on the account (summaries, generated
rows, chat answers, file names created by a workflow) is copied from `preview-start-state` of that account, cell by
cell and in the account's order. It is never written from the previous lesson's files. A comment in
`nagrywanie.yaml` names the source and the date of the readout. When the account does not hold the value yet (the
previous lesson is not recorded), the declaration waits; it is not filled with a stand-in.
