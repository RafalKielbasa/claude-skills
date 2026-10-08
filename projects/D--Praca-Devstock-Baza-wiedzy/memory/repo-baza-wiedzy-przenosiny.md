---
name: repo-baza-wiedzy-przenosiny
description: "Baza wiedzy żyje w devstock-org/devstock-team (scalone z core-team, potwierdzone 2026-10-07); lokalny origin devstock-team.git jest poprawny"
metadata:
  node_type: memory
  type: project
  originSessionId: fda79c08-275f-4424-9045-38899980dee1
  modified: 2026-10-07T19:57:49.882Z
---

Stan potwierdzony 2026-10-07: `gh api repos/devstock-org/devstock-team --jq .full_name` zwraca
`devstock-org/devstock-team` (nie `devstock-team-knowledge-base`) — scalenie z `core-team` zrobione,
`devstock-team` to prawdziwe repo z kodem, issues i tablicą (projekt 3). Rafał potwierdził: commitujemy
do „devstock team".

Historia decyzji (2026-10-07): kod szedł mirrorem z `devstock-team-knowledge-base` do `core-team`,
potem `core-team` dostał nazwę `devstock-team`, stare `devstock-team-knowledge-base` archiwizowane
(trzyma 27 starych PR-ów).

**Lokalnego `origin` nie zmieniaj** — wskazuje `devstock-org/devstock-team.git`, czyli właściwe repo.
PR-y z tego repo idą do `devstock-org/devstock-team`.

**Why:** przed scaleniem `devstock-team` było tylko przekierowaniem; po scaleniu to docelowe repo, więc
ostrzeżenia „This repository moved" już nie powinno być.

**How to apply:** push nadal wyłącznie za jawną zgodą Rafała w danej rozmowie — patrz
[[tryb-commitow-per-repo]].
