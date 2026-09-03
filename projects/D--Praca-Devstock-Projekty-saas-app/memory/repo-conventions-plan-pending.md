---
name: repo-conventions-plan-pending
description: Conventions plan (20 tasks) EXECUTED 2026-08-13, committed and opened as PR 150; junk/duplicate review passed 2026-08-14
metadata:
  node_type: memory
  type: project
  originSessionId: 32340af3-f4e9-446c-9c3a-852330106d3c
  modified: 2026-08-14T09:00:02.724Z
---

Repo-conventions work: spec `docs/superpowers/specs/2026-08-12-repo-conventions-design.md` + 20-task plan `docs/superpowers/plans/2026-08-12-repo-conventions.md`, committed by Rafał (`9bf969a`).

**2026-08-13: the whole plan (Tasks 1–20) was executed inline** on `rafal-kielbasa/rules-for-project`, ~379 files in the working tree, **nothing committed**. Executed while PRs #149/#148/#146 were still open, so those will conflict hard. Every gate green: lint 0 errors (api 56 warnings, web 3 pre-existing `exhaustive-deps`), typecheck clean both apps, `format:check` clean, api 29 suites/293 tests, web 35 suites/117 tests, e2e 8 suites/72 tests, web production build OK.

**E2E now needs Redis, not just Postgres** (CP-35 redis module): `docker compose up -d --wait postgres redis`, else every suite dies with ioredis "Connection is closed" at `createTestApp`. The plan's Task 20 only mentioned postgres. The `course_platform_test` DB was also two migrations behind again — `prisma migrate deploy` against port 5434 first, as always. See [[e2e-test-db-migrations]].

Deviations from the plan worth remembering:
- Root `package.json` scripts used `--filter './apps/**'`, which matches nothing on Windows (cmd keeps the quotes) — silently no-op locally, fine on CI. Changed to `pnpm -r --if-present <script>`.
- Plan assumed 1 self-barrel import in web; there were 16 (files importing their own folder's barrel, sub-barrels importing the parent). All rewritten to direct file imports — that is what `import/no-cycle` now enforces.
- Plan listed 67 Polish test titles (diacritics only); the real count was 104.
- Comment sweep: 84 blocks/411 lines. Long reasoning moved into four new docs — `docs/rate-limiting.md`, `docs/landing-visibility.md`, `docs/tiptap-sanitizer.md`, `docs/auth-route-policy.md`.
- `docs/conventions.md` gained one rule the plan lacked: with early returns, effects sit above them (a hook after a conditional return is illegal).
- Dead barrel alias dropped: `course-details/index.ts` exported `Details` pointing at the `CourseDetails` file.

**2026-08-14: committed and opened as PR 150** (`rafal-kielbasa/rules-for-project` → `main`, 328 files, +5034/−4620). Reviewed for duplicate files and leftover junk — the rename itself is clean: no orphaned files, no near-duplicate content, no stale paths in tracked configs, all 9 new barrels imported. Three things were found and fixed in `6a28a37`: `CLAUDE.local.md` committed by accident (still tracked — remove with `git rm --cached` only, the file must stay on disk because it holds the `podsumuj-sesja-claude` marker), a leftover `format` script in `apps/api/package.json` contradicting the PR's own one-config rule, and the phantom `tokenImage` field plus `storyboardSrc="undefinded"` in `components/video-player.tsx`.

The duplicate types the review surfaced are all documented Follow-ups, not oversights — except `packages/types`, which got its own spec: [[platform-types-contract-spec]].

See [[feedback-no-commits-user-only]].
