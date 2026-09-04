---
name: student-tenant-resolution-blocker
description: Students have no tenantId in JWT so every @TenantId() content read 400s — CP-73/74 backend tickets unblock CP-21 student views; enroll has no price gate
metadata: 
  node_type: memory
  type: project
  originSessionId: 42081904-1ae7-44ca-9980-df3af20a7006
  modified: 2026-09-04T09:20:37.776Z
---

As of 2026-07-09, student-facing reads are hard-blocked on the backend: `@TenantId()` reads only
the JWT claim, and `AuthService.generateTokens()` sets it from the `CreatorTenant` relation — so
**only tenant creators get a `tenantId`**. A student gets 400 ("Tenant ID is required") on
`GET /courses`, course details, enroll, search (401 there), etc. `TenantContextMiddleware`
(header `x-tenant-id` = subdomain → `TenantContextService`) exists but is not wired into
`@TenantId()`.

Payments FE tickets (written 2026-07-09; the `…-frontend-payments-jira-tasks.md` working file is gone, tickets are GitHub issues, not Jira — [[feedback-tickets-are-github-issues]]):
**CP-75** (BE, 2 SP: plan param for `POST /payments/subscription` which today has a single
STRIPE_PRICE_ID + 409 when tenant active; Stripe return URLs with context, today static shared
`/payments/success|cancel`; `GET /enrollments/me` must include course data, today bare
enrollments) blocks full **CP-30** (subscription plans page, 3 SP) and **CP-31** (purchase page +
/payments returns + My courses, 3 SP; also blocked by CP-73 and CP-28 webhook). Coordinate CP-75
with the rescoped CP-28/29 work before starting.

Creator/student view tickets (written 2026-07-09; the `…-creator-student-views-jira-tasks.md` working file is gone):
- **CP-73** (BE, 3 SP): tenant from request context for student reads + fix EnrollmentGuard scoping
  (residual 404/403 oracle from [[cp26-free-content-deprioritized]]). Blocks CP-21.
- **CP-74** (BE, 1 SP): playback response must include `playbackId` (today only `{ token }`,
  `muxPlaybackId` exposed nowhere) + distinguishable video states (waiting/errored/ready vs one 404).
- **CP-16** (FE creator dashboard, 5 SP): NOT blocked — creators have the claim. Figma nodes 59-7 /
  64-7 / 65-7. Gaps noted in ticket: no course-structure screen in Figma; no file-upload endpoint
  (StorageModule has no controller) so thumbnail = URL field, not dropzone.
- **CP-21** (FE student catalog/details/player, 5 SP): blocked by CP-73 (+CP-74 for video). Figma
  45-8 / 91-7 / 97-7. Scope cuts: progress bar & "Oznacz ukończone" (CP-38/39), paid checkout CTA
  (CP-31), "Moje kursy" (CP-31), anonymous access (frozen free content).

Also found: **`POST /courses/:courseId/enroll` has no price check** — any logged-in user can
enroll in a paid course for free; the Stripe checkout path (CP-27) is parallel, nothing forces it.

**Decision 2026-07-09 (Rafał + team): do NOT write a separate fix ticket.** The scope of CP-27
was changed with the team; the complete payments flow (including closing this hole) is expected
to be done once CP-29 lands. **If the vulnerability still exists after CP-29, it gets enforced
as a blocking finding in review** (of CP-28/29). How to apply: when reviewing CP-28/29 or
anything touching enroll/payments after CP-29, explicitly re-test free enrollment into a paid
course and block the review if it still passes.

Figma note: the MCP top-level page listing for file `zVmr90NcDZkrG6siiRIuot` returns only 3 pages
(stale index), but direct node-id fetches work — the screen pages from
[[figma-design-system-library]] all verified live (45:8, 59:7, 64:7, 72:7, 106:246 spot-checked).
The `.dsb-state-udu-ds.json` ledger is stale too (stops at early components).
