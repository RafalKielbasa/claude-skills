---
name: hub
description: Use in the hub session — a Claude Code session, in a VS Code panel or a terminal, whose working directory is ~/.claude/hub, where ~/.claude/hub/CLAUDE.md gives it the hub role — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, launch new sessions from the project map, start dialog forks, consult Codex, and track delivery. Not for project sessions themselves.
---

# Hub

The hub watches other Claude Code sessions through a registry that a global hook fills, and sends
them messages only after Rafal approves the exact text. Design: `D:/Notatki/notatki/.claude/specs/2026-10-13-hub-core-design.md`.

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
   arm it again with the same parameters. The watcher's events are never Rafal's answers. The
   watcher stops by itself when this session's `claude` process ends (spec §5.5, P14); if it
   prints "watcher: no claude process among its ancestors", tell Rafal that it will outlive this
   session until its `Monitor` timeout.

## A watcher event

1. `HUB confirm` (delivery evidence), then `HUB overview --no-poll`. When `confirm` lists a record
   in `mismatched`, tell Rafal that the session received a hub message whose text differs from the
   approved one, quote the journal line (`HUB journal --project <p>`), and never offer a resend of that record.
2. For `turn ended`: read the file printed by `HUB last <sessionId>` and judge whether the last
   message waits for Rafal ("prawdopodobnie czeka na Ciebie") or is a finished result. Record the
   judgment with `HUB judge <sessionId> --verdict question` or `--verdict other`, so the overview
   shows "probably waiting for you" until the session's next turn.
3. For `waiting for decision`, `waiting for permission`, `problem`: say which session and what it
   waits for. Gates and permission prompts are answered by Rafal in that session, never by the
   hub on its own; a draft Rafal approves may answer a decision gate through Sending below (U1).
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
     `HUB prepare <id>` again; it repeats all checks, and any new failure goes back to Rafal;
   - check 6 is a notice, not a failure (spec §6.2, U1): `prepare` prints `warnings` with the wait
     and the gate text, on success and next to failures. Send on the one "wyślij" from step 2 and
     quote the notice to Rafal with the send result; a session waiting for permission is also
     busy (check 5), so its message queues until Rafal answers the prompt in that session.
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
5. `HUB launch <id>`, through Bash with `timeout: 600000`: a launch may take up to 120 s plus
   polls, more than the default Bash timeout. Failures: quote them and stop. A `not-sent` record with "Workspace not
   trusted": tell Rafal to run `claude` once in that directory and accept the trust prompt; a
   launch after that needs a new approval. Never launch again on your own. An output with
   `unknown: true` means the launch outcome is unknown (a timeout, or no `backgrounded` line) and
   a session may exist: tell Rafal, run `HUB confirm`
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

## Dialog through a fork (spec §6.5)

1. Rafal says "omówmy wynik sesji X". Pick a kebab-case slug and run
   `HUB dialog start --session <X> --slug <slug>` through Bash with `timeout: 600000` (a launch
   may take up to 120 s plus polls). Then, by its output:
   - `candidates` with several ids: ask Rafal which session, then run `HUB dialog start` again
     with the chosen id; with none: X is not live under its name, tell him so;
   - `twins` not empty: other live sessions carry the same name; tell Rafal that the fork started
     from `sourceSessionId` and name the twins;
   - `resolvedFrom` set: X restarted, and the fork starts from the live session `sourceSessionId`;
   - `busy: true`: the fork sees X's history up to the running tool call, without its result (one
     sample, D7);
   - a failure with `command`: quote the error and give Rafal the command to paste into a new
     Git Bash tab (it uses `cd`, `&&` and `$(cat …)`); never start the fork again on your own.
   - `unknown: true`: the launch outcome is unknown (a timeout, or no `backgrounded` line) and the
     fork may run; tell Rafal, look for `dlg-<key>-<slug>` in the overview, and never start it again on your own.
   - `sessionId: null`, or a fork Rafal started by hand with `command`: once `claude agents --json`
     lists it (for a fork started by hand, its short id is the `id` of the entry named `<name>`),
     register it with `HUB register --session <short id> --kind dialog --project <key> --name <name>`,
     where `<key>` is the folder after `projects/` in the dialog directory. `HUB register` refuses
     a session the poll does not list yet.
2. Tell Rafal the dialog directory and `claude attach <shortId>`: he talks to the fork there.
3. "odśwież kontekst": `HUB dialog refresh --dir <dialog dir>`.
4. When the watcher reports the fork `waiting for decision` with "prompt gotowy do przeglądu", ask
   Rafal to review `<dialog dir>/prompt.md` in the editor.
5. When he says it is ready: `HUB compose --path dialog --session <sourceSessionId> --origin dialogs/<dir name> --body-file <dialog dir>/prompt.md`,
   then steps 2–6 of Sending (full draft, "wyślij", approve, prepare, SendMessage, result,
   confirm).
6. After the send, stop the fork with `claude stop <shortId>`; the dialog directory stays. Show
   X's next result when its turn ends.

## Voice conversation about a session (voice spec §19)

The voice twin of the dialog above. Design: `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md`,
§19. The talk CLI runs the conversation and its fork; X stays untouched until Rafal sends the
result. A plain `/talk` typed in the hub is not this procedure: it talks about the hub session itself.

1. Rafal says "porozmawiajmy głosem o <X>" or "omówmy głosem wynik sesji X". Pick X from the
   overview as in the dialog path.
2. `HUB voice resolve --session <X>`. It launches nothing. By its output, as in the dialog path:
   - `candidates` with several ids: ask Rafal which session, then run `HUB voice resolve` again
     with the chosen id; with none: X is not live under its name, tell him so;
   - `twins` not empty: other live sessions carry the same name; tell Rafal that the conversation
     is about `sessionId` and name the twins;
   - `resolvedFrom` set: X restarted, and the conversation is about the live session `sessionId`;
   - `busy: true`: tell Rafal that the voice fork sees X's history up to the running tool call,
     without its result;
   - `transcriptExists: false`: refuse. X has no transcript file (`transcriptPath`), so no fork can
     resume it; tell Rafal so and stop.

   `<sessionId>`, `<cwd>` and `<name>` below are `sessionId`, `cwd` and `name` of this output. The
   `cwd` comes from X's hook events first, so a worktree session's fork starts in its worktree.
3. `node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" check --cwd "<cwd>" --session <sessionId>`.
   - Exit 2 prints one Polish sentence (for example a project outside the allowlist): quote it
     verbatim and stop.
   - `live` in the output: a voice dialog of X is already open; never start a second one. Run
     `node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" reopen --session <sessionId>`, tell
     Rafal that its page opened again, and stop; its report goes to whoever started it
     (`live.origin`).
4. `node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" start --session <sessionId> --cwd "<cwd>" --origin hub --name='<name>' [--subject='<subject>']`
   (leave out `--name` when `name` is null; the page then shows the short id; add `--subject` only
   when Rafal gave a subject for the conversation). `name` replaces `<name>` and his subject
   replaces `<subject>`, each with every single quote (`'`) removed: the single quotes keep `$`,
   backticks and backslashes literal, and the `=` form takes a value that starts with `-`. Run it
   through Bash with `run_in_background: true`. The task runs for the whole conversation, which
   may pause and rejoin; do not wait for it or poll its output. Tell Rafal that the page opens in
   the browser. The bridge never wakes X, and X never reads the dialog.
5. When the task completes, read the closing report from its output, between `TALK CLOSING REPORT`
   and `END OF REPORT` (`dialog:`, `origin:`, `deletion:` and `conversations:` lines, then the
   dialog's files):
   - show the decisions (`--- decisions.md ---`) and the open questions
     (`--- open-questions.md ---`) as Polish tables, the length of each call (`conversations:`, in
     minutes and seconds) and every deletion problem on the `deletion:` line;
   - if the dialog directory (the `dialog:` line) holds a `prompt.md` (its section is not
     `(not written)`): `HUB compose --path dialog --session <sessionId> --origin voice/<dialog dir name> --body-file "<dialog dir>/prompt.md"`,
     then steps 2–6 of Sending (full draft, "wyślij", approve, prepare, SendMessage, result,
     confirm);
   - without a `prompt.md`, nothing is sent;
   - a task that ended without a report: show Rafal the last lines of its output and the
     `dialog:` line, and stop.

## Codex consultation (spec §7)

1. Rafal says "odbij od Codexa <element>: <pytanie>". The element is a session's last result
   (`--last <sessionId>`), a dialog's `prompt.md` or `decisions.md` or a repository file
   (`--file <path>`), or the diff of a session's branch (`--diff <range>`, for example
   `main..HEAD`). `--session <sessionId>` names the session the element belongs to, and Codex runs
   in its `cwd`; without a session pass `--cwd <dir>`.
2. Run it in the background (Bash with `run_in_background: true`), the question on stdin:
   `HUB codex ask --session <id> --slug <slug> --last <id> --question-file - <<'EOF'` … `EOF`.
   There is no "wyślij" step: Codex only reads. The CLI runs Codex without Rafal's Codex hooks,
   plugins, apps and MCP servers (spec §7, P13); an answer about something other than the question
   (for example a review reminder) is assessed as off-topic, not as an answer.
3. A refusal for a denylisted name, or for a file outside the repository and the hub data: ask
   Rafal; never paste or point at such a file another way.
4. When it finishes with `ok`, read `answerFile`, show the answer verbatim, then a table: uwaga,
   ocena huba, uzasadnienie. Record that table with
   `HUB codex note --thread <thread> --text-file - <<'EOF'` … `EOF`. A `warning` means the thread
   has no id: say that a follow-up is impossible there. On a failure say "brak drugiej opinii" and
   quote `failure`; the `.err` file stays; never run it again on your own.
5. "Codex, <pytanie>": `HUB codex follow --thread <thread> --question-file - <<'EOF'` … `EOF`, also
   in the background, then step 4. One follow-up per thread at a time: wait for its result before
   the next `codex follow` on the same thread (both would take the same call number in `meta.json`).
6. A conclusion reaches `decisions.md` or a prompt only after Rafal confirms it.

## Boundaries

- Write only through `HUB` into `~/.claude/hub/`; a voice conversation's dialog directory is
  written by the talk CLI in its own dialog root. Never edit project repositories or this skill.
- Start sessions and forks only with `HUB launch` and `HUB dialog start`, after the steps above;
  start a voice fork only through the talk CLI (`talk.mjs start --origin hub`), after
  `HUB voice resolve`. Stop a fork only with `claude stop <shortId>` after its prompt was sent or
  Rafal asked.
- A voice decision is never „wyślij”: a voice dialog's `prompt.md` reaches X only through Sending,
  after Rafal typed "wyślij" in the hub.
- Never answer gates or permission prompts of other sessions.
- If a name matches several live sessions, stop and ask Rafal; SendMessage addresses by name.
- Quote errors literally; never retry on your own.
