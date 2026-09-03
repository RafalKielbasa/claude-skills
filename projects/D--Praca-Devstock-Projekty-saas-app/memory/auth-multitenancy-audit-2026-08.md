---
name: auth-multitenancy-audit-2026-08
description: "Wyniki audytu auth/multitenancy (2026-08-07, potwierdzone przez codex) — co naprawiono, co zostaje jako decyzje architektoniczne"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7713c74c-e0b1-4994-b94d-327e781fa3a4
  modified: 2026-08-21T10:21:03.640Z
---

Audyt FE->BE auth + multitenancy (2026-08-07), 13/13 tez potwierdzonych przez codex CLI.

Naprawione — 2026-08-21 zweryfikowane, że SĄ w mainie (weszły commitem c6c2ee8 #147; claim `type` widoczny w auth.service.ts:163):
- refresh nie ustawiał nowego cookie po rotacji (sesja umierała po ~30 min) — auth.controller
- refresh token działał jako access token — dodany claim `type` (access/refresh), wymagany w JwtStrategy/refresh/logout; unieważnia stare tokeny
- stale tenantId po rejestracji tenanta — JwtStrategy bierze tenant z DB (include tenant)
- proxy.ts ustawiał x-tenant-subdomain na response zamiast na forwardowanym request
- CORS: pojedynczy origin -> callback z obsługą subdomen przez env APP_DOMAIN (nowa zmienna, opcjonalna)
- cookie: maxAge 7d, ujednolicone sameSite strict; FE logout czyści localStorage w finally; single-flight refresh w api-client

Dopisane 2026-08-12 przy review PR #144 (potwierdzone w kodzie i przez codex CLI):
- `TenantAccessGuard` (apps/api/src/tenants/guards/tenant-access.guard.ts) sprawdza tylko, czy tenant z requestu istnieje i ma aktywną subskrypcję — NIGDY nie porównuje `request.user.tenantId` z rozwiązanym `tenantId`. To samo spostrzeżenie jest prawdziwe.

  **SKORYGOWANE 2026-08-13: przypisana mu konsekwencja była błędna.** Scenariusz "creator z tenanta A uderza w subdomenę B i czyta/modyfikuje kursy B" jest NIEREPRODUKOWALNY. `@TenantId()` (auth/decorators/tenant-id.decorator.ts:17) deleguje do `TenantResolverService.resolveTenantId()`, który dla roli `creator` zwraca `user.tenantId` z tokenu, czyli zawsze własnego tenanta (auth/services/tenant-resolver.service.ts:14-20); z subdomeny rozwiązywani są tylko student, super_admin i anonim. Wszystkie kontrolery biorą tenanta przez `@TenantId()`, żaden nie czyta `req.tenantId` z middleware. Zachowanie jest celowe i pokryte testami (tenant-resolver.serice.spec.ts:37-45), przyszło z CP-73 (commit 1040d11) — czyli CP-73 nie jest warunkiem wstępnym CP-83, tylko go uprzedził.

  Co zostaje jako realne ryzyko: izolacja twórców opiera się na sposobie rozwiązywania tenanta, a nie na autoryzacji, i jest poprawna tylko dlatego, że `Tenant.creatorUserId` jest `@unique`. Przy wielu użytkownikach w tenancie `user.tenantId` przestaje być jednoznaczne i ta ochrona znika — wtedy `canViewUnpublishedCourses` (modules/courses/courses.service.ts:52), patrzące wyłącznie na globalną rolę, staje się faktyczną dziurą.
- Brak ownership authorization między creatorami w jednym tenantcie (serwisy mutują po `(id, tenantId)`, bez `creatorId`). Czy rola `creator` ma być tenant-wide, to otwarte pytanie produktowe do Rafała, nie bug do cichej naprawy.
- Kluczowa przeszkoda dla obu: **nie ma modelu członkostwa user-tenant**. Relacja `User.tenant` to `CreatorTenant`, czyli własność tenanta, więc claim `tenantId` ma tylko założyciel studia (student i twórca-nie-założyciel nie mają nic). Naiwne wymuszenie `user.tenantId === tenant z requestu` zamknie studentom dostęp na zawsze, dlatego musi iść w parze z CP-73.
- Tickety rozpisane 2026-08-12 w `docs/superpowers/plans/2026-08-12-security-hardening-jira-tasks.md`: CP-83 (tenant binding, 5 SP), CP-84 (ownership, 3 SP, startuje od decyzji produktowej), CP-85 (idempotencja webhooka Mux, 2 SP). Numery CP-83/84/85 są propozycją z maksimum w docs (CP-82) i wymagają potwierdzenia w Jirze.

Otwarte decyzje architektoniczne (NIE ruszane):
- RLS jest martwe: polityki w prisma/migrations/manual_rls_*.sql nieaplikowane przez Prisma Migrate, PrismaService nie ustawia app.current_tenant_id; README API twierdziło że działa (poprawione). Naturalny krok: Prisma client extension na bazie istniejącego ALS (TenantContextService)
- dla studentów tenant scope w 100% z nagłówka x-tenant-id (client-controlled) — izolacja zależy od dyscypliny zapytań po (id, tenantId); EnrollmentGuard/hasAccess poprawne
- FE nadal nie wysyła x-tenant-id (widoki studenckie nie istnieją); kanał: proxy forwarduje x-tenant-subdomain do server components, klient musi podawać tenantSubdomain do apiRequest
- prod: API i web na *.run.app to cross-site (PSL) — refresh cookie nie będzie wysyłane; wymagany wspólny apex (domain mapping)
- access token w localStorage (XSS), token OAuth w URL fragment
