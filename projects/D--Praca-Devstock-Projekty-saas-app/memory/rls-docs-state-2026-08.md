---
name: rls-docs-state-2026-08
description: "RLS w edu_saas: martwe z trzech powodów; apps/api/README.md jest źródłem prawdy, główny README naprawiony 2026-08-21; osierocone manual_rls_*.sql to pre-staging, nie przypadek"
metadata: 
  node_type: memory
  type: project
  originSessionId: e3afa055-3920-4197-82df-dce3f4c7f0c1
  modified: 2026-08-21T11:36:10.309Z
---

Stan RLS zweryfikowany 2026-08-21. **Nic nie egzekwuje izolacji na poziomie bazy**, z trzech
niezależnych powodów: (1) jedyna trackowana migracja `20260511132643_add_rls_and_search` włączyła
polityki na 6 tabelach, ale aplikacja łączy się jako superuser `postgres`, a superuser omija RLS bez
`FORCE ROW LEVEL SECURITY`; (2) `PrismaService` nigdy nie ustawia `app.current_tenant_id`;
(3) reszta polityk leży w 4 osieroconych plikach w `apps/api/prisma/migrations/`
(`manual_rls_courses.sql`, `manual_rls_enrollments.sql`, `manual_rls_progress.sql`, `rls_setup.sql`),
poza katalogami migracji, więc `prisma migrate deploy` ich nie rusza.

**Źródło prawdy: `apps/api/README.md`, sekcja "Database Security"** — opisuje to dokładnie i podaje
3 kroki do włączenia RLS. Nie pisz czwartego dokumentu na ten temat.

**Osierocone pliki NIE są przypadkiem.** `apps/api/README.md` ma sekcję "Pattern for new tables
(so they're ready once RLS is switched on)", więc pre-staging polityk jest zamierzony. Ale ten sam
README każe wkładać SQL **do wygenerowanego `migration.sql`**, a #152 (CP-34) zrobił osobny
`manual_rls_progress.sql` — czyli dołożył plik do sterty, którą README każe kiedyś zwinąć. To jest
uwaga do review CP-34, nie do architektury.

**Naprawione 2026-08-21 (w drzewie roboczym, niezacommitowane):** główny `README.md` sekcja 4
twierdził, że RLS to "last line of defence" i "safety net" (sprzeczność z `apps/api/README.md`),
oraz że żądanie bez użytkownika daje 400 (nieprawda: anonim rozwiązuje tenanta z subdomeny).
`docs/review-guide.md` kazał dodawać politykę RLS bez informacji, że nic nie egzekwuje i gdzie ma
trafić. Zob. [[web-security-audit-concept-frozen]], [[auth-multitenancy-audit-2026-08]].
