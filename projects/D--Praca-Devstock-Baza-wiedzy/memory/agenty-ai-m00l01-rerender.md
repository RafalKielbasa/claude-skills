---
name: agenty-ai-m00l01-rerender
description: "Re-render agenty-ai M00L01 od zera na V4 ze skillami Mateusza (nagrywanie, plansze, oprawa, znak AI) i Grzegorza (montaz) - stan i decyzje z 2026-10-08"
metadata:
  node_type: memory
  type: project
  originSessionId: fda79c08-275f-4424-9045-38899980dee1
  modified: 2026-10-08T08:43:01.514Z
---

Rafał 2026-10-08: lekcję 1 modułu 0 kursu `agenty-ai` robimy od nowa, „skillami Mateusza i Grzegorza”:
`/kurs-nagrywanie` (automat Playwrighta, Mateusz), `/kurs-montaz` (Grzegorz), plansze/oprawa/znak AI (Mateusz),
lektor V4 ([[tts-model-decyzja-v2-przerwy]]).

Decyzje Rafała 2026-10-08:
- `kurs.yaml` agenty-ai: `slajdy.odslanianie`, `montaz.plansze`, `nagrywanie.automat`, `oprawa {intro,outro,znak_ai}` - wszystko true (commit `4a2607c1`).
- M00L01: 5 plansz zaakceptowanych, migracja konspektu do nowego układu, scenariusz seg. 7 „dwa wpisy” (commit `3c12c5ad`).
- Silnik avatara: **MCP** (plan konta); kontrola lektora: tak.
- n8n do automatu: **nowe konto n8n Cloud pod kurs** (zakłada i loguje Rafał).
- Kroki 1-5 konspektu (pusta lista, nowy workflow, nazwa) = **dogrywka ręczna**: strażnik `tools/nagrywanie` wpuszcza tylko workflow z `identyfikatory`, a nowy workflow nie ma ID przed nagraniem; automat robi kroki 6-31 na workflow z dogrywki.
- Node systemowy podniesiony do 24.20.0 (winget) - `tools/nagrywanie` wymaga >=22.11; Playwright ffmpeg doinstalowany.

Stare media (wrzesień, głos v2) przeniesione do `video/archiwum/2026-09-v2/` lekcji.

**Why:** pierwsza lekcja kursu przechodzi cały nowy tor (V4 + automat + montaż automatyczny + oprawa) - wzorzec dla reszty lekcji demo agenty-ai.
**How to apply:** kolejność: etap 1 `/kurs-video` (MCP: `--plan-avatara` → HeyGen MCP → `--avatar=mcp`, kontrola lektora) → `/kurs-nagrywanie` „Pierwsza lekcja z nową usługą” (n8n: kurs.yaml `nagrywanie.uslugi.n8n`, login, sonda, moduł usługi, próba, powiększenie, PR) → `/kurs-montaz` od zaznaczeń i plansz → etap 2 `/kurs-video` ze znakiem AI. Sprawdzaj stan w git log i `video/` lekcji, nie z pamięci.
