# plan-zmian-ui-kodozercow-bez-konsultanta-ux

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan migracji ekranów Kodożerców na nową szatę (`superpowers:writing-plans`) zapisał zmiany wyglądu
i zachowania ekranów jako rozstrzygnięcia planu, bez wywołania `konsultant-ux-kodozercy`. Część
z nich poszła do Rafała jako decyzje M2-D…, część weszła do planu bez decyzji. `CLAUDE.md` repo
wymaga skilla przy każdej ocenie lub zmianie UX/UI Kodożerców. Wpis wątpliwy: zmiany wynikają
z zatwierdzonej biblioteki i z wersji web, więc nie wiadomo, czy konsultant zmieniłby którąś z nich.

## Przyczyna źródłowa
Reguła w `CLAUDE.md` stoi w punkcie o folderze `platforma/`, a opis skilla wyzwalają ocena ekranu,
pomysł albo koncept. Plan implementacyjny w `docs/superpowers/plans/` nie pasuje do żadnego z tych
wyzwalaczy. `writing-plans` (inwentarz zachowań, plan, review codexa) nie ma kroku, który
przekazałby konsultantowi zmianę widoczną dla kursanta. Codex recenzuje plan względem specu, nie
względem bazy ekranów w `platforma/`.

## Dowody
- 2026-10-26, sesja 2be43b78-0126-44ba-97e1-4c5eaa736bf3 (id claude.ai niedostępny), plan M2
  `docs/superpowers/plans/2026-10-26-kodozercy-platform-app-migration-plan-4-m2.md`. Trzy zmiany
  zapisane bez skilla:
  - „Quiz answers lose the A–H letters” (linia 402), uzasadnione zgodnością z quizem web;
  - „old `RadialGlow` decorations go” (linie 214 i 404), a `home-screen.glow.ts` do usunięcia
    (linia 169);
  - wibracja przycisku jako decyzja „Button haptics (M2-D2)” (linia 410).

  Rafał przyjął decyzje M2 jednym „OK”, bez uwag do UI. Obserwacja modelu, użytkownik tego nie
  komentował.
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny; paczka P1 DT-92/DT-93
  wykonywana równolegle przez subagentów), dowód zadziałania rozwiązania: zanim rozdałem zadania, przeszedłem
  listę skillem `konsultant-ux-kodozercy` w pytaniu o tryb. Wynik:
  - poprawki błędów (podwójne marginesy, strzałka wstecz na ekranach błędu, snackbar nad CTA, etykiety
    czytnika) poszły od razu do subagentów;
  - nowy mechanizm (licznik nieprzeczytanych na zakładce Społeczność) dostał najpierw subagenta tylko do
    rozpoznania;
  - wariant licznika rozstrzygnął Rafał w rozmowie głosowej („pigułka w rogu ikony, odświeżanie co 60 s”),
    dopiero potem była zmiana.

  Zasada trafiła do pamięci projektu (`rownolegle-subagenty-paczka-poprawek`).

## Rozwiązanie
W planie albo specu, który zmienia ekran Kodożerców ponad przeniesienie 1:1 na zatwierdzoną
bibliotekę, zbierz takie punkty w jedną listę: usunięty element, zmiana interakcji, nowy stan
albo tekst. Przed bramką decyzji przejdź tę listę skillem `konsultant-ux-kodozercy`: najpierw
lokalizacja ekranu w bazie i aplikacji, potem werdykt. Werdykt wpisz do uzasadnienia decyzji
w planie. Przeniesienie 1:1 nie wymaga konsultanta.
