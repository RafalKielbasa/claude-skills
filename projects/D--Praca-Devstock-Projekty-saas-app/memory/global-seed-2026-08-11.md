---
name: global-seed-2026-08-11
description: "New modular prisma/seed/ (3 tenants, 7 accounts, 9 courses) executed and verified; committed to main; replaces old seed.ts and dev-seed-landing.ts"
metadata: 
  node_type: memory
  type: project
  originSessionId: d1207769-65d3-4f63-bbb5-4038dd17170e
  modified: 2026-08-21T10:20:56.593Z
---

2026-08-11: rozbudowany globalny seed wykonany planem `docs/superpowers/plans/2026-08-11-global-seed.md` (spec obok w specs/). Stan: **zacommitowane, jest w mainie** (zweryfikowane w HEAD 2026-08-21 — apps/api/prisma/seed/ komplet 9 plików).

- `apps/api/prisma/seed/` — ids.ts (jedyne źródło UUID; prefiksy a1/b1/c1/d1/e1), helpers.ts, users.ts, tenants.ts, catalog-demo.ts, catalog-others.ts, enrollments.ts, index.ts, verify.ts (31 checków; `npx ts-node prisma/seed/verify.ts`).
- Seed odpalany przez `npx prisma db seed`; Prisma 7 czyta komendę z **prisma.config.ts** (nie z package.json — oba zaktualizowane). Stary `prisma/seed.ts` i `scripts/dev-seed-landing.ts` usunięte.
- Konta: admin@platform.local, creator@{demo,kuznia,zawieszona}.local, student@{demo,kuznia}.local, nowy@demo.local — wszystkie `Password1!`. Tenant `zawieszona` w grace (paymentFailedAt = seed − 1 dzień; okno 3 dni, re-run odświeża).
- Lokalna baza dev była zresetowana (migrate reset za zgodą Rafała) — fixed UUID z ids.ts obowiązują. Uwaga na zombie advisory-lock Prismy przy resetach (ubijanie backendów pomogło).
- Manualny smoke przez API (Task 7 Step 5 planu) nie był wykonywany — tabela wywołań w planie.
- Dla committera: `apps/api/package.json` i `README.md` zawierają też niepowiązane hunki z gałęzi auth — stage'ować osobno.

**Why:** kolejna sesja nie powinna re-implementować seeda ani szukać, czemu stare ID (a0/b0/c0, 1111…) zniknęły.
**How to apply:** dane testowe/e2e brać z `prisma/seed/ids.ts` (import, nie kopiowanie literałów); świeży stan = `npx prisma migrate reset`.
