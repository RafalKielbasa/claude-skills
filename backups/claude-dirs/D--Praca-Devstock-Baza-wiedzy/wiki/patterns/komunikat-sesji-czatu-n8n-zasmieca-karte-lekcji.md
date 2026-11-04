# komunikat-sesji-czatu-n8n-zasmieca-karte-lekcji

- **Skill:** kurs-nagrywanie (shot control, lesson card for the "film z kartą lekcji" gate (G5)); tool `tools/nagrywanie`
- **Typ:** porażka
- **Status:** otwarty

## Opis
In every lesson where n8n's chat panel is on screen, the shot control writes the advisory "komunikat aria-live=polite
„Session: …” poza regionem komunikatów" for almost every step. `karta buduj` copies each of these into the "Miejsca
do obejrzenia" table of `video/lesson-card.md`. At the film-with-card gate (G5) Rafał sifts through dozens of
identical lines to reach the few that matter, and the gate turn has to say explicitly that they can be skipped.

## Przyczyna źródłowa
n8n's chat panel keeps an `aria-live=polite` region with the chat session id ("Session: <id>"). The id changes
with every new session. The shot control treats any live region outside the service's declared messages region
as a possible notification and reports each new text. Neither the n8n service nor `karta buduj` knows this text is
a static label, and the card does not deduplicate advisories by kind.

## Dowody
- 2026-11-03, session 8e329826-e681-498d-a1e3-e48dd7c84bc0 (claude.ai id not available; agenty-ai lesson 3.3, #847):
  32 of the 115 lines of `video/lesson-card.md` were this advisory (e.g. "98.253 s (1:38) | 1 (2:2) | uwaga
  doradcza: komunikat - komunikat aria-live=polite „Session: 25ce5...”"). The G5 turn had to add that these do
  not need watching. Cards of the same module show it too: 3.1 has 49 such lines, 3.2 has 8 (count by
  `grep -c "Session:"`).
- 2026-11-04, sesja 83cd4b89-dc72-4c37-aab9-f5b63095719c (kontynuacja 78788d89-0fb4-49f8-86e8-69106f4e6036; id claude.ai niedostępny): recenzent zadania 8 zgłosił to samo na kartach 3.1 i 3.3: powtarzane wiersze aria-live rozmywają to, co Rafał ma ocenić.

## Rozwiązanie
In the n8n service (`kursy/agenty-ai/_nagrywanie/uslugi/n8n.js` or its config), declare the chat session label as a
known static region: the shot control ignores a live region whose text matches `^Session: `. Until that is done,
`karta buduj` folds repeated advisories of one kind into a single line with the count and the step range. The G5
turn says one sentence about the folded line instead of letting it dilute the table.
