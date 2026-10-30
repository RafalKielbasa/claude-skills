# inwentarz-zachowan-z-rownoleglych-przegladow

- **Skill:** superpowers:writing-plans
- **Typ:** sukces
- **Status:** otwarty

## Opis
Plan migracji ekranów „1:1” powstaje na inwentarzu zachowań zebranym przez cztery równoległe przeglądy
kodu tylko do odczytu, po dwa na platformę, ze stałym formatem raportu z `plik:linia`. Inwentarz trafia do
repo jako załącznik planu i jest czytany przed każdym zadaniem.

## Przyczyna źródłowa
Migracja zachowania 1:1 wymaga listy wszystkiego, co ekran robi (zapytania, inwalidacje, klucze pamięci,
teksty, kotwice tour, błędy zastane). Jeden czytelnik nie utrzyma w kontekście kilkunastu tysięcy linii.
Brief z polami raportu (kluczowe ustalenia, drzewo i stare importy, zachowanie na ekran, GraphQL, testy,
dopasowanie do ds, błędy zastane, martwy kod, dane bramki, nieustalone) daje porównywalne wyniki od czterech
agentów i gotowe pozycje decyzji („błędy zastane”) dla użytkownika.

## Dowody
- 2026-10-28, sesja c0757c79-09ad-4165-ad02-a020e38adc07 (id claude.ai niedostępny), plany 5 (W3) i 6 (M3)
  migracji Kodożerców. Cztery agenty `general-purpose` (9–14 min, 84–128 wywołań). Raporty wpisywane do
  inwentarzy w miarę spływania. `codex` nie znalazł luk pokrycia („Plan uwzględnia wszystkie główne pozycje
  MA/MB”). Raporty dały też fakty zmieniające plan: pusty marketplace na seedzie, admin poza rankingiem,
  `getCoinProducts` w martwym folderze, gałąź `origin/feature/mobile-version-1.0` z tymi samymi plikami.
  Wzorzec powtarza inwentarze W2 i M2 (sesja 2be43b78, 2026-10-26).
- 2026-10-29, sesja 4f646017-851e-44d6-a6c9-cf219eac164a (id claude.ai niedostępny), plan 8 (M4). Dwa agenty
  `general-purpose` (12 i 16 min, 72 i 98 wywołań), brief z polami raportu z inwentarza M3. Fakty zmieniające
  plan: „O aplikacji” nie ma wiersza wersji, więc otwarta uwaga M3 o statycznym `MenuRow` nie dotyczy M4;
  globalna zmiana preferencji Novu nadpisuje w cache wszystkie przełączniki rodzajów; `TimePicker` ma jednego
  wywołującego; dryf gałęzi wydania tylko w edycji profilu (przycisk bez trasy na DT-37). `codex` nie zgłosił
  luk pokrycia. Nowe: przeglądy podzielone po folderach ekranów nie zobaczyły ustalenia poza tymi folderami.
  Stopka `FormScreen` w prywatnym stosie stanęłaby nad klawiaturą o wysokość paska zakładek. Znalazłem to sam,
  czytając `app/(private)/_layout.tsx` i `tab-bar-height.tsx` z arytmetyką z sekcji 13.7 specu (M3).

## Rozwiązanie
Przed planem migracji „1:1” zbierz inwentarz przez równoległe przeglądy tylko do odczytu, z podziałem na
rozłączne zakresy plików i z tym samym briefem pól raportu; zapisz go jako plik obok planu i każ czytać przed
każdym zadaniem. Ścieżki z inwentarza i tak sprawdź `ls` przed zapisaniem planu
(`sciezki-planu-z-notatek-inwentarza-bez-ls`). Wspólne kompozycje, których ekrany zaczną używać (powłoka,
układy, klawiatura), przeczytaj sam, bo przegląd z zakresem „folder ekranu” ich nie posiada; dopisz je do
inwentarza osobną sekcją.
