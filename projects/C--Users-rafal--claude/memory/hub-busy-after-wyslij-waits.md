---
name: hub-busy-after-wyslij-waits
description: "after Rafal's \"wyślij\", a busy target (prepare check 5) means wait for its turn end and re-run prepare without asking again"
metadata:
  node_type: memory
  type: feedback
  originSessionId: f9114d21-ee8b-4259-8692-de26b1bf5d51
  modified: 2026-10-24T15:30:29.936Z
---

When `HUB prepare` fails on check 5 (target session busy) for a message Rafal already approved with "wyślij", do not ask "czekać na koniec tury czy wysłać teraz?". Default to waiting: when the watcher reports that session's `turn ended` or a wait, run `HUB prepare <id>` again and send if it passes. Ask only when the message is urgent enough that cutting into the running work is worth it (`--confirm-busy`). Any new failure from the repeated `prepare` still goes back to Rafal.

**Why:** 2026-10-24 a voice-dialog order to "Stan prac nad hub" sat as `approved` for 9+ hours: the hub asked the busy question, the question got buried under watcher reports, and the target session idled waiting for a send Rafal had already approved. Rafal: „Miałeś wysłać wiadomość, co się z nią stało”, then chose this rule.

**How to apply:** after a check-5 failure, tell Rafal in one line that the send waits for the session's turn end; on that session's next `turn ended` / `waiting for …` event, re-run `prepare` before anything else in that event. Related: [[hub-wyslij-not-a-variant]].
