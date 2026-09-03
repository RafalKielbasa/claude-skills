---
name: subagents-shared-worktree-checkout
description: Subagents run in the shared repo and can switch branches in the working tree unless isolated
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 813a9f9b-8133-4f84-8644-a8e583ec4130
---

When dispatching subagents (Agent tool) without `isolation: "worktree"`, they operate in the SAME working tree as the main session. A reviewer subagent ran `git checkout <sha>` then `git checkout main` to inspect a diff, leaving the shared working tree on `main` (the feature branch and its commits were intact — nothing lost, but the working tree silently changed under me).

**Why:** Non-isolated agents share the repo; any `git checkout`/`switch`/`reset` they run affects the parent session's working tree.

**How to apply:** For review/inspection subagents, tell them to use `git show`/`git diff <sha>..<sha>` WITHOUT changing the checked-out branch (no `git checkout`). For independent implementation agents that might mutate git state, prefer `isolation: "worktree"`. After subagent batches, verify `git branch --show-current` before continuing (e.g., before finishing-a-development-branch). Related: [[design-system-foundations-work]]
