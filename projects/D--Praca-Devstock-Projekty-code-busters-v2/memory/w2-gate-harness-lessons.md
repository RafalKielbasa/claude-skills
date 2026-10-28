---
name: w2-gate-harness-lessons
description: Pitfalls the W2 visual gate run hit (2026-10-27) that the W3/W4 gate runs of the e2e/gate harness will meet again
metadata:
  node_type: memory
  type: project
  originSessionId: 317d7952-a172-4542-ada8-af793e2c9f74
  modified: 2026-10-27T18:50:47.678Z
---

W2 needed three gate runs; the failures were real or harness gaps, not flakes:
- Tailwind is pinned at 3.3.2: 3.4 utilities (`h-dvh`, `size-*`, `text-balance` …) and steps missing from the project scales (`min-h-48`, `min-w-40`, `/15` opacity) compile to nothing silently; tests that assert class names pass anyway. `__tests__/utils/tailwindWorkspace.test.ts` compiles classes against the real config — extend it for new risky classes.
- `CourseProgressModals` opens the "Oceń kurs!" dialog on lesson routes for the admin seed (~94 % progress); the harness now presets `courseModalsShown-<courseId>` per case and keeps one `course-opinion-dialog` route.
- The learner account (`codinggenius@techworld.com`) lands on the onboarding survey gate unless `seed-gate-account.js --learner --apply` skips its surveys; re-run both seeds right before a gate run.
- Vimeo in headless Chromium hits a Cloudflare challenge (401, `%c` logs, CSP `data:` errors); `player.vimeo.com` / `challenges.cloudflare.com` are classified as environment in `network.ts`/`report.ts`.
- Light theme: `success`, `accent`, `signal` fail 3:1 as icon/text colours on light surfaces; use the `*-ink` tokens (`success-ink`, `accent-ink-lg`, `info`).
- Look at two captures per screen type before calling a run clean: the report cannot see a dialog covering the page or a seed artefact (e.g. the solved match task has no saved pairs, so no edges).

**Why:** each item cost a gate run in W2. **How to apply:** before the W3/W4 gate, check these first. Related: [[worktree-session-git-guard]].
