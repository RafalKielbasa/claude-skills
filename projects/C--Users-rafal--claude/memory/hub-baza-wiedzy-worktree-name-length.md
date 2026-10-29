---
name: hub-baza-wiedzy-worktree-name-length
description: "In Baza wiedzy a hub session name (= worktree folder) over ~37 chars makes the worktree checkout exceed Windows MAX_PATH; keep `baza-wiedzy-<slug>` short"
metadata:
  node_type: memory
  type: project
  originSessionId: 0fdd3e93-315f-473f-aa53-b9a0e8bf7948
  modified: 2026-10-29T15:27:10.940Z
---

On 2026-10-29 `HUB launch` of `baza-wiedzy-kodozercy-w3-close-w4-plan` returned `ok`, but the session died with "exit 1 ×2 — worktree_create": the branch `worktree-…` was created, the folder was not. The repo's longest tracked path is 173 chars and the prefix `D:/Praca/Devstock/Baza wiedzy/.claude/worktrees/<name>/` was 87 chars, so 2 files reached 260 (MAX_PATH); `core.longpaths` is not set. `baza-wiedzy-dt-12-close` (prefix 72) worked.

**Why:** the limit is about 259 − 173 − 49 = 37 chars for the session name, and it shrinks as deeper course files land in the repo.

**How to apply:** for Baza wiedzy pick slugs so that `baza-wiedzy-<slug>` stays ≤ 30 chars (e.g. `w3w4`). Before a launch, check `git ls-files | awk '{print length}' | sort -n | tail -1` if the slug is long. A failed launch leaves a stale `worktree-<name>` branch for Rafal to delete. Related: [[hub-check5-false-busy-background]].
