---
name: e2e-test-db-migrations
description: API e2e needs migrations applied separately to course_platform_test; no pretest script does it
metadata: 
  node_type: memory
  type: project
  originSessionId: f0e63885-e66e-4a25-8f64-b523129fdb21
  modified: 2026-08-13T22:05:39.755Z
---

Testy e2e w `apps/api` używają osobnej bazy `course_platform_test`
(`apps/api/.env.test`, port 5434 z root `docker-compose.yml`), a **żaden skrypt
npm/pnpm nie aplikuje na nią migracji** — nie ma `pretest:e2e`. Po każdej nowej
migracji baza testowa dryfuje i cała suita pada w `beforeAll` na błędzie Prismy
o brakującej kolumnie, co wygląda jak zepsuty kod, a nie jak zepsute środowisko.

**Why:** 2026-08-10 baseline e2e padł 8/8 na `The column tenants.activated_at
does not exist` — brakowały 2 migracje (m.in. `add_tenant_activated_at` z grace
period). Sam kod był sprawny; po aplikacji migracji od razu 8/8 zielone.

**How to apply:** przed uruchomieniem e2e (po `docker compose up -d --wait postgres redis` w rootcie — **redis też jest wymagany** od modułu CP-35, bez niego wszystkie suity padają na ioredis „Connection is closed" w `createTestApp`):

```
cd apps/api && DATABASE_URL="postgresql://postgres:password@localhost:5434/course_platform_test" pnpm prisma migrate deploy
```

Potwierdzone ponownie 2026-08-13: znowu brakowały 2 migracje (`add_progress_model`, `add_tenant_id_index_to_enrollments`); po deployu 8 suit / 72 testy zielone.

Osobna sprawa: w suicie `courses.e2e-spec.ts` test `should generate a Mux upload
URL for a video lesson` pada lokalnie zawsze — `video.service.ts` woła
`getOrThrow('NEXT_PUBLIC_APP_DOMAIN')`, a lokalne `.env` ma placeholdery (patrz
[[api-boot-env-requirements]]). To znany szum, nie regresja.
