---
name: rownolegle-subagenty-paczka-poprawek
description: "Paczkę drobnych, niezależnych poprawek w repo kodu Rafał chce wykonywać równolegle — osobny subagent na każde niekolidujące zadanie"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2755dabd-6161-454c-a435-d571c7e46f91
  modified: 2026-11-10T11:06:27.311Z
---

Przy paczce drobnych poprawek (follow-upy po review, lista pozycji w issue) Rafał chce
„oddzielnego subagenta dla każdego niekolidującego z sobą zadania” (DT-92/DT-93, 2026-11-10).

**Why:** pozycje są małe i niezależne; sekwencyjne wykonanie marnuje czas, a Rafał i tak
przegląda całość jednym diffem w edytorze.

**How to apply:**
- Jeden worktree na repo od `origin/main` (gałąź bez upstreamu), wspólny dla subagentów tego repo;
  przydział po plikach, pozycje dotykające tych samych plików łączysz w jednego subagenta.
- Każdy brief: zakaz zapisów gita (commit/stash/checkout/restore/reset — cudze zmiany w tym samym
  drzewie), zakaz zmian zależności, krok 1 = sprawdzenie, czy pozycja wciąż występuje na `main`,
  TDD, stan wyjściowy bramki (liczby) do porównania.
- Nowy mechanizm UI (nie poprawka błędu) dostaje najpierw subagenta tylko do rozpoznania,
  zmiana dopiero po decyzji Rafała (reguła [[konsultant-ux-kodozercy]]).
- Po powrocie: pełna bramka na scalonym drzewie, przegląd wyrywkowy diffu, decyzje zebrane
  w jednym raporcie D1…Dn.
