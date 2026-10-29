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
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai
  niedostępny): do punktu 7 agendy 13.10 Claude wpisał „W code-busters-v2 na
  GitHubie brak PR-a, issue i gałęzi o certyfikatach”, sprawdziwszy tylko repo
  kodu `Devstock-Academy/code-busters-v2`. Na tablicy platformy
  `kodozercy/code-busters` leżało otwarte od 07.07 issue #1477 „Certyfikaty -
  generowanie + weryfikacja” (plus `code-busters-mobile#183`). Wyszło turę
  później przy `gh search issues` po wszystkich trzech organizacjach; punkt
  poprawiony commitem `3c6eb979`. Przestrzeń tym razem: repo kodu a repo-tracker
  tego samego produktu.
- 2026-10-29, sesja 1f1d010e-6776-42d9-8434-75b5bef761bc (id claude.ai niedostępny; saas app):
  zakres nazwany, ale wniosek wyciągnięty i tak. Po odczycie kanału `#edu-saas` napisałem
  „statusu z pt 23.10 nie ma na `#edu-saas` (przejrzane 26.09–29.10; priv niesprawdzony)”
  i na tej podstawie zaproponowałem obniżkę „Statusy” 3 → 2,4. Rafał: „Konrad pytał mnie
  o statusy, pozwoliłem go nie załączać”, czyli odpowiedź leżała na privie, którego bot nie
  czyta. Nazwanie zakresu uratowało fakt, nie uratowało wniosku: przy brakującej części
  przestrzeni ocena powinna iść jako warunkowa („2,4, chyba że zwolniłeś go na privie”).

## Rozwiązanie
Przed twierdzeniem „X nie ma” sprawdź trzy indeksy: (1) pamięć projektu
(`~/.claude/projects/<repo>/memory/MEMORY.md` i pliki obok; dawny dziennik
`praca-z-claude.md` jest skasowany od 2026-10-12) — mówi, gdzie leży praca; (2) `git worktree list` i `git log --all --oneline -- <ścieżka>`;
(3) `ls ~/.claude/projects/` — nazwy katalogów kodują ścieżki wszystkich repo,
w których pracowano. W odpowiedzi nazwij przeszukany zakres („w drzewie `main`
nie ma…”), zamiast twierdzić o całym repo czy dysku.
