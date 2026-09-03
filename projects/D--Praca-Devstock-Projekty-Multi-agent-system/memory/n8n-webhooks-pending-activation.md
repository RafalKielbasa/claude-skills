---
name: n8n-webhooks-pending-activation
description: "Dwa webhooki n8n wymagają aktywacji/importu, żeby zapis wiedzy i tworzenie zadań w aplikacji działały"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0d102646-0afb-4966-bf6c-ed9a20a84072
---

Diagnoza 2026-07-15: błędy 404 "webhook not registered" przy zapisie do bazy wiedzy i tworzeniu zadań w aplikacji `company-agent-chat` mają dwie różne przyczyny po stronie n8n.

**1. `index-knowledge-entry` (workflow `26_index_knowledge_entry`)** — webhook istnieje, ale workflow 26 nie jest aktywny/zaimportowany w działającej instancji n8n. Fix: otworzyć wf 26 w n8n → Active ON (uwaga: `"active": true` w pliku JSON nie aktywuje po imporcie). Jeśli aktywacja się wywala — brak credentiali na węzłach PGVector Insert (Postgres) / Embeddings Google Gemini. Aktywacja workflow "app router" (wf 22) NIE rejestruje tego webhooka — każdy webhook rejestruje jego własny workflow.

**2. `create-task-issue` (workflow `32_create_task_issue`)** — webhook nie istniał wcale (feature nigdy nie spięty end-to-end: kod wołał `/webhook/create-task`, test oczekiwał `/webhook/tasks`, plan mówił `/webhook/create-task-issue`). Zbudowany 2026-07-15 nowy workflow `workflows/32_create_task_issue.json` (webhook → Build Fields → Create Issue w devstock-org/devstock-team → Set Labels → Respond). Kod `lib/tasks-create.ts` przepięty na `N8N_TASKS_CREATE_URL` (pełny URL, Basic auth przez `AGENT_API_KEY`), testy zielone (50/50), tsc czysty. **Kroki manualne do wykonania w n8n:** import wf 32 → Active ON → przypisać credential Basic Auth (webhook) + GitHub API (Create Issue, Set Labels) → ustawić `N8N_TASKS_CREATE_URL=<host>/webhook/create-task-issue` w `.env`. Etykiety domen (dev/marketing/product/sales/company/other) i rozmiaru (size/S..XL) muszą istnieć w repo GitHub, inaczej PUT labels zwraca 422 (Issue i tak powstaje — węzeł ma `onError: continueRegularOutput`).

Powiązane: [[project-dimension-rollout]], [[course-content-pipeline]].
