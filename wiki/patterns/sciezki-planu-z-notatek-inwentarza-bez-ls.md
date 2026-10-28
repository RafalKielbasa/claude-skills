# sciezki-planu-z-notatek-inwentarza-bez-ls

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sekcja **Files** zadań planu wskazuje ścieżki, których nie ma w repo: pliki leżą piętro wyżej albo niżej
niż plan zakłada. Kroki sprawdzające każą też testować „czysty helper”, ale nie nazywają pliku, w którym
ten helper ma powstać.

## Przyczyna źródłowa
Ścieżki planu biorą się z notatek inwentarza (nazwa pliku + liczba linii) i z konwencji sąsiednich folderów
(`screens/<x>/components/`). Self-review `writing-plans` sprawdza spójność nazw między zadaniami, a nie
istnienie plików w kodzie. Gdy wykonawca dostanie zadanie, błędny glob psuje zakres zadania i lint.

## Dowody
- 2026-10-28, sesja c0757c79-09ad-4165-ad02-a020e38adc07 (id claude.ai niedostępny), plan 6 (M3) migracji
  Kodożerców. `codex exec --sandbox read-only` znalazł:
  - `screens/achievements/components/{achievements-container,achievements-screen,achievement-card}.tsx`
    (pliki leżą w `screens/achievements/`);
  - `screens/loyalty-program/components/{loyalty-program-screen,loyalty-program-view}.tsx` (leżą w
    `screens/loyalty-program/`);
  - kroki NODE bez czystych plików `.ts` (formatter nagród, scalanie stron feedu, odmiana).
  Self-review ich nie wyłapał; `ls` w repo potwierdził uwagi przed poprawką.

## Rozwiązanie
Przed zapisaniem planu sprawdź każdą ścieżkę z sekcji **Files** w kodzie (`ls` albo `git ls-files` na
bazowym commicie) i popraw te, których nie ma. Każdy krok NODE albo test „czystego helpera” nazywa plik
(`.ts` bez importów platformy), funkcję z sygnaturą i gotową komendę z asercjami.
