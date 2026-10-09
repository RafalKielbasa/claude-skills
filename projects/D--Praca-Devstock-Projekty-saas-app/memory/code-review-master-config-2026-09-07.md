---
name: code-review-master-config-2026-09-07
description: 2026-09-07 config .claude/review/config.md dla saas app zatwierdzony i zapisany (niezacommitowany); review-guide.md zredukowany do wskaźnika; decyzje budżetu i wag spoza pliku
metadata: 
  node_type: memory
  type: project
  originSessionId: 695c3ff7-9802-495a-a154-8ff68fa1932f
  modified: 2026-10-09T21:48:19.284Z
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

Trzeci przebieg `pr`: 2026-10-05 `pr 193` (CP-45, run `20261005-045931-erc0`, 11 agentów,
7 znalezisk, 0 blokujących, codex 6/7). f-03 to fałszywy alarm: agent web porównał fixture
z gitignorowanym, nieaktualnym `plan-5`, a wiążący kontrakt stoi w issue #125. Rafał kazał
wysłać z `REQUEST_CHANGES` mimo braku blokujących („dużo uwag łamiących konwencje”), plus
dodatkowy komentarz spoza przebiegu (`kpi.tsx:11`, Blocking). Poszło jako review
5411524170, 7 komentarzy inline, bez błędu 422. Pułapka: `crm artifact --repo .` daje
`<title>Review .</title>`, więc trzeba podać pełną ścieżkę repo.

Czwarty przebieg `pr`: 2026-10-05 `pr 201` (CP-103, run `20261005-131628-mhbx`, 9 agentów,
2 znaleziska na tej samej linii `new-course-form.tsx:8`, 0 blokujących, codex 2/2, exit 0).
Pułapka: klasyfikator auto mode blokuje `git checkout` gałęzi PR-a („Irreversible Local
Destruction”), więc pytam Rafała, a on sam przełącza gałąź; plan zrobiony przed checkoutem
(`20261005-092313-kk8y`) zostaje osierocony. Osie nie łapią błędów zachowania: przycisk
„Zapisz lekcję” zapisujący artykuł na lekcji wideo znalazłem dopiero ręcznie.

Piąty przebieg `pr`: 2026-10-06 `pr 192` (CP-82 na tipie `1c968fb`, run `20261006-102328-0k9t`,
11 agentów, 4 sugestie, codex 3/4, f-04 odrzucone). Przed `send` sprawdziłem moje stare
komentarze na PR-ze: f-01/f-02/f-03 były już w review 5278850435, autor naniósł je tylko na
jednym z trzech bliźniaczych plików. Rafał kazał zablokować: poszło jako review 5427958084
`CHANGES_REQUESTED`, 4× Blocking (importy spoza barrela, arrow function zamiast `function`;
te dwie ostatnie spoza przebiegu) + `layout.tsx:17` jako Suggestion, bez 422.
Lekcja: przed `send` na PR, który już był recenzowany, zestaw znaleziska z wcześniejszymi
komentarzami (`gh api pulls/<n>/comments`) — powtórzona uwaga zmienia wagę i treść komentarza.

Szósty przebieg `pr`: 2026-10-06 `pr 198` (CP-100, tip `b2e0bd0`, run `20261006-120825-7fty`,
11 agentów, 3 znaleziska: 1 sugestia + 2 drobiazgi, 0 blokujących, codex 3/3, exit 0, artefakt
2a6CcrqYrCknbtjrQ14tnT). Checkout gałęzi PR-a tym razem przeszedł, bo Rafał kazał go wprost.
f-01 (`getInitials` w `hero-info.tsx:31`) powtarza wątek ostrach1, autor go odbił („different
input data”) — a `leaderboard-utils.ts:18` ma ten sam podpis `string | null`; nie wysłane.
Wysłane 2026-10-06 jako review 5428512987 `CHANGES_REQUESTED` (f-01 Blocking + 2 Nitpick), bez 422.
Notatka „Tutaj będzie fullDescription” w `details.tsx:35` jest uzgodniona z Rafałem — nie zgłaszać.
Rafał: f-01 ma iść przy `send` jako Blocking (REQUEST_CHANGES); duplikaty od teraz blokujące
z configu (punkt `**blocking:**` w `code-quality`), zob. [[feedback-duplication-is-blocking]].

Recheck 2026-10-09 `recheck 198` (baza `b2e0bd0`, tip `5095627`): 3/3 uwagi naniesione
(wspólny `src/lib/get-initials.ts`). Nowa uwaga Blocking: `35db0f2` wniósł zmiany w quizach
spoza zakresu issue #180, zob. [[feedback-foreign-task-changes-blocking]]. Wysłane jako review
5475666170 `CHANGES_REQUESTED`, 1 komentarz na `quizzes.controller.ts:47-53`. Sugestię
o e-mailu w `user-menu.tsx:98` (inicjały „J” zamiast „JK”) Rafał wyciął.

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
