---
name: klasyfikator-npm-run-nagrywanie
description: Tryb auto blokuje station-wait i przebieg; reguła Bash(npm run nagrywanie:*) w .claude/settings.local.json działa tylko na gołą komendę.
metadata:
  node_type: memory
  type: reference
  originSessionId: 541cf3f0-bb8c-449a-92fd-d69e74d140fc
  modified: 2026-10-20T08:14:21.165Z
---

Klasyfikator trybu auto odrzucał `station-wait` („Interfere With Workloads”) i `przebieg` („Real-World Transactions”). 2026-10-19 Rafał kazał dopisać regułę `Bash(npm run nagrywanie:*)` do `D:\Praca\Devstock\Baza wiedzy\.claude\settings.local.json` (plik jest w globalnym gitignore). Reguła łapie komendę tylko w kształcie `npm run nagrywanie -- …`. Z `cd "…" && npm run …` albo z doklejonym `; echo` klasyfikator dalej blokował. Robię więc `cd` osobnym wywołaniem Bash, a potem uruchamiam gołą komendę, także w tle. Powiązane: [[dry-run-skilli-ograniczenia]].
