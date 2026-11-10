# paczka-review-wciaga-cudze-commity-galezi-dnia

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Na gałęzi, na którą commitują równolegle inne sesje, `review-package PLAN BASE HEAD` dla zadania obejmuje także cudze commity, które wpadły między BASE a HEAD. Recenzent dostaje diff z obcymi zmianami i ocenia coś, czego zadanie nie robiło.

## Przyczyna źródłowa
Skill zakłada, że między zapisanym BASE a HEAD są wyłącznie commity implementera (izolowany worktree). Repo „Baza wiedzy” ma jedną gałąź dnia we wspólnym folderze (`CLAUDE.local.md`), więc ta przesłanka nie zachodzi; zakres `BASE..HEAD` liczy historię gałęzi, nie autorstwo.

## Dowody
- 2026-10-16, sesja 1506ab90-7988-4231-ab1a-6beb3e2c2db1: zadanie 1 planu `nagrywanie-parallel-lessons` - paczka `eb0651df..cde7166b` miała 3 commity, w tym `a0ed9773` i `16ba0b48` sesji lekcji 1.2 (#695). Kontroler ją skasował i zrobił `16ba0b48..cde7166b` (rodzic pierwszego commita zadania). Paczkę końcowej recenzji (`eb0651df..558ffde9`) trzeba było zbudować ręcznie przez `git diff … -- <ścieżki planu>`, bo na gałęzi były commity kursu agenty-ai.
- 2026-11-04, sesja 83cd4b89-dc72-4c37-aab9-f5b63095719c (kontynuacja 78788d89-0fb4-49f8-86e8-69106f4e6036; id claude.ai niedostępny): na `rafal-kielbasa/03-11-2026` zadania 7, 8 i 9 miały paczki z listy własnych commitów (`git show` po kolei), a przegląd końcowy diff ograniczony ścieżkami planu; cudze `27d24d92` i inne nie trafiły do recenzji. `4ecae9d5` innej sesji wszedł tylko po część z kartą lekcji.
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; Baza wiedzy + code-busters-v2, DT-101 #852): plan 3 na `rafal-kielbasa/10-11-2026`; w zakresie paczki wylądował commit innej sesji
  `e74cadf0`, więc paczka poszła ograniczona ścieżkami planu (`git diff … -- tools/course-pipeline
  .claude/skills/kurs-publikuj`). Tego samego wieczoru `877f4818` (DT-83) innej sesji wszedł między moje commity;
  commit z pathspec zabrał tylko moje 3 pliki.

## Rozwiązanie
W repo z gałęzią współdzieloną przez sesje: przed paczką sprawdź `git log --format=%h BASE..HEAD` wobec commitów zgłoszonych przez implementera. Gdy są cudze - dla zadania z jednym commitem użyj jego rodzica jako BASE; dla wielu commitów albo paczki końcowej zbuduj diff ograniczony ścieżkami planu (`git log/diff BASE..HEAD -- <pliki planu>`) i zapisz ruling w ledgerze.
