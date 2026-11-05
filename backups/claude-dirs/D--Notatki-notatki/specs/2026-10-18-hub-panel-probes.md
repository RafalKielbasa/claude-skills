# Hub panel — probes: desktop app trial

**Project / part:** hub / hub-panel
**Index:** [hub.md](../projects/hub.md)
**Date:** 2026-10-18
**Decision:** „Kształt panelu” (panel shape), variant A, conversation 2026-10-18, session `3e15606d`.

## Purpose

Rafal wants one screen where every Claude session is a card he reads and answers (next prompt,
gate answer, tool permission) instead of one VS Code window per repository. Before any panel is
built, a one-day trial checks whether the Claude Code desktop app already gives that, and whether
the hub keeps working with sessions started in it. The trial builds nothing.

Reframing recorded on 2026-10-18: the panel is the place Rafal answers from, not a read-only view
(hub spec §2, increment 1a). This overrides hub spec decision 3 (gates answered in the session)
and decision 10 / §12 (sessions stay in VS Code panels) for the sessions moved into the desktop
app; the hub itself stays a Claude session.

## Setup

- Claude desktop app is installed (`%LOCALAPPDATA%\Programs\Claude`); Claude Code 2.1.302
  (cross-session messaging on native Windows needs 2.1.234+).
- For one working day every project session starts in the Code tab of the desktop app, in the
  project folder. VS Code stays open for code and diffs only.
- The hub session runs as today, from `~/.claude/hub`.
- Docs read on 2026-10-18 (agent `claude-code-guide`): desktop
  (https://code.claude.com/docs/en/desktop), cross-session messaging
  (https://code.claude.com/docs/en/cross-session-messaging), agent view
  (https://code.claude.com/docs/en/agent-view). The docs say the desktop app sees only sessions
  it runs itself, and that a cross-session message never counts as consent from Rafal.

## Information flow

![[2026-10-18-hub-panel-flow.svg]]

The figure shows the trial configuration: Rafal reads and answers the session cards in the
desktop app; the global hooks feed the hub registry; the hub watches it, forks a dialog on
request and sends approved prompts back with `SendMessage`. Each arrow carries the probe
(D1–D11) that verifies it; the dashed red card is the gap the docs predict (D9).

## Probes

Fill the Result column during the trial: `pass`, `fail` with one sentence, or `not tried`.

| # | Probe | How to check | Pass means | Result |
|---|---|---|---|---|
| D1 | One screen | Run 3+ sessions in different folders; let one stop at a gate or a permission prompt; look only at the sidebar | The sidebar alone tells which session waits and which works | pass (2026-10-27): S1 at its gate (`Stop` with the marker), S2 at a permission prompt (`Notification`) and S3 working, three folders (notatki, saas app, Baza wiedzy) |
| D2 | Registry hooks | Start a desktop session; open the hub overview; look at `~/.claude/hub/registry/<id>.events.jsonl` | The session appears with status and „what it is doing”, the event file grows | pass (2026-10-27, hub): S1 `745e67e4`, S2 `4822d2c3` and S3 `63169166` are in the hub overview as „turn ended” and each `events.jsonl` grew from 0 to 2 events (`UserPromptSubmit`, `Stop`); „what it is doing” was still empty because no session had used a tool yet; re-check at 07:46 UTC passed: S1 „Bash Read task list header and new edu-saas files”, S3 „Bash Count lines in the 10 summarized files to verify full reads”, S2 „waiting for permission” |
| D3 | Naming | `claude agents --json` while a desktop session runs | The session is listed with a name the hub can resolve (spec §6.5 step 2) | pass (2026-10-27, hub): `claude agents --json` lists the three desktop sessions as `interactive` named `notatki-e0`, `saas-app-6c` and `baza-wiedzy-00`, and `HUB voice resolve` resolves each to its name, cwd and project without twins, although S1 and S2 share the conversation title „Powitanie jednym zdaniem” |
| D4 | Gate marker | Let a desktop session end a turn with `⏸ Czeka na decyzję: …`; answer in the card | The hub shows „waits for Rafal” with the marker text; the typed answer continues the session | pass (2026-10-27): the hub showed S1 as „waiting for decision” with the marker text of its last turn, and the answer „A” typed in the card continued S1 on variant A (registry: `UserPromptSubmit` 08:43:00 UTC, then `PostToolUse`, `Stop`) |
| D5 | Permission prompt | Trigger an `ask` rule (for example a git commit in a code repository) | Allow/Deny shows in the card and the answer takes effect | pass (2026-10-27): the `ask` rule `Bash(git push:*)` in saas app put Allow/Deny in the S2 card and Deny stopped the tool („tool interrupted”); the interrupted turn left no hook event after `Notification` 07:40:32 UTC, so the hub registry has no sign of the answer and the hub overview still showed S2 as „waiting for permission” at the end of the trial (Allow not tried) |
| D6 | AskUserQuestion | Ask the session to use AskUserQuestion with two options | The options show in the card and the chosen one reaches the session | pass (2026-10-27): both options showed in the S1 card and S1 summarized the file Rafal chose (registry: `PostToolUse` `AskUserQuestion` 16:35:38 UTC, then the file read) |
| D7 | Hub send | Approve a prompt in the hub and send it with `SendMessage` to the desktop session | The prompt arrives and the session acts on it as VS Code sessions do | fail (2026-10-27): the hub delivered the approved prompt to S3 through `SendMessage` (`HUB confirm` `r20261027171923-8903`) and S3 answered the hub „sonda D7 doszła”, but the S3 card shows only that answer and not the hub's prompt, which the VS Code panel shows, so Rafal did not notice the prompt arrive; the send needed `--confirm-busy` because the hub held S3 as „working” since 07:40:43 UTC although `claude agents` reported idle and the registry has `Stop` for that turn at 07:42:00 UTC |
| D8 | Dialog fork | `HUB dialog start --session <id>` on a desktop session | The fork starts with the history of that session (compare probe S6) | pass (2026-10-27, hub): fork `f9b75c1a` (`dlg-notatki-d8-probe`) started by `HUB dialog start --session 745e67e4` answered from S1's history, without tools, that Rafal chose „A” at the gate „który plik czytasz dziś”; the fork inherits S1's title („Powitanie jednym zdaniem [dialog]”), so only the `[dialog]` tag tells it apart in the overview |
| D9 | Hub-launched sessions | Start a session from the hub with `claude --bg`; look at the desktop sidebar | Expected `fail` per docs; record it and the consequence | fail (2026-10-27): the sidebar shows 2 of 3 hub-launched sessions (`code-busters-app-migration-w2-learning`, `code-busters-mobile-app-migration-m2-learning`) but not `notatki-hub-panel-trial`, although the hub launched all three the same way (`kind: background`, with a worktree) |
| D10 | Code links | Click a `file:line` reference in a desktop session | The file opens in VS Code or another editor Rafal accepts | pass (2026-10-27): the `file:line` link to „## Git” in `.claude/CLAUDE.md` given by S1 opened the file in an editor Rafal accepts |
| D11 | Reply while working | Type a correction during a running turn | It is delivered without stopping the action (docs claim) | pass (2026-10-27): the correction typed into S3 reached it mid-turn (registry: `UserPromptSubmit` at 07:41:26 UTC right after a `PostToolUse`) and the turn went on |

## Reading the result

- **D1–D8 pass:** `hub-panel` becomes a usage rule (project sessions start in the desktop app)
  plus whatever hub fixes the trial surfaces; no panel is built; the decision „Rozszerzenie mety o
  panel i karty zatwierdzeń” can be resolved as „no build”.
- **D1 fails:** the desktop app does not solve the one-screen need; back to variant B (own panel)
  or C (`claude agents` with background sessions).
- **D2, D3, D7 or D8 fail:** desktop sessions are invisible or unreachable for the hub; either a
  hub fix with its own probe, or variant B/C.
- **D5 or D6 fail:** answering from the card is incomplete; the missing channel is exactly what
  variant B would have to provide, and the docs give none for AskUserQuestion, so project sessions
  would switch to text gates instead.
- **D9 fails as expected:** record in the hub spec that new sessions for desktop-based work start
  from the desktop app; the `claude --bg` launch of the hub stays for dialog forks and probes.

## Trial outcome (2026-10-27)

Sessions: S1 `745e67e4` in `D:\Notatki\notatki`, S2 `4822d2c3` in `saas app`, S3 `63169166` in
`Baza wiedzy`, all started in the Code tab of the desktop app. Nine probes pass (D1–D6, D8, D10,
D11); D7 and D9 fail.

- **D1 passes:** the desktop app gives the one screen; variants B and C of „Kształt panelu” are not
  needed for it.
- **D4, D5 and D6 pass:** a gate, a permission prompt and AskUserQuestion are all answered from the
  card, so no session has to switch to text gates.
- **D2, D3 and D8 pass, and D7's delivery works:** desktop sessions are visible and reachable for
  the hub. D7 fails on display only: the card shows the session's answer but not the hub's prompt.
  Under the rule above this calls for a hub fix with its own probe. Fix (decided with variant B):
  a session that acts on a hub message quotes the message verbatim at the top of its reply; the
  rule goes into the hub's global rules block (`RULES_BLOCK` in `~/.claude/skills/hub/lib/install.mjs`,
  written into `~/.claude/CLAUDE.md` by the installer) and is checked with one send to a desktop
  session.
- **D9 fails, though not as the docs predict:** 2 of 3 hub-launched sessions show in the sidebar
  and the third does not, although the hub launched all three the same way; the cause was not
  checked. The consequence of the rule above holds: new sessions for desktop-based work start from
  the desktop app, and the hub's `claude --bg` stays for dialog forks and probes (hub spec §6.6,
  §13.6, U3).
- **Hub findings** (open points of `hub-core`, no separate plan):
  - a turn interrupted by Deny ends without `Stop`, so the overview keeps S2 „waiting for
    permission” (same family as „przerwana tura zostaje working”, I-4);
  - the overview held S3 as „working” after a turn that has `Stop` in the registry (07:42:00 UTC,
    after a mid-turn correction and subagent hand-backs), so the D7 send needed `--confirm-busy`;
    cause not checked;
  - a dialog fork inherits the title of its source session, and only `[dialog]` tells it apart;
  - every desktop start leaves a session with a lone `SessionEnd` in the registry, which the
    overview skips by design.
- **Reading:** no panel is built; `hub-panel` becomes a usage rule (project sessions start in the
  desktop app, VS Code stays for code and diffs; hub spec §13.6, U2) plus the fixes above.
- **Decision (2026-10-27):** „Rozszerzenie mety o panel i karty zatwierdzeń”, variant B: no panel
  is built and `hub-approvals` joins the finish line, for sessions the desktop app does not show
  (D9). Status in the [index](../projects/hub.md).
- **Change (2026-11-05):** the usage rule above is withdrawn because work stays in the terminal, and
  the part is postponed (hub spec §13.7, U4).

## Out of scope

Remote Control (claude.ai/code, phone), voice: part `hub-voice`, separate session.
