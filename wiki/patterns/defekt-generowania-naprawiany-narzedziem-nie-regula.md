# defekt-generowania-naprawiany-narzedziem-nie-regula

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Defekt, który bierze się z nawyku generowania, a nie z braku wiedzy, zostaje
naprawiony deterministycznym narzędziem plus maszynowym sprawdzeniem, a nie
zdaniem dopisanym do skilla. Model przestaje być punktem, w którym poprawka
może się nie zdarzyć.

## Przyczyna źródłowa
Reguła w skillu działa tylko wtedy, gdy przy następnym generowaniu ten sam
model ją sobie przypomni i zastosuje wbrew odruchowi, który defekt wytworzył.
Odruch jest silniejszy niż reguła, bo wynika ze sposobu, w jaki tekst powstaje.
Do tego sprawdzenie napisane pod skrajny przypadek („odrzuć układ idealnie
przekątny") obchodzi się przypadkiem — wystarczy, że wynik minimalnie odbiegnie
od wzorca, a defekt przejdzie w praktycznie niezmienionej postaci.

Rozdzielenie ról to zamyka: narzędzie **ustawia** wynik (deterministycznie,
więc powtarzalnie i bez diffu przy drugim przebiegu), walidator **pilnuje**
wyniku (więc plik ominięty przez narzędzie nie przejdzie bramki), a reguła
w skillu zostaje tylko wskazówką, kiedy narzędzie uruchomić.

## Dowody
- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: ćwiczenia `dopasowanie`
  w kursie generowały się z listami wypisanymi równolegle (7/7 i 6/6 par na
  przekątnej). Przedstawiłem trzy warianty naprawy; Rafał wybrał „narzędzie
  miesza, walidator pilnuje" zamiast „reguła w skillu + walidator". Powstało
  `npm run tasuj` (ziarno z treści listy, więc idempotentne) plus BŁĄD
  walidacji przy układzie przekątnym. Argument, który rozstrzygnął wybór:
  przy samej regule wystarczyłaby zamiana dwóch pozycji, żeby minąć
  sprawdzenie skrajnego przypadku i dalej oddać zadanie do odgadnięcia
  z kształtu. Wzorzec domenowy: `<repo Baza wiedzy>/.claude/wiki/patterns/generator-wypisuje-dwie-listy-zadania-rownolegle.md`.

## Rozwiązanie
Zanim dopiszesz regułę do skilla, zapytaj, czy defekt da się **policzyć**.
Jeśli tak, reguła jest najsłabszą z możliwych napraw i ma być ostatnim, nie
pierwszym elementem: narzędzie ustawiające wynik, sprawdzenie odrzucające
wynik zły, a w skillu jedno zdanie, kiedy narzędzie uruchomić. Sprawdzenie pisz
tak, żeby łapało klasę defektu, nie jeden jego wariant — a gdy da się tylko
skrajny przypadek, tym bardziej potrzebne jest narzędzie, bo sprawdzenie samo
nie wystarczy.
