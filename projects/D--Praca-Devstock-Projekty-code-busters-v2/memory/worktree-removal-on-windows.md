---
name: worktree-removal-on-windows
description: "Removing a finished code-busters-v2 worktree from a resumed session — ExitWorktree remove refuses, git worktree remove dies on long node_modules paths; use keep, git worktree remove, then rd with \\\\?\\"
metadata:
  node_type: memory
  type: reference
  originSessionId: 73e150b5-4819-4e1d-82bc-df3ffdf3c8c3
  modified: 2026-11-18T19:24:04.138Z
---

Removing `.claude/worktrees/<name>` after its PR is merged (observed 2026-11-10, DT-83, session 73e150b5):

- `ExitWorktree action=remove` refused: after a compaction or resume the session is "not the owner of the worktree". `ExitWorktree action=keep` works and returns the session to the main checkout, where git runs (see [[worktree-session-git-guard]]).
- `git worktree remove <path>` from the main checkout deregistered the worktree but failed with `Filename too long`: pnpm `node_modules` paths exceed the Windows limit, so the folder stays on disk.
- `cmd /c 'rd /s /q "\\?\D:\…\.claude\worktrees\<name>"'` (PowerShell) deletes the rest; then `git worktree prune` and `git branch -d <branch>`. The warning "merged to refs/remotes/origin/<branch>, but not yet merged to HEAD" is expected when the main checkout sits on another branch.

- 2026-11-17 (DT-176, session e23b7736): same path again (remove refused, keep, `git worktree remove --force` because of a modified `.claude/review/state.json`, then `rd`). `rd` emptied the folder but the empty `dt-176` folder stayed "used by another process" with no node process pointing at it (likely an editor window opened on the worktree). Before removing, copy `<worktree>/.claude/review/reports/*` (git-ignored `code-review-master` runs) to the main checkout's `.claude/review/reports/`. Squash-merged branches need `git branch -D`; first check the local head equals the PR's `headRefOid`.

- 2026-11-18 (PR #1776, session bf5843f1): dev servers started from the worktree by an earlier part of the same session (Keystone `:3001`, `next dev -p 3000`) held its files. The auto-mode classifier denied `Stop-Process` on them ("Destructive or Unwanted Actions"); Rafał ran `! taskkill //F //T //PID <bash wrapper> //PID <next parent>` himself. Then ExitWorktree remove refused (not the owner), keep, `git worktree remove --force` (Filename too long), `rd` — this time the folder vanished completely — prune, `branch -d`.

**How to apply:** before removing, check `git -C <worktree> status --short` is empty and no node process runs from the worktree (`Get-CimInstance Win32_Process` filtered on the path); git-ignored content (SDD ledger, `.env` copies) goes with the folder, so say so in the decision.
