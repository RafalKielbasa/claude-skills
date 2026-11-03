# potok-z-tail-maskuje-ubity-proces

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Komenda testów w potoku `timeout N <testy> 2>&1 | tail -K` kończy się kodem 0 także wtedy, gdy `timeout`
zabił testy w połowie. Wynik wygląda na zakończony przebieg. Jedynym śladem porażki jest brak linii
podsumowania („Test Files … passed”).

## Przyczyna źródłowa
Bez `set -o pipefail` kod wyjścia potoku to kod ostatniej komendy, czyli `tail`. Kod 124 z `timeout` albo
kod błędu testów nie wychodzi poza potok. Do tego `tail` pokazuje tylko koniec wyjścia, więc przy ucięciu
widać same nagłówki. Odruch „exit 0 = zielone” daje wtedy fałszywe „testy przechodzą”.

## Dowody
- 2026-11-02, sesja 5a729830-7014-4847-af44-dd79cd5db98c (id claude.ai niedostępny; Baza wiedzy,
  `tools/nagrywanie`).
  - Komenda: `timeout 590 npx vitest run 2>&1 | tail -40`.
  - Wynik po 10 min: sama linia ` RUN  v4.1.11 D:/Praca/Devstock/Baza wiedzy/tools/nagrywanie`, bez
    podsumowania, kod 0.
  - Złapałem to po braku linii `Test Files`, nie po kodzie wyjścia.
  - Drugie uruchomienie: `npx vitest run --reporter=dot > <log> 2>&1; echo "exit $?" >> <log>` w tle.
    Dało podsumowanie i prawdziwy kod 0 po 2520 s.
  - Szczegóły pełnego zestawu: wzorzec repo `pelny-suite-nagrywanie-dwa-naraz-zawiesza-sie`.

## Rozwiązanie
Wynik testów oceniaj po linii podsumowania narzędzia testów, nigdy po kodzie wyjścia potoku z `tail`, `grep`
albo `head`. Kod uruchamiaj tak, żeby był kodem testów: przekierowanie do pliku i `echo "exit $?"` zaraz po
komendzie testów albo `set -o pipefail`. Brak linii podsumowania oznacza przebieg nieukończony, a nie zielony.
Testy dłuższe niż limit narzędzia (600 s) uruchamiaj od razu w tle, bez `timeout`.
