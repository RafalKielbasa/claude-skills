# task-brief-wciaga-zadanie-z-sufiksem-litery

- **Skill:** superpowers:subagent-driven-development (też superpowers:writing-plans)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan dostaje dopisane później zadanie z literą („Task 3a”), a `scripts/task-brief PLAN 3` wycina do briefu
zadania 3 także całe zadanie 3a. Implementer zadania 3 dostaje wymagania dwóch zadań jako jedno i może
zrobić oba naraz, a review zadania nie ma zakresu, z którym porówna diff.

## Przyczyna źródłowa
Skrypt (`skills/subagent-driven-development/scripts/task-brief`) zaczyna zadanie N od nagłówka pasującego do
`^#+[ \t]+Task[ \t]+N([^0-9]|$)`. Litera `a` jest znakiem „nie-cyfrą”, więc „Task 3a” pasuje do zadania 3
i flaga `intask` zostaje włączona aż do następnego nagłówka zadania. Skrypt na koniec podaje tylko liczbę
linii, a nie listę nagłówków, które wyciął, więc z jego wyniku tego nie widać.

## Dowody
- 2026-11-04, sesja e0cd735e-fa23-4ebd-8d25-7d8684be5ab4 (id claude.ai niedostępny; Baza wiedzy, plan
  `content-deploy-vimeo-upload-plan-1`). Po raporcie sond dopisałem do planu „Task 3a”, czyli folder przy
  tworzeniu, limit tytułu i odrzucanie wspólnych domen. Brief zadania 3 zawierał przez to też całe 3a.
  Złapałem to przed dispatchem i ręcznie przyciąłem brief do 98 linii, a 3a poszło osobnym briefem.

## Rozwiązanie
Po każdym `task-brief` sprawdź `grep -n '^#\+ *Task' <brief>`: brief ma mieć dokładnie jeden nagłówek
zadania. Dopisując zadanie do istniejącego planu, nie numeruj go z literą przy numerze, który już
istnieje. Daj mu kolejny wolny numer albo zrób z niego krok istniejącego zadania. W skrypcie warunek
końca liczby powinien wykluczać też litery: `([^0-9A-Za-z]|$)`.
