# Hub voice — brainstorming notes

**Project / part:** hub / hub-voice
**Index:** [hub.md](../projects/hub.md)
**Date:** 2026-10-16

The state of the voice part of the hub as of 2026-10-16, collected before its sources age out:
the hub registry deletes the last-message files of session `058993f5` about 2026-10-28, and the
transcripts of 2026-10-11 and 2026-10-12 are subject to Claude Code's transcript cleanup. No spec,
plan or code exists for this part yet.

## Goal

Rafal, 2026-10-11 (transcript `0e06a344`, 18:11:00Z): „Chciałbym zbudować system, w którym
pytania na temat projektów, które rozwijamy oraz odbijanie speku oraz brainstormingu odbywa się
poprzez moduł głosowy taki jak ma na przykład ChatGPT.” and „Dużo łatwiej jest mi poznawać te
pomysły i analizować je, gdy rozmawiamy na ich temat, a nie gdy czytam dokumentację.” Voice is for
the places „w których musimy się dogadać”. The hub spec (§1, loop step 4) counts a voice
conversation as one form of the analytical dialog.

Success picture recorded on 2026-10-14 (registry `058993f5`, `d1198f9f`):

- Rafal speaks and hears a Claude that knows the session's context;
- Claude reads every decision back aloud and records it only after Rafal's "tak";
- the conversation leaves files that Rafal reviews as text;
- "wyślij" and everything irreversible stay in text.

## Decisions so far

| Date | Name | Decision | State | Source |
|---|---|---|---|---|
| 2026-10-11 | Interaction model | Real-time conversation with interruptions; a separate voice model is the "mouth", Claude works behind it (question 1, answer B) | confirmed (re-confirmed 2026-10-14 as finding 1) | transcript `0e06a344`, 2026-10-11T18:13:56Z |
| 2026-10-11 | Line to Claude | The voice model gets a briefing and a line to Claude for questions outside it (question 2, answer B, then an `ask_claude` tool) | superseded in mechanism by GPT-Live delegation and the session fork (2026-10-12) | transcript `0e06a344`, 2026-10-11T18:16:45Z |
| 2026-10-11 | Who starts voice | Claude proposes voice at gates and Rafal confirms; `/voice` works on demand (question 3, answer A) | to re-confirm (open question below) | transcript `0e06a344`, 2026-10-11T18:19:12Z |
| 2026-10-11 | When a voice decision binds | Binding after Claude reads it back aloud and Rafal confirms; gates for irreversible or outward actions (tickets, push, GCP, new dependency) always stay in text (question 4, answer C) | confirmed (finding 4 on 2026-10-14) | transcript `0e06a344`, 2026-10-11T18:28:10Z |
| 2026-10-11 | Codex as the voice | Evening of 2026-10-11, carried by Codex: „budowę własnego modułu głosowego odkładamy”, projects discussed by voice in Codex | superseded on 2026-10-12 13:03 | transcript `7e84737d`, 2026-10-12T10:47:01Z |
| 2026-10-12 | Own voice module | Rafal invalidated "Codex as the voice"; back to an own module, decisions of 2026-10-11 stay | confirmed | transcript `7e84737d`, 2026-10-12T13:03:56Z and 13:06:06Z |
| 2026-10-12 | Voice model | GPT-Live-1 in `"delegation": {"type": "client"}` mode: the voice model hands thinking to the app (`session.delegation.created`), answers come back in chunks of at most 500 tokens per `delegation_id` (question 5, answer A) | to re-confirm: API facts read on 2026-10-12, not re-verified since | transcript `7e84737d`, 2026-10-12T13:37:17Z |
| 2026-10-12 | Who answers behind the voice | A fork of the current session: one `claude -p --resume <id> --fork-session` process in `stream-json` mode (question 6, answer A) | confirmed (finding 6 on 2026-10-14) | transcript `7e84737d`, 2026-10-12T13:42:53Z |
| 2026-10-12 | Where Rafal talks | At the computer, in a browser tab served by a local Node bridge on `localhost`; the OpenAI key stays on the bridge; a phone later, without rebuilding (question 7, answer A) | to re-confirm: conflicts with hub spec §8.2 ("No component listens on a network interface") | transcript `7e84737d`, 2026-10-12T13:44:36Z |
| 2026-10-12 | Fork may only read | The fork reads repository and vault and writes only the conversation files (question 8, answer A) | confirmed (finding 8 on 2026-10-14) | transcript `7e84737d`, 2026-10-12T13:48:00Z |
| 2026-10-12 | Decisions via bridge tools | Claude records decisions and questions with `record_decision` and `open_question` exposed by the bridge over MCP | superseded on 2026-10-14 (fork writes the files itself) | registry `058993f5`, `d1198f9f` (finding 2) |
| 2026-10-12 | Bridge design draft | The design draft "part 1 of 5" was invalidated at 16:21 when Rafal restarted the work as the orchestrator hub (16:15) | superseded | transcript `7e84737d`, 2026-10-12T16:15:04Z and 16:21:00Z; registry `4bd8c564`, `cdf89b65` |
| 2026-10-14 | Voice starts on its own | `/voice` in any session, the interlocutor is a fork of that session, in the hub's dialog file format; a start from the hub ("omówmy głosem wynik sesji X") comes later as a second path (question 1 of the voice brainstorming, answer B) | confirmed | registry `058993f5`, `fd8af3d0` |
| 2026-10-14 | Equivalence with the written dialog | The voice interlocutor uses the same start-prompt role as hub spec §6.5 step 3 and the same `--settings` file as §6.5 step 2 | confirmed | registry `058993f5`, `fd8af3d0` (finding 6) |
| 2026-10-14 | Who writes the decisions | The fork writes `decisions.md`, `open-questions.md` and `prompt.md` itself with the same tools as the written fork; no bridge MCP tools; the bridge only watches the dialog directory and shows decisions on its page | confirmed | registry `058993f5`, `fd8af3d0` (finding 2) |
| 2026-10-14 | Acceptance criterion | The settings file of §6.5 step 2, checked by the same write test (repository write refused, dialog-directory write accepted), must pass on the `-p` voice process | confirmed | registry `058993f5`, `fd8af3d0` |

## Open questions

- **After `/voice` (question 2 of 2026-10-14).** Does session X show `prompt.md` with the
  decision table and wait for Rafal's text "dalej" (A), or proceed at once on decisions confirmed
  by voice, with `prompt.md` written only when the conversation ends in a work order (B, as
  decision 4C of 2026-10-11)? Recommended: B. Irreversible actions stay in text in both.
- **Claude proposing voice at gates.** Decision A of 2026-10-11 is to be asked again separately.
- **Voice layer.** GPT-Live-1 versus alternatives (OpenAI Realtime `gpt-realtime-2.1`, Gemini
  Live, ElevenLabs Agents with Claude as the LLM were compared on 2026-10-11). The API facts must be
  re-verified before asking.
- **Network exception.** A bridge on `localhost` needs an exception to hub spec §8.2, limited to
  127.0.0.1; the hub's increment 1a (panel) needs the same.
- **Paid use of `OPENAI_API_KEY`.** Rafal's consent to use the existing key, which is set in the
  environment (checked 2026-10-14; `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` and `ELEVENLABS_API_KEY`
  are not).

## Changed since 2026-10-14

- Hub Plans 3 and 4 are done and accepted (Plan 4 on 2026-10-16).
- Probe S12 (a fork writing into `~/.claude/hub/projects/<project>/dialogs/`, reading a
  hub-placed file, without `EnterWorktree`) passed for `claude --bg` forks only. The voice process
  is `claude -p`, where nobody answers a permission prompt and the background-session worktree
  guard is assumed absent, so the write test must be repeated on it.
- The git snapshot decision (Plan 3 addition P4): the hub CLI writes `git status`, `git log` and
  `git diff HEAD` into `<dialog dir>/context/`, because the fork has no shell. A voice fork can
  read the same snapshot.

## Risks a probe must settle

- Quality of Polish in the voice model, and of the transcript of Rafal's speech.
- Reliability of handing questions from the voice model to Claude (delegation).
- Fork latency with a large context: Codex in a similar flow had a median of 12.1 s (n = 100,
  measured 2026-10-11).
- The write boundary in `-p` mode (see above).

## Sources

- Transcript `0e06a344-d585-42de-b20a-933b92e573be.jsonl` (2026-10-11, voice module, questions
  1–4 and the voice-layer comparison), in `~/.claude/projects/D--Notatki-notatki/`.
- Transcript `7e84737d-c8cf-469a-91c9-ab8b15f1c5d3.jsonl` (2026-10-12, questions 5–8, the switch
  to the orchestrator hub), same folder.
- Hub registry `~/.claude/hub/registry/058993f5-e8c5-468b-8a5d-a41f979b57b4.last/`:
  `d1198f9f-f3cb-4a90-a1fd-29cd9d2f6e5a.md` (goal, findings 1–8, question 1) and
  `fd8af3d0-d953-464b-9c9d-9675c438399e.md` (question 1 decided, question 2).
- Hub registry `~/.claude/hub/registry/4bd8c564-b370-43d3-aa7b-3d173fe69a18.last/`:
  `f888b356-79cf-4cf2-ba09-f7bdb696ecc8.md` (no spec, plan or code) and
  `cdf89b65-bcfe-42a3-b942-7439f80fd817.md` (proposal of a separate voice session).
- Hub spec `.claude/specs/2026-10-13-orchestrator-hub-design.md` §1, §2, §6.5, §8.2, §9.2 (S12).
