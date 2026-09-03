---
name: docker-tests-build-frontend-stage
description: "Obraz testowy buduje też frontend (tsc), więc błąd typów w web/ wywala `docker compose build tests`; nie skracać logu builda przez tail"
metadata: 
  node_type: memory
  type: project
  originSessionId: 686cfba6-8565-4752-9ec4-f8be58c01930
  modified: 2026-07-20T19:40:15.369Z
---

`docker compose build tests` przechodzi przez etap `frontend` z `npm run build`
(czyli `tsc -b`), zanim zbuduje runtime z testami backendu. Błąd typów w `web/`
— np. fixtura testowa bez nowego wymaganego pola w interfejsie — **wywala build
obrazu testowego backendu**, mimo że `npx vitest run` jest zielony (vitest nie
typuje).

**Why:** 2026-07-20 build padał po cichu przez `| tail -2`, compose zostawiał
poprzedni obraz `rota-api:latest`, a `docker compose run --rm tests` uruchamiał
**stary kod**. Wyglądało to na nieaktualny cache Dockera / zacięty file-sharing
(restart Docker Desktop i `--no-cache` nie pomogły), a naprawdę był to błąd
kompilacji ukryty w uciętym logu.

**How to apply:** po zmianie typów w `web/lib/types.ts` uruchom `cd web &&
npm run build` (nie tylko vitest). Log builda oglądaj przez `tail -20` lub
`grep -E "error|failed to solve"`, nigdy `tail -2`. Gdy testy w kontenerze
zachowują się jak sprzed zmian, sprawdź datę obrazu
(`docker images --format '{{.Repository}} {{.CreatedAt}}'`) i obecność pliku
w obrazie zamiast podejrzewać cache. Zob. [[testing-env-quirks]].
