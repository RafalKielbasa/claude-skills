---
name: w2-gate-harness-lessons
description: Pitfalls the W2 and W3 visual gate runs of the e2e/gate harness hit (2026-10-27/29) that the W4 gate run will meet again
metadata:
  node_type: memory
  type: project
  originSessionId: 317d7952-a172-4542-ada8-af793e2c9f74
  modified: 2026-10-31T10:48:05.455Z
---

W2 needed three gate runs and W3 two; the failures were real or harness gaps, not flakes:
- Tailwind is pinned at 3.3.2: 3.4 utilities (`h-dvh`, `size-*`, `text-balance` …) and steps missing from the project scales (`min-h-48`, `min-w-40`, `/15` opacity) compile to nothing silently; tests that assert class names pass anyway. `__tests__/utils/tailwindWorkspace.test.ts` compiles classes against the real config — extend it for new risky classes.
- Custom screens (`packages/tailwind-config/tokens/screens.ts`): `2xl` is **1440px** = the gate desktop viewport, so `2xl:` is ON at 1440; use `3xl` (1700) or `395` (1580) for "wider than the gate desktop" (W3 profile summary).
- `CourseProgressModals` opens the "Oceń kurs!" dialog on lesson routes for the admin seed (~94 % progress); the harness presets `courseModalsShown-<courseId>` per case and keeps one `course-opinion-dialog` route.
- The learner account (`codinggenius@techworld.com`) lands on the onboarding survey gate unless `seed-gate-account.js --learner --apply` skips its surveys; re-run the seeds right before a gate run (W3 adds `--marketplace --private-profile --card`; `--learner` must precede `--marketplace`).
- Vimeo in headless Chromium hits a Cloudflare challenge; `player.vimeo.com` / `challenges.cloudflare.com` are environment in `network.ts`/`report.ts`.
- Light theme: `success`, `accent`, `signal` fail 3:1 as icon/text colours on light surfaces; use the `*-ink` tokens. `coin` has no ink token: it passes on `surface` (3.34:1) but not on the light page background (2.84:1) — keep coin icons on a `Panel`.
- Headless UI `Dialog` root is zero-size (children are `fixed`): wait for a visible element inside `[role="dialog"]`, not for the root.
- `PPNeueMontreal-Bold` exists only as `.otf`; the old collectible `Card` artwork requested missing woff2/woff (fixed in W3 `281c2238b`).
- Check phone PNG widths (PNG header bytes 16–19) — a capture wider than 390 px means a table widens the document.
- Look at two captures per screen type before calling a run clean: the report cannot see a dialog covering the page, a squeezed layout, or a seed artefact.
- Local stack from a worktree: `pnpm --filter @devstock/cms dev` runs `docker compose up -d db` under the worktree's compose project and creates a second DB container/volume that fails on :3336 — start Keystone directly (`pnpm --filter @devstock/cms exec node -r ./tracer.js node_modules/@keystone-6/core/bin/cli.js dev --no-db-push`) against `code-busters-v2-db-1`.
- Processes: the permission classifier refuses `Stop-Process`/`taskkill` even on the session's own orphaned servers, and `TaskStop` on a background `pnpm start` leaves the `next start` node child alive on :3000. W5 (2026-10-31) fix: start servers as a direct node command in a background Bash task (`node node_modules/next/dist/bin/next start -p 3000`, `node -r ./tracer.js node_modules/@keystone-6/core/bin/cli.js dev --no-db-push`); then `TaskStop` frees the port, so CMS restarts (paywall flag via `SERVER_PAYWALL_ENABLED=true` in the process env, no `.env` edit) need no help. For orphans, ask Rafał to run `! taskkill //PID <pid> //T //F`.
- After merging `main` changes that touch `apps/cms/schema.prisma`, the shared local DB needs `keystone prisma db push` (on Rafał's word; may need `--accept-data-loss`): otherwise Prisma P2022 and resolvers like `PendingSurvey` swallow the error and return null, so screens silently lose data and a gate still passes. Check the schema is pushed before a gate run.

**Why:** each item cost a gate run or a stall in W2/W3. **How to apply:** before the W4 gate, check these first. Related: [[worktree-session-git-guard]].
