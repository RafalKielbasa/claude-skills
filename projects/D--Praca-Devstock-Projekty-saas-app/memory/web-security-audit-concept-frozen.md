---
name: web-security-audit-concept-frozen
description: "Audyt bezpieczeństwa WEB (cross-tenant / blokowanie tras / dostęp per tenant) — WYKONANY 2026-08-13 po merge'u CP-16/21; 1 realny HIGH (A1), reszta safe/fragile-by-design"
metadata:
  node_type: memory
  type: project
  originSessionId: 2eddfd6a-8a2f-4fe9-bf5b-3ac1cf4b28a2
  modified: 2026-08-21T10:21:08.584Z
---

**Update 2026-08-13: audyt WYKONANY** (był zamrożony, warunek wznowienia = merge CP-16 #144 / CP-21 #145 spełniony). 3 obszary z pytania Rafała: cross-tenant, blokowanie tras FE, gating treści BE + model tenant→subskrypcja. Weryfikowane bezpośrednio w kodzie (2 subagenty Explore + własna kontrola file:line).

**Update 2026-08-21: A1 naprawione POŁOWICZNIE w mainie.** Oba save() robią upsert po composite `tenantId_lessonId` + jest `@@unique([tenantId, lessonId])` — cross-tenant NADPISANIE zablokowane. Zostaje: save() nadal bez validateBelongsToTenant na lekcji, FK nadal po samym `lesson_id` i `lessonId` nadal globalnie `@unique` (schema.prisma:180,194) → creator A może UTWORZYĆ artykuł/quiz do cudzej lekcji, która jeszcze go nie ma; `LessonsService.findOne` (lessons.service.ts:93-98) dołącza articleContent/quiz po samym lessonId → defacement u B + trwały DoS zapisu B (P2002→500). Fix bez zmian: validateBelongsToTenant w obu save() + composite FK jak w Progress, zdjąć pojedynczy unique.

**Jedyny nowy realny bug (HIGH): A1 cross-tenant write.** `ArticlesService.save` (articles.service.ts:21-36) i `QuizzesService.save` (quizzes.service.ts:57-72) robią `upsert` bez `validateBelongsToTenant(lesson, id_tenantId)` — w przeciwieństwie do `VideoService.createUploadUrl` (video.service.ts:28-37), które ten check ma. FK na `article_content`/`quizzes` jest na samym `lesson_id` (nie composite), a `lesson_id` jest globalnie unique (`*_lesson_id_key` nadal istnieje mimo dołożonego composite w migr. 20260621*). Skutek: creator A robi `PUT /lessons/<lekcja-B>/article` swoim tokenem → tworzy wiersz (tenant_id=A, lesson_id=lekcja B). `Lesson.articleContent` łączy po samym lesson_id → treść A pokazuje się na brandowanej stronie B (defacement/phishing, nie XSS — sanitizer OK). Plus trwały DoS: B nie zapisze własnego artykułu tej lekcji → P2002 → 500 bez handlera. ID lekcji ofiary z zerowym auth: `GET /landing/lessons` (@Public) albo `GET /courses/:id` anonimowo z x-tenant-subdomain. Fix: dodać `validateBelongsToTenant` do obu save() + composite FK `(lesson_id, tenant_id)` jak w `progress`.

**Safe-by-design (potwierdzone):** izolacja creatorów (resolver zwraca user.tenantId dla creatora, header ignorowany — courses.e2e:313), `canAccessLesson` tenant-scoped-first (brak oracle 404/403 — poprzedni bug FIXED), uploady scoped `thumbnails/<tenantId>/<uuid>`, Mux signed 10m free, wszystkie CRUD po composite `id_tenantId`, proxy web stripuje kliencki x-tenant-subdomain. Q7 „creator widzi cudze drafty" NIE reprodukuje.

**Korekty do [[auth-multitenancy-audit-2026-08]]:** RLS NIE jest w 100% martwe — 6 tabel (courses/sections/lessons/video_assets/article_content/quizzes) MA polityki via TRACKED migr. 20260511132643, ale inertne (superuser + nikt nie ustawia app.current_tenant_id). manual_rls_*.sql / enrollments/tenants/users/progress nadal bez RLS. `req.tenantId` z middleware jest martwe (pisane, nigdzie nie czytane).

**Fragile-by-design (działa dziś, pęknie przy zmianie):** C4 creator na cudzej subdomenie na @OptionalAuth katalog → widzi katalog A pod brandem B (rozjazd danych, nie leak); dodanie @Public do trasy z @TenantId cicho przełącza creatora z JWT-tenant na header-tenant i wyłącza TenantAccessGuard; `enrollments.tenant_id` bez FK w ogóle.

Model tenant→subskrypcja: patrz [[tenant-subscription-model-audit-2026-08]]. FE routing/flicker: patrz [[fe-tenant-routing-decisions]]. Pełna checklista 32-pkt w Obsidianie edu-saas-sesje.md 2026-08-13.
