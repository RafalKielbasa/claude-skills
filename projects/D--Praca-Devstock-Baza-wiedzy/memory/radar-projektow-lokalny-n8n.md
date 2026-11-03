---
name: radar-projektow-lokalny-n8n
description: "Rada projektu" = Radar projektów (34_project_radar_collector, 36_project_radar_digest) — runs on Rafał's local Docker n8n, not n8n-prod; posts only errors / "brak raportów" to #ai_summary
metadata:
  type: project
  modified: 2026-11-03T12:37:33.897Z
---

"Rada projektu" in Rafał's speech = **Radar projektów**: `34_project_radar_collector` (Mon–Fri 07:30) and `36_project_radar_digest` (Mon 09:00), on the **local Docker n8n** container `devstock-team-agent-n8n-1` (localhost:5678), NOT on n8n-prod (search there finds nothing). Sources untracked in devstock-team-agent (`workflows/34_*.json`, `36_*.json`, spec `2026-07-29-intern-projects-context-design.md`).

State verified 2026-11-03: collector posts `⚠️ Radar projektów — błędy kolektora` (GitHub "Authorization failed", dead local token since July; `projects` table still points at old `Devstock-Products/*` repos); digest posts `📡 Radar projektów: brak raportów z ostatnich 14 dni.` Same local instance runs an old `01_process_meeting` with hundreds of Drive errors.

**Why:** Rafał didn't know what it was; it overlaps `29_weekly_project_report` and was being weighed for removal in DT-76 (#802, weekly sprints) — see [[n8n-prod-inwentaryzacja]].

**How to apply:** when Rafał mentions "rada/radar projektu" or noise on #ai_summary from radar, look at local Docker n8n, not prod. Check whether DT-76 already disabled it before acting.
