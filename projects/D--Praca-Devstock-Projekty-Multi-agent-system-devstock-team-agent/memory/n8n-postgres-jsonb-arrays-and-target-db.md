---
name: n8n-postgres-jsonb-arrays-and-target-db
description: "Postgres node: resource mapper (Insert) can never write a top-level JSON array to jsonb — use Execute Query; and the local docker DB is not the user's prod"
metadata: 
  node_type: memory
  type: project
  originSessionId: 71993607-9d04-4393-a6b3-9354153ff184
  modified: 2026-07-27T10:40:17.249Z
---

Dwie rzeczy o node'zie Postgres w tym projekcie (ustalone 2026-07-27 przy naprawie `Insert Daily Summary` w `30_daily_pipeline`):

**1. Resource mapper (operation `insert`) nie zapisze tablicy JSON do kolumny `jsonb`.**
`Postgres/v2/methods/resourceMapping.js` mapuje `json`/`jsonb` → typ pola `object`, a każde wykonanie przechodzi przez `validateFieldType` → `tryToParseObject` (`n8n-workflow/dist/cjs/type-validation.js`), które **jawnie odrzuca tablice** — i surową (`!Array.isArray(value)`), i sparsowaną ze stringa (`if (typeof o !== 'object' || Array.isArray(o)) throw`). Więc ani `JSON.stringify(arr)`, ani goła tablica nie przejdą; błąd to `'<kolumna>' expects a object but we got …`. Obejście = `operation: executeQuery` z `$1..$n` i castem `$n::jsonb`, wartości jako **jedno wyrażenie zwracające tablicę** (`={{ [a, b, c] }}`) — string z przecinkami n8n dzieli przez `stringToArray` i rozjeżdża parametry. Wszystkie pozostałe node'y Postgres w repo (18, 26, 31, 35) i tak używają `executeQuery`. Zob. [[n8n-expression-gotchas]].

**2. Baza w `devstock-team-agent-postgres-1` to NIE jest prod użytkownika.**
Insert, który u niego wywalał się na `daily_summaries.id` (NOT NULL, brak DEFAULT), nie zostawił w niej żadnego śladu: brak linii ERROR w `docker logs` (ten Postgres ma `logging_collector=off`, `log_destination=stderr` i loguje ERROR + STATEMENT — sprawdzone celowym `SELECT 1/0`), brak zużycia `daily_summaries_id_seq`, brak wpisu w `execution_entity`. Lokalnie `id` ma `nextval(...)`, na prodzie najwyraźniej nie. **Nie zakładaj, że dry-run na dockerowej bazie dowodzi czegokolwiek o prodzie** — schematy się różnią.

**Jak weryfikować bez zapisu:** `docker exec -i devstock-team-agent-postgres-1 psql -U n8n -d n8n` z `BEGIN; <query>; <query>; ROLLBACK;` — dwa przebiegi sprawdzają naraz poprawność i idempotencję (`INSERT 0 3` → `INSERT 0 0`). Uwaga: rollback i tak konsumuje `nextval`, więc licznik sekwencji rośnie.
