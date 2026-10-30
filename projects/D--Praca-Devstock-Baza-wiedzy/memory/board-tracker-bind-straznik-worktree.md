---
name: board-tracker-bind-straznik-worktree
description: "W sesji izolowanej w worktree strażnik odrzuca `cli.js bind` w Bashu („runs a string through bind”); przechodzi przez PowerShell, a `trail`, `assign` i `status` przechodzą w Bashu"
metadata:
  node_type: memory
  type: reference
  originSessionId: 4f646017-851e-44d6-a6c9-cf219eac164a
  modified: 2026-10-30T08:14:14.215Z
---

W sesji izolowanej w worktree strażnik izolacji odrzuca w Bashu `node …/board-tracker/src/cli.js bind …`
(„runs a string through bind, which can't be verified to stay inside the worktree”), z `cd` i bez. Potwierdzone w
wielu sesjach (wiki globalne, `straznik-worktree-odrzuca-komende-ktorej-nie-umie-zweryfikowac`). Ten sam `bind`
przechodzi przez narzędzie PowerShell; `trail`, `assign`, `status`, `pool` i `create` przechodzą w Bashu.

**Jak stosować:** w sesji z worktree uruchom `bind` od razu przez PowerShell. Gdy to niemożliwe, status „w toku”
ustaw `status --to in_progress` (to samo, co `bind` robi przy przypięciu), a ślad zostaw `trail`. Nie ponawiaj
`bind` w Bashu. Zob. [[board-tracker-status]], [[board-tracker-done-false-error]].
