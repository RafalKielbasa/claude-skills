# twierdzenie-o-pliku-bez-odczytu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude twierdzi wobec użytkownika, co zawiera plik, zamiast ten plik przeczytać.
Podstawą twierdzenia jest wspomnienie o momencie, w którym plik powstał, a nie
jego faktyczna zawartość.

## Przyczyna źródłowa
Kopia zapasowa zostaje utożsamiona z treścią odczytaną wcześniej, mimo że
powstała później i inny proces zdążył w międzyczasie zmienić źródło. Nic
w przepływie nie wymusza odczytu przed wypowiedzeniem twierdzenia o zawartości,
bo twierdzenie brzmi jak fakt operacyjny, nie jak hipoteza do sprawdzenia.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: przy sprzątaniu
  `praca-z-claude.md` Claude zapewnił „nie przywracam go, bo nie wiem, czy to
  Twoje sprzątanie” i „mam go w kopii” o skasowanym wpisie WikiSkill. Gdy
  użytkownik poprosił o przywrócenie, `grep "WikiSkill"` w kopii zwrócił 0 —
  kopia powstała o 11:43, a wpis zniknął o 10:24. Treść dało się odtworzyć
  wyłącznie z odczytu wykonanego o 09:45, więc sprostowanie było konieczne
  przed wykonaniem prośby.

- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC (druga część): przy
  przepisywaniu piętnastu ticketów dwa fałszywe twierdzenia o repozytorium
  przeszły ze starych treści do nowych bez sprawdzenia. #171 twierdziło, że
  „wszystkie zapytania w API są ograniczone do jednej szkoły przez kontekst
  subdomeny”, choć `/users/me`, `/auth/*`, webhooki i publiczny endpoint szkoły
  działają bez tego kontekstu. #183 stawiało kryterium „`alert()` nie występuje
  już w `apps/web/src`”, niewykonalne, bo trzecie wywołanie siedzi w edytorze
  quizu, poza zakresem tego ticketu. Oba wyłapał dopiero codex. Podstawą
  przepisania było to, że zdania stały już w opublikowanych issues.
- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: do `SKILL.md` trafiło zdanie, że niepunktowane uwagi „spadają poniżej każdego progu" — twierdzenie o zachowaniu modułu, którego czytelnik tego dokumentu nie widzi, wpisane bez sprawdzenia. Reviewer wytknął, że każe wierzyć na słowo. Sprawdzone dopiero wtedy: plik ocen `[]` daje `kept: 0, belowThreshold: 1`. Twierdzenie okazało się prawdziwe, ale to był przypadek, nie metoda.

- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU (wariant: liczba, nie
  treść): w inwentaryzacji dla użytkownika „10 segmentów" i w prompcie
  subagenta „nagłówki segmentów: liczba (10)" — z oka, po lekturze pliku, bez
  `grep -c`; plik miał 9. Wyłapał subagent („Zlecenie mówi o 10 nagłówkach,
  plik ma 9. Zostawiłem 9"), a `grep -c '^## \[ekran'` policzony dopiero po
  wysłaniu promptu. Bez szkody, ale liczba w prompcie agenta jest twierdzeniem
  o pliku i musi pochodzić z narzędzia (czwarty dowód, czwarta sesja).

- 2026-09-09, sesja session_01PrFurqNDm53ZdkCryE5kjm (wariant: liczba w raporcie
  subagenta): agent redakcji napisał w raporcie bramkowym „8 calloutów 🎬 na tych
  samych miejscach", a w pliku jest ich sześć — tyle samo co przed redakcją.
  Kontrola po agencie podważyła liczbę i policzyła ją kotwicą ASCII (`grep -c
  "wideo"` → 6 przed i po). Twierdzenie subagenta o zawartości pliku wchodzi do
  raportu dla użytkownika tak samo jak własne, więc wymaga tego samego odczytu.
- 2026-10-21/22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny), plan 2 `kodozercy-platform-public-catalog` pisany przez Claude: plan twierdził, że hooki ekranów po zalogowaniu importują dane placeholderów roadmapy (`coursesData`, `featuresData`), więc kazał je zostawić. Recenzent całej gałęzi sprawdził obu konsumentów: używają zmiennych lokalnych. Dane usunięte w fali poprawek (M2), zgodnie ze specem 5.3, który od początku kazał je usunąć.
- 2026-10-26/27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), M2 mobile, review zadania 12: recenzent (sonnet) dał Important „historia Video rzuci przy renderze”. Uzasadnienie: `.rnstorybook/preview.tsx` nie owija historii w `SnackbarProvider`. Nie sprawdził, gdzie Storybook się montuje. Grep `SnackbarProvider` i `app/_layout.tsx:136-153` pokazały, że `StorybookUIRoot` renderuje się wewnątrz providera. Uwaga poszła do rundy poprawek razem z dowodem, a implementer i re-review potwierdzili „not a defect” bez zmiany kodu. Twierdzenie recenzenta o pliku traktować jak hipotezę; jedna tania sonda kontrolera oszczędza rundę poprawek.
- 2026-10-29, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, plan 7 W4, Task 12), wariant: fałsz potwierdzony przez dwa podpisy. Implementer: „`en.json` had no `report` namespace, so I added only those three there”; recenzent zadania: „Copy: … in both `pl.json` and `en.json` with identical text”. `git show f11ab393f:…/en.json | grep loadError` — pusto. Wyszło dopiero, gdy implementer Task 14 zgłosił brak, dwa zadania później; poprawka w fali końcowej. Zgodność kluczy pl/en to fakt do policzenia skryptem (jest w Task 16), nie do potwierdzania czytaniem diffu — tańsze uruchomić skrypt po każdym zadaniu z nowymi kluczami.
- 2026-10-30, sesja 71a4e9dd-49b4-401d-b0e0-5d3ec341952f (id claude.ai niedostępny; Baza wiedzy, sekcja 13.9 specu migracji), wariant: twierdzenie uogólnione z cudzego zdania. Plan 8 pisał „`lib/hooks/use-form-field-state.ts` is no longer imported here” (tu = zmiana hasła); w sekcji 13.9 zapisałem „without its last caller”, bez `git grep`. Przegląd inwentarza M5 kilka godzin później: plik importuje nadal `screens/register/components/use-register-form.ts:6,66,95`. Tym samym przeglądem wyszły dwa starsze zdania specu z tej samej rodziny (13.5: `animated-accent-card` „kept” bez importera; 13.7: ścieżka bez `components/`). Poprawione w commicie planu 10 z adnotacją „corrected 2026-10-30”. Zdanie o liczbie wywołujących („ostatni”, „żaden”, „jedyny”) przepisywane z raportu albo planu do specu wymaga własnego grepa, bo raport mówi tylko o swoim zakresie.

## Rozwiązanie
Zanim powiesz użytkownikowi, co zawiera plik, przeczytaj ten plik. Dotyczy to
zwłaszcza kopii zapasowych, artefaktów i plików tymczasowych, które powstały
w innym momencie niż obserwacja treści: między jednym a drugim mógł wejść inny
proces. Kosztem jest jedno wywołanie `grep`, ceną pominięcia — obietnica, której
nie da się dotrzymać.

Ta sama reguła obowiązuje wobec cudzych twierdzeń, nie tylko wobec własnych
wspomnień. Tekst opublikowany nie jest tekstem sprawdzonym: zdanie o stanie
repozytorium przepisywane ze specu, ze starego ticketu albo z dokumentacji
sprawdź w kodzie od nowa, zanim je powtórzysz pod swoim podpisem. Przy
przepisywaniu treści dotyczy to każdego zdania mówiącego „dziś działa tak”.
