# sekret-actions-repo-czytelny-dla-kazdego-z-zapisem

- **Skill:** superpowers:brainstorming (też superpowers:writing-plans)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dopisek do specu i plan umieściły osobisty token classic Rafała w sekrecie repozytorium dla workflow GitHub Actions. Dopiero recenzja końcowa kodu zauważyła, że każda z 6 osób z prawem zapisu może uruchomić workflow z własnej gałęzi i odczytać sekret.

## Przyczyna źródłowa
Spec rozstrzygał, gdzie leży sekret, ale pytał tylko o zakres tokenu, a nie o to, kto w repo może uruchomić kod z dostępem do sekretu. Sekret repozytorium dostaje każde uruchomienie z dowolnej gałęzi (`workflow_dispatch` albo zmieniony plik workflow).

## Dowody
- 2026-11-09, sesja f83b042b-5c80-43ff-8320-902beeeba944 (id claude.ai niedostępny; Baza wiedzy, DT-134 #910): spec mówił „stores it as a repository secret”. Recenzja końcowa (opus), Important 3: „repo secret readable by any of 6 push collaborators via a branch workflow; main unprotected; no environments”. Rafał wybrał środowisko `card-trail` z regułą gałęzi `main` i zakres `read:project`, a spec został poprawiony po fakcie (`1d0863da`). Zostało ryzyko: `main` nie ma ochrony gałęzi.

## Rozwiązanie
Gdy spec albo plan daje workflow GitHub Actions sekret z osobistym tokenem, rozstrzyga też:
- kto ma prawo zapisu w repo;
- czy sekret leży w środowisku z regułą gałęzi (domyślnie tak, tylko gałąź domyślna);
- czy gałąź domyślna jest chroniona;
- czy zakres tokenu jest najwęższy, jaki wystarcza jobowi (np. `read:project` zamiast `project`).
