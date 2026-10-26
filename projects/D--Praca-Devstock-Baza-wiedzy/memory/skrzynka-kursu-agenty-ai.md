---
name: skrzynka-kursu-agenty-ai
description: "Course Gmail mailbox of agenty-ai fills with non-lesson mail (Google security alert after every n8n OAuth grant, newsletters, receipts); since plan 3 the mailbox is start state - the ticket reset deletes the rest and send-mail sends lesson mails; the 2026-10-20 manual-cleanup decision is superseded"
metadata:
  node_type: memory
  type: project
  originSessionId: 240fd64b-d029-4c19-997c-a49301c018df
  modified: 2026-10-26T15:21:33.038Z
---

Gmail probe of 2026-10-20 (lesson 2.2, issue #721): the course mailbox had 24 messages in the inbox. The newest were Google "Alert bezpieczeństwa" mails (one per OAuth grant to n8n.cloud, so every take that creates a Google credential on screen adds one), Pinecone and Claude newsletters and an Anthropic receipt with a PDF invoice; the lesson messages sat at the bottom. The Gmail tool node "Get Many" with Limit 10 returns the ten newest, so non-lesson mail breaks the narration of 2.1 and 2.2.

On 2026-10-20 Rafał chose manual cleanup (variant A). That is superseded for ticket lessons: plan 3 of `nagrywanie-autonomy-gates` made the mailbox start state (spec 2026-10-21, section 10 "Mailbox as state"). The ticket reset deletes everything outside `start_state.gmail` and empties the trash, and `send-mail` sends the lesson mails from the sender account (`kurs.yaml` `gmail.sender_account`). The 2.2 mails went out at the plan 4 account window (2026-10-24). Lesson files carry no e-mail addresses: the `devstockspzoo@…` sender named in the 2.1/2.2 konspekts is not the configured sender (finding P30 of the plan 3 acceptance).

**Why:** a session that remembers only the 2026-10-20 decision tells Rafał to clean the mailbox and send mails by hand, as this session did on 2026-10-22, while the automation does both.

**How to apply:** for a ticket lesson, never hand Rafał mail texts or a cleanup procedure; follow `/kurs-nagrywanie`, section "Poczta lekcji". Lesson 2.2 is run by the module-2 session (worktree `baza-wiedzy-agenty-ai-modul-2-bilet`, decision Rafał 2026-10-26). Related: [[nagrywanie-autonomy-gates-status]], [[kolejka-konta-kursu-status]].
