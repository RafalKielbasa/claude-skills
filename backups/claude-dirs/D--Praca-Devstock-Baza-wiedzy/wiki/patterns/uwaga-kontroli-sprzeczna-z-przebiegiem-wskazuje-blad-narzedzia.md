# uwaga-kontroli-sprzeczna-z-przebiegiem-wskazuje-blad-narzedzia

- **Skill:** kurs-nagrywanie
- **Typ:** sukces
- **Status:** otwarty

## Opis
The take control gave `powtorka` with remarks that the same check did not raise in the reference dry pass. The cause
was a bug in the tool, not in the recording. A comparison of the step data from the pass and the take found it before
another paid attempt, with no change to the lesson.

## Przyczyna źródłowa
The dry pass and the recording write their step markers through different branches of `nagranie.js`. The pass branch
named the step's tab (`naKarcie()`); the recording branch only read the layout. `kontrola-ujecia.js` takes the tab
from the marker. Without it the control falls back to the take's main tab (n8n with `stylNagrania`), so every step on
the Drive or Notion tab got a `styl` remark. Every recording of a lesson with such a tab would fail. The retry rule
("fix, next attempt") does not suggest checking the tool.

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson agenty-ai 3.1, third
  take.
  - Control gave 6 remarks: `styl` in steps 19, 38, 39 and 53, `okno` in 51 and 52.
  - A node dump of `tab`/`layout.styl` for those steps: the pass had `tab: dysk|notion` and `styl: false` with no
    remark; the recording had `tab: undefined`.
  - Fix `5855693f` with tests (1124 passed). `kontrola-ujecia` on the same take left only the two `okno` remarks.

## Rozwiązanie
Before retaking on a `powtorka` with remarks, check whether the same check passed in the reference dry pass
(`przebieg.json`, the same steps). A remark the pass did not raise, on an identical screen, points to the tool: compare
the step fields of the pass and the take (`tab`, `layout`, `dialogi`) and fix the cause before the next attempt.
