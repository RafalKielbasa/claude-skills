---
name: cp26-free-content-deprioritized
description: Free/anonymous lesson content — paused after CP-26 tenant-isolation bug, unpaused 2026-08-10, plan content-without-enrollment WYKONANY 2026-08-11 (15/15, w mainie); bug history + odstępstwa w środku
metadata: 
  node_type: memory
  type: project
  originSessionId: 1e256b77-0d94-428b-9168-7ebd5ff4724e
  modified: 2026-09-04T09:20:22.771Z
---

**Update 2026-08-11: plan wykonany w całości (15/15 zadań). 2026-08-21
zweryfikowane, że jest w mainie (m.in. apps/api/test/anonymous-content.e2e-spec.ts).** Zielone: API typecheck/lint/unit (282), API e2e (71 — baza
`course_platform_test` była już zmigrowana), web typecheck/lint/test (91).
Odstępstwo od planu: strona lekcji tenanta czeka na `status !== "loading"` z
`useAuth()` przed fetchem, bo localStorage nie jest współdzielony między
subdomenami i zalogowany student zobaczyłby ekran logowania zamiast ekranu
zakupu. Zastane, NIE z tego planu: `pnpm --filter @app/web build` wywala się na
prerenderze `/login` (`useSearchParams` bez `<Suspense>`) — potwierdzone jako
wcześniejsze przez build na starym układzie katalogów. Do sprzątnięcia:
`apps/api/scripts/dev-seed-landing.ts` (jednorazowy seed dev, tenant `jan`,
UUID-y 1111…/7777…) + zaseedowane wiersze w bazie dev.

**Update 2026-08-10: temat odwieszony.** Spec zaakceptowany przez Rafała:
`docs/superpowers/specs/2026-08-10-content-without-enrollment-design.md` + plan
implementacyjny `docs/superpowers/plans/2026-08-10-content-without-enrollment.md`
(15 zadań, po review codexa — 5 uwag rozstrzygniętych). Oba pliki są w drzewie
roboczym, NIEZACOMMITOWANE. Realizuje wszystkie 4 warunki z notatki decyzyjnej
CP-26 (globalny guard + @Public/@OptionalAuth, canAccessLesson, anonimowy
tenant-resolution z ALS, krótszy TTL Mux dla free). Zakres: API w całości +
szkielet FE (rewrite subdomen w proxy na `app/tenant/[subdomain]`, ProtectedRoute
z requiredRole, placeholdery). Egzekucja planu odłożona do osobnej sesji —
Rafał wybrał "Później" przy Execution Handoff. Historia buga poniżej nadal
obowiązuje jako kontekst, czemu architektura wygląda tak, a nie inaczej.

As of 2026-07-07, free/anonymous lesson content support is paused. CP-26's `EnrollmentGuard` (apps/api/src/modules/enrollments/guards/enrollment.guard.ts) looked up lessons without filtering by `tenantId` and let a free lesson's own tenant silently override the request's tenant — anonymous/authenticated users on one tenant's subdomain could reach another tenant's free article/quiz/video content. Full review: `docs/reviews/CP-26-enrollment-guard-review-{en,pl}.md`.

**Update 2026-07-07 (later same day):** commit `020306f "revert free-preview access path"` removed the `isFree` bypass entirely (verified clean — no orphaned `OptionalJwtAuthGuard`/`request.tenantId` remnants). The critical cross-tenant *content* leak is gone. A narrower residual issue remains in the same file even for paid content: the lesson lookup is still an un-scoped `findUnique({where:{id}})` and `hasAccess()` is still called with the looked-up `lesson.tenantId` instead of `request.user.tenantId` — this is now only a cross-tenant lesson-*existence* oracle (404 vs 403), not a content leak, because video/quiz/article services independently re-scope by `tenantId_lessonId`. Flagged as Blocking (root-cause fragility) in the refreshed review doc, not urgent-critical like before.

**Why:** rather than patch the guard in place, the team decided to postpone free-content support until a proper architecture is designed — the bug came from treating "is this lesson free" as something that can redefine tenant scope, instead of keeping tenant resolution, authentication, and authorization as three independent concerns.

**How to apply:** before implementing or reviewing anything touching free/public lesson content, check that the new design follows the agreed direction (discussed in this session, not yet implemented):
- Tenant is always resolved from the request context (subdomain / `TenantContextService`), never from the resource being fetched.
- Authentication becomes globally-required-by-default with declarative opt-outs (`@Public()` / `@OptionalAuth()`) instead of a different guard combination per controller.
- A single domain policy `canAccessLesson(lessonId, tenantId, userId?)` in `EnrollmentsModule` decides access — controllers/guards stay thin adapters, not reimplementations.
- Free/public reads vs. state-mutating actions (quiz submit, progress tracking) are treated differently — public preview should stay read-only.
- Video playback tokens (Mux) for free content need separate handling (shorter TTL / separate playback policy) since a signed token is effectively a public hotlinkable URL.

Planning docs updated with this decision: `docs/superpowers/plans/2026-04-20-plan-3-payments-enrollments.md` (Task 4). The former `2026-04-20-plan-3-jira-tasks.md` (CP-26 section) no longer exists on disk (checked 2026-09-04); tickets are GitHub issues, not Jira ([[feedback-tickets-are-github-issues]]).

See also [[feedback-junior-tickets-no-code]] if this work gets broken into tickets later.
