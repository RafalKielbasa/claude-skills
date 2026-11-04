# scal-dzien-konczy-sie-na-pr-choc-slowo-znaczy-merge

- **Skill:** ogólny (zasada gałęzi dnia w `CLAUDE.local.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Na „scal” Claude robi push i PR, po czym pyta jeszcze o merge. Kosztuje to jedną turę, gdy Rafał chciał całość.

## Przyczyna źródłowa
Zasada rozdziela dwa kroki: „scal dzień” to push i PR, a merge idzie „na jego słowo”. Samo słowo „scal” znaczy jednak po
polsku merge, więc nie widać, czy jest już tym słowem. Merge przełącza też wspólny folder na `main`, co uzasadnia ostrożność.

## Dowody
- 2026-11-04, sesja 78788d89-0fb4-49f8-86e8-69106f4e6036 (id claude.ai niedostępny): „Przesuń i scal 04-11-2026”. Zrobiłem
  push i PR #862, zatrzymałem się na pytaniu o merge, a Rafał odpisał „tak”. Wpis wątpliwy: jedna obserwacja i koszt jednej
  tury.

## Rozwiązanie
Do rozstrzygnięcia przez Rafała w `CLAUDE.local.md`: albo „scal dzień” obejmuje merge i przełączenie na `main`, gdy PR jest
`MERGEABLE`, albo trigger dostaje inne słowo. Do tego czasu: push i PR, potem jedno pytanie o merge z informacją o innych
sesjach.
