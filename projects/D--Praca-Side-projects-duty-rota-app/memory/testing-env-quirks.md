---
name: testing-env-quirks
description: Komendy testowe i pułapki środowiska przy uruchamianiu suit w tym repo (Git Bash + Docker + web)
metadata: 
  node_type: memory
  type: project
  originSessionId: 399dba46-5bef-4fed-92a6-d8c7fa44695e
---

Uruchamianie testów w duty-rota-app (stan 2026-07-12):

- Silnik/API z solverem tylko w Dockerze (patrz [[ortools-sigill-workers]]): `docker build -t rota-app .`, potem api: `docker run --rm rota-app python -m pytest -q`, silnik: `docker run --rm -w /app/engine rota-app python -m pytest -q`.
- **Git Bash mangluje ścieżki uniksowe w argumentach dockera** (`-w /app/engine` → `C:/Program Files/Git/app/engine`). Obejście: prefiks `MSYS_NO_PATHCONV=1` albo odpalenie przez PowerShell.
- `web/package.json` NIE ma skryptu `test` — używać `npx vitest run` (oraz `npx tsc -p tsconfig.app.json --noEmit`).
- Test integracyjny `api/tests/test_seed_generate.py` (seed + generowanie maja 2026, limit 60 s) to pierwszy podejrzany, gdyby suita api zaczęła flakować na wolniejszej maszynie.
- **Obraz `tests` z docker-compose NIE montuje źródeł** — po każdej zmianie plików trzeba `docker compose build tests` przed `docker compose run --rm tests`, inaczej testy biegną na starym kodzie (fałszywy RED/GREEN; złapane 2026-07-15 w SDD Task 7).
- Preferowana komenda suit (2026-07-15): `docker compose run --rm tests` (engine+api w jednym przebiegu); pojedynczy plik: `docker compose run --rm tests python -m pytest -q /app/api/tests/<plik>`.

**Why:** te cztery rzeczy kosztowały subagentów po kilka ślepych prób w sesji SDD.
**How to apply:** wklejać do promptów subagentów wykonujących testy; nie dodawać `2>&1` ani nie „naprawiać" ścieżek w komendach docker.
