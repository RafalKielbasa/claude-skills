---
name: platform-types-contract-spec
description: "2026-08-14 spec for reviving @platform/types as a web-only contract + api-side drift guard; written, awaiting Rafał's review, nothing implemented"
metadata: 
  node_type: memory
  type: project
  originSessionId: 02304d74-0cde-4ba5-80ce-de0565051a16
  modified: 2026-08-14T09:00:15.495Z
---

Spec `docs/superpowers/specs/2026-08-14-platform-types-contract-design.md` (2026-08-14, committed in `6a28a37`). Narrows Follow-up 2 of the conventions spec.

**Status: written, awaiting Rafał's review. No implementation started** — the brainstorming approval gate was left closed on purpose, and he never answered the approval question. Next step after his approval is `writing-plans`, then the `codex` plan review per global CLAUDE.md.

Decisions already made interactively (do not re-litigate): scope = only genuinely duplicated types; architecture = variant B, package stays raw-TS and web-only, api keeps its DTOs and gets a compile-time drift guard; `UserRole` stays in the package because web cannot reach `@prisma/client`.

**The constraint the whole design rests on, verified experimentally rather than assumed:** a `type`-only import from `packages/types` into `apps/api` relocates the entire build output (`dist/src/main.js` → `dist/apps/api/src/main.js`) and breaks `start:prod`, because api's tsconfig has no explicit `rootDir` and infers it from the common ancestor of program inputs. Under `--noEmit` it is clean — the hazard is confined to emit. That is why the guard lives in `apps/api/test/`, which `tsconfig.build.json` excludes but `tsc --noEmit` includes.

Open threads it deliberately does not settle: `playback-token` vs `tokens` in the creator-side Mux player (typecheck passes, runtime unverified), and whether `ProtectedRoute` should accept `super_admin`.

2026-08-21: spec got Follow-up 4 (uncommitted) — interaction note with
[[user-tenant-membership-decisions]]: membership stage 3 drops `UserRole`
for `MembershipRole` + `PlatformRole`; deployment order left open.

Related: [[repo-conventions-plan-pending]].
