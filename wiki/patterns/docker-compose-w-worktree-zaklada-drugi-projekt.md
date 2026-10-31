# docker-compose-w-worktree-zaklada-drugi-projekt

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt `dev` pakietu wywołuje `docker compose up -d <usługa>` i w worktree zakłada nowy kontener i wolumen bazy, zamiast użyć bazy z kopii głównej. Gdy port jest zajęty, start pada. Gdy port jest wolny, serwer wstaje na pustej bazie i bramka idzie na złych danych.

## Przyczyna źródłowa
Docker Compose domyślnie nazywa projekt od katalogu, z którego jest wywołany. Worktree ma inną nazwę katalogu niż kopia główna, więc `compose up` uważa usługę za nieistniejącą i tworzy ją od zera, z własnym wolumenem. Skrypt `dev` łączy ten krok ze startem serwera, więc nie widać go w poleceniu.

## Dowody
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (code-busters-v2, bramka W3):
  - `pnpm --filter @devstock/cms dev` z worktree `code-busters-app-migration-w3-profile` utworzył kontener `code-busters-app-migration-w3-profile-db-1` i wolumen `…_devstock-mysql`;
  - start padł na „Bind for 0.0.0.0:3336 failed: port is already allocated”;
  - oba zasoby sesja usunęła (`docker rm`, `docker volume rm`), a CMS wystartowała bezpośrednio: `cli.js dev --no-db-push` na istniejącej bazie `code-busters-v2-db-1`.
- 2026-10-31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, worktree W5, okno stosu), dowód zadziałania rozwiązania: przed startem CMS przeczytałem pamięć projektu (`w2-gate-harness-lessons`), sprawdziłem `docker-compose.yml` (brak `name:`) i od razu uruchomiłem `node -r ./tracer.js …/cli.js dev --no-db-push` na `code-busters-v2-db-1` — bez drugiego kontenera i bez straconej tury.

## Rozwiązanie
W worktree nie uruchamiaj skryptu `dev`, który zawiera `docker compose up`. Najpierw sprawdź `docker ps`, czy usługa kopii głównej już działa. Potem startuj sam serwer na tej usłudze, bez kroku compose i bez `db push`. Jeśli compose jest potrzebny, ustaw `COMPOSE_PROJECT_NAME` na nazwę projektu kopii głównej. Po wpadce usuń tylko kontener i wolumen, które sesja sama utworzyła; nazwy sprawdź filtrem z nazwą worktree.
