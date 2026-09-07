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
