# Orchestrator hub — Plan 3 acceptance report

Date: 2026-10-15/16 (times below in UTC; local time is UTC+2). Plan: `.claude/plans/2026-10-14-orchestrator-hub-plan-3.md`, Task 9.
Spec: `.claude/specs/2026-10-13-orchestrator-hub-design.md` §9.3 items 4–10.
Installed skill: `C:/Users/rafal/.claude/skills/hub/` (identical to the dev tree, 123 tests passing); hub data: `C:/Users/rafal/.claude/hub/`.
Sessions: hub in a VS Code panel in `C:\Users\rafal\.claude\hub` (`e682d10c`, after `/clear` `08a01e2a`, after the restart `2107c049`); `probe-a` `15c3c83f` (terminal, `C:\Users\rafal\hub-probes\repo`); trial map entry `sondy` → that directory.

**Result:** Steps 2–6 passed. Step 7 passed with a defect (B1), Step 8 passed after a setup fix (B3), Step 9 passed in part: state recovery worked, the watcher's catch-up event did not reach the new hub (B2).

## Deviations from the plan's procedure (Rafal's decisions)

- Steps 2, 8 and 9 ran against Rafal's live sessions; Steps 3–7 ran against one trial session `probe-a`; `probe-b` was dropped (the "outside the map" row is covered by `test/overview.test.mjs`, and an old `probe-b` row from Plan 2 showed it anyway).
- Step 7 ran against `probe-a` instead of a live session: the last result of the live candidate held an evaluation of interns, and Codex is an external service.
- The hub runs in a VS Code panel, not as `claude --name hub --append-system-prompt-file …` in a terminal. Three restarts without the flags preceded this decision (`hub-5d` panel; `hub-d0` and `hub-94` terminal, where the flags were typed into the session as `start --name hub`). The hub is recognised by its `cwd` (`lib/hubsessions.mjs:1-3`), so the name is not needed; the role now comes from `C:\Users\rafal\.claude\hub\CLAUDE.md` (B3).
- The cleanup proposed in Step 5 was deferred to Step 10.

## Steps

| Step | Expected | Observed (quoted from the hub's messages, the registry and the CLI) | Verdict |
|---|---|---|---|
| 1. Trial setup | trial map entry, trial session | `sondy` added to `projects.json`; `HUB projects` → `\| sondy \| Sondy huba \| C:\Users\rafal\hub-probes\repo \| Repozytorium do prób huba. \|`; `probe-a` started with `--name probe-a` | pass |
| 2. Map names and titles (item 8) | sessions under map names; Session cell shows the conversation title; local "Since" | rows under `Baza wiedzy Devstock`, `Edu SaaS (platforma kursów)`, `My Second Brain`, `Sondy huba`, `repo with space (outside the map)`; panel titles such as `96436fe2 Moduł zerowy kursu agentów - pierwsza lekcja`; `2b9861ea probe-a` (transcript `custom-title` "probe-a"); Since `2026-10-15 11:38:50` for an event at 09:38Z; the hub not listed | pass |
| 3. Questionnaire (item 4) | request, `wyślij`, `sent`; questions shown; answers with five sections and **Pytania i odpowiedzi**; `sent`; the session acts | without the literal "wyślij" the hub refused, citing `role.md:6`; `r20261015112612-98e1` questionnaire-request `sent`, `UserPromptSubmit 11:26:20Z`; `probe-a` asked one question with the marker (11:26:58Z), the hub showed it verbatim; `r20261015191624-851c` questionnaire-answers `sent`, `UserPromptSubmit 19:17:00Z`, sections Cel / Kontekst / Decyzje z uzasadnieniem / Ograniczenia / Oczekiwany rezultat / Pytania i odpowiedzi; `probe-a` confirmed in one sentence and stopped (19:17:05Z) | pass |
| 4. New session, no worktree (item 9) | draft `[hub · new-session · sondy · sondy-<slug> · …]` with the project line; launch prints the short id and `claude attach`; `[background]`; `confirm` → `confirmed` | header `[hub · new-session · sondy · sondy-readme-purpose · 2026-10-15 19:18]`, Kontekst `Projekt: Sondy huba (C:\Users\rafal\hub-probes\repo). Repozytorium do prób huba.`; `{"ok": true, "shortId": "181fea6e", …, "worktree": null, "attach": "claude attach 181fea6e"}`; overview `181fea6e sondy-readme-purpose [background]`; `{"confirmed":["r20261015191855-b1e0"],"mismatched":[]}`; the session answered from `README.md:3-4` | pass |
| 5. New session in a worktree; cleanup only proposed (item 9, P9) | worktree path and branch by default; `confirmed`; the file only in the worktree; cleanup commands proposed, none run | `worktree.path` `C:\Users\rafal\hub-probes\repo\.claude\worktrees\sondy-notes-date`, `worktree.branch` `worktree-sondy-notes-date`; `git worktree list` lists it (`locked`); agents `cwd` inside it; `{"confirmed":["r20261015192327-7aec"],"mismatched":[]}`; `notes/plan-3.md` = "Today's date is 2026-10-15." in the worktree, no `repo/notes/`; "posprzątaj" → `claude stop 76029f3a`, `claude rm 76029f3a`, `git worktree list`, `git branch -d worktree-sondy-notes-date` (`-D` only after confirmation), each with its undo; the hub ran one read-only check; worktree, branch and session unchanged afterwards | pass |
| 6. Dialog through a fork (item 5) | dialog dir with `context/`; no inherited marker; refusal to write into the repo; `prompt.md` + marker; review; `--path dialog`; `sent`; fork stopped | `projects/sondy/dialogs/2026-10-15-notes-decision` with `context/status.txt`, `log.txt`, `diff.patch` (empty: only untracked files), `snapshot.json`; `fork-settings.json` deny `Edit(./**)`, `Bash`, `EnterWorktree`; fork `3d592259 dlg-sondy-notes-decision`, first turn without a marker; asked to write "test" into `notes.md`: "Nie zapisuję tego słowa sam, bo w tym dialogu nie zmieniam niczego w repo"; `decisions.md`, `prompt.md`, turn ended "⏸ Czeka na decyzję: prompt gotowy do przeglądu"; header `[hub · dialog · sondy · 15c3c83f · 2026-10-15 20:04 · dialogs/2026-10-15-notes-decision]`; `r20261015200508-d2a3` `sent`, `UserPromptSubmit 20:05:20Z`; fork `SessionEnd 20:05:28Z`; `probe-a` added `- 2026-10-15 — test` | pass (B9) |
| 7. Codex with one follow-up (item 6) | both calls in the background; answers verbatim with an assessment table; `HUB codex note`; thread files | `projects/sondy/codex/2026-10-16-probe-a-complete/`: `thread.md`, `meta.json` (`threadId 01a14310-…`, `calls 2`), `answer-1.md`, `answer-2.md`, both `.err`; answer 1 = "Masz 5 zaległych powtórek — robimy je teraz?", assessed by the hub "nie na temat, odrzucona"; answer 2 judged point by point, three points checked by the hub against `notes.md` and `spec.md` | pass with defect B1 |
| 8. Hub after `/clear` (item 10) | role kept; overview rebuilt with titles and map names; new id not listed | `08a01e2a` in `hub-sessions.json`; on "kim jesteś" the hub read `role.md`, invoked the skill, ran cleanup / confirm / overview, re-armed the watcher and answered "Jestem hubem…" with the hard rules; overview with titles and map names, no hub row | pass after B3 |
| 9. Full restart and recovery (item 7) | catch-up `turn ended` for the session that ended a turn while the hub was down; journal intact | new hub `2107c049` registered; `CLAUDE.md` with the inlined role loaded ("Hard rules" in the instructions, first tool `Skill hub`); `probe-a` turn 05:09:47–05:09:50Z with no hub running; the start overview shows `15c3c83f probe-a \| turn ended (judge) (07:09) \| jeszcze nie oceniona`; `HUB journal --project sondy` keeps the five records of Steps 3–6; no watcher event reached the new hub | partial (B2) |
| 10. Close | trial entry removed, sessions stopped, report | `sondy` removed from `projects.json`; Step 4 and 5 sessions vanished on their own overnight; the remaining cleanup is listed below | see Cleanup |

## Findings

| # | Finding | Kind | Proposed handling |
|---|---|---|---|
| B1 | Every `codex exec` the hub starts runs Rafal's Codex hooks from `~/.codex/hooks.json`: `SessionStart` → `C:\Users\rafal\.claude\hooks\powtorki-check.ps1` and the board-tracker hook, `SessionEnd` → `backup-claude.ps1` (timeout 120 s). The first call's answer was the review reminder instead of an answer; the `resume` call does not fire `SessionStart`. The `.err` files also show Rafal's MCP servers starting (Figma auth, n8n at `localhost:5678`) | defect | isolate the hub's Codex calls from user hooks and MCP servers (config overrides on the command line); decide with Rafal |
| B2 | Closing the VS Code panel ended the hub's `claude.exe` (35508) but not its Monitor process tree: `node hub-watch.mjs` PID 14132 (started 05:00:45Z by `08a01e2a`) kept running next to the new watcher PID 21236 and shared `watch-state.json`. It recorded `probe-a`'s turn first, so the new watcher saw no transition. PID 14132 was gone by 05:41Z, consistent with the 30-minute Monitor timeout (not verified) | defect | the watcher exits when its owning `claude.exe` is gone, or a single-watcher lock with a heartbeat; the start procedure reports a stale watcher |
| B3 | `@C:/Users/rafal/.claude/skills/hub/role.md` in `~/.claude/hub/CLAUDE.md` was not expanded in the panel session (instructions: `Project c:\Users\rafal\.claude\hub\CLAUDE.md 162` chars, no `role.md`); the role arrived only because the model chose to read the file | defect (setup), fixed | `~/.claude/hub/CLAUDE.md` now holds `role.md` inline (732 chars, verified in Step 9); the installer should write it from `role.md` on every install |
| B4 | Starting the hub with flags failed three times; with PowerShell 5.1 `&&` is a parse error, and the flags ended up typed into the session | observation | led to the panel decision (B3, P10) |
| B5 | The hub accepted "wyslij" (no "ś") as "wyślij" and said so | observation | decide whether the rule accepts the spelling without diacritics |
| B6 | The draft header shows UTC (`2026-10-15 19:15`) while the same message's Kontekst says "z 21:11" (local) | defect (minor) | extend §5.6 local time to the header, or mark UTC |
| B7 | In 7 quiet hours the watcher re-arm produced 16 hub turns, each ending with the same marker | observation | candidate: re-arm without a marker when nothing changed |
| B8 | Background sessions `181fea6e` and `76029f3a` vanished overnight without `SessionEnd`; the overview shows `problem: vanished` | observation | as Plan 2 I-3 |
| B9 | The fork refused to write by its own judgment; no `Edit` was attempted, so the `deny Edit(./**)` rule was not exercised (it held in probe S7) | observation | none |
| B10 | The hub said `probe-a` had no conversation title; the transcript has `custom-title` "probe-a", which is what the cell showed | observation | none (the hub's wording, not the code) |
| B11 | Rafal typed "krok 3 gotowyt" into `probe-a` by mistake; the hub folded it into the answers as D2 ("zignoruj") and `probe-a` ignored it | observation | none |
| B12 | Three background sessions started before the hooks were installed (`d2d5a023`, `88ea14db`, `18016c57`, all `blocked`) have no event log and no overview row | observation | none; the overview is built from the event logs |

## Open decisions for Rafal (change the spec)

- P10 (from B3, B4): the hub runs in a VS Code panel or a terminal in `~/.claude/hub`; its role comes from `~/.claude/hub/CLAUDE.md` (a copy of `role.md` written by the installer); the name `hub` is not required. Touches §4 (hub row), decision 9, `SKILL.md:3`, `bin/install.mjs`.
- P11 (Task 4, Task 6 and final-review rulings): a timed-out or unparsable `claude --bg` launch leaves the record `pending` with `unknown: true`; a dialog fork that timed out gets no fallback command; `launch` saves the record as `pending` before spawning (§6.6, §6.5 step 2).
- P12 (final-review ruling I1): `dialog start` forks a given live id directly and resolves by name only when the id is no longer live; other live sessions with the same name are reported as `twins` (§6.5 step 2).
- B1: how to isolate the hub's Codex calls (§7).
- B2: watcher ownership after the hub's process ends (§5.2).
- B5: whether "wyslij" counts as "wyślij".

## Deviations from the plan's code

Fix rounds after the task reviews and the final review changed the planned code; each change has a ruling in the SDD ledger: a `claude --bg` timeout or an exit 0 without the `backgrounded` line is an unknown outcome (record stays `pending`); the launch record is saved as `pending` before the spawn and the hub calls `launch` and `dialog start` with a 600 s Bash timeout; a live given id is forked directly, twins are reported; a non-string `name` in the map falls back to the key; fork names use a kebab-cased key and the fallback command quotes the name; `approve --path new-session` checks the draft header's target; a dialog inside the source session's `cwd` and a fork name that is already live are refused; `HUB projects` lists unmapped projects from the whole registry; `gitInfo` uses `--no-optional-locks`. Test count: 123 (plan: 109).

## Cleanup

Done: the `sondy` entry removed from `C:\Users\rafal\.claude\hub\projects.json`.

Left for Rafal (the hub and this session only propose them):

- `/exit` in `probe-a`.
- Worktree `sondy-notes-date` (session `76029f3a` vanished, the worktree is `locked`, `notes/` untracked): `git -C "C:/Users/rafal/hub-probes/repo" worktree unlock .claude/worktrees/sondy-notes-date`, then `git -C "C:/Users/rafal/hub-probes/repo" worktree remove --force .claude/worktrees/sondy-notes-date`, then `git -C "C:/Users/rafal/hub-probes/repo" branch -d worktree-sondy-notes-date`.
- Branch `worktree-probe-wt` from probe S10 (no commits beyond `master`): `git -C "C:/Users/rafal/hub-probes/repo" branch -d worktree-probe-wt`.
- Optional: `claude stop 18016c57` (background session from Plan 2, `blocked`).
