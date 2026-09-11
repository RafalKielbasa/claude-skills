# format-scenariusza-skopiowany-z-sasiedniej-lekcji

- **Skill:** kurs-lekcja (krok 1 kontekst, krok 3b generowanie scenariusza)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Scenariusz nowej lekcji powstaje w formacie skopiowanym z lekcji sąsiedniej,
a nie z szablonu. Walidacja na bramce odrzuca komplet segmentów, po jednym
błędzie na segment, mimo że treść jest gotowa i merytorycznie poprawna.

## Przyczyna źródłowa
Krok 1 skilla każe przeczytać `styleguide.md` i
`kursy/_wspolne/szablony/struktura-lekcji.md`, ale NIE wymienia
`kursy/_wspolne/szablony/scenariusz.md` - jedynego pliku, który opisuje kształt
nagłówka segmentu. Format bierze się więc z najbliższego dostępnego przykładu,
czyli ze scenariusza poprzedniej lekcji, czytanego w kroku 1 dla spójności
narracji. Szablon i walidator idą do przodu razem, a zatwierdzone lekcje
zostają w formacie sprzed zmiany, dopóki ktoś ich nie przemigruje. Im świeższa
zmiana formatu, tym pewniejszy rozjazd - i tym mniej widać go w plikach, do
których skill każe zajrzeć.

## Dowody
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: lekcja 2.2 kursu
  agenty-ai. Nagłówki segmentów napisane jak w lekcji 2.1
  (`## [ekran: screencast] Tytuł`), bo to jedyny wzór, jaki widziałem podczas
  pisania. Walidator wymaga `## [ekran: screencast] Segment N - Tytuł`
  i zwrócił 9 błędów, po jednym na segment: `segment 1 ("Powitanie") bez numeru
  w nagłówku - oczekiwano "Segment 1 - Powitanie"`. Reguła stoi w
  `kursy/_wspolne/szablony/scenariusz.md` i w `src/scenariusz.js`
  (`SEGMENT_NUMBER_IN_TITLE`); szablon i lekcje 0.1-2.1 dostały numery dopiero
  commitem `4f54506`, czyli w trakcie tej samej sesji, a lekcja 2.1 w chwili
  czytania numerów jeszcze nie miała. Koszt: jedna runda walidacji plus skrypt
  numerujący nagłówki, bez szkody w treści.

## Rozwiązanie
Do kroku 1 skilla dołożyć `kursy/_wspolne/szablony/scenariusz.md` obok
`struktura-lekcji.md`: kształt pliku bierz z szablonu, a z lekcji poprzednich
wyłącznie narrację i fakty, do których trzeba się odwołać.

Reguła ogólna dla rodziny `kurs-*`: gdy plik ma walidator, format bierz
z szablonu albo z walidatora, nie z istniejącego artefaktu. Artefakt jest
dowodem na to, co było dopuszczalne w dniu jego zatwierdzenia, nie na to, co
przejdzie dzisiaj. Tańsza wersja tej samej ochrony: uruchomić `npm run validate`
na katalogu lekcji zaraz po zapisaniu scenariusza, przed pisaniem konspektu -
błąd formatu wychodzi wtedy, gdy poprawka kosztuje jedną komendę, a nie na
bramce.
