# restart-zakladki-huba-bez-pierwszego-promptu

- **Skill:** hub (także plan instalacji huba)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Krok instalacji kazał zamknąć i otworzyć zakładkę huba. Rafał to zrobił, a watcher nie wystartował: nie
było pliku `heartbeat`, więc hook uprawnień nie czekałby na hub. Potrzebny był dodatkowy krok „wpisz
`start`”, czyli jedna tura więcej.

## Przyczyna źródłowa
Procedurę startu huba (wczytanie skilla `hub`, uzbrojenie watchera przez `Monitor`) wykonuje model w
pierwszej turze, bo tak mówi `~/.claude/hub/CLAUDE.md`. Świeża sesja bez promptu nie ma tury. Hook
`SessionStart` niczego tu nie uruchamia, a plan opisywał restart, jakby sam start sesji wystarczał.

## Dowody
- 2026-11-09, sesja session_01WryF5WMM6e7iBT7efWZwJS (lokalnie 3089ecd1-38b8-4995-a6db-28273c325475),
  zadanie 13 planu `hub-approvals-plan-1`: po „zrobione” proces `claude.exe` huba działał od 09:39:24, ale nie
  było `heartbeat` ani wpisu w rejestrze. Watcher ruszył dopiero o 09:43, po `start` w zakładce huba.

## Rozwiązanie
Każda instrukcja restartu zakładki huba (instalacja, po `/clear`, po przerwie) kończy się krokiem: „wpisz
`start` i naciśnij Enter; hub pokaże przegląd”. Zanim przejdziesz do kolejnego kroku, sprawdź, że
`~/.claude/hub/heartbeat` ma świeży znacznik.
