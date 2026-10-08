---
name: n8n-prod-inwentaryzacja
description: "Stan n8n-prod po porządkach 2026-10-08 — co zarchiwizowane, co czeka (stary tor), co zostaje dla nowego toru spotkań, pułapki numeracji i retencji"
metadata:
  node_type: memory
  type: project
  originSessionId: 41a1e8b7-c5e2-4570-9e9d-57aefeb98e5e
  modified: 2026-10-08T09:02:32.294Z
---

Porządki na n8n-prod (MCP `n8n-prod`, projekt osobisty Rafała `jBR2URVfzyXQxOop`, team projects wyłączone) zrobione 2026-10-08 za zgodą Rafała: zarchiwizowano 13 workflowów — `32_manualy_sync_db`, `Chat with`, `Delete unnecessary trascription`, `Update notion task`, `Notion task agent`, `dev_agent`, `marketing_agent`, `sales_agent`, `product_agent`, `company_agent`, `Poranne podsumowanie z kalendarza`, `manual_update_vector_store` (miał 6 aktywnych triggerów Drive), `17_github_close_issue` (osierocony). Zostały 22.

- **Grupa A (nowy tor + zostaje):** `01`, `23_ask_knowledge_base`, `26`, `29`, `31`, `34_kb_ask`, `35_kb_admin`. `23` NIE jest w starym torze — woła go `34_kb_ask` i `31` (poranny podział z 2026-10-08 błędnie dał go do B).
- **Grupa B (stary tor — archiwizacja po tygodniu nowego toru, Task 7 planu n8n-side):** `07`, `15`, `16`, `20`, `21`, `22`, `24`, `25`, `27`, `28`, `30`, `33_create_task_issue`.
- **Grupa D (cudze, nie ruszać):** oba `Social Publish …`, `Reddit AI/Automation Digest` (ma jawny klucz Anthropic w nagłówku — do rotacji przez właściciela).

**Why:** plany w repo używają numeracji z `devstock-team-agent`, a prod ma inną: repo `32_create_task_issue` = prod `33_create_task_issue`, repo `33_kb_ask` = prod `34_kb_ask`; prod `32_manualy_sync_db` to coś innego. `14_github_create_issue`, `34`/`36` (radar) i `37`–`40` na prodzie nie istnieją (stan 2026-10-08).

**How to apply:**
- Przed Task 7 mapuj numery repo → prod po nazwie, nie po numerze.
- Historia wykonań na prodzie sięga ~10 h — brak wykonań nie dowodzi nieużywania; decyduj po wywołujących i triggerach. `updatedAt` wszystkich workflowów = 2026-10-08T04:56 (operacja zbiorcza), bezużyteczny.
- Zarchiwizowanego workflowa MCP nie odczyta (`get_workflow_details` → „is archived and cannot be accessed").
- Defekty na 2026-10-08: `29` miał narzędzie KB na nieistniejące ID `6OePp88TYSjx1RW4` — NAPRAWIONE tego dnia (wersja `58e7f875…` → `Inr9rmvQkBFMxTaq`); `01` triggeruje się schedulem co 10 min, nie Drive triggerem; węzły GitHub w `15`/`16`/`27`/`29` celują w `devstock-org/core-team`.
- Pliki w `devstock-team-agent/workflows/` sprzed 2026-10-08 niosą ID z innej instancji (np. `23` = `6OePp88TYSjx1RW4`); nowe `37`–`40` to eksporty z proda (ID prodowe).

**Nowy tor spotkań — n8n (2026-10-08, budowane przez MCP, commity na `main` devstock-team-agent `be8c7fd`..`8731fa7`, bez pusha):** `37_kb_similar` `8TM4sF1qEe85ZIi9`, `38_meeting_publish` `GAvJTcKAoKI6huMz`, `39_meeting_pending` `EfEnyLboy3ZqZ2ln`, `40_error_notify` `EXiPR4NMX0YEzK81` — wszystkie opublikowane. `score` z PGVector load = dystans kosinusowy (identyczny tekst → 0, ten sam temat ~0,25, niepowiązane ~0,7). Decyzje Rafała 2026-10-08: błędy na `#automation_updates` (`C0AM5C80MBN`, nie zakładamy `#automation_errors`); `38` publikuje blokiem Slack `markdown`, dzielonym po akapitach na części ≤ 11 000 znaków; zgoda na smoke `38` i na podpięcie `40` jako Error Workflow w `01`/`37`/`38`/`39`/`29`/`31`. Stan na koniec 2026-10-08: repo = prod dla `37`–`40` (ostatni commit `ac14b66`); smoke `38` zrobiony (inserted→replaced, 2 wiadomości dla 13,7 tys. znaków, treść w bazie bajt w bajt, wiersz testowy usunięty); `40` podpięty jako errorWorkflow w `01`/`29`/`31`/`37`/`38`/`39` i sprawdzony kontrolowanym błędem. `daily_summaries.id` na prodzie = `bigint` bez default/identity/sekwencji — INSERT musi podawać `id`. Ustawienia workflowa (errorWorkflow) nie tworzą wersji — działają bez publish. Pusta odpowiedź webhooka (responseNode) = błąd wykonania; raz widziane `Connection terminated unexpectedly` w PGVector po awarii sieci. (post na #core-team + wiersz daily), kanał `#automation_errors` (nie istnieje / app nie jest członkiem — `40` adresuje go po nazwie), podpięcie `40` jako Error Workflow, Task 6 (okrojenie `01`) i Task 7 (archiwizacja grupy B).

Powiązane: [[repo-baza-wiedzy-przenosiny]], [[kb-webhook-cold-start]].
