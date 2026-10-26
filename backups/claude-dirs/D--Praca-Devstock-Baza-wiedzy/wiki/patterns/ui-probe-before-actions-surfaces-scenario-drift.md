# ui-probe-before-actions-surfaces-scenario-drift

- **Skill:** kurs-nagrywanie
- **Typ:** sukces
- **Status:** otwarty

## Opis
A screenshot probe along the lesson's path, done to learn locators before writing new service actions, also
shows where the scenario disagrees with the application - before any dry pass and before the voice-over.

## Przyczyna źródłowa
The probe opens the same views the narration describes (output panel, node view, credential field) in the
real service. Reading its screenshots for locators puts the narration's claims next to the screen anyway; the
probe is an early, partial dry pass.

## Dowody
- 2026-10-11/12, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): probe 1 for M00L02
  (`sonda/02-n8n-bez-credentiala.mjs`, run before the new n8n actions existed) showed the JSON view without a
  `json` key and the credential field with "Sign in with Google" instead of a missing-credential message. The
  dry pass of take 1 the next day confirmed both as scenario disagreements (steps 3 and 8) and added step 4
  (Schema shows values).
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny), the converse case: lesson
  agenty-ai 1.2 needed new n8n actions (chat trigger, AI Agent sub-nodes, own Anthropic credential, chat message).
  They were written offline with stubbed `ctx` tests and no probe. The dry pass then stopped 11 times, once per
  wrong assumption about the UI:
  - "Chat" → "On new Chat event" sub-view;
  - "Gateway credits" instead of "Set up credential";
  - an unlabelled send button;
  - `/run` answering `waitingForWebhook` without an `executionId`.
  Round 1 also carried 8 scenario findings, all of the kind a probe would have shown. Without the probe, each
  disagreement costs a full run instead of one screenshot.
- 2026-10-20, sesja 240fd64b-d029-4c19-997c-a49301c018df (id claude.ai niedostępny), lesson agenty-ai 2.2: the
  `probe-ui` run for the new view-only `gmail` service
  (`kursy/agenty-ai/_nagrywanie/sondy/probe-ui-gmail-2026-10-20T18-30-03-574Z/`) found data drift rather than UI
  drift. The course inbox held 24 messages:
  - newest first, Google security alerts (one per n8n OAuth grant);
  - newsletters;
  - an Anthropic receipt with a PDF invoice;
  - the lesson messages at the bottom.
  The Gmail tool "Get Many" with Limit 10 would have returned non-lesson mail in 2.1 and 2.2, and the invoice
  could have reached the screen. This came out before any dry pass. Rafał chose manual cleanup (variant A),
  recorded as a row in the 2.2 konspekt preparation table. Opening "Utwórz" during the probe also left an empty
  draft "(brak tematu)" on the account.
- 2026-10-24, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny), plan 4 account window
  of `nagrywanie-autonomy-gates`, both cases in one window:
  - Converse: `send_mail` (compose window of the sender account) ran on provisional locators with no DOM probe.
    Three runs stopped before „Wyślij”, and each cost one `executions` of the 2.2 ticket:
    - the To candidate;
    - Gmail's address suggestion list covering Subject until Tab;
    - the pre-send check's recipient field („Adresaci w polu Do/DW/UDW”).
  - Probe: one read-only DOM probe of the open compose window (`sonda --script`, `read_attribute` on
    `div[role="dialog"]`) gave the To field, the recipient labels and the absence of `[email]` in an empty window
    at once.
  - Success case in the same window: Rafał's `probe-ui` click on the reply's own menu came before any automated
    delete ran. It named the per-message menu („Więcej opcji wiadomości”) and the item („Usuń”,
    `li[role=menuitem]`); those locators replaced the provisional ones in `5d9c076c` without a stopped run.

## Rozwiązanie
In `/kurs-nagrywanie`, when a lesson needs new service actions, run the locator probe along the whole lesson
path with screenshots, and list every narration claim a screenshot contradicts as a candidate finding for the
dry pass report (step 4), with the probe screenshot as evidence until the dry pass confirms it. List data-state
findings the same way: what the account holds, not only how the UI looks. They need a preparation-table row,
not a scenario change. Also list what the probe itself left on the account (e.g. an empty draft).
