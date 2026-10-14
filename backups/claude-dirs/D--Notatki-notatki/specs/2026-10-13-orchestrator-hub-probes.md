# Orchestrator hub — probe report

**Spec:** `2026-10-13-orchestrator-hub-design.md` §9.2
**Plan:** `.claude/plans/2026-10-13-orchestrator-hub-plan-1-probes.md`
**Sandbox:** `C:/Users/rafal/hub-probes/`

Each section: question, method, raw result (verbatim), verdict (pass / fail / partial),
fallback taken, spec impact.

## Preliminary findings (plan writing, 2026-10-13, scratch directory)

- Five processes appending 20 lines each to one file within one second: 100 well-formed lines,
  0 broken, in 3 of 3 runs.
- A watcher stopped mid-burst and a second watcher with a catch-up scan: the second saw 100 of
  100 ids, in 3 of 3 runs.
- Concurrent `renameSync` of temp files onto the same `.last.md`: 5–6 of 25 renames per run
  failed with `EPERM`. Spec §5.1 writes `.last.md` by temp file and rename, so this needs a
  decision (retry with backoff, or one last-message file per `Stop` event).
- `claude agents --json`: p50 164 ms, p95 173 ms over 3 runs; keys `cwd, id, kind, name, pid,
  sessionId, startedAt, state, status`; `status` values seen `idle`, `busy`; `state` seen
  `blocked`; no `waitingFor` key in that output.
- `codex exec --json` emits `thread.started` with `thread_id`; with a reviewer instruction in the
  prompt Codex ran no agent while the contract was still in place.

## S1 — hooks in a VS Code panel session, payload fields

**Question.** Do the project hooks fire in a VS Code panel session, including `Notification` with
`permission_prompt`? Which identification fields do the payloads carry?

**Method.** Sandbox hooks (`repo/.claude/settings.json`) recording raw inputs with
`tools/probe-hook.js`. Sessions: VS Code panel in `C:\Users\rafal\hub-probes\repo` (session
`05b0e316…`, ran in `auto` mode), terminal `claude --name probe-space --permission-mode default`
in `repo with space` (session `07b604cf…`), and a VS Code panel retry in default mode
(session `879b1201…`). Prompts: read README, run a `node -e` write (waiting at the permission
prompt), a sentence with `zażółć gęślą jaźń`, exit. Rafal did not read back `/hooks`; hook loading
was shown instead by `SessionEnd` events from both directories before the probe (kept in
`data/events-trust/`). The `/hooks` readout was also the only check that the `StopFailure` hook
registration is accepted; `StopFailure` never fired (below), so that registration is unconfirmed.
Earlier trust-run and other probes' events were moved out of `data/events`, so the counts below
contain only S1 sessions.

**Validity.** The first VS Code attempt ran in `permission_mode: "auto"`: the `node -e` command ran
after 6 s without a prompt, so it is invalid for the `Notification` check (plan rule). The retry in
default mode is the valid VS Code attempt.

**Raw result.**

```
### stats.js
{"event":"Notification","count":2,"sessions":2,"fields":["cwd","hook_event_name","message","notification_type","prompt_id","scratchpad_dir","session_id","transcript_path"],"uptimeP50":18,"uptimeP95":20}
{"event":"PostToolUse","count":5,"sessions":3,"fields":["cwd","duration_ms","effort","hook_event_name","permission_mode","prompt_id","scratchpad_dir","session_id","tool_input","tool_name","tool_response","tool_use_id","transcript_path"],"uptimeP50":20,"uptimeP95":23}
{"event":"SessionEnd","count":3,"sessions":3,"fields":["cwd","hook_event_name","prompt_id","reason","scratchpad_dir","session_id","transcript_path"],"uptimeP50":19,"uptimeP95":22}
{"event":"Stop","count":7,"sessions":3,"fields":["background_tasks","cwd","effort","hook_event_name","last_assistant_message","permission_mode","prompt_id","scratchpad_dir","session_crons","session_id","stop_hook_active","transcript_path"],"uptimeP50":18,"uptimeP95":19}
{"event":"UserPromptSubmit","count":7,"sessions":3,"fields":["cwd","hook_event_name","permission_mode","prompt","prompt_id","scratchpad_dir","session_id","session_title","transcript_path"],"uptimeP50":20,"uptimeP95":21}

### Notification events
2026-10-13T19:37:00.796Z session=07b604cf notification_type=permission_prompt message="Claude needs your permission" prompt_id=4e2c6a03 tool_use_id=absent
2026-10-13T19:39:30.274Z session=879b1201 notification_type=permission_prompt message="Claude needs your permission to use PowerShell" prompt_id=a7268262 tool_use_id=absent

### diacritics in UserPromptSubmit.prompt
2

### cwd values (count)
     10 "cwd":"C:\\Users\\rafal\\hub-probes\\repo with space"
      8 "cwd":"C:\\Users\\rafal\\hub-probes\\repo"
      6 "cwd":"c:\\Users\\rafal\\hub-probes\\repo"

### timelines (time, event, permission_mode, detail, prompt_id prefix)
-- 05b0e316-e05a-45d0-a074-79520939aa1b.jsonl
19:36:16 UserPromptSubmit mode=auto cwd=c:\  prompt_id=4b1c088c  
19:36:18 PostToolUse mode=auto cwd=c:\ Read prompt_id=4b1c088c tool_use_id=present 
19:36:20 Stop mode=auto cwd=c:\  prompt_id=4b1c088c  
19:36:31 UserPromptSubmit mode=auto cwd=c:\  prompt_id=e085d6f4  
19:36:37 PostToolUse mode=auto cwd=C:\ Bash prompt_id=e085d6f4 tool_use_id=present 
19:36:44 Stop mode=auto cwd=C:\  prompt_id=e085d6f4  
19:37:23 UserPromptSubmit mode=auto cwd=C:\  prompt_id=f497472f  
19:37:24 Stop mode=auto cwd=C:\  prompt_id=f497472f  
19:37:45 SessionEnd mode=- cwd=C:\ other prompt_id=ec041ecf  
-- 07b604cf-41a9-48e2-8e55-35041cd88dc7.jsonl
19:36:13 UserPromptSubmit mode=default cwd=C:\  prompt_id=2cb1e5a8  session_title=probe-space
19:36:17 PostToolUse mode=default cwd=C:\ Read prompt_id=2cb1e5a8 tool_use_id=present 
19:36:20 Stop mode=default cwd=C:\  prompt_id=2cb1e5a8  
19:36:44 UserPromptSubmit mode=default cwd=C:\  prompt_id=4e2c6a03  session_title=probe-space
19:37:00 Notification mode=- cwd=C:\ permission_prompt prompt_id=4e2c6a03  
19:37:10 PostToolUse mode=default cwd=C:\ PowerShell prompt_id=4e2c6a03 tool_use_id=present 
19:37:15 Stop mode=default cwd=C:\  prompt_id=4e2c6a03  
19:37:26 UserPromptSubmit mode=default cwd=C:\  prompt_id=d0dee400  session_title=probe-space
19:37:29 Stop mode=default cwd=C:\  prompt_id=d0dee400  
19:37:50 SessionEnd mode=- cwd=C:\ prompt_input_exit prompt_id=0a4f2e09  
-- 879b1201-0550-451f-ac27-0469787213d3.jsonl
19:39:18 UserPromptSubmit mode=default cwd=c:\  prompt_id=a7268262  
19:39:30 Notification mode=- cwd=c:\ permission_prompt prompt_id=a7268262  
19:39:36 PostToolUse mode=default cwd=C:\ PowerShell prompt_id=a7268262 tool_use_id=present 
19:39:40 Stop mode=default cwd=C:\  prompt_id=a7268262  
19:39:42 SessionEnd mode=- cwd=C:\ other prompt_id=a7268262
```

**Verdict: pass, except `StopFailure`.** Every event kind that occurred reached the event log from
the VS Code panel and from the terminal, including `Notification` / `permission_prompt` (VS Code
retry: 12 s after the prompt; terminal: 16 s). `StopFailure`: not triggered (no API error
occurred), so the criterion "every event reaches the event log" is not met for it, and its hook
registration is unconfirmed (Method). A working directory with a space and Polish diacritics in
`prompt` arrive intact.

**Field inventory for Plan 2.**

| Item | Finding |
|---|---|
| Session name | Only `UserPromptSubmit.session_title` (no other event carries it, in any probe). In S1 present only for the named terminal session (`probe-space`); the key is **absent** (not empty) in both VS Code panel sessions (`05b0e316`, `879b1201`). Later probes: present in every session started with `--name`, including `--bg` forks (`dlg-probe`, `dlg-s7`, …) and the `-w` session (`probe-wt`); absent in the `claude -p` session of S2. Names of VS Code panel sessions must come from `claude agents --json`; whether it lists a name for them was not checked |
| Tool call id | `PostToolUse.tool_use_id` present; `Notification` has **no** tool call id |
| Correlation id | Every event carries `prompt_id`. It identifies the **turn being processed**, not the submitted prompt: the `Notification`, the following `PostToolUse` and `Stop` of one turn share it (`07b604cf`: `4e2c6a03`; `879b1201`: `a7268262`). A prompt submitted while the session is busy carries the running turn's id, and the queued prompt's own turn runs under a new id that no `UserPromptSubmit` carried (S11, D12). `SessionEnd` carries either a new id (`05b0e316`: `ec041ecf`) or the last turn's (`879b1201`: `a7268262`) |
| Notification types | S1 saw only `permission_prompt`. Later probes (S6–S11) also recorded `idle_prompt` ("Claude is waiting for your input"): 9 events, each 59.97–60.03 s after the session's preceding `Stop`. The hook must filter on `notification_type: "permission_prompt"` |
| `SessionEnd` fields | `reason`; can also carry `agent_type` (seen `"claude"` on two of the SessionEnd-only sessions below) |
| Permission mode | `permission_mode` in `UserPromptSubmit`, `PostToolUse`, `Stop` |
| `prompt` | Present in `UserPromptSubmit` |
| `cwd` | The drive letter's case changes **within one VS Code session** (`c:\` → `C:\`) |
| Shell tool name | `Bash` in one session, `PowerShell` in others |
| Content-bearing fields | `PostToolUse.tool_response`, `Stop.last_assistant_message`, `UserPromptSubmit.prompt` |
| Notification message | Differs by client: `"Claude needs your permission"` (terminal) vs `"Claude needs your permission to use PowerShell"` (VS Code) |

**SessionEnd-only sessions (found later, in `data/events/`).** Four sessions consist of a single
`SessionEnd` with `reason: "other"` and have no transcript under
`~/.claude/projects/C--Users-rafal-hub-probes-repo/`: `5279bf4c` (05:09:20.199Z), `e491df5e`
(05:09:20.233Z, `agent_type: "claude"`), `e6bfe6f0` (05:10:14.740Z) and `691e09ef`
(05:10:14.757Z, `agent_type: "claude"`). They fall in the S6 window; their cause was not
established.

**Fallback taken.** Spec §9.2 S1 fallback for missing tool call ids: permission waits are cleared
without tool call ids. `prompt_id` gives a better key than timestamps alone.

**Spec impact.** §5.2 (decision for Rafal at Task 14): clear `waiting: permission` by a
`PostToolUse` or `Stop` with the same `prompt_id` as the `Notification`, instead of a tool call id
the `Notification` does not carry (D2). `prompt_id` belongs to the running turn, not to the
submitted prompt; queued prompts need their own rule (S11, D12). §4.1 already requires
case-insensitive path comparison; S1 confirms it is necessary. §5.1 must keep ignoring
`tool_response` (content). Plan 2 note (no spec change proposed): the overview and retention must
tolerate SessionEnd-only sessions (an event log with one `SessionEnd`, no transcript), and the
`Notification` hook must ignore `idle_prompt`.

## S2 — cost of the PostToolUse hook

**Question:** does an asynchronous Node hook (`probe-hook.js`) on every tool call slow a Claude Code session on Windows? Criterion (spec §9.2): spawn `p95Ms` < 500 and median latency with hooks minus without < 100 ms (50 paired tool calls each, 50 `PostToolUse` events with hooks).

**Method:** (1) `spawn-bench.js 50`; (2) `claude -p` (haiku, 50x `node -e 0`) in the throwaway repo with project hooks, then `transcript-latency.js`; (3) the same with `.claude/settings.json` renamed to `.off` (restored afterwards).

**Raw outputs:**

```
node tools/spawn-bench.js 50
{"runs":50,"p50Ms":40,"p95Ms":44,"maxMs":49}

with hooks (session a05efe9c-1dc8-44f0-bb8b-331eeb855dfa)
{"transcript":"C:\Users\rafal\.claude\projects\C--Users-rafal-hub-probes-repo\a05efe9c-1dc8-44f0-bb8b-331eeb855dfa.jsonl","toolCalls":50,"p50Ms":104,"p95Ms":124}
grep -c '"event":"PostToolUse"' data/events/a05efe9c-....jsonl  ->  50

without hooks (session db77357a-7462-425b-a54c-69361174b9e8)
{"transcript":"C:\Users\rafal\.claude\projects\C--Users-rafal-hub-probes-repo\db77357a-7462-425b-a54c-69361174b9e8.jsonl","toolCalls":50,"p50Ms":93,"p95Ms":103}
```

**Verdict: pass.** Both runs had exactly 50 tool calls and the hooked run 50 `PostToolUse` events, so the comparison counts. Spawn p95 44 ms (< 500); median with hooks 104 ms minus without 93 ms = 11 ms (< 100). The run without hooks produced no event file (hooks truly off).

**Fallback:** not needed.

**Spec impact:** none; an async PostToolUse hook on every tool call is acceptable. Event files of both runs moved to `hub-probes/data/events-s2/`.

## S3 — fs.watch reliability, concurrent writes, claude agents --json

**Question.** Do concurrent appends to an event log lose or corrupt events? Does a directory watcher plus a catch-up scan see every event, also across a watcher restart? How do concurrent renames onto one `.last.md` behave? How fast is `claude agents --json` and what does it return?

**Method.** Tools in `C:/Users/rafal/hub-probes/tools/`. Step 1 (runs a1-a3): 100 events into separate files, one watcher running during the burst. Step 2 (runs b1-b3): 100 events into one shared file (`--shared=1`, concurrent hooks of one session), a first watcher for 0.6 s during the burst, then a second watcher for 3 s (catch-up scan plus watch). Step 3: `time-agents.js 10`.

**Raw output, step 1 (separate files, one watcher).** Per run: burst.js, watch-probe.js, count-lines.js.

```
a1
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
a2
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
a3
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
```

**Raw output, step 2 (one shared file, watcher restarted).** Per run: burst.js, count-lines.js, second watcher.

```
b1
{"generated":100,"appended":100,"shared":true,"renameErrors":5,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":50,"watch":50}
b2
{"generated":100,"appended":100,"shared":true,"renameErrors":7,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":50,"watch":50}
b3
{"generated":100,"appended":100,"shared":true,"renameErrors":2,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":46,"watch":54}
```

**Raw output, step 3 (`time-agents.js 10`).**

```
{"runs":10,"p50Ms":161,"p95Ms":171,"failures":[],"sessionCount":5,"keys":["cwd","id","kind","name","pid","sessionId","startedAt","state","status"],"kinds":["background","interactive"],"states":["blocked"],"statuses":["idle","busy"]}
```

**Verdict: PASS.** Criteria: received after catch-up equals generated; broken lines 0.
- Separate files (a1-a3): generated 100 = appended 100 = seen 100 (all via watch), broken 0, leftover tmp 0.
- Shared file (b1-b3): appended 100, wellFormed 100, broken 0; the second watcher saw 100 of 100 each run (catch-up 50/50/46 + watch 50/50/54), so nothing is lost across a watcher restart.
- `claude agents --json`: p50 161 ms, p95 171 ms, no failures; 5 sessions; keys `cwd,id,kind,name,pid,sessionId,startedAt,state,status`; kinds `background,interactive`; states `blocked` (the only value in this run; later polls also showed `done`, in S6, S7 and S10, and `blocked` for the fork `dlg-s7-ps` after it had finished its turn, see D13); statuses `idle,busy`.

**Rename finding: spec impact, decision for Rafal at Task 14.** Concurrent rename onto one file gave `EPERM` in every shared run: `renameErrors` 5, 7, 2 of 25 renames per run (20 %, 28 %, 8 %; `burst.js` renames on every 4th event, so 5 writers × 5 renames; none in the separate-file runs a1-a3). Spec §5.1 writes `.last.md` by temp file plus rename, so with concurrent `Stop` hooks some `.last.md` writes fail. The event log itself was unaffected (0 broken lines). Five writers renaming onto one target in lockstep is harsher than one session's `Stop` hooks (one `Stop` per turn). The realistic case, a reader (the hub or an editor) holding `.last.md` open during a rename, was not tested. Option 2 below avoids both. Options:
1. Keep the single `.last.md`, retry the rename with backoff on `EPERM`.
2. Write one last-message file per `Stop` event and reference it from the event (no rename contention on a shared target).

Not yet decided; waiting for Rafal at Task 14.

## S4 — SendMessage and the recipient

**Question.** Does `SendMessage` trigger `UserPromptSubmit` in the recipient, and is a hub message
distinguishable in its payload? What happens with `crossSessionInbound` set to `hold` and to
`refuse`?

**Method.** Sender: the executing session (`notatki-7a`, permission mode auto). Recipient: Rafal's
terminal session `claude --name probe-recipient` in `C:\Users\rafal\hub-probes\repo` (permission
mode auto, recorded by the hook). One message per variant; for `hold` and `refuse`,
`repo/.claude/settings.local.json` held `{ "crossSessionInbound": "<value>" }` and the recipient
was restarted. The file was deleted afterwards.

**Raw result — default inbound.**

`SendMessage` result:

```
{"success":true,"message":"“S4 probe default inbound” → probe-recipient (another Claude session on this machine; in that session's inbox, not yet read by its Claude — a [Cross-session delivery notice] follows if that session holds it (usually a different permission mode) or refuses it)","msg_id":"ccf00ee5-4c55-41d0-8703-f243b4e5e5c0"}
```

Recipient event (`f27a4367…`), `UserPromptSubmit` at 04:59:18, `prompt` field:

```
<cross-session-message from="uds:\\.\pipe\LOCAL\cc-msg-4f2bd183e38230e3700d0e561d3ecf0a" from-name="notatki-7a" from-mode="prompting">
Probe S4: reply with the single word RECEIVED.
</cross-session-message>
```

Followed by two `PostToolUse` events and `Stop`; the sender received the reply as a
cross-session message: `RECEIVED`.

**Raw result — `hold`.**

`SendMessage` result: `{"success":true, … "msg_id":"4b8b0732-2830-4c04-8f38-ca22dfe06e59"}` with the
note `Note: messaging a new session for the first time under a previously used name (was it restarted?)`.

Notice in the sender session:

```
[Cross-session delivery notice] Your message to another session was held by that session (recipient: uds:\\.\pipe\LOCAL\cc-msg-eabcb0a61b06250316a032161880fa8a; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59). NOT delivered: its Claude has not seen it. Do not report it as delivered, do not wait for a reply, and do not resend while held. The usual cause is that the two sessions run in different permission modes: a terminal session then asks its user to approve, but a Claude Desktop or non-interactive session cannot ask, so there the hold expires undelivered unless the modes come to match. A session can also be set to hold every message. Another notice follows on release, denial or expiry. Tell your user what is held and why, or choose another approach.
```

What the recipient showed (pasted by Rafal):

```
● Held peer message — from uds:\\.\pipe\LOCAL\cc-msg-4f2bd183e38230e3700d0e561d3ecf0a (peer claims name: notatki-7a); preview: «Probe S4 hold: reply RECEIVED.» — not delivered to Claude (1 held). This repository's settings set "crossSessionInbound" to "hold" (a repo may only tighten, so your own "accept" cannot override it); remove the repo setting or exclude it with --setting-sources.
```

No `UserPromptSubmit` in the recipient. When Rafal exited the held session (`SessionEnd`,
`prompt_input_exit`), the held message ended as refused:

```
[Cross-session delivery notice] Your message to another session was refused (recipient: uds:\\.\pipe\LOCAL\cc-msg-eabcb0a61b06250316a032161880fa8a; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59): that session is not accepting cross-session messages (the feature is off there, or a setting or policy there refuses them). Not delivered to that session's Claude. Do not wait for a reply and do not resend; tell the user, or choose another approach.
```

**Raw result — `refuse`.**

`SendMessage` result: `{"success":true, … "msg_id":"ae0a2392-2eee-4b3c-b277-1b34e22ccc21"}`, then:

```
[Cross-session delivery notice] Your message to another session was refused (recipient: uds:\\.\pipe\LOCAL\cc-msg-140f081b5e1ebea74889de322c44af9c; msg_id: ae0a2392-2eee-4b3c-b277-1b34e22ccc21): that session is not accepting cross-session messages (the feature is off there, or a setting or policy there refuses them). Not delivered to that session's Claude. Do not wait for a reply and do not resend; tell the user, or choose another approach.
```

No `UserPromptSubmit` in the recipient. The refusing session was still listed by `ListAgents`.

**Verdict: pass** (all three behaviours written down).

1. A delivered message triggers `UserPromptSubmit` in the recipient, and it is distinguishable:
   `prompt` is wrapped in `<cross-session-message from="…" from-name="<sender>" from-mode="…">`.
2. `SendMessage` returns `"success":true` in every variant, including held and refused messages. The
   real outcome arrives later, as a `[Cross-session delivery notice]` in the sender session, and
   only for held, refused, released or expired messages; an accepted delivery has no notice.
3. A repo-level `hold` cannot be released from the recipient UI ("a repo may only tighten"); a held
   message is refused when the recipient session ends.

Not tested: a hold caused by different permission modes. The `SendMessage` tool description says
that a session in a different permission mode than the sender holds messages for its user's
approval. Both sessions here ran in auto mode (only auto → auto was tried). The wrapper recorded
`from-mode="prompting"` for a sender running in auto mode, so the "mode" compared for a hold may
not be `permission_mode` at all.

Also not tested: the inner-text extraction for the hash. Only one plain line was sent. The
wrapper puts `\n` before and after the inner text (raw `prompt`:
`"<cross-session-message …>\nProbe S4: reply with the single word RECEIVED.\n</cross-session-message>"`),
and whether `<`, `&` or `"` inside the text are escaped is unknown.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §6.3 send record: tool success must not mark a record `sent`. Delivery is confirmed by the
  recipient's `UserPromptSubmit` event carrying the hub's `from-name` wrapper (matched by the hash
  of the inner text); a held or refused notice sets `held` / `not-sent`; with neither, the record
  stays `delivery-unknown`. §8.1 row "`SendMessage` failed" (design.md:406) assumes a tool error
  for `crossSessionInbound: refuse`; S4 shows `"success":true` and a later refused notice instead.
  The hash rule needs the multi-line / escaping case checked (above). (D3)
- §5.1 / §5.2: the hook can record that a prompt came from another session (the wrapper's
  `from-name`, without the text), for display and for D3's delivery confirmation. The §5.2
  clearing rule stays as approved: a hub-caused `UserPromptSubmit` clears `waiting: decision` like
  any other prompt, and the next `Stop` with the marker restores it. (D4)
- §5.5 / §9 (hub setup), **untested**: per the `SendMessage` tool description only, a recipient in
  a different permission mode holds hub messages for its user's approval. Project sessions run in
  different modes (S1: the first VS Code panel session ran in `auto`, the terminal session and the
  VS Code retry in `default`), so one hub mode cannot match them all; the hub relies on D3's
  `held` record instead of a setup rule. An auto → default hold probe may be worth running before
  Plan 2. (D5)

## S5 — Monitor expiry wakes an idle hub

**Question.** Does a `Monitor` expiry notice wake an idle session, so the hub can re-arm its watcher
without anyone typing?

**Method.** In the executing session, which is the controller's VS Code panel session, not a
terminal tab like the hub (`claude --name hub`, spec §3 decision 9): one event `before-1` written to `data/s5/s5.events.jsonl`;
`Monitor` started with `timeout_ms: 60000` on
`node C:/Users/rafal/hub-probes/tools/watch-probe.js --dir=C:/Users/rafal/hub-probes/data/s5 --seconds=3600 --emit=1 --state=C:/Users/rafal/hub-probes/data/s5-state.json`;
Rafal asked not to type; the session ended its turn. On the expiry notice: a gap event `gap-1`
written while no watcher ran, the same monitor re-armed, then stopped with TaskStop.

**Raw result.**

| Time (UTC) | What happened |
|---|---|
| 05:02:55 | `before-1` written |
| ~05:03:05 | Monitor `bz03m7bb3` started; event `catch-up before-1` |
| 05:03:08 | Turn ended; session idle, no user input |
| ~05:04:08 | New turn without user input, started by: `[Monitor expired after 1m with 1 event delivered. Re-arm it if you still need the watch.]`; `gap-1` written (05:04:08) |
| 05:04:17 | Monitor `bw2alyb89` re-armed; event `catch-up gap-1`; `before-1` not repeated |

**Verdict: pass.** The expiry notice woke the idle session; a new monitor ran 9 s after the wake-up
(criterion: within one minute); the catch-up reported the event written during the gap, and the
state file prevented a repeat of the earlier event.

**Fallback taken.** None needed.

**Spec impact.** None. §5.5 holds as written: re-arm on the expiry notice, catch up from the event
logs, and keep a record of reported events. Assumption, not tested: that the expiry notice wakes an
idle terminal session the same way it woke this VS Code panel session.

## S6 — fork launch

**Question.** Does `--bg` combine with `--resume <id> --fork-session`? How are a start prompt and the
role passed? Can the fork reach the dialog directory? How does a fork of a busy session behave?

**Method.** Source session: Rafal's interactive `claude --name probe-recipient` in
`C:\Users\rafal\hub-probes\repo` (permission mode auto), given one line of history
(`Zapamiętaj hasło: ŻURAW. Odpowiedz tylko OK.`). Forks launched by the executing session; results
read from the forks' own hook events (`Stop.last_assistant_message`) and `claude agents --json`.

**Raw result — launch with a start prompt.**

```
$ cd C:/Users/rafal/hub-probes/repo && claude --bg --resume a779a5d4-240a-404e-bc9d-8da5af3e845c --fork-session --name dlg-probe "Probe S6: you are a read-only analytical partner. Reply with ROLE OK and quote the last user message you remember."
Starting background service…
backgrounded · 1867e626 · dlg-probe
  claude agents             list sessions
  claude attach 1867e626    open in this terminal
  claude logs 1867e626      show recent output
  claude stop 1867e626      stop this session
exit=0
```

`claude agents --json` (20 s later):
`{"pid":4716,"id":"1867e626","cwd":"C:\\Users\\rafal\\hub-probes\\repo","kind":"background","startedAt":1791954387411,"sessionId":"1867e626-61a2-46aa-97ef-7e2775bf3204","name":"dlg-probe","status":"idle","state":"done"}`

Fork `Stop` at 05:06:35, `last_assistant_message`: `… ROLE OK\n\nThe last user message I remember before this one:\n\n> Zapamiętaj hasło: ŻURAW. Odpowiedz tylko OK.`

`claude logs dlg-probe`: 124 046 bytes of terminal screen output (ANSI), not structured text.

**Raw result — dialog directory.** Rafal attached (`claude attach 1867e626`) and asked to write
`C:/Users/rafal/hub-probes/data/dialogs/probe/decisions.md`. The fork first declined on its own,
holding to the read-only role from its start prompt, and ended the turn with the gate marker from
the sandbox `CLAUDE.md`:

```
⏸ Czeka na decyzję: czy zdjąć rolę read-only i zapisać `decisions.md` z linią `test`?
```

After `tak zapisz`: `PostToolUse` `Write` on `C:\Users\rafal\hub-probes\data\dialogs\probe\decisions.md`
at 05:09:50, no `Notification` / `permission_prompt` (the fork ran in `permission_mode: "auto"`, as
did its source; see verdict 3 for why inheritance is not shown); the file exists with the content `test`. The fork also emitted
`Notification` `idle_prompt` ("Claude is waiting for your input") 60 s after its first turn.

**Raw result — fork of a busy session.** First attempt invalid: Rafal had restarted
`probe-recipient` (new id `69788a55-…`, started 05:11:01) and the fork used the old, ended id
`a779a5d4-…`; that fork (`dlg-busy`, `56a59b67`) answered from the ended session's history.
Second attempt with the id read from `claude agents --json` right before launch:

```
05:16:29
recipient: 69788a55-d9cd-4c61-89b1-d9d9ff4efd9e busy
backgrounded · db9975a8 · dlg-busy2
exit=0
```

The source session was running `node -e "setTimeout(()=>{},30000)"` (prompt 05:16:20, tool result
05:16:54). Fork `Stop` at 05:16:50, `last_assistant_message` (start):
`Ostatnia wiadomość od Ciebie przed tym probe to `Uruchom: node -e "setTimeout(()=>{},30000)"`. Ostatnie wywołanie narzędzia w mojej historii nie ma wyniku.`

All three forks stopped: `stopped 1867e626`, `stopped 56a59b67`, `stopped db9975a8`.

**Verdict: pass.**

1. `--bg` combines with `--resume <id> --fork-session --name <name>` and a positional start prompt;
   the fork gets its own id and sessionId, and the source history.
2. The role passed in the start prompt holds: the fork refused a write until told otherwise.
3. The fork reached a directory outside the project; in auto mode no permission prompt appeared, so
   the write boundary has to come from settings (S7). The directory tested was
   `C:/Users/rafal/hub-probes/data/dialogs/probe`, not the spec location
   `~/.claude/hub/projects/<project>/dialogs/` (§4.1); a fork writing there is untested, and in this
   run the auto-mode classifier refused Task 1 step 4 (edits of `~/.claude/CLAUDE.md` and
   `~/.codex/AGENTS.md`) as "[Self-Modification]". Whether it also blocks writes under
   `~/.claude/hub/` is unknown. The fork ran in `auto`, but so did the source session and so
   does the account default (a plain `claude --name probe-recipient` started in `auto`;
   `~/.claude/settings.json` has an `autoMode` block), so "a fork inherits the source's permission
   mode" is not shown.
4. A fork of a busy session starts and sees the history up to the running tool call, without its
   result. One valid sample (`dlg-busy2`, `db9975a8`).

**Final command for spec §6.5 step 2 (S6 part):**
`claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> "<start prompt with the role>"`,
run in the project directory, with `<sessionId>` read from `claude agents --json` by name right before launch.
S7 adds `--settings` and `--add-dir`; the full command in the tested argument order is in D8.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §6.5 step 1: a restart keeps the session name but changes its id, so the hub must resolve the id
  from `claude agents --json` immediately before forking (S6 caught a stale id). This applies to
  forks only; sends keep §6.2's baseline `sessionId` (D6).
- §6.5 step 1: forking a busy session works; the "only idle sessions" precaution can be dropped,
  with the caveat that the fork does not see the result of a running tool call. One sample (D7).
- §6.5 step 2: the forks ran in `auto` mode like their source and the account default, so
  inheritance is not shown; the write boundary needs explicit settings either way (S7, D8).
- §4.1 / §6.5: the fork's write into the spec's dialog location under `~/.claude/hub/` is untested
  (D8).
- §5.6: `claude logs` is a terminal screen dump; the hub reads results from `Stop` events instead.

## S7 — write boundary of the fork

**Question.** Can a fork launched with `--settings` permission rules write into its dialog directory
but not into the project repository, given that the forks run in `auto` permission mode (as their
source did; S6 verdict 3)?

**Method.** Variant A only (it decided). Settings file `C:/Users/rafal/hub-probes/tools/fork-settings.json`:

```json
{
  "permissions": {
    "allow": ["Edit(//C:/Users/rafal/hub-probes/data/dialogs/probe/**)"],
    "deny": ["Edit(./**)", "Bash"]
  }
}
```

Fork of `probe-recipient` (id `69788a55-d9cd-4c61-89b1-d9d9ff4efd9e`, read from `claude agents --json`
right before launch), run in `C:/Users/rafal/hub-probes/repo`. The verdict rests on `ls`.

**Raw result - first attempt (invalid, command-line pitfall).** With the brief's argument order
(`... --add-dir <dir> "<prompt>"`) the variadic `--add-dir` swallowed the prompt: the fork started
with no task (`backgrounded · 58f7132f · dlg-s7 (idle — send a prompt to start)`), no UserPromptSubmit or tool events
(its events file holds only one SessionEnd at 05:19:08), nothing was written. Stopped (`stopped 58f7132f`).

**Raw result - valid attempt (prompt placed before `--add-dir`).**

```
$ claude --bg --resume 69788a55-d9cd-4c61-89b1-d9d9ff4efd9e --fork-session --name dlg-s7 --settings C:/Users/rafal/hub-probes/tools/fork-settings.json "Probe S7: write C:/Users/rafal/hub-probes/data/dialogs/probe/s7-inside.md containing inside, then try to write ./s7-outside.md containing outside, then report literally what happened to each." --add-dir C:/Users/rafal/hub-probes/data/dialogs/probe
backgrounded · 629afdce · dlg-s7
```

`claude agents --json` (50 s later):
`{"pid":16796,"id":"629afdce","cwd":"C:\Users\rafal\hub-probes\repo","kind":"background","startedAt":1791955149474,"sessionId":"629afdce-8397-4e4c-9cb0-e89e98abbf00","name":"dlg-s7","status":"idle","state":"done"}`

Fork hook events (`data/events/629afdce-….jsonl`): `UserPromptSubmit` 05:19:10 (`permission_mode: "auto"`);
exactly one `PostToolUse`, 05:19:13, `Write` on `C:\Users\rafal\hub-probes\data\dialogs\probe\s7-inside.md`
(content `inside\n`); `Stop` 05:19:31; no `Notification`, no permission prompt. No `PostToolUse` for the
outside write. Literal tool results quoted by the fork in `Stop.last_assistant_message`:

```
File created successfully at: C:\Users\rafal\hub-probes\data\dialogs\probe\s7-inside.md (file state is current in your context — no need to Read it back)

<tool_use_error>This background session hasn't isolated its changes yet. Call EnterWorktree first so edits land in a worktree instead of the shared checkout, then retry this edit using the worktree path (a path inside a linked git worktree, including one you create with `git worktree add`, is accepted). (To disable this guard for this repo, set `"worktree": {"bgIsolation": "none"}` in .claude/settings.json.)</tool_use_error>
```

`ls`:

```
C:/Users/rafal/hub-probes/data/dialogs/probe/:
s7-inside.md        (7 bytes, content "inside")
ls: cannot access 'C:/Users/rafal/hub-probes/repo/s7-outside.md': No such file or directory
```

Variants B and C not needed (inside file exists; outside file absent). Cleanup: `stopped 629afdce`,
`repo/s7-outside.md` absent, `claude agents --json`: no `dlg-s7*` session remains.

**Verdict: pass (updated after the control and shell runs), scoped to what was tested: the `Write` tool into `repo/`, and `PowerShell` `Set-Content` into `repo/` and into the dialog directory.** The inside write succeeded without a prompt; the
outside write did not happen; the fork was never `blocked` on a permission prompt.

**Caveat (resolved by the control run below).** In variant A the outside write was refused not by the `deny` rule but by the background-session
worktree-isolation guard ("hasn't isolated its changes yet. Call EnterWorktree first"). It is not proven
that `Edit(./**)` deny or the `//C:/` allow form had any effect; the guard may by itself explain both
results (and the fork would be free to call `EnterWorktree` and then write in a worktree). The control run isolated the deny rule. Also found: with `--add-dir` the prompt must precede it on the command line.

### Control run (`dlg-s7-control`)

**Purpose.** Test the deny rule without the bg worktree guard. Settings file
`C:/Users/rafal/hub-probes/tools/fork-settings-control.json` = variant A rules plus `"worktree": {"bgIsolation": "none"}`:

```json
{
  "permissions": {
    "allow": ["Edit(//C:/Users/rafal/hub-probes/data/dialogs/probe/**)"],
    "deny": ["Edit(./**)", "Bash"]
  },
  "worktree": {"bgIsolation": "none"}
}
```

Launch: same command as the decisive run (prompt before `--add-dir`), `--name dlg-s7-control`, fork of
`69788a55-…`; `s7-inside.md` deleted beforehand. Output: `backgrounded · e0c438b3 · dlg-s7-control`.
`claude agents --json`: `{"id":"e0c438b3","sessionId":"e0c438b3-db38-4679-bd9f-5a25b156348d","name":"dlg-s7-control","status":"idle","state":"done"}`.

Hook events: `UserPromptSubmit` 05:21:05 (`permission_mode: auto`); one `PostToolUse` `Write` on
`s7-inside.md` 05:21:11; `Stop` 05:21:25; no Notification. Literal tool result of the outside write
(from `Stop.last_assistant_message`):

```
<tool_use_error>File is in a directory that is denied by your permission settings.</tool_use_error>
```

`ls`: `s7-inside.md` exists (7 bytes, "inside"); `repo/s7-outside.md`: No such file or directory.
The `worktree` key was not rejected, and the guard message no longer appeared. Cleanup: `stopped e0c438b3`,
`s7-outside.md` absent, no `dlg-s7*` session remains.

**Result.** With the worktree guard disabled, the outside write is refused by the settings `deny` rule
(`Edit(./**)` also covers `Write`), and the `//C:/` allow form permits the inside write, in `auto` mode.

### Shell write test (fix round 1)

**Question.** The first runs exercised only the `Write` tool. Does the same `--settings` boundary hold for
the shell tool (`PowerShell` here), and does `deny: "Bash"` cover it? Forks of `69788a55-d9cd-4c61-89b1-d9d9ff4efd9e`
(source session ended; forking it works), prompt before `--add-dir`, task: `Set-Content` into `./s7-ps-outside.md`,
then into `…/dialogs/probe/s7-ps-inside.md`, using the PowerShell tool only.

**Run 1 - `dlg-s7-ps` (`fork-settings-control.json`: deny `Edit(./**)` + `Bash`, bgIsolation none).** `backgrounded · cafd6b26`;
`claude agents --json`: `status idle, state blocked` (fork finished its turn, tool unavailable). Events: `UserPromptSubmit`,
two `Glob` PostToolUse (the fork's own verification), `Stop`; no PowerShell PostToolUse. Literal result of both calls
(from `Stop.last_assistant_message`):

```
Error: No such tool available: PowerShell. PowerShell is disabled for this session, in subagents as well as here.
```

`ls`: neither `repo/s7-ps-outside.md` nor `dialogs/probe/s7-ps-inside.md` exists. So `deny: "Bash"` removes the PowerShell
tool entirely (the earlier turns of the same source history had it, so the removal comes from these settings). Nothing
could be written through the shell, inside or outside.

**Run 2 - `dlg-s7-ps2` (`C:/Users/rafal/hub-probes/tools/fork-settings-control-nobashdeny.json`: deny only `Edit(./**)`,
allow unchanged, bgIsolation none).** The brief's step 3 (repeat with PowerShell denied) was inverted: run 1 already
showed the tool gone, so run 2 removed the shell deny to see whether the path rules alone constrain PowerShell.

```json
{
  "permissions": {
    "allow": ["Edit(//C:/Users/rafal/hub-probes/data/dialogs/probe/**)"],
    "deny": ["Edit(./**)"]
  },
  "worktree": {"bgIsolation": "none"}
}
```

`backgrounded · d89ea064 · dlg-s7-ps2`; `claude agents --json`: `status idle, state done`. Events: one PostToolUse,
`PowerShell` `Set-Content -Path C:/Users/rafal/hub-probes/data/dialogs/probe/s7-ps-inside.md -Value inside`; no PostToolUse
for the outside command. Literal tool calls and harness `tool_result`s from the fork's transcript
(`~/.claude/projects/C--Users-rafal-hub-probes-repo/d89ea064-d46f-4272-b44c-2bee051f5472.jsonl`, JSON
string escapes undone); the fork's `Stop.last_assistant_message` quotes the same two results:

```
tool_use   toolu_01YQx3BeFUiX3rD94MTobMfg  Set-Content -Path ./s7-ps-outside.md -Value outside
tool_result (is_error: true)
set-content targeting 'C:\Users\rafal\hub-probes\repo\s7-ps-outside.md' was blocked. For security, Claude Code may only access files in the allowed working directories for this session: 'C:\Users\rafal\hub-probes\repo', 'C:/Users/rafal/hub-probes/repo', 'C:\Users\rafal\hub-probes\data\dialogs\probe'.

tool_use   toolu_01Lg2AicTcE68bDpLnM5CyTr  Set-Content -Path C:/Users/rafal/hub-probes/data/dialogs/probe/s7-ps-inside.md -Value inside
tool_result (is_error: false)
(PowerShell completed with no output)
```

`ls`: `repo/s7-ps-outside.md` does not exist; `dialogs/probe/s7-ps-inside.md` exists (content `inside`). The block message
is worded as a working-directory check yet names the repo as allowed, so whether the refusal comes from the `Edit(./**)`
deny rule is inferred, not proven.

**Shell write test result.** With `deny: ["Edit(./**)"]` (no shell deny) a PowerShell `Set-Content` into the repo was
refused and one into the dialog directory succeeded. With `deny` also containing `"Bash"`, the PowerShell tool is not
available at all. Not tested: other shell write routes (`Out-File`, `>` redirection, `node -e`, `git`), the Bash tool itself.

**Fallback.** None taken. If the boundary must not depend on the guard: default permission mode, Rafal
approves each fork write himself.

**Spec impact (for Rafal at Task 14).**

- §6.5 step 2: pass the start prompt before `--add-dir`, or the variadic option swallows it. Tested argument order (decisive run, command line above): `claude --bg --resume <id> --fork-session --name <name> --settings <file> "<prompt>" --add-dir <dir>`, i.e. `--settings` before the prompt, the prompt before `--add-dir`.
- §6.5 step 2: `--settings <file>` with the `//C:/` allow form plus `deny ["Edit(./**)"]` refused a `Write` and a PowerShell `Set-Content` into `repo/` and allowed both into the dialog directory (control runs, guard disabled via `worktree.bgIsolation: none`); with the guard on, it is a second, independent barrier for `Write`. Adding `"Bash"` to `deny` removes the PowerShell tool from the fork entirely. Other shell write routes were not tested, so "cannot write to the repo by any route" is not established.
- §6.5 step 3 / §7: with `"Bash"` in `deny` the fork has no shell at all, so it cannot run `git log` or `git diff`, although §7 lists "the diff of a session's branch" as an element (design.md:367-369) and the fork is the analytical partner. This is the price of `"Bash"` in `deny` (D8).
- §4.1 / §6.5: the tested dialog directory was `C:/Users/rafal/hub-probes/data/dialogs/probe`; the spec location `~/.claude/hub/projects/<project>/dialogs/` is untested (S6 verdict 3, D8).
- A fork may escape the guard via `EnterWorktree`; the fork itself declined to do so unprompted.

## S8 — role file survives /clear

**Question.** Does a role given with `--append-system-prompt-file` survive `/clear`?

**Method.** Role file `C:/Users/rafal/hub-probes/tools/role.md`:
`You are the probe hub. When the user asks "kim jesteś?", answer exactly: HUB ROLE ACTIVE`.
Rafal ran `cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-role --append-system-prompt-file C:/Users/rafal/hub-probes/tools/role.md`,
asked `kim jesteś?`, ran `/clear`, asked again, exited. Answers confirmed from the hook events.

**Raw result.**

```
-- 41dac455-e21c-4628-94ef-d6066343bf82.jsonl
05:25:12 UserPromptSubmit  probe-role prompt="kim jesteś" last=""
05:25:16 Stop   prompt="" last="HUB ROLE ACTIVE"
05:25:46 SessionEnd clear  prompt="" last=""
-- f4622a21-c8a6-44af-b31b-53be579ee5d7.jsonl
05:25:55 UserPromptSubmit  probe-role prompt="kim jesteś?" last=""
05:25:59 Stop   prompt="" last="HUB ROLE ACTIVE"
05:26:08 SessionEnd prompt_input_exit  prompt="" last=""
```

(columns: time UTC, event, reason, session_title, prompt, last assistant message)

Rafal's readout: before `/clear` `HUB ROLE ACTIVE`, after `/clear` `HUB ROLE ACTIVE`. The CLI accepted
the flag without a message.

**Verdict: pass.** The role from the file answers `HUB ROLE ACTIVE` before and after `/clear`.

**Side finding.** `/clear` ends the session (`SessionEnd` with `reason: "clear"`) and continues
under a **new session id** in the same terminal tab, as Rafal saw it (`41dac455…` → `f4622a21…`);
the name (`session_title: "probe-role"`) carries over. That it is the same process is not
verifiable from the events.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §4 hub start: start the hub with `--append-system-prompt-file` carrying the hub role, so
  `/clear` does not need the skill to be invoked again. §8.1 row "Hub after `/clear` or restart"
  (design.md:411) says the hub "reloads its role through the skill `hub` (probe S8)"; with the role
  file it keeps the role, and it still re-registers its new id and rebuilds the overview. (D9)
- §5.1: the hub excludes itself by `sessionId` in `hub-sessions.json`, but `/clear` gives it a new
  id; the hub must re-register itself after `/clear` (or be recognised by name / role).
- §5.2 / §6.2: a `SessionEnd` with `reason: "clear"` followed by a new id under the same name may
  be shown as a continuation of the same tab, for display only. For sends the baseline `sessionId`
  stays: the new session lacks the context Rafal approved the message against, so check 1 of §6.2
  fails and the hub shows the new candidate id for Rafal to re-approve. (D6)

## S9 — Codex follow-up sandbox and working directory

**Question:** do a Codex consultation (`codex exec -s read-only`) and its follow-up (`codex exec resume <id> -c sandbox_mode="read-only"`) stay read-only, keep the working directory and thread context, pass Polish diacritics via stdin, and launch no other agent?

**Method:** prompts `s9-first.md` / `s9-follow.md` fed through stdin; call 1 `codex exec -s read-only -C <repo> --json -o s9-1.md -`; call 2 `codex exec resume <id> -c sandbox_mode="read-only" ...`; call 3 (informational) the same resume without `-c`. Codex CLI 0.147.0, Windows 11, contract removed from `~/.codex/AGENTS.md`. Files: `C:/Users/rafal/hub-probes/data/codex/s9-{1,2,3}.{md,jsonl}`.

**codex-commands.js outputs (commands shortened):**

| Call | threadId | itemTypes | agentLaunches | otherToolItems | commands |
|---|---|---|---|---|---|
| 1 | 01a136b7-2195-70d0-8cb4-81ac73919aa0 | error 1, agent_message 3, command_execution 4 | [] | [] | 4 x powershell.exe: read of superpowers SKILL.md (exit -1, then 0), `$PWD.Path; Test-Path ...`, `Get-Content -TotalCount 1 .\README.md; $PWD.Path` |
| 2 (resume, with override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |
| 3 (resume, no override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |

The `error` item is not the write refusal. In all three streams it is the same warning:

```
{"type":"item.completed","item":{"id":"item_0","type":"error","message":"clamping SessionEnd hook timeout to 3s in C:\\Users\\rafal\\.codex\\hooks.json"}}
```

The refusal appears only on stderr, as an `apply_patch` rejection, in `s9-2.err:4` and `s9-3.err:3`:

```
s9-2.err:4  2026-10-13T19:22:54.666753Z ERROR codex_core::tools::router: error=patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings
s9-3.err:3  2026-10-13T19:23:24.388994Z ERROR codex_core::tools::router: error=patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings
```

Call 1 has no `.err` capture, so its write route is not shown; for call 1 the evidence is Codex's answer and `ls`. The `--json` streams contain no item for a rejected write, and no shell write command appears in any call (the commands are listed above), so no shell write was tried; the only write route seen is `apply_patch` (calls 2 and 3). The message "rejected by user approval settings" does not separate the sandbox from the approval policy. In call 1 one shell command also failed with `windows sandbox: CreateProcessWithLogonW failed: 267` (exit -1), retried successfully.

**Answers (verbatim):**

Call 1:
```
# Wynik próby S9

- Pierwsza linia: `# Probe sandbox`
- Utworzenie `s9-write-1.txt`: **nie powiodło się**.
- Bieżący katalog: `C:\Users\rafal\hub-probes\repo`

zażółć gęślą jaźń.
```

Call 2:
```
# Wynik dalszej próby S9

It did not succeed.

`C:\Users\rafal\hub-probes\repo`

W pierwszej wiadomości poprosiłeś o zacytowanie pierwszej linii `README.md`, próbę utworzenia `s9-write-1.txt` z treścią `x`, raport wyniku, wydrukowanie bieżącego katalogu oraz dokładne powtórzenie frazy „zażółć gęślą jaźń.”
```

Call 3:
```
# Wynik próby S9

It did not succeed.

`C:\Users\rafal\hub-probes\repo`

W pierwszej wiadomości poprosiłeś o zacytowanie pierwszej linii `README.md`, próbę utworzenia `s9-write-1.txt` z treścią `x`, dosłowne podanie wyniku, wydrukowanie bieżącego katalogu oraz dokładne powtórzenie frazy „zażółć gęślą jaźń.”
```

**ls results:** after call 2 and after call 3, `ls repo/s9-write-*.txt` -> `No such file or directory`; repo contains only `CLAUDE.md`, `README.md`. No s9-write-*.txt to delete.

**Verdict: pass, for `apply_patch` writes.** No file was written in any of the three calls (calls 2 and 3: `apply_patch` rejected on stderr; call 1: Codex's answer and `ls`, stderr not captured); shell writes were not attempted, so they are not covered. Working directory is the repo, context recalled, diacritics intact, no agent launch, no other tool items.

**Fallback:** not needed (would be a fresh `codex exec -s read-only -C <dir>` per follow-up with `thread.md` as context).

**Spec impact:**
- The follow-up kept read-only with the `-c sandbox_mode="read-only"` override; keep passing it (cheap, explicit).
- Without the override (call 3) the resumed thread was still read-only on this machine: `~/.codex/config.toml` sets no `sandbox_mode` (only a Windows `sandbox = "elevated"`), so resume evidently inherits the thread's read-only policy or the default is read-only. The cause (inheritance vs. default) was not separated; do not rely on it, keep the override.
- `resume` takes the working directory from the shell cwd (ran from the repo); the `-C` flag was not passed on resume and cwd was correct.
- Codex on its own reads the superpowers skill (using-superpowers SKILL.md) at the start of call 1; harmless here, but it is extra token use.
- stderr noise (models cache `supports_parallel_tool_calls`, Figma MCP AuthRequired) does not affect results; send stderr away from stdout JSONL, to a file the hub keeps (the write refusal is visible only there).
- §8.1 "Codex consultation failed": an `error` item in the `--json` stream is not a failure (here it was the `hooks.json` timeout warning in every call); failure stays exit code, timeout or an empty `-o` file, as the spec says (D11).

## S10 — background session in a new worktree

**Question:** does `claude --bg -w probe-wt` start a background session in a new git worktree, and how does `claude rm` clean it up?

**Method:** brief Step 1-3 verbatim from C:/Users/rafal/hub-probes/repo. Before: `git worktree list` -> `C:/Users/rafal/hub-probes/repo  043c443 [master]`. Two attempts: the first before the workspace was trusted, the second after Rafal accepted the trust prompt by running `claude` once in the repo.

**Attempt 1 (untrusted workspace), launch stdout+stderr, exit 1:**

```
Workspace not trusted. Run `claude` in C:\Users\rafal\hub-probes\repo once and accept the trust prompt, then retry.
```

Finding: `claude --bg` requires workspace trust, while `claude -p` did not. No session or worktree was created.

**Attempt 2 (after trust), launch, exit 0:**

```
Starting background service…
backgrounded · df73ebe4 · probe-wt
  claude agents             list sessions
  claude attach df73ebe4    open in this terminal
  claude logs df73ebe4      show recent output
  claude stop df73ebe4      stop this session
```

`--allowedTools` and `--` were accepted; the session did not block on a permission prompt (both commands ran).

**agents JSON line (after ~30 s):**

```
{"pid":32300,"id":"df73ebe4","cwd":"C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt","kind":"background","startedAt":1791919663452,"sessionId":"df73ebe4-e63d-4ad5-b912-1680681f9537","name":"probe-wt","status":"idle","state":"done"}
```

**`git worktree list` after launch:**

```
C:/Users/rafal/hub-probes/repo                             043c443 [master]
C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt  043c443 [worktree-probe-wt] locked
```

**`claude logs probe-wt`:** raw output is a full terminal (ANSI) screen dump of ~218 KB; the relevant lines after stripping escape codes:

```
⎿ $ git rev-parse --show-toplevel; git branch --show-current
│ git rev-parse --show-toplevel │ C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt │
│ git branch --show-current     │ worktree-probe-wt │
```

The header showed the cwd `~\hub-probes\repo\.claude\worktrees\probe-wt`. Note: the session's startup git-status snapshot still described the main checkout (branch master); only the actual commands show the worktree.

**Location check:** worktree path `C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt` lies under `C:/Users/rafal/hub-probes/` -> `claude rm` allowed.

**`claude rm df73ebe4` (three runs):**

Run 1, exit 1:
```
kept df73ebe4 — its worktree is still at “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
  Worktree not removed. Claude Code couldn't remove it (“some of its files could not be deleted: EBUSY; a program may have them open, so try removing it again”). The session stays until the directory is gone.
  close anything using the directory or fix its permissions, then retry: claude rm df73ebe4 --force-remove-worktree 1da888643bec76c2c41cfef4c14fdf46
```
After run 1 `git worktree list` showed only the main repo, but the directory `.claude/worktrees/probe-wt` remained containing only a `.git` file.

Run 2, exit 1:
```
kept df73ebe4 — its worktree is still at “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
  Worktree not removed. Refused before anything was deleted (“the repository's worktree registrations cannot be vetted before git lists them (.git is a link, a mount point, or cannot be probed)”); remove it by hand. The session stays until the directory is gone.
  remove the directory yourself if you don't need it, then run 'claude rm df73ebe4' again
```

After `rm -rf .claude/worktrees/probe-wt` by hand (inside the throwaway repo), run 3, exit 0:
```
removed df73ebe4
  worktree: “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
```

`git worktree list` after: `C:/Users/rafal/hub-probes/repo  043c443 [master]`. The branch `worktree-probe-wt` was NOT deleted by `claude rm` (`git branch --list` still shows it). `claude agents --json` lists no probe-wt.

**Events:** the session wrote 4 events (UserPromptSubmit, PostToolUse, Stop, SessionEnd) to `data/events/df73ebe4-e63d-4ad5-b912-1680681f9537.jsonl`; moved to `data/events-s10/`. Hooks from the project fired in the worktree session (project settings are inherited by the worktree checkout).

**Verdict:** PASS (partial on cleanup). `--bg -w` created a background session with cwd in a new worktree under `<repo>/.claude/worktrees/<name>`, on a new branch `worktree-<name>` differing from `master`; the worktree appears in `git worktree list`. `claude rm` on Windows needed a retry: the first run hit EBUSY, leaving an empty directory that had to be removed by hand before the second pass succeeded; the branch is left behind.

**Fallback:** if `claude rm` fails with EBUSY, the hub proposes the cleanup commands to Rafal and runs none of them in the project repository itself: retry `claude rm <id>` after the session process has exited; remove the leftover directory by hand; delete the branch with `git branch -d worktree-<name>`, which refuses a branch with unmerged commits, and use `-D` only after Rafal confirms that the branch's commits may be lost (that branch is where a background session's work lives). The probe's own `rm -rf` ran only in the throwaway repo. Spec §8.2 says the hub "changes nothing in project repositories" (design.md:421), so whether the hub may run any of these commands after approval is a decision for Rafal (D10). Alternatively create the worktree with `git worktree add` and start the session in it.

**Spec impact:**
- Hub setup needs a trust step per project repo; `--bg` fails fast with exit 1 in an untrusted workspace (observed for the repo; a worktree under the trusted repo did not need separate trust).
- Worktree path convention: `<repo>/.claude/worktrees/<name>`, branch `worktree-<name>`, registered as locked.
- Worktree cleanup must handle EBUSY on Windows; `claude rm` leaves the branch `worktree-<name>`, which holds the session's work. Who runs the cleanup is a §8.2 question for Rafal (D10); the hub only proposes the commands, branch deletion with `-d`.
- `claude logs` returns a terminal screen dump, not structured text; for result extraction the hub should use the events files / transcript instead.

## S11 — gate marker smoke test

**Question.** Does the model end gate turns with the marker `⏸ Czeka na decyzję: <one sentence>`
from the repository `CLAUDE.md`?

**Method.** Rafal ran `cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-marker` (session
`8db2b062…`) and sent five gate prompts of different kinds, answering each gate with `ok`:
a clarifying question, a design section for approval, a spec for review, an A/B choice, and — after
`/compact` — a next step awaiting consent. Checked with
`node C:/Users/rafal/hub-probes/tools/marker-check.js C:/Users/rafal/hub-probes/data/events 8db2b062-008a-4985-a0a7-3cf3db807658`.

**Raw result.**

Prompts (`UserPromptSubmit`, UTC):

```
05:27:13 "Chcę dodać plik notes.md. Zanim cokolwiek zrobisz, zadaj mi "
05:27:35 "ok"
05:27:47 "Zaproponuj strukturę notes.md w jednej sekcji i poproś mnie "
05:28:07 "ok"
05:28:18 "Napisz krótki spec w spec.md i poproś mnie o review."
05:29:55 "ok"
05:30:02 "Daj mi wybór: wariant A albo B dla nazwy pliku, i poczekaj n"
05:32:09 "ok"
(/compact)
05:34:03 "Zaproponuj następny krok i poczekaj na moją zgodę."
05:39:02 SessionEnd prompt_input_exit
```

`marker-check.js` (`stops: 9, withMarker: 7`), last line of every `Stop`:

| Stop (UTC) | Marker | Last line | Turn |
|---|---|---|---|
| 05:27:28 | yes | `⏸ Czeka na decyzję: co ma się znaleźć w `notes.md`.` | gate 1 (question) |
| 05:27:40 | yes | `⏸ Czeka na decyzję: co ma się znaleźć w `notes.md` (pusty plik, szkielet czy konkretna treść).` | `ok` did not answer the question; asked again |
| 05:28:05 | yes | `⏸ Czeka na decyzję: czy akceptujesz proponowaną strukturę `notes.md`.` | gate 2 (design section) |
| 05:28:21 | no | `` `docs(notes): add notes.md skeleton` `` | work done after `ok` (file written, commit message proposed) |
| 05:28:46 | yes | `⏸ Czeka na decyzję: review `spec.md` (akceptujesz czy coś zmienić).` | gate 3 (spec review) |
| 05:30:02 | no | `Z tego wątku nie ma już nic do zrobienia. Jeśli chcesz, mogę dopisać pierwszy wpis do sekcji `Log`.` | work done after `ok`, ends with an optional offer |
| 05:30:12 | yes | `⏸ Czeka na decyzję: wariant A (`notes.md`) czy B (`NOTES.md`).` | gate 4 (A/B choice) |
| 05:32:13 | yes | `⏸ Czeka na decyzję: wariant A (`notes.md`) czy B (`NOTES.md`).` | `ok` did not pick a variant; asked again |
| 05:34:30 | yes | `⏸ Czeka na decyzję: zgoda na dopisanie wpisów do `notes.md` oraz wybór wariantu A (`notes.md`) albo B (`NOTES.md`).` | gate 5 (after `/compact`) |

**Verdict: pass.** All five gate kinds ended with the marker (5 of 5), including the one after
compaction; the two turns that re-asked a gate also carried it. The two turns without the marker
finished work and did not wait for a decision.

**Queued prompts (found in the final review).** Twice Rafal's next prompt arrived while the
previous turn was still running. Excerpt of `data/events/8db2b062-008a-4985-a0a7-3cf3db807658.jsonl`
(fields `at`, `event`, `input.prompt_id`, then `tool_name` or `prompt`; `…` marks omitted lines):

```
2026-10-14T05:28:07.618Z UserPromptSubmit dfbfb101-373c-4984-8928-1d2a549f9981  "ok"
2026-10-14T05:28:15.356Z PostToolUse      dfbfb101-373c-4984-8928-1d2a549f9981  Write
2026-10-14T05:28:16.125Z PostToolUse      dfbfb101-373c-4984-8928-1d2a549f9981  Bash
2026-10-14T05:28:18.435Z UserPromptSubmit dfbfb101-373c-4984-8928-1d2a549f9981  "Napisz krótki spec w spec.md i poproś mnie o review."
2026-10-14T05:28:21.546Z Stop             dfbfb101-373c-4984-8928-1d2a549f9981
2026-10-14T05:28:36.180Z PostToolUse      f229e27f-58ed-4041-8b53-54bd15d13c25  Write
2026-10-14T05:28:36.384Z PostToolUse      f229e27f-58ed-4041-8b53-54bd15d13c25  Bash
2026-10-14T05:28:46.604Z Stop             f229e27f-58ed-4041-8b53-54bd15d13c25
…
2026-10-14T05:29:55.050Z UserPromptSubmit 617d5c90-3aee-4405-ae1e-41269583aaff  "ok"
2026-10-14T05:30:02.718Z UserPromptSubmit 617d5c90-3aee-4405-ae1e-41269583aaff  "Daj mi wybór: wariant A albo B dla nazwy pliku, i poczekaj na decyzję."
2026-10-14T05:30:02.964Z Stop             617d5c90-3aee-4405-ae1e-41269583aaff
2026-10-14T05:30:08.351Z PostToolUse      df105060-2b42-4f04-a3d6-890366857ba0  Grep
2026-10-14T05:30:12.592Z Stop             df105060-2b42-4f04-a3d6-890366857ba0
```

The queued prompt's `UserPromptSubmit` carries the id of the turn still running (`dfbfb101`,
`617d5c90`); that turn's `Stop` follows with the same id; the queued prompt's own tool events and
`Stop` carry a new id (`f229e27f`, `df105060`) that no `UserPromptSubmit` carried. Both times the
queued prompt ran as its own turn after that `Stop`; a queued prompt absorbed between tool calls of
the running turn was not observed.

**Fallback taken.** None needed.

**Spec impact.** None for the marker rule. Note for §5.4: the turn at 05:30:02 ended with an optional
offer ("Jeśli chcesz, mogę…") and no marker — the case the hub judges as "probably waiting for you"
or "turn ended"; it stays a judgement, as the spec already says.

§5.2 / §5.5 (decision for Rafal, D12): under the approved rules the session above goes `working`
(05:28:18) → `turn-ended` (05:28:21, the `Stop` of the "ok" turn) while it works until 05:28:46, so
the watcher would print a false "turn ended". The hub's own "send now" to a busy session (§6.2)
produces exactly this sequence. Pairing a `UserPromptSubmit` with "its" `Stop` by `prompt_id` fails
for queued prompts. D2 is unaffected: the `Notification`, `PostToolUse` and `Stop` of one turn
share the id (S1). Plan 2 needs a derived-state test built from this sequence.

## Side effect: backup hook commits and pushes

**What happened.** Rafal's own `SessionEnd` hook committed and pushed `C:/Users/rafal/.claude` after
probe sessions ended. No plan step ran git; the plan's no-commit / no-push constraint held only in
that sense.

**Facts (read-only checks).**

- `~/.claude/settings.json` registers on `SessionEnd`:
  `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1"`,
  `"timeout": 120`. `~/.codex/hooks.json` registers the same command on `SessionEnd`, also with
  `"timeout": 120`, so Codex calls trigger it too.
- `backup-claude.ps1:2-3`: "Mirrors every registered .claude directory into this repository, then
  commits and pushes. Runs as a SessionEnd hook and by hand."
- Remote: `origin https://github.com/RafalKielbasa/claude-skills.git`. `git status -sb` prints
  `## main...origin/main` (nothing ahead), so every commit below is on GitHub. Whether the
  repository is public was not checked.

`git -C C:/Users/rafal/.claude log --format="%h %ad %s" --date=iso -15`:

```
e86b639 2026-10-14 07:45:37 +0200 backup: sync .claude config (2 files) 2026-10-14 07:45
458fdb4 2026-10-14 07:39:03 +0200 backup: sync .claude config (2 files) 2026-10-14 07:39
1bade27 2026-10-14 07:26:57 +0200 backup: sync .claude config (2 files) 2026-10-14 07:26
f4ecb56 2026-10-14 07:25:47 +0200 backup: sync .claude config (2 files) 2026-10-14 07:25
783b4ed 2026-10-14 07:22:09 +0200 backup: sync .claude config (2 files) 2026-10-14 07:22
b94bcf7 2026-10-14 07:19:09 +0200 backup: sync .claude config (2 files) 2026-10-14 07:19
8ff4b69 2026-10-14 07:17:03 +0200 backup: sync .claude config (2 files) 2026-10-14 07:17
5eebab6 2026-10-14 07:09:21 +0200 backup: sync .claude config (3 files) 2026-10-14 07:09
f8c0ac4 2026-10-14 07:00:09 +0200 backup: sync .claude config (2 files) 2026-10-14 07:00
82dce53 2026-10-13 21:39:43 +0200 backup: sync .claude config (2 files) 2026-10-13 21:39
67a609a 2026-10-13 21:33:34 +0200 backup: sync .claude config (2 files) 2026-10-13 21:33
eb666a1 2026-10-13 21:26:45 +0200 backup: sync .claude config (2 files) 2026-10-13 21:26
55a12dd 2026-10-13 21:22:39 +0200 backup: sync .claude config (3 files) 2026-10-13 21:22
36bd2e8 2026-10-13 21:01:37 +0200 backup: sync .claude config (3 files) 2026-10-13 21:01
cc80652 2026-10-13 20:40:13 +0200 backup: sync .claude config (3 files) 2026-10-13 20:40
```

Matching the 13 commits after 36bd2e8 (21:01) against recorded `SessionEnd` events (commit times
converted to UTC; git shows whole seconds):

| Commit | UTC | Recorded session end |
|---|---|---|
| 55a12dd | 19:22:39 | S9 Codex call 1 (`s9-1.jsonl` last written 19:22:37.6Z); the commit holds `CLAUDE.md` −85 lines, the contract removal of Task 1 |
| eb666a1 | 19:26:45 | trust run `af60cda8`, `prompt_input_exit`, 19:26:44.350Z |
| 67a609a | 19:33:34 | trust run `9a4f32be`, `other`, 19:33:33.673Z |
| 82dce53 | 19:39:43 | S1 `879b1201`, `other`, 19:39:42.684Z |
| f8c0ac4 | 05:00:09 | S4 `f27a4367`, `prompt_input_exit`, 05:00:08.196Z |
| 5eebab6 | 05:09:21 | SessionEnd-only `5279bf4c` / `e491df5e`, 05:09:20.2Z |
| 8ff4b69 | 05:17:03 | S6 forks `1867e626`, `56a59b67`, `db9975a8` stopped, 05:17:02.459Z–05:17:03.750Z |
| b94bcf7 | 05:19:09 | S7 `58f7132f`, `other`, 05:19:08.175Z |
| 783b4ed | 05:22:09 | S7 `e0c438b3`, `other`, 05:22:08.657Z |
| f4ecb56 | 05:25:47 | S8 `/clear` of `41dac455`, `clear`, 05:25:46.636Z |
| 1bade27 | 05:26:57 | `69788a55` (`probe-recipient`, fork source of S6 / S7), `prompt_input_exit`, 05:26:55.880Z (at least 1.1 s earlier) |
| 458fdb4 | 05:39:03 | S11 `8db2b062`, `prompt_input_exit`, 05:39:02.787Z |
| e86b639 | 05:45:37 | S7 `cafd6b26`, `other`, 05:45:36.387Z |

For eleven of the 13 the commit's whole-second timestamp lies within 1 s of a recorded
`SessionEnd`; 55a12dd matches S9 call 1, and 1bade27 comes at least 1.1 s after one. 36bd2e8
(21:01) has no recorded probe session end. Not every recorded `SessionEnd` is followed by a
commit; why was not checked.

**Consequences.**

- Copies mirrored under `backups/claude-dirs/D--Notatki-notatki/` are on GitHub: the plan (in
  36bd2e8) and successive drafts of this probe report (in 11 of the 14 commits from 36bd2e8 to
  e86b639; not in 82dce53, 8ff4b69, 458fdb4). The contract removal (55a12dd) is on GitHub too.
- The second commit proposal of Task 14 step 4, "chore(claude): remove Codex-Claude execution
  contract", cannot be applied: the change is already committed and pushed in 55a12dd.
- In Plans 2 and 3 every fork, background session, `/clear` and Codex consultation would trigger a
  commit and a push (hook timeout 120 s). Decision for Rafal: D14.

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
| S1 hooks in VS Code, payload fields | pass except `StopFailure`: not triggered, so not shown to reach the log, and its hook registration is unconfirmed; first VS Code attempt invalid (auto mode) | permission waits cleared without tool call ids | §5.2 (D2; `prompt_id` belongs to the running turn, D12); §4.1 confirmed (drive-letter case flips) |
| S2 cost of PostToolUse | pass (p95 44 ms; +11 ms median) | none | none |
| S3 concurrent writes, fs.watch, agents | pass (100/100, 0 broken, restart caught up) | none | §5.1 `.last.md` rename gives `EPERM` in 2–7 of 25 renames per run (D1); §5.4 `state` / `waitingFor` (D13) |
| S4 SendMessage | pass (delivered / held / refused written down; a hold caused by different permission modes not tested) | none | §6.3 and §8.1 (D3), §5.1 with the §5.2 clearing rule kept (D4), hub setup (D5, untested) |
| S5 Monitor expiry wake-up | pass (re-armed 9 s after wake; run in a VS Code panel session, not a terminal tab) | none | none |
| S6 fork launch | pass (busy-session fork: one sample) | none | §6.5 (D6, D7, D8), §5.6 (`claude logs` is a screen dump) |
| S7 fork write boundary | pass for the routes tested: the `Write` tool into `repo/` (deny rule proven in a control run) and PowerShell `Set-Content` into `repo/` and into the dialog directory. Not tested: other shell routes, the Bash tool, a dialog directory under `~/.claude/hub/` | none | §6.5 step 2 (D8) |
| S8 role file and /clear | pass | none | hub start and §8.1 (D9), §5.1/§6.2 (D6) |
| S9 Codex follow-up | pass for `apply_patch` writes (no file written in 3/3 calls; refusal on stderr, not in the `error` item; shell writes not attempted) | none | §7 confirmed; keep `-c sandbox_mode="read-only"`, run resume from `<dir>`; `error` items are not failures (D11) |
| S10 worktree session | pass after trust; cleanup needed a manual delete and left the branch | none | §6.6, with a §8.2 question on cleanup (D10) |
| S11 gate marker | pass (5/5 gate kinds) | none | none for the marker; §5.2 / §5.5 queued prompts (D12) |
| Side effect: backup hook | Rafal's `SessionEnd` hook committed and pushed `~/.claude` 13 times during the probes | — | outside the hub spec (D14) |

## Decisions for Rafal before Plan 2

Each item needs Rafal's decision; the recommendation is the controller's. The column "Approved
rule" names the rule of the approved spec (`2026-10-13-orchestrator-hub-design.md`) the item keeps,
fills, changes or reverses; D5 and D14 propose no spec change.

| # | From | Proposal | Approved rule | Recommendation |
|---|---|---|---|---|
| D1 | S3 | §5.1: `.last.md` written by temp file + rename failed with `EPERM` in 5, 7 and 2 of 25 concurrent renames per run (five writers in lockstep, harsher than one session's `Stop` hooks; a reader holding the file open was not tested). Options: (a) retry the rename with backoff; (b) one last-message file per `Stop` event (`<session_id>.last/<event id>.md`), referenced from the event | **Changes** §5.1 ("`.last.md` is written to a temporary file … and then renamed"), the §4.1 layout, §5.6 level 2 and the §8.2 retention row that deletes "the event log and `.last.md`" together | (b): it matches the append-only event log and has no contention; retention deletes the old files |
| D2 | S1 | §5.2: `Notification` carries no tool call id, but the `Notification`, `PostToolUse` and `Stop` of one turn share `prompt_id`; clear `waiting: permission` on a later `PostToolUse` or `Stop` with the same `prompt_id`. The hook keeps only `notification_type: "permission_prompt"` (`idle_prompt` also arrives). Queued prompts do not affect this rule (D12) | **Changes** the §5.2 `PostToolUse` clear condition (the tool-call-id comparison never applies) and the §5.1 `Notification` record (prompt id instead of a tool call id) | adopt |
| D3 | S4 | §6.3: `SendMessage` reports success even for held and refused messages. A send becomes `sent` only when the recipient's `UserPromptSubmit` shows the hub's `<cross-session-message from-name="…">` wrapper with a matching inner-text hash; held / refused notices set `held` / `not-sent`; otherwise `delivery-unknown`. `crossSessionInbound: refuse` gives no tool error; it arrives as a refused notice. The hash was checked on one plain line only: the wrapper adds `\n` before and after the text, and escaping of `<`, `&`, `"` is unknown | **Changes** §6.3 step 2 ("the tool succeeded: the record becomes `sent`"), adds the state `held`, and **changes** the §8.1 row "`SendMessage` failed" (design.md:406) | adopt; check the inner-text extraction with a multi-line message containing `<`, `&`, `"` before Plan 2 relies on the hash |
| D4 | S4 | §5.1 / §5.2: the `UserPromptSubmit` hook records that a prompt came from another session: the wrapper's `from-name` and the inner-text hash (D3), never the text. Used for display and for D3. The §5.2 clearing rule stays: a hub-caused `UserPromptSubmit` clears `waiting: decision` like any other prompt, and the next `Stop` with the marker restores it. On the questionnaire path (§6.4) the hub's answer message is what resolves the gate, so it must clear the wait | **Keeps** §5.2 (design.md:168-170); **adds** fields to the §5.1 `UserPromptSubmit` event | adopt |
| D5 | S4 | Hub setup, **untested**: the only source is the `SendMessage` tool description (a recipient in a different permission mode holds messages for its user's approval). Only auto → auto was tried, and the wrapper's `from-mode="prompting"` for an auto-mode sender suggests the compared mode may not be `permission_mode`. Project sessions run in different modes (S1), so one hub mode cannot match them all. No setup rule: the hub relies on D3's `held` record and tells Rafal what is held | **None** | adopt no mode rule; an auto → default hold probe before Plan 2 is optional |
| D6 | S6, S8 | A restart or `/clear` keeps the session name but changes its id. Split by path: (1) **forks** (read-only): resolve the source `sessionId` by name from `claude agents --json` right before launch (S6 caught a stale id); (2) **sends**: keep §6.2's baseline `sessionId` recorded at approval; if the target now runs under a different id, check 1 fails and the hub shows the new candidate id for Rafal to re-approve, never re-resolving on its own; (3) **`/clear` + same name**: `SessionEnd` with `reason: "clear"` followed by a new id under the same `session_title` is shown as a continuation for display only and carries no baseline over; (4) the hub re-registers its own id after `/clear`. Caveats: VS Code panel sessions carry no `session_title` and whether `agents --json` names them was not checked; "same tab" is what Rafal saw, the same process is not verifiable | **Keeps** §5.1 names display-only (design.md:151-152), §8.1 addressing only by `sessionId` with duplicate names allowed (design.md:408), and §6.2 check 1 with the approval baseline (design.md:276-283, §13 item 9). **Changes** §6.5 step 1 (resolve by name right before forking) and §5.1 (the hub re-registers after `/clear`) | adopt the split |
| D7 | S6 | §6.5 step 1: drop "fork only idle sessions"; a fork of a busy session works and sees the history up to the running tool call, without its result. One valid sample (`dlg-busy2`, `db9975a8`) | **Reverses** §6.5 step 1 ("The hub checks that session X is idle") and the §9.2 S6 fallback "forks only of idle sessions" | adopt, with the caveat shown in the dialog; the evidence is one sample |
| D8 | S6, S7 | §6.5 step 2: fork command in the tested argument order, `claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> --settings <fork-settings.json> "<start prompt with role>" --add-dir <dialog dir>`, run in the project directory (`--settings` before the prompt; the prompt before the variadic `--add-dir`). Settings allow `Edit(//C:/…/dialogs/<dir>/**)` and deny `Edit(./**)` and `Bash`. Tested: the `Write` tool into `repo/` is refused by the deny rule alone (control run); `deny: "Bash"` removes the `PowerShell` tool from the fork; without it, `Set-Content` into `repo/` was blocked and into the dialog directory allowed. Not tested: other write routes (`Out-File`, redirection, `node -e`, `git`), the Bash tool. The background guard is a second barrier. Open points: (a) the tested dialog directory was `hub-probes/data/dialogs/probe`; the spec location `~/.claude/hub/projects/<project>/dialogs/` (design.md:96-108) is untested, and in this run the auto-mode classifier refused Task 1's edits of `~/.claude/CLAUDE.md` as "[Self-Modification]"; (b) with `Bash` denied the fork has no shell, so it cannot run `git log` / `git diff`, although §7 lists "the diff of a session's branch" (design.md:367-369) and the fork is the analytical partner; (c) the order above is the tested one; (d) "a fork inherits the source's permission mode" is not shown: the source session and the account default were both `auto` | **Fills** §6.5 step 2, which the spec left to S6 / S7; no approved rule reversed. (b) narrows what the fork can read for §6.5 step 3 | adopt, keeping `Bash` in `deny`; decide (b): accept a fork without git, or have the hub put the diff into the dialog directory (untested); test (a) before Plan 3; consider also denying `EnterWorktree` (untested) |
| D9 | S8 | §4 / hub start: start the hub with `--append-system-prompt-file <hub role file>`; the role survives `/clear` without invoking the skill again. The §8.1 row "Hub after `/clear` or restart" (design.md:411) changes with it: the role comes from the role file; the hub re-registers its new id (D6) and rebuilds the overview | **Changes** the §4 hub start command and the §8.1 row "Hub after `/clear` or restart" ("reloads its role through the skill `hub`") | adopt |
| D10 | S10 | §6.6 new sessions: `--bg` needs a trusted workspace (fails fast with exit 1 otherwise; a worktree under a trusted repo needed no extra trust, one launch). Worktrees land in `<repo>/.claude/worktrees/<name>` on branch `worktree-<name>`. `claude rm` on Windows hit `EBUSY`, then refused, and the directory had to be removed by hand; the branch stays, and it holds the session's work. Cleanup: the hub proposes the commands (retry `claude rm <id>` after the process exits; remove the leftover directory; `git branch -d worktree-<name>`, `-D` only after Rafal confirms the commits may be lost) and runs none of them itself. **Decision for Rafal:** §8.2 says the hub "changes nothing in project repositories" (design.md:421); keep that, so the hub only proposes, or add a narrow exception letting the hub run `claude rm` and `git branch -d` after his approval | **Keeps** §8.2 under the recommendation; the alternative **changes** §8.2. **Adds** a trust step to §6.6 | keep §8.2: the hub proposes the cleanup commands; the hub tells Rafal to trust a new repo once before its first background session |
| D11 | S9 | §7: keep `-c sandbox_mode="read-only"` on follow-ups (call 3 stayed read-only without it, cause not separated); `resume` takes the working directory from the shell, so run it from `<dir>`. The read-only result covers `apply_patch` only (refusal on stderr, `s9-2.err:4` and `s9-3.err:3`; call 1 not captured); shell writes were not attempted. §8.1 "Codex consultation failed": an `error` item in the `--json` stream is not a failure (all three streams carried the `hooks.json` timeout warning as an `error` item); stderr goes to a file the hub keeps | **Keeps** §7 step 5 and the §8.2 Codex row; **clarifies** the §8.1 row "Codex consultation failed" | confirm as written, plus the §8.1 clarification |
| D12 | S11 | §5.2 / §5.5: `prompt_id` identifies the turn being processed. A `UserPromptSubmit` repeating a `prompt_id` already seen in the session marks a queued prompt; the `Stop` with that id ends the earlier turn but must not set `turn-ended` (and the watcher must not print "turn ended") while the queued prompt is pending; the queued prompt's turn runs under a new id and ends at its own `Stop`. The hub's "send now" to a busy session (§6.2) creates this sequence. Observed twice in `8db2b062` (05:28:18 and 05:30:02); both times the queued prompt ran as its own turn after that `Stop` | **Changes** the §5.2 `Stop` row (it sets `turn-ended` unconditionally) and the §5.5 "a turn ended" transition; adds a §9.1 derived-state case | adopt; Plan 2 needs a sequence test built from the S11 events (no fixture yet) |
| D13 | S3, S6, S7, S10 | §5.4: background `state` and `waitingFor` from `claude agents --json` take precedence over rows 3–8. Evidence: `waitingFor` never appeared in any poll; `state` was `blocked` (S3: the only value seen, 5 sessions listed) and `done` (S6 `1867e626`; S7 `629afdce`, `e0c438b3`, `d89ea064`; S10 `df73ebe4`); `blocked` was reported for `dlg-s7-ps` (`cafd6b26`), a fork that had finished its turn (its `Stop` is recorded); Task 14 saw two unrelated background sessions as `blocked`. What `blocked` and `done` mean is unknown. Proposal: drop `waitingFor`; exclude `state` from the precedence rule until probed and show the raw value next to the derived state (alternative: show `state: blocked` as its own label) | **Changes** §5.4 (design.md:205-206) | drop `waitingFor`; exclude `state` from the precedence rule until a probe explains it; show it raw |
| D14 | side effect | Rafal's `SessionEnd` backup hook (`backup-claude.ps1`, registered in `~/.claude/settings.json` and `~/.codex/hooks.json`, timeout 120 s) commits and pushes `C:/Users/rafal/.claude` when a session ends; it did so 13 times during the probes (section "Side effect"). In Plans 2 and 3 every fork, background session, `/clear` and Codex consultation would trigger a commit and a push. Options: skip the backup for sandbox and hub-launched sessions (for example by `cwd`; `SessionEnd` payloads carry no session name), or debounce it (at most one run per interval) | **None** in the hub spec; the hook is Rafal's own configuration, outside the hub's write boundary (§8.2) | skip the backup for the sandbox and hub-launched sessions and debounce the rest; Rafal changes the hook himself, as separate work |

Fixtures for Plan 2: `C:/Users/rafal/hub-probes/data/fixtures/` (13 variants, content-free; `StopFailure`
not triggered — Plan 2 builds that fixture by hand from the documented fields). Also missing: a
queued-prompt sequence (S11, D12) and a cross-session `UserPromptSubmit` carrying the
`<cross-session-message …>` wrapper (S4, D3 / D4); the `UserPromptSubmit` fixture has `prompt`
replaced by `"<string>"`. Plan 2 builds both by hand from the events quoted in S4 and S11.
