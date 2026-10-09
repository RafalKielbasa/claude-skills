---
name: n8n-prod-strefa-utc
description: "n8n-prod liczy crony w UTC — „08:00” w Schedule Trigger to 10:00 w Warszawie latem; strefę ustawia settings.timezone, bez wersji i od razu"
metadata:
  node_type: memory
  type: project
  originSessionId: ece85169-32f2-44b7-9695-689c071f34ce
  modified: 2026-10-09T12:02:57.169Z
---

Instancja n8n-prod (`n8n-devstock.fly.dev`) ma domyślną strefę UTC. Sprawdzone 2026-10-09: wyjście `Schedule Trigger` w exec 27972 miało `"Timezone":"UTC (UTC+00:00)"`. Workflow bez `settings.timezone` odpala „poniedziałek 08:00” o 10:00 czasu warszawskiego latem (CEST) i o 09:00 zimą.

**Why:** `29_weekly_project_report` miał przychodzić przed daily o 10:00, a wpadał równo z jego startem. Wyłapał to dopiero przegląd końcowy, a testy jednostkowe tego nie widzą. 2026-10-09 ustawiono `Europe/Warsaw` w `29` i `31`.

**How to apply:**
- Każdy nowy lub poprawiany workflow z cronem na prodzie dostaje `setWorkflowSettings {timezone: "Europe/Warsaw"}`.
- Strefę przypinaj testem eksportu.
- Ustawienia workflowa (`timezone`, `errorWorkflow`) nie tworzą wersji i działają od razu, także na wersji aktywnej. Dlatego zmiana strefy na aktywnym workflowie wymaga zgody Rafała jak publikacja.
- Pozostałe crony na prodzie (np. `01` co 10 min) nie były sprawdzane pod tym kątem.

Powiązane: [[n8n-prod-inwentaryzacja]].
