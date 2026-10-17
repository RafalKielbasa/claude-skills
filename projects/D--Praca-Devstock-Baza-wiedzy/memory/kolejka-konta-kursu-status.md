---
name: kolejka-konta-kursu-status
description: "Parallel lesson production (station queue in tools/nagrywanie) merged to main 2026-10-17 via PR #705; partial acceptance on lessons 1.3/1.4/1.5 pending, step 4 untested"
metadata:
  node_type: memory
  type: project
  originSessionId: 1506ab90-7988-4231-ab1a-6beb3e2c2db1
  modified: 2026-10-17T08:47:18.133Z
---

Kolejka do konta kursu (`nagrywanie-parallel-lessons`, issue devstock-org/devstock-team#697) jest na `main` od 2026-10-17 (PR #705, merge `f1ca8d7f`): komendy `station-*` w `tools/nagrywanie`, strażnik `openCourseProfile` we wszystkich komendach otwierających profil, sekcja „Lekcje równolegle” w skillu `kurs-nagrywanie`. Odbiór (zadanie 6 planu `docs/superpowers/plans/2026-10-16-nagrywanie-parallel-lessons-plan-1.md`) Rafał wybrał jako częściowy na lekcjach 1.3 (#698), 1.4 (#699) i 1.5; 1.5 to tor A, więc kolejka widzi 2 lekcje, a krok 4 (zamknięta sesja w kolejce → kod 3 dla lekcji za nią) zostaje niesprawdzony.

**Why:** odbiór robią sesje lekcji, nie ta, która budowała kolejkę; decyzje i rulingi są w ledgerze `.superpowers/sdd/2026-10-16-nagrywanie-parallel-lessons-plan-1/progress.md` (git-ignored) i w indeksie `docs/superpowers/projects/nagrywanie.md`.

**How to apply:** sesja lekcji 1.3/1.4 przed krokiem na koncie ponownie wczytuje `/kurs-nagrywanie` (sekcja „Lekcje równolegle”), bo sesje sprzed 2026-10-16 jej nie znają. Znane drobiazgi po fali 4 (pid użyty ponownie → odmowa „inny proces tej lekcji”, oczekiwanie świeżo po wybudzeniu bez okna łaski, `station-wait` + komenda tej samej lekcji → błąd profilu Chrome) czekają na uwagi z odbioru. Raport odbioru: `docs/superpowers/plans/YYYY-MM-DD-nagrywanie-parallel-lessons-plan-1-acceptance.md`. Powiązane: [[przebieg-probny-status]], [[board-tracker-status]].
