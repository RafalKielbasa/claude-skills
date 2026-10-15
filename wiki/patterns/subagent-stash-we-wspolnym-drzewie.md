# subagent-stash-we-wspolnym-drzewie

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Implementer napisał najpierw kod produkcyjny, a potem — żeby i tak pokazać RED w raporcie TDD — schował
swoje zmiany `git stash`, uruchomił testy i przywrócił stash. W repo, którego drzewo robocze dzielą
równoległe sesje, `git stash` bez ścieżek zabiera też cudze niezacommitowane pliki; pop po konflikcie
albo przerwaniu zostawia je w stashu.

## Przyczyna źródłowa
Szablon implementera wymaga dowodu RED, a kolejność „test przed kodem” nie jest wymuszona — gdy
implementer ją odwróci, stash jest najkrótszą drogą do wymaganego dowodu. Dispatch nie mówi, że
drzewo jest współdzielone, więc implementer traktuje je jak własne.

## Dowody
- 2026-10-15, sesja ad16420c-5965-4484-a54d-32148a48f6ea (id claude.ai niedostępny), repo Baza wiedzy,
  Task 7 planu `switch_tab`: raport „I wrote src changes before the RED run, so I stashed the two src files
  … Stash restored.” W drzewie leżał niezacommitowany `kursy/.../lekcja-03-…/lekcja.yaml` innej sesji;
  sprawdzone po fakcie (`git stash list` pusty, plik nadal zmieniony) — nic nie zginęło. Od następnego
  dispatchu reguła „never git stash” w prompcie.

## Rozwiązanie
W dispatchu implementera w repo ze współdzielonym drzewem: „Never use git stash (the working tree is
shared with other sessions). Write the failing test before the code; if you already wrote the code,
report RED as not shown instead of hiding your changes.” Po każdym raporcie, który wspomina stash,
kontroler sprawdza `git stash list` i `git status`.
