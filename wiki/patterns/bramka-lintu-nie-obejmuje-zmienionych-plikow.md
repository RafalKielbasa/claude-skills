# bramka-lintu-nie-obejmuje-zmienionych-plikow

- **Skill:** ogólny (dotyka superpowers:writing-plans i superpowers:subagent-driven-development)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Bramka zadania „`pnpm lint` zielony” przechodziła, a pliki zadania miały błędy lintu; dwa zadania (7 i 8) zamknięte z fałszywie zielonym lintem, implementer w dobrej wierze raportował „lint clean”.

## Przyczyna źródłowa
Komenda bramki wzięta z `CLAUDE.md` po nazwie, bez sprawdzenia jej zasięgu: `expo lint` lintuje tylko domyślne katalogi i pomija `screens/`, także z `--no-cache`, a `eslint .` daje tysiące błędów z plików niebędących źródłami. Zielony wynik dowodzi tylko plików, które komenda objęła, a tego nikt nie sprawdzał.

## Dowody
- 2026-11-04, sesja session_01WryF5UuECUFMWTUWLoBKsJ (lokalnie 78e3ca27-9604-4e3b-ad0b-1d0f66a80e7a) (code-busters-mobile, plan 1 ekranów wydania): recenzent Opus zadania 8 uruchomił `npx eslint` na plikach zadania i znalazł `'frames' is defined but never used`; kontroler sprawdził `expo lint --no-cache` (exit 0, bez wyjścia) i `npx eslint app components lib screens utlis tokens` (błąd z zadania 7: `'ImageSource' is defined but never used`). Ruling w ledgerze: od zadania 9 bramką jest `npx eslint` po folderach źródłowych; zapisane w `CLAUDE.md` repo.

## Rozwiązanie
W skanie pre-flight (albo przy pisaniu planu) potwierdzić, że komenda bramki obejmuje katalogi, które plan zmienia: wstawić tymczasowo oczywisty błąd (nieużywany import) w pliku z każdego dotykanego katalogu i sprawdzić, że komenda pada; gdy nie pada — zastąpić ją komendą na jawnych ścieżkach i zapisać ruling.
