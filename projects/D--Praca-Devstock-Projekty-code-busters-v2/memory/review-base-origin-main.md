---
name: review-base-origin-main
description: code-review-master branch runs in code-busters-v2 must use --base origin/main — the local main lags and pulls already-merged work into the plan
metadata:
  node_type: memory
  type: feedback
  originSessionId: bf5843f1-df64-4b50-917d-c53ce40a25a6
  modified: 2026-11-18T19:24:08.330Z
---

`/code-review-master branch` defaults to `--base main`, and the local `main` in code-busters-v2 is usually stale (2026-11-18: local `c03df3a6` vs `origin/main` `7ce02e5d`). The plan then covered 490 files instead of the 64 that PR #1776 actually changed. Re-planning with `--base origin/main` matched the PR.

**Why:** the user merges in GitHub and rarely pulls `main` locally; worktree sessions cannot update the main checkout (see [[worktree-session-git-guard]]).

**How to apply:** before `crm plan --mode branch`, compare `git rev-parse main origin/main` with `git merge-base HEAD origin/main`; when local `main` is behind, pass `--base origin/main` and tell the user why. Prefer `pr <n>` mode when the branch already has a PR.
