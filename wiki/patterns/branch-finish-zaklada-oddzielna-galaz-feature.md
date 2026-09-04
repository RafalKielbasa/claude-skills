# branch-finish-zaklada-oddzielna-galaz-feature

- **Skill:** superpowers:finishing-a-development-branch
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skill `finishing-a-development-branch` zakłada domyślnie istnienie osobnej gałęzi/worktree
do zmergowania albo wypchnięcia (menu: merge lokalnie / push + PR / zostaw jak jest). W tej
sesji plan implementacyjny został z góry (pre-flight ruling) wykonany bezpośrednio na
`main`, bez osobnej gałęzi feature — legalna, świadoma decyzja dla repozytorium
jednoosobowego, konfiguracyjnego typu `claude-skills`, gdzie PR-e i code review na gałęziach
nie mają odbiorcy. Skill wymagał wtedy ręcznego dopasowania argumentu wywołania
(`ARGUMENTS: ... executed directly on main (no feature branch, per pre-flight ruling)`),
zamiast zadziałać wprost z pudełka.

## Przyczyna źródłowa
Skill projektowany jest pod domyślny, wieloosobowy przepływ pracy z gałęziami feature i
code review przez PR. Nie ma wbudowanej ścieżki dla repozytoriów, gdzie commitowanie wprost
na `main` jest świadomym, celowym wyborem architektonicznym (np. repo z jednym
opiekunem, gdzie każdy commit i tak przechodzi przez wewnętrzny proces
subagent-driven-development z własnym przeglądem zadaniowym i finalnym).

## Dowody
- 2026-09-03/04, sesja `session_0115YBg2ri1ajCfG8GNynEsZ`: przy zamykaniu 8-zadaniowego
  planu backupu konfiguracji `.claude`, wykonanego od początku bezpośrednio na `main`,
  wywołanie skilla wymagało przekazania kontekstu wprost w `ARGUMENTS`
  („executed directly on main (no feature branch, per pre-flight ruling), final
  whole-branch review clean at commit 271c1b5"), bo standardowe kroki 2–4 skilla (wykrycie
  środowiska, menu merge/PR/zostaw) nie mają zastosowania, gdy nie ma osobnej gałęzi do
  scalenia.

## Rozwiązanie
Gdy plan implementacyjny z góry zakłada pracę wprost na gałęzi głównej (świadoma decyzja
pre-flight, nie przeoczenie), przy wywołaniu `finishing-a-development-branch` przekazać to
jawnie w `ARGUMENTS` — nazwę ostatniego commita finalnego przeglądu i fakt braku osobnej
gałęzi — i pominąć kroki 2–4 (wykrycie środowiska git-worktree, menu merge/PR/zostaw) jako
nie dotyczące tego przypadku, zamiast wymuszać na nich odpowiedź. Rozważyć w przyszłości
dopisanie do samego skilla trzeciego trybu środowiska („brak osobnej gałęzi, praca wprost
na base") obok istniejących dwóch (`GIT_DIR == GIT_COMMON` / `GIT_DIR != GIT_COMMON`) — to
wymagałoby zmiany treści skilla, nie tylko sposobu jego wywołania.
