# przyspieszenia-automatu-poza-zasiegiem-pauz

- **Skill:** kurs-montaz (also kurs-lekcja)
- **Typ:** porażka
- **Status:** otwarty

## Opis
The EDL from an automated recording came out with 20 paragraphs above 1.25×. Pauses at the "cięcie pauzy" points
brought 13 of them down. Seven were left at 1.68–5.44×, because their narration has one or two sentences while the
action runs 20–48 s (adding a node with a credential, renaming and pasting a description).

## Przyczyna źródłowa
- A pause can only go between sentences and is at most 4 s, so a paragraph with one or two sentences takes at most
  0–8 s of extra time.
- The script describes a configuration step in a single sentence ("Przemianowuję na … i dopisuję opis. Ciach."), and
  the automation clicks through it at natural speed.
- `npm run montaz` has no command that plans pauses. In a ticket lesson the session writes such a planner ad hoc
  (`pauzy.mjs` in the scratchpad), and the planner spreads the pauses evenly, without checking which sentence
  introduces which action (see `pauza-przed-zdaniem-akcji-puszcza-obraz-przed-narracje`).

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson agenty-ai 3.1.
  - `edl` printed 20 warnings, worst 7:4 at 6.42× and 7:7 at 5.44×.
  - After the pauses `sprawdz` reported "ostrzeżeń: 7" (2:3, 5:2, 6:2, 6:4, 7:4, 7:7, 7:9). They reached the card
    through `buduj`, and Rafał accepted the film.

## Rozwiązanie
- In `tools/course-pipeline`: a command that proposes `pauzy` from `zdania` and `edl` (cut points, limit 4 s), placing
  each pause after the sentence that introduces the action.
- In `/kurs-lekcja`, when writing the narration of a demo lesson with an automation: a paragraph with a configuration
  action of several clicks gets as many sentences as there are stages of the action (each a pause point), not one
  summary.
