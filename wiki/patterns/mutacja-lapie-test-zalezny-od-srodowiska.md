# mutacja-lapie-test-zalezny-od-srodowiska

- **Skill:** superpowers:test-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Celowe psucie skryptu po zielonym teście pokazuje testy, które przechodzą dzięki środowisku,
a nie dzięki kodowi. Mutacja, która przeżyła albo się nie nałożyła, jest wynikiem do
wyjaśnienia, a nie szumem.

## Przyczyna źródłowa
Obserwowany RED dowodzi tylko, że test pada bez całej funkcji i w jednym środowisku. Nie
dowodzi, że łapie usunięcie pojedynczego zachowania, ani że warunek wejściowy zachodzi w
każdej powłoce. Ujawnia to dopiero uruchomienie testu z usuniętym właśnie tym zachowaniem.

## Dowody
- 2026-11-05, sesja e70485da-f464-4147-b956-8e00c7c5e2e2 (id claude.ai niedostępny): usunięcie
  obsługi BOM ze skryptu status line przeżyło (`ok=23 FAIL=0`) przy uruchomieniu z Git Basha,
  choć wcześniej z narzędzia PowerShell brak tej obsługi wywracał 9 asercji. Test zależał od
  powłoki, więc dostał jawne bajty i wtedy mutacja zaczęła padać. Kontrola `cmp` wypisała
  dwa razy `MUTATION DID NOT APPLY`: raz przez niewidoczny znak w źródle, raz przez zły
  cudzysłów w `sed`. Bez niej oba przebiegi wyglądałyby na dowód.

## Rozwiązanie
Po zielonym teście usuwaj po kolei każde zachowanie, które ma być chronione, na kopii z
przywróceniem pliku po każdym przebiegu. Przed uruchomieniem testu sprawdź przez `cmp`, że
mutacja zmieniła plik. Mutację, która przeżyła, traktuj jako lukę testu i wyjaśnij ją przed
raportem. Warunek wejściowy zależny od powłoki albo konsoli podaj w teście jawnie.
