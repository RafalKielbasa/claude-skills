---
name: hub-session-names-not-ids
description: "In hub reports, refer to sessions by working names (e.g. \"Lekcja 1.4\", \"Daily\", \"Hub-voice\"), not by session ids"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0cad80df-d883-44d9-9e37-8dd371befcf1
  modified: 2026-10-28T11:42:23.409Z
---

In the hub's replies to Rafal, name each session by a short working name derived from its work ("Lekcja 1.4", "Biblioteka komponentów", "Daily", "Hub-voice", "X przebiegu 2"), not by its id. Ids appear only inside commands Rafal pastes (`claude attach <id>`) and inside `<details>`. When a new session appears, pick a working name from its topic and give the name ↔ id pairing once, in the first report about it. Overview titles are often technical (e.g. `m02l01-agenty-lesson-status` for lesson 2.1), so they are not used verbatim as names. Auto-names like `baza-wiedzy-36` (the `name` of a CLI session in `claude agents --json`) are invisible to Rafal: on 2026-10-28 he could not find "baza-wiedzy-36", which was his `/daily` session in a VS Code terminal. Derive the working name from the session's first prompt (in its transcript) or its last message before the first report, and say where it runs (VS Code terminal, desktop app, background).

**Why:** Rafal asked (2026-10-21) for something other than session ids in the hub's statements; ids made the reports hard to read. He chose variant A, which included saving this rule here.

**How to apply:** Every hub report, the ⏸ marker included. SendMessage addressing is unaffected: it still uses the `to` printed by `HUB prepare`. Related: [[hub-wyslij-not-a-variant]], [[hub-confirm-hub-name]].
