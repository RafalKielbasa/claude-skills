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
`data/events-trust/`). Earlier trust-run and other probes' events were moved out of `data/events`,
so the counts below contain only S1 sessions.

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

**Verdict: pass.** Every event kind reached the event log from the VS Code panel and from the
terminal, including `Notification` / `permission_prompt` (VS Code retry: 12 s after the prompt;
terminal: 16 s). `StopFailure`: not triggered (no API error occurred). A working directory with a
space and Polish diacritics in `prompt` arrive intact.

**Field inventory for Plan 2.**

| Item | Finding |
|---|---|
| Session name | Not in any payload. `UserPromptSubmit.session_title` carries the name only for the named terminal session (`probe-space`); empty for VS Code. Names must come from `claude agents --json` |
| Tool call id | `PostToolUse.tool_use_id` present; `Notification` has **no** tool call id |
| Correlation id | Every event carries `prompt_id`, shared by all events of one prompt (the `Notification`, the following `PostToolUse` and `Stop`) |
| Permission mode | `permission_mode` in `UserPromptSubmit`, `PostToolUse`, `Stop` |
| `prompt` | Present in `UserPromptSubmit` |
| `cwd` | The drive letter's case changes **within one VS Code session** (`c:\` → `C:\`) |
| Shell tool name | `Bash` in one session, `PowerShell` in others |
| Content-bearing fields | `PostToolUse.tool_response`, `Stop.last_assistant_message`, `UserPromptSubmit.prompt` |
| Notification message | Differs by client: `"Claude needs your permission"` (terminal) vs `"Claude needs your permission to use PowerShell"` (VS Code) |

**Fallback taken.** Spec §9.2 S1 fallback for missing tool call ids: permission waits are cleared
without tool call ids. `prompt_id` gives a better key than timestamps alone.

**Spec impact.** §5.2 (decision for Rafal at Task 14): clear `waiting: permission` by a
`PostToolUse` or `Stop` with the same `prompt_id` as the `Notification`, instead of a tool call id
the `Notification` does not carry. §4.1 already requires case-insensitive path comparison; S1
confirms it is necessary. §5.1 must keep ignoring `tool_response` (content).

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
- `claude agents --json`: p50 161 ms, p95 171 ms, no failures; 5 sessions; keys `cwd,id,kind,name,pid,sessionId,startedAt,state,status`; kinds `background,interactive`; states `blocked` (only value observed); statuses `idle,busy`.

**Rename finding: spec impact, decision for Rafal at Task 14.** Concurrent rename onto one file gave `EPERM` in every shared run: `renameErrors` 5, 7, 2 (of 100 events per run; none in the separate-file runs a1-a3). Spec §5.1 writes `.last.md` by temp file plus rename, so with concurrent `Stop` hooks some `.last.md` writes fail. The event log itself was unaffected (0 broken lines). Options:
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
approval. Both sessions here ran in auto mode.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §6.3 send record: tool success must not mark a record `sent`. Delivery is confirmed by the
  recipient's `UserPromptSubmit` event carrying the hub's `from-name` wrapper (matched by the hash
  of the inner text); a held or refused notice sets `held` / `not-sent`; with neither, the record
  stays `delivery-unknown`.
- §5.2: the hook can record that a prompt came from another session (the wrapper and `from-name`,
  without the text), so a hub message no longer has to clear `waiting: decision`.
- §5.5 / §9 (hub setup): the hub should run in the same permission mode as the project sessions,
  otherwise every hub message is held for approval in the recipient.

## S5 — Monitor expiry wakes an idle hub

**Question.** Does a `Monitor` expiry notice wake an idle session, so the hub can re-arm its watcher
without anyone typing?

**Method.** In the executing session: one event `before-1` written to `data/s5/s5.events.jsonl`;
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
logs, and keep a record of reported events.

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
at 05:09:50, no `Notification` / `permission_prompt` (the fork ran in `permission_mode: "auto"`,
inherited from the source session); the file exists with the content `test`. The fork also emitted
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
   the write boundary has to come from settings (S7).
4. A fork of a busy session starts and sees the history up to the running tool call, without its
   result.

**Final command for spec §6.5 step 2:**
`claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> "<start prompt with the role>"`,
run in the project directory, with `<sessionId>` read from `claude agents --json` by name right before launch.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §6.5 step 1: a restart keeps the session name but changes its id, so the hub must resolve the id
  from `claude agents --json` immediately before forking (S6 caught a stale id).
- §6.5 step 1: forking a busy session works; the "only idle sessions" precaution can be dropped,
  with the caveat that the fork does not see the result of a running tool call.
- §6.5 step 2: a fork inherits the source session's permission mode (auto here), so the write
  boundary needs explicit settings (S7).
- §5.6: `claude logs` is a terminal screen dump; the hub reads results from `Stop` events instead.

## S7 — write boundary of the fork

**Question.** Can a fork launched with `--settings` permission rules write into its dialog directory
but not into the project repository, given that a fork inherits the source's `auto` permission mode?

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
with no task (`backgrounded · 58f7132f · dlg-s7 (idle — send a prompt to start)`), no events file
was created, nothing was written. Stopped (`stopped 58f7132f`).

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

**Verdict: pass (updated after the control run).** The inside write succeeded without a prompt; the
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

**Fallback.** None taken. If the boundary must not depend on the guard: default permission mode, Rafal
approves each fork write himself.

**Spec impact (for Rafal at Task 14).**

- §6.5 step 2: pass the start prompt before `--add-dir`, or the variadic option swallows it.
- §6.5 step 2: `--settings <file>` with the `//C:/` allow form plus `deny` (`Edit(./**)`, `Bash`) is a working
  write boundary on its own (control run, guard disabled via `worktree.bgIsolation: none`); with the guard
  on, it is a second, independent barrier.
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
under a **new session id** in the same process (`41dac455…` → `f4622a21…`); the name
(`session_title: "probe-role"`) carries over.

**Fallback taken.** None needed.

**Spec impact (decisions for Rafal at Task 14).**

- §4 hub start: start the hub with `--append-system-prompt-file` carrying the hub role, so
  `/clear` does not need the skill to be invoked again.
- §5.1: the hub excludes itself by `sessionId` in `hub-sessions.json`, but `/clear` gives it a new
  id; the hub must re-register itself after `/clear` (or be recognised by name / role).
- §5.2 / §6.2: a `SessionEnd` with `reason: "clear"` followed by a new id under the same name is a
  continuation of the same tab, not an ended session; the pre-send check's baseline `sessionId`
  must be re-resolved, as in S6.

## S9 — Codex follow-up sandbox and working directory

**Question:** do a Codex consultation (`codex exec -s read-only`) and its follow-up (`codex exec resume <id> -c sandbox_mode="read-only"`) stay read-only, keep the working directory and thread context, pass Polish diacritics via stdin, and launch no other agent?

**Method:** prompts `s9-first.md` / `s9-follow.md` fed through stdin; call 1 `codex exec -s read-only -C <repo> --json -o s9-1.md -`; call 2 `codex exec resume <id> -c sandbox_mode="read-only" ...`; call 3 (informational) the same resume without `-c`. Codex CLI 0.147.0, Windows 11, contract removed from `~/.codex/AGENTS.md`. Files: `C:/Users/rafal/hub-probes/data/codex/s9-{1,2,3}.{md,jsonl}`.

**codex-commands.js outputs (commands shortened):**

| Call | threadId | itemTypes | agentLaunches | otherToolItems | commands |
|---|---|---|---|---|---|
| 1 | 01a136b7-2195-70d0-8cb4-81ac73919aa0 | error 1, agent_message 3, command_execution 4 | [] | [] | 4 x powershell.exe: read of superpowers SKILL.md (exit -1, then 0), `$PWD.Path; Test-Path ...`, `Get-Content -TotalCount 1 .\README.md; $PWD.Path` |
| 2 (resume, with override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |
| 3 (resume, no override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |

The write attempt in each call was an apply_patch, rejected by stderr: `patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings` (the `error` item). In call 1 one shell command also failed with `windows sandbox: CreateProcessWithLogonW failed: 267` (exit -1), retried successfully.

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

**Verdict: pass.** Write refused in all three calls, working directory is the repo, context recalled, diacritics intact, no agent launch, no other tool items.

**Fallback:** not needed (would be a fresh `codex exec -s read-only -C <dir>` per follow-up with `thread.md` as context).

**Spec impact:**
- The follow-up kept read-only with the `-c sandbox_mode="read-only"` override; keep passing it (cheap, explicit).
- Without the override (call 3) the resumed thread was still read-only on this machine: `~/.codex/config.toml` sets no `sandbox_mode` (only a Windows `sandbox = "elevated"`), so resume evidently inherits the thread's read-only policy or the default is read-only. The cause (inheritance vs. default) was not separated; do not rely on it, keep the override.
- `resume` takes the working directory from the shell cwd (ran from the repo); the `-C` flag was not passed on resume and cwd was correct.
- Codex on its own reads the superpowers skill (using-superpowers SKILL.md) at the start of call 1; harmless here, but it is extra token use.
- stderr noise (models cache `supports_parallel_tool_calls`, Figma MCP AuthRequired) does not affect results; send stderr away from stdout JSONL.
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

**Fallback:** if `claude rm` fails with EBUSY, the hub retries after the session process has exited, and deletes the leftover directory plus `git branch -D worktree-<name>` itself; alternatively create the worktree with `git worktree add` and start the session in it.

**Spec impact:**
- Hub setup needs a trust step per project repo; `--bg` fails fast with exit 1 in an untrusted workspace (observed for the repo; a worktree under the trusted repo did not need separate trust).
- Worktree path convention: `<repo>/.claude/worktrees/<name>`, branch `worktree-<name>`, registered as locked.
- Worktree cleanup must handle EBUSY on Windows and delete the branch explicitly.
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

**Fallback taken.** None needed.

**Spec impact.** None for the marker rule. Note for §5.4: the turn at 05:30:02 ended with an optional
offer ("Jeśli chcesz, mogę…") and no marker — the case the hub judges as "probably waiting for you"
or "turn ended"; it stays a judgement, as the spec already says.

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
| S1 hooks in VS Code, payload fields | pass (first VS Code attempt invalid: auto mode) | permission waits cleared without tool call ids | §5.2 (D2); §4.1 confirmed (drive-letter case flips) |
| S2 cost of PostToolUse | pass (p95 44 ms; +11 ms median) | none | none |
| S3 concurrent writes, fs.watch, agents | pass (100/100, 0 broken, restart caught up) | none | §5.1 `.last.md` rename gives `EPERM` (D1) |
| S4 SendMessage | pass (delivered / held / refused written down) | none | §6.3 (D3), §5.2 (D4), hub setup (D5) |
| S5 Monitor expiry wake-up | pass (re-armed 9 s after wake) | none | none |
| S6 fork launch | pass | none | §6.5 (D6, D7, D8), §5.6 (`claude logs` is a screen dump) |
| S7 fork write boundary | pass (deny rule proven in a control run) | none | §6.5 step 2 (D8) |
| S8 role file and /clear | pass | none | hub start (D9), §5.1/§6.2 (D6) |
| S9 Codex follow-up | pass (read-only in 3/3 calls) | none | §7 confirmed; keep `-c sandbox_mode="read-only"`, run resume from `<dir>` (D11) |
| S10 worktree session | pass after trust; cleanup needed a manual delete | none | §6.6 (D10) |
| S11 gate marker | pass (5/5 gate kinds) | none | none |

## Decisions for Rafal before Plan 2

Each item changes the spec; the recommendation is the controller's, the decision is Rafal's.

| # | From | Change to the spec | Recommendation |
|---|---|---|---|
| D1 | S3 | §5.1: `.last.md` written by temp file + rename fails with `EPERM` under concurrent writes on Windows. Options: (a) retry the rename with backoff; (b) one last-message file per `Stop` event (`<session_id>.last/<event id>.md`), referenced from the event | (b): it matches the append-only event log and has no contention; retention deletes the old files |
| D2 | S1 | §5.2: `Notification` carries no tool call id but every event carries `prompt_id`; clear `waiting: permission` on a later `PostToolUse` or `Stop` with the same `prompt_id` | adopt |
| D3 | S4 | §6.3: `SendMessage` reports success even for held and refused messages. A send becomes `sent` only when the recipient's `UserPromptSubmit` shows the hub's `<cross-session-message from-name="…">` wrapper (matched by text hash); held / refused notices set `held` / `not-sent`; otherwise `delivery-unknown` | adopt |
| D4 | S4 | §5.2: the hook records that a prompt came from another session (wrapper and `from-name`, no text); such a prompt does not clear `waiting: decision` | adopt |
| D5 | S4 | Hub setup: the hub runs in the same permission mode as the project sessions, otherwise every hub message is held for approval in the recipient | adopt as a documented setup rule |
| D6 | S6, S8 | §5.1, §5.2, §6.2, §6.5: a restart or `/clear` keeps the session name but changes its id. Resolve the id by name from `claude agents --json` right before every send or fork; treat `SessionEnd` with `reason: "clear"` followed by a new id under the same name as the same tab; the hub re-registers its own id after `/clear` | adopt |
| D7 | S6 | §6.5 step 1: drop "fork only idle sessions"; a fork of a busy session works and sees the history up to the running tool call, without its result | adopt, with the caveat shown in the dialog |
| D8 | S6, S7 | §6.5 step 2: final fork command `claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> "<start prompt with role>" --settings <fork-settings.json> --add-dir <dialog dir>` (prompt before the variadic `--add-dir`); settings allow `Edit(//C:/…/dialogs/<dir>/**)` and deny `Edit(./**)` and `Bash`; the background guard is a second barrier. A fork inherits the source's permission mode | adopt; consider also denying `EnterWorktree` (untested) |
| D9 | S8 | §4 / hub start: start the hub with `--append-system-prompt-file <hub role file>`; the role survives `/clear` without invoking the skill again | adopt |
| D10 | S10 | §6.6 new sessions: `--bg` needs a trusted workspace (fails fast with exit 1 otherwise; a worktree under a trusted repo needed no extra trust). Worktrees land in `<repo>/.claude/worktrees/<name>` on branch `worktree-<name>`; cleanup must handle `EBUSY` on Windows and delete the branch | adopt; the hub tells Rafal to trust a new repo once before its first background session |
| D11 | S9 | §7: keep `-c sandbox_mode="read-only"` on follow-ups (call 3 stayed read-only without it, cause not separated); `resume` takes the working directory from the shell, so run it from `<dir>` | confirm as written |

Fixtures for Plan 2: `C:/Users/rafal/hub-probes/data/fixtures/` (13 variants, content-free; `StopFailure`
not triggered — Plan 2 builds that fixture by hand from the documented fields).
