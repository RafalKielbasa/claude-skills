# Hub voice — design

**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Date:** 2026-10-18
**Amended:** 2026-10-21, §17–§20: the decisions after Rafal's first tests, rejoining a conversation,
starting a conversation from the hub, and Plan 3
**Sources:** brainstorming notes [2026-10-16-hub-voice-notes.md](2026-10-16-hub-voice-notes.md)
(every decision below with its date and source), hub spec
[2026-10-13-hub-core-design.md](2026-10-13-hub-core-design.md) (cited as "hub spec §n").

## 1. Intent

Rafal, 2026-10-11: „Dużo łatwiej jest mi poznawać te pomysły i analizować je, gdy rozmawiamy na
ich temat, a nie gdy czytam dokumentację.” Voice is for the places „w których musimy się dogadać”:
brainstorming questions, spec and plan reviews, decisions whose variants differ by a trade-off.
The hub spec (§1, loop step 4) already counts a voice conversation as one form of the analytical
dialog; this part builds it.

`/talk`, typed in any Claude Code session X, opens a browser tab in which Rafal talks in Polish,
in real time and with interruptions, to a voice agent. The agent is only the mouth: every question
about the project goes to a fork of session X, which knows X's history and reads the repository.
Decisions are read back aloud and recorded only after Rafal's "tak". When the conversation ends,
session X continues on the confirmed decisions.

## 2. Goals, non-goals, anti-goals

**Goals** (the success picture of 2026-10-14):

- Rafal speaks Polish and hears an answer that knows session X's context.
- Every decision is read back aloud and recorded only after Rafal confirms it.
- The conversation leaves files Rafal reviews as text: `decisions.md`, `open-questions.md`,
  `prompt.md` when the conversation ends in a work order, and a transcript.
- After the conversation, session X proceeds at once on the confirmed decisions.
- A break, a closed tab or the duration limit of a call does not end the conversation; Rafal
  rejoins it from the browser (§18, added 2026-10-21).
- The hub starts a voice conversation about another session, and its result reaches that session
  only through the hub's send path (§19, added 2026-10-21).

**Non-goals of this spec** (later or elsewhere):

- A voice conversation about a project with no live session to fork (§19.5).
- A phone as the voice device.
- The hub panel and any network exception other than the voice bridge (§6).
- Sending messages to other sessions by voice; "wyślij" stays in text in the hub.

**Anti-goals** (a failure even if everything technically works):

- A decision lands in `decisions.md` that Rafal did not confirm, or with a wording whose meaning
  differs from what he heard.
- Session X acts on a work order Rafal did not hear read back and confirm.
- Anything irreversible or outward (push, tickets, GCP, a new dependency, a message to another
  session) happens on a voice decision alone.
- The fork writes into the repository.
- Any web page open in the browser can drive the bridge or the fork.
- The ElevenLabs API key reaches the browser.
- Spoken answers are read-out Markdown (tables, `file:line` lists, code), useless by ear.

## 3. Constraints

- The hub spec's boundaries (§8.2) hold, except the Network row, amended for the voice bridge only
  (§6 here).
- The fork's boundary is enforced by Claude Code, not by the `auto` classifier: restricted mode,
  five file tools, no MCP, `default` permission mode, writes allowed only in a dialog directory
  outside `~/.claude` (§4, §8; decision of 2026-10-20 after the probes).
- ElevenLabs Starter plan (since 2026-10-19; the probes used 26.88 minutes); paid use beyond the
  plan's minutes is a separate question to Rafal.
- `ELEVENLABS_API_KEY` is created and set by Rafal in his user environment; only the bridge reads
  it. Claude never creates or prints keys.
- Windows 11; Node as the hub skill uses it; code, comments and configuration in English;
  everything Rafal reads or hears in Polish.
- The command is `/talk`: Claude Code has a built-in `/voice` (dictation).
- What Rafal says and what the fork answers leaves the machine, to ElevenLabs and to the agent's
  LLM provider. This is accepted only within the limits of §6: projects on the allowlist, secret
  files unreadable for the fork, no retention at ElevenLabs.
- No new runtime dependency other than the vendored ElevenLabs browser client (§4).

## 4. Components

| Component | Location | Role |
|---|---|---|
| Skill `talk` | `~/.claude/skills/talk/` (tracked like the skill `hub`) | `SKILL.md`: the procedure session X follows on `/talk` and after the conversation (§5); a configuration file with the project allowlist (§6) |
| Browser client | a vendored copy of a pinned `@elevenlabs/client` version in the skill (for example `web/vendor/`): the package's self-contained `dist/lib.iife.js` (global `ElevenLabsClient`, classic script tag) and the `libsamplerate` worklet it would otherwise fetch from a CDN (passed as `libsampleratePath`), each with version and SHA-256 recorded next to it; probe report „Vendored client” | The page's connection to the agent; never loaded from a CDN at runtime |
| Bridge | a Node script in the skill, e.g. `bin/talk-bridge.mjs` | Serves the page on `127.0.0.1`, mints the ElevenLabs conversation token, runs the voice fork, answers the `ask_claude` tool, watches the dialog directory, writes the transcript, ends the conversation (§5, §6) |
| Page | served by the bridge | Connects to the ElevenLabs agent with the token; shows the live transcript, the decision being read back, the recorded decisions, the fork's state ("Claude myśli…"), and an "Zakończ rozmowę" button |
| ElevenLabs agent | an agent in Rafal's ElevenLabs account; its configuration kept as a file in the skill | The voice: Polish speech recognition and voice, conversation glue, the client tool `ask_claude` (§7) |
| Voice fork | a restricted `claude -p --resume <X> --fork-session` with `stream-json` input and output, one process per conversation (§8) | The interlocutor: answers, reads decisions back through the agent, writes the dialog files (§8) |
| Dialog directory | `C:\Users\rafal\hub-data\projects\<project>\dialogs\<date>-<slug>\`, the hub's layout (hub spec §4.1) but outside `~/.claude`, where Claude Code refuses a fork's write as a sensitive file; this amends hub spec §4.1 for voice dialogs only. The `<project>` segment is the hub project key without leading dots: the hub's own key `.claude` gives `claude`, because Claude Code refuses a write under any directory named `.claude` (§17) | `context/` (git snapshot), `fork-settings.json`, `decisions.md`, `open-questions.md`, `prompt.md`, plus `transcript.md`, and while the dialog lives, the file that lets `/talk` and the hub find it (§18.5) |

## 5. Flow

### 5.1 Start

1. Rafal types `/talk` in session X (optionally with a subject). At gates where Rafal and Claude
   must agree, Claude may propose this in one sentence of the question section (§9).
2. The skill checks `ELEVENLABS_API_KEY`; without it, it tells Rafal in Polish what to set and stops.
3. It matches session X's project as the hub does (hub spec §4.1). A project outside the allowlist
   (§6) stops the start with one Polish sentence naming the project and the configuration file.
4. It prepares the dialog directory as the written dialog does: the git snapshot into `context/`
   and the voice fork's `fork-settings.json` (§8).
5. It starts the bridge as a background task of session X, so that X is woken when the bridge exits;
   the skill body passes session X's id as `${CLAUDE_SESSION_ID}`, which Claude Code substitutes
   before the model reads it (probe report „End and wake-up” (a), (b)).
   The bridge picks a port on `127.0.0.1`, generates the conversation token, starts the voice fork
   (§8) and opens the page URL, carrying the token, in the default browser.

### 5.2 Conversation

1. The page asks the bridge for an ElevenLabs conversation token (the API key stays on the bridge)
   and starts the session with the agent.
2. Rafal talks. Small talk, "powtórz", "nie dosłyszałem" are handled by the agent; every question
   or statement about the project goes to the fork through `ask_claude` (§7).
3. While the fork works, the agent fills the wait (a short sentence or the tool sound) and Rafal
   may interrupt at any time. An interruption does not kill the fork's turn; the bridge serialises
   messages to the fork.
4. The fork's answer comes back as speakable Polish text; the agent says it.

### 5.3 Decisions

1. When something is to be decided, the fork formulates the decision in one or two sentences and
   returns it marked as a decision to read back. The agent reads that text verbatim; the page shows
   the same text on screen at the same time.
2. Rafal's reply goes to the fork as his transcribed words, not as the agent's paraphrase. Only an
   explicit confirmation ("tak" or equivalent) of that read-back makes the fork write the decision
   into `decisions.md` with its rationale and source; a correction makes it read back the corrected
   wording.
3. A work order (what session X should do next, and the expected result that decides whether X
   starts work or stops, hub spec §6.1) is a decision like any other: read back and confirmed during
   the conversation.
4. Questions left without an answer go into `open-questions.md`.
5. The bridge watches the dialog directory and the page shows recorded decisions as they appear.

### 5.4 End

1. The conversation ends with the page's "Zakończ rozmowę" button, the agent's end of the call, or
   the page disappearing (tab closed: no heartbeat for a grace period). Amended 2026-10-21 (§18.3):
   a hang-up, a closed tab and the duration limit end only the current call. The dialog ends on
   the button, on Rafal's spoken end marked by the agent, at the pause limit, at the first-call
   deadline, or when the fork exits. Steps 2–4 run once, at the end of the dialog. The deletion of
   step 3 and the transcript also run at the end of every call (§18.4).
2. The bridge sends the fork a final message: if a work order was confirmed (§5.3 step 3), write
   `prompt.md` with the hub's template sections (hub spec §6.1: **Cel**, **Kontekst**, **Decyzje z
   uzasadnieniem**, **Ograniczenia**, **Oczekiwany rezultat**), built only from the confirmed
   decisions and the confirmed order; otherwise write none, also when the conversation ended by a
   closed tab. It waits for that turn, closes the fork's input and lets the process exit.
3. The bridge writes `transcript.md` (who said what, local times), then deletes the conversation at
   ElevenLabs (`DELETE /v1/convai/conversations/{conversation_id}`); a failed deletion is reported,
   not retried silently.
4. It prints a closing report on standard output: the dialog directory, the full contents of
   `decisions.md`, `open-questions.md` and `prompt.md` (or that it was not written), and the result
   of the deletion. Then it exits.

### 5.5 Session X after the conversation

Session X is woken by the end of the background task and reads the closing report from the task
output (not from the files: reading a directory outside the project from a project session may
raise a permission prompt, hub spec §6.1). It shows Rafal the recorded decisions as a short Polish table and proceeds
at once: on `prompt.md` if there is one, otherwise on the decisions where it was before `/talk`.
Push, tickets, GCP, a new dependency and anything else outward still wait for Rafal's word in text,
under the usual rules of the session's repository.

## 6. Network and data exception (amends hub spec §8.2, row Network)

Hub spec §8.2 keeps dialogs on the machine and lets no component listen on a network interface.
A voice conversation breaks both, so it is limited as follows.

**What may leave the machine.** What Rafal says and what the fork answers goes to ElevenLabs and to
the agent's LLM provider, and only:

- in projects on the allowlist in the skill's configuration file, by hub project key (hub spec
  §4.2). Initial list: `notatki`, and the key the hub matches for sessions in the hub skill's
  repository (`~/.claude`), checked when the skill is built. Rafal adds other projects himself;
  company repositories are not on the list;
- with secret files unreadable for the fork (§8);
- with no retention at ElevenLabs: the agent's `retention_days` is 0 and the bridge deletes each
  conversation at its end (§5.4). ElevenLabs' Zero Retention Mode is for select enterprise
  customers only. What the agent's LLM provider retains behind ElevenLabs is not verified.

**Listening.** The voice bridge is the only component allowed to listen on a network interface,
under these rules:

- it binds `127.0.0.1` only;
- it lives only for the duration of one conversation; since 2026-10-21, one dialog: its calls and
  the pauses between them, each pause at most the pause limit (§18.9);
- every request must carry the conversation's random token (from the page URL); requests without
  it, or with a `Host` header other than the bridge's own `127.0.0.1:<port>` or `localhost:<port>`,
  are refused;
- the hub panel gets no exception from this rule.

A phone would need a different exception; that is a separate decision for later.

## 7. ElevenLabs agent

- **Voice side's LLM:** Claude Haiku 5.5, Rafal's choice after the probe „Haiku and Sonnet”
  (2026-10-19): both models read decisions back verbatim, the wait comes from the fork, Haiku costs
  less.
- **Language and voice:** `language: pl`, recognition `scribe_realtime`, voice model
  `eleven_v4_turbo` with a Polish-capable voice; English technical terms are said as English.
- **Its instructions** (the agent's system prompt, in the configuration file): it is only the
  mouth; it never answers project questions itself and never invents project facts; it forwards
  them with `ask_claude`; it reads text marked as a decision word for word; it keeps its own
  sentences short; it never confirms anything on Rafal's behalf; it addresses Rafal as „ty”; it
  never says it is passing something to Claude without calling `ask_claude` (both added after the
  Polish probe).
- **Turns and hang-up:** `turn_timeout` 20 s; the built-in `end_call` tool and
  `silence_end_call_timeout` 30 s, so the agent ends the call on „Kończymy” or silence instead of
  running to the 600 s maximum (probe report „Haiku and Sonnet”, run A). The maximum
  (`max_duration_seconds`) is 1800 s since 2026-10-21 (§17). Since §18, a hang-up ends only the
  call, and the agent marks Rafal's spoken end with the client tool `end_conversation` first.
- **Client tool `ask_claude`:** runs in the page and calls the bridge; `expects_response` on, a
  response timeout of 120 s, pre-tool speech forced, interruptions allowed. Its argument carries
  what Rafal asked; the page also hands the bridge Rafal's transcribed words for the same turn, and
  the bridge forwards those to the fork.
- **Authentication:** the bridge obtains a conversation token (WebRTC) or signed URL (WebSocket)
  with the key; the page never sees the key.
- **Retention:** `platform_settings.privacy.retention_days` = 0 (scheduled deletion); the bridge
  also deletes each conversation at its end (§5.4). The local `transcript.md` is the only kept copy.

## 8. Voice fork

- One process per conversation, started by the bridge in session X's project directory:

  ```
  claude -p --resume <X> --fork-session --restricted --tools Read,Grep,Glob,Edit,Write --strict-mcp-config --permission-mode default --input-format stream-json --output-format stream-json --verbose --replay-user-messages --settings <dialog dir>/fork-settings.json --add-dir <dialog dir>
  ```

  - `--restricted` confines the file tools to the working directories (session X's project and
    the dialog directory), removes the code-running tools and `WebFetch`, and ignores the user's
    settings files, hooks included; `--settings` still applies;
  - `--tools` and `--strict-mcp-config` leave exactly the five file tools and no MCP server; in
    `auto` without them the fork had 54 tools, Google Calendar and Sheets writes and `SendMessage`
    among them, decided by the classifier (probe report „Final review”, C1);
  - `default` mode with nobody to answer refuses everything the settings do not allow;
  - `--replay-user-messages`: a result counts as an answer only after the replay of its message;
    a fork may print an empty result first (probe report „Round trip and latency”).
- The bridge strips `ELEVENLABS_API_KEY` from the fork's environment (§3).
- The fork runs on session X's model unless the bridge passes `--model`.
- **Settings:** `permissions.allow` holds `Edit(//c/<dialog dir in POSIX form>/**)`. On Windows the
  form `//C:/…` matches nothing; that was also the hub's form (hub index, `hub-core`).
  `permissions.deny` holds `Edit(./**)`, `Bash`, `EnterWorktree` and `Read` denies for the
  secret-file denylist of hub spec §7 (`.env*`, `*.pem`, `*.key`, `*credentials*`, `*secret*`,
  `auth.json`, `secrets.yaml`). This narrows the decision "Equivalence with the written dialog" of
  2026-10-14: the voice settings are a superset of the written fork's.
- **Role:** the written dialog fork's role (hub spec §6.5 step 3; text in the hub skill's
  `forkStartPrompt`) with these voice differences:
  - it talks through a voice agent: every answer is plain spoken Polish, a few sentences at most,
    with no Markdown, tables, lists of paths or code; if Rafal needs a path or code, it says it
    will put it in the files;
  - this conversation-level instruction overrides the global answer format (BLUF sections) for the
    fork's answers;
  - decisions follow §5.3; it marks a decision to be read back so the bridge and the agent can
    recognise it;
  - it has no gate of its own and never ends a turn with a gate marker; `prompt.md` is written only
    on the bridge's final message (§5.4);
  - questions and gates open in the inherited history of X are not its gates (as in the written
    fork).
- It sees X's history up to the tool call that started the bridge.
- **Acceptance criterion (2026-10-14, extended 2026-10-19 and 2026-10-20):** on this `-p`
  process the `init` line lists only `Edit`, `Glob`, `Grep`, `Read`, `Write`; a write into the
  repository is refused; a write into the dialog directory is accepted; a write outside both
  working directories is refused; a `Read` of a denylisted file (a test `.env` and `Server.PEM`)
  and a Grep for its content are refused or find nothing; no permission prompt hangs the process.
  The probe of 2026-10-20 passed every item except the last Grep on `Server.PEM`, which was not
  tried.

## 9. Voice proposals at gates

A rule in `~/.claude/CLAUDE.md`, added after the acceptance of `/talk`: at a gate where Rafal and
Claude must agree (a brainstorming question, a spec or plan review, a decision whose variants differ
by a trade-off), Claude may add one sentence to the question section proposing `/talk`. Never at a
gate of push, tickets, GCP or a new dependency. Rafal starts the conversation himself.

## 10. Probes before the implementation plan

Voice minutes are spent only where voice is the thing tested. Everything else runs on a voiceless
harness: a text page or script that calls the bridge's `ask_claude` endpoint and the end of the
conversation the way the ElevenLabs client would, with no ElevenLabs connection. The voice probes
total about 13 minutes against the Free plan's 15; the bridge logs minutes used, and when the free
minutes run out Claude stops and asks Rafal.

| Probe | Voice | What | Passes when |
|---|---|---|---|
| Fork boundary in `-p` | no | the §8 acceptance criterion on a `-p` fork with the voice `fork-settings.json` | repository write refused, dialog write accepted, denylisted read refused, no hanging prompt |
| Round trip and latency | no (harness) | about 10 questions through the bridge to a fork of a real session | answers come as speakable Polish; median and maximum latency recorded; a second message during a running turn is serialised |
| End and wake-up | no (harness) | end by the harness's "end" and by a lost heartbeat | the bridge exits after the fork's final turn, session X wakes, reads the closing report and proceeds |
| Polish without the fork | about 4 min | Polish talk mixed with English terms with the agent alone (Haiku 5.5) | Rafal judges the voice natural and the transcript of his speech right on the technical terms; otherwise the fallback is GPT-Live-1 (notes, "Voice layer for the probe") |
| Haiku and Sonnet | about 2 × 3 min | the same script of 3 decisions on Haiku 5.5 and on Sonnet 5.5, with the fork | for each model: spoken read-back compared with the text in `decisions.md`, turn latency, the wait filler, an interruption during the wait; Rafal picks the model |
| End to end | about 3 min | one short `/talk` from start to session X's wake-up, closed by the button | the conversation is deleted at ElevenLabs, the closing report reaches X |

## 11. Acceptance of the implementation

With Rafal, on a real session: a `/talk` conversation of at least two decisions and one open
question, ending in a work order; checks: the decisions in `decisions.md` match what was read back
and confirmed; `prompt.md` carries only the confirmed work order and decisions;
`open-questions.md` and `transcript.md` exist; the repository is
unchanged by the fork (`git status` of X before and after differs only by X's own later work);
the page refused a request without the token; the conversation is gone from ElevenLabs; `/talk` in
a project outside the allowlist refused to start; session X proceeded on `prompt.md` and stopped at
the first outward action. The end is checked on three paths the probes did not run live: Rafal's
„Zakończ rozmowę” button, a closed tab (lost heartbeat), and a page that never starts (first-beat
deadline); each wakes session X with a closing report and leaves no conversation at ElevenLabs.
Voice minutes beyond the Starter plan's go to Rafal first. Plan 3 adds the checks of §20.2.

## 12. Calls made by Claude (approved as a whole in the playback of 2026-10-18; check them)

- The skill prepares the dialog directory through the same code the hub uses for the written dialog
  (project matching, snapshot, settings), not a copy of it.
- One fork process for the whole conversation (not one per question).
- The bridge runs as a background task of session X, whose end wakes X.
- The closing report on the bridge's standard output carries the files' contents, so X never reads
  the dialog directory itself (verified: X read the report from its task's output file).
- `transcript.md` in the dialog directory.
- Rafal's transcribed words reach the fork verbatim alongside the agent's tool argument.
- The voice-proposal rule enters `~/.claude/CLAUDE.md` only after acceptance.
- The work order is read back and confirmed like any decision, and a conversation without a
  confirmed order (a closed tab included) yields no `prompt.md`. Derived from the decision "When a
  voice decision binds" of 2026-10-11; raised by the builder check of 2026-10-18.

## 13. Left to the builder

- How the skill `talk` reuses the hub's code (importing the hub's `lib/`, or a new hub CLI command
  that prepares a dialog directory without launching a fork).
- Whether the voice fork is registered in `hub-sessions.json` and how the hub overview shows it
  (in restricted mode the fork runs no user hooks, so the hub's hook does not see it).
- Whether the bridge pins the fork's model.
- How the introduction turn prepares the fork (reading the git snapshot there shortens the first
  real question, probe report „Conclusions”, finding 2).
- The items the final review of Plan 1 deferred (probe report „Final review”, minor findings).
- The port choice, the heartbeat and grace period, the decision marker's exact form, the
  transcript's format, the page's look.
- How the agent's configuration file is applied to the ElevenLabs account (API from a setup
  command, or Rafal in the dashboard).
- The voiceless harness's form (a page mode or a script).

## 14. Decisions after the builder check (2026-10-19)

The builder check of 2026-10-18 raised these; Rafal decided them on 2026-10-19 (conversation,
session `c0987db9`), each on the recommended variant.

| Name | Decision | Where applied |
|---|---|---|
| Projects allowed for `/talk` | an allowlist in the skill's configuration; outside it the skill refuses to start; initially `notatki` and the hub skill's repository; company repositories only when Rafal adds them | §5.1, §6 |
| Secret reads by the voice fork | the written fork's settings plus `Read` denies for the hub spec §7 denylist; a read test joins the write test | §8, §10 |
| Retention at ElevenLabs | `retention_days` = 0 and deletion of each conversation by the bridge at its end; `transcript.md` is the only kept copy | §5.4, §6, §7 |
| Browser SDK | a vendored copy of a pinned `@elevenlabs/client`, with version and hash recorded; no CDN at runtime, no build tooling | §3, §4 |
| Minute budget | a voiceless harness for everything that does not test voice; about 13 voice minutes; Claude stops and asks when the free minutes run out | §10, §11 |
| Haiku in the probes | `claude-haiku-5-5` replaces `claude-haiku-4-5` as the default and in the comparison with Sonnet 5.5 (found on ElevenLabs' model list while planning; decided at the plan 1 review) | §7, §10 |
| Voice fork's permission mode | **superseded on 2026-10-20** (§15): `--permission-mode auto` was chosen on the claim that the boundary comes from the settings file; the final review of Plan 1 showed the claim false | — |

## 15. Decisions after the probes (2026-10-19 and 2026-10-20)

Rafal decided these in conversation (session `c0987db9`), from the probe report
[2026-10-19-hub-voice-probes.md](2026-10-19-hub-voice-probes.md).

| Name | Decision | Where applied |
|---|---|---|
| Polish in ElevenLabs | passes: natural voice, recognition sufficient | §7 |
| Agent model | Haiku 5.5 | §7 |
| Agent corrections | „ty”, no claimed forwarding, `turn_timeout` 20, `end_call`, `silence_end_call_timeout` 30 | §7 |
| Voice minutes | ElevenLabs Starter plan | §3 |
| Voice fork boundary (2026-10-20) | dialogs outside `~/.claude` in `C:\Users\rafal\hub-data\projects\<project>\dialogs\`; the fork restricted to five file tools, no MCP, `default` mode, a `//c/…` allow rule | §3, §4, §8 |
| Browser client (2026-10-20) | Claude's ruling during the probes confirmed: the IIFE build plus the vendored `libsamplerate` worklet, no bundler | §4 |
| Interruption during a wait (2026-10-20) | interruptions stay allowed; when ElevenLabs drops a tool result because Rafal spoke, the page pushes Claude's answer into the conversation with the client's `sendContextualUpdate`; Plan 2 probes this first and, if the agent does not take the answer up, falls back to `interruption_mode: disable_during_tool` | §7, §16 |
| Spec review (2026-10-20) | the amended spec is accepted; Plan 2 (the skill `talk`) is next | — |

## 16. Interruption during a wait

In all three voice conversations of the probes, talking while `ask_claude` waited made ElevenLabs
discard the fork's answer; the fork's work (a written decision) was not lost, but the agent did
not hear about it and asked again. Decision of 2026-10-20 (§15): the page keeps every `ask_claude`
answer it received from the bridge; when the SDK reports that the pending tool call was
interrupted, the page sends that answer with `sendContextualUpdate`, so the agent can say it on its
next turn. Plan 2 starts with a probe of this; if the agent does not take the answer up, the tool
gets `interruption_mode: disable_during_tool` instead.

Result of the probe (Plan 2, Task 1, 2026-10-20; probe report, section „Interruption with a
contextual update”): after an interruption the agent (Haiku 5.5) itself re-issues `ask_claude`
with the same request, twice out of two runs. The bridge therefore joins a request identical to one
still in flight instead of giving the fork a second turn, and the re-issued call returns Claude's
answer, which the agent then says. The page keeps a mark per ask and sends the answer with
`sendContextualUpdate` only when an interrupted ask returns while no other ask is pending and no
uninterrupted call has delivered the same request; this path was not exercised live, because the
agent re-issued both times. Interruptions stay allowed (`interruption_mode: allow`); the fallback is
not used.

## 17. Decisions of 2026-10-21

Rafal tested `/talk` on 2026-10-21, five times from the hub session and earlier in `notatki`, and
concluded: „móc włączać i wyłączać się do jednej sesji albo w jaki sposób przeglądarki reaktywować
sesję, a nie znowu przez tok” („tok”, dictated, is `/talk`), and of the cut after ten minutes:
„nie da się przeprowadzić dłuższej rozmowy”. He decided the rows below in conversation (session
`c0987db9`). He confirmed the last row in a voice conversation from the hub (dialog
`C:\Users\rafal\hub-data\projects\claude\dialogs\2026-10-21-2111-talk`, decision 1).

| Name | Decision | Where applied |
|---|---|---|
| Conversation length limit | The agent's `max_duration_seconds` goes from ElevenLabs' default of 600 to 1800; the field accepts 60–7200. The 600 s default cut the hub conversation of 14:54 in the middle of an ask, 596 s after the agent's first line | §7; applied 2026-10-21 by `agent sync` |
| Writes in dialogs of the hub | The dialog directory's project segment drops leading dots. The hub's key `.claude` had put dialogs under `hub-data\projects\.claude\`, where Claude Code refused every write of the fork („…which is a sensitive file”, reproduced by a probe with the fork's flags) despite the `allow` rule. The fork's role adds that Rafal cannot approve a blocked write | §4; applied 2026-10-21, confirmed live by the dialog of 21:11 |
| Rejoining a conversation | One design covers rejoining a conversation and starting one from the hub, because both change how long the bridge lives and who opens the page; then Plan 3 | §18, §19 |
| Design without questions („zacznij”) | Claude designs §18–§19 alone, writes this amendment and Plan 3 with a Codex review, and stops at Rafal's review of the plan. No change to the skill's code before the plan is accepted, no push | §20 |

## 18. Rejoining a conversation

### 18.1 Why

In the hub conversation of 14:54 Rafal talked while he worked: he created a Pinecone index step by
step and asked whether a newly launched session was running yet. A conversation that goes along
with work has breaks in it. Plan 2 ends everything at the first end of a call:

- the client's `onDisconnect` calls `finish()` (`web/talk.mjs:108`), `finish()` posts `/api/end`
  (`web/talk.mjs:68`), and the bridge runs `end()` (`lib/bridge.mjs:241-244`);
- 15 s without a heartbeat ends it as well (`lib/bridge.mjs:274`).

After that the fork has exited. A new `/talk` starts a new fork, a new dialog directory and a new
snapshot, so what the conversation had built up is gone. Claude guessed the moment of 14:54;
Rafal neither confirmed nor rejected that guess.

### 18.2 Terms

- A **dialog** is what `/talk` starts: one bridge, one voice fork, one dialog directory and one
  closing report.
- A **call** is one ElevenLabs conversation inside a dialog.
- A dialog has one or more calls, never two at the same time.

### 18.3 What ends what

| Event | What it ends | What follows |
|---|---|---|
| „Zakończ rozmowę” on the page | the call and the dialog | §5.4 steps 2–4 |
| Rafal's spoken end („Kończymy”): the agent calls the client tool `end_conversation`, then hangs up | the dialog, once that call has ended | §5.4 steps 2–4 |
| „Przerwa” on the page | the call | paused |
| the agent hangs up without `end_conversation` (Rafal asked for a break or stopped answering), or the platform's silence hang-up | the call | paused |
| a closed or reloaded tab (no heartbeat for 15 s during a call) | the call | paused |
| a network drop or another client error | the call | paused |
| the call reaches its duration limit (`max_duration_exceeded`) | the call | the page starts the next call at once, without a click |
| no first call within 10 min of the start (the first-call deadline, as today) | the dialog | §5.4 steps 2–4 |
| the pause limit: 60 min after a call ended with no new call | the dialog | §5.4 steps 2–4 |
| the fork exits | the dialog | §5.4 steps 2–4 (as today) |

- **Paused** means that the bridge and the fork keep running. An open page shows „Połącz
  ponownie”, „Zakończ rozmowę” and the time until which the dialog waits.
- **After `end_conversation`:** a call that is still running 15 s after the tool returned is
  ended by the page.
- **Fallback.** If the probe of §20.1 shows that the agent does not call `end_conversation`
  reliably, the agent's hang-up (the client's `end_call` context) ends the dialog, as in Plan 2.
  It is a setting in the skill's configuration, not a code change.
  - A hang-up reported with any other context (for example the platform's silence hang-up, if the
    probe shows it arrives as `close`) still pauses the dialog.
  - If the silence hang-up also arrives as `end_call`, silence ends the dialog, as in Plan 2. A
    break is then possible only through „Przerwa”, the tab and the duration limit.
  - Raising or turning off `silence_end_call_timeout` (30 s, §7) would let quiet stretches
    through, at the price of minutes spent in silence. That price makes it Rafal's decision (§20.4).

### 18.4 At the end of every call

- The bridge reads the call's length and deletes its conversation at ElevenLabs (§5.4 step 3).
  It also rewrites `transcript.md` with everything said so far.
- Effects:
  - a paused dialog keeps nothing at ElevenLabs;
  - a dialog killed together with its session still leaves its transcript (the background task
    dies when session X's process ends).
- At the end of the dialog only what is still missing is deleted.
- The closing report keeps its format. `conversations:` lists every call of the dialog, and the
  first segment of `deletion:` is `deleted` only when every call was deleted.

### 18.5 Rejoining

- **The same tab.** „Połącz ponownie” starts the next call.
- **A closed tab.** The page URL, with its token, stays valid for the life of the dialog.
  Reopening the tab from the browser (history, „Otwórz ponownie zamkniętą kartę”) brings the page
  back, and the page loads the transcript so far and the recorded decisions from the bridge.
- **`/talk` again in session X while its dialog lives.**
  - The skill reopens that dialog's page instead of starting a second dialog.
  - `check` reports the live dialog of the session, and a new `reopen` command opens its URL.
  - The live dialog is found through a file in its dialog directory that exists only while the
    bridge runs; a file left behind by a killed bridge does not count.
  - `start` refuses a second live dialog for the same session.
- **From the hub:** §19.
- **One call at a time.**
  - While a call is live, a second tab cannot start another: the bridge refuses the token request,
    and the page says „Rozmowa trwa w innej karcie.”
  - A call whose heartbeat has been missing for 15 s is no longer live.
- **A conversation with a fresh fork**, for example after X has done more work: end the open
  dialog on its page, then type `/talk`.

### 18.6 What a later call knows

- **The fork.**
  - At the start of every call after the first, the bridge refreshes the git snapshot in
    `context/`.
  - It puts a one-line Polish note in front of the next message to the fork: the length of the
    break, or that the duration limit cut the call, and the time of the snapshot.
  - The fork's role: a decision read back before the break and not yet confirmed is read back
    again before Rafal can confirm it. A read-back cut off by the break may not have been heard
    whole (§2, anti-goal on the wording).
- **The agent.**
  - Every later call starts with another first message: „Wracamy do rozmowy. Słucham.”.
  - Right after connecting, the agent gets a contextual update with the last lines of the
    transcript and with every answer from Claude that arrived after its call had ended. The fork
    may finish an ask after a cut, and without this its answer would be lost, as in §16.
- **The page** shows the transcript and the decisions so far.

### 18.7 Duration limit

- Each call is limited to 1800 s (§17).
- When the limit is reached, the agent says „Kończy się czas tego połączenia, zaraz łączę
  ponownie.” (the agent field `max_conversation_duration_message`; its effect is probed in
  §20.1).
- Then the page starts the next call.

### 18.8 Session X during a dialog

- X's turn ends with the start (§5.1), and Rafal may keep working with X in text in the meantime.
- The fork does not see that work, except through the refreshed snapshot.
- Decisions reach X only with the closing report at the end of the dialog.
- This follows from §8: the fork sees X's history up to the tool call that started the bridge.
- **Amends §5.5.** When X had turns of its own between the start of the dialog and the closing
  report, X does not carry out `prompt.md` at once. It shows Rafal the order next to what it has
  done since the start, and waits for his word in text. A work order built on an older state must
  not land on top of newer work unseen. Without such turns, X proceeds at once, as in §5.5.

### 18.9 Network exception

- The bridge lives for the dialog instead of a single conversation, and each pause lasts at most
  the pause limit (§6).
- The token rule is unchanged.
- The URL in the browser history works only while the dialog lives.

### 18.10 Non-goals

- A fixed address or a bookmark.
- Reconnecting on its own after anything other than the duration limit.
- Two calls at once.
- A call in which the fork knows X's later work beyond the snapshot.

## 19. Starting a conversation from the hub

### 19.1 Why

- „Omówmy głosem wynik sesji X” is the voice twin of the hub's written dialog (hub spec §6.5).
  §2 kept it as a non-goal until 2026-10-21.
- On 2026-10-21 Rafal used `/talk` in the hub session itself (project key `.claude`) to talk about
  all his projects. That use stays as it is: a plain `/talk` in the hub.
- This section covers the other case: a conversation about one session X, started from the hub.
  X is untouched until Rafal sends the result.

### 19.2 Flow

1. Rafal says in the hub „porozmawiajmy głosem o <X>” or „omówmy głosem wynik sesji X”. The hub
   picks X from the overview as in the dialog path.
2. `HUB voice resolve --session <X>` is a new command. It launches nothing and writes only the
   poll record that every hub poll appends (`registry/polls.jsonl`).
   - It resolves X as `dialog start` does (hub spec §6.5 step 2): a live id directly, a restarted
     session by its name, and otherwise candidates for Rafal to choose from, plus twins and busy.
   - **Working directory.** The cwd comes from X's own hook events first, and from the poll of
     `claude agents --json` only when no event names one.
     - For a hub-launched worktree session the two disagree. `99352fa7` (in
       `notatki-hub-single-wyslij`) is polled with `D:\Notatki\notatki` in its latest entries
       (117 of 151), while its hook names only the worktree (20 of 20), and its transcript lies
       under the worktree's project directory.
     - A fork started in the main checkout would read and snapshot the wrong tree, and its
       `--resume` would look for the transcript in the wrong place.
   - **Transcript.** It prints X's live session id, that cwd, the project key, the name, and the
     `transcriptPath` from X's latest hook event, with whether that file exists.
     - `talk.mjs start` refuses a session whose transcript file is missing, with one Polish
       sentence. This is the guard against finding F1: a session without a transcript cannot be
       resumed.
   - The resolution code is shared with `dialog start`, so the cwd preference also corrects
     `dialog start` for the same sessions (§20.4).
3. The hub runs `talk.mjs check --cwd "<cwd>" --session <id>`.
   - A project outside the allowlist refuses, with the sentence of §5.1, which the hub quotes.
   - A live dialog of X makes the hub run `talk.mjs reopen --session <id>` and say so.
4. The hub runs `talk.mjs start --session <id> --cwd "<cwd>" --origin hub [--subject='<subject>']`
   as its own background task.
   - The fork is a fork of X, runs in X's working directory and has the boundary of §8.
   - The dialog directory lies under X's project key.
   - The page names the project and X's name or short id.
   - When X is busy, the hub says, as in the written dialog, that the fork sees X's history only up
     to the running tool call.
5. When the task completes, the hub reads the closing report from the task's output.
   - It shows the decisions and open questions as Polish tables, the length of each call and any
     deletion problem.
   - If `prompt.md` was written, the hub composes it as a dialog message to X:
     `HUB compose --path dialog --session <id> --origin voice/<dialog dir name> --body-file "<dialog dir>/prompt.md"`.
     It then follows steps 2–6 of the hub skill's Sending: the full draft, then Rafal's „wyślij”
     in text.
   - Without `prompt.md` nothing is sent.
6. The bridge does not wake X, and X never reads the dialog. X learns the result only from the
   hub's message.

### 19.3 Boundaries

- A voice decision is never „wyślij” (§2, anti-goals; the hub's hard rules are unchanged).
- The hub writes only into `~/.claude/hub/` through the hub CLI, with one exception: the directory
  of a voice dialog, which the talk CLI writes into its own dialog root (§4). The hub's role text
  and its skill say so.
- The hub starts sessions and forks only with `HUB launch` and `HUB dialog start`; the voice fork
  joins that list, started through the talk CLI after `HUB voice resolve`.
- If Rafal types `/talk` in X while a hub-started dialog about X lives, X reopens that dialog
  (§18.5). Its report still goes to the hub, and X tells Rafal so.

### 19.4 Hub-launched sessions (finding F1)

- Sessions launched by the hub with `claude --bg` write their transcripts. Checked on 2026-10-21:
  `4bd53d28` and `f8d64eed`, both `kind: background` in `hub-sessions.json`, have their `.jsonl`
  under `~/.claude/projects/`.
- Their transcripts lie under the project directory of their worktree, which is why the cwd comes
  from the hook (§19.2 step 2).
- Plan 3 checks a hub-started voice fork of a hub-launched worktree session, without voice,
  before the acceptance: the fork must become ready from the hook's cwd.

### 19.5 Non-goals

- A voice conversation about a project with no live session.
- Live voice dialogs in the hub overview (`check --session` and `reopen` are enough).
- The hub driving the page.

## 20. Plan 3

### 20.1 Probe (with voice, about 3 min, with Rafal)

The probe runs on the built code, before the acceptance. Every way it can come out is already
covered in the build, so its result only sets configuration:

- the fallback of §18.3;
- whether a later call gets its own first message;
- whether the duration message is spoken.

A separate probe harness would only duplicate the page. The probe checks four things:

- **(a)** On „Kończymy”, the agent calls `end_conversation` and then hangs up. On „Zrób przerwę”,
  it hangs up without calling it.
- **(b)** The agent takes up a later call's first message and its contextual update with the end
  of the transcript.
- **(c)** The duration message is spoken, on a call limited to 60 s for the probe; the limit goes
  back to 1800 s afterwards.
- **(d)** What `onDisconnect` receives in each case. The vendored client 1.28.0 reports the
  contexts `end_call`, `max_duration_exceeded`, `close` and `connection_state_changed`.

If (a) fails, the fallback of §18.3 applies.

### 20.2 Acceptance with Rafal (extends §11)

One dialog in `notatki` covers:

- a break through „Przerwa”, then a rejoin;
- a closed tab reopened from the browser within the pause limit;
- a decision read back, a break before its confirmation, and the read-back repeated after the
  rejoin;
- a call cut by a temporary 120 s duration limit (restored to 1800 s afterwards), followed by the
  automatic next call;
- `/talk` in X during a pause, which reopens the same page;
- „Kończymy”, which ends the dialog and wakes X with a report that lists every call.

Then:

- a conversation started from the hub about a session in `notatki`, whose `prompt.md` the hub
  drafts to X and sends after „wyślij”;
- the pause limit, shortened by configuration, ending a dialog (without voice).

After each call, its conversation is gone from ElevenLabs. Voice time is about 10 minutes, within
the Starter plan; anything beyond the plan goes to Rafal first.

### 20.3 Calls made by Claude under „zacznij” (for Rafal's review)

- One dialog, one fork, one dialog directory and one closing report across all its calls; one
  call at a time; one live dialog per session X.
- Only the button, Rafal's spoken end marked by `end_conversation`, the pause limit, the
  first-call deadline and the fork's exit end a dialog; every other end of a call pauses it.
- The pause limit is 60 min, in the skill's configuration. The first-call deadline stays at
  10 min.
- The page reconnects on its own only after the duration limit, so that a call Rafal left on
  purpose is not reopened and its minutes are not spent.
- Each call's conversation is deleted at ElevenLabs, and `transcript.md` is rewritten, at the end
  of that call.
- Rejoining works through the same URL; `/talk` and the hub reopen the dialog instead of starting
  a second one.
- At a later call: the snapshot is refreshed, the fork gets a note, a decision read back before the
  break is read back again, and the agent gets a first message, the transcript's end and any
  undelivered answers.
- The page gets a „Przerwa” button and names the project and session X.
- A start from the hub uses a new read-only `HUB voice resolve` and the talk CLI with
  `--origin hub`. The report goes to the hub, and `prompt.md` reaches X only through the hub's
  dialog send path after „wyślij”.
- The hub's role and skill get the exception for voice dialog directories and voice forks
  (§19.3).
- `agent sync` also applies the new client tool and the agent fields that §18 needs.
- The fork of a session starts in the cwd from that session's hook events, not in the cwd of the
  poll. A session without a transcript file is refused before any fork starts.
- X asks before carrying out `prompt.md` when it had turns of its own during the dialog (§18.8).
- The probe runs on the built code, and its results are configuration values (§20.1).
- The fallback of §18.3 keeps `silence_end_call_timeout` at 30 s.

### 20.4 Decisions for Rafal (in Plan 3, not taken by Claude)

| Name | Question | Recommendation | Why it is Rafal's |
|---|---|---|---|
| Working directory in `dialog start` | Should the hook-first cwd of §19.2 also apply to the written dialog's `dialog start`, which shares the code? | A: yes. A written dialog of a hub-launched worktree session otherwise starts in the main checkout. B: only the voice path; `dialog start` goes on the open points of `hub-core` | It changes the built part `hub-core` from inside Plan 3 |
| Silence in the fallback | Only if the probe triggers the fallback and the silence hang-up arrives as `end_call`: raise `silence_end_call_timeout`? | A: leave it at 30 s and take breaks with „Przerwa”. B: 120 s | Minutes spent in silence cost money |
| Voice minutes | The probe (about 3 min) and the acceptance (about 10 min) on the Starter plan; the remaining minutes could not be read (`GET /v1/user/subscription` answers 401 to this key) | A: go ahead, and stop if ElevenLabs reports the plan's limit | Cost |

### 20.5 Left to the builder

- The structure of the bridge's states.
- The form of the live-dialog file and its liveness check.
- How a later call's first message is set: an override enabled in the agent's platform settings,
  or a dynamic variable.
- How many transcript lines the contextual update carries.
- The page texts beyond those named here.
- Where `HUB voice resolve`'s code lives.
- How `agent sync` applies the client tool and the platform settings.
