---
name: bramka-assignee-przyciski
description: "Karta zadania bez deklaracji przypisania w bramce /daily i /spotkanie ma przyciski z osobami, bo Rafał rozdziela zadania na bieżąco i wypadał z okna pytania, żeby wpisać assignee."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4e6952d2-b96c-45df-b516-d881742595de
  modified: 2026-11-05T19:49:55.202Z
---

Na karcie zadania `new`, którego przypisanie nie wynika z deklaracji na spotkaniu, dawaj przyciski „Akceptuj, <osoba A>”, „Akceptuj, <osoba B>”, „Akceptuj bez assignee”, „Odrzuć”, z rekomendowaną osobą na pierwszym miejscu. Dotyczy też przypisania z macierzy, nie tylko `assignee: null`. To odchylenie od układu „Akceptuj · Odrzuć” z `docs/spotkania-kolejki.md`.

**Why:** 2026-11-05 przy spotkaniu 2026-11-04 21:00 Rafał na samych „Akceptuj · Odrzuć” trzy razy z rzędu wybrał „wyjaśnij” (zadania 1, 4, 5, potem 6), żeby podać assignee, także zmieniając przypisanie z macierzy. Po dodaniu przycisków kolejne karty szły bez wychodzenia z okna, a on wybierał różne osoby i czasem „bez assignee”.

**How to apply:** osoby na przyciskach dobieraj z podobszaru macierzy w `docs/ticket-conventions.md`, a rekomendację z tego, co przypisał już w tej bramce (w tej rozmowie ekrany aplikacji mobilnej i quiz: Szymon, landing: on sam). Przycisk to nadal jego decyzja; karty z deklaracją na spotkaniu i komentarze w istniejącym issue zostają bez przycisków z osobami. Powiązane: [[bramka-punkt-po-punkcie]], [[karta-bramki-w-pytaniu]].
