# stan-przegladu-w-sledzonym-pliku-blokuje-scalenie

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przebieg `code-review-master` zostawia zmieniony `.claude/review/state.json`, którego skill zabrania commitować. W repo, gdzie ten plik jest śledzony i zmienia go też `main`, niezacommitowana zmiana blokuje późniejsze `git merge origin/main` w tym samym drzewie.

## Przyczyna źródłowa
Skill traktuje `state.json` jak lokalny artefakt, a repo trzyma go w gicie. Każdy przebieg brudzi więc drzewo plikiem, którego nie wolno ani zacommitować, ani po cichu wyrzucić, i problem wychodzi dopiero przy scalaniu, kilka godzin po przeglądzie.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): `code-busters-v2`: po przeglądzie gałęzi (przebieg `fn7k`) `state.json` wisiał jako ` M` przez całą sesję. Przy „zaciągnij zmiany z main” `main` też zmieniał ten plik; żeby scalić, skopiowałem lokalną wersję do scratchpada i zrobiłem `git restore`, a po scaleniu została wersja z `main` (zapis przebiegu `fn7k` jest tylko w kopii).
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault, dwa przebiegi kontrolne `pr 217` w worktree `saas app` w scratchpadzie sesji 0aaba947): oba przebiegi zostawiły ` M .claude/review/state.json` w worktree, a `crm finish` znów nie powiedział, że plik jest śledzony. Worktree jest tymczasowy, więc scalenia nie zablokował. Obok: `crm finish` dopisuje wpis przebiegu przy każdym wywołaniu, więc URL artefaktu opublikowanego po Kroku 10 nie ma jak trafić do `state.json` bez zdublowania wpisu.

## Rozwiązanie
W `crm finish` (albo w kroku zamykającym skilla) sprawdź `git ls-files --error-unmatch .claude/review/state.json`: jeśli plik jest śledzony, powiedz użytkownikowi wprost, że przebieg zostawił zmianę w śledzonym pliku, i zaproponuj jedno z dwóch: commit stanu razem z przeglądem albo wyjęcie pliku spod gita (`.gitignore` i `git rm --cached`). Przed `git merge` w drzewie po przeglądzie odłóż kopię `state.json` i przywróć wersję z repo.
