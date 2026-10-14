# Orchestrator hub — design

**Date:** 2026-10-13
**Status:** approved 2026-10-13, including all items of §13.1; updated 2026-10-14 with probe
decisions D1–D14 (§13.2); ready for Plan 2 (§10).
**Owner:** Rafal Kielbasa
**Origin:** brainstorming sessions `0e06a344` (2026-10-11, voice module), `7e84737d`
(2026-10-12, decisions 1–9, design parts 1–2) and `c0c20a2d` (2026-10-13, decisions 10–13,
design parts 3–5, Firehose review, Codex review of this spec).
**Probes:** Plan 1, 2026-10-13 and 2026-10-14; results in
`.claude/specs/2026-10-13-orchestrator-hub-probes.md` (the probe report).

One place to coordinate many Claude Code sessions working in different repositories: see what
each session is doing, read its results, think a result through in a separate dialog, and send
an approved prompt back to the right session, without switching between repositories. Codex
is reachable from the same place as a second opinion on any element.

---

## 1. Purpose

Today every Claude Code session lives in its own VS Code panel or terminal tab. To coordinate
work, Rafal switches between repositories, and he does not know which session is working, which
has finished, and which is waiting for him. An earlier attempt to coordinate Claude sessions from
the Codex desktop app could read a Claude terminal but could not type into it, and it was
abandoned.

The target working loop:

1. Rafal has a hub running and several project sessions working in different repositories.
2. The hub knows the status and relevant results of those sessions and tells Rafal what is in
   progress, what has finished, where a problem occurred, and which session waits for him.
3. From the hub he picks a project or session, reads the result and gives further instructions.
4. When a result needs thought, he starts a separate dialog about it. The interlocutor knows the
   relevant decisions and source material, not only a short summary.
5. The dialog ends with a precise prompt: goal, context, decisions, constraints, expected result.
6. Rafal reviews the prompt and tells the hub to send it. The hub routes it to the project
   session, and the next results come back to the hub.
7. At any point he can bounce an element (a result, a prompt, a decision file, a diff, a file)
   off Codex and follow up on Codex's answer.

**Success criterion:** in one view Rafal sees which session works, has finished, has a problem
or waits for him, and on what. No prompt reaches a session without his approval of its exact
text.

## 2. Scope

| Stage | Content | When |
|---|---|---|
| Sub-project 1: orchestration core | Hub, registry fed by hooks, statuses, reading results, dialog through a fork, questionnaire path, prompt, sending, journal, launching sessions in the background, Codex consultation | This spec |
| Increment 1a: local panel | Continuous view on `localhost` fed by the same registry | After the core is verified |
| Increment: approval cards | Permission decisions answered from the hub (see §11) | After a probe |
| Increment: Codex session statuses | Codex sessions in the registry (see §11) | Later |
| Sub-project 2b: interlocutor from another model | Result package for a model other than Claude or Codex | When needed |
| Sub-project 3: voice | Voice as an interface to the dialog. GPT-Live-1 is an earlier preference to re-evaluate | Separate brainstorming |

Out of scope for sub-project 1:

- relaying gate answers through the hub (the hub as a trusted relay, variant B of decision 3);
- board-tracker integration;
- sessions on other machines and in the cloud;
- Codex joining work on its own initiative (the policy is to be refined during use).

## 3. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | What the orchestrator is | A Claude Code session acting as the hub. It sends with `SendMessage` and reads statuses from `claude agents --json` |
| 2 | Where project sessions come from | Both: the hub adopts sessions Rafal starts himself, and it can start new ones in the background with `claude --bg` |
| 3 | How decisions reach a project session | The hub sends only prompts Rafal approved. Gates and permission prompts are answered in the session itself; the hub says which session waits and for what |
| 4 | How the hub knows the state | Global hooks write a registry. A gate turn ends with a marker line. Waking moved from `notify_when_idle` to a watcher under `Monitor` when design part 2 was accepted (§5.5) |
| 5 | Who runs the analytical dialog | A fork of the project session (`--resume <id> --fork-session`) that reads the repository and writes only its dialog directory. Only decisions and the prompt draft go back to the hub |
| 6 | Visibility in v1 | Text in the hub. `PostToolUse` collects "what it is doing" from day one, so the panel (1a) needs no new data |
| 7 | Dialog artefacts | `decisions.md`, `open-questions.md`, `prompt.md` per project in the hub data directory, plus a per-project send journal |
| 8 | Isolation between projects | A global rule in `~/.claude/CLAUDE.md`: project sessions do not message each other on their own initiative; the hub is the only channel. No `deny` rules |
| 9 | How the hub runs | A permanent tab `claude --name hub` for the working day. It reports in its tab and through `PushNotification` when Rafal is away |
| 10 | Hub as a Claude session or as an app with a panel (Firehose model) | The hub stays a Claude session |
| 11 | What to borrow from Firehose | Questionnaire path, answer message format, worktree option for new sessions, evidence checks before sending. Approval cards and Codex statuses become later increments |
| 12 | Shape of the Codex consultation | A thread per element: first call `codex exec`, follow-ups `codex exec resume <id>` |
| 13 | Codex–Claude execution contract | Removed entirely from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`; it was a remnant of coordinating Claude from the Codex desktop app |
| 14 | How many implementation plans | Three, each written after the probes it depends on (§10) |
| 15 | Probe decisions | D1–D14 from the probe report, adopted by Rafal on 2026-10-14 as recommended; applied in place in this spec and listed in §13.2 |

## 4. Components

| Component | Location | Role |
|---|---|---|
| Hub session | `claude --name hub --append-system-prompt-file <hub role file>` started in `~/.claude/hub/`; the role file belongs to the skill `hub` | Overview of sessions, wake-ups from the watcher, `PushNotification`, starting dialogs and questionnaires, sending approved prompts with `SendMessage`, starting background sessions, Codex consultations. The role comes from the role file and survives `/clear` (probe S8) |
| Skill `hub` | `~/.claude/skills/hub/`, tracked in git through the allowlist. Pattern: `code-review-master` — Node without dependencies, tests with `node --test` | `SKILL.md` with the hub role and procedures; scripts in `bin/`. The hub never modifies its own skill at runtime; changes to the skill are separate, explicitly requested work |
| Hook script | `~/.claude/skills/hub/bin/hub-hook.js`, registered globally in `~/.claude/settings.json` with `async: true` | Appends one event per hook call to the session's event log and, on `Stop`, writes that event's last-message file (§5.1). Works whether or not the hub runs |
| Watcher | `~/.claude/skills/hub/bin/hub-watch.js`, started by the hub through the `Monitor` tool | Prints one line per state transition (§5.5) |
| Hub CLI | `~/.claude/skills/hub/bin/hub.js` | Derived state and overview, last message, session registration, pre-send check, send journal, Codex threads, retention cleanup |
| Hub data | `~/.claude/hub/`, outside git | See §4.1 |
| Dialog fork | `claude --bg --resume <sessionId> --fork-session …` in the project directory (§6.5 step 2) | Talks with Rafal; reads the repository and the session history; writes only into its dialog directory |
| Global rules | `~/.claude/CLAUDE.md` | The gate marker (§5.3) and the isolation rule (decision 8). The Codex–Claude contract section is removed (decision 13) |

**Hub setup.**

- The hub starts with the command in the table above; after `/clear` it keeps its role from the
  role file, and the hub CLI registers its new `sessionId` from the events' `cwd` (§4.1).
- Every project repository is trusted once before its first background session: Rafal runs
  `claude` in it and accepts the trust prompt. `claude --bg` in an untrusted workspace exits with
  code 1 (probe S10, §6.6).
- No permission-mode rule. Per the `SendMessage` tool description only, a recipient in a different
  permission mode than the sender holds a cross-session message for its user's approval. This is
  **untested**: only auto → auto was tried, and the wrapper's `from-mode="prompting"` for an
  auto-mode sender suggests the compared mode may not be `permission_mode` (probe S4). Project
  sessions run in different modes (probe S1), so one hub mode cannot match them all. The hub
  relies on the `held` send record (§6.3) and tells Rafal what is held and why.
- Before the hub core is built, Rafal's `SessionEnd` backup hook skips or debounces sandbox and
  hub-launched sessions (§10, D14).

### 4.1 Data layout

```
~/.claude/hub/
  registry/<session_id>.events.jsonl  # append-only event log, written only by that session's hooks
  registry/<session_id>.last/<event id>.md  # full last assistant message of one Stop event, referenced by that event
  registry/polls.jsonl                # results of `claude agents --json` polls, including errors
  hub-sessions.json                   # session ids the hub registered: itself, dialog forks, background sessions
  projects.json                       # project aliases and directories for new sessions
  projects/<project>/
    journal.md                        # send records: pending, sent, held, not-sent, delivery-unknown
    sent/<timestamp>.md               # exact text of every message sent to a session
    dialogs/<date>-<slug>/
      decisions.md                    # decision, rationale, source
      open-questions.md
      prompt.md
    codex/<date>-<slug>/
      thread.md                       # questions, Codex answers verbatim, hub assessment
      meta.json                       # Codex thread id, element, project session id, cwd
      answer-<n>.md                   # raw output of each Codex call (-o)
      answer-<n>.err                  # stderr of each Codex call; write refusals appear only here
```

`hub-sessions.json` is written only by the hub CLI. The hub CLI treats every session whose events
carry `cwd` = `~/.claude/hub/` as the hub and records it in `hub-sessions.json` when it next reads
the event logs; this registers the hub at start and again after `/clear`, which continues the tab
under a new `sessionId` (probe S8), with no step by the hub itself. The hub CLI also registers the `sessionId` of every dialog fork and background session it launches:
`claude --bg` prints a short id (`backgrounded · 1867e626 · dlg-probe`), and the full `sessionId`
is the one `claude agents --json` lists under that `id` (probe S6).

**Project matching.** `<project>` is the alias from `projects.json` whose root directory contains
the session `cwd`. Paths are compared normalised and absolute, case-insensitively on Windows, as a
directory–descendant relation on path-segment boundaries (`C:\repo` does not match
`C:\repo-old`). The longest matching root wins; two aliases with the same root are a
configuration error that the hub reports. Without an alias, `<project>` is the directory name of
the repository's main worktree (the parent of
`git rev-parse --path-format=absolute --git-common-dir`), so sessions in worktrees land under
their repository.

## 5. Registry and statuses

### 5.1 Events

Every hook call appends one JSON line to `registry/<session_id>.events.jsonl` with a single
append write: a random event id, the event name, the hook start timestamp, `session_id`, `cwd`,
`prompt_id` and the fields below. Every payload carries `prompt_id`; it identifies the turn being
processed, not the submitted prompt (probes S1, S11). Hooks never read and rewrite a state file,
so concurrent asynchronous hooks of one session cannot lose each other's updates.

Each `Stop` writes the full last assistant message to its own file
`registry/<session_id>.last/<event id>.md`, named by the event id, and then appends the `Stop`
event, which references that file. No two hook calls write the same file, so there is no rename
contention on a shared target (probe S3 saw `EPERM` on concurrent renames onto one file).

| Hook (global, `async: true`) | What the event records |
|---|---|
| `UserPromptSubmit` | A prompt was submitted: a SHA-256 of the prompt text, never the text; `session_title` when the payload has one (only this event carries a session name, probe S1). A prompt from another session arrives wrapped as `<cross-session-message from="…" from-name="<sender>" from-mode="…">`, with `\n` before and after the inner text (probe S4); for it the event records the wrapper's `from-name` and a SHA-256 of the inner text, never the text. The hash confirms delivery (§6.3) |
| `PostToolUse` | Tool name, a short target — `file_path` for Read/Edit/Write, `description` for Bash/PowerShell, `pattern` for Grep/Glob — and `tool_use_id`. Full commands and `tool_response` are never recorded, so secrets do not reach the registry |
| `Notification` | Only `notification_type: "permission_prompt"`: a permission prompt is pending. The payload carries no tool call id; the event's `prompt_id` ties it to its turn (probe S1). Every other type, including `idle_prompt` (about 60 s after a `Stop`), is ignored and writes no event |
| `Stop` | A short summary of `last_assistant_message`, the marker text if the last line carries the gate marker, and the path of its last-message file |
| `StopFailure` | The matcher — per the hook docs it fires "when the turn ends due to an API error", with matchers such as `rate_limit`, `overloaded`, `authentication_failed`, `billing_error`. It never fired in the probes, so its registration is unconfirmed (probe S1) |
| `SessionEnd` | The end reason |

The hook never blocks a session: any error (missing directory, unwritable file, unreadable input)
ends it with exit code 0 and no output.

The hub's own session is excluded from the overview by its `sessionId` in `hub-sessions.json`,
which the hub CLI derives from the events' `cwd` = `~/.claude/hub/`, so a new id after `/clear` is
covered too (§4.1). Dialog forks registered there are listed under their
project with the kind `dialog`. Session names from `claude agents --json` and from
`UserPromptSubmit.session_title` are used for display, and otherwise only to resolve a fork's
source session right before launch (§6.5 step 2). A send is never addressed by name (§6.2).

### 5.2 Derived state

The hub CLI and the watcher derive each session's state from its events, ordered by hook start
timestamp and then by line order, plus the polls in `polls.jsonl`.

| Event | Sets | Clears |
|---|---|---|
| `UserPromptSubmit` | phase `working`; a pending queued prompt when its `prompt_id` was already carried by an earlier event of the session (below) | `waiting` (any kind), `problem` |
| `PostToolUse` | phase `working`, `lastAction` | `waiting: permission`, only if this event is later than the permission event and carries the same `prompt_id` |
| `Notification` `permission_prompt` | `waiting: permission` with `since` and its `prompt_id` | — |
| `Stop` | phase `turn-ended`; `waiting: decision` with the marker text when the marker is present. Neither while a queued prompt is pending and this `Stop` carries the `prompt_id` that prompt's `UserPromptSubmit` carried (below) | `waiting: permission` with the same `prompt_id`; a pending queued prompt when this `Stop` carries a different `prompt_id` |
| `StopFailure` | `problem: <matcher>`, phase `turn-ended` | — |
| `SessionEnd` | phase `ended` | `waiting` |

**Queued prompts.** A prompt submitted while a turn runs carries the running turn's `prompt_id`.
The `Stop` with that id ends the earlier turn; the queued prompt then runs as its own turn under
a new id that no `UserPromptSubmit` carried, and ends at its own `Stop` (probe S11, observed twice
in one session). So a `UserPromptSubmit` whose `prompt_id` was already carried by an earlier event
of the session marks a pending queued prompt. While it is pending, the `Stop` with that id sets
neither `turn-ended` nor `waiting: decision`, the phase stays `working`, and the watcher prints no
"turn ended". The first later `Stop` with a different `prompt_id` ends the queued prompt's turn
and is handled by the table above. The hub's "send now" to a busy session (§6.2) creates this
sequence. Not observed: several prompts queued in one turn, and a queued prompt absorbed between
tool calls of the running turn.

A `UserPromptSubmit` caused by a hub message clears `waiting: decision` like any other prompt; its
event carries the hub's `from-name` (§5.1), so the overview can show that the prompt came from the
hub. If the gate is still open, the session's next `Stop` with the marker restores it. On the
questionnaire path (§6.4) the hub's answer message is what resolves the gate, so it must clear the
wait. The hub never sends to a waiting session without an explicit warning (§6.2, check 6).

**`/clear` continuation.** `/clear` ends a session (`SessionEnd` with `reason: "clear"`) and the
tab continues under a new `sessionId` with the same `session_title` (probe S8). The overview shows
such a pair as a continuation of the same tab, for display only; it carries no send baseline over
(§6.2 check 1). VS Code panel sessions carry no `session_title`, and whether
`claude agents --json` names them was not checked, so their continuation is not recognised; that
the new id runs in the same process is not verifiable from the events.

A poll of `claude agents --json` that fails (non-zero exit code or unparsable output) is recorded
with its error in `polls.jsonl` and never counts as evidence that a session vanished. A session
counts as vanished only when two consecutive successful polls do not list it and no `SessionEnd`
was recorded.

### 5.3 Gate marker

A global rule in `~/.claude/CLAUDE.md`: a turn that ends waiting for Rafal's decision ends with
the line

```
⏸ Czeka na decyzję: <one sentence>
```

The marker is user-facing, so it stays in Polish. It is an auxiliary signal, not a guarantee:
when it is missing, the hub judges the last message itself (state "probably waiting for you" in
§5.4).

### 5.4 States shown to Rafal

Shown in this priority order; the first matching state wins:

| # | State | Source |
|---|---|---|
| 1 | ended | phase `ended` |
| 2 | problem | `problem` set, or the session vanished (§5.2) |
| 3 | waiting for permission | `waiting: permission`; per the docs the notification fires after about 6 s of waiting |
| 4 | waiting for decision | `waiting: decision`, from the marker |
| 5 | uncertain since `<time>` | `busy` in the last successful poll while the newest event is older than 10 minutes |
| 6 | working | phase `working`, or `busy` in the last successful poll |
| 7 | probably waiting for you | phase `turn-ended` without the marker, and the hub judged the last message to be a question |
| 8 | turn ended | phase `turn-ended` without the marker. The hub judges the content (result, question, problem) only when it notifies or when Rafal opens the session |

The `state` field of `claude agents --json` never overrides the derived state. Its meaning is
unknown: the probes saw `blocked` and `done`, and `blocked` also for a fork that had finished its
turn (its `Stop` is recorded). Until a probe explains it, the overview shows its raw value next to
the derived state. `claude agents --json` has no `waitingFor` key (probe S3), so none is read.
When the last poll failed, the overview shows the poll error next to the table.

Silence is not success: the hub never reports that a session finished because of an absence of
events, a timeout, or an `idle` status alone.

### 5.5 Waking the hub

The watcher is a Node script started by the hub through `Monitor` with the maximum timeout
(30 minutes). It watches `registry/` with `fs.watch` and, about every 2 minutes, polls
`claude agents --json` and rescans all event logs, so a missed file notification is reconciled at
the next poll regardless of `fs.watch` reliability. It prints only state transitions:

- a session waits for a decision or for permission;
- a problem;
- a turn ended (never for a `Stop` that ends a turn while a queued prompt is pending, §5.2);
- a new session (a `/clear` continuation — `SessionEnd` with `reason: "clear"` followed by a new id
  under the same name — is printed as "continued after /clear", not as a new session, §5.2).

Only transitions, because `Monitor` stops sources that are too chatty. When the monitor expires,
the hub re-arms it and catches up from the event logs (events carry timestamps). Cost: one hub
turn about every 30 minutes. `notify_when_idle` from `SendMessage` stays as a fallback: it fires
only when a session finishes a turn, so it misses permission prompts and new sessions.

A woken hub writes in its tab. When Rafal is away from the tab, it uses `PushNotification`.

### 5.6 Reading a result

Three levels:

1. the summary from the event log;
2. the full last message from the file referenced by the session's newest `Stop` event
   (`registry/<session_id>.last/<event id>.md`);
3. deeper: the transcript, read by a script tolerant to format changes, or a dialog through a
   fork.

The hub loads content into its own context only when Rafal asks. Otherwise it keeps pointers.

The overview is a table with the columns: project, session, state, since, last action, waiting
for, and the raw `state` from `claude agents --json` (§5.4).

## 6. Command loop

One rule holds on every path that sends to a Claude session: **the hub never sends text Rafal
has not seen in its exact wording — including the origin header line — and sends it only after
his "wyślij"**. The Codex consultation is the only exception, because Codex only reads.

| Path | When | Where Rafal sees the text before it goes out |
|---|---|---|
| Direct command | A short instruction to an existing session | In the hub tab |
| Questionnaire | The session should collect decisions before working | The request and the composed answers, in the hub tab |
| Dialog through a fork | The result needs thought | `prompt.md` in the editor, then the final message with its header in the hub tab |
| New session | No session exists in the project | The hub tab or `prompt.md`; optionally with a worktree |
| Codex consultation | A second opinion on an element | No "wyślij" step; the full prompt is kept in `thread.md` |

### 6.1 Prompt template

`prompt.md` and every composed message use these sections (user-facing, so in Polish):
**Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia**, **Oczekiwany rezultat**.
An optional block **Pytania i odpowiedzi** carries the answer message format borrowed from
Firehose: topic, context, questions with the chosen options and Rafal's answers.

**Oczekiwany rezultat** is mandatory. It decides whether the session starts working at once (for
example "implement and run the tests") or stops (for example "write a plan and stop"). Firehose
starts work immediately on submitted answers; this design does not.

Every message starts with one header line naming its origin (path and dialog directory). The
header is part of the text Rafal approves. The prompt is self-contained, because reading
`~/.claude/hub/` from outside the project directory may raise a permission prompt in the target
session.

### 6.2 Pre-send check

When Rafal approves a message, the hub records a baseline: target `sessionId`, `cwd`, repository
root, git branch (or the commit SHA when HEAD is detached), and a SHA-256 of the exact approved
text. The first message to a session uses the baseline taken at approval; no earlier journal
entry is needed.

Immediately before every `SendMessage` the hub checks that:

1. the target session is alive under the baseline `sessionId`. A restart or `/clear` keeps the
   session name but changes its id (probes S6, S8), and the new session lacks the context Rafal
   approved the message against. If the target now runs under a different id, the check fails
   and the hub shows the new candidate id for Rafal to re-approve; it never re-resolves the
   target on its own;
2. `cwd`, repository root and branch (or SHA) match the baseline;
3. no send record with the same text hash exists for this session in state `pending`, `sent`,
   `held` or `delivery-unknown` — otherwise the hub asks;
4. the text has every section of the template and its hash matches the approved hash;
5. the session is idle;
6. the session is not waiting for permission or for a decision — otherwise the hub warns that
   gates are answered in the session itself (decision 3) and sends only after an explicit
   confirmation.

If the session is busy, the hub asks whether to wait for the end of the turn or to send now. A
message to a busy session arrives "between tool calls", so it cuts into the current work; its
`UserPromptSubmit` carries the running turn's `prompt_id` and is derived as a queued prompt
(§5.2). On a delayed send the hub runs all six checks again right before sending; any change
blocks the send and asks Rafal for a new decision.

### 6.3 Send record

The send is recorded durably around `SendMessage`. Tool success is not delivery: `SendMessage`
returns `"success":true` also for messages the recipient holds or refuses, and the real outcome
arrives later in the hub session as a `[Cross-session delivery notice]` naming the `msg_id`; an
accepted delivery has no notice (probe S4).

1. before sending: `sent/<timestamp>.md` with the exact text, and a journal record `pending` with
   the session, path, text hash and baseline;
2. the tool returned success: the record stays `pending` and stores the `msg_id` from the tool
   result;
3. `sent`: the recipient's event log has a `UserPromptSubmit` with the hub's `from-name` (its
   session name, `hub`) and an inner-text hash equal to the record's text hash (§5.1). Only this
   evidence makes a record `sent`;
4. `held`: a notice says the recipient holds the message ("NOT delivered: its Claude has not seen
   it"). The hub tells Rafal what is held and why, and does not resend while it is held. A later
   notice of release leaves the record waiting for the step 3 evidence; a notice of refusal,
   denial or expiry makes it `not-sent`. A held message is refused when the recipient session
   ends;
5. `not-sent`: the tool returned an error, or a notice says the message was refused (for example
   the recipient has `crossSessionInbound: refuse`), denied or expired. The record keeps the
   literal error or notice;
6. `delivery-unknown`: neither the step 3 evidence nor a notice exists (for example the hub was
   interrupted). The record stays `pending` and is shown as `delivery-unknown`. Time alone never
   turns it into `sent` or `not-sent`.

The inner-text hash was checked on one plain line only: the wrapper puts `\n` before and after the
inner text, and whether `<`, `&` or `"` inside the text are escaped is unknown. The extraction is
checked with a multi-line message containing `<`, `&` and `"` before Plan 2 relies on the hash
(§10).

### 6.4 Questionnaire path

1. Rafal says in the hub: "sesja X: pytania o <temat>, maksymalnie N".
2. The hub shows the request in a fixed wording: read the project, ask at most N questions whose
   answers change the work, recommend an option only for a real reason, do not edit files, end
   with the gate marker. After "wyślij" it goes to the session (§6.2, §6.3).
3. The watcher catches the marker; the hub shows the questions.
4. Rafal answers all of them at once.
5. The hub composes the message (Temat, Kontekst, questions with answers, Oczekiwany rezultat),
   shows it, and after "wyślij" sends it (§6.2, §6.3).

### 6.5 Dialog path

1. **Start.** Rafal says "omówmy wynik sesji X". The hub creates
   `projects/<project>/dialogs/<date>-<slug>/`. Session X may be idle or busy. A fork of a busy
   session starts and sees the history up to the running tool call, without its result; the hub
   tells Rafal this when it forks a busy session. The evidence is one sample (probe S6,
   `dlg-busy2`).
2. **Launching the fork.** Immediately before launch, the hub resolves session X's current
   `sessionId` by name from `claude agents --json`: a restart keeps the name but changes the id,
   and a fork from a stale id answers from the ended session's history (probe S6). If the name
   matches more than one session, the hub asks Rafal which one. Resolution by name for VS Code
   panel sessions is untested: they carry no `session_title`, and whether `claude agents --json`
   names them was not checked. The hub then runs, in the project directory:

   ```
   claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> --settings <fork-settings.json> "<start prompt with the role>" --add-dir <dialog dir>
   ```

   The argument order is the tested one (probe S7): `--settings` before the prompt, and the prompt
   before `--add-dir`, because the variadic `--add-dir` otherwise swallows the prompt and the fork
   starts with no task. Fallback: a ready command to paste into a new tab. The hub registers the
   fork's `sessionId` in `hub-sessions.json` (§4.1).

   The fork runs in the mode "repository read-only, dialog directory writable", enforced by the
   settings file:
   - `permissions.allow`: `Edit(//C:/<absolute path of the dialog directory>/**)`;
   - `permissions.deny`: `Edit(./**)` (it also covers `Write`) and `Bash` (it also removes the
     `PowerShell` tool from the fork);
   - `worktree.bgIsolation` is not set, so the background-session worktree guard stays on as a
     second barrier for `Write`.

   Tested in `auto` mode (probe S7): the deny rule alone refused a `Write` into the repository; a
   `Write` into the dialog directory succeeded; with `deny` holding only `Edit(./**)`, a
   PowerShell `Set-Content` into the repository was blocked and one into the dialog directory
   allowed. Not tested: other shell write routes (`Out-File`, redirection, `node -e`, `git`) and
   the Bash tool, so "the fork cannot write to the repository by any route" is not established.
   A fork could escape the worktree guard with `EnterWorktree`; denying `EnterWorktree` too is
   worth considering and untested. Fallback (probe S7): default permission mode, and Rafal
   approves each fork write himself.

   Open points, settled before Plan 3 (§10):
   - (a) the tested dialog directory was `C:/Users/rafal/hub-probes/data/dialogs/probe`; a fork
     writing into the §4.1 location `~/.claude/hub/projects/<project>/dialogs/` is untested, and
     in the probes the auto-mode classifier refused edits of `~/.claude/CLAUDE.md` as
     "[Self-Modification]", so it may also block writes under `~/.claude/hub/`. Tested before
     Plan 3;
   - (b) with `Bash` denied the fork has no shell, so it cannot run `git log` or `git diff`
     (step 3). Rafal decides between a fork without git and the hub putting the diff into the
     dialog directory (untested);
   - (c) the argument order above is the only one tested;
   - (d) "a fork inherits the source's permission mode" is not shown: the source session and the
     account default were both `auto`. The write boundary therefore comes from the settings file,
     not from the mode.
3. **Fork role**, given in its start prompt (probe S6: the fork held a read-only role from the
   start prompt and refused a write until told otherwise):
   - an analytical partner that changes nothing in the repository;
   - it reads every decision back to Rafal and writes it into `decisions.md` only after his
     confirmation, with rationale and source;
   - unanswered questions go into `open-questions.md`;
   - it reads the repository and the session history with the read and search tools; it has no
     shell (step 2, open point b).
4. **Conversation.** Rafal talks to the fork after `claude attach <fork id>`.
5. **Prompt.** The fork writes `prompt.md` from the template and ends the turn with
   `⏸ Czeka na decyzję: prompt gotowy do przeglądu`. The registry catches it and the hub notifies
   Rafal.
6. **Review.** Rafal reviews and edits `prompt.md` in the editor. The hub shows the final message
   with its header and Rafal says "wyślij".
7. **Pre-send check** (§6.2).
8. **Sending** with `SendMessage` and the send record (§6.3).
9. **Closing.** The hub stops the fork with `claude stop <fork id>` (the conversation and
   artefacts stay) and shows session X's next result when its turn ends.

### 6.6 Other paths

- **Direct command:** steps 6–8 of §6.5, without a dialog.
- **Target session vanished** (for example VS Code closed): after two successful polls without
  the session (§5.2), the hub proposes `claude --bg --resume <id>` and runs it only after Rafal
  agrees. Per `claude --help`, the command "continues that session in the background under the
  same ID, or starts a copy and says so when the session is already running". If the CLI reports
  a copy, the hub quotes it and sends nothing until Rafal decides.
- **New session:** the hub runs `claude --bg --name <project>-<slug>` in the project directory,
  optionally with `-w <name>` for a new git worktree, with the prompt as the first message, and
  registers the session's `sessionId` (§4.1). Permission prompts are answered after
  `claude attach <id>` (decision 3). A worktree session is journalled with its worktree path and
  branch.
  - **Trust prerequisite.** `claude --bg` requires a trusted workspace; in an untrusted one it
    exits with code 1 and "Workspace not trusted. Run `claude` in <dir> once and accept the trust
    prompt, then retry." (probe S10). Before the first background session in a new repository,
    the hub tells Rafal to run `claude` there once and accept the trust prompt. A worktree under a
    trusted repository needed no separate trust; this rests on a single launch.
  - **Worktree layout.** `-w <name>` creates `<repo>/.claude/worktrees/<name>` on a new branch
    `worktree-<name>`, registered in git as locked (probe S10).
  - **Worktree cleanup.** The hub only proposes the cleanup commands to Rafal and runs none of
    them itself (§8.2): retry `claude rm <id>` after the session process has exited (on Windows
    the first run hit `EBUSY` and the second refused, probe S10); remove a leftover worktree
    directory by hand; delete the branch with `git branch -d worktree-<name>`, which refuses a
    branch with unmerged commits. `git branch -D` is proposed only after Rafal confirms that the
    branch's commits may be lost, because that branch holds the background session's work.
    `claude rm` leaves the branch in place.
- **Projects:** the project comes from the session `cwd` (§4.1); `projects.json` holds short
  aliases and directories for new sessions.

## 7. Codex consultation

Codex is a consultant invoked from the hub. It only reads and only comments; it never authorises
or authors anything. In v1 it runs only on Rafal's command.

1. Rafal says "odbij od Codexa <element>: <pytanie>". The element is one of: the last result of a
   session (its newest last-message file, §5.6), `prompt.md`, `decisions.md`, the diff of a
   session's branch, a file in a repository.
2. The hub creates `projects/<project>/codex/<date>-<slug>/` and composes the prompt:
   - the reviewer role: comments only, changes nothing, launches no other agent;
   - Rafal's question;
   - the element. Files from `~/.claude/hub/` are pasted verbatim; repository files and diffs are
     given as paths and refs, so Codex reads the sources itself instead of a summary.

   The hub never pastes or points at files matching `.env*`, `*.pem`, `*.key`, `*credentials*`,
   `*secret*`, `auth.json` or `secrets.yaml`; for such an element it asks Rafal instead.
3. The hub runs, in the background so it is not blocked:
   `codex exec -s read-only -C <dir> --json -o <thread>/answer-<n>.md -` with the prompt on stdin
   as UTF-8, stdout (the JSONL stream) kept apart from stderr, and stderr written to
   `<thread>/answer-<n>.err`, which the hub keeps: a write refusal appears only there (probe S9).
   `<dir>` is the `cwd` of the session the element belongs to (a worktree, if the session runs in
   one). The Codex thread id comes from the `thread.started` event of the `--json` stream
   (checked in the review of this spec and in probe S9) and goes into `meta.json`.
4. The hub shows the answer verbatim, next to a table: remark, hub assessment, rationale.
5. "Codex, <pytanie>" is a follow-up in the same thread:
   `codex exec resume <id> -c sandbox_mode="read-only" --json -o <thread>/answer-<n>.md -`, with
   stderr to `<thread>/answer-<n>.err`, run with `<dir>` as the process working directory:
   `codex exec resume --help` lists neither `-s` nor `-C`, and `resume` takes the working
   directory from the shell. The `-c sandbox_mode="read-only"` override is always passed. A
   follow-up without it also stayed read-only in probe S9, but whether by inheritance from the
   thread or by default was not separated, so the hub does not rely on it.
6. A conclusion reaches `decisions.md` or a prompt only after Rafal confirms it.

On 2026-10-13 Codex reviewed this spec under such a reviewer instruction, with the contract still
in place: it ran only read commands (`rg`, `--help`) and launched no Claude session.

Probe S9 (Codex CLI 0.147.0, contract removed): the first call and both follow-ups wrote no file,
kept `<dir>` as the working directory, recalled the thread context, passed Polish diacritics
through stdin intact, and launched no agent. The read-only result covers `apply_patch` writes,
rejected with "writing is blocked by read-only sandbox" on stderr; shell writes were not
attempted, so they are not covered.

## 8. Errors and boundaries

### 8.1 Errors

| Situation | How the hub learns | What it does |
|---|---|---|
| `Monitor` expired | One expiry notice per monitor | Re-arms the watcher and catches up from the event logs |
| A hook did not write an event | `busy` in the last successful poll while the newest event is stale | Shows "uncertain since `<time>`" instead of "working" or "finished" |
| `claude agents --json` failed | Non-zero exit code or unparsable output | Records the error in `polls.jsonl`, shows it next to the overview; the failed poll never counts toward a vanished session |
| No gate marker | `Stop` without the marker | Judges the last message only on notification; a question becomes "probably waiting for you", never "finished" |
| API error in a session | `StopFailure` | State "problem: `<matcher>`" and a notification |
| Session vanished without `SessionEnd` | Two consecutive successful polls without it | State "problem"; proposes `claude --bg --resume <id>` and resumes only with Rafal's consent (§6.6) |
| `SendMessage` failed | A tool error, or a `[Cross-session delivery notice]` that the message was refused, denied or expired — for example the recipient has `crossSessionInbound: refuse`, or a held message was refused when the recipient session ended. `crossSessionInbound: refuse` gives no tool error: the tool returns `"success":true` and the refusal arrives as a notice (probe S4) | Record `not-sent` with the literal error or notice; `prompt.md` stays; no retry |
| Message held | A `[Cross-session delivery notice]` that the recipient holds the message: different permission modes (untested, §4 hub setup) or a session or repository set to hold every message | Record `held`; tells Rafal what is held and why; no resend while held (§6.3) |
| Delivery outcome unknown | The send record stayed `pending`: no `UserPromptSubmit` with the hub's `from-name` and a matching hash, and no notice | Shown as `delivery-unknown`; check 3 of §6.2 asks before any resend |
| Several sessions with the same name | The docs allow duplicate names | Sessions are addressed only by `sessionId`; names are for display and for resolving a fork's source, where a name matching several sessions makes the hub ask (§6.5 step 2) |
| Codex consultation failed | Exit code, timeout, or an empty `-o` file. An `error` item in the `--json` stream is not a failure: in probe S9 every stream carried a `hooks.json` timeout warning as an `error` item | Reports "brak drugiej opinii" with the literal error, including an exceeded Codex limit; keeps `answer-<n>.err`; no retry |
| Dialog fork died | The fork's event log | Artefacts in `dialogs/…` stay; the hub proposes a new fork from the same state |
| `claude --bg` refused: workspace not trusted | Exit code 1 and "Workspace not trusted" (probe S10) | Quotes the message and tells Rafal to run `claude` in the repository once and accept the trust prompt (§6.6); no retry |
| Hub after `/clear` or restart | — | Keeps its role from the role file (`--append-system-prompt-file`, probe S8); a restart uses the same start command (§4). Its new `sessionId` is registered in `hub-sessions.json` by the hub CLI from the events' `cwd` (§4.1) and rebuilds the overview from the event logs, journals and `claude agents --json` |

The hub never retries on its own and always quotes the literal error.

### 8.2 Boundaries

| Boundary | Rule |
|---|---|
| Consent | The hub never answers permission prompts or gates, and never treats a session's reply as Rafal's consent. Watcher events are not Rafal's answers ("Events … are not replies from the user", `Monitor` tool description) |
| Sending | Only after "wyślij" and only text Rafal has seen, header included; the Codex consultation is the read-only exception |
| Writing | At runtime the hub writes only into `~/.claude/hub/`. It changes nothing in project repositories and commits nothing; commits belong to project sessions under each repository's rules. Worktree cleanup (`claude rm`, removing a leftover directory, `git branch -d`, and `-D` only after Rafal confirms) is proposed to Rafal and never run by the hub (§6.6). It never modifies its own skill |
| Isolation | Decision 8: project sessions do not message each other on their own initiative |
| Secrets | Event logs store paths, descriptions, prompt hashes and the sender name of cross-session prompts, never full commands, tool responses or prompt text. Last-message files are local copies of what the session transcripts in `~/.claude/projects/` already hold. Codex consultations follow the denylist of §7 and contain only the element Rafal pointed at |
| Codex | First call always `-s read-only`; follow-ups always carry `-c sandbox_mode="read-only"` and run from `<dir>` (§7). Comments only |
| Network | No component listens on a network interface. Registry, journals, dialogs and Codex threads stay on this machine; Claude Code and Codex talk to their model services as they always do |
| Retention | The overview shows active sessions and sessions ended within the last 24 hours. The event log and the last-message directory `<session_id>.last/` of a session ended more than 14 days ago are deleted together by the hub CLI on hub start. `polls.jsonl` is truncated to the last 14 days. `journal.md`, `sent/`, `dialogs/` and `codex/` are kept indefinitely |

## 9. Testing and probes

### 9.1 Unit tests

Node without dependencies, `node --test`.

| Script | What is tested |
|---|---|
| `hub-hook.js` | Every event of §5.1 appends one well-formed line with `prompt_id`; no full command, no `tool_response` and no prompt text in the log; parallel hook processes of one session lose no event; each `Stop` writes its own last-message file named by its event id and the event references it, so two `Stop` events of one session never write the same file; a `Notification` other than `permission_prompt` (`idle_prompt`) writes no event; a cross-session `UserPromptSubmit` records `from-name` and the inner-text hash and no text, also for a multi-line inner text with `<`, `&` and `"` (wrapper format from the check of §6.3); with a missing or unwritable directory it exits 0 |
| Derived state | Every transition of §5.2, including out-of-order events (ordering by timestamp); `waiting: permission` cleared by a later `PostToolUse` or `Stop` with the same `prompt_id`, and not by one with a different `prompt_id` or an earlier timestamp; the queued-prompt sequence built from the S11 events (05:28:07–05:28:46 and 05:29:55–05:30:12): the `Stop` of the earlier turn sets no `turn-ended` and the queued turn's own `Stop` does; a hub-caused `UserPromptSubmit` clears `waiting: decision`; a `/clear` pair is shown as a continuation and carries no baseline; the raw `state` from `claude agents --json` never overrides the derived state; the priority order of §5.4 |
| Polls | A failed poll never makes a session vanished; vanishing needs two consecutive successful polls |
| `hub-watch.js` | Prints only state transitions; never prints "finished" after a long absence of events; prints no "turn ended" for the `Stop` of a turn with a pending queued prompt; reconciles a missed file notification at the next rescan |
| Pre-send check | Each of the six checks of §6.2 with a negative case; a first send without journal history; detached HEAD; a target restarted or cleared under the same name fails check 1 and shows the new candidate id; a delayed send re-runs all checks and blocks on a changed hash or baseline |
| Send record | Tool success alone leaves `pending`; `pending` → `sent` only on a recipient `UserPromptSubmit` with the hub's `from-name` and a matching inner-text hash (built from the S4 wrapper); a mismatched hash or another `from-name` does not confirm; held notice → `held`; refused notice → `not-sent`; `held` → `not-sent` when the recipient session ends; a tool error → `not-sent`; no evidence → `delivery-unknown`; a resend of the same hash asks, also while `held` |
| Prompt template and answer message | A missing section blocks sending; **Oczekiwany rezultat** is mandatory; the header line is part of the approved hash |
| Project matching | `C:\repo` vs `C:\repo-old`, case differences, the longest root wins, a duplicate root is reported |
| Codex thread | `meta.json` with the thread id from `thread.started`, successive `answer-<n>.md` and `answer-<n>.err`, stdin transport with Polish diacritics and a large element, the denylist, a timeout and an empty result give "brak drugiej opinii", an `error` item in the stream with exit code 0 and a non-empty result is not a failure |
| Retention | Deletes the event log and the `<session_id>.last/` directory of ended sessions older than 14 days together, and nothing else |

Every test uses a temporary directory as the hub data root and never touches the real
`~/.claude/hub/` (wiki pattern `konfiguracja-z-katalogu-domowego-wchodzi-do-testow`). Hook input
fixtures are the content-free fixtures from the probes in `C:/Users/rafal/hub-probes/data/fixtures/`
(13 variants; the `UserPromptSubmit` fixture has `prompt` replaced by `"<string>"`). Three are
built by hand: `StopFailure` from the documented fields (it never fired in the probes), the
queued-prompt sequence from the S11 events, and a cross-session `UserPromptSubmit` carrying the
`<cross-session-message …>` wrapper from the S4 event.

### 9.2 Probes

**Done.** Probes S1–S11 ran on 2026-10-13 and 2026-10-14 (Plan 1) in the throwaway repository
`C:/Users/rafal/hub-probes/`. Raw results, verdicts and fallbacks are in the probe report
(`.claude/specs/2026-10-13-orchestrator-hub-probes.md`); the decisions they led to are D1–D14
(§13.2). The only fallback taken is S1's: permission waits are cleared without tool call ids, by
`prompt_id` (§5.2). The table below is kept as the record of what was asked, with each verdict
added.

| # | Question | Criterion | Fallback | Verdict |
|---|---|---|---|---|
| S1 | Do hooks fire in a VS Code panel session, including `Notification` `permission_prompt`? Which identification fields do the payloads carry (session name, tool call id in `PostToolUse` and `Notification`, prompt in `UserPromptSubmit`)? Record inputs as fixtures | Every event reaches the event log; the field inventory is written down | "Waiting for permission" only for terminal and background sessions; permission waits cleared without tool call ids | Pass except `StopFailure` (never triggered, registration unconfirmed). `Notification` has no tool call id; every event carries `prompt_id`. Fallback taken: clearing by `prompt_id` (D2) |
| S2 | What does `PostToolUse` cost (Node start on Windows)? | 50 tool calls with hooks against 50 without, in one trial session: hook process time p95 below 500 ms, and median tool-call latency up by less than 100 ms against the baseline | Record only Edit/Write/Bash, or drop "what it is doing now" | Pass: spawn p95 44 ms; median +11 ms |
| S3 | How reliable is `fs.watch` on Windows, and how long does `claude agents --json` take? | A burst of 100 events in one second from 5 parallel writers, `.last.md` renames, a watcher restart mid-burst and a forced catch-up: events received after catch-up equal events generated; poll time measured | Polling event logs by modification time every 2 s. The periodic rescan of §5.5 stays in every case | Pass: 100 of 100, 0 broken lines, restart caught up; poll p95 171 ms. Concurrent renames onto one `.last.md` gave `EPERM` (D1); `state` values unexplained (D13) |
| S4 | Does `SendMessage` trigger `UserPromptSubmit` in the recipient, and is a hub message distinguishable in its payload? Does `SendMessage` return an error on `hold` or `refuse`? | All three behaviours written down | The hub sets "working" itself after sending; an unconfirmed delivery stays `delivery-unknown` and is never inferred from time | Pass: delivery triggers `UserPromptSubmit` with a `<cross-session-message from-name="…">` wrapper; held and refused messages also return `"success":true` (D3, D4). A hold from different permission modes untested (D5) |
| S5 | Does a `Monitor` expiry notice wake an idle hub tab? | The expiry woke the idle hub, a new monitor ran within one minute, and the catch-up showed a transition generated during the gap | A reminder in the hub tab that the watcher is down, until Rafal re-arms it | Pass: re-armed 9 s after the wake-up; run in a VS Code panel session, a terminal tab assumed to behave the same |
| S6 | Fork launch: does `--bg` combine with `--resume <id> --fork-session`? How are a start prompt and the role passed? Can the fork reach the dialog directory? How does a fork of a busy session behave? | Each of the four written down; the final command of §6.5 step 2 fixed | A ready command to paste; forks only of idle sessions | Pass: role in a positional start prompt; a stale id after restart (D6); a busy-session fork works, one sample (D7); command fixed with S7 (D8) |
| S7 | How to enforce, on Windows, "repository read-only, dialog directory writable" for the fork? | A write outside the dialog directory is refused, a write inside it succeeds | Default mode: Rafal approves each fork write himself | Pass for the routes tested (`Write`, PowerShell `Set-Content`) with `--settings` rules; other shell routes, the Bash tool and a dialog directory under `~/.claude/hub/` untested (D8) |
| S8 | Does the hub role survive `/clear` through `--append-system-prompt-file`? | Role present after `/clear` | Invoke the skill `hub` again | Pass; `/clear` continues the tab under a new id (D9, D6) |
| S9 | Does a Codex follow-up with `codex exec resume <id> -c sandbox_mode="read-only"` keep the read-only sandbox and `<dir>` as working directory? With the contract removed, does Codex read the repository itself and launch no agent? | A write attempt in the follow-up is refused; the working directory is `<dir>`; the `--json` stream shows no agent launch | A new `codex exec -s read-only -C <dir>` call per follow-up, with `thread.md` as context | Pass for `apply_patch` writes (refusal on stderr); shell writes not attempted; `error` items are not failures (D11) |
| S10 | Does `claude --bg -w <name>` work as a combination? | A background session in a new worktree | The hub creates the worktree with `git worktree add` and starts the session in it | Pass after workspace trust; `claude rm` needed a manual delete and left the branch (D10) |
| S11 | Smoke test of the gate marker | The marker appears at 5 of 5 gates of different kinds (question, design section, spec review), one of them after a compaction | The marker stays an auxiliary signal; the hub always judges the last message on notification | Pass: 5 of 5 gate kinds, one after `/compact`. Queued prompts found (D12) |

### 9.3 Acceptance test

With Rafal, on two trial projects:

1. the overview with both sessions and their states;
2. a notification after a turn ending with the marker;
3. the "waiting for permission" state;
4. the questionnaire path end to end;
5. a dialog through a fork: `prompt.md`, "wyślij", send record;
6. a Codex consultation with one follow-up;
7. a hub restart and state recovery.

Then one real project, chosen by Rafal, as a pilot.

## 10. Rollout: three plans

The probes decide mechanisms the later stages stand on, so each plan is written only after the
probes it depends on have results (decision 14). Every plan goes through its own review by
`codex exec` and its own execution handoff.

| Plan | Content | Written when |
|---|---|---|
| Plan 1: contract removal and probes | **Done** (2026-10-14). Removed the Codex–Claude contract from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, and the paused Codex automation `powiadomienie-o-pracy-claude-nad-planem-i-agentem` (decision 13). Ran probes S1–S11 in a throwaway repository. Results and fallbacks: `.claude/specs/2026-10-13-orchestrator-hub-probes.md`; decisions D1–D14 applied to this spec (§13.2) | After this spec was approved |
| Plan 2: core | First the backup hook prerequisite below (D14). Then: hooks with per-`Stop` last-message files and cross-session prompt fields, event logs, derived state (clearing by `prompt_id`, queued prompts, `/clear` continuation, raw `state` shown, not ranked), watcher, overview, sending with send records (`held`, delivery confirmed by the recipient's `UserPromptSubmit`), the hub start with its role file, global rules (marker, isolation), the questionnaire and direct command paths. Before the delivery confirmation relies on the hash: the inner-text check of §6.3 with a multi-line message containing `<`, `&` and `"`. Optional before Plan 2: a probe of a hold between an `auto` sender and a `default` recipient (§4 hub setup). Plan 2 also takes the probe report's S1 notes: the overview and retention tolerate SessionEnd-only sessions (an event log with one `SessionEnd` and no transcript) | Now: S1–S5 and S11 have results |
| Plan 3: dialog, Codex, new sessions | Dialog path through a fork, Codex consultation, new sessions with the worktree option, the acceptance test of §9.3. Notes: a busy session may be forked, with the caveat shown to Rafal; the evidence is one sample (§6.5 step 1, D7). The fork command, settings and open points (a)–(d) of §6.5 step 2 (D8): test (a), a fork writing under `~/.claude/hub/projects/<project>/dialogs/`, before Plan 3; Rafal decides (b), a fork without git or the hub putting the diff into the dialog directory; denying `EnterWorktree` is considered. New sessions: the trust step, and worktree cleanup only proposed by the hub (§6.6, §8.2, D10) | After the results of S6–S10 (done), the test of open point (a) and Rafal's decision on (b) |

**Prerequisite of Plan 2: the backup hook (D14).** Rafal's `SessionEnd` hook
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1"`
is registered in `~/.claude/settings.json` and in `~/.codex/hooks.json` (timeout 120 s each, so
Codex calls trigger it too). It currently mirrors every registered `.claude` directory into the
`~/.claude` repository, then commits and pushes it to `origin` on every session end; during the
probes it did so 13 times. With the hub, every fork, background session, `/clear` and Codex
consultation would trigger a commit and a push. Before the hub core is built, the hook skips the
sandbox and hub-launched sessions (for example by `cwd`; `SessionEnd` payloads carry no session
name) and debounces the rest (at most one run per interval). Rafal changes the hook himself, as
separate work: it is his own configuration, outside the hub's write boundary (§8.2).

A probe result that changes this spec (a fallback that alters scope or an approved decision) goes
back to Rafal and into this spec before the dependent plan is written.

## 11. Later increments

- **Panel on `localhost` (1a):** continuous view from the same registry, including the stream of
  `lastAction`.
- **Approval cards in the hub:** a `PermissionRequest` hook waits for a decision that Rafal enters
  himself with a `!` command in the hub tab, so the decision is never relayed by a model. The
  hook docs give `decision.behavior` allow/deny and a default `command` hook timeout of 600 s.
  This changes decision 3 and needs its own probe.
- **Codex session statuses:** `~/.codex/hooks.json` already has `SessionStart` and `SessionEnd`, so
  the registry could show Codex sessions. Sending to them is not possible with `SendMessage`.
- **Codex participation policy:** when Codex joins without an explicit command; to be refined
  during use.
- **Codex consultation from a dialog fork:** the same script, called from the fork.
- **Interlocutor from another model (2b)** and **voice (3)**.

## 12. Decisions deliberately not taken

- **Hub as an app with a panel (Firehose model):** rejected in decision 10. Firehose itself
  (okthink) runs only on macOS and Linux with tmux, so it cannot be used directly on Windows 11.
- **Firehose-style session ownership** (every session started inside the workbench): it would
  take sessions out of the VS Code panels.
- **Hard isolation with `deny` rules on `SendMessage`:** it would also remove continuing subagents.
- **The hub conversing about results itself:** it would mix the contexts of several projects in
  the hub.
- **Statuses only, without "what it is doing":** it leaves the visibility gap this project exists
  to close.
- **Redacting secrets inside consulted content:** a denylist of file names is enforced instead;
  pattern-based redaction would give a false sense of safety.

## 13. Approved additions and changes

### 13.1 Spec review (2026-10-13)

Not discussed explicitly in the conversation; approved by Rafal with the spec on 2026-10-13.

**Additions made while writing the spec:**

1. `sent/<timestamp>.md` keeps the exact text of every message sent to a session.
2. The hub's own session is excluded from the overview; dialog forks are listed under their
   project with the kind `dialog` (§5.1).
3. `<project>` for worktree sessions is derived from the repository's main worktree (§4.1).
4. "Uncertain" uses a threshold of 10 minutes without a new event while `busy` (§5.4).
5. Template headings stay in Polish, because `prompt.md` is user-facing (§6.1).

**Changes from the Codex review of 2026-10-13:**

6. The registry is an append-only event log per session with derived state, instead of one JSON
   state file rewritten by each hook (accepted design part 2). Reason: concurrent asynchronous
   hooks of one session could lose updates (§5.1, §5.2).
7. A state machine with explicit set/clear rules and a priority order of displayed states
   (§5.2, §5.4).
8. A session counts as vanished only after two consecutive successful polls; failed polls are
   recorded and never count (§5.2).
9. A sixth pre-send check: a warning and an explicit confirmation before sending to a session
   that waits for permission or a decision; a baseline recorded at approval; all checks re-run
   on a delayed send (§6.2).
10. Send records `pending` / `sent` / `not-sent` / `delivery-unknown` around every send (§6.3).
    Superseded in part by D3 (§13.2): `held` added, `sent` only on the recipient's confirmation.
11. The origin header line is part of the approved text (§6, §6.1).
12. The fork mode is named "repository read-only, dialog directory writable"; the fork command
    and the enforcement mechanism are fixed by probes S6 and S7 (§6.5).
13. The Codex prompt states the reviewer role (comments only, no changes, no other agents); the
    prompt goes on stdin; follow-ups carry `-c sandbox_mode="read-only"` (§7).
14. A denylist of secret-bearing file names for Codex consultations (§7).
15. The hub never modifies its own skill at runtime (§4, §8.2).
16. The network boundary is restated as "no listening interface; model traffic as usual" (§8.2).
17. Retention deletes the event log and `.last.md` together; `polls.jsonl` is truncated (§8.2).
    Superseded in part by D1 (§13.2): the last-message files are one per `Stop`, in `<session_id>.last/`.
18. Measurable probe criteria for S2, S3, S5, S9 and S11, with the thresholds stated in §9.2.

### 13.2 Decisions from the probes (2026-10-14)

Proposed in the probe report (section "Decisions for Rafal before Plan 2"); Rafal adopted all
fourteen as recommended on 2026-10-14 (decision 15). Each is applied in place in the sections
named.

| # | From | Decision | Sections |
|---|---|---|---|
| D1 | S3 | One last-message file per `Stop` event, `<session_id>.last/<event id>.md`, referenced from the event, instead of one `.last.md` written by temp file and rename; retention deletes the directory with the event log | §4, §4.1, §5.1, §5.6, §7, §8.2, §9.1 |
| D2 | S1 | `waiting: permission` is cleared by a later `PostToolUse` or `Stop` with the same `prompt_id`, not by a tool call id; the `Notification` hook keeps only `permission_prompt` | §5.1, §5.2, §9.1 |
| D3 | S4 | Tool success is not delivery: `sent` only on the recipient's `UserPromptSubmit` with the hub's wrapper and a matching inner-text hash; new state `held`; refusal arrives as a notice, not a tool error; the inner-text extraction is checked before Plan 2 relies on it | §4.1, §6.2, §6.3, §8.1, §9.1, §10 |
| D4 | S4 | `UserPromptSubmit` records the wrapper's `from-name` and the inner-text hash, never the text; the §5.2 rule that any prompt clears `waiting: decision` is kept | §5.1, §5.2, §8.2, §9.1 |
| D5 | S4 | No permission-mode rule for the hub; a mode-caused hold is untested and the hub relies on `held`; an `auto` → `default` hold probe is optional | §4 (hub setup), §8.1, §10 |
| D6 | S6, S8 | Forks resolve the source `sessionId` by name right before launch; sends keep the approval baseline and a changed id fails check 1 with the new candidate id shown for re-approval; a `/clear` pair is a continuation for display only; the hub re-registers after `/clear`. Derived when applying it: a name matching several sessions makes the hub ask before forking | §4.1, §5.1, §5.2, §6.2, §6.5, §8.1, §9.1 |
| D7 | S6 | A busy session may be forked; the fork lacks the running tool call's result; one sample; the idle check is dropped | §6.5, §10 |
| D8 | S6, S7 | The fork command in the tested argument order with `--settings` and `--add-dir`; allow the dialog directory, deny `Edit(./**)` and `Bash`; open points (a)–(d), with (a) tested and (b) decided before Plan 3 | §4, §6.5, §10 |
| D9 | S8 | The hub starts with `--append-system-prompt-file <hub role file>`; after `/clear` it keeps its role, re-registers and rebuilds the overview | §4, §8.1 |
| D10 | S10 | Workspace trust is a prerequisite of `--bg`; worktree layout recorded; the hub only proposes worktree cleanup (`git branch -d`, `-D` only after Rafal confirms), so §8.2 is kept | §4 (hub setup), §6.6, §8.1, §8.2, §10 |
| D11 | S9 | Follow-ups keep `-c sandbox_mode="read-only"` and run from `<dir>`; the read-only result covers `apply_patch` only; stderr kept in `answer-<n>.err`; an `error` item in the stream is not a failure | §4.1, §7, §8.1, §8.2, §9.1 |
| D12 | S11 | A `UserPromptSubmit` repeating a seen `prompt_id` marks a queued prompt; the earlier turn's `Stop` sets no `turn-ended` and the watcher prints no "turn ended" while it is pending. Derived for consistency when applying it: that `Stop` also sets no `waiting: decision` | §5.2, §5.5, §6.2, §9.1 |
| D13 | S3, S6, S7, S10 | `waitingFor` dropped; the raw `state` from `claude agents --json` is shown next to the derived state and no longer takes precedence | §5.4, §5.6, §9.1 |
| D14 | Side effect | Rafal's `SessionEnd` backup hook skips or debounces sandbox and hub-launched sessions before the hub core is built; changed by Rafal as separate work | §4 (hub setup), §10 |

Also taken from the probe report without a D-item: `claude --bg` prints a short id, and the full
`sessionId` comes from `claude agents --json` (§4.1, probe S6); `StopFailure` registration is
unconfirmed and its test fixture is built by hand (§5.1, §9.1, probe S1); Plan 2 tolerates
SessionEnd-only sessions (§10, probe S1); `PostToolUse.tool_response` is content and is never
recorded (§5.1, §8.2, §9.1, probe S1); the Probe S9 facts in §7 (read-only result for `apply_patch`,
`resume` working directory from the shell).

Derived after the spec-update review and confirmed by Rafal on 2026-10-14: the hub CLI
recognises the hub's sessions by the events' `cwd` = `~/.claude/hub/`, which registers the new id
after `/clear` without a step by the hub (§4.1, §5.1); the watcher prints a `/clear` continuation
as "continued after /clear", not as a new session (§5.5).
