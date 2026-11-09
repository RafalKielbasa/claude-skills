# self-check-nie-sprawdza-weryfikacji-i-kontraktu

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-09, github-tickets)

## Opis
Self-check przepuścił w DT-128 sześć uwag `codex`, które okazały się trafne: kroki weryfikacji
ręcznej bez obserwowalnego wyniku albo zależne od opcjonalnego efektu, przykładową komendę bez
trafień, sprzeczne wiersze kontraktu, kontrakt niewykonalny przy ograniczeniu opisanym w tym samym
tickecie, zbyt szeroki wyjątek i liczby z kontekstu sesji podane jak pomiar z pliku.

## Przyczyna źródłowa
Lista kontrolna sprawdza kryteria akceptacji, ale nie sprawdza kroków weryfikacji ręcznej ani
wierszy kontraktu względem siebie, a przy ścieżkach wymaga tylko, żeby plik istniał. Dwie inne uwagi
łapały istniejące linie z 2026-09-20 (warunek reguły z dokumentu) i 2026-10-15 (kontrola per
element), których nie zastosowałem.

## Dowody
- 2026-11-09, sesja a70b061f-baec-4d73-912c-99f058fc1e43 (DT-128, #899): runda 1 dała 4 uwagi
  wcielone, a runda 2 po dopisaniu reguł `.env` dała 5. Przykład: `grep -n "process.env"
  tools/course-pipeline/src/config.js`, a plik nie zawiera `process.env`. Własne znalezisko tej
  sesji: audyt mierzył mobile `CLAUDE.md` na gałęzi `dt-37` (201 linii), a `main` miał 208.

## Rozwiązanie
Siedem linii z datą 2026-11-09 w `references/self-check.md`, sekcja „From findings”: kroki
weryfikacji jak kryteria, przykładowe komendy uruchomione, wiersze kontraktu porównane parami,
kontrakt wykonalny przy opisanym ograniczeniu, wąskie wyjątki, oznaczenie liczb z kontekstu sesji
i pomiar pliku z innego repo z gałęzi domyślnej.
