# twierdzenie-negatywne-z-czesci-przestrzeni

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude mówi „tego nie ma” — nie ma agendy, nie ma narzędzia, nie ma pliku —
po przeszukaniu tylko jednego checkoutu albo jednego dysku. Rzecz istnieje
w miejscu, którego wyszukiwanie nie objęło, a twierdzenie brzmi jak sprawdzony fakt.

## Przyczyna źródłowa
Praca Rafała jest rozłożona na kilka przestrzeni: worktree per temat
(`git worktree list`), gałęzie niezmergowane do `main`, repozytoria na dyskach
D i E. `Grep`, `Glob` i `ls` widzą jedną z nich. Indeks tego, gdzie co leży,
już istnieje — dziennik sesji `D:\Notatki\notatki\praca-z-claude.md`
i nazwy katalogów w `~/.claude/projects/` (np. `E--Praca-agent-biznes`) —
ale Claude nie zagląda do niego przed twierdzeniem negatywnym.

## Dowody
- 2026-10-09, sesja 75fd3461 (id claude.ai niedostępny): na pytanie o materiały
  na spotkanie 13.10 Claude odpowiedział „nie ma żadnych materiałów
  przygotowawczych na 13.10: brak agendy i brak notatki przed spotkaniem”,
  szukając tylko w drzewie `main`. Notatki przed spotkaniem i rozszerzony
  research leżały na gałęzi `docs/spotkanie-2026-10-13` w worktree
  `D:\Praca\Devstock\baza-wiedzy-spotkanie-2026-10-13`; Claude sam to
  odkrył turę później i poprawił się.
- 2026-10-09, ta sama sesja: „w repozytoriach na dysku D: nie ma narzędzia do
  walidacji pomysłów” — grep tylko po `/d/Praca`. Idea-engine leży
  w `E:\Praca\agent-biznes`, a wpis dziennika z 2026-10-08 („Kodożercy
  (idea-engine i materiały na 13.10)”) podawał to wprost. Wyszło dopiero przy
  pisaniu briefu na koniec sesji; research o dzieciach zrobiono przez to
  skillem `deep-research` zamiast w idea-engine.

## Rozwiązanie
Przed twierdzeniem „X nie ma” sprawdź trzy indeksy: (1) `grep -n -i "<temat>"
D:\Notatki\notatki\praca-z-claude.md` — ostatnie wpisy dziennika mówią, gdzie
leży praca; (2) `git worktree list` i `git log --all --oneline -- <ścieżka>`;
(3) `ls ~/.claude/projects/` — nazwy katalogów kodują ścieżki wszystkich repo,
w których pracowano. W odpowiedzi nazwij przeszukany zakres („w drzewie `main`
nie ma…”), zamiast twierdzić o całym repo czy dysku.
