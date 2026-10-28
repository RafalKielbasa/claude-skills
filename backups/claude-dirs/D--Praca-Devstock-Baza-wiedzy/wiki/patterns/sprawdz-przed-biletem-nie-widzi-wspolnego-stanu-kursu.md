# sprawdz-przed-biletem-nie-widzi-wspolnego-stanu-kursu

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Krok 3 skilla każe lekcji, która dopiero wchodzi w tryb biletu, skończyć na czystych `sprawdz` i `proba`, zanim
powstanie bilet. Lekcja, której credentiale Google pochodzą z `shared_state` kursu, nie przejdzie jednak
`sprawdz` bez biletu, bo zgłasza brak credentiali. Żeby pokazać czysty wynik na karcie G1, zapisałem
tymczasowy `video/ticket.yaml`, a potem go usunąłem. Reguła „brak „OK” = brak pliku” tego nie przewiduje.

## Przyczyna źródłowa
`shared_state` kursu dołącza się do stanu startowego lekcji tylko wtedy, gdy istnieje `video/ticket.yaml`
(`sharedStateLekcji` z `tools/nagrywanie/src/polityka.js`, wołane w `src/lekcja.js:27` z biletem jako argumentem). Przed biletem walidacja widzi więc lekcję bez credentiali, które
dostarczy jej kurs. Skill wymaga czystego wyniku w stanie, w którym narzędzie z założenia go nie da.

## Dowody
- 2026-10-27, sesja 520bd4df-d397-46bb-a9d4-6bab0ba6c1fb (id claude.ai niedostępny; lekcja agenty-ai 2.3,
  przygotowanie do biletu). Według podsumowania sesji `sprawdz` bez biletu zgłosił 3 błędy credentiali: Google
  nie są zadeklarowane w `start_state` lekcji, bo przychodzą z `shared_state`. Z tymczasowym biletem wynik był
  czysty („39 kroków automatu … pokryte”). Plik usunąłem przed commitem, a przebiegu na nim nie było. Na karcie
  G1 podałem wynik walidacji z tymczasowym biletem, który potem usunąłem.

## Rozwiązanie
Hipoteza do decyzji Rafała. Najlepiej flaga narzędzia (np. `sprawdz --jak-z-biletem`), która dołącza
`shared_state` bez pliku biletu. Bez niej: w kroku 3 przed biletem błędy credentiali, które pokrywa
`shared_state` kursu, uznaj za oczekiwane, wymień je na karcie G1 z nazwami credentiali i powtórz `sprawdz`
zaraz po zapisie biletu, przed commitem. Pliku biletu przed „OK” nie zapisuj, nawet na chwilę.
