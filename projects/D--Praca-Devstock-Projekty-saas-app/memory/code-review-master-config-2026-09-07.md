---
name: code-review-master-config-2026-09-07
description: 2026-09-07 config .claude/review/config.md dla saas app zatwierdzony i zapisany (niezacommitowany); review-guide.md zredukowany do wskaźnika; decyzje budżetu i wag spoza pliku
metadata: 
  node_type: memory
  type: project
  originSessionId: 695c3ff7-9802-495a-a154-8ff68fa1932f
  modified: 2026-09-22T13:39:14.343Z
---

2026-09-07: `/code-review-master init` wykonany w `saas app`. `.claude/review/config.md`
(15 osi z globalnymi, 5 slotów) zapisany po zatwierdzeniu Rafała; `.claude/review/reports/`
dopisane do `.gitignore`; `docs/review-guide.md` zredukowany do nagłówka + wskaźnika
(pełna redukcja — Merge Criteria i szablon komentarza reviewera zniknęły, są w historii gita).
Config zacommitowany na `main` jako `7aca478` (2026-09-07). Pierwszy prawdziwy przebieg:
2026-09-07 `pr 164` (run `20260907-111319-55oc`, 11 agentów, 5 znalezisk, 3 blokujące,
5/5 codex potwierdza, bramka exit 1); `state.json` powstał, nieśledzony do decyzji Rafała.
Wynik wysłany na PR #164 nowym trybem `send` (review 5131590353, `CHANGES_REQUESTED`,
3 komentarze inline po angielsku w rejestrze `redakcja.md` z Bazy wiedzy; `f-01` odrzucone
jako kod sprzed PR-a — do triage `rejected` przez `ask`). Tryb `send` w SKILL.md, ślad w
`~/.claude/wiki/skill-impact.md`; wszystko w `~/.claude` niezacommitowane.
Pułapka: tryb `pr` wymaga `gh` z polem `baseRefOid` w `pr view --json` — `gh 2.29.0`
padał z „Unknown JSON field", Rafał kazał zaktualizować przez winget do `2.100.0`
(nocny VM może mieć to samo). Tryb `pr` czyta pliki z drzewa roboczego, więc gałąź PR-a
musi być wymeldowana i mieć `config.md` (PR sprzed configu → merge `main` do gałęzi).

Drugi przebieg `pr`: 2026-09-22 `pr 192` (CP-82, run `20260922-085058-a4az`, 11 agentów,
10 znalezisk, 0 blokujących, 10/10 codex potwierdza, exit 0); `send` poszedł bez 422
jako review 5278850435 (`COMMENTED`, 10 komentarzy inline). Pułapka weryfikacji:
`gh api pulls/<n>/reviews/<id>/comments` zwraca `line: null` (stare pola `position`);
numery linii daje `gh api pulls/<n>/comments`.

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
