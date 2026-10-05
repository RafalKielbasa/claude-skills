---
name: repo-baza-wiedzy-przenosiny
description: "Remote \"Bazy wiedzy\" wskazuje na stary adres i celowo NIE poprawiamy go - Rafał przenosi repo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 1f305bfb-722e-43f6-ae8f-752d0d412bcf
  modified: 2026-09-22T17:18:03.563Z
---

`git push` w repo „Baza wiedzy" wypisuje ostrzeżenie GitHuba:
`This repository moved. Please use the new location: https://github.com/devstock-org/devstock-team-knowledge-base.git`,
bo lokalny `origin` wskazuje wciąż na `devstock-org/devstock-team.git`. Przekierowanie działa,
push przechodzi normalnie.

**Nie proponuj `git remote set-url`.** Rafał powiedział 2026-09-22: „Będę zmieniał lokalizację
tego repo wiec nie trzeba" - adres i tak się zmieni, więc poprawianie go teraz to praca do
wyrzucenia.

**Why:** bez tej notatki każda sesja zobaczy ostrzeżenie przy pushu i zaproponuje tę samą
poprawkę, którą Rafał już raz odrzucił.

**How to apply:** ostrzeżenie o przenosinach przy `git push` zignoruj i nie komentuj go jako
problemu do naprawy. Jeśli push kiedyś padnie na 404 zamiast przekierować, to znaczy, że
przenosiny się odbyły - wtedy zapytaj o nowy adres, zamiast zgadywać.

Tryb commitów i pushy w tym repo: [[tryb-commitow-per-repo]].
