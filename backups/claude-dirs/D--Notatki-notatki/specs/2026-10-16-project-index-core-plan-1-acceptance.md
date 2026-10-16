# Project index (core) — Plan 1 acceptance report

**Project / part:** project-index / project-index-core
**Index:** [project-index.md](../projects/project-index.md)
**Date:** 2026-10-16
**Plan:** `.claude/plans/2026-10-16-project-index-core-plan-1.md`, Task 7
**Spec:** `.claude/specs/2026-10-16-project-index-core-design.md` §9

**Result:** all seven items passed.

## Items

| Item | Expected | Observed | Verdict |
|---|---|---|---|
| 1. Hub index readable on its own | Rafal opens `.claude/projects/hub.md` and, without opening another file, names the hub's parts, their status, what is left before the finish line, the next step and the five pending decisions | Rafal, after reading it: „Oba testy poszły pozytywnie. Hub zdaje sobie sprawę jaki jest rozwój.” | pass |
| 2. Index updated in the same commit | The first change to hub documents after the rule arrives in one commit with the index update | Commit `65594a9` "docs(hub): rename the hub files to hub-core and add the hub index" lists `.claude/projects/hub.md` (51 lines added) and `2026-10-13-hub-core-design.md` (renamed and edited); the glossary commit `a0d0a2f` again carries `hub.md` with the new document | pass |
| 3. Voice notes saved | `.claude/specs/2026-10-16-hub-voice-notes.md` holds the voice decisions of 2026-10-11, 2026-10-12 and 2026-10-14 with sources | `check-task-1.sh`: "PASS task 1 (16 decision rows)" (every row has a source; the three dates and the registry file `fd8af3d0` are cited) | pass |
| 4. Old names gone | Nine `hub-core` files; `git grep orchestrator-hub-` finds nothing outside this project's spec and plan | `git grep -c "orchestrator-hub-"` with those two exclusions: no match ("item 4: no old names"); nine renamed `hub-core` files (the glossary is a tenth `hub-core` file, added by Task 6) | pass |
| 5. Names next to codes in replies | In a new session, "jakie decyzje czekają w hubie?" is answered with each decision named and any code next to its name | Rafal ran it in a new session and reported the test as passed (same message as item 1) | pass |
| 6. Both rule files agree | `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` carry the same section and language sentence | `check-task-2.sh`: "PASS task 2 (section 16 lines, identical)" | pass |
| 7. Glossary covers every code | Every distinct code found in the hub files has a glossary row; `hub.md` links the glossary | `check-task-6.sh`: "PASS task 6"; the check fails on a glossary without the S7 row ("MISSING S7"), so it can fail | pass |

## Deviations from the plan

Each has a ruling in the plan ledger (`.superpowers/sdd/2026-10-16-project-index-core-plan-1/progress.md`):

- each task's test is a check script that encodes its Expected lines;
- the hub test assertion reads the spec reporter (`ℹ pass 133`, `ℹ fail 0`) instead of TAP `# pass 132`; the installed hub suite has 133 tests;
- the skill gained one sentence after scenario F (open decisions that name the parts are re-worded when a part is added);
- `hub.md` does not list the Plan 4 final-review minors as left to do, because the hub spec (§13.4, "After Plan 4", commit `79091c7`) records five of them fixed and one accepted risk;
- seven codes of the Plan 3 reviews (Plan 3 ruling of Task 4, of Task 6, final-review items 2 and 3, and the Plan 3 meanings of review minors 1, 4 and 5) are named by their group in the glossary, because the ledger that named each one is deleted.

## Not part of this plan

- Part `project-index-rollout`: indexes for families with work in progress in Baza wiedzy, then in the saas app repository.
- `~/.claude` changes (the rule section, the `project-index` skill, the hub skill's spec path) were not committed by this plan. Rafal's `SessionEnd` backup hook committed them in `~/.claude` (`0cbe4c7`, `5dba6a1`, `e624955`, "backup: sync .claude config"), so no commit is pending; later skill edits from the final review reach `~/.claude` the same way.
- Items 1 and 5 record Rafal's verdict; his enumeration of the hub index and the reply of the new session were not captured.
