---
name: cp21-merge-resolution-2026-08-12
description: "Merge main (b07927f, po PR #144/#147) into CP-21 student-view resolved 2026-08-12; working tree only (nothing staged); decisions inside"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6f9fb8d2-9568-4a6e-85ee-c7217ed6af9e
  modified: 2026-08-12T15:48:46.508Z
---

2026-08-12: merge of main (b07927f — includes PR #144 CP-16 creator panel and PR #147 BFF/auth fixes) into `feat/norbert-musielak/CP-21-student-view` fully resolved in the working tree, deliberately NOT staged (index still shows UU entries) per [[feedback-no-commits-user-only]] — Rafał stages (`git add -A`) and commits himself.

Decisions taken (pattern follows [[pr144-merge-resolution-2026-08-12]] — main's architecture wins, branch features preserved):
- proxy.ts: main's version; CP-21's `/login`,`/register` in excludedPaths REMOVED — they dead-coded main's subdomain→apex login redirect and broke "login only on apex" (spec content-without-enrollment).
- CP-21's student views moved from `app/[subdomain]/` (deleted — root dynamic segment swallowed apex paths) into `app/tenant/[subdomain]/`; nested lesson route `courses/[courseId]/lessons/[lessonId]` kept from CP-21, main's standalone `lessons/[lessonId]` kept for apex free-lesson links.
- Tenant layout merged: main's tenant fetch + 404/503 gating + CP-21's CoursesProvider/TooltipProvider; CP-21's tree-wide ProtectedRoute DROPPED (catalog/details browsable anonymously; auth per-content).
- api-client: main's BFF client; CP-21's unused `params` option dropped; all courses-page call sites converted to leading `/api/...` and stripped of `tenantSubdomain` option (proxy injects header from Host). EnrollPanel 409 handling moved to `ApiError.status`.
- GET /courses response shape unified on CP-21's `modulesCount`/`lessonsCount` (main's `totalLessons` consumer — creator CourseList.tsx + types/courseTypes.ts — updated).
- search/courses got `@OptionalAuth()` (service returns published-only; anonymous catalog uses it) — NEW decision, flag in review.
- next.config.ts: main's narrow remotePatterns kept; added `lh3.googleusercontent.com` (creator avatars via next/image in HeroInfo/TopBar).
- video.service.ts + main.ts + spec: main wholesale (superset of CP-21's changes; Mux env names MUX_SIGNING_KEY_ID/MUX_PRIVATE_KEY per .env.example).
- Old seed.ts deleted (modular prisma/seed/ covers CP-21's content incl. quiz/article/video lessons + student accounts).

Follow-up same day: CP-21's Tiptap `Callout` extension moved out of `app/` (routing-only per convention) to `features/courses-page/lessons/lesson-content/extensions/Callout.ts`. Open product question: `callout` is NOT in the API sanitizer's ALLOWED_NODES and TextEditor can't author it — the extension is currently unreachable; whitelist+authoring or drop it.

Verified green: api+web typecheck, api 285 tests, web 117 tests, api+web lint, `next build` (route tree matches spec).
