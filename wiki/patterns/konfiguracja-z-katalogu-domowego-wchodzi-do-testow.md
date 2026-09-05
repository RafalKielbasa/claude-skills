# konfiguracja-z-katalogu-domowego-wchodzi-do-testow

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis

Kod czyta konfigurację ze stałej ścieżki w katalogu domowym. Testy przechodzą
przez ten sam odczyt, więc **wynik suite'u zależy od tego, co użytkownik ma u
siebie**. Suite świeci na zielono przez całą budowę, bo plik jeszcze nie
istnieje, i pęka w dniu, w którym produkt zaczyna działać naprawdę.

## Przyczyna źródłowa

Ścieżka domyślna jest zaszyta bez punktu nadpisania, a testy uruchamiają
prawdziwą ścieżkę odczytu. Zielony suite sprawdza wtedy świat, w którym produkt
nie działa: brak konfiguracji to stan przed pierwszym użyciem, a nie stan
docelowy. Czysty runner CI i maszyna autora dają wtedy różny wynik dla tego
samego commita.

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: `loadConfig` w
  `bin/crm.mjs` czytał `~/.claude/review/global.md`. 162 przebiegi suite'u
  zielone, bo plik nie istniał. Utworzony przy pierwszym wdrożeniu skilla —
  czyli dokładnie wtedy, gdy powstałby u użytkownika — wywalił test
  `plan announces the budget for a real change`: doszły dwie osie dziedziczone,
  wybrane były dwie zamiast jednej. Potwierdzone różnicowo: przeniesienie pliku
  → suite czysty, przywrócenie → jeden błąd. Wcześniejszy agent zdiagnozował ten
  błąd jako „wcześniejszy i niezwiązany", cofając inny podejrzany plik i widząc,
  że błąd zostaje — rozumowanie poprawne, wniosek fałszywy, bo nie kontrolował
  drugiej zmiennej, która ruszyła w tym samym czasie.

## Rozwiązanie

Każdy odczyt konfiguracji spoza repozytorium dostaje punkt nadpisania
(zmienna środowiskowa albo flaga) z domyślną ścieżką jak dotąd, a testy
sięgające tej ścieżki ustawiają go na plik wewnątrz własnego katalogu
tymczasowego. Do tego jeden test przypinający zachowanie: z konfiguracją
zewnętrzną i bez niej wynik ma się różnić w przewidziany sposób. Cofnięcie
jednego podejrzanego nie izoluje zmiany, gdy zmieniło się dwoje — przy diagnozie
wypisz, co jeszcze ruszyło od ostatniego zielonego przebiegu.
