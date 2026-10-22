# weryfikacja-zadania-bez-buildu-nie-widzi-granicy-serwer-klient

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan dla aplikacji Next.js App Router daje zadaniom weryfikację TEST, TSC i LINT, a `next build` tylko
w zadaniu bazowym i końcowym. Import, który wciąga moduł kliencki do łańcucha komponentu serwerowego,
przechodzi wtedy przez kilka zadań z zielonymi review i wychodzi dopiero przy buildzie. Ta sama luka
siedzi w nakazach reużycia: plan każe wziąć funkcję z modułu hooka, nie patrząc, co ten moduł importuje.

## Przyczyna źródłowa
Granicę serwer/klient sprawdza tylko bundler Next. Vitest w jsdom i `tsc` widzą typy i funkcje, a nie
graf modułów po stronie serwera, więc import barrela z MUI albo `next-auth/react` w RSC kompiluje się,
a testy z mockami przechodzą. Autor planu i review planu (`codex`) oceniają import jak referencję do
funkcji, nie jak moduł z efektami ubocznymi. Prawdopodobnie dokłada się do tego notatka z pamięci
„build i pełny `tsc` po scaleniu w głównym checkoucie”, która przesuwa build na koniec.

## Dowody
- 2026-10-21/22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny), plan 2
  `kodozercy-platform-public-catalog`: BUILD stoi tylko w zadaniu 1 (baseline) i 12 (pełna weryfikacja).
  Zadania 5 i 6 przeszły z TEST/TSC/LINT, a `next build` padł dopiero w zadaniu 7, bo kod serwerowy
  importował barrel `~/utils`, który ciągnie `@devstock/ui` z MUI do RSC. Ruling: „BUILD is part of every
  remaining task's verification (Tasks 8-11), and server-rendered public-screens code never imports the
  ~/utils barrel”.
- Ta sama sesja, zadanie 2: plan kazał reużyć `planFor` z `usePricing.tsx`; moduł wciągał
  `next-auth/react` i hooki react-query do łańcucha loadera serwerowego („a module-load failure no
  try/catch catches”). Ruling: `offer.ts` wybiera plany sam (MONTH 1 / YEAR 1).

## Rozwiązanie
W planie dla frameworka z granicą serwer/klient w buildzie (Next.js App Router, RSC) każde zadanie,
które dodaje albo zmienia kod renderowany na serwerze, ma `next build` w krokach weryfikacji, nie tylko
zadanie końcowe. Nakaz reużycia funkcji w kodzie serwerowym sprawdź przed zapisaniem planu: otwórz
moduł źródłowy i jego importy (`'use client'`, hooki, biblioteki UI, `next-auth/react`); gdy moduł jest
kliencki, plan każe skopiować logikę albo wydzielić ją do modułu bez zależności klienckich.
