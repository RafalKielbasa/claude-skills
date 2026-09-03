---
name: project-dimension-rollout
description: "Stan prac nad wymiarem \"projekt\" w systemie multi-agentowym — spec zatwierdzony w rozmowie, czeka na review pliku przez użytkownika, potem writing-plans dla etapu 1"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3e838ea4-1124-4218-b96e-fec167971d4a
---

Trwająca inicjatywa (start 2026-07-09): wprowadzenie projektu jako pierwszoklasowego bytu
w systemie multi-agentowym (radar portfela issues read-only → wiedza tagowana projektem →
indeksacja repo).

Spec: `devstock-team-agent/docs/superpowers/specs/2026-07-09-project-dimension-design.md`
(commit `9c6426b`, branch `feat/daily-storage-audio`).

**Stan na 2026-07-11:** plany implementacji etapów 1 i 2 NAPISANE i zacommitowane
(branch `feat/daily-storage-audio`), użytkownik świadomie odłożył implementację:
- Etap 1 (radar): `plans/2026-07-11-project-radar-etap1.md` (commit `78ce20c`) — 15 tasków;
  odstępstwo od specu: wspólny `PUSH_SECRET`/`checkPushAuth` zamiast dwóch nowych sekretów.
- Etap 2 (wiedza tagowana projektem): `plans/2026-07-11-project-knowledge-etap2.md`
  (commit `ded45cb`) — 12 tasków; wymaga wdrożonego etapu 1; metadane w PGVector:
  `project: slug|''` (pusty string = ogólnofirmowe, odstępstwo od null ze specu),
  filtr w 23 przez rozgałęzienie IF (dwa agenty, współdzielony model/pamięć/embeddings);
  punkt STOP: dostępność Metadata Filter w node PGVector przy imporcie.

**Następny krok:** ewentualnie plan etapu 3 (indeksacja repo, workflow 35), potem wybór
trybu wykonania (subagent-driven vs inline) i implementacja od etapu 1.

Kluczowe decyzje (szczegóły w specu): 1 projekt = 1 repo w jednej organizacji GitHub;
issues poza zespołem korowym wyłącznie read-only; wymiar projektu w PGVector przez metadane
(nie nowe tabele); rejestr projektów w bazie aplikacji, n8n czyta przez GET /api/projects.
Powiązane: [[user-rafal-profile]]
