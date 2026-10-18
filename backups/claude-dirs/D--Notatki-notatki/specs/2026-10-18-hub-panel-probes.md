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

## Probes

Fill the Result column during the trial: `pass`, `fail` with one sentence, or `not tried`.

| # | Probe | How to check | Pass means | Result |
|---|---|---|---|---|
| D1 | One screen | Run 3+ sessions in different folders; let one stop at a gate or a permission prompt; look only at the sidebar | The sidebar alone tells which session waits and which works | |
| D2 | Registry hooks | Start a desktop session; open the hub overview; look at `~/.claude/hub/registry/<id>.events.jsonl` | The session appears with status and „what it is doing”, the event file grows | |
| D3 | Naming | `claude agents --json` while a desktop session runs | The session is listed with a name the hub can resolve (spec §6.5 step 2) | |
| D4 | Gate marker | Let a desktop session end a turn with `⏸ Czeka na decyzję: …`; answer in the card | The hub shows „waits for Rafal” with the marker text; the typed answer continues the session | |
| D5 | Permission prompt | Trigger an `ask` rule (for example a git commit in a code repository) | Allow/Deny shows in the card and the answer takes effect | |
| D6 | AskUserQuestion | Ask the session to use AskUserQuestion with two options | The options show in the card and the chosen one reaches the session | |
| D7 | Hub send | Approve a prompt in the hub and send it with `SendMessage` to the desktop session | The prompt arrives and the session acts on it as VS Code sessions do | |
| D8 | Dialog fork | `HUB dialog start --session <id>` on a desktop session | The fork starts with the history of that session (compare probe S6) | |
| D9 | Hub-launched sessions | Start a session from the hub with `claude --bg`; look at the desktop sidebar | Expected `fail` per docs; record it and the consequence | |
| D10 | Code links | Click a `file:line` reference in a desktop session | The file opens in VS Code or another editor Rafal accepts | |
| D11 | Reply while working | Type a correction during a running turn | It is delivered without stopping the action (docs claim) | |

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

## Out of scope

Remote Control (claude.ai/code, phone), voice: part `hub-voice`, separate session.
