---
name: card-trail-workflow-aktywny
description: "Ślad pracy na kartach głównej tablicy działa od 2026-11-09 (workflow card-trail, środowisko card-trail); gdzie token, kto uruchamia ręcznie, co blokuje klasyfikator"
metadata:
  node_type: memory
  type: project
  originSessionId: f83b042b-5c80-43ff-8320-902beeeba944
  modified: 2026-11-09T18:00:01.730Z
---

Workflow `.github/workflows/card-trail.yml` w `devstock-org/devstock-team` działa z `main` od 2026-11-09 (PR #911, przebiegi 42669105643 i 42669589649). Codziennie o 07:30 UTC odświeża komentarze śladu na otwartych kartach tablicy `devstock-org#3`. Część `weekly-sprints-card-links`, karta DT-134 (#910). Odbiór na przeglądzie sprintu 2026-11-16.

- Token classic na koncie Rafała, zakresy `repo` + `read:project`. Sekret `CARD_TRAIL_TOKEN` leży w środowisku `card-trail`, które dopuszcza tylko gałąź `main`; sekretu repo nie ma. Lokalna kopia tokenu: `~/.config/card-trail-token`. Claude nigdy jej nie czyta, a komendy z tokenem uruchamia Rafał przez `!`.
- `gh workflow run card-trail.yml` jest odrzucany przez klasyfikator trybu auto (`[External System Writes]`), nawet gdy Rafał zgodził się na uruchomienie. Nie ponawiaj, tylko podaj Rafałowi komendę z `!`. Odczyt przebiegu (`gh run watch`, `gh run view --log`) Claude robi sam.
- Uwagi odłożone na później, w tym brak ochrony `main` (ktoś z prawem zapisu może wypchnąć zmieniony workflow i dostać token): `docs/superpowers/plans/2026-11-09-weekly-sprints-card-links-followups.md`.

**Why:** Rafał wybrał środowisko zamiast sekretu repo, bo sekret repo dostaje każde uruchomienie z gałęzi dowolnej z 6 osób z prawem zapisu.
**How to apply:** Przy zmianie tokenu sprawdź go sondą `token-probe`, a sekret zapisz z `--env card-trail`. Przy awarii śladu zacznij od `gh run list --workflow card-trail.yml`. Pokrewne: [[board-tracker-status]].
