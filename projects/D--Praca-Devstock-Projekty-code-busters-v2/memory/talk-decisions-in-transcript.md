---
name: talk-decisions-in-transcript
description: "When a /talk closing report shows decisions.md \"(not written)\", the decisions are in transcript.md of the dialog dir — read it before re-asking"
metadata:
  node_type: memory
  type: feedback
  originSessionId: cb3c4d8b-6df5-4173-a576-fddc871eb667
  modified: 2026-11-19T11:50:58.665Z
---

The `/talk` fork's write of `decisions.md` (and `prompt.md`) is refused by permissions in this repo (seen 2026-11-17, landing redesign, and 2026-11-19, DT-129), so the closing report says `(not written)` even when Rafał settled and confirmed decisions by voice. The decisions and his spoken order are in `transcript.md` in the dialog directory named on the report's `dialog:` line (`C:\Users\rafal\hub-data\projects\code-busters\dialogs\<stamp>-talk\`). Rafał calls it the „konspekt rozmowy”.

**Why:** on 2026-11-19 I re-asked D5/D6 after the report showed nothing; Rafał answered „Decyzje są w konspekcie rozmowy”.

**How to apply:** after a `/talk` report with empty decisions, read `transcript.md` (accept the permission prompt) and act on the confirmed decisions ("Potwierdzasz?" → „Tak”); outward steps (push, Fly, PlanetScale, tickets) still wait for his word in text.
