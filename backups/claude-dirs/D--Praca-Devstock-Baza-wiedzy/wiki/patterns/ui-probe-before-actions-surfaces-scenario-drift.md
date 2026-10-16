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

## Rozwiązanie
In `/kurs-nagrywanie`, when a lesson needs new service actions, run the locator probe along the whole lesson
path with screenshots, and list every narration claim a screenshot contradicts as a candidate finding for the
dry pass report (step 4), with the probe screenshot as evidence until the dry pass confirms it.
