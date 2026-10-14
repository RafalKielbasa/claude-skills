# Orchestrator hub — Plan 2 acceptance report

Date: 2026-10-14. Plan: `.claude/plans/2026-10-14-orchestrator-hub-plan-2-core.md`, Task 10.
Spec: `.claude/specs/2026-10-13-orchestrator-hub-design.md` §9.3.
Installed skill: `C:/Users/rafal/.claude/skills/hub/` (71 tests passing); hub data: `C:/Users/rafal/.claude/hub/`.
Sessions: hub `4e2a7dbc` (cwd `C:\Users\rafal\.claude\hub`), `probe-a` `1e7b7a73` (`C:\Users\rafal\hub-probes\repo`), `probe-b` `0863515e` (`C:\Users\rafal\hub-probes\repo with space`, `--permission-mode default`).

**Result:** Steps 1–5 passed. Rafal ended the acceptance after Step 5 ("zakończ"); Steps 6 (questionnaire, §9.3 item 4), 7 (hub after `/clear`) and 8 (full hub restart, §9.3 item 7) were not run.

## Steps

| Step | Expected | Observed (quoted from the hub's messages and the registry) | Verdict |
|---|---|---|---|
| 1. Start | `start` runs cleanup, confirm, overview, arms the watcher; the hub registers itself by `cwd` | `HUB cleanup` → `{"removed":[],"pollsKept":1,"judgmentsKept":0}`; `HUB confirm` → `{"confirmed":[],"mismatched":[]}`; overview with 4 sessions, the hub absent; `Monitor` "hub watcher" armed for 30 min; `hub-sessions.json` → `"hub": ["4e2a7dbc-2968-44c4-a973-a59351858a08"]`; the turn ended with `⏸ Czeka na decyzję: …` | pass |
| 2. Overview (§9.3 item 1) | `probe-a` under `repo`, `probe-b` under `repo with space`, the hub not listed | watcher: `new session: repo 1e7b7a73 probe-a`, `turn ended: repo 1e7b7a73 probe-a`, `new session: repo with space 0863515e probe-b`, `turn ended: repo with space 0863515e probe-b`; overview rows `repo \| 1e7b7a73 probe-a \| turn ended` and `repo with space \| 0863515e probe-b \| turn ended`; the hub judged both turns `--verdict other` | pass |
| 3. Marker notification (§9.3 item 2) | `waiting for decision` with the marker sentence within about 2 minutes | `probe-a` Stop 10:56:44 with marker "do czego ma posłużyć zdanie o lesie."; watcher: `waiting for decision: repo 1e7b7a73 probe-a — do czego ma posłużyć zdanie o lesie.` | pass |
| 4. Waiting for permission (§9.3 item 3) | `waiting for permission` for `probe-b` | `probe-b` Notification `permission_prompt` 10:56:59 (12 s after its prompt); watcher: `waiting for permission: repo with space 0863515e probe-b`; after Rafal approved: PostToolUse 10:58:37, Stop 10:58:41. Asked to approve from the hub, the hub refused: "nigdy nie odpowiadam na prompt uprawnień ani na bramkę innej sesji, także na Twoją prośbę" | pass |
| 5. Direct command with confirmed delivery | exact draft with header and five sections shown; "wyślij"; check 6 warning confirmed; SendMessage; `confirm` → `sent` | `compose` 11:01:24 (no Write/Edit call: the body went on stdin); draft shown; approved 11:10:02; `prepare` with the waiting-session confirmation 11:12:34; the hub compared the sent file with the approved draft; `SendMessage` 11:12:48; recipient `UserPromptSubmit` 11:12:48.329 with `fromName: hub`; journal: `\| r20261014111001-d380 \| 2026-10-14T11:10:01.880Z \| 1e7b7a73 probe-a \| direct \| sent \| UserPromptSubmit 2026-10-14T11:12:48.329Z \|` | pass |
| 6. Questionnaire (§9.3 item 4) | request, answers with the five sections and **Pytania i odpowiedzi** | not run | — |
| 7. Hub after `/clear` | role kept, overview rebuilt, new id excluded | not run | — |
| 8. Full restart (§9.3 item 7) | role kept, catch-up `turn ended` for `probe-b`, journal intact | not run | — |

## Findings

| # | Finding | Kind | Proposed handling |
|---|---|---|---|
| A1 | `HUB last` and `HUB judge` accept only the full `sessionId`, while the overview shows 8 characters; the hub looked the full id up in registry file names | defect (usability) | accept a unique id prefix in `last` and `judge` (small task) |
| A2 | The overview "Since" column shows UTC without a zone (10:5x while local time was 12:5x) | defect (usability) | render local time, or mark UTC |
| A3 | At 10:59:59 `probe-a` received a cross-session message from `probe-b` (`fromName: probe-b`): a prompt typed in `probe-b` at 10:59:52 led it to call `SendMessage`. The isolation rule allows this when Rafal asks in that session, and it bypasses the hub's "wyślij" gate and journal; the hub noticed it and said so in the Step 5 draft | observation | none for Plan 2; the hub detects such prompts by `fromName` |
| A4 | Each watcher event reaches the hub as a `UserPromptSubmit` without `fromName` (Monitor notification) | observation | none; the hub is excluded from the overview |

## Open decisions for Rafal (from the final code review, change the spec)

- I-3: a session that dies without `SessionEnd` stays "problem: vanished" in the overview and is never deleted (§8.2 ages out only ended sessions).
- I-4: a turn interrupted with Esc fires no `Stop`, so the session stays "working" and check 5 reports it busy (§5.4).
- M-2: a decision wait survives a later turn that ends without the marker when no `UserPromptSubmit` came between (§5.2).

## Deviations from the plan's code

Fix rounds after task reviews and the final review changed the planned code; each change has a ruling in the SDD ledger: `isVanished` counts only polls after a session's first event; a corrupt `hub-sessions.json` or `watch-state.json` is recovered instead of breaking the overview or the watcher; watcher error lines are deduplicated; check 1 refuses a nameless target; a notice never changes a record that has delivery evidence; the watcher catches up by Stop identity; `runPoll` has a 30 s timeout; `compose --body-file -` reads stdin; `confirm` reports a hub message whose text differs from the approved one; delivery matches only the raw inner hash; `result` requires a pending record; the installer parses `settings.json` before any write. Test count: 71 (plan: 63).
