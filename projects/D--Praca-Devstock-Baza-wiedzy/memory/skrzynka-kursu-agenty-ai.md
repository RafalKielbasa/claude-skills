---
name: skrzynka-kursu-agenty-ai
description: "Course Gmail mailbox of agenty-ai fills with non-lesson mail (Google security alert after every n8n OAuth grant, newsletters, receipts); Rafał empties it by hand before the takes of module 2 (decision 2026-10-20)"
metadata:
  node_type: memory
  type: project
  originSessionId: 240fd64b-d029-4c19-997c-a49301c018df
  modified: 2026-10-20T18:57:30.639Z
---

Gmail probe of 2026-10-20 (lesson 2.2, issue #721): the course mailbox had 24 messages in the inbox. The newest were Google "Alert bezpieczeństwa" mails (one per OAuth grant to n8n.cloud, so every take that creates a Google credential on screen adds one, e.g. lesson 2.1 step 12), Pinecone and Claude newsletters and an Anthropic receipt with a PDF invoice. The lesson messages sat at the bottom. Sent held 3 test mails of lesson 2.3 from 2026-09-16; opening "Utwórz" in a probe window leaves an empty draft "(brak tematu)".

**Why:** the Gmail tool node "Get Many" with Limit 10 returns the ten newest messages (assumed, not verified in n8n's code: without a label filter it reads all mail except spam and trash, sent and archived included), so non-lesson mail breaks the narration of 2.1 and 2.2 and an invoice could land on a recording.

**How to apply:** Rafał chose to clean the mailbox by hand (variant A, no auto-delete filter): before the 2.1 take everything except lesson messages goes to trash and the trash is emptied; before the 2.2 take the alert added by the 2.1 take goes too. The automation never deletes mail (gmail service is view-only). Check the mailbox in the preparation gate of every module-2 dry pass and take. Related: [[kolejka-konta-kursu-status]].
