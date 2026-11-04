---
name: tablica-3-auto-dodawanie-issue
description: "Project 3 (devstock-org) sam dodaje nowe issue devstock-team, więc gh project item-add pada; kartę trzeba znaleźć przez GraphQL i ustawić jej Status."
metadata:
  node_type: memory
  type: reference
  originSessionId: 03a8d3fe-276e-423b-a3b0-d88e8dd8a98d
  modified: 2026-11-04T12:56:55.177Z
---

Tablica project 3 `devstock-org` sama dodaje każde nowe issue z `devstock-org/devstock-team`. `gh project item-add` zaraz po `gh issue create` kończy się błędem `GraphQL: Content already exists in this project (addProjectV2ItemById)` (sprawdzone 2026-11-04 przy #857).

**How to apply:** przy wykonaniu kolejki `/daily` nie dodawaj karty, tylko znajdź ją przez `repository.issue.projectItems` w `gh api graphql` i ustaw Status przez `gh project item-edit`. Świeża karta potrafi nie mieć jeszcze statusu (#858, #859 były bez statusu, zanim ustawiłem Backlog), więc ustaw go zawsze jawnie.

Kolejność wykonania opisuje `docs/spotkania-kolejki.md`. Powiązane: [[bramka-punkt-po-punkcie]].
