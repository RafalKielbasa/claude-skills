# pelny-suite-nagrywanie-dwa-naraz-zawiesza-sie

- **Skill:** ogólny (`tools/nagrywanie`, testy; dotyka kurs-nagrywanie przy zmianach silnika)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dwa pełne `vitest run` w `tools/nagrywanie` uruchomione w tle w tym samym czasie przestały robić postęp:
procesy żyły, CPU było bezczynne, a wynik nie przychodził. Pojedynczy przebieg tego samego zestawu przeszedł,
ale trwał około 44 minut, więc zawieszenie kosztuje dużo czasu, zanim ktoś je zauważy.

## Przyczyna źródłowa
Nieustalona. Zakładam rywalizację o wspólny zasób testów z Chrome (profil przeglądarki, pliki
kolejki stanowiska albo blokady) zamiast o CPU, bo bezczynny procesor wskazuje na czekanie, a nie na obciążenie.
Grep po `tools/nagrywanie/{src,test}` nie znalazł stałych portów. Pełny zestaw jest długi (85 plików, testy z
Chrome), więc drugi przebieg łatwo odpalić, zanim pierwszy się skończy.

## Dowody
- 2026-10-27, sesja 520bd4df-d397-46bb-a9d4-6bab0ba6c1fb (id claude.ai niedostępny; zmiany silnika pod lekcję
  agenty-ai 2.3). Według podsumowania sesji dwa równoległe przebiegi zawisły przy bezczynnym CPU i oba
  zatrzymałem `TaskStop`. Potem jeden przebieg z `--reporter=dot` do pliku logu: „Test Files 85 passed | 1
  skipped (86); Tests 1016 passed | 5 skipped (1021)”, 2628 s.
- 2026-11-02, sesja 5a729830-7014-4847-af44-dd79cd5db98c (id claude.ai niedostępny; opcja lekcji `tidy_up`,
  #783).
  - Pierwsze uruchomienie poszło wbrew rozwiązaniu tej strony: na pierwszym planie, `timeout 590 npx vitest
    run 2>&1 | tail -40`. Po 10 minutach dało pustą linię `RUN` bez podsumowania i kod 0 od `tail`.
  - Drugie zgodnie z rozwiązaniem: w tle, `--reporter=dot`, do pliku w katalogu tymczasowym sesji. Wynik:
    „Test Files 94 passed | 1 skipped (95)”, „Tests 1160 passed | 4 skipped (1164)”, 2520 s, bez zawieszenia.
  - Wniosek: reguła stoi tylko w wiki, a w chwili odpalania testów nikt jej nie czyta. Kosztowało to
    10 minut.
  - Maskowanie kodu wyjścia przez `| tail` opisuje wzorzec globalny `potok-z-tail-maskuje-ubity-proces`.

## Rozwiązanie
W `tools/nagrywanie` uruchamiaj naraz najwyżej jeden pełny `vitest run`: w tle, z `--reporter=dot`, z wyjściem do
pliku logu w katalogu tymczasowym sesji. Przed startem sprawdź, czy nie biegnie już inny (procesy `node`
z `vitest` w linii komend). W trakcie pracy uruchamiaj tylko pliki testów, których dotyczy zmiana. Gdy log nie
rośnie przez kilka minut przy bezczynnym CPU, uznaj przebieg za zawieszony, zamiast czekać na limit.
Pełny zestaw trwa 40–45 minut (2520–2628 s), więc nigdy nie uruchamiaj go na pierwszym planie: limit narzędzia
to 600 s. Kandydat na stałe miejsce reguły: sekcja testów w `tools/nagrywanie/README.md` albo skill
`kurs-nagrywanie` (zmiany silnika), bo wiki nie jest czytane przed komendą testów.
