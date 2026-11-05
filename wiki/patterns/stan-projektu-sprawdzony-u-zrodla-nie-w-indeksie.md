# stan-projektu-sprawdzony-u-zrodla-nie-w-indeksie

- **Skill:** project-index
- **Typ:** sukces
- **Status:** otwarty

## Opis
Pytanie „na czym stoimy” rozstrzygnięte w źródłach (PR-y, wydania, buildy, gałęzie), a nie samym indeksem
projektu. Indeks z poprzedniego dnia podawał stan sprzed scalenia, więc odpowiedź z indeksu byłaby fałszywa.

## Przyczyna źródłowa
Procedura 8 skilla brzmi „Read the index and answer from it”, ale indeks aktualizują sesje piszące dokumenty.
Scalenia i wdrożenia robią inne osoby i sesje w repo z kodem, które indeksu nie ruszają, więc najstarszą częścią
indeksu bywa właśnie to, co zmieniło się ostatnio. To inna przyczyna niż
[[indeks-projektu-rozjechany-miedzy-galeziami-sesji]]: tam dwie sesje piszą jeden plik, tu nikt go nie pisze.

## Dowody
- 2026-11-05, sesja 78d1f9a8-a534-43a0-8215-3ee7c33255f6 (id claude.ai niedostępny; Baza wiedzy, DT-52 #741):
  „Na czym stoimy z pracami na DT-52?”. Indeks (ostatni commit 2026-11-04 13:48): „żadne DT-37 nie jest w `main`:
  web czeka na review Wiktora w code-busters#1652”. Źródła: #1652 zamknięty, code-busters#1730 scalony 04.11
  o 13:26, code-busters-mobile#403 o 14:02, wydania `2026-11-04v1`–`v3`, buildy EAS 1.1.0. Tak samo nieaktualna
  była pamięć `dt37-galaz-biblioteki` („nic do `main` przed W5/M5”), poprawiona w tej sesji.

## Rozwiązanie
Przy pytaniu o stan projektu odczytaj indeks, a potem jego najnowsze twierdzenia o stanie zewnętrznym (PR, gałąź,
wydanie, status issue) porównaj ze źródłem. W odpowiedzi pokaż stan ze źródła i osobno rozjazd z indeksem. Indeksu
przy tym nie zmieniaj; zaproponuj aktualizację jako decyzję. Propozycja do procedury 8: „Read the index, check its
claims about PRs, branches, releases and issue statuses against the source, and report any difference”.
