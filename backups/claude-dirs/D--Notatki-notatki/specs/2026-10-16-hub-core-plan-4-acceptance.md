# Orchestrator hub — Plan 4 acceptance report

Date: 2026-10-16 (times in UTC; local time is UTC+2). Plan: `.claude/plans/2026-10-16-hub-core-plan-4.md`, Task 6.
Spec: `.claude/specs/2026-10-13-hub-core-design.md` §9.3 "Plan 4's acceptance", §13.4 (P10, P13, P14, P15).
Installed skill: `C:/Users/rafal/.claude/skills/hub/` (identical to the dev tree, 132 tests passing); hub data: `C:/Users/rafal/.claude/hub/`; `hub/CLAUDE.md` written by the installer (backup of the hand-written file: `CLAUDE.md.bak-hub-20261016T074730`).
Sessions: hubs in a VS Code panel in `C:\Users\rafal\.claude\hub` — `2107c049` (`hub-28`, started before the install), `3155bd50` (Step 2), `5ba668c4` (`hub-db`, Step 5); trial session `probe-a` `15c3c83f` (terminal, `C:\Users\rafal\hub-probes\repo`, outside the map, project `repo`).

**Result:** all four items passed.

## Before the steps

The running hub `hub-28` had a watcher (PID 4464) started at 07:41:32Z, before the install at 07:47Z, so it ran pre-P14 code and would have orphaned again when `hub-28` closed. Rafal stopped it himself before the steps (variant A).

## Steps

| Item | Expected | Observed (quoted from the transcripts, the registry, the CLI and the process table) | Verdict |
|---|---|---|---|
| P10 — the role in the first turn of a panel hub | `hub/CLAUDE.md` with the hard rules among the instructions; the first tool is `Skill hub`, not a `Read` of `role.md` | Hub `3155bd50` (prompt "kim jesteś", 09:17:23): instructions `Project c:\Users\rafal\.claude\hub\CLAUDE.md 732 hardRules=true`, first tool `Skill {"skill":"hub"}`. Hub `5ba668c4` (prompt "start", 09:26:10): the same two lines. `hub-28`, `3155bd50` and `5ba668c4` are all in `hub-sessions.json` | pass |
| P14 — the closed hub's watcher stops; the next hub is told | after the panel closes, its watcher ends; a turn that ends while no hub runs is reported by the next hub's watcher; one watcher process | Hub `3155bd50` armed its watcher at 09:18:07 (`timeout_ms` 1800000) and was closed. `probe-a` turn: prompts 09:20:26 and 09:20:41, `Stop` 09:20:44. Hub `5ba668c4` armed its watcher at 09:26:52; its output: `turn ended: Baza wiedzy Devstock 7875e423 Trzeci wariant pikselowego horyzontu`, `turn ended: repo 15c3c83f probe-a`. At 09:33 the process table held one `hub-watch` process, PID 14132, created 09:26:54 (the Step 5 hub's); the Step 2 hub's watcher was gone 15 minutes before its `Monitor` timeout | pass |
| P13 — Codex without Rafal's hooks and MCP servers | the answer is about `probe-a`'s result; `answer-1.err` shows no MCP server; the review-reminder hook's state file keeps its time | "odbij od Codexa ostatni wynik probe-a: czy jest kompletny?" (09:28:01): thread `projects/repo/codex/2026-10-16-probe-a-kompletnosc`, `threadId 01a1440a-…`; answer "## Ocena kompletności wyniku — Wynik jest **niekompletny**. — Nagłówek `Drugie zdanie o rzece` …" (about `probe-a`'s last result); `grep -c rmcp answer-1.err` → `0`, the only `ERROR` is the models-cache warning; `powtorki-last-check.txt` still `2026-10-16T06:55:14` local (the Plan 3 Step 7 call) | pass |
| P15 — local time in the header | the draft header ends with the local time of composing | "napisz jedno zdanie o morzu do probe-a i wyślij" (09:31:23): draft `projects/repo/drafts/20261016T093138-direct-5c23.md` with header `[hub · direct · repo · 15c3c83f · 2026-10-16 11:31]` for a draft written at 09:31:38Z; its Kontekst quotes "11:20", the local time of `probe-a`'s turn | pass |

## Findings

| # | Finding | Kind | Proposed handling |
|---|---|---|---|
| C1 | The hub did not take "i wyślij", typed before Rafal saw the draft, as approval, and asked for "wyślij" after showing the full text — the role's first hard rule, now loaded from `hub/CLAUDE.md` | observation | none |
| C2 | The line `watcher stopped: its hub session (process …) has ended` is not observable: the watcher's stdout reader is the `claude.exe` that has just ended. The stop shows only in the process table and in the next watcher's catch-up | observation | none; the next hub's catch-up is the evidence |
| C3 | The closing time of hub `3155bd50` is not recorded (closing a panel fires no `SessionEnd`). That its watcher was gone by 09:20:44 follows from the next watcher reporting `probe-a`'s turn: a live watcher would have recorded it first | observation | none |
| C4 | The draft of Step 7 is not sent; it waits for Rafal's "wyślij" | observation | Rafal's choice |

## Deviations from the plan

- The executor installed the skill at Rafal's request (variant A) instead of Rafal; the installed suite is 132, not 131, because the final review's fix I1 added a test.
- Final review fix I1 (not in the plan): `HUB confirm` recognises the hub's from-names from the polls of the sessions registered as hub, so a hub without `--name` confirms its sends; spec §6.3, §9.1 and §13.4 P10 updated.
- Before the steps Rafal stopped the pre-install watcher 4464 (above).

## Open after Plan 4

- Minors deferred by the final review (M1–M6): the CRLF assertion of the installer test, quoted MCP server names, the 1-second wait of the P14 test, PID reuse for the owner check, an unreadable `config.toml` after the thread directory is created, `HUB_PROCESS_TABLE` parsed outside `try`.
- Still open from §13.4: B5 ("wyslij" without diacritics), B7 (re-arm noise); I-3, I-4 and M-2 of the Plan 2 acceptance.
- Cleanup left from the Plan 3 acceptance: the worktree `sondy-notes-date` and the branches `worktree-sondy-notes-date`, `worktree-probe-wt` in `C:\Users\rafal\hub-probes\repo`; `/exit` in `probe-a`.
