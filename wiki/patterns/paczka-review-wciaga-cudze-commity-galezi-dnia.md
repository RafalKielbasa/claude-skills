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

## Rozwiązanie
W repo z gałęzią współdzieloną przez sesje: przed paczką sprawdź `git log --format=%h BASE..HEAD` wobec commitów zgłoszonych przez implementera. Gdy są cudze - dla zadania z jednym commitem użyj jego rodzica jako BASE; dla wielu commitów albo paczki końcowej zbuduj diff ograniczony ścieżkami planu (`git log/diff BASE..HEAD -- <pliki planu>`) i zapisz ruling w ledgerze.
