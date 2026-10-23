# Orchestrator hub — design

**Date:** 2026-10-13
**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Owner:** Rafal Kielbasa
**Origin:** brainstorming sessions `0e06a344` (2026-10-11, voice module), `7e84737d`
(2026-10-12, decisions 1–9, design parts 1–2) and `c0c20a2d` (2026-10-13, decisions 10–13,
design parts 3–5, Firehose review, Codex review of this spec).
**Probes:** Plan 1, 2026-10-13 and 2026-10-14; results in
`.claude/specs/2026-10-13-hub-core-probes.md` (the probe report).

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
| 3 | How decisions reach a project session | The hub sends only prompts Rafal approved. Permission prompts are answered in the session itself; a decision gate is answered in the session or by an approved hub message (U1, §13.5); the hub says which session waits and for what |
| 4 | How the hub knows the state | Global hooks write a registry. A gate turn ends with a marker line. Waking moved from `notify_when_idle` to a watcher under `Monitor` when design part 2 was accepted (§5.5) |
| 5 | Who runs the analytical dialog | A fork of the project session (`--resume <id> --fork-session`) that reads the repository and writes only its dialog directory. Only decisions and the prompt draft go back to the hub |
| 6 | Visibility in v1 | Text in the hub. `PostToolUse` collects "what it is doing" from day one, so the panel (1a) needs no new data |
| 7 | Dialog artefacts | `decisions.md`, `open-questions.md`, `prompt.md` per project in the hub data directory, plus a per-project send journal |
| 8 | Isolation between projects | A global rule in `~/.claude/CLAUDE.md`: project sessions do not message each other on their own initiative; the hub is the only channel. No `deny` rules |
| 9 | How the hub runs | A permanent hub session for the working day, in a VS Code panel or a terminal tab, started in `~/.claude/hub/`; its role comes from `~/.claude/hub/CLAUDE.md` (P10). It reports in its tab and through `PushNotification` when Rafal is away |
| 10 | Hub as a Claude session or as an app with a panel (Firehose model) | The hub stays a Claude session |
| 11 | What to borrow from Firehose | Questionnaire path, answer message format, worktree option for new sessions, evidence checks before sending. Approval cards and Codex statuses become later increments |
| 12 | Shape of the Codex consultation | A thread per element: first call `codex exec`, follow-ups `codex exec resume <id>` |
| 13 | Codex–Claude execution contract | Removed entirely from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`; it was a remnant of coordinating Claude from the Codex desktop app |
| 14 | How many implementation plans | Three, each written after the probes it depends on (§10) |
| 15 | Probe decisions | D1–D14 from the probe report, adopted by Rafal on 2026-10-14 as recommended; applied in place in this spec and listed in §13.2 |
| 16 | Plan 3 additions | P1–P9: a project map with descriptive names, conversation titles from the transcript, new sessions launched from the map, by default in a worktree, a git snapshot for dialog forks, probe S12. Agreed with Rafal on 2026-10-14; applied in place and listed in §13.3 |
| 17 | Plan 3 acceptance amendments | P10–P15: the hub in a VS Code panel with its role in `~/.claude/hub/CLAUDE.md`, launch outcomes that stay unknown, forking a given live id, Codex calls isolated from Rafal's Codex hooks and MCP servers, a watcher that stops with its hub session, local time in the header line. Rulings from the Plan 3 execution and findings B1–B3 and B6 of its acceptance report; agreed with Rafal on 2026-10-16; applied in place and listed in §13.4. They make a fourth plan (§10) |

## 4. Components

| Component | Location | Role |
|---|---|---|
| Hub session | A Claude Code session in a VS Code panel or a terminal tab whose working directory is `~/.claude/hub/`; `~/.claude/hub/CLAUDE.md` holds the hub role, a copy of the skill's role file written by the installer (P10) | Overview of sessions, wake-ups from the watcher, `PushNotification`, starting dialogs and questionnaires, sending approved prompts with `SendMessage`, starting background sessions, Codex consultations. The role is loaded as project instructions at every start and after `/clear` (Plan 3 acceptance, Steps 8–9) |
| Skill `hub` | `~/.claude/skills/hub/`, tracked in git through the allowlist. Pattern: `code-review-master` — Node without dependencies, tests with `node --test` | `SKILL.md` with the hub role and procedures; scripts in `bin/`. The hub never modifies its own skill at runtime; changes to the skill are separate, explicitly requested work |
| Hook script | `~/.claude/skills/hub/bin/hub-hook.js`, registered globally in `~/.claude/settings.json` with `async: true` | Appends one event per hook call to the session's event log and, on `Stop`, writes that event's last-message file (§5.1). Works whether or not the hub runs |
| Watcher | `~/.claude/skills/hub/bin/hub-watch.js`, started by the hub through the `Monitor` tool | Prints one line per state transition (§5.5) |
| Hub CLI | `~/.claude/skills/hub/bin/hub.js` | Derived state and overview, conversation titles, the project map listing, last message, session registration, launching new sessions and dialog forks, the git snapshot for a dialog, pre-send check, send journal, Codex threads, retention cleanup |
| Hub data | `~/.claude/hub/`, outside git | See §4.1 |
| Dialog fork | `claude --bg --resume <sessionId> --fork-session …` in the project directory (§6.5 step 2) | Talks with Rafal; reads the repository and the session history; writes only into its dialog directory |
| Global rules | `~/.claude/CLAUDE.md` | The gate marker (§5.3) and the isolation rule (decision 8). The Codex–Claude contract section is removed (decision 13) |

**Hub setup.**

- The hub is any Claude Code session started in `~/.claude/hub/`: a new conversation in a VS Code
  window opened on that folder, or `claude` run there in a terminal. It needs no name and no
  flags: the hub CLI recognises it by `cwd` (§4.1), and the role comes from
  `~/.claude/hub/CLAUDE.md`, which tells it to invoke the skill `hub` first and after every
  `/clear`, and holds the hard rules (P10). The file holds the role's text itself: an `@` import
  of the skill's role file was not expanded in a VS Code panel session (Plan 3 acceptance, B3).
  The installer writes the file from the skill's `role.md` and rewrites it when it differs.
  `--append-system-prompt-file` (probe S8) still works in a terminal but is no longer needed.
  After `/clear` the hub keeps its role and the hub CLI registers its new `sessionId` from the
  events' `cwd` (§4.1).
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
  CLAUDE.md                           # the hub role, a copy of the skill's role.md written by the installer (P10)
  registry/<session_id>.events.jsonl  # append-only event log, written only by that session's hooks
  registry/<session_id>.last/<event id>.md  # full last assistant message of one Stop event, referenced by that event
  registry/polls.jsonl                # results of `claude agents --json` polls, including errors
  registry/titles.json                # conversation title cache: session id → title, its source, transcript size
  hub-sessions.json                   # session ids the hub registered: itself, dialog forks, background sessions
  projects.json                       # the project map (§4.2), written only by Rafal
  projects/<project>/
    journal.md                        # send records: pending, sent, held, not-sent, delivery-unknown
    sent/<timestamp>.md               # exact text of every message sent to a session
    dialogs/<date>-<slug>/
      context/                        # git snapshot of the source session's cwd, written by the hub CLI (§6.5 step 2)
      fork-settings.json              # the fork's permission rules (§6.5 step 2)
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

**Project matching.** `<project>` is the key of the project map entry (§4.2) whose `dir` contains
the session `cwd`. Paths are compared normalised and absolute, case-insensitively on Windows, as a
directory–descendant relation on path-segment boundaries (`C:\repo` does not match
`C:\repo-old`). The longest matching root wins; two entries with the same `dir` are a
configuration error that the hub reports. Without a map entry, `<project>` is the directory name of
the repository's main worktree (the parent of
`git rev-parse --path-format=absolute --git-common-dir`), so sessions in worktrees land under
their repository; the overview marks such a project as outside the map.

A project's journal, `sent/` and `dialogs/` live under `projects/<key>/`. Plan 2 created folders
named by the fallback rule (`projects/Baza-wiedzy/`, `projects/notatki/`, `projects/repo/`); when a
map key differs from such a folder name, new records go to the key's folder and check 3 of §6.2
does not see the old records. Nothing moves them; Rafal can pick keys equal to the existing folder
names or move the folders himself.

### 4.2 Project map

`~/.claude/hub/projects.json` holds one object `projects`, keyed by a short kebab-case key (for
example `baza-wiedzy`). Each entry has three fields:

| Field | Use |
|---|---|
| `name` | Descriptive name, shown in the Project column of the overview and in watcher lines |
| `dir` | Project root, used for project matching (§4.1) and as the working directory of new sessions (§6.6) |
| `description` | One or two sentences on what the project is. The hub matches Rafal's wording ("start a session in the course project") against the map and asks when more than one entry fits; the description also goes into the **Kontekst** section of a new session's prompt |

The key names the folder `projects/<key>/` and prefixes the names of sessions the hub launches
(`<key>-<slug>`, dialog forks `dlg-<key>-<slug>`). Rafal writes the map; the hub never edits it.
`HUB projects` prints the map and the projects seen in the registry without an entry. A missing
field, a `dir` that does not exist, or two entries with the same `dir` give one error line under
the overview, and the overview still renders, as an unreadable map does. The Plan 2 `aliases`
object is replaced; it was empty.

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
| `UserPromptSubmit` | A prompt was submitted: a SHA-256 of the prompt text, never the text; `session_title` when the payload has one (only this event carries a session name, probe S1); `transcript_path`, for the conversation title (§5.1, titles). A prompt from another session arrives wrapped as `<cross-session-message from="…" from-name="<sender>" from-mode="…">`, with `\n` before and after the inner text (probe S4); for it the event records the wrapper's `from-name` and a SHA-256 of the inner text, never the text. The hash confirms delivery (§6.3) |
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
`UserPromptSubmit.session_title` are used as the `to` of `SendMessage` and to resolve a fork's
source session right before launch (§6.5 step 2); for display the hub uses the conversation title
(below). A send's target is the baseline `sessionId` (§6.2 check 1). `SendMessage` takes only a
session name, so check 1 also requires that name to belong to exactly one live session. VS Code
panel sessions are named in `claude agents --json` too, as the folder name plus two characters
(`notatki-fa`; checked in a poll on 2026-10-14).

**Conversation titles.** Names like `notatki-fa` say nothing about the work, so the overview and the
watcher show the conversation title Claude Code keeps in the session transcript. The transcript
(`transcript_path` of the newest `UserPromptSubmit` that carries it) holds title records
`{"type":"ai-title","aiTitle":"…"}`, or `{"type":"custom-title","customTitle":"…"}` for a session
started with `--name` or renamed, appended again every few tens of kilobytes (checked on
2026-10-14: in a 113 MB transcript the largest gap between two records was about 490 KB; the hub
session had only `custom-title` records). The hub CLI reads the transcript backwards in 1 MB chunks
up to the newest record of either type, and caches the title with the transcript size in
`registry/titles.json`, reading again only when the size changed. Order of sources: the transcript
title, then `session_title`, then the name from `claude agents --json`, then nothing. A missing or
unreadable transcript is not an error; the next source is used. The title is display only: the
`/clear` continuation (§5.2) still pairs sessions by `session_title`, and the address stays the
session name. Not checked: whether terminal sessions started without `--name` carry `ai-title`
records.

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
wait. A send to a waiting session needs no second confirmation: `prepare` reports the wait as a
notice (§6.2, check 6, U1).

**`/clear` continuation.** `/clear` ends a session (`SessionEnd` with `reason: "clear"`) and the
tab continues under a new `sessionId` with the same `session_title` (probe S8). The overview shows
such a pair as a continuation of the same tab, for display only; it carries no send baseline over
(§6.2 check 1). VS Code panel sessions carry no `session_title`, so their continuation is not
recognised; `claude agents --json` names them (§5.1), but whether that name survives `/clear` was
not checked. That the new id runs in the same process is not verifiable from the events.

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

**The watcher stops with its hub session (P14).** At start the watcher finds its owner: the
nearest ancestor process named `claude` (`claude.exe` on Windows), from one read of the process
table. Before every write of `watch-state.json`, and every 10 seconds, it checks that the owner is
alive, and exits when it is not, without writing. If no owner is found, it prints one line saying
so and runs as before. Reason (Plan 3 acceptance, B2): closing a VS Code panel ended the hub's
`claude.exe` but not the watcher that `Monitor` had started; the orphaned watcher kept writing
`watch-state.json` next to the new hub's watcher and recorded a turn end first, so the new
watcher saw no transition and the new hub was never told. It was gone within the hour, consistent
with the 30-minute `Monitor` timeout (not verified).

### 5.6 Reading a result

Three levels:

1. the summary from the event log;
2. the full last message from the file referenced by the session's newest `Stop` event
   (`registry/<session_id>.last/<event id>.md`);
3. deeper: the transcript, read by a script tolerant to format changes, or a dialog through a
   fork.

The hub loads content into its own context only when Rafal asks. Otherwise it keeps pointers.

The overview is a table with the columns: project, session, state, since, last action, waiting
for, and the raw `state` from `claude agents --json` (§5.4). The project column shows the map
`name` (§4.2), or the fallback name marked as outside the map; the session column shows the first 8
characters of the `sessionId` and the conversation title (§5.1); "since" is local time, as is the
time in the header line of a composed message (§6.1, P15). `HUB last`
and `HUB judge` accept a unique `sessionId` prefix, as the overview shows it.

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

Every message starts with one header line naming its origin (path and dialog directory) and the
local time of composing (P15: in Plan 3 the header showed UTC while the message body quoted local
times, Plan 3 acceptance B6). The header is part of the text Rafal approves. The prompt is self-contained, because reading
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
6. (a notice, not a block, since U1) whether the session waits for permission or for a decision.
   `prepare` reports the wait with the gate text in a `warnings` list, on success and next to any
   failures; the hub quotes it to Rafal and sends on his one "wyślij", because a draft is usually
   the answer to the gate its target stands on. A session waiting for permission is also busy
   (check 5): the message queues until Rafal answers the prompt in the session. Before U1 this
   check blocked the send until Rafal confirmed a second time (`--confirm-waiting`); the flag is
   still accepted and has no effect.

If the session is busy, the hub asks whether to wait for the end of the turn or to send now. A
message to a busy session arrives "between tool calls", so it cuts into the current work; its
`UserPromptSubmit` carries the running turn's `prompt_id` and is derived as a queued prompt
(§5.2). On a delayed send the hub runs all checks again right before sending; any change
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
3. `sent`: the recipient's event log has a `UserPromptSubmit` with the hub's `from-name` and an
   inner-text hash equal to the record's text hash (§5.1). Only this evidence makes a record
   `sent`. The hub's from-names are `hub` and every name the polls of `claude agents --json` gave
   a session registered as hub in `hub-sessions.json`: a hub started without a name, for example
   in a VS Code panel, is called `<folder>-<2 hex>` (`hub-ba`), and `HUB confirm` finds those names
   itself (P10; found by the final review of Plan 4, where every hub of the Plan 3 acceptance had
   to pass `--hub-name` on its own);
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
2. **Launching the fork** (`HUB dialog start --session <id> --slug <slug>`). Immediately before
   launch, the hub CLI polls `claude agents --json` (P12):
   - the given `sessionId` is live: the hub forks that session; other live sessions with the same
     name are listed to Rafal as `twins`;
   - the given id is no longer live: a restart keeps the name but changes the id, and a fork from
     a stale id answers from the ended session's history (probe S6), so the hub CLI resolves the
     session's current id by name and requires exactly one live session with that name; otherwise
     it lists the candidates, Rafal picks one, and the hub runs `dialog start` again with that id.
     VS Code panel sessions carry no `session_title`, but `claude agents --json` names them
     (§5.1), so they resolve by that name.

   Before creating anything, the hub CLI also refuses a source without a `cwd`, a dialog directory
   that would lie inside the source session's `cwd` (the fork may not write there), and a fork name
   `dlg-<project>-<slug>` that a live session already carries. The `<project>` part of the name is
   the project key in kebab case (an unmapped `Baza wiedzy` gives `baza-wiedzy`).

   **Git snapshot** (decision of open point b). Before the launch the hub CLI writes, into
   `<dialog dir>/context/`, the output of read-only git commands run in session X's `cwd`:
   `git status --short`, `git log --oneline -20` and `git diff HEAD`, each with
   `--no-optional-locks`, because `git status` otherwise may refresh the repository's index file.
   The diff excludes the
   denylist of §7 through `:(exclude)` pathspecs (`.env*`, `*.pem`, `*.key`, `*credentials*`,
   `*secret*`, `auth.json`, `secrets.yaml`). A `cwd` outside a git repository gives a note in
   `context/` instead of the snapshot, and the fork still starts. The snapshot is taken once; it
   goes stale while session X works on, and `HUB dialog refresh --dir <dialog dir>` takes a new
   one on Rafal's command. Running git there reads the repository and writes only into the dialog
   directory, so the §8.2 writing boundary holds.

   The hub CLI then runs, in the project directory:

   ```
   claude --bg --resume <sessionId> --fork-session --name dlg-<project>-<slug> --settings <fork-settings.json> "<start prompt with the role>" --add-dir <dialog dir>
   ```

   The argument order is the tested one (probe S7): `--settings` before the prompt, and the prompt
   before `--add-dir`, because the variadic `--add-dir` otherwise swallows the prompt and the fork
   starts with no task. The hub runs `dialog start` through Bash with a 600-second timeout, because
   the launch may take up to 120 seconds plus the polls (P11). Fallback, only when the launch
   failed for certain (a non-zero exit): a ready command to paste into a new Git Bash tab, with the
   name quoted. A launch that timed out, or exited 0 without the `backgrounded` line, has an unknown
   outcome and gets no fallback command, because the fork may already run and a pasted command
   would start a second one; the hub tells Rafal to check the overview first. After Rafal starts a
   fork by hand, or when the output has no `sessionId` yet, the hub registers it with
   `HUB register` once `claude agents --json` lists it. The hub registers the fork's `sessionId` in
   `hub-sessions.json` (§4.1).

   The fork runs in the mode "repository read-only, dialog directory writable", enforced by the
   settings file `<dialog dir>/fork-settings.json`, written by the hub CLI:
   - `permissions.allow`: `Edit(//C:/<absolute path of the dialog directory>/**)`;
   - `permissions.deny`: `Edit(./**)` (it also covers `Write`), `Bash` (it also removes the
     `PowerShell` tool from the fork) and `EnterWorktree` (it removes that tool, probe S12);
   - `worktree.bgIsolation` is not set, so the background-session worktree guard stays on as a
     second barrier for `Write`.

   Tested in `auto` mode (probe S7): the deny rule alone refused a `Write` into the repository; a
   `Write` into the dialog directory succeeded; with `deny` holding only `Edit(./**)`, a
   PowerShell `Set-Content` into the repository was blocked and one into the dialog directory
   allowed. Probe S12: a `Write` into a dialog directory under `~/.claude/hub/projects/` succeeded
   without a prompt and without a "[Self-Modification]" refusal; the fork read a context file the
   hub had put there; with `EnterWorktree` in `deny` the tool was not available to the fork. Not
   tested: other shell write routes (`Out-File`, redirection, `node -e`, `git`) and the Bash tool,
   so "the fork cannot write to the repository by any route" is not established. Fallback (probe
   S7): default permission mode, and Rafal approves each fork write himself.

   Open points:
   - (a) settled by probe S12: forks write into `~/.claude/hub/projects/<project>/dialogs/`;
   - (b) decided by Rafal on 2026-10-14: the hub puts the git snapshot into the dialog directory
     (above);
   - (c) the argument order above is the only one tested;
   - (d) "a fork inherits the source's permission mode" is not shown: the source session and the
     account default were both `auto`. The write boundary therefore comes from the settings file,
     not from the mode.
3. **Fork role**, given in its start prompt, a fixed text in the skill `hub` (probe S6: the fork
   held a read-only role from the start prompt and refused a write until told otherwise):
   - an analytical partner that changes nothing in the repository;
   - it reads every decision back to Rafal and writes it into `decisions.md` only after his
     confirmation, with rationale and source;
   - unanswered questions go into `open-questions.md`;
   - it reads the repository and the session history with the read and search tools, and the git
     snapshot in `context/`, taken at the time the prompt names and possibly stale; it has no
     shell (step 2);
   - questions and gates left open in the inherited history of session X are not its gates; its
     only gate is the review of `prompt.md` (step 5). Probe S12: a fork ended its first turn with
     the gate marker of a question open in its source's history.
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
- **New session:** started from the project map (§4.2).
  1. Rafal names the project and the work, for example "odpal sesję w bazie wiedzy: <zadanie>".
     The session runs in a worktree by default; "bez worktree" turns that off (P9).
  2. The hub matches the project against `HUB projects` (key, `name`, `description`) and asks
     when more than one entry fits; it never guesses. A project outside the map gets no new
     session; the hub asks Rafal to add it to the map.
  3. `HUB compose --path new-session --project <key> --slug <slug> --body-file -` writes the
     draft: the header line and the five sections of §6.1, with the project's `description` in
     **Kontekst**.
  4. Rafal sees the exact text and the launch parameters (directory, session name
     `<key>-<slug>`, the worktree `<dir>/.claude/worktrees/<key>-<slug>` on the branch
     `worktree-<key>-<slug>`, or "bez worktree") and says "wyślij".
  5. `HUB approve` records the baseline: the project `dir`, its git branch (or SHA) and the text
     hash.
  6. `HUB launch <id>` checks that the directory exists, that no live session carries the name
     `<key>-<slug>`, that the text has every section and that its hash matches the approved one.
     It saves the journal record as `pending`, with the sent file, before it spawns anything, so
     an interrupted launch never leaves the record `approved` (P11); the hub runs `launch` through
     Bash with a 600-second timeout. It then runs `claude --bg --name <key>-<slug> -w <key>-<slug> "<text>"` (without `-w` after
     "bez worktree") with the project
     `dir` as working directory, through `spawnSync` with an argument array and no shell
     (`claude` is `claude.exe`). A text longer than 30 000 characters is refused before launch,
     because a Windows command line holds at most 32 767.
  7. The hub CLI reads the short id from `backgrounded · <id> · <name>`, takes the full
     `sessionId` from `claude agents --json` (probe S6), registers it in `hub-sessions.json` with
     the kind `background`, the project, the name and, for a worktree, its path and branch, and
     adds the short id, the `sessionId` and the worktree to the `pending` record of the path
     `new-session`.
  8. `HUB confirm` makes the record `sent` when the new session's first `UserPromptSubmit`
     carries a `promptHash` equal to the approved text hash. Untested: whether Claude Code passes
     a command-line prompt unchanged (for example without trimming whitespace); a differing hash
     is reported as `mismatched`, as for a hub message (§6.3), never as `sent`.
  9. The session then appears in the overview under its project, titled by its name (a `--name`
     session has a `custom-title`, §5.1); further instructions go through the direct command
     path. Permission prompts are answered after `claude attach <id>` (decision 3); the hub gives
     Rafal that command.

  A launch that failed for certain (a non-zero exit) is recorded `not-sent` with the literal error.
  A launch whose outcome is unknown — `claude --bg` did not answer within 120 seconds, or exited 0
  without the `backgrounded · <id> · <name>` line — keeps the record `pending` with the error and
  `unknown: true`; it shows as `delivery-unknown` until `HUB confirm` finds the session's first
  prompt, because the session may have started (P11). The hub never retries on its own. Untested: the permission mode a new background session starts in (a fork in probe S7 had
  its source's `auto`; a fresh session probably takes the account default). Rafal's backup hook
  skips only sessions whose `cwd` lies under `C:\Users\rafal\hub-probes` or `~/.claude/hub`
  (`backup-claude.ps1:17`), so a hub-launched session in a real repository triggers the backup
  when it ends, limited by the 10-minute debounce (`:18`); changing that is Rafal's own work
  (D14).
  - **Trust prerequisite.** `claude --bg` requires a trusted workspace; in an untrusted one it
    exits with code 1 and "Workspace not trusted. Run `claude` in <dir> once and accept the trust
    prompt, then retry." (probe S10). Before the first background session in a new repository,
    the hub tells Rafal to run `claude` there once and accept the trust prompt. A worktree under a
    trusted repository needed no separate trust; this rests on a single launch.
  - **Worktree layout.** `-w <name>` creates `<repo>/.claude/worktrees/<name>` on a new branch
    `worktree-<name>`, registered in git as locked (probe S10).
  - **Why a worktree by default (P9).** A background session may not edit the shared checkout:
    its first edit there is refused with "This background session hasn't isolated its changes
    yet. Call EnterWorktree first…" (probe S7, seen in a fork). A session launched "bez worktree"
    is therefore expected to move into a worktree of its own naming at its first edit, which the
    hub does not know; this is inferred from S7 and untested for a new session. A worktree the hub
    names is journalled with its path and branch, and its cleanup can be proposed. The session's
    work stays on its worktree branch until Rafal merges it. A repository where hub sessions
    should edit the shared checkout can set `"worktree": {"bgIsolation": "none"}` in its
    `.claude/settings.json`; that is Rafal's configuration, outside the hub (§8.2).
  - **Worktree cleanup.** The hub only proposes the cleanup commands to Rafal and runs none of
    them itself (§8.2): retry `claude rm <id>` after the session process has exited (on Windows
    the first run hit `EBUSY` and the second refused, probe S10); remove a leftover worktree
    directory by hand; delete the branch with `git branch -d worktree-<name>`, which refuses a
    branch with unmerged commits. `git branch -D` is proposed only after Rafal confirms that the
    branch's commits may be lost, because that branch holds the background session's work.
    `claude rm` leaves the branch in place.
- **Projects:** the project comes from the session `cwd` (§4.1); the project map (§4.2) gives
  descriptive names, descriptions and the directories for new sessions.

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

   **Isolation from Rafal's Codex setup (P13).** Every call, first and follow-up, carries
   `-c features.hooks=false -c features.plugins=false -c features.apps=false` and
   `-c mcp_servers.<name>.enabled=false` for every `[mcp_servers.<name>]` table in
   `$CODEX_HOME/config.toml` (`CODEX_HOME` defaults to `~/.codex/`; the hub CLI reads only the
   table names). Reason (Plan 3 acceptance, B1): the `SessionStart` hooks of `~/.codex/hooks.json`
   ran in the hub's first call and its answer was the review reminder instead of an answer; the
   `SessionEnd` backup hook ran after every call; the MCP servers started and failed on stderr.
   Checked on 2026-10-16 with Codex CLI 0.147.0 (`--disable hooks --disable plugins
   --disable apps -c mcp_servers.n8n.enabled=false -c mcp_servers.node_repl.enabled=false`): the
   answer was on topic, stderr held only the models-cache warning, and the review-reminder hook's
   state file was not touched. `~/.codex/AGENTS.md` still loads, so Rafal's Codex rules (answers
   in Polish) apply. Codex keeps quotes in a `-c` key path: `-c mcp_servers."x".enabled=false`
   names a new server `"x"` and the whole call fails with "Error loading config.toml: invalid
   transport" (checked on 2026-10-16), so a quoted server name is passed unquoted when its content
   is a bare key (`[A-Za-z0-9_-]+`) and is skipped otherwise. An unreadable `config.toml` keeps the
   three `features` overrides and disables no server instead of failing the call.
4. The hub shows the answer verbatim, next to a table: remark, hub assessment, rationale.
5. "Codex, <pytanie>" is a follow-up in the same thread:
   `codex exec resume <id> -c sandbox_mode="read-only" --json -o <thread>/answer-<n>.md -`, with
   the isolation overrides of step 3, with
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
| Several sessions with the same name | The docs allow duplicate names | The send target is identified by `sessionId`; a name shared by several live sessions fails check 1, because `SendMessage` cannot tell them apart; a fork of a live given id goes ahead and lists the twins, a stale id with a shared name asks (§6.5 step 2) |
| Codex consultation failed | Exit code, timeout, or an empty `-o` file. An `error` item in the `--json` stream is not a failure: in probe S9 every stream carried a `hooks.json` timeout warning as an `error` item | Reports "brak drugiej opinii" with the literal error, including an exceeded Codex limit; keeps `answer-<n>.err`; no retry |
| Dialog fork died | The fork's event log | Artefacts in `dialogs/…` stay; the hub proposes a new fork from the same state |
| `claude --bg` refused: workspace not trusted | Exit code 1 and "Workspace not trusted" (probe S10) | Quotes the message and tells Rafal to run `claude` in the repository once and accept the trust prompt (§6.6); no retry |
| Hub after `/clear` or restart | — | Keeps its role from `~/.claude/hub/CLAUDE.md` (P10); a restart is a new session in `~/.claude/hub/` (§4). Its new `sessionId` is registered in `hub-sessions.json` by the hub CLI from the events' `cwd` (§4.1) and rebuilds the overview from the event logs, journals and `claude agents --json` |
| Hub session ended, its watcher still running | The watcher's owner check (§5.5) | The watcher exits without writing `watch-state.json`, so the next hub's watcher reports what changed (P14) |
| New session or fork launch with an unknown outcome | `claude --bg` timed out after 120 s, or exited 0 without the `backgrounded` line | The record stays `pending` with the error and `unknown: true`, shown as `delivery-unknown`; no fallback command for a fork; the hub tells Rafal to check the overview (§6.5 step 2, §6.6, P11) |

The hub never retries on its own and always quotes the literal error.

### 8.2 Boundaries

| Boundary | Rule |
|---|---|
| Consent | The hub never answers permission prompts or gates, and never treats a session's reply as Rafal's consent. Watcher events are not Rafal's answers ("Events … are not replies from the user", `Monitor` tool description) |
| Sending | Only after "wyślij" and only text Rafal has seen, header included; the Codex consultation is the read-only exception |
| Writing | At runtime the hub writes only into `~/.claude/hub/`. It changes nothing in project repositories and commits nothing; in a repository it runs only read-only git commands with `--no-optional-locks`, for the dialog snapshot (§6.5 step 2) and the baseline (§6.2); commits belong to project sessions under each repository's rules. Worktree cleanup (`claude rm`, removing a leftover directory, `git branch -d`, and `-D` only after Rafal confirms) is proposed to Rafal and never run by the hub (§6.6). It never modifies its own skill |
| Isolation | Decision 8: project sessions do not message each other on their own initiative |
| Secrets | Event logs store paths, descriptions, prompt hashes and the sender name of cross-session prompts, never full commands, tool responses or prompt text. Last-message files are local copies of what the session transcripts in `~/.claude/projects/` already hold; from a transcript the hub CLI reads only title records into `registry/titles.json`. The dialog git snapshot excludes the denylist of §7. Codex consultations follow the denylist of §7 and contain only the element Rafal pointed at |
| Codex | First call always `-s read-only`; follow-ups always carry `-c sandbox_mode="read-only"` and run from `<dir>` (§7). Every call runs without Rafal's Codex hooks, plugins, apps and MCP servers (P13). Comments only |
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
| `hub-watch.js` | Prints only state transitions; never prints "finished" after a long absence of events; prints no "turn ended" for the `Stop` of a turn with a pending queued prompt; reconciles a missed file notification at the next rescan; finds its owner as the nearest `claude` ancestor in a given process table; exits without writing `watch-state.json` once its owner is gone, so a later watcher still reports the transition; without an owner prints one line and keeps running |
| Pre-send check | Each of the five blocking checks of §6.2 with a negative case; the check 6 notice for a decision wait (with the gate text) and for a permission wait, also next to a check 5 failure, and a waiting session passing with and without `--confirm-waiting` (U1); a first send without journal history; detached HEAD; a target restarted or cleared under the same name fails check 1 and shows the new candidate id; a delayed send re-runs all checks and blocks on a changed hash or baseline |
| Send record | Tool success alone leaves `pending`; `pending` → `sent` only on a recipient `UserPromptSubmit` with the hub's `from-name` and a matching inner-text hash (built from the S4 wrapper); a mismatched hash or another `from-name` does not confirm; a hub without `--name` is recognised by the name a poll gave its registered session, and a session outside `hub-sessions.json` with a similar name is not; held notice → `held`; refused notice → `not-sent`; `held` → `not-sent` when the recipient session ends; a tool error → `not-sent`; no evidence → `delivery-unknown`; a resend of the same hash asks, also while `held` |
| Prompt template and answer message | A missing section blocks sending; **Oczekiwany rezultat** is mandatory; the header line is part of the approved hash and shows local time |
| Project matching | `C:\repo` vs `C:\repo-old`, case differences, the longest root wins, a duplicate root is reported |
| Project map | The overview shows the map `name`; a session outside the map shows the fallback name marked as outside the map; a missing field, a non-existent `dir`, a duplicate `dir` and an unreadable file each give one error line and the overview still renders; `HUB projects` lists the map and the unmapped projects seen in the registry |
| Conversation titles | `UserPromptSubmit` records `transcript_path`; the newest `custom-title` or `ai-title` record wins; a record more than 1 MB before the end is found by the chunked backward read; the cache is reused while the transcript size is unchanged and refreshed when it changes; a missing transcript falls back to `session_title`, then to the poll name; the `/clear` continuation still pairs by `session_title` |
| Id prefix and local time | `HUB last` and `HUB judge` accept a unique `sessionId` prefix and refuse an ambiguous one; "since" renders in local time |
| New session | `compose --path new-session` puts the project `description` into **Kontekst**; `launch` refuses a missing directory, a name already used by a live session, a missing section, a changed hash and a text over 30 000 characters; the launch runs without a shell with the project `dir` as working directory and `-w` only when asked; the short id is parsed and the full `sessionId` registered with project, name and worktree; the record is `pending` with the sent file before the spawn; a non-zero exit (for example "Workspace not trusted") gives `not-sent` with the literal output; a timeout or an exit 0 without the `backgrounded` line keeps it `pending` with `unknown: true`; `confirm` makes the record `sent` on a matching `promptHash` and reports a differing one as `mismatched` |
| Dialog start | A live given id is forked directly and other live sessions with its name are listed as twins; a stale id is resolved by name right before launch, and an ambiguous name stops the launch; a missing `cwd`, a dialog directory inside the source `cwd` and a fork name already live are refused before anything is created; a timeout or an exit 0 without `backgrounded` gives no fallback command; `context/` holds the three git outputs, all run with `--no-optional-locks`; the diff excludes the §7 denylist; a `cwd` outside git gives a note and the fork still starts; `fork-settings.json` holds the allow rule for the dialog directory and denies `Edit(./**)`, `Bash` and `EnterWorktree`; the command keeps the S7 argument order; the start prompt carries the role, the snapshot time and the rule on inherited gates; `dialog refresh` replaces the snapshot |
| Codex thread | Both the first call and a follow-up carry the isolation overrides, one `mcp_servers.<name>.enabled=false` per server table in the given config, a quoted name unquoted when it is a bare key and skipped otherwise, and none for a missing or unreadable config; `meta.json` with the thread id from `thread.started`, successive `answer-<n>.md` and `answer-<n>.err`, stdin transport with Polish diacritics and a large element, the denylist, a timeout and an empty result give "brak drugiej opinii", an `error` item in the stream with exit code 0 and a non-empty result is not a failure |
| Retention | Deletes the event log and the `<session_id>.last/` directory of ended sessions older than 14 days together, and nothing else |
| Installer | Writes `~/.claude/hub/CLAUDE.md` from the skill's `role.md` when it is missing or differs, leaves an identical one alone, and the dry run only reports it |

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
(`.claude/specs/2026-10-13-hub-core-probes.md`); the decisions they led to are D1–D14
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
| S12 | Run after Plan 2, before Plan 3. Can a fork write into a dialog directory under `~/.claude/hub/projects/`, read a hub-placed context file, and is it kept from `EnterWorktree`? | The write succeeds without a prompt or a "[Self-Modification]" refusal; the read succeeds; `EnterWorktree` is refused or unavailable | Dialog directories outside `~/.claude` | Pass: all three; the fork ended its turn with a marker inherited from its source's history (P6) |

### 9.3 Acceptance test

With Rafal, on two trial projects:

1. the overview with both sessions and their states;
2. a notification after a turn ending with the marker;
3. the "waiting for permission" state;
4. the questionnaire path end to end;
5. a dialog through a fork: `prompt.md`, "wyślij", send record;
6. a Codex consultation with one follow-up;
7. a hub restart and state recovery;
8. the overview with project names from the map and conversation titles, one session outside the
   map;
9. a new session launched from the map, with the record confirmed `sent`;
10. the hub after `/clear`: role kept, overview rebuilt, the new id excluded.

Plan 3's acceptance runs items 4–10, together with the items Plan 2's acceptance did not run.
The results are in the acceptance reports (`.claude/specs/2026-10-14-hub-core-plan-2-acceptance.md`,
`.claude/specs/2026-10-14-hub-core-plan-3-acceptance.md`); the status of each plan is kept in
[.claude/projects/hub.md](../projects/hub.md).

Plan 4's acceptance, with one trial session:

- a Codex consultation whose first answer is on topic and whose `answer-1.err` shows no MCP server
  starting (P13);
- the hub panel closed while a session ends a turn, then a new hub started: the new hub's watcher
  reports `turn ended` for that session, and only one watcher process runs (P14);
- an install writes `~/.claude/hub/CLAUDE.md` from `role.md`, and a hub started in a VS Code panel
  has the hard rules in its first turn without reading `role.md` (P10);
- a composed message whose header shows local time (P15).

Then one real project, chosen by Rafal, as a pilot.

## 10. Rollout: plans

The probes decide mechanisms the later stages stand on, so each plan is written only after the
probes it depends on have results (decision 14). Every plan goes through its own review by
`codex exec` and its own execution handoff.

| Plan | Content | Written when |
|---|---|---|
| Plan 1: contract removal and probes | Removed the Codex–Claude contract from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, and the paused Codex automation `powiadomienie-o-pracy-claude-nad-planem-i-agentem` (decision 13). Ran probes S1–S11 in a throwaway repository. Results and fallbacks: `.claude/specs/2026-10-13-hub-core-probes.md`; decisions D1–D14 applied to this spec (§13.2) | After this spec was approved |
| Plan 2: core | First the backup hook prerequisite below (D14). Then: hooks with per-`Stop` last-message files and cross-session prompt fields, event logs, derived state (clearing by `prompt_id`, queued prompts, `/clear` continuation, raw `state` shown, not ranked), watcher, overview, sending with send records (`held`, delivery confirmed by the recipient's `UserPromptSubmit`), the hub start with its role file, global rules (marker, isolation), the questionnaire and direct command paths. Before the delivery confirmation relies on the hash: the inner-text check of §6.3 with a multi-line message containing `<`, `&` and `"`. Optional before Plan 2: a probe of a hold between an `auto` sender and a `default` recipient (§4 hub setup). Plan 2 also takes the probe report's S1 notes: the overview and retention tolerate SessionEnd-only sessions (an event log with one `SessionEnd` and no transcript) | Now: S1–S5 and S11 have results |
| Plan 3: map, titles, new sessions, dialog, Codex | In this order, each group usable on its own: (1) the project map (§4.2), conversation titles (§5.1), and Plan 2 acceptance findings A1 (id prefix in `last` and `judge`) and A2 (local time in the overview); (2) new sessions from the map with the worktree option (§6.6); after this group Rafal may pause and pilot the hub; (3) the dialog path through a fork with the git snapshot (§6.5); (4) the Codex consultation (§7); (5) the acceptance test, items 4–10 of §9.3. Notes: a busy session may be forked, with the caveat shown to Rafal; the evidence is one sample (§6.5 step 1, D7). New sessions: the trust step, and worktree cleanup only proposed by the hub (§6.6, §8.2, D10). Out of scope: the open decisions I-3, I-4 and M-2 of the Plan 2 acceptance report | — |
| Plan 4: acceptance fixes | The installer writes `~/.claude/hub/CLAUDE.md` and `SKILL.md` describes the start without flags (P10); Codex calls isolated from Rafal's Codex hooks, plugins, apps and MCP servers (P13); the watcher stops with its hub session (P14); local time in the header line (P15); then the Plan 4 acceptance of §9.3. P11 and P12 are already in the Plan 3 code and only recorded in this spec. Out of scope: B5 ("wyslij" without diacritics), B7 (re-arm noise), I-3, I-4, M-2 | — |

The status of every plan is kept in [.claude/projects/hub.md](../projects/hub.md).

**Prerequisite of Plan 2: the backup hook (D14).** Rafal's `SessionEnd` hook
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1"`
is registered in `~/.claude/settings.json` and in `~/.codex/hooks.json` (timeout 120 s each, so
Codex calls trigger it too, until P13 turns hooks off in the hub's Codex calls). It currently mirrors every registered `.claude` directory into the
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
   on a delayed send (§6.2). The explicit confirmation was dropped by U1 (§13.5).
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
| D9 | S8 | The hub starts with `--append-system-prompt-file <hub role file>`; after `/clear` it keeps its role, re-registers and rebuilds the overview. Superseded in part by P10 (§13.4): the role now comes from `~/.claude/hub/CLAUDE.md` | §4, §8.1 |
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

### 13.3 Plan 3 additions (2026-10-14)

Agreed with Rafal in brainstorming session `c51a0755` on 2026-10-14 (decision 16), in three design
sections he accepted one by one, plus open point (b) and probe S12. Rafal's starting points: the
hub needs a project map with descriptive names that he prepares; the hub should start a new
session in a project under discussion and act through it; the session names in the overview say
nothing about the work.

| # | Addition | Sections |
|---|---|---|
| P1 | Project map: `projects.json` holds `projects` keyed by a kebab-case key, each entry with `name`, `dir` and `description` (variant B of three: name + directory; + description; + new-session defaults). Rafal writes it; `HUB projects` lists it with the unmapped projects; errors give lines under the overview. Replaces the empty `aliases` | §4.1, §4.2, §5.6, §6.6, §9.1 |
| P2 | Conversation titles: the hook records `transcript_path`; the hub CLI reads the newest `custom-title` or `ai-title` record backwards in 1 MB chunks and caches it by transcript size in `registry/titles.json`; the overview and the watcher show `<8 characters of the id> <title>`; the session name stays the `SendMessage` address | §4.1, §5.1, §5.6, §8.2, §9.1 |
| P3 | New sessions from the map: compose with the project description, "wyślij", `HUB launch` (checks, no-shell spawn, a 30 000-character limit), registration, delivery confirmed by `promptHash`; names `<key>-<slug>` | §6.6, §9.1, §9.3 |
| P4 | Open point (b), Rafal's decision: the hub CLI puts a git snapshot (`status`, `log`, `diff HEAD`, with `--no-optional-locks`, without denylisted files) into `<dialog dir>/context/`; refreshed on Rafal's command | §4.1, §6.5, §8.2, §9.1 |
| P5 | Probe S12: forks write into `~/.claude/hub/projects/<project>/dialogs/` (open point a settled); `EnterWorktree` joins the fork's `deny` | §6.5, §9.2 |
| P6 | From S12: the fork's start prompt says that gates open in the inherited history are not its gates | §6.5 step 3 |
| P7 | Plan 2 acceptance findings A1 (unique id prefix in `last` and `judge`) and A2 (local time in the overview) join Plan 3 | §5.6, §9.1, §10 |
| P8 | Plan 3 runs in five groups (map and titles, new sessions, dialog, Codex, acceptance); the acceptance test grows to ten items and takes over the Plan 2 items not run; I-3, I-4 and M-2 stay outside Plan 3 | §9.3, §10 |
| P9 | Rafal's decision (variant b of three: as before, worktree by default, `bgIsolation: none` per repository): a new session runs in a worktree by default and "bez worktree" turns that off, because a background session may not edit the shared checkout (probe S7) and only a worktree the hub names can be journalled and proposed for cleanup | §6.6 |

**Derived while writing this amendment, not discussed explicitly:**

- a project outside the map gets no new session; the hub asks Rafal to add it to the map (§6.6
  step 2), because a launch needs the map's key and `dir`;
- git commands in a project repository carry `--no-optional-locks`, because `git status` may
  otherwise refresh the index file, which would be a write (§6.5 step 2, §8.2);
- a `cwd` outside git gives a note in `context/` and the fork still starts (§6.5 step 2);
- Plan 2's journal folders named by the fallback rule are not moved when a map key differs (§4.1);
- VS Code panel sessions are named in `claude agents --json` (checked in a poll on 2026-10-14),
  which closes the §6.5 step 2 caveat on resolving them by name (§5.1, §5.2, §6.5).

### 13.4 Plan 3 acceptance amendments (2026-10-16)

From the rulings made while executing Plan 3 (session `c51a0755`; its working ledger was deleted
after these amendments, so this table is their record) and the findings
of the Plan 3 acceptance report (`.claude/specs/2026-10-14-hub-core-plan-3-acceptance.md`).
Rafal chose on 2026-10-16 to record them in this spec and to fix B1–B3 and B6 in a fourth plan
(decision 17). P11 and P12 describe code that Plan 3 already ships; P10, P13, P14 and P15 are
Plan 4's work.

| # | Amendment | From | Sections |
|---|---|---|---|
| P10 | The hub runs in a VS Code panel or a terminal tab, as any session started in `~/.claude/hub/`; the name `hub` and the start flags are not needed. Its role comes from `~/.claude/hub/CLAUDE.md`, which holds the text of the skill's `role.md` (an `@` import was not expanded in a panel) and is written by the installer. `HUB confirm` recognises the hub's messages by every name the polls gave a hub session, not only `hub` | Rafal's choice to run the hub in a panel; acceptance B3, B4; final review of Plan 4 | §3 (decision 9), §4, §4.1, §6.3, §8.1, §9.1, §9.3, §10 |
| P11 | `launch` saves the record `pending` before spawning and the hub calls `launch` and `dialog start` with a 600-second Bash timeout; a `claude --bg` timeout (120 s) or an exit 0 without the `backgrounded` line is an unknown outcome: the record stays `pending` with `unknown: true`, and a fork gets no fallback command | Plan 3 rulings T4, T6, final review I2, I3 | §6.5 step 2, §6.6, §8.1, §9.1 |
| P12 | `dialog start` forks a given live id directly and lists other live sessions with its name as twins; only a stale id is resolved by name. A missing `cwd`, a dialog directory inside the source `cwd` and a fork name already live are refused before anything is created; the fork name uses the kebab-cased key | Plan 3 final review I1, M1, M4, M5 | §6.5 step 2, §8.1, §9.1 |
| P13 | The hub's Codex calls run with hooks, plugins and apps off and every MCP server of `$CODEX_HOME/config.toml` disabled, through `-c` overrides; checked on 2026-10-16 | acceptance B1 | §7, §8.2, §9.1, §9.3, §10 |
| P14 | The watcher finds its owning `claude` process at start and exits, without writing its state, once that process is gone | acceptance B2 | §5.5, §8.1, §9.1, §9.3 |
| P15 | The header line of a composed message shows local time | acceptance B6 | §5.6, §6.1, §9.1, §9.3 |

**Open, not part of Plan 4:** B5 — whether "wyslij" without diacritics counts as "wyślij" (the hub
accepted it in the acceptance and said so); B7 — the watcher re-arm ends a hub turn with the same
marker every 30 minutes of quiet; I-3, I-4 and M-2 of the Plan 2 acceptance report.

**After Plan 4 (2026-10-16, Rafal's choice):** five minors of its final review were fixed with tests
— the installer test now fails without the CRLF normalisation (M1), quoted MCP server names follow
the rule of §7 step 3 (M2), the P14 watcher test rescans every second (M3), an unreadable
`config.toml` no longer fails a Codex call (M5), a malformed `HUB_PROCESS_TABLE` gives an empty
table (M6). Accepted risk (M4): the watcher checks its owner by PID only, so a PID that Windows
reuses within the 10-second check keeps an orphan alive until its `Monitor` timeout.

### 13.5 Changes from use (2026-10-23)

Fixes Rafal asked for while using the hub after the Plan 4 acceptance, without a separate plan
(project index: "poprawki zgłaszane przez Rafała w trakcie użytkowania"). Each is applied in place
in this spec and listed here.

| # | Change | From | Sections |
|---|---|---|---|
| U1 | One "wyślij" is enough for a session that waits for a decision or for permission: check 6 no longer blocks `prepare` and no longer asks for a second confirmation. `prepare` reports the wait with the gate text in a `warnings` list, on success and next to any failures, and the hub quotes it; `--confirm-waiting` is accepted and has no effect, so older callers keep working. Decision 3 keeps permission prompts in the session and lets an approved hub message answer a decision gate, as the questionnaire path always did (§6.4). Reason: nearly every draft answers the gate its target stands on (record `r20261021135346-79cc` of 2026-10-21 needed two "wyślij"), so the second confirmation only repeated the first | Rafal's request through the hub on 2026-10-21; variant A chosen on 2026-10-23 in session `notatki-hub-single-wyslij` | §3 (decision 3), §5.2, §6.2, §9.1, §13.1 item 9 |
