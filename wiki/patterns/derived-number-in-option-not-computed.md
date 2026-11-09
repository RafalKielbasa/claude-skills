# derived-number-in-option-not-computed

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
A gate option states a derived figure (a total, a sum, a new length) that was written while composing the
option text, not computed. The user decides on the wrong figure; the error surfaces only in the
verification after the decision.

## Przyczyna źródłowa
Option descriptions are prose written in one pass, so a sum lands in them as an estimate. The command
that would compute it runs only after the edit, as verification — after the user has already chosen.

## Dowody
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai niedostępny): agenda 13.10, option
  "Osobny punkt 7, 10 min" said "Spotkanie wydłuża się do 125 min"; the points summed to 120, so the true
  total was 130. Rafał chose that option; the post-edit `awk` sum of `## N. … (X min)` printed
  `suma: 130`, the header was set to 130 and the mistake was reported.
- 2026-11-09, sesja 3633cf62-9947-4cd6-8645-95bc257b4e9c (id claude.ai niedostępny; Baza wiedzy, `/sprint` 09.11–15.11): Wiktor's person card offered "Potwierdź — Wiktor 9/4 d ⚠"; the true load was 8,5/4 (3,5 from goal 1 plus 0,5 + 1,5 + 1 + 1 + 1). Loads on every card were summed by hand while writing the preview; the first scripted sum over `sprint.json`, run before the final screen, printed `Wiktor 8.5 / 4` and the mistake was reported in chat. `sprint.json` itself held correct numbers, only the option text was wrong.

## Rozwiązanie
Every derived number shown in a question option (sum, total, difference, new count) is computed with a
command before the question is asked, and the option shows the computed value.
