---
name: production-release-ships-web-and-cms-together
description: "code-busters-v2 production deploys web (Vercel) and CMS (Fly) from the same GitHub release, so merge order on main does not order production; a CMS-first rollout needs a release targeted at an earlier commit"
metadata:
  node_type: memory
  type: project
  originSessionId: e23b7736-fa57-4dcb-b8be-c6f3a768c054
  modified: 2026-11-17T19:01:16.522Z
---

`deploy-production-app.yml` and `deploy-production-cms.yml` both run on `release: types: [released]` and check out the release tag; there is no ordering between the two deploys. Pushes to `main` deploy only the preview environment (`deploy-main-app.yml`, `deploy-main-cms.yml`). Release tags look like `2026-11-17v4`.

**Why:** DT-176 (2026-11-17) planned "CMS release first, then merge the web PR" (decision V1-D3), but the web PR #1773 was merged before any release carried the CMS PR #1772. From then on, a single release from `main` ships the web query for a new CMS field together with the field, and `/courses` fails until Fly finishes.

**How to apply:** when a web change needs a CMS change live first and both are already on `main`, propose two releases: first one targeting the last `main` commit before the web merge (`gh release create <tag> --target <sha>`), with any pending `db:push` before it; then one from `main`. Check with `git tag --contains <sha>` whether a CMS commit has shipped. Related: [[w2-gate-harness-lessons]].
