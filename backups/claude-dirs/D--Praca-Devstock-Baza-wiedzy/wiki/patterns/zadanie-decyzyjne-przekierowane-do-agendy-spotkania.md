# zadanie-decyzyjne-przekierowane-do-agendy-spotkania

- **Skill:** daily (bramka, karty zadań w `docs/spotkania-kolejki.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kandydat na zadanie, który jest decyzją do podjęcia przez zespół, a nie pracą do wykonania
(np. „ustalić cel liczby nowych kursów na start subskrypcji”), dostaje na karcie tylko „Akceptuj”
i „Odrzuć”. Rafał w „Other” przekierował go do agendy jutrzejszego spotkania planistycznego. Bramka
nie ma takiej opcji, więc odpowiedź poszła poza ramę pytania.

## Przyczyna źródłowa
Bramka zna tylko dwa miejsca docelowe: tablicę (issue albo komentarz) i notatkę (odrzucenie). Nie
wie o najbliższym spotkaniu planistycznym, choć jego agenda leży w repo
(`planning/<data>-agenda.md` albo osobny worktree `baza-wiedzy-spotkanie-<data>`). Daily dzień
przed planowaniem regularnie wytwarza pytania „do rozstrzygnięcia jutro”.

## Dowody
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: przy Zadaniu 4/5 Rafał wpisał „Dopisz to
  do agendy na jutrzejsze spotkanie.” Agenda leżała w worktree
  `D:\Praca\Devstock\baza-wiedzy-spotkanie-2026-10-13` (gałąź `docs/spotkanie-2026-10-13`).
  Dopisałem efekt i punkt kontekstu do punktu 4 „Przepustowość treści a obietnica subskrypcji”
  (commit `07df5022`). Po ponowieniu karty z tą informacją Rafał wybrał „Odrzuć”.

## Rozwiązanie
Przed fazą 4 bramki sprawdzić, czy jest agenda spotkania z datą późniejszą niż daily
(`planning/*-agenda.md`, `git worktree list`). Jeśli jest, kandydat będący decyzją do podjęcia
dostaje trzecią opcję „Do agendy <data>, pkt <n>”. Ta opcja dopisuje punkt kontekstu w pasującym
punkcie agendy, commituje na gałęzi agendy, zapisuje `status: rejected` z komentarzem `#`
(agenda, punkt, commit) i dopisuje w wierszu `## Action items` „dopisane do agendy <data>, punkt <n>”.
