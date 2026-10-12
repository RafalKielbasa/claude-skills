# board-archive-means-board-card-not-close

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rafał asks to "zarchiwizować" an issue; Claude offers closing it (as a duplicate, not planned) as the
recommended option, and Rafał picks archiving the card on the project board instead, with the issue left
open.

## Przyczyna źródłowa
The board-tracker CLI has no archive command and the skill names only one way to take an item off the
board: `close --reason not_planned`. "Zarchiwizuj" is therefore translated into the only removal the
skill knows, although in GitHub Projects it is a separate operation (`gh project item-archive`) that
hides the card and does not touch the issue.

## Dowody
- 2026-10-12, sesja 53ceea80-28c7-4d63-82fc-8e569ddd025e (id claude.ai niedostępny): "Na 355 pracuje
  Wiktor chyba jest na to analogiczny ticket issue jeśli tak zarchiwizuj to". The question offered
  "Zamknij jako duplikat #528" first as the recommendation; Rafał chose "Tylko archiwizuj na tablicy".
  Done outside the CLI: `gh project item-archive 3 --owner devstock-org --id PVTI_lADOER3t584BcXobzg57Lio`,
  confirmed by GraphQL `isArchived: true`, issue `OPEN`.

## Rozwiązanie
"Zarchiwizuj" means archiving the board card: the issue stays open and keeps its assignee. Close only on
"zamknij" (or a ranking "Do zamknięcia?" answered "tak"). Add an `archive --ref <ref>` command to the CLI
that resolves the board item id and runs `gh project item-archive`, and list it in the skill's CLI table.
