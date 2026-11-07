# Hub approvals and voice alerts — design

**Project / parts:** hub / hub-approvals, hub-voice-alerts (one document, because both parts share
one queue)
**Index:** [hub.md](../projects/hub.md)
**Probes:** [2026-11-05-hub-approvals-probes.md](2026-11-05-hub-approvals-probes.md)
**Date:** 2026-11-05 to 2026-11-07, conversation in session `3089ecd1`

## 1. Intent

Rafal runs many Claude Code sessions in terminals. They stop for him often: between 2026-10-26 and
2026-11-04 the registry holds about 81 decision gates and 22 permission prompts per active day. Half
of the gates wait more than 5 minutes. He wants to spend as little time as possible on his part of
the work.

In his words, the effect he wants: „wiem że jakaś sesja potrzebuje ze mną interakcji, szybko jestem w
stanie zrozumieć kontekst decyzji (najlepiej głosowo, jestem słuchowcem), odpowiadam z pozycji huba,
praca rusza dalej”.

So the hub gains three things:

1. a spoken alert that names the session and the kind of interaction;
2. one place to answer: the hub tab answers decision gates and permission prompts;
3. a way to suspend all of it when he leaves the computer, and to walk through what waits when he
   returns.

## 2. Goals, non-goals, anti-goals

**Goals**

- Rafal hears which session needs him and whether it is a decision or a permission.
- He can ask follow-up questions about a decision by voice before deciding. This is a hard
  requirement; a spoken summary without a conversation does not meet it.
- He answers from the hub tab and the session continues at once.
- He can suspend alerts and resume where he left off.

**Non-goals**

- A panel or the desktop app (`hub-panel` is postponed; hub spec §13.7).
- Approving permissions by voice. Permissions are keyboard only.
- Repeating an alert. A wait speaks once.
- Muting by project, quiet hours, or detecting absence automatically. The week-one review (§10) may
  bring some of these back.
- Answering `AskUserQuestion` or plan approval from the hub.
- Standing permission rules created from the hub. One approval allows one call.
- Alerts while the hub session is not running.
- Codex sessions.

**Anti-goals: failures even if everything technically works**

- The hub talks so often that Rafal stops listening.
- A voice „tak” passes something he did not want.
- A model approves a permission prompt, its own or another session's.
- A session stalls because of the hub: the hub is closed, the hook hangs, or the session cannot show
  a prompt at all.
- A typed answer lands on the wrong session or the wrong gate.

## 3. What was decided, and by whom

**Rafal's decisions** (conversation 2026-11-05 to 2026-11-07):

| Topic | Decision |
|---|---|
| Alert content | The session and the kind: „Decyzja do podjęcia” or „Uprawnienia do zaakceptowania” |
| How he answers | Decisions by voice or text, permissions by keyboard from the hub |
| After a decision alert | The hub asks whether to discuss it. He reads the context quickly and types „dawaj” to discuss by voice, or decides by text when no discussion is needed |
| When an answer reaches the session | At once in both paths: typed text goes verbatim, without its code and with no extra „wyślij”; after the voice „tak” and the end of the conversation the hub sends the order that was read back. The hub shows what it sent. A send cannot be undone |
| How a typed answer finds its session | Every waiting item has a code, and the answer starts with it: `a3 B`. Text without a code is an ordinary conversation with the hub and reaches no session. „dawaj” alone means the session the voice named last, and `dawaj a3` names one |
| Permission answer | A command typed by him with the item's code, for example `! ok a3` or `! nie a3`, so no model relays the consent |
| Repeats | One alert per wait, spoken in a queue so alerts never overlap |
| Which sessions speak | All sessions, 60 s after the wait began. After a week of real use the numbers are compared with the simulation (§10) and he decides whether to silence anything |
| Leaving the computer | A mechanism to suspend alerts; on return, a walk through the waiting items, which can itself be paused and resumed |
| Scope of the walk | Everything still waiting from the last 24 hours, also from before the pause. Older waits stay in the overview only |
| Voice | Local `Microsoft Paulina Desktop` (System.Speech), chosen by ear, so alerts use no ElevenLabs minutes |
| Which sessions the hook waits on | Those whose `CLAUDE_CODE_ENTRYPOINT` is `cli` or `claude-vscode`, read in the hook itself (§6.1). The poll cannot tell `claude -p` from a window (probe report) |
| A command that arrives as text | A pasted `! ok a3` approves nothing, and the hub says how to type it. After a `!` command the hub model adds one line at most (§4.1, §4.4) |
| How the outcome of `! ok` reaches the hub tab | `ok` and `nie` write the decision and end at once. In the model turn that follows every `!`, the hub model runs a read-only CLI command and quotes what it prints; the hook decides, not the model (§4.4, §6.2). The final review found that a command waiting for the hook cannot work, see §5 |

**The author's calls.** Rafal saw some of these as guesses and did not object; the rest appear here
for the first time. All are open to correction when he reads this document.

| Call | Reason |
|---|---|
| The spoken name is the conversation title, as the overview shows it (`lib/overview.mjs:52`); with no title, the project name; when another waiting session has the same title, the project name is added | The title is what tells sessions of one project apart |
| The context in the hub tab is a verbatim quote of the gate's question and variants, not a model summary | A summary could misstate the choice he is making |
| Pause has no time limit, and the overview shows „pauza od 14:02” | A limit would start talking to an empty room |
| The walk goes oldest first; a skipped item stays in the overview only and does not return in that walk | After an absence the longest wait goes first |
| „dalej” follows the same rule as „dawaj”: alone it means the item announced last, and `dalej a3` names one. If the item announced last no longer waits, both say so and do nothing | A fixed rule cannot be misjudged by a model, and guessing another item could open or skip the wrong one |
| An item is shown and gets its code when it is announced, not when the wait begins | 19% of gates are answered within a minute, so showing them earlier wakes the model for nothing |
| `a3` alone shows the item again, and codes ignore letter case | He may have scrolled past it, and a caps-lock slip should not turn an answer into hub conversation |
| „dawaj” works on decision items only. On a permission item it prints the ready commands | Follow-up questions were asked for decisions, and permissions are keyboard only |
| A new wait during a walk joins the end of the queue and does not interrupt | Rafal is in the middle of something |
| Local speech stays silent during a voice conversation and resumes after it | It would talk over the ElevenLabs agent |
| Pause also suspends `PushNotification` | He asked to suspend notifications, not only the voice |
| A code belongs to one wait, so a new gate in the same session gets a new code | Otherwise `a3 A` could answer a newer gate |
| No alert for „probably waiting for you” and „problem”, nor for dialog forks | Rafal named two kinds of interaction, and those two have a firm signal. They stay in the hub tab and overview as today |
| `! nie` denies without `interrupt` and tells the session not to work around the refusal | The turn then ends normally with a `Stop`, so the hub's state stays correct (§6.4) |
| The send without „wyślij” covers only a conversation started with „dawaj”. A conversation Rafal starts the old way („porozmawiajmy głosem o X”) keeps „wyślij” | He decided this for the path after an alert; nothing says it should reach further |
| The hook waits only on sessions known to be able to show or later attach a prompt, and when unsure it does not wait (§6.1) | A stalled session is an anti-goal; a missing hub answer only costs him the session's own prompt |
| A wait the hub cannot answer still speaks, and the hub tab says „odpowiedz w sesji” (§4.5) | A silent stall is worse than an alert he must answer elsewhere |
| The hook reads its own session's transcript to notice an answer, and closes the wait in the registry (§6.1, §6.4) | „No” leaves no registry event, so otherwise the hub would speak about a refused prompt and `! ok` would print „zatwierdzone” for it |
| Approving from the hub needs a hub in a terminal, the VS Code integrated terminal included | `!` is the only input path, and he works in terminals. A panel hub keeps everything except `! ok`, because `!` is missing there (probe report) |
| A text answer holding a later line that starts with a code is refused (§4.1) | Two answers typed while the hub model works may arrive as one prompt (not measured), and the second would then go to the first one's session. It costs a retype when a line really starts that way |
| The overview names a walk's current item, and a watcher starting on a walk announces it again; a walk has no time limit (§4.1, §6.3) | One item left open holds the walk, as §4.1 says. He needs to see why the hub is quiet, and a limit would start talking to an empty room |
| An `announce:` line also brings `PushNotification` when he is away, unless paused | Before the alerts every wait could notify him, and §3 suspends notifications only for a pause |
| „A model cannot approve” means: a model cannot approve by running the command or writing the decision file. A model deliberately forging a record in the hub's transcript is out of reach, because hub, models and files share one OS user (§5) | No design on one OS user can promise more, and he should know where the guarantee ends |

## 4. How it behaves

### 4.1 The queue

One queue holds everything that waits for Rafal, oldest first, limited to the last 24 hours. An item
is either a decision gate (a session in state `waiting for decision`) or a permission prompt. An item
leaves the queue when it is answered, from the hub or in the session itself, when the session ends,
or when Rafal skips it with „dalej”.

An item is **announced** when its alert speaks and the hub tab shows it. Every item has a code, one
numbering for both kinds, for example `a3`. The code is given when the item is first announced or
listed in the overview, so a wait answered within its first minute takes none. A code belongs to one
wait and is not reused within 24 hours.

What Rafal types in the hub tab:

| Typed | Effect |
|---|---|
| `a3 <text>` | The text goes verbatim to the session of decision item `a3`, without the code |
| `a3` | Shows the item again |
| `dawaj`, `dawaj a3` | The voice conversation about the item announced last, or about the named one (§4.3) |
| `dalej`, `dalej a3` | Skips the item announced last, or the named one |
| `! ok a3`, `! nie a3` | Answers permission item `a3` (§4.4) |
| `a3 <text>` with a later line starting with a code | Sends nothing, and the hub says that two answers may have merged and to type each one separately |
| One of these commands as text: a pasted `! ok a3`, or `ok a3` without the `!` | Changes nothing, and the hub says that `!` must be pressed by hand. In the probe a line pasted together with its `!` reached the model as plain text, and in a panel every such line does |
| Anything else | An ordinary conversation with the hub, which forwards nothing to a session |

Normal listening, a walk and a pause are the same queue in different modes:

| Mode | Voice | Hub tab |
|---|---|---|
| Listening | Each wait speaks once, 60 s after it began, if still unanswered | Shows each item as it speaks |
| Paused (`! pauza`) | Silent, and no `PushNotification` | The overview shows „pauza od <time>”. The queue keeps collecting, and items that have a code can still be answered |
| Walking (`! wracam`) | Speaks one item at a time, oldest first; the next follows when the previous one leaves the queue. New waits speak only when their turn comes | Shows each item as it speaks. The overview names the current item, because it holds the walk until it leaves the queue. The walk ends when the queue is empty, and the mode returns to listening |

`! pauza` during a walk stops it, and `! wracam` continues with what is left. Command names are
working names (§9).

### 4.2 The spoken alert

The exact sentences:

- `<name>. Decyzja do podjęcia.`
- `<name>. Uprawnienia do zaakceptowania.`

`<name>` follows §3. Speech runs without a model, so it costs no tokens and keeps to the 60 s.
Alerts play one at a time. A wait is identified by its session and the time it began, so a new gate
in the same session is a new wait with its own alert and code.

### 4.3 A decision

1. Voice: „<name>. Decyzja do podjęcia.”
2. The hub tab shows the code and quotes the gate: the question and its variants, verbatim, with the
   path of the full last message, and ends with one fixed line: `dawaj` omawia głosem, `a3 <tekst>`
   idzie do sesji, `dalej` pomija.
3. Rafal does one of the following.
   - **Text with the code,** for example `a3 B`. „B” goes to the session verbatim, without „wyślij”.
     The hub shows the result of the send.
   - **„dawaj”.** The voice conversation about this session starts (the existing procedure, hub
     skill „Voice conversation about a session”), and he asks whatever he needs. Decisions are read
     back and recorded only after his „tak”, as today. When the closing report shows a `prompt.md`,
     the hub sends it without „wyślij” and shows its full text. Without `prompt.md` nothing is sent
     and the item stays in the queue.
   - **„dalej”.** The item is skipped.

Sends the hub model composes itself (direct commands, questionnaires, new sessions) keep their
„wyślij”. Only these two paths change, because in both the text is Rafal's own or was read back to
him.

The presence of `prompt.md` is sufficient evidence, because the fork writes it only when the
conversation ends and only from confirmed items, and a conversation without a confirmed order, a
closed tab included, yields none (`2026-10-18-hub-voice-design.md:314-315`, confirmed in the
acceptance of voice plan 2, runs 2 and 4). No change to the talk skill is needed.

The existing safeguard stays: in `prompt.md`, push, tickets, GCP, a new dependency and any other
outward action appear only as waiting for his word in text (`~/.claude/skills/talk/lib/voice-prompt.mjs:41`,
voice spec §5.5).

### 4.4 A permission

1. Voice: „<name>. Uprawnienia do zaakceptowania.”
2. The hub tab shows the tool, the literal command or file, and the ready answers: `! ok a3`,
   `! nie a3`. A long input is cut with a statement of how much is hidden and where the full text
   is.
3. Rafal types one of them in the hub tab. The command prints that it took the answer and ends:
   `a3: przyjęte, sprawdzam`. The hook finds his typed record, answers, and the session goes on. In the
   model turn that Claude Code starts after the `!`, the hub model runs a read-only CLI command and
   quotes what was decided, so he sees it in the tab.

The session's own prompt stays visible and usable the whole time, so he can still answer there. In
the measured period 75% of permission prompts were answered within a minute, before any alert.

Text cannot answer a permission item: `a3 tak` sends nothing, and the hub prints which command to
type.

Claude Code starts a model turn after every `!` command (probe report), so each `! ok` costs one turn
of the hub model, and that turn carries the outcome. The model adds nothing else, and it never says
something was approved unless the read-only command's output says so: in the probe a model reported a
decision as saved when nothing had run. A turn that does not run costs the printed outcome alone, because
the hook does not depend on it.

### 4.5 A wait the hub cannot answer

A `permission_prompt` notification sets „waiting for permission” with no tool name and independently
of the hook (`lib/events.mjs:41`, `lib/derive.mjs:63-65`). So an item can have no hook waiting behind
it: the hook passed it through, its limit passed, or the prompt is not a tool permission at all. Such
an item still speaks, has a code and stays in the queue, and the hub tab says „odpowiedz w sesji”.
`! ok`, typed text and „dawaj” print the same and send nothing, and „dalej” works as usual. A voice
conversation started the old way stays available. When the hook saw that the tool was
`AskUserQuestion` or `ExitPlanMode`, it records this, and the sentence is „Decyzja do podjęcia”.

## 5. Why the permission path is safe

- **The hook:** a `PermissionRequest` hook returns `allow` or `deny`. Probed on Claude Code 2.1.318:
  `allow` gets past an `ask` rule, the prompt shows while the hook waits, and an answer from another
  session closes the prompt. The docs say a `deny` rule still wins.
- **The code:** each item has its own code. The probe showed why this is needed: a decision without
  one was taken by an older hook that was still running. A code is not reused within 24 hours, so a
  stale code cannot hit a newer prompt or gate.
- **No model in the path:** a model must not be able to approve. The hook, not the command, therefore
  checks that Rafal typed the approval: a `!` command leaves a `<bash-input>` record in the hub
  session's transcript, while a model's call is a `tool_use` record. The record's timestamp is taken
  before the command runs (seven samples, 0.1–0.8 s earlier), but Claude Code writes it to the file only
  after the command has ended (probe report, „Correction of 2026-11-07”). So `ok` cannot wait for the
  hook: it writes the decision and ends, and the hook searches for the record for 8 s. A record counts
  only when its timestamp lies within the 15 s before the decision, and each record counts once, so one
  typing opens one decision and nothing later. A decision without such a record is ignored, so writing
  the decision file directly does not work either. If this turns out unreliable later, it is a decision
  for Rafal, not for the builder.
- **Where this ends:** a model that deliberately forges a record in the hub's transcript could pass the
  check, because all of this runs as one OS user. A typed record no decision has used yet also stays
  usable for those 15 s, by a model running the same command in that time. Decision 8 of the hub spec keeps `deny` rules out,
  and this design does not add any. Each approval is logged and printed in the hub tab, so an approval
  he did not type is visible afterwards.
- **The hub model** only shows the prompt and the ready commands. The rule „never answer a permission
  prompt” stays for the model.
- **Typed text** is checked too: the hub model passes Rafal's whole prompt, code included, to the CLI,
  which compares it with what he typed and only then splits the code from the text. The registry
  already stores `promptHash` of the hub session's prompts (`lib/events.mjs`). A mismatch sends nothing.
  Text without a code does not enter this path: anything else the hub sends still needs his „wyślij”.

## 6. Changes to the hub

### 6.1 The `PermissionRequest` hook

A new global, blocking command hook with a long `timeout`, separate from the existing async
`hub-hook.mjs`.

It **returns at once with no decision**, leaving Claude Code's normal flow, when:

- the hub is not running (the watcher has not written its state recently);
- the session is the hub itself or a dialog fork. A typed dialog fork is a `claude --bg` session, so
  its entrypoint is `cli`; the hook recognises it by a name starting `dlg-`, from
  `<CLAUDE_JOB_DIR>/state.json` or from the hub's list of launched sessions;
- the tool is `AskUserQuestion` or `ExitPlanMode`: the hook records that and returns, so a code can
  never answer them;
- the session is not known to be able to show a prompt. The hook reads `CLAUDE_CODE_ENTRYPOINT` from
  its own environment and waits only for `cli` (terminal windows and `claude --bg`) and `claude-vscode`
  (panels). Anything else, above all `sdk-cli` from `claude -p`, passes through, because a hook that
  waited there would stall a call that is denied at once today (probe „No decision”). A voice fork runs
  `claude -p` (`~/.claude/skills/talk/lib/fork.mjs:15`). The poll cannot do this: it lists `claude -p`
  as `interactive` (probe report). The hook reads no poll, so a new session is covered from its first
  prompt. These values are observed, and whether they are documented was not checked. An unknown value
  passes through, which costs Rafal the hub's answer (§4.5) and stalls nothing; §11 item 10 checks the
  dangerous direction, `claude -p` reporting a value the hook waits on.

Otherwise it writes a pending record holding the session, prompt id, tool, input and its own pid,
then polls for a decision bound to that record. The item's code points to the record.

It **ends with no decision** when:

- the prompt was answered in the session. There are two signals. One is a later event of that session
  in the registry (`PostToolUse` with the same tool and target, `UserPromptSubmit`, `Stop`, `StopFailure`,
  `SessionEnd`). The other is the session's own transcript: a `tool_result` of this call, or
  `[Request interrupted by user`, dated after the hook started. The registry alone is not enough, because
  „No” in the prompt leaves no event there (probe report), and a failing tool is not recorded either. On
  the transcript signal the hook adds an event to the registry that closes the wait. The probe showed
  Claude Code does not stop the hook by itself;
- the hub has stopped running. After a jump in the hook's own clock, which means the computer slept, that
  round's check is skipped, and the hub counts as stopped only when its heartbeat stays stale through a
  minute of the hook's waking time: `! pauza` is for leaving the computer, and a prompt must survive it;
- the session's process, `CLAUDE_PID`, is gone, because Claude Code enforces `timeout` only while it
  lives.

Any failure ends with exit 0 and no output, never with a blocked session. `onFailure` stays unset.

Pending records hold full tool input, which the registry deliberately does not (`lib/events.mjs:1-2`).
They live outside the registry and are deleted when closed. A hook killed at its limit cannot clean
up, so a record whose pid is gone counts as closed.

### 6.2 The commands typed by Rafal

`ok <code>`, `nie <code>`, `pauza`, `wracam`: short names on `PATH` that work from `!` in the hub tab.
The `!` shell must be checked, and both PowerShell and Git Bash need to resolve them. `ok` and `nie`
write the decision, print that they took it, and end, because Rafal's typed record reaches the
transcript only after they end (§5). An unknown or closed code prints why at once, including „odpowiedz
w sesji” when the hook has ended. The code of a decision item prints how to answer it.

A separate read-only CLI command waits up to 10 s for the hook's verdict on the last decision of a code
and prints it. The hub model runs it in its turn after the `!` and quotes it literally. It changes
nothing, so a model running it on its own approves nothing.

### 6.3 The watcher

`hub-watch.mjs` gains the alert schedule, the speech queue and the mode. It already follows the state
of every session and survives re-arming through `watch-state.json`, and it needs no model turn to
speak. Requirements:

- due alerts are checked every few seconds, not at the 120 s poll;
- after a re-arm, an alert that fell due while no watcher ran is spoken only if the wait is recent
  (10 minutes, author's call), and the first run ever seeds without speaking, as it does today;
- speech runs as a separate process, and its failure prints one line and never stops the watcher;
- the session title comes from a transcript, so it is untrusted: it is never placed inside a command
  line;
- the watcher prints a line when an item is announced, which is what wakes the hub model to show it.
  For `waiting for decision` and `waiting for permission` this replaces today's line at the start of
  the wait, so a gate answered within a minute takes no model turn. In a walk, a line follows
  `! wracam` and each item that leaves the queue; a watcher that starts on a walk announces the current
  item again, so a restarted hub tab does not stay silent.

### 6.4 Known stale state

A turn interrupted by Deny in the session's prompt leaves no registry event, so the overview kept
showing „waiting for permission” (`hub-panel` probes, „Hub findings”). Confirmed on 2026-11-06: after
„No” the next event of that session came with its next prompt, 2 h 45 min later. While a hook waits, it
sees the refusal in the session's transcript and closes the wait (§6.1), so no alert speaks for it.
With no hook behind the prompt (hub closed, passed through, limit passed) the gap stays: the item
remains until the session's next event, and Rafal skips it with `dalej a3`.

A prompt approved in the session whose tool runs long gives no signal until the tool ends, so that wait
still looks open: an alert can speak at 60 s, and the outcome of `! ok` says approved, with no effect on the
tool already running (probe „A late answer”). This part accepts that. How often it happens is not
measured: 25% of permission prompts have no next event within a minute (§10), and some of those really
wait.

### 6.5 The hub skill and CLI

- CLI commands: one prints an item, named by its code or announced last, as text the hub quotes
  literally; one skips an item; one sends a typed answer from Rafal's whole prompt. The overview lists
  waiting items with their codes. The answer path composes a new path without the five template
  sections, keeps the origin header line, runs the existing pre-send checks, and fails when the wait
  behind the code has ended. The same command recognises Rafal's commands that arrive as text (§4.1)
  and refuses them with how to type them. One more prints the outcome of `ok` or `nie` (§6.2).
- `SKILL.md`: „A watcher event”, „Sending”, „Voice conversation about a session” and „Boundaries”.

### 6.6 Earlier documents this overrides

Apply when the design is accepted:

| Where | Today | After |
|---|---|---|
| Hub spec decision 3, §11 | Permission prompts are answered in the session | Also from the hub tab, by Rafal's own command |
| `~/.claude/skills/hub/role.md:6` and `SKILL.md:58-59` | Nothing is sent before „wyślij” | Except a gate answer typed with its code and a voice order read back and confirmed |
| `SKILL.md:248-249`, voice spec §19 step 5 | A voice decision is never „wyślij” | A conversation started with „dawaj”: the confirmed `prompt.md` is sent when it ends. A conversation started the old way keeps „wyślij” |
| `SKILL.md:38`, `role.md:7` | Gates and prompts are answered in the session | The model still never answers; Rafal does, from the hub |

Unchanged: voice spec §2 („Session X acts on a work order Rafal did not hear read back and confirm” is
still a failure) and voice spec §5.5 (outward actions wait for his word in text). A typed `! ok` on a
`git push` is that word.

Add these to the hub spec as §13.8, and link this document.

## 7. Failure behaviour

| Situation | Behaviour |
|---|---|
| Hub closed | The hook returns at once, there is no voice, and sessions work as today |
| Speech fails | One line in the hub tab; the queue and answers keep working |
| Hook crashes or hangs | The prompt in the session stays usable while the hook waits (probed) |
| Hook limit reached | `! ok` prints „odpowiedz w sesji”, and the prompt in the session still accepts an answer (probe report) |
| `! ok` pasted whole, or typed in a panel | It reaches the model as text: nothing is approved, and the hub says how to type it |
| The hub model's turn after `! ok` does not run | The hook still decides and the session goes on; only the printed outcome is missing |
| The computer slept while a hook waited | The hook keeps waiting, and the item can still be answered on return (§6.1) |
| Send check fails | The literal failure is shown and nothing is retried, as in Sending today |
| Code unknown, or its wait has ended | Nothing is sent, and the hub shows the session's state |
| Answer typed without a code | It stays in the hub as ordinary conversation, and no session gets it |
| Voice conversation ends without a confirmed order | Nothing is sent, and the item stays in the queue |

## 8. Probes the plan runs first

Run on 2026-11-06, results in the probe report. Item 4 failed, because the poll lists `claude -p` as
`interactive`, and Rafal chose the environment signal now in §6.1. Item 7: `!` is missing in a panel.
Item 3 compared timestamps and did not time the write to the file; the final review of 2026-11-07 found
the record is written after the command ends, and Rafal chose the path now in §5 and §6.2.

1. **Prompt after the hook limit:** the one inconclusive result in the probe report. Must pass before
   the limit in step 2 is chosen.
2. **A long hook limit.** The probes used 45 s. The author's starting point is 8 hours, so a prompt
   survives a pause; check that a long `timeout` is honoured.
3. **Typed-by-Rafal check:** that a `!` command leaves a `<bash-input>` record whose timestamp precedes
   the command's effect, and that a model running the same command through its tool is refused. If it
   fails, stop and ask Rafal.
4. **The allow-list of §6.1:** that `claude -p` runs and voice forks are absent from the poll or listed
   under another `kind`, and that the `kind` of a terminal session, a `claude --bg` session and a VS
   Code panel session is what §6.1 expects. If no reliable signal exists, stop and ask Rafal: without
   it the hook cannot wait safely, and this part may have to ship reduced.
5. **`AskUserQuestion` and `ExitPlanMode`** with the hook installed: they are unaffected and cannot be
   answered with a code. Also check how a session waiting on `AskUserQuestion` appears in the registry.
6. **Two prompts at once,** each answered through its own code.
7. **`!` in a VS Code panel:** whether it exists there. If not, the hub's start procedure says that
   `! ok` needs a hub in a terminal.

## 9. Left to the builder

- Command names, as long as they stay short; file layout and formats; how the queue state is stored.
- The code's format and allocation: short, with a digit, so that ordinary text does not begin with
  one. The watcher and the CLI can both give a code, so allocation must be atomic.
- How `promptHash` comparison handles surrounding whitespace.
- How the gate's question is cut out of the last message, with a fallback when the message does not
  follow the usual form.
- How long inputs are cut in §4.4.
- How many plans this takes. `hub-approvals` and `hub-voice-alerts` may share one or have one each.

Keep to the existing style of the skill: pure functions under `lib/`, thin `bin/`, tests with
`node --test` against a temporary `HUB_DATA`. No new dependency. Writes to `~/.claude` go through
`bin/install.mjs`, which Rafal runs.

## 10. Measures and the week-one review

Every spoken alert is logged, and one CLI command prints the numbers. A week after installation Rafal
compares them with this baseline and decides whether to silence anything.

Baseline, 2026-10-26 to 2026-11-04, 9 active days, without the hub, forks and probes; a replay of past
events, from a time when he answered in the sessions:

| Measure | Value |
|---|---|
| Alerts at a 60 s delay | 635, about 71 per day |
| Alerts per hour with at least one alert | median 5, p90 11, max 23 |
| Share from Baza wiedzy | about 40% |
| Alerts naming the session he typed in last | 42%; 93 of them answered within 5 minutes |
| Gates, time to the next prompt | under 1 min 19%, 1–5 min 31%, 5–30 min 27%, over 30 min 18%, none 4% |
| Permissions, time to the next event | under 1 min 75%, 1–5 min 16%, 5–30 min 5%, over 30 min 4% |
| Waiting on return from a break of 30 min to 4 h (38 breaks) | last 24 h: median 4, max 7; all: median 10, max 13 |
| Permissions that began during such a break | median 0, max 1 |

Success: gates spend less time waiting than in this table, and Rafal has not silenced the hub because
it talks too much.

## 11. Acceptance

1. A gate unanswered for 60 s speaks once, with the name and kind. A gate answered sooner stays silent.
2. Two alerts due together play one after another.
3. Text typed with the code of a waiting gate reaches that session verbatim, without the code and
   without „wyślij”, also when another item was announced later. Text altered by the model is refused.
   A bare „B” without a code reaches no session. Two answers typed while the hub model works go each to
   its own session or are refused; neither lands in the other's session.
4. An answer with the code of a wait that has ended is not sent, also when the same session already has
   a newer gate.
5. „dawaj” opens the conversation about the item announced last, `dawaj a3` about the named one, and a
   follow-up question is answered. After the voice „tak” and the end, the order reaches the session
   without „wyślij” and the hub shows it. The session stops at its first outward action until it has
   his word in text.
6. A conversation without a confirmed order sends nothing.
7. `! ok` runs a blocked call and `! nie` refuses it, at the first typing, and the hub tab then shows the
   outcome. With two prompts waiting, each code reaches its own. A wrong or closed code changes nothing
   and says why.
8. A model running the approval command through its tool, or writing the decision file, gets nothing
   approved, in the hub and in a project session, also after a typed attempt on the same code that was
   refused.
9. An answer in the session's own prompt works while the hook waits, and the hook then ends by itself,
   also after „No” and after a tool that failed. No alert follows a refusal given within the 60 s.
10. With the hub closed, a prompt appears at once and no hook process stays behind. A `claude -p` run is
    not slowed down.
11. `! pauza` silences alerts, and `! wracam` walks oldest first over the last 24 hours. „dalej” skips. A
    pause in the middle resumes what is left. A new wait joins the end.
12. Local speech stays silent during a voice conversation.
13. After `! ok`, the same command prompts again next time: no standing rule was added.
14. `! ok a3` pasted as a whole line, and `ok a3` without the `!`, approve nothing: the prompt still
    waits, the hub says how to type it, and no model reports an approval.
