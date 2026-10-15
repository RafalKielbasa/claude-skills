---
name: hub
description: Use in the hub session — the Claude Code session started with `claude --name hub --append-system-prompt-file <skill>/role.md` in ~/.claude/hub — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, and track delivery. Not for project sessions themselves.
---

# Hub

The hub watches other Claude Code sessions through a registry that a global hook fills, and sends
them messages only after Rafal approves the exact text. Design: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md`.

`HUB` below means `node "C:/Users/rafal/.claude/skills/hub/bin/hub.mjs"`. Every command prints
plain text or JSON; quote its output literally when Rafal decides on it. Talk to Rafal in Polish.

## Start (also after /clear)

1. `HUB cleanup` (retention, spec §8.2).
2. `HUB confirm` (delivery evidence that arrived while the hub was away), then `HUB overview` and
   show the table. A record the journal shows as `delivery-unknown` stays so until evidence or a
   notice arrives; time never decides it. The Session column shows the conversation title; the
   session's address for `SendMessage` is the `to` that `HUB prepare` prints, never the title.
3. Arm the watcher: `Monitor` with `timeout_ms: 1800000`, `description: "hub watcher"`, command
   `node "C:/Users/rafal/.claude/skills/hub/bin/hub-watch.mjs"`. When its expiry notice arrives,
   arm it again with the same parameters. The watcher's events are never Rafal's answers.

## A watcher event

1. `HUB confirm` (delivery evidence), then `HUB overview --no-poll`. When `confirm` lists a record
   in `mismatched`, tell Rafal that the session received a hub message whose text differs from the
   approved one, quote the journal line (`HUB journal --project <p>`), and never offer a resend of that record.
2. For `turn ended`: read the file printed by `HUB last <sessionId>` and judge whether the last
   message waits for Rafal ("prawdopodobnie czeka na Ciebie") or is a finished result. Record the
   judgment with `HUB judge <sessionId> --verdict question` or `--verdict other`, so the overview
   shows "probably waiting for you" until the session's next turn.
3. For `waiting for decision`, `waiting for permission`, `problem`: say which session and what it
   waits for. Gates and permission prompts are answered by Rafal in that session, never here.
4. Tell Rafal in the hub tab; when he is away, also use `PushNotification`.

## The project map (spec §4.2)

`HUB projects` prints the map: key, name, directory and description of each project, the projects
seen in the registry outside the map, and the map's errors. When Rafal names a project in his own
words, match them against the names and descriptions; when more than one entry fits, or none,
ask him. Rafal edits `~/.claude/hub/projects.json` himself; never write it.

## Sending (direct command, questionnaire request, questionnaire answers)

1. Compose, passing every body on stdin with a quoted heredoc (never create body files with Write
   or Edit): `HUB compose --path direct --session <sessionId> --body-file - <<'EOF'` … `EOF`, or
   `HUB compose --path questionnaire-request --session <sessionId> --topic "<temat>" --max <n>`,
   or `--path questionnaire-answers --session <sessionId> --body-file - <<'EOF'` … `EOF`. Every body, also a short direct command,
   has the sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia** and
   **Oczekiwany rezultat** (spec §6.1); the questionnaire request gets them from its fixed
   wording. The command prints the draft path.
2. Show Rafal the exact draft text (read the file, quote it in full, header line included). Wait
   for "wyślij". Any other answer is not approval.
3. `HUB approve --session <sessionId> --path <path> --text-file <draft>` → record id.
4. `HUB prepare <id>`. If it prints failures, quote them and stop. Then, per check:
   - check 1 with candidates: show the candidate ids and wait for a new approval; never re-target
     on your own;
   - check 3: run `HUB confirm` first. A `held` message is never resent. For `delivery-unknown`,
     tell Rafal that no delivery evidence exists and ask whether to send the text again; only
     after his explicit yes run `HUB prepare <id> --confirm-resend`. If `confirm` listed the record
     in `mismatched`, tell Rafal that the session received a hub message whose text differs from
     the approved one, quote the journal line, and do not offer a resend;
   - check 5 (busy): ask "czekać na koniec tury czy wysłać teraz?". "Teraz": say that the message
     cuts into the running work between tool calls, then `HUB prepare <id> --confirm-busy`.
     "Czekać": when the watcher reports that session's turn ended (or a wait), run
     `HUB prepare <id>` again; it repeats all six checks, and any new failure goes back to Rafal;
   - check 6: send only after Rafal confirms again, then `HUB prepare <id> --confirm-waiting`.
5. `SendMessage` with `to` = the `to` name printed by prepare and `message` = the draft text
   exactly. Then `HUB result <id> --msg-id <msg_id from the tool result>`, or on a tool error
   `HUB result <id> --error "<literal error>"`.
6. Tool success is not delivery. The record becomes `sent` only through `HUB confirm`.

## A `[Cross-session delivery notice]`

Run `HUB notice --text "<the notice, verbatim>"` and tell Rafal the resulting state. If it fails with "no record with msg_id", the notice
arrived before `HUB result` stored the msg_id: run `HUB result <id> --msg-id <msg_id>` for the record
just sent, then run `HUB notice` again. While a
message is `held`, do not resend it.

## Questionnaire path (spec §6.4)

1. Send a questionnaire request (above).
2. When the watcher reports `waiting for decision` for that session, read its last message and
   show the questions.
3. Rafal answers all of them at once.
4. Compose the answers with the sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**,
   **Ograniczenia**, **Oczekiwany rezultat**, plus a block **Pytania i odpowiedzi** with the topic,
   each question, the chosen option and Rafal's answer. **Oczekiwany rezultat** says whether the
   session starts working or stops (for example "napisz plan i stop").
5. Send it with `--path questionnaire-answers` (above).

## New session (spec §6.6)

1. Rafal names a project and the work ("odpal sesję w <projekt>: <zadanie>", maybe "bez worktree").
   Match the project with `HUB projects`; ask when more than one entry fits or none does. A
   project outside the map gets no new session: ask Rafal to add it to the map.
2. Pick a short kebab-case slug for the work; the session will be named `<key>-<slug>`. Compose:
   `HUB compose --path new-session --project <key> --slug <slug> --body-file - <<'EOF'` … `EOF`,
   with the five sections. The CLI puts the project line from the map under **Kontekst**.
3. Show Rafal the exact draft, header included, and the launch parameters: the directory (the
   map's `dir`), the session name, and the worktree `<dir>/.claude/worktrees/<key>-<slug>` on the
   branch `worktree-<key>-<slug>`, or "bez worktree". Wait for "wyślij".
4. `HUB approve --path new-session --project <key> --slug <slug> --text-file <draft>` → record id.
   A new session runs in a worktree by default: a background session may not edit the shared
   checkout. Add `--no-worktree` only when Rafal said "bez worktree"; such a session moves into a
   worktree of its own naming at its first edit, which the hub does not know.
5. `HUB launch <id>`. Failures: quote them and stop. A `not-sent` record with "Workspace not
   trusted": tell Rafal to run `claude` once in that directory and accept the trust prompt; a
   launch after that needs a new approval. Never launch again on your own. An output with
   `unknown: true` means the launch timed out and a session may exist: tell Rafal, run `HUB confirm`
   later (it confirms the record if the session's first prompt arrives), never launch again on your own.
6. On success tell Rafal the session name, its short id, the worktree path and branch, and
   `claude attach <short id>`: he answers the session's permission prompts there himself. The
   session's work stays on its worktree branch until Rafal merges it. A `sessionId` of null means the session was not
   listed yet; `HUB confirm` registers it when its first prompt arrives.
7. `HUB confirm` makes the record `sent` when the session's first prompt carries the approved
   text. A record in `mismatched` means the session started with a different text: quote the
   journal line (`HUB journal --project <key>`) and do not launch again.
8. Further instructions go through the direct command path. Worktree cleanup is only proposed to
   Rafal, never run (spec §6.6): `claude rm <id>` after the session's process exited (retry once on
   `EBUSY`), removing a leftover directory by hand, `git branch -d worktree-<name>`; `-D` only after
   Rafal confirms that the branch's commits may be lost.

## Boundaries

- Write only through `HUB` into `~/.claude/hub/`. Never edit project repositories or this skill.
- Never answer gates or permission prompts of other sessions.
- If a name matches several live sessions, stop and ask Rafal; SendMessage addresses by name.
- Quote errors literally; never retry on your own.
