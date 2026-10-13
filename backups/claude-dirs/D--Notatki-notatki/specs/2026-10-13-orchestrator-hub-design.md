# Orchestrator hub — design

**Date:** 2026-10-13
**Status:** design approved in conversation (parts 1–5), written spec awaiting review
**Owner:** Rafal Kielbasa
**Origin:** brainstorming sessions `0e06a344` (2026-10-11, voice module), `7e84737d`
(2026-10-12, decisions 1–9, design parts 1–2) and `c0c20a2d` (2026-10-13, decisions 10–13,
design parts 3–5, Firehose review).

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
| 4 | How the hub knows the state | Global hooks write a registry. A gate turn ends with a marker line. Waking moved from `notify_when_idle` to a watcher under `Monitor` when design part 2 was accepted (§5.4) |
| 5 | Who runs the analytical dialog | A read-only fork of the project session (`--resume <id> --fork-session`). Only decisions and the prompt draft go back to the hub |
| 6 | Visibility in v1 | Text in the hub. `PostToolUse` collects "what it is doing" from day one, so the panel (1a) needs no new data |
| 7 | Dialog artefacts | `decisions.md`, `open-questions.md`, `prompt.md` per project in the hub data directory, plus a per-project send journal |
| 8 | Isolation between projects | A global rule in `~/.claude/CLAUDE.md`: project sessions do not message each other on their own initiative; the hub is the only channel. No `deny` rules |
| 9 | How the hub runs | A permanent tab `claude --name hub` for the working day. It reports in its tab and through `PushNotification` when Rafal is away |
| 10 | Hub as a Claude session or as an app with a panel (Firehose model) | The hub stays a Claude session |
| 11 | What to borrow from Firehose | Questionnaire path, answer message format, worktree option for new sessions, evidence checks before sending. Approval cards and Codex statuses become later increments |
| 12 | Shape of the Codex consultation | A thread per element: first call `codex exec`, follow-ups `codex exec resume <id>` |
| 13 | Codex–Claude execution contract | Removed entirely from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`; it was a remnant of coordinating Claude from the Codex desktop app |

## 4. Components

| Component | Location | Role |
|---|---|---|
| Hub session | `claude --name hub` started in `~/.claude/hub/` | Overview of sessions, wake-ups from the watcher, `PushNotification`, starting dialogs and questionnaires, sending approved prompts with `SendMessage`, starting background sessions, Codex consultations |
| Skill `hub` | `~/.claude/skills/hub/`, tracked in git through the allowlist. Pattern: `code-review-master` — Node without dependencies, tests with `node --test` | `SKILL.md` with the hub role and procedures; scripts in `bin/` |
| Hook script | `~/.claude/skills/hub/bin/hub-hook.js`, registered globally in `~/.claude/settings.json` with `async: true` | Handles the events in §5.1 and writes the registry. Works whether or not the hub runs |
| Watcher | `~/.claude/skills/hub/bin/hub-watch.js`, started by the hub through the `Monitor` tool | Prints one line per state transition (§5.3) |
| Hub CLI | `~/.claude/skills/hub/bin/hub.js` | Overview, last message, pre-send check, journal entries, Codex threads, retention cleanup |
| Hub data | `~/.claude/hub/`, outside git | See §4.1 |
| Dialog fork | `claude --resume <id> --fork-session` in the project directory | Talks with Rafal; reads the repository and the session history; writes only into its dialog directory |
| Global rules | `~/.claude/CLAUDE.md` | The gate marker (§5.2) and the isolation rule (decision 8). The Codex–Claude contract section is removed (decision 13) |

### 4.1 Data layout

```
~/.claude/hub/
  registry/<session_id>.json        # state of one session, written only by that session's hooks
  registry/<session_id>.last.md     # full last assistant message of that session
  projects.json                     # project aliases and directories for new sessions
  projects/<project>/
    journal.md                      # what was sent, when, to which session, from which path
    sent/<timestamp>.md             # exact text sent on the direct and questionnaire paths
    dialogs/<date>-<slug>/
      decisions.md                  # decision, rationale, source
      open-questions.md
      prompt.md
    codex/<date>-<slug>/
      thread.md                     # questions, Codex answers verbatim, hub assessment
      meta.json                     # Codex thread id, element, project session id
      answer-<n>.md                 # raw output of each Codex call (-o)
```

`<project>` is the alias from `projects.json` whose directory is a prefix of the session `cwd`.
Without an alias it is the directory name of the repository's main worktree (the parent of
`git rev-parse --path-format=absolute --git-common-dir`), so sessions in worktrees land under
their repository.

## 5. Registry and statuses

### 5.1 Events

Each session writes only its own file `registry/<session_id>.json`. Writes are atomic: a
temporary file in the same directory, then a rename. Two sessions never write the same file.

| Hook (global, `async: true`) | What it writes |
|---|---|
| `UserPromptSubmit` | `status: working`; clears `waitingFor` (Rafal answered in the session) |
| `PostToolUse` | `lastAction`: tool name and a short target — `file_path` for Read/Edit/Write, `description` for Bash/PowerShell, `pattern` for Grep/Glob. Full commands are never written, so secrets do not reach the registry. Clears `waitingFor` of kind `permission` |
| `Notification` with `permission_prompt` | `waitingFor: {kind: "permission", since}` |
| `Stop` | Full `last_assistant_message` into `<session_id>.last.md`, a short summary into the JSON. If the last line carries the gate marker, also `waitingFor: {kind: "decision", text}` |
| `StopFailure` | `problem: {kind: <matcher>, at}` — per the hook docs it fires "when the turn ends due to an API error" with matchers such as `rate_limit`, `overloaded`, `authentication_failed`, `billing_error` |
| `SessionEnd` | `endedAt`, `endReason` |

Every event also refreshes `cwd`, `project` and `updatedAt`. The hook never blocks a session: any
error (missing or corrupt registry, unreadable input) ends it with exit code 0 and no output.

The hub's own session is excluded from the overview (identified by its `cwd` in
`~/.claude/hub/` and the name `hub`). Dialog forks (names starting with `dlg-`) are listed under
their project with the kind `dialog`.

### 5.2 Gate marker

A global rule in `~/.claude/CLAUDE.md`: a turn that ends waiting for Rafal's decision ends with
the line

```
⏸ Czeka na decyzję: <one sentence>
```

The marker is user-facing, so it stays in Polish. When it is missing, the hub judges the last
message itself (state "probably waiting for you" in §5.3).

### 5.3 States shown to Rafal

| State | Source |
|---|---|
| working | `busy` in `claude agents --json`, or a recent `lastAction` |
| waiting for permission | `waitingFor.kind == "permission"`; per the docs the notification fires after about 6 s of waiting |
| waiting for decision | `waitingFor.kind == "decision"`, from the marker |
| probably waiting for you | `Stop` without the marker, and the hub judged the last message to be a question |
| turn ended | `Stop` without the marker. The hub judges the content (result, question, problem) only when it notifies or when Rafal opens the session |
| uncertain since `<time>` | `busy` in `claude agents --json` while `lastAction` is older than 10 minutes |
| problem | `StopFailure`, or the session vanished from `claude agents --json` without `SessionEnd` |
| ended | `SessionEnd` |

For background sessions, `state` and `waitingFor` from `claude agents --json` take precedence.

Silence is not success: the hub never reports that a session finished because of an absence of
events, a timeout, or an `idle` status alone.

### 5.4 Waking the hub

The watcher is a Node script started by the hub through `Monitor` with the maximum timeout
(30 minutes). It watches `registry/` and polls `claude agents --json` about every 2 minutes. It
prints only state transitions:

- a session waits for a decision or for permission;
- a problem;
- a turn ended;
- a new session.

Only transitions, because `Monitor` stops sources that are too chatty. When the monitor expires,
the hub re-arms it and catches up from the registry (events carry timestamps). Cost: one hub
turn about every 30 minutes. `notify_when_idle` from `SendMessage` stays as a fallback: it fires
only when a session finishes a turn, so it misses permission prompts and new sessions.

A woken hub writes in its tab. When Rafal is away from the tab, it uses `PushNotification`.

### 5.5 Reading a result

Three levels:

1. the summary from the registry;
2. the full last message from `<session_id>.last.md`;
3. deeper: the transcript, read by a script tolerant to format changes, or a dialog through a
   fork.

The hub loads content into its own context only when Rafal asks. Otherwise it keeps pointers.

The overview is a table with the columns: project, session, state, since, last action, waiting
for.

## 6. Command loop

One rule holds on every path that sends to a Claude session: **the hub never sends text Rafal
has not seen in its exact wording, and sends it only after his "wyślij"**. The Codex
consultation is the only exception, because Codex only reads.

| Path | When | Where Rafal sees the text before it goes out |
|---|---|---|
| Direct command | A short instruction to an existing session | In the hub tab |
| Questionnaire | The session should collect decisions before working | The request and the composed answers, in the hub tab |
| Dialog through a fork | The result needs thought | `prompt.md` in the editor |
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

### 6.2 Pre-send check

Before every `SendMessage` the hub checks that:

1. the target session is alive under the same `sessionId`;
2. the session's `cwd` and git branch match the journal;
3. the same prompt has not already been sent to this session — on a repeat the hub asks;
4. the prompt has every section of the template;
5. the session is idle.

If the session is busy, the hub asks whether to wait for the end of the turn (then it sends
automatically) or to send now. A message to a busy session arrives "between tool calls", so it
cuts into the current work.

The message is sent unchanged, with one header line naming its origin (path and dialog
directory). The prompt is self-contained, because reading `~/.claude/hub/` from outside the
project directory may raise a permission prompt in the target session.

### 6.3 Questionnaire path

1. Rafal says in the hub: "sesja X: pytania o <temat>, maksymalnie N".
2. The hub shows the request in a fixed wording: read the project, ask at most N questions whose
   answers change the work, recommend an option only for a real reason, do not edit files, end
   with the gate marker. After "wyślij" it goes to the session.
3. The watcher catches the marker; the hub shows the questions.
4. Rafal answers all of them at once.
5. The hub composes the message (Temat, Kontekst, questions with answers, Oczekiwany rezultat),
   shows it, and after "wyślij" sends it, stores the text in `sent/` and writes a journal entry.

### 6.4 Dialog path

1. **Start.** Rafal says "omówmy wynik sesji X". The hub checks that session X is idle, because
   forking a busy session is a hypothesis (probe S6). It creates
   `projects/<project>/dialogs/<date>-<slug>/`.
2. **Launching the fork.** The hub runs
   `claude --bg --resume <id> --fork-session --name dlg-<project>-<slug>` in the project
   directory. Fallback: a ready command to paste into a new tab. The fork may read the repository
   and write only into the dialog directory.
3. **Fork role**, given in its first message or a role file:
   - an analytical partner, read-only;
   - it reads every decision back to Rafal and writes it into `decisions.md` only after his
     confirmation, with rationale and source;
   - unanswered questions go into `open-questions.md`.
4. **Conversation.** Rafal talks to the fork after `claude attach dlg-…`.
5. **Prompt.** The fork writes `prompt.md` from the template and ends the turn with
   `⏸ Czeka na decyzję: prompt gotowy do przeglądu`. The registry catches it and the hub notifies
   Rafal.
6. **Review.** Rafal reviews and edits `prompt.md` in the editor, then says "wyślij" in the hub.
7. **Pre-send check** (§6.2).
8. **Sending** with `SendMessage`.
9. **Closing.** The hub writes the journal entry (date, session, dialog, prompt summary), stops
   the fork with `claude stop` (the conversation and artefacts stay), and shows the session's
   next result when its turn ends.

### 6.5 Other paths

- **Direct command:** steps 7–9 without a dialog and without stopping a fork. The exact text is
  stored in `sent/` and journalled.
- **Target session vanished** (for example VS Code closed): the hub proposes
  `claude --bg --resume <id>` ("continues that session in the background under the same ID",
  per `claude --help`) and sends only after Rafal agrees.
- **New session:** the hub runs `claude --bg --name <project>-<slug>` in the project directory,
  optionally with `-w <name>` for a new git worktree, with the prompt as the first message.
  Permission prompts are answered after `claude attach` (decision 3). A worktree session is
  journalled with its worktree path and branch.
- **Projects:** the project comes from the session `cwd` (§4.1); `projects.json` holds short
  aliases and directories for new sessions.

## 7. Codex consultation

Codex is a consultant invoked from the hub. It only reads and only comments; it never authorises
or authors anything. In v1 it runs only on Rafal's command.

1. Rafal says "odbij od Codexa <element>: <pytanie>". The element is one of: the last result of a
   session (`.last.md`), `prompt.md`, `decisions.md`, the diff of a session's branch, a file in a
   repository.
2. The hub creates `projects/<project>/codex/<date>-<slug>/` and composes the prompt: the reviewer
   role (comments only), Rafal's question, and the element. Files from `~/.claude/hub/` are
   pasted verbatim; repository files and diffs are given as paths and refs, so Codex reads the
   sources itself instead of a summary.
3. The hub runs, in the background so it is not blocked,
   `codex exec -s read-only -C <dir> -o <thread>/answer-<n>.md`, where `<dir>` is the `cwd` of
   the session the element belongs to (a worktree, if the session runs in one), and records the
   Codex thread id in `meta.json` (where the id comes from is probe S9).
4. The hub shows the answer verbatim, next to a table: remark, hub assessment, rationale.
5. "Codex, <pytanie>" is a follow-up in the same thread through `codex exec resume <id>`.
6. A conclusion reaches `decisions.md` or a prompt only after Rafal confirms it.

The hub prompt for Codex carries no instruction about dispatching Claude: with the contract
removed (decision 13), Codex has no rule that makes Claude its executor. Probe S9 verifies that
Codex reads the repository itself.

## 8. Errors and boundaries

### 8.1 Errors

| Situation | How the hub learns | What it does |
|---|---|---|
| `Monitor` expired | One expiry notice per monitor | Re-arms the watcher and catches up from the registry |
| A hook did not write an event | `busy` in `claude agents --json` while `lastAction` is stale | Shows "uncertain since `<time>`" instead of "working" or "finished" |
| No gate marker | `Stop` without the marker | Judges the last message only on notification; a question becomes "probably waiting for you", never "finished" |
| API error in a session | `StopFailure` | State "problem: `<matcher>`" and a notification |
| Session vanished without `SessionEnd` | Missing from `claude agents --json` | State "problem"; proposes `claude --bg --resume <id>` and resumes only with Rafal's consent |
| `SendMessage` not delivered | Tool error, for example the recipient has `crossSessionInbound: refuse`, or the session does not exist | Quotes the error verbatim; `prompt.md` stays; journal entry "nie wysłano"; no retry |
| Several sessions with the same name | The docs allow duplicate names | Sessions are addressed only by `sessionId`; names are for display |
| Codex consultation failed | Exit code, timeout, or an empty `-o` file | Reports "brak drugiej opinii" with the literal error, including an exceeded Codex limit; no retry |
| Dialog fork died | The fork's registry entry | Artefacts in `dialogs/…` stay; the hub proposes a new fork from the same state |
| Hub after `/clear` or restart | — | Rebuilds the overview from the registry, journals and `claude agents --json`; reloads its role through the skill `hub` (probe S8) |

The hub never retries on its own and always quotes the literal error.

### 8.2 Boundaries

| Boundary | Rule |
|---|---|
| Consent | The hub never answers permission prompts or gates, and never treats a session's reply as Rafal's consent. Watcher events are not Rafal's answers ("Events … are not replies from the user", `Monitor` tool description) |
| Sending | Only after "wyślij" and only text Rafal has seen; the Codex consultation is the read-only exception |
| Writing | The hub writes only into `~/.claude/hub/` and its own skill. It changes nothing in project repositories and commits nothing; commits belong to project sessions under each repository's rules |
| Isolation | Decision 8: project sessions do not message each other on their own initiative |
| Secrets | The registry stores paths and descriptions, never full commands. A Codex prompt contains only the element Rafal pointed at |
| Codex | Always `-s read-only`; comments only |
| Network | Everything runs locally; nothing is exposed to the network |
| Retention | The overview shows active sessions and sessions ended within the last 24 hours. Registry files of sessions ended more than 14 days ago are deleted by the hub CLI on hub start. `journal.md`, `sent/`, `dialogs/` and `codex/` are kept indefinitely |

## 9. Testing and probes

### 9.1 Unit tests

Node without dependencies, `node --test`.

| Script | What is tested |
|---|---|
| `hub-hook.js` | Every event in §5.1 produces the expected registry file; writes are atomic; no full command in the registry; with a corrupt or missing registry it exits 0 |
| `hub-watch.js` | Prints only state transitions; never prints "finished" after a long absence of events |
| Overview | The states of §5.3, including "uncertain" and "probably waiting for you" |
| Pre-send check | Each of the five conditions of §6.2, each with a negative case |
| Prompt template and answer message | A missing section blocks sending; **Oczekiwany rezultat** is mandatory |
| Codex thread | `meta.json`, successive `answer-<n>.md`; a timeout and an empty result give "brak drugiej opinii" |
| Retention | Deletes only registry files of ended sessions older than 14 days |

Every test uses a temporary directory as the hub data root and never touches the real
`~/.claude/hub/` (wiki pattern `konfiguracja-z-katalogu-domowego-wchodzi-do-testow`). Hook input
fixtures come from real events recorded in probe S1, stripped of content.

### 9.2 Probes

Probes are the first tasks of the plan and run in a throwaway repository, never in real
projects. A negative result switches to the fallback below. A fallback that changes the scope
goes back to Rafal for a decision.

| # | Question | Criterion | Fallback |
|---|---|---|---|
| S1 | Do hooks fire in a VS Code panel session, including `Notification` `permission_prompt`? Record hook inputs as fixtures | Every event reaches the registry | "Waiting for permission" only for terminal and background sessions |
| S2 | What does `PostToolUse` cost (Node start on Windows)? | The session does not slow down noticeably; hook time measured | Record only Edit/Write/Bash, or drop "what it is doing now" |
| S3 | How reliable is `fs.watch` on Windows, and how long does `claude agents --json` take? | No event lost; time measured | Poll registry modification times every 2 s |
| S4 | Does `SendMessage` trigger `UserPromptSubmit` in the recipient, and does it return an error on `hold` or `refuse`? | Both behaviours known | The hub sets "working" itself after sending; non-delivery is detected by time |
| S5 | Does a `Monitor` expiry notice wake an idle hub tab? | The watcher re-arms itself | A reminder in the hub tab |
| S6 | Does `--bg` accept `--fork-session` and a start prompt? How does a fork of a busy session behave? | The fork starts in the background | A ready command to paste; forks only of idle sessions |
| S7 | How to express, on Windows, a write rule limited to `dialogs/…`? | A write outside the directory is refused | Default mode: Rafal approves each fork write himself |
| S8 | Does the hub role survive `/clear` through `--append-system-prompt-file`? | Role present after `/clear` | Invoke the skill `hub` again |
| S9 | With the contract removed, does Codex read the repository itself? Where does the thread id for `resume` come from? | An answer without starting `claude`; `resume <id>` continues the thread | `resume --last` with parallel consultations forbidden |
| S10 | Does `claude --bg -w <name>` work as a combination? | A background session in a new worktree | The hub creates the worktree with `git worktree add` and starts the session in it |
| S11 | How reliably do models emit the gate marker? | Marker present at 5 of 5 gates in a trial session | The hub always judges the last message on notification |

### 9.3 Acceptance test

With Rafal, on two trial projects:

1. the overview with both sessions and their states;
2. a notification after a turn ending with the marker;
3. the "waiting for permission" state;
4. the questionnaire path end to end;
5. a dialog through a fork: `prompt.md`, "wyślij", journal entry;
6. a Codex consultation with one follow-up;
7. a hub restart and state recovery.

Then one real project, chosen by Rafal, as a pilot.

## 10. Rollout order

1. Remove the Codex–Claude contract from `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md`, and the
   paused Codex automation `powiadomienie-o-pracy-claude-nad-planem-i-agentem` (decision 13).
2. Probes S1–S5, because they block the core.
3. Core: hooks, registry, watcher, overview, sending, journal, global rules (marker, isolation).
4. Probes S6–S8 and the dialog path.
5. Probe S9 and the Codex consultation.
6. Probe S10 and new sessions.
7. Acceptance test.

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

## 13. Additions made while writing this spec

Not discussed explicitly in the conversation; listed for review:

1. `sent/<timestamp>.md` keeps the exact text of direct and questionnaire messages, which have no
   `prompt.md`.
2. The hub's own session is excluded from the overview; dialog forks are listed under their
   project with the kind `dialog`.
3. `<project>` for worktree sessions is derived from the repository's main worktree (§4.1).
4. "Uncertain" uses a threshold of 10 minutes without a new `lastAction` while `busy`.
5. Template headings stay in Polish, because `prompt.md` is user-facing.
