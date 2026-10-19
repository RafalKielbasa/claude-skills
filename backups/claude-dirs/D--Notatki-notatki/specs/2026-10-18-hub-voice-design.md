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
- The fork runs under the same permission file as the written dialog fork (hub spec §6.5 step 2:
  `Edit` allowed only in the dialog directory; `Edit(./**)`, `Bash` and `EnterWorktree` denied).
- ElevenLabs Free plan: the probes (§10) fit in its 15 included minutes; any paid use is a separate
  question to Rafal.
- `ELEVENLABS_API_KEY` is created and set by Rafal in his user environment; only the bridge reads
  it. Claude never creates or prints keys.
- Windows 11; Node as the hub skill uses it; code, comments and configuration in English;
  everything Rafal reads or hears in Polish.
- The command is `/talk`: Claude Code has a built-in `/voice` (dictation).

## 4. Components

| Component | Location | Role |
|---|---|---|
| Skill `talk` | `~/.claude/skills/talk/` (tracked like the skill `hub`) | `SKILL.md`: the procedure session X follows on `/talk` and after the conversation (§5) |
| Bridge | a Node script in the skill, e.g. `bin/talk-bridge.mjs` | Serves the page on `127.0.0.1`, mints the ElevenLabs conversation token, runs the voice fork, answers the `ask_claude` tool, watches the dialog directory, writes the transcript, ends the conversation (§5, §6) |
| Page | served by the bridge | Connects to the ElevenLabs agent with the token; shows the live transcript, the decision being read back, the recorded decisions, the fork's state ("Claude myśli…"), and an "Zakończ rozmowę" button |
| ElevenLabs agent | an agent in Rafal's ElevenLabs account; its configuration kept as a file in the skill | The voice: Polish speech recognition and voice, conversation glue, the client tool `ask_claude` (§7) |
| Voice fork | `claude -p --resume <X> --fork-session` with `stream-json` input and output, one process per conversation | The interlocutor: answers, reads decisions back through the agent, writes the dialog files (§8) |
| Dialog directory | `~/.claude/hub/projects/<project>/dialogs/<date>-<slug>/`, the hub's layout (hub spec §4.1) | `context/` (git snapshot), `fork-settings.json`, `decisions.md`, `open-questions.md`, `prompt.md`, plus `transcript.md` |

## 5. Flow

### 5.1 Start

1. Rafal types `/talk` in session X (optionally with a subject). At gates where Rafal and Claude
   must agree, Claude may propose this in one sentence of the question section (§9).
2. The skill checks `ELEVENLABS_API_KEY`; without it, it tells Rafal in Polish what to set and stops.
3. It prepares the dialog directory exactly as the written dialog does: the hub's project matching
   (hub spec §4.1), the git snapshot into `context/` and `fork-settings.json`.
4. It starts the bridge as a background task of session X, so that X is woken when the bridge exits.
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
3. The bridge writes `transcript.md` (who said what, local times), then prints a closing report on
   standard output: the dialog directory and the full contents of `decisions.md`,
   `open-questions.md` and `prompt.md` (or that it was not written). Then it exits.

### 5.5 Session X after the conversation

Session X is woken by the end of the background task and reads the closing report from the task
output (not from the files: reading `~/.claude/hub/` from a project session may raise a permission
prompt, hub spec §6.1). It shows Rafal the recorded decisions as a short Polish table and proceeds
at once: on `prompt.md` if there is one, otherwise on the decisions where it was before `/talk`.
Push, tickets, GCP, a new dependency and anything else outward still wait for Rafal's word in text,
under the usual rules of the session's repository.

## 6. Network exception (amends hub spec §8.2, row Network)

The voice bridge is the only component allowed to listen on a network interface, under these
rules:

- it binds `127.0.0.1` only;
- it lives only for the duration of one conversation;
- every request must carry the conversation's random token (from the page URL); requests without
  it, or with a `Host` header other than the bridge's own `127.0.0.1:<port>` or `localhost:<port>`,
  are refused;
- the hub panel gets no exception from this rule.

A phone would need a different exception; that is a separate decision for later.

## 7. ElevenLabs agent

- **Voice side's LLM:** Claude Haiku 4.5 by default; the probe compares Claude Sonnet 5.5 on the
  same script (a configuration switch, no code) and the choice follows turn latency and the
  fidelity of read-back (§10, probe "Haiku and Sonnet").
- **Language and voice:** Polish recognition and a Polish-capable voice (for example a Multilingual
  or Flash v2.5 voice); English technical terms are said as English.
- **Its instructions** (the agent's system prompt, in the configuration file): it is only the
  mouth; it never answers project questions itself and never invents project facts; it forwards
  them with `ask_claude`; it reads text marked as a decision word for word; it keeps its own
  sentences short; it never confirms anything on Rafal's behalf.
- **Client tool `ask_claude`:** runs in the page and calls the bridge; `expects_response` on, a
  response timeout of 120 s, pre-tool speech forced, interruptions allowed. Its argument carries
  what Rafal asked; the page also hands the bridge Rafal's transcribed words for the same turn, and
  the bridge forwards those to the fork.
- **Authentication:** the bridge obtains a conversation token (WebRTC) or signed URL (WebSocket)
  with the key; the page never sees the key.

## 8. Voice fork

- One `claude -p --resume <X> --fork-session --input-format stream-json --output-format
  stream-json` process per conversation, started by the bridge in session X's project directory,
  with `--settings <dialog dir>/fork-settings.json` and `--add-dir <dialog dir>`.
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
- **Acceptance criterion (2026-10-14):** the settings file passes the same write test on this `-p`
  process as on the written fork: a write into the repository refused, a write into the dialog
  directory accepted, and no permission prompt that would hang a process nobody can answer.

## 9. Voice proposals at gates

A rule in `~/.claude/CLAUDE.md`, added after the acceptance of `/talk`: at a gate where Rafal and
Claude must agree (a brainstorming question, a spec or plan review, a decision whose variants differ
by a trade-off), Claude may add one sentence to the question section proposing `/talk`. Never at a
gate of push, tickets, GCP or a new dependency. Rafal starts the conversation himself.

## 10. Probes before the implementation plan

All within the Free plan's 15 minutes; the bridge or the probe script logs minutes used.

| Probe | What | Passes when |
|---|---|---|
| Polish without the fork | 3–5 minutes of Polish talk mixed with English terms with the agent alone (Haiku 4.5) | Rafal judges the voice natural and the transcript of his speech right on the technical terms; otherwise the fallback is GPT-Live-1 (notes, "Voice layer for the probe") |
| Fork write boundary in `-p` | the §8 acceptance criterion, run on a `-p` fork with `fork-settings.json`, no voice | repository write refused, dialog write accepted, no hanging prompt |
| Round trip and latency | `ask_claude` from the page through the bridge to the fork and back, about 10 questions on a real session | the wait filler plays, an interruption during the wait breaks nothing, answers come as speakable Polish; median and maximum latency recorded |
| Haiku and Sonnet | the same script of 3–5 decisions on Haiku 4.5 and on Sonnet 5.5 | for each model: spoken read-back compared with the text in `decisions.md`, turn latency; Rafal picks the model |
| End and wake-up | end the conversation by button and by closing the tab | the bridge exits after the fork's final turn, session X wakes, reads the closing report and proceeds |

## 11. Acceptance of the implementation

With Rafal, on a real session: a `/talk` conversation of at least two decisions and one open
question, ending in a work order; checks: the decisions in `decisions.md` match what was read back
and confirmed; `prompt.md` carries only the confirmed work order and decisions;
`open-questions.md` and `transcript.md` exist; the repository is
unchanged by the fork (`git status` of X before and after differs only by X's own later work);
the page refused a request without the token; session X proceeded on `prompt.md` and stopped at the
first outward action.

## 12. Calls made by Claude (approved as a whole in the playback of 2026-10-18; check them)

- The skill prepares the dialog directory through the same code the hub uses for the written dialog
  (project matching, snapshot, settings), not a copy of it.
- One fork process for the whole conversation (not one per question).
- The bridge runs as a background task of session X, whose end wakes X.
- The closing report on the bridge's standard output carries the files' contents, so X never reads
  `~/.claude/hub/` itself.
- `transcript.md` in the dialog directory.
- Rafal's transcribed words reach the fork verbatim alongside the agent's tool argument.
- The voice-proposal rule enters `~/.claude/CLAUDE.md` only after acceptance.
- The work order is read back and confirmed like any decision, and a conversation without a
  confirmed order (a closed tab included) yields no `prompt.md`. Derived from the decision "When a
  voice decision binds" of 2026-10-11; raised by the builder check of 2026-10-18.

## 13. Left to the builder

- How the skill `talk` reuses the hub's code (importing the hub's `lib/`, or a new hub CLI command
  that prepares a dialog directory without launching a fork).
- How session X learns its own session id for `--resume` (for example the skill's
  `${CLAUDE_SESSION_ID}` substitution, if Claude Code provides it, or the hub registry by `cwd`);
  verified in the first probe.
- Whether the voice fork is registered in `hub-sessions.json` and how the hub overview shows it.
- The port choice, the heartbeat and grace period, the decision marker's exact form, the
  transcript's format, the page's look.
- How the agent's configuration file is applied to the ElevenLabs account (API from a setup
  command, or Rafal in the dashboard).
- How the page loads the ElevenLabs browser SDK; see §14.

## 14. Open for Rafal before the plan

Raised by the builder check of 2026-10-18; asked in conversation 2026-10-18, session `c0987db9`.

- **Data leaving the machine.** A voice conversation sends what Rafal says and what the fork answers
  to ElevenLabs (speech recognition, voice, conversation history kept 2 years by default) and to
  the agent's LLM provider, which contradicts hub spec §8.2 "dialogs … stay on this machine".
  ElevenLabs' Zero Retention Mode is for select enterprise customers only; per-agent
  `platform_settings.privacy.retention_days` (0 = scheduled deletion) and
  `DELETE /v1/convai/conversations/{conversation_id}` exist. Open: which projects `/talk` may run
  in; whether the voice fork's settings add `Read` denies for the secret-file denylist of hub spec
  §7 (the written fork has none, `~/.claude/skills/hub/lib/dialog.mjs:30-33`); what the agent's
  retention is and whether the bridge deletes the conversation at the end.
- **Browser SDK.** The page needs ElevenLabs' browser client (`@elevenlabs/client`), a new
  dependency, while the hub skill is Node without dependencies. Variants: a vendored copy of a
  pinned version in the skill, a pinned version from a CDN, or no SDK (a signed URL over
  WebSocket with own microphone capture, playback queue and interruption handling).
- **Minute budget.** The builder estimates the probes of §10 at 17–27 voice minutes against the
  Free plan's 15, before development and acceptance; whether the agent's LLM also draws on the
  Free credits is unverified.
