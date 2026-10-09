---
name: board-tracker-status
description: "Board tracker (CLI tools/board-tracker + skill + SessionStart hook) built 2026-10-09 and merged to main (PR #597); hook live; Rafał's acceptance in new sessions and the one-time inventory still pending."
metadata:
  node_type: memory
  type: project
  originSessionId: 4eb9f6aa-f244-4185-8bf4-fdecaba0e415
  modified: 2026-10-09T21:53:41.017Z
---

Board tracker built 2026-10-09 from spec `docs/superpowers/specs/2026-10-09-board-tracker-design.md` and plan `docs/superpowers/plans/2026-10-09-board-tracker.md`, via subagent-driven development (ledger in `.superpowers/sdd/2026-10-09-board-tracker/progress.md`, git-ignored).

State at end of 2026-10-09:
- CLI `tools/board-tracker/` (b0a338a8..40751a36, 89 tests) merged to `main` via PR #597 (merge 646d92e2, 2026-10-09 23:52); hook verified running from `main`. Live smoke passed; token has the `project` scope.
- Skill `~/.claude/skills/board-tracker/`, "Tablica" section in `~/.claude/CLAUDE.md`, and the SessionStart hook entry in `~/.claude/settings.json` are in place (outside the repo, backups of CLAUDE.md/settings in the ledger folder).
- Pending: Rafał's acceptance (new sessions in VS Code `d:` and terminal `D:` show the board lines), then the one-time inventory (`board-tracker inventory`, Task 15).

**Why:** the hook runs `D:/Praca/Devstock/Baza wiedzy/tools/board-tracker/src/cli.js` from whatever branch the shared folder is on; since the merge it exists on `main` and every later day branch.

**How to apply:** run the inventory only with Rafał present; calibrate alarm thresholds (stale 14, WIP 5, epics counted in rot) about 2026-10-23. Side finding: #412's body ("no certificates", 2026-08-28) contradicts `knowledge-base/company/kierunki/platforma-kodozercy.md:41` (2026-09-21: certificates are being built) — raise in inventory phase 2. See [[tryb-commitow-per-repo]].
