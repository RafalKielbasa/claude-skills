---
name: pr144-merge-resolution-2026-08-12
description: "PR 144 (CP-16 creator panel) merge with main c6c2ee8 resolved 2026-08-12, staged but uncommitted; BFF alignment decisions inside"
metadata: 
  node_type: memory
  type: project
  originSessionId: a49f1827-8131-44f0-8b02-72e3b83c6dd9
  modified: 2026-08-12T10:47:41.380Z
---

2026-08-12: merge of main (c6c2ee8, PR #147 BFF pattern) into `feat/konrad-krzeczkowski/CP-16-content-creator-panel` (PR #144) fully resolved and staged, left uncommitted per [[feedback-no-commits-user-only]].

Decisions taken:
- 5 git conflicts resolved in favor of main's architecture (global JwtAuthGuard + @Public/@OptionalAuth, subdomain-aware CORS, modular seed/ replacing seed.ts).
- Konrad's `googleRegister → logout()` debug hack in CreatorRegisterForm was dropped (main's BFF version restored Google OAuth redirect).
- Route collision fixed: PR 144's creator panel moved from `(private)/creator/*` to `(apex)/creator/*`; merged layout = PR 144 shell (Sidebar/CreatorPanel/BreadcrumbProvider) + `requiredRole="creator"` from main.
- 6 PR-144 files converted from NEXT_PUBLIC_API_URL + manual fetch to `apiRequest` (useCourse.ts, Courses.tsx, NewCourseForm.tsx, LessonEditor.tsx, VideoLessonEditor.tsx, VideoPlayer.tsx).

Verified green: web+api typecheck, web lint, web 114 tests, api 282 tests, `next build`. The pre-existing main bug (build failed prerendering /login and /register — useSearchParams() without Suspense; CI never runs next build) was fixed same day by wrapping <Login/> and <RegistrationWrapper/> in <Suspense> in their page files; left UNSTAGED so Rafał can commit it separately from the merge commit.
