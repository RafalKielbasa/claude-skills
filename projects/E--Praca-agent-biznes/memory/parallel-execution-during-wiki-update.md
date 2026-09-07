---
name: parallel-execution-during-wiki-update
description: "Rafał runs plan execution in a separate terminal/session while this session does podsumuj-sesja-claude's wiki step"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4b3be4e5-2ae1-428f-bfa2-2d8e43aa4bc3
  modified: 2026-09-07T06:43:59.088Z
---

Rafał's standard pattern: while this session runs the wiki-update step (Step 5) of `podsumuj-sesja-claude`, he starts the next piece of work — e.g. `superpowers:subagent-driven-development` executing a plan — in a **separate terminal/session**, running concurrently.

**Why:** the wiki update takes a while, and running it in the current session while a separate session executes the next task saves context in the main session instead of spending it waiting.

**How to apply:**
- During the wiki step, concurrent file changes in the repo (source files, `.superpowers/sdd/*/progress.md`, even the wiki files themselves) are expected, not anomalous — don't treat them as a sign something is wrong. This is exactly the situation [[plik-zmieniony-miedzy-odczytem-a-edycja]] describes; keep applying its fix (re-read before edit, re-read immediately before a whole-file rewrite).
- Don't wait for or block on the wiki step before telling Rafał a plan is ready to execute — he may already be running it elsewhere by the time the summary finishes.
- When resuming a session, check `git status` and the relevant `.superpowers/sdd/<plan>/progress.md` before assuming the state described in the last session brief is still current — a parallel session may have advanced it since the brief was written.
