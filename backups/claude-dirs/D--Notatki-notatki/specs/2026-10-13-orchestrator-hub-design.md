# Orchestrator hub — design

**Date:** 2026-10-13
**Status:** approved 2026-10-13, including all items of §13; ready for plan 1 (§10).
**Owner:** Rafal Kielbasa
**Origin:** brainstorming sessions `0e06a344` (2026-10-11, voice module), `7e84737d`
(2026-10-12, decisions 1–9, design parts 1–2) and `c0c20a2d` (2026-10-13, decisions 10–13,
design parts 3–5, Firehose review, Codex review of this spec).

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

## 4. Components

| Component | Location | Role |
|---|---|---|
| Hub session | `claude --name hub` started in `~/.claude/hub/` | Overview of sessions, wake-ups from the watcher, `PushNotification`, starting dialogs and questionnaires, sending approved prompts with `SendMessage`, starting background sessions, Codex consultations |
| Skill `hub` | `~/.claude/skills/hub/`, tracked in git through the allowlist. Pattern: `code-review-master` — Node without dependencies, tests with `node --test` | `SKILL.md` with the hub role and procedures; scripts in `bin/`. The hub never modifies its own skill at runtime; changes to the skill are separate, explicitly requested work |
| Hook script | `~/.claude/skills/hub/bin/hub-hook.js`, registered globally in `~/.claude/settings.json` with `async: true` | Appends one event per hook call to the session's event log (§5.1). Works whether or not the hub runs |
| Watcher | `~/.claude/skills/hub/bin/hub-watch.js`, started by the hub through the `Monitor` tool | Prints one line per state transition (§5.5) |
| Hub CLI | `~/.claude/skills/hub/bin/hub.js` | Derived state and overview, last message, session registration, pre-send check, send journal, Codex threads, retention cleanup |
| Hub data | `~/.claude/hub/`, outside git | See §4.1 |
| Dialog fork | `claude --resume <id> --fork-session` in the project directory | Talks with Rafal; reads the repository and the session history; writes only into its dialog directory |
| Global rules | `~/.claude/CLAUDE.md` | The gate marker (§5.3) and the isolation rule (decision 8). The Codex–Claude contract section is removed (decision 13) |

### 4.1 Data layout

```
~/.claude/hub/
  registry/<session_id>.events.jsonl  # append-only event log, written only by that session's hooks
  registry/<session_id>.last.md       # full last assistant message of that session
  registry/polls.jsonl                # results of `claude agents --json` polls, including errors
  hub-sessions.json                   # session ids the hub registered: itself, dialog forks, background sessions
  projects.json                       # project aliases and directories for new sessions
  projects/<project>/
    journal.md                        # send records: pending, sent, not-sent, delivery-unknown
    sent/<timestamp>.md               # exact text of every message sent to a session
    dialogs/<date>-<slug>/
      decisions.md                    # decision, rationale, source
      open-questions.md
      prompt.md
    codex/<date>-<slug>/
      thread.md                       # questions, Codex answers verbatim, hub assessment
      meta.json                       # Codex thread id, element, project session id, cwd
      answer-<n>.md                   # raw output of each Codex call (-o)
```

`hub-sessions.json` is written only by the hub CLI. The hub registers its own `sessionId` when it
starts, and the `sessionId` of every dialog fork and background session it launches
(`claude --bg` prints the id).

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
append write: a random event id, the event name, the hook start timestamp, `session_id`, `cwd`
and the fields below. Hooks never read and rewrite a state file, so concurrent asynchronous hooks
of one session cannot lose each other's updates. `<session_id>.last.md` is written to a temporary
file with a unique name in the same directory and then renamed.

| Hook (global, `async: true`) | What the event records |
|---|---|
| `UserPromptSubmit` | A prompt was submitted; a SHA-256 of the prompt text, never the text |
| `PostToolUse` | Tool name, a short target — `file_path` for Read/Edit/Write, `description` for Bash/PowerShell, `pattern` for Grep/Glob — and the tool call id if the payload has one (probe S1). Full commands are never recorded, so secrets do not reach the registry |
| `Notification` with `permission_prompt` | A permission prompt is pending, with the tool call id if the payload has one (probe S1) |
| `Stop` | A short summary of `last_assistant_message`, the marker text if the last line carries the gate marker; the full message goes to `<session_id>.last.md` |
| `StopFailure` | The matcher — per the hook docs it fires "when the turn ends due to an API error", with matchers such as `rate_limit`, `overloaded`, `authentication_failed`, `billing_error` |
| `SessionEnd` | The end reason |

The hook never blocks a session: any error (missing directory, unwritable file, unreadable input)
ends it with exit code 0 and no output.

The hub's own session is excluded from the overview by its `sessionId` in `hub-sessions.json`.
Dialog forks registered there are listed under their project with the kind `dialog`. Session
names from `claude agents --json` are used only for display.

### 5.2 Derived state

The hub CLI and the watcher derive each session's state from its events, ordered by hook start
timestamp and then by line order, plus the polls in `polls.jsonl`.

| Event | Sets | Clears |
|---|---|---|
| `UserPromptSubmit` | phase `working` | `waiting` (any kind), `problem` |
| `PostToolUse` | phase `working`, `lastAction` | `waiting: permission`, only if this event is later than the permission event and, when both carry a tool call id, only for the same id |
| `Notification` `permission_prompt` | `waiting: permission` with `since` | — |
| `Stop` | phase `turn-ended`; `waiting: decision` with the marker text when the marker is present | `waiting: permission` |
| `StopFailure` | `problem: <matcher>`, phase `turn-ended` | — |
| `SessionEnd` | phase `ended` | `waiting` |

A `UserPromptSubmit` caused by a hub message clears `waiting: decision` like any other prompt. If
the gate is still open, the session's next `Stop` with the marker restores it. The hub never sends
to a waiting session without an explicit warning (§6.2, check 6).

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

For background sessions, `state` and `waitingFor` from `claude agents --json` take precedence over
rows 3–8. When the last poll failed, the overview shows the poll error next to the table.

Silence is not success: the hub never reports that a session finished because of an absence of
events, a timeout, or an `idle` status alone.

### 5.5 Waking the hub

The watcher is a Node script started by the hub through `Monitor` with the maximum timeout
(30 minutes). It watches `registry/` with `fs.watch` and, about every 2 minutes, polls
`claude agents --json` and rescans all event logs, so a missed file notification is reconciled at
the next poll regardless of `fs.watch` reliability. It prints only state transitions:

- a session waits for a decision or for permission;
- a problem;
- a turn ended;
- a new session.

Only transitions, because `Monitor` stops sources that are too chatty. When the monitor expires,
the hub re-arms it and catches up from the event logs (events carry timestamps). Cost: one hub
turn about every 30 minutes. `notify_when_idle` from `SendMessage` stays as a fallback: it fires
only when a session finishes a turn, so it misses permission prompts and new sessions.

A woken hub writes in its tab. When Rafal is away from the tab, it uses `PushNotification`.

### 5.6 Reading a result

Three levels:

1. the summary from the event log;
2. the full last message from `<session_id>.last.md`;
3. deeper: the transcript, read by a script tolerant to format changes, or a dialog through a
   fork.

The hub loads content into its own context only when Rafal asks. Otherwise it keeps pointers.

The overview is a table with the columns: project, session, state, since, last action, waiting
for.

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

1. the target session is alive under the baseline `sessionId`;
2. `cwd`, repository root and branch (or SHA) match the baseline;
3. no send record with the same text hash exists for this session in state `pending`, `sent` or
   `delivery-unknown` — otherwise the hub asks;
4. the text has every section of the template and its hash matches the approved hash;
5. the session is idle;
6. the session is not waiting for permission or for a decision — otherwise the hub warns that
   gates are answered in the session itself (decision 3) and sends only after an explicit
   confirmation.

If the session is busy, the hub asks whether to wait for the end of the turn or to send now. A
message to a busy session arrives "between tool calls", so it cuts into the current work. On a
delayed send the hub runs all six checks again right before sending; any change blocks the send
and asks Rafal for a new decision.

### 6.3 Send record

The send is recorded durably around `SendMessage`:

1. before sending: `sent/<timestamp>.md` with the exact text, and a journal record `pending` with
   the session, path, text hash and baseline;
2. the tool succeeded: the record becomes `sent`;
3. the tool returned an error: the record becomes `not-sent` with the literal error;
4. the outcome is unknown (for example the hub was interrupted): the record stays `pending` and is
   shown as `delivery-unknown`. Time alone never turns it into `sent` or `not-sent`.

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

1. **Start.** Rafal says "omówmy wynik sesji X". The hub checks that session X is idle, because
   forking a busy session is a hypothesis (probe S6). It creates
   `projects/<project>/dialogs/<date>-<slug>/`.
2. **Launching the fork.** The hub launches a background fork of session X in the project
   directory, built from `claude --bg --resume <id> --fork-session --name dlg-<project>-<slug>`;
   the final command, including how the start prompt and the role are passed, is fixed by probe
   S6. Fallback: a ready command to paste into a new tab. The hub registers the fork's
   `sessionId` in `hub-sessions.json`. The fork runs in the mode "repository read-only, dialog
   directory writable"; the mechanism that enforces it is fixed by probe S7.
3. **Fork role**, given in its start prompt or a role file (probes S6, S8):
   - an analytical partner that changes nothing in the repository;
   - it reads every decision back to Rafal and writes it into `decisions.md` only after his
     confirmation, with rationale and source;
   - unanswered questions go into `open-questions.md`.
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
  registers the printed `sessionId`. Permission prompts are answered after `claude attach <id>`
  (decision 3). A worktree session is journalled with its worktree path and branch.
- **Projects:** the project comes from the session `cwd` (§4.1); `projects.json` holds short
  aliases and directories for new sessions.

## 7. Codex consultation

Codex is a consultant invoked from the hub. It only reads and only comments; it never authorises
or authors anything. In v1 it runs only on Rafal's command.

1. Rafal says "odbij od Codexa <element>: <pytanie>". The element is one of: the last result of a
   session (`.last.md`), `prompt.md`, `decisions.md`, the diff of a session's branch, a file in a
   repository.
2. The hub creates `projects/<project>/codex/<date>-<slug>/` and composes the prompt:
   - the reviewer role: comments only, changes nothing, launches no other agent;
   - Rafal's question;
   - the element. Files from `~/.claude/hub/` are pasted verbatim; repository files and diffs are
     given as paths and refs, so Codex reads the sources itself instead of a summary.

   The hub never pastes or points at files matching `.env*`, `*.pem`, `*.key`, `*credentials*`,
   `*secret*`, `auth.json` or `secrets.yaml`; for such an element it asks Rafal instead.
3. The hub runs, in the background so it is not blocked:
   `codex exec -s read-only -C <dir> --json -o <thread>/answer-<n>.md -` with the prompt on stdin
   as UTF-8. `<dir>` is the `cwd` of the session the element belongs to (a worktree, if the
   session runs in one). The Codex thread id comes from the `thread.started` event of the
   `--json` stream (checked on 2026-10-13 in the review of this spec) and goes into `meta.json`.
4. The hub shows the answer verbatim, next to a table: remark, hub assessment, rationale.
5. "Codex, <pytanie>" is a follow-up in the same thread:
   `codex exec resume <id> -c sandbox_mode="read-only" --json -o <thread>/answer-<n>.md -`, run
   with `<dir>` as the process working directory. `codex exec resume --help` lists neither `-s`
   nor `-C` (checked), so probe S9 verifies the effective sandbox and working directory of a
   follow-up. Fallback: a new `codex exec -s read-only -C <dir>` call with `thread.md` as context.
6. A conclusion reaches `decisions.md` or a prompt only after Rafal confirms it.

On 2026-10-13 Codex reviewed this spec under such a reviewer instruction, with the contract still
in place: it ran only read commands (`rg`, `--help`) and launched no Claude session.

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
| `SendMessage` failed | Tool error, for example the recipient has `crossSessionInbound: refuse`, or the session does not exist | Record `not-sent` with the literal error; `prompt.md` stays; no retry |
| Delivery outcome unknown | The send record stayed `pending` | Shown as `delivery-unknown`; check 3 of §6.2 asks before any resend |
| Several sessions with the same name | The docs allow duplicate names | Sessions are addressed only by `sessionId`; names are for display |
| Codex consultation failed | Exit code, timeout, or an empty `-o` file | Reports "brak drugiej opinii" with the literal error, including an exceeded Codex limit; no retry |
| Dialog fork died | The fork's event log | Artefacts in `dialogs/…` stay; the hub proposes a new fork from the same state |
| Hub after `/clear` or restart | — | Rebuilds the overview from the event logs, journals and `claude agents --json`; reloads its role through the skill `hub` (probe S8) |

The hub never retries on its own and always quotes the literal error.

### 8.2 Boundaries

| Boundary | Rule |
|---|---|
| Consent | The hub never answers permission prompts or gates, and never treats a session's reply as Rafal's consent. Watcher events are not Rafal's answers ("Events … are not replies from the user", `Monitor` tool description) |
| Sending | Only after "wyślij" and only text Rafal has seen, header included; the Codex consultation is the read-only exception |
| Writing | At runtime the hub writes only into `~/.claude/hub/`. It changes nothing in project repositories and commits nothing; commits belong to project sessions under each repository's rules. It never modifies its own skill |
| Isolation | Decision 8: project sessions do not message each other on their own initiative |
| Secrets | Event logs store paths, descriptions and prompt hashes, never full commands or prompt text. `.last.md` is a local copy of what the session transcripts in `~/.claude/projects/` already hold. Codex consultations follow the denylist of §7 and contain only the element Rafal pointed at |
| Codex | First call always `-s read-only`; follow-ups carry `-c sandbox_mode="read-only"` until probe S9 confirms the effective sandbox. Comments only |
| Network | No component listens on a network interface. Registry, journals, dialogs and Codex threads stay on this machine; Claude Code and Codex talk to their model services as they always do |
| Retention | The overview shows active sessions and sessions ended within the last 24 hours. The event log and `.last.md` of a session ended more than 14 days ago are deleted together by the hub CLI on hub start. `polls.jsonl` is truncated to the last 14 days. `journal.md`, `sent/`, `dialogs/` and `codex/` are kept indefinitely |

## 9. Testing and probes

### 9.1 Unit tests

Node without dependencies, `node --test`.

| Script | What is tested |
|---|---|
| `hub-hook.js` | Every event of §5.1 appends one well-formed line; no full command and no prompt text in the log; parallel hook processes of one session lose no event; `.last.md` temp files have unique names; with a missing or unwritable directory it exits 0 |
| Derived state | Every transition of §5.2, including out-of-order events (ordering by timestamp), a late `PostToolUse` that must not clear a newer permission wait, and the priority order of §5.4 |
| Polls | A failed poll never makes a session vanished; vanishing needs two consecutive successful polls |
| `hub-watch.js` | Prints only state transitions; never prints "finished" after a long absence of events; reconciles a missed file notification at the next rescan |
| Pre-send check | Each of the six checks of §6.2 with a negative case; a first send without journal history; detached HEAD; a delayed send re-runs all checks and blocks on a changed hash or baseline |
| Send record | `pending` → `sent`, `pending` → `not-sent`, `pending` left behind → `delivery-unknown`; a resend of the same hash asks |
| Prompt template and answer message | A missing section blocks sending; **Oczekiwany rezultat** is mandatory; the header line is part of the approved hash |
| Project matching | `C:\repo` vs `C:\repo-old`, case differences, the longest root wins, a duplicate root is reported |
| Codex thread | `meta.json` with the thread id from `thread.started`, successive `answer-<n>.md`, stdin transport with Polish diacritics and a large element, the denylist, a timeout and an empty result give "brak drugiej opinii" |
| Retention | Deletes the event log and `.last.md` of ended sessions older than 14 days together, and nothing else |

Every test uses a temporary directory as the hub data root and never touches the real
`~/.claude/hub/` (wiki pattern `konfiguracja-z-katalogu-domowego-wchodzi-do-testow`). Hook input
fixtures come from real events recorded in probe S1, stripped of content.

### 9.2 Probes

Probes run in a throwaway repository, never in real projects. A negative result switches to the
fallback below. A fallback that changes the scope goes back to Rafal for a decision.

| # | Question | Criterion | Fallback |
|---|---|---|---|
| S1 | Do hooks fire in a VS Code panel session, including `Notification` `permission_prompt`? Which identification fields do the payloads carry (session name, tool call id in `PostToolUse` and `Notification`, prompt in `UserPromptSubmit`)? Record inputs as fixtures | Every event reaches the event log; the field inventory is written down | "Waiting for permission" only for terminal and background sessions; permission waits cleared without tool call ids |
| S2 | What does `PostToolUse` cost (Node start on Windows)? | 50 tool calls with hooks against 50 without, in one trial session: hook process time p95 below 500 ms, and median tool-call latency up by less than 100 ms against the baseline | Record only Edit/Write/Bash, or drop "what it is doing now" |
| S3 | How reliable is `fs.watch` on Windows, and how long does `claude agents --json` take? | A burst of 100 events in one second from 5 parallel writers, `.last.md` renames, a watcher restart mid-burst and a forced catch-up: events received after catch-up equal events generated; poll time measured | Polling event logs by modification time every 2 s. The periodic rescan of §5.5 stays in every case |
| S4 | Does `SendMessage` trigger `UserPromptSubmit` in the recipient, and is a hub message distinguishable in its payload? Does `SendMessage` return an error on `hold` or `refuse`? | All three behaviours written down | The hub sets "working" itself after sending; an unconfirmed delivery stays `delivery-unknown` and is never inferred from time |
| S5 | Does a `Monitor` expiry notice wake an idle hub tab? | The expiry woke the idle hub, a new monitor ran within one minute, and the catch-up showed a transition generated during the gap | A reminder in the hub tab that the watcher is down, until Rafal re-arms it |
| S6 | Fork launch: does `--bg` combine with `--resume <id> --fork-session`? How are a start prompt and the role passed? Can the fork reach the dialog directory? How does a fork of a busy session behave? | Each of the four written down; the final command of §6.5 step 2 fixed | A ready command to paste; forks only of idle sessions |
| S7 | How to enforce, on Windows, "repository read-only, dialog directory writable" for the fork? | A write outside the dialog directory is refused, a write inside it succeeds | Default mode: Rafal approves each fork write himself |
| S8 | Does the hub role survive `/clear` through `--append-system-prompt-file`? | Role present after `/clear` | Invoke the skill `hub` again |
| S9 | Does a Codex follow-up with `codex exec resume <id> -c sandbox_mode="read-only"` keep the read-only sandbox and `<dir>` as working directory? With the contract removed, does Codex read the repository itself and launch no agent? | A write attempt in the follow-up is refused; the working directory is `<dir>`; the `--json` stream shows no agent launch | A new `codex exec -s read-only -C <dir>` call per follow-up, with `thread.md` as context |
| S10 | Does `claude --bg -w <name>` work as a combination? | A background session in a new worktree | The hub creates the worktree with `git worktree add` and starts the session in it |
| S11 | Smoke test of the gate marker | The marker appears at 5 of 5 gates of different kinds (question, design section, spec review), one of them after a compaction | The marker stays an auxiliary signal; the hub always judges the last message on notification |

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
| Plan 1: contract removal and probes | Remove the Codex–Claude contract from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, and the paused Codex automation `powiadomienie-o-pracy-claude-nad-planem-i-agentem` (decision 13). Run probes S1–S11 in a throwaway repository; none needs a working hub. Record each result and the chosen fallback in `.claude/specs/2026-10-13-orchestrator-hub-probes.md` | After this spec is approved |
| Plan 2: core | Hooks, event logs, derived state, watcher, overview, sending with send records, global rules (marker, isolation), the questionnaire and direct command paths | After the results of S1–S5 (and S11 for the marker) |
| Plan 3: dialog, Codex, new sessions | Dialog path through a fork, Codex consultation, new sessions with the worktree option, the acceptance test of §9.3 | After the results of S6–S10 |

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

## 13. Approved in the spec review

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
11. The origin header line is part of the approved text (§6, §6.1).
12. The fork mode is named "repository read-only, dialog directory writable"; the fork command
    and the enforcement mechanism are fixed by probes S6 and S7 (§6.5).
13. The Codex prompt states the reviewer role (comments only, no changes, no other agents); the
    prompt goes on stdin; follow-ups carry `-c sandbox_mode="read-only"` (§7).
14. A denylist of secret-bearing file names for Codex consultations (§7).
15. The hub never modifies its own skill at runtime (§4, §8.2).
16. The network boundary is restated as "no listening interface; model traffic as usual" (§8.2).
17. Retention deletes the event log and `.last.md` together; `polls.jsonl` is truncated (§8.2).
18. Measurable probe criteria for S2, S3, S5, S9 and S11, with the thresholds stated in §9.2.
