---
name: feedback-no-commits-user-only
description: Never create git commits in this repo — Rafał makes all commits himself
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 204fd0e1-a455-4f75-ab45-dfc350aad66f
---

Nie tworzyć żadnych commitów w tym repo. Zmiany (kod, dokumentacja, specy) zostawiać w drzewie roboczym; commituje wyłącznie Rafał.

**Why:** 2026-07-09 — po zacommitowaniu speca na `main` (zgodnie z flow skilla brainstorming, który każe commitować design doc) Rafał wprost powiedział: „nic nie commitujesz, commity tworzę tylko ja". Instrukcja użytkownika nadpisuje kroki skilla.

**How to apply:** Pomijać kroki „commit" w skillach (brainstorming, writing-plans itd.). Po zakończeniu pracy zgłosić listę zmienionych/nowych plików, żeby Rafał mógł je sam zacommitować. Nie robić też `git push`.
