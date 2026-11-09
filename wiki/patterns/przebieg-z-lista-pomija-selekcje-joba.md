# przebieg-z-lista-pomija-selekcje-joba

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Napisałem Rafałowi, że na przeglądzie 16.11 liczniki śladu pokażą głównie #791 (17 PR-ów). Opierałem się na przebiegu `card-trail --read-only --cards …#791`. Karta #791 była zamknięta od 06.11, więc job, który bierze otwarte karty, w ogóle jej nie obejmuje. Sprostowałem to dopiero po przebiegu próbnym z tokenem.

## Przyczyna źródłowa
Tryb z jawną listą (`--cards`) pomija krok selekcji, który wykonuje prawdziwy job (otwarte issues na tablicy). Wynik takiego przebiegu mówi, co job zrobi z daną kartą, a nie czy w ogóle ją weźmie.

## Dowody
- 2026-11-09, sesja f83b042b-5c80-43ff-8320-902beeeba944 (id claude.ai niedostępny; Baza wiedzy, DT-134 #910): `trail-791.json` z przebiegu z `--cards` dał `prs 17`. Pełny przebieg tylko do odczytu objął 115 kart bez #791. `gh issue view 791` zwrócił `CLOSED`, `closedAt 2026-11-06T09:50:34Z`.

## Rozwiązanie
Twierdzenie o tym, co obejmie zaplanowany job, opieraj na przebiegu z jego własną selekcją, bez listy podanej ręcznie. Przebieg z listą sprawdza tylko, co job zrobi z konkretnym elementem; przy takim wyniku pisz to wprost.
