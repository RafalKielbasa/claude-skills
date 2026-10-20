# Hub voice — design

**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Date:** 2026-10-18
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

**Non-goals of this spec** (later or elsewhere):

- Starting a voice conversation from the hub ("omówmy głosem wynik sesji X"): a later stage of
  `hub-voice`, added to this spec when its turn comes.
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
| Dialog directory | `C:\Users\rafal\hub-data\projects\<project>\dialogs\<date>-<slug>\`, the hub's layout (hub spec §4.1) but outside `~/.claude`, where Claude Code refuses a fork's write as a sensitive file; this amends hub spec §4.1 for voice dialogs only | `context/` (git snapshot), `fork-settings.json`, `decisions.md`, `open-questions.md`, `prompt.md`, plus `transcript.md` |

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
   the page disappearing (tab closed: no heartbeat for a grace period).
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
- it lives only for the duration of one conversation;
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
  running to the 600 s maximum (probe report „Haiku and Sonnet”, run A).
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
Voice minutes beyond the Starter plan's go to Rafal first.

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
