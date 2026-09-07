---
name: code-review-master-config-2026-09-07
description: 2026-09-07 config .claude/review/config.md dla saas app zatwierdzony i zapisany (niezacommitowany); review-guide.md zredukowany do wskaźnika; decyzje budżetu i wag spoza pliku
metadata: 
  node_type: memory
  type: project
  originSessionId: 695c3ff7-9802-495a-a154-8ff68fa1932f
  modified: 2026-09-07T10:10:30.019Z
---

2026-09-07: `/code-review-master init` wykonany w `saas app`. `.claude/review/config.md`
(15 osi z globalnymi, 5 slotów) zapisany po zatwierdzeniu Rafała; `.claude/review/reports/`
dopisane do `.gitignore`; `docs/review-guide.md` zredukowany do nagłówka + wskaźnika
(pełna redukcja — Merge Criteria i szablon komentarza reviewera zniknęły, są w historii gita).
Wszystko niezacommitowane w chwili zapisu. Żaden prawdziwy przebieg review tym skillem
jeszcze się nie odbył; `state.json` powstanie przy pierwszym `crm plan`.

Decyzje Rafała spoza pliku (2026-09-07):
- `budget.slots: 5` mimo że na PR-ze API osie domenowe (`payments-stripe`, `auth-session`)
  zwykle lądują w kolejce — podnosić per przebieg przez `--slots 6`, nie w configu.
- `code-quality` → `suggestion`; `nestjs-architecture` → `blocking` (zgrupowana z
  `performance-database` w slot `api-core`, żeby nie przegrywała rotacji z `debug-leftovers`).
- Reguły ze specu modelu subskrypcji (StripeEvent, handlery po `stripeSubscriptionId`,
  wiersz `Payment`) obowiązują nowy kod już teraz, mimo że etapy 1–3 nie są wdrożone.

**Why:** symulacja `selectAxes` pokazała, że przy zimnym kursorze globalne osie `rotate`
wchodzą przed repo-osiami `rotate`, więc osie wąskie na dotknięcie (`api-invariants`, `web`)
dostały `rank: always`.

**How to apply:** zmiany reguł review idą do `.claude/review/config.md`, nie do
`docs/review-guide.md`. Linki do review-guide w `AGENTS.md:22`, `README.md:228`,
`docs/conventions.md:6`, `docs/onboarding/CP-INTRO-course-reviews.md:219` nadal działają,
ale opisują go jako „checklistę" — do ewentualnej korekty. `PURPOSE.md` skilla nadal mówi
„konfiguracja czeka na zatwierdzenie" — do aktualizacji przez `evolve-skill`.

Powiązane: [[feedback-no-multiagent-fanout]], [[feedback-no-commits-user-only]].
