---
name: worktree-removal-on-windows
description: "Removing a finished code-busters-v2 worktree from a resumed session — ExitWorktree remove refuses, git worktree remove dies on long node_modules paths; use keep, git worktree remove, then rd with \\\\?\\"
metadata:
  node_type: memory
  type: reference
  originSessionId: 73e150b5-4819-4e1d-82bc-df3ffdf3c8c3
  modified: 2026-11-10T21:35:19.482Z
---

Removing `.claude/worktrees/<name>` after its PR is merged (observed 2026-11-10, DT-83, session 73e150b5):

- `ExitWorktree action=remove` refused: after a compaction or resume the session is "not the owner of the worktree". `ExitWorktree action=keep` works and returns the session to the main checkout, where git runs (see [[worktree-session-git-guard]]).
- `git worktree remove <path>` from the main checkout deregistered the worktree but failed with `Filename too long`: pnpm `node_modules` paths exceed the Windows limit, so the folder stays on disk.
- `cmd /c 'rd /s /q "\\?\D:\…\.claude\worktrees\<name>"'` (PowerShell) deletes the rest; then `git worktree prune` and `git branch -d <branch>`. The warning "merged to refs/remotes/origin/<branch>, but not yet merged to HEAD" is expected when the main checkout sits on another branch.

**How to apply:** before removing, check `git -C <worktree> status --short` is empty and no node process runs from the worktree (`Get-CimInstance Win32_Process` filtered on the path); git-ignored content (SDD ledger, `.env` copies) goes with the folder, so say so in the decision.
