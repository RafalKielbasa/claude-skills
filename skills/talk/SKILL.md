---
name: talk
description: Use when Rafal types /talk (optionally followed by a subject) or asks to talk about the current session by voice. Opens a Polish voice conversation in the browser through the ElevenLabs agent, with a restricted fork of this session answering behind it, and afterwards acts on the decisions recorded in that conversation.
---

# talk

A voice conversation about this session (spec `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md`, §5).
The CLI does the work: it checks the project, starts the bridge, which starts a restricted fork of this
session and opens the page, and prints a closing report when the conversation ends. You run two
commands (or one, to reopen a live dialog) and act on the report.

`<session cwd>` below is this session's working directory (the primary working directory of your
environment), in double quotes. Run the commands with the Bash tool.

## Steps

1. **Check, in the foreground:**

   ```
   node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" check --cwd "<session cwd>" --session ${CLAUDE_SESSION_ID}
   ```

   - Exit 0 prints `{"ok":true,"project":"<key>"}`: go on to step 2.
   - Exit 0 with `"live":{"dir":"<dialog dir>","origin":"session"|"hub"}` added: this session already
     has a live dialog, so do not start a second one. Reopen its page, in the foreground:

     ```
     node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" reopen --session ${CLAUDE_SESSION_ID}
     ```

     Exit 0 prints `{"ok":true,"dialog":"<dir>","origin":"..."}`: end the turn with the status line
     „Rozmowa głosowa ponownie otwarta w przeglądarce.” and skip steps 2 and 3. For `origin: hub`
     (the dialog was started from the hub) add that the conversation's report goes to the hub, not to
     this session. Exit 2 prints one Polish sentence: show it verbatim and stop.
   - Exit 2 prints one Polish sentence (project not on the allowlist, no `ELEVENLABS_API_KEY`, no
     agent): show Rafal that sentence verbatim and stop. Do not work around it.
   - Any other exit: show Rafal the error output and stop.

2. **Start, in the background** (Bash with `run_in_background: true`):

   ```
   node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" start --session ${CLAUDE_SESSION_ID} --cwd "<session cwd>" [--subject='<subject>']
   ```

   Add `--subject` only when Rafal gave a subject with `/talk`: his subject replaces `<subject>`, with
   every single quote (`'`) removed. The single quotes keep `$`, backticks and backslashes literal,
   and the `=` form takes a subject that starts with `-`.
   The task runs for the whole conversation; do not wait for it and do not poll its output.

3. **End the turn.** Its status line (the one-sentence status of Rafal's reply protocol) is „Rozmowa głosowa otwarta w przeglądarce.”

   The conversation is a dialog of several calls. It pauses on breaks and stays open: the task
   completes only when Rafal ends the conversation on its page, or when the pause limit
   (`pauseLimitMinutes` in `config.json`, 60 minutes by default) passes.

   If Rafal says the tab did not open, run the `reopen` command from step 1.

4. **When the task completes** (you are woken by the end of the background task), read the closing
   report from the task's output, between `TALK CLOSING REPORT` and `END OF REPORT`. Read it from the
   output, not from the dialog files: reading the dialog directory from this session may raise a
   permission prompt.
   - Show Rafal the decisions (`--- decisions.md ---`) and the open questions
     (`--- open-questions.md ---`) as short Polish tables. `(not written)` means there are none.
   - The `deletion:` line: its first segment (before the first `;`) is the deletion result:
     `deleted`, `no conversation id`, or `<conversation id> failed: <reason>`. A further segment of
     the form `<conversation id> failed: …` is another failed deletion; every other further segment is
     an end-step note (a fork or transcript problem): tell Rafal each one. For every failed deletion,
     tell Rafal which conversation stays at ElevenLabs (its id, also listed on the `conversations:`
     line).
   - The `conversations:` line lists every ElevenLabs conversation, one per call, as `<id> (<n> s)`, or
     `<id> (unknown)` when its length could not be read (`none`: no conversation was started). Tell
     Rafal the call length of each, in minutes and seconds, and the total: he pays per minute.
   - If `--- prompt.md ---` holds a prompt, carry it out under this repository's own rules (commits,
     tickets, gates as the repository's `CLAUDE.md` and Rafal's global rules say). If it shows
     `(not written)`, go on with the decisions from where you were before `/talk`.
     If this session had turns of its own between the start and the report (Rafal kept working here
     during the dialog), do not carry out `prompt.md` at once: show Rafal the order next to what this
     session did since, and wait for his word in text.
   - Push, tickets, GCP, a new dependency and anything else outward wait for Rafal's word in text,
     even when the conversation decided them, when `prompt.md` orders them, and in a repository
     whose own rules push without asking (the vault „Notatki”): a voice decision is never that word.
     Stop before the first such action, say what is ready, and ask.
   - If the task ended without a report (an error exit), show Rafal the last lines of its output and
     the `dialog:` line, and stop.

   To talk again after the report, start a fresh conversation with a new `/talk`. While a conversation
   is still open, `/talk` only reopens it: to get a fresh one, Rafal must end the open conversation on
   its page first.
