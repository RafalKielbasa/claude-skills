---
name: shared-index-own-lines-commit
description: "When another session has uncommitted edits in the shared Baza wiedzy project index, commit only this session's lines via a staged blob, not a pathspec commit"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 73e150b5-4819-4e1d-82bc-df3ffdf3c8c3
  modified: 2026-11-10T20:44:16.918Z
---

A pathspec commit (`git -C "Baza wiedzy" commit -m … -- <index>`) commits the whole working file, so it sweeps in another session's uncommitted lines in `docs/superpowers/projects/kodozercy-platform.md`. Check `git -C … diff -- <index>` right before editing. If it is not empty and the lines are not yours:
1. `git show HEAD:<index>` to a scratch file and apply your edit there with an exact-once replace script;
2. `git hash-object -w <scratch>` then `git update-index --cacheinfo 100644,<blob>,<index>`;
3. apply the same script to the working file, confirm `git diff --cached --stat` shows only your lines, and commit with no pathspec.

**Why:** Rafał runs parallel sessions (plan 1 and plan 2 of DT-83, concept session) that all update the same index; on 2026-11-10 the other session committed between my status check and my edit, so check again just before staging.

**How to apply:** any index update in Baza wiedzy while other sessions are active. Related: [[worktree-session-git-guard]].
