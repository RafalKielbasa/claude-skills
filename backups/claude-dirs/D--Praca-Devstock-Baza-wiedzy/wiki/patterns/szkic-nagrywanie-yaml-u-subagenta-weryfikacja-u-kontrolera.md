# szkic-nagrywanie-yaml-u-subagenta-weryfikacja-u-kontrolera

- **Skill:** kurs-nagrywanie
- **Typ:** sukces
- **Status:** otwarty

## Opis
Etap 2 pętli produkcji (konfiguracja bez konta) dla lekcji z kilkudziesięcioma krokami przekazany jednemu
subagentowi w tle. Wrócił `video/nagrywanie.yaml`, który zgadzał się z planem nagrania, z luki opisanymi
w komentarzach `# GAP:`. Kontroler w tym czasie robił plansze, a po powrocie sam powtórzył każdą liczbę
z raportu, zanim pokazał ją Rafałowi.

## Przyczyna źródłowa
Plik ma ponad 1000 linii i wymaga przeczytania README narzędzia, planu, modułów usług i konfiguracji
sąsiedniej lekcji. W świeżym kontekście subagenta to się mieści, a w głównej sesji zjadłoby resztę
kontekstu. Zadziałało, bo brief zamknął zakres twardo: pisze tylko w `video/` lekcji, uruchamia tylko komendy
bez przeglądarki (`sprawdz`, `proba`, `budzet`), nie commituje i nie rusza plików wspólnych (`kurs.yaml`,
`_nagrywanie/`, `tools/`), a wszystko, czego brakuje w plikach wspólnych, idzie do raportu.

## Dowody
- 2026-10-30, sesja ddceb20d-ddb9-4c33-a2fb-0c560fc81c28 (id claude.ai niedostępny; lekcja agenty-ai 3.2):
  - subagent oddał 1240 linii, dwa ujęcia, dogrywki kroków 22 i 45, tabelę luk z rodzajem każdej;
  - `sprawdz` odmawiał tylko z powodu dwóch brakujących migawek, a subagent podał wynik na kopii
    z `workflows: []`;
  - kontroler powtórzył to sam: kopia zapasowa pliku, `sed` na jedną linię, `sprawdz` (58 kroków,
    60 kroków planu pokrytych), `proba` OK, `budzet` E = 11 → 77, przywrócenie pliku i `grep`, że wrócił;
  - `git status` potwierdził, że poza lekcją nic się nie zmieniło. Raport dla Rafała zawierał tylko
    liczby sprawdzone przez kontrolera.

## Rozwiązanie
Szkic `nagrywanie.yaml` lekcji z wieloma krokami zlecaj subagentowi z briefem, który:
- nazywa jedyne miejsca zapisu (`video/` lekcji);
- wymienia jedyne dozwolone komendy (bez przeglądarki i bez konta);
- zakazuje commitów i plików wspólnych;
- każe zgłosić luki jako tabelę (krok planu | czego brakuje | rodzaj).

Po powrocie powtórz `sprawdz`, `proba` i `budzet` sam; gdy wynik wymaga tymczasowej zmiany pliku, zrób
kopię, zmień, uruchom, przywróć i sprawdź przywrócenie. Do raportu bierzesz tylko to, co powtórzyłeś.
