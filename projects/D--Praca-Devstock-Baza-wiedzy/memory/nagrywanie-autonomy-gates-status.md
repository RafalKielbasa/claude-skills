---
name: nagrywanie-autonomy-gates-status
description: "Spec „mniej bramek” automatu nagrywania (nagrywanie-autonomy-gates) zatwierdzony 2026-10-21 (S1 A, issue #735); następne sondy P-A–P-D, potem plan 1; gałąź worktree nie zawiera gałęzi dnia 17-10-2026"
metadata:
  node_type: memory
  type: project
  originSessionId: 4bd53d28-0d05-40dd-bf31-94901ea828ea
  modified: 2026-10-21T15:15:46.089Z
---

Część `nagrywanie-autonomy-gates` (spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
indeks `docs/superpowers/projects/nagrywanie.md`, issue devstock-org/devstock-team#735 DT-48) powstała 2026-10-21
w sesji huba `baza-wiedzy-nagrywanie-autonomia` na gałęzi `worktree-baza-wiedzy-nagrywanie-autonomia` (commity
`d06424c8`, `4ee705c9`, `a28eaa4c`). Rafał pominął brainstorming („pisz spec”) i zatwierdził spec w całości (S1,
wariant A): decyzje D1–D5 autora plus siedem decyzji po recenzji budowniczego; lekcje w toku 1.4/2.1/2.2 kończą po
dotychczasowych regułach, przełącznikiem trybu jest `video/ticket.yaml` (lekcja bez biletu działa jak dziś).

**Why:** sześć bramek (G1 bilet produkcyjny, G2 poświadczenia, G3 polityka konta per usługa, G4 zakres dydaktyczny,
G5 `final.mp4` z kartą lekcji, G6 publikacja) zastępuje 24 miejsca, w których automat czekał na Rafała 20–21.10;
kod automatu i skilli `kurs-*` zmienia się dopiero w planie i tylko przy trzymanym koncie kursu.

**How to apply:** przed planem sondy ze specu (sekcja 15): P-A porównanie klatek na nagraniu 1.3 (tylko odczyt,
pliki poza gitem w głównym checkoucie), P-B stan skrzynki Gmail (po polityce G3), P-C drugie konto Google w profilu
kursu (logowanie Rafała), P-D odebranie dostępu n8n.cloud przez automat. Gałąź worktree bazuje na `main` sprzed
PR-ów dnia (6efea0f5) i NIE zawiera niescalonej `rafal-kielbasa/17-10-2026` (d6daae6c); `git merge --ff-only` nie
przechodzi, `reset --hard` blokuje klasyfikator; indeks w worktree przepisany z treści gałęzi dnia plus nowa część.
Gałąź wykonania planu ma wyjść z gałęzi z najnowszym automatem, nie z `main` (spec, sekcja 15). Powiązane:
[[board-tracker-status]], [[kolejka-konta-kursu-status]].
