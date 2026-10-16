---
name: dt37-galaz-biblioteki
description: Library work in code-busters-v2 and code-busters-mobile stays on feat/rafal-kielbasa/dt-37-design-system-tokens; no merge to main until the component library is done
metadata:
  node_type: memory
  type: project
  originSessionId: 7875e423-9ae8-4e55-a56b-31766c608f4e
  modified: 2026-10-16T09:47:47.998Z
---

Since 2026-10-16 (Rafał): the component library (#665, direction 8 „Pikselowe pola”, dark + light theme) and the related screen work go on the existing branch `feat/rafal-kielbasa/dt-37-design-system-tokens` in both code repos (web `code-busters-v2`, mobile `code-busters-mobile`). PRs #1652 (web) and #403 (mobile) are not merged to `main` until at least the component library is finished.

**Why:** Rafał wants one integration branch per repo for the whole design-system section of work, merged once, not piecemeal.

**How to apply:** start new library/screen streams from this branch (sub-branches or worktrees merged back into it), never from `main`; do not propose merging the PRs before the library is done. Collisions to watch: K. Kozłowski's `feature/remove-learning-path` (#1647, 92 files in `packages/ui`) and Wiktor's subscription stack #1653–#1657 (server paywall, `/pricing`, checkout). Related: [[tryb-commitow-per-repo]].
