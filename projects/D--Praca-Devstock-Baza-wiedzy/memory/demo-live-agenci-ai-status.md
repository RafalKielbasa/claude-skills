---
name: demo-live-agenci-ai-status
description: "Demo live 27.08 — spec, plan i assety repo gotowe (2026-08-13); egzekucja środowiskowa ręcznie po stronie Rafała wg planu, Claude wspiera przy problemach"
metadata: 
  node_type: memory
  type: project
  originSessionId: 75e0f82a-c311-41c8-ab24-dd10b6e28ec7
  modified: 2026-08-13T13:42:34.031Z
---

Stan na 2026-08-13: projekt dema live'a „Agenci AI" (27.08.2026) domknięty
na poziomie dokumentów i assetów, wszystko jako niezacommitowane zmiany:

- Spec: `docs/superpowers/specs/2026-08-13-demo-live-agenci-ai-design.md`
- Plan (17 tasków, 18 uwag z review codex wcielonych):
  `docs/superpowers/plans/2026-08-13-demo-live-agenci-ai.md`
- Assety: `demo/live-agenci-ai/` (prompty, seedy, runbooki, README)

Kluczowe decyzje Rafała: osobna instancja **n8n Cloud na świeżym koncie**
(nie Docker, nie firmowy system), **czysty ekosystem Google** (Calendar +
Tasks + Dysk jako baza wiedzy), **bez bazy wektorowej** (akt 2 = search/read
dokumentów z Dysku), interfejs **wyłącznie Telegram**, akt 3 = trzy
przygotowane opcje (głos ElevenLabs / poranne podsumowanie / follow-up
Gmail) + Claude Code z MCP `n8n` i `n8n-backup`.

Tryb egzekucji (wybrany przez Rafała): taski środowiskowe (n8n Cloud,
konta Google, BotFather) robi Rafał ręcznie wg planu; Claude generuje
artefakty repo i pomaga przy problemach. Scenariusz słowny live'a (hook,
pitch) jest POZA planem — osobna praca merytoryczna.

Powiązane: [[baza-wiedzy-wdrozenie-task-12]], [[nie-commituj-rafal-sam]].
