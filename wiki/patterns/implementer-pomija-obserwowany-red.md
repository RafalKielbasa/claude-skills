# implementer-pomija-obserwowany-red

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Implementer pisze test i kod w jednym kroku i zgłasza, że nie widział testu czerwonego. Zielony test nie dowodzi wtedy, że łapie defekt, który ma przypinać — mógł przechodzić także na starym kodzie.

## Przyczyna źródłowa
Brief każe „napisz test, zobacz, że pada, napraw”, ale przy kilku pozycjach naraz (fala poprawek z listą 10 uwag) implementer łączy kroki, żeby nie uruchamiać suite'u kilka razy. Nic w raporcie nie wymusza dowodu RED per pozycja, więc brak wychodzi tylko wtedy, gdy implementer sam go wyzna.

## Dowody
- 2026-10-21, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny), plan 1 warstwy CMS (code-busters): zadanie 6 wróciło z „no observed RED (tests written after code)”, a fala poprawek po review całej gałęzi z „items 5–10 tests not observed red”. Kompensacja w review: recenzent zadania 6 uruchomił mutacje (usunięcie filtra `published` i warunku kursu w `where` — oba testy padły); re-review fali tylko rozumował z asercji, bo tymczasowy worktree nie ma `node_modules` i nie dało się tam uruchomić vitest.

## Rozwiązanie
W briefie fali poprawek z kilkoma pozycjami wymagaj w raporcie, per pozycja, nazwy testu i wyniku jego przebiegu przed poprawką. Gdy implementer zgłasza brak RED, review dostaje polecenie mutacji: cofnięcie wskazanej linii i uruchomienie jednego testu. W repo, gdzie świeży worktree nie ma zależności, mutację robi kontroler na kopii roboczej przed re-review albo recenzent w worktree z `node_modules` podlinkowanymi z głównego checkoutu.
