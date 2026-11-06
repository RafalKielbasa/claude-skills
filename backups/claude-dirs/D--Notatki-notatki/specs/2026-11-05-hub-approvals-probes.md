# Hub approvals and voice alerts — probes

**Project / parts:** hub / hub-approvals, hub-voice-alerts
**Index:** [hub.md](../projects/hub.md)
**Design:** [2026-11-05-hub-approvals-voice-alerts-design.md](2026-11-05-hub-approvals-voice-alerts-design.md)
**Date:** 2026-11-05, session `3089ecd1`

## Purpose

Before the design was written, these probes checked whether a `PermissionRequest` hook can carry
Rafal's answer from the hub tab to a waiting session, what happens to the session's own prompt
meanwhile, and which local Polish voice he accepts. The docs
(https://code.claude.com/docs/en/hooks.md, read 2026-11-05) do not say whether the prompt shows
while the hook waits, and they say "Deny and ask rules are still evaluated" without saying what an
`allow` does against an `ask` rule.

## Setup

- Claude Code 2.1.318, Windows 11, a throwaway folder in the session scratchpad: a repository with
  a local bare remote, so every push stayed on the disk.
- The repository's `.claude/settings.json` holds the `ask` rule `Bash(git push:*)` and a
  `PermissionRequest` command hook with `timeout: 45`. The hook logs its input and a tick every 2 s,
  then answers from a mode file or waits for a decision file.
- A second script stands in for the hub command and writes the decision file. Rafal ran it with `!`
  from the session `3089ecd1`, which played the hub tab.
- Each scenario pushes its own branch, so the bare remote shows which call really ran.
- Without a window: `claude -p --model haiku`. With a window: `claude --model haiku` in a terminal
  Rafal opened. The session ran in auto mode; its prompt said "Ask rule Bash(git push:*) overrides
  auto mode for this command."

## Results

Times are UTC.

| Probe | What happened | Result |
|---|---|---|
| `allow` against an `ask` rule, no window | Branch `h1-allow` reached the remote 11 s after the start of the run | pass: `allow` gets past `ask` |
| `deny`, no window | No branch; the hook's message reached the session as the tool's result, and the session reported it and ended its turn normally | pass |
| No decision, no window | No branch; the session reported a permission error | pass: matches the docs, a call that cannot prompt is denied |
| Hook input | Keys without a window: `session_id, transcript_path, cwd, prompt_id, permission_mode, effort, hook_event_name, tool_name, tool_input`. With a window the same plus `scratchpad_dir`. No `tool_use_id`, as the docs say | recorded |
| Prompt visible while the hook waits | `s2`: hook started 19:57:46.817, `Notification permission_prompt` at 19:57:52.939 while the hook kept ticking until 19:58:31. Rafal's screenshot of 20:00:32 shows the prompt with its options | pass |
| Answer in the prompt while the hook waits | Second `s1`: hook started 19:57:21.160, the tool result came at 19:57:23.791 with the hook still ticking | pass |
| Hook after an answer in the prompt | The same hook kept running: last tick 19:57:51.768, and it took a decision at 19:57:53.303. Claude Code does not stop it | finding: the real hook must notice this and end itself |
| A late answer | The `allow` of 19:57:53.303 belonged to a call that had already finished; the transcript shows no second run of that call | pass: a late answer is ignored |
| A decision without a code | The decision file of 19:57:53.131 was meant for `s2` and was taken by the old `s1` hook; the `s2` hook waited on until its limit | finding: a decision must be bound to one prompt |
| Answer from another session | `s4`: hook started 20:03:08.924, `Notification` at 20:03:14.821, decision written 20:03:33.778, hook answered `allow` at 20:03:33.842, tool result 20:03:34.455, branch `s4` in the remote. Rafal: „prompt zniknął sam” | pass |
| Hook limit reached | The first `s1` hook started 19:50:50.878, last tick 19:51:35.611, so it ended at its 45 s limit. No effect on the prompt was seen until the answer below | see the next row |
| Answer in the prompt after the limit | **Inconclusive.** First `s1`, answered about 3 min after the limit: the transcript says "The user doesn't want to proceed" at 19:54:47.170 and "[Request interrupted by user for tool use]", yet the branch reached the remote at 19:54:47.316, so the push did run. `s2`, answered 4.5 min after the limit: the same transcript text at 20:02:59.253 and no branch. Which keys Rafal pressed is not recorded | to repeat with one key press |
| Typed command in the transcript | A `!` command leaves a `type: "user"` record with `<bash-input>` in the transcript of the session it was typed in, before its effect: 19:57:52.605 against the file written at 19:57:53.131, and 20:03:33.384 against 20:03:33.778 | finding: two samples; a tool call by a model is a `tool_use` record instead |
| Local voices | Three voices rendered and played the sentence „Baza wiedzy. Decyzja do podjęcia.”: `Microsoft Paulina Desktop` (System.Speech), and through WinRT `Microsoft Paulina` and `Microsoft Adam` (OneCore). Rendering with `Microsoft Paulina Desktop` took 258 ms inside a running PowerShell | Rafal chose `Microsoft Paulina Desktop` |

## Results of plan 1 (2026-11-06, Tasks 1 and 2)

Claude Code 2.1.319 in terminals, VS Code extension 2.1.318 in the panel, same harness in
`C:\Users\rafal\hub-probes\approvals\`. Times are UTC. The decision commands are the probe's
`decide.mjs`, so none of this tests the code binding of the real hook.

| Spec §8 item | What happened | Result |
|---|---|---|
| 1, prompt after the limit, „Yes” | `s5`, session `5a9651ac`: hook started 09:55:41, last tick at 44 s, killed at its 45 s limit; `1` pressed at 09:56:44, 63 s in; normal tool result `Everything up-to-date` (the branch came from an earlier run of `9e0cbd87`, answered at 3 s) | pass |
| 1, prompt after the limit, „No” | `s6`: last tick at 44 s; „No” at 09:58:11; tool result `The user doesn't want to proceed with this tool use`; no branch. The options were yes and no | pass |
| 2, long limit | `timeout: 28800`, `claude -p`: hook started 09:20:25, alive at 670 s, `allow` at 09:31:46, branch `long1` in the remote | pass up to 670 s; the full 8 hours was not waited out |
| 3, typed check, typed half | Session `04f29863`, five `!` commands: 5 `<bash-input>` records, 0 `tool_use`; each record's timestamp earlier than the run time by 780, 117, 160, 148, 118 ms. A timestamp is not the moment of the disk write, which is why the hook retries its search for 3 s | pass |
| 3, typed check, model half | `claude -p` running the same command through its tool: typed 0, toolUses 1 | pass |
| 3, `!` shell | `SHELL` is Git Bash, parent process `bash.exe` | recorded |
| 4, allow-list, `claude -p` | Listed in the poll as `kind: interactive`, name `repo-81` | **fail**: the poll's `kind` cannot separate `-p` from a window, see below |
| 4, allow-list, `claude --bg` | Session `2ecb48ae`, started from a Claude Code session as the hub does: hook fired at 19:56:38 without `claude attach`; poll `kind: background`, `status: waiting`, `waitingFor: permission prompt`, `state: blocked`; notification 19:56:44; `allow` at 19:56:56; branch `bg1`; `claude stop` worked | pass |
| 4, allow-list, panel | Session `71815877`: poll `kind: interactive`; hook 20:03:20, notification 20:03:26, `allow` 20:03:53 from the window, tool result 20:03:54, branch `v1` | pass |
| 5, `AskUserQuestion` | Session `83a94bff`: the hook fired at 19:44:13 and returned no decision in 2 ms; notification `permission_prompt` at 19:44:19; answered in the window at 19:44:24 | hook fires; pass through as in the spec |
| 5, `ExitPlanMode` | Same session: hook 19:44:41, no decision in 2 ms; notification 19:44:47; approved in the window at 19:46:36 | hook fires; pass through as in the spec |
| 6, two prompts, first try | Parallel `p1`, `p2`, limit 45 s: only the `p1` hook ran; `p2 allow` at 19:49:40 waited as a file; the `p1` hook died at the limit, `p1 deny` came 5 s late. „No” in the window at 19:50:30 rejected both calls | inconclusive on routing, limit too short |
| 6, two prompts, retry | Parallel `p3`, `p4`, limit 300 s: `p3` hook alone from 19:52:50; `p4 allow` 19:55:17, `p3 deny` 19:55:48; hook `p3` answered at 19:55:48.814, hook `p4` started at 19:55:48.922 and answered in 2 ms. `p3` got `Denied by the probe hook.`, `p4` reached the remote; one notification | pass: prompts run one after the other. A hook's `deny` leaves the other call alone, while „No” in the window rejects both |
| 7, `!` in a panel | The line `! node …note.mjs` reached the model as plain text; the model read the file and ran it with its PowerShell tool: typed 0, toolUses 2 | absent: `! ok` needs a hub in a terminal |

### Telling sessions apart from inside the hook

The hook's own environment has values the poll lacks:

| Session | Poll `kind` | `CLAUDE_CODE_ENTRYPOINT` | `CLAUDE_CODE_SESSION_ATTENDED` | Other |
|---|---|---|---|---|
| Terminal window | `interactive` | `cli` | `1` | |
| VS Code panel | `interactive` | `claude-vscode` | `1` | |
| `claude --bg` | `background` | `cli` | `0` | `CLAUDE_JOB_DIR`; `<job dir>/state.json` holds `name` |
| `claude -p` | `interactive` | `sdk-cli` | `0` | |

Over the last 14 days the transcripts' `entrypoint` field reads `cli` 92, `claude-vscode` 30,
`sdk-cli` 14, none 1. A typed dialog fork (`dlg-notatki-d8-probe`) is a `claude --bg` session and has
`cli`, so `ENTRYPOINT` does not exclude it; a voice fork runs `claude -p`
(`~/.claude/skills/talk/lib/fork.mjs:15`), and no voice fork was measured directly. Whether these
variables are documented was not checked.

### Other findings

- **A pasted `!` does not run.** `! node …decide.mjs p4 allow` at 19:53:09 reached the model as plain
  text: no `<bash-input>`, no `<bash-stdout>`, no file written. Haiku still answered that the decision
  was saved, with a made-up time. Pressing `!` by hand and pasting the rest worked at 19:55:17. That the
  paste was the cause is an inference from one sample. The session's other nine `!` commands ran.
- **Every `!` command is followed by a model turn:** thinking and a reply after `<bash-stdout>`, in all
  samples. Each `! ok` in the hub tab therefore costs one model turn.
- **Claude Code does not stop the hook after an answer in the prompt,** seen again: `s5` answered at 3 s,
  the hook ticked on to 42 s.

## Not tried

- The full 8-hour limit.
- Whether the prompt in a panel closes by itself after a hook's `allow`; the tool ran.
- A voice fork's environment.
- The real hook's binding of a decision to one prompt through its code; the probe's hook bound by branch.
