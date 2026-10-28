---
name: worktree-session-git-guard
description: "A worktree-isolated Claude session cannot run git against the shared code-busters-v2 checkout, not even via the user's `!` commands — merges into DT-37 must be run by Rafał in his own terminal"
metadata:
  node_type: memory
  type: reference
  originSessionId: 317d7952-a172-4542-ada8-af793e2c9f74
  modified: 2026-10-27T18:50:34.922Z
---

In a background/worktree-isolated session (e.g. the W2 stream worktree under `.claude/worktrees/`), the session guard refuses any git command that targets the main checkout `D:/Praca/Devstock/Projekty/code-busters-v2` (`git -C <main> …`, compound `cd … && git …`), and it also refuses the same command typed by Rafał with the `!` prefix inside that session. Observed 2026-10-27 at the W2 merge (Task 28 Step 6).

What still works from such a session:
- read-only git in its own worktree (the repo is shared, so `git log <any branch>`, `git worktree list`, `git merge-base` see the main checkout's branches);
- `git -C` into a *different* repo (code-busters-mobile) — read-only and, via Rafał's `!`, commits there;
- `pnpm -C "D:/Praca/Devstock/Projekty/code-busters-v2" …` with a literal path (codegen, tsc, test:run, build in the main checkout) — not git, so not blocked; commands with shell variables or chains are refused as "too complex to verify".

**Why:** the hub plans put the stream merge (`git merge --no-ff` in MAIN) inside the stream session; it cannot happen there.

**How to apply:** at a merge step, give Rafał the exact `status --short` + `merge --no-ff` commands to run in his own terminal (outside Claude Code), wait for "zrobione", then verify the merge commit with `git log -1 <DT-37 branch>` and run codegen/TSC/FULL/BUILD via `pnpm -C <main>`. Related: [[w2-gate-harness-lessons]].
