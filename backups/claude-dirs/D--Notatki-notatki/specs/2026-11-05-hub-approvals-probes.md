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

## Not tried

- The repeat of „Answer in the prompt after the limit” with one key press. It was prepared on
  2026-11-05 as branch `s5` and did not run, because the probe window was closed first. It is the first
  probe of the plan.
- A limit longer than 45 s.
- `deny` from the hub with a window.
- Two hooks waiting at once, each answered through its own code.
- A model running the approval command through its Bash tool, checked against the transcript.
- Telling a session that cannot show a prompt from one that can, from inside the hook.
- `AskUserQuestion` and `ExitPlanMode` with the hook installed.

The design lists which of these the plan must run first.
