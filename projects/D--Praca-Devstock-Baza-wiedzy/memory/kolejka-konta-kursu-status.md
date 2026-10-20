---
name: kolejka-konta-kursu-status
description: "Parallel lesson production (station queue in tools/nagrywanie) on main since 2026-10-17 (PR #705); Rafał declared the part done 2026-10-20 by use on lessons 1.3/1.4, steps 4 and 5 of the acceptance never tested"
metadata:
  node_type: memory
  type: project
  originSessionId: 1506ab90-7988-4231-ab1a-6beb3e2c2db1
  modified: 2026-10-20T10:40:26.809Z
---

Kolejka do konta kursu (`nagrywanie-parallel-lessons`, issue devstock-org/devstock-team#697) jest na `main` od 2026-10-17 (PR #705, merge `f1ca8d7f`): komendy `station-*` w `tools/nagrywanie`, strażnik `openCourseProfile` we wszystkich komendach otwierających profil, sekcja „Lekcje równolegle” w skillu `kurs-nagrywanie`. 2026-10-20 Rafał uznał część za zakończoną po użyciu kolejki przy lekcjach 1.3 (#698) i 1.4 (#699); formalnego raportu odbioru nie ma, a kroki 4 (zamknięta sesja w kolejce → kod 3 dla lekcji za nią) i 5 (`station-leave` w trakcie `station-wait` → kod 4) zadania 6 nigdy nie były sprawdzone. `station` nie prowadzi dziennika posiadaczy (tylko `state.json` z bieżącym stanem).

**Why:** gdy kolejka zachowa się dziwnie przy martwym wpisie albo wyjściu w trakcie oczekiwania, to są ścieżki bez żadnego testu w realnym użyciu - zacznij diagnozę od nich, nie zakładaj, że odbiór je pokrył.

**How to apply:** sesja lekcji przed krokiem na koncie wczytuje `/kurs-nagrywanie` (sekcja „Lekcje równolegle”). Znane drobiazgi po fali 4 (pid użyty ponownie → odmowa „inny proces tej lekcji”, oczekiwanie świeżo po wybudzeniu bez okna łaski, `station-wait` + komenda tej samej lekcji → błąd profilu Chrome) nie zostały ani potwierdzone, ani naprawione. Status części w `docs/superpowers/projects/nagrywanie.md`. Powiązane: [[przebieg-probny-status]], [[board-tracker-status]].
