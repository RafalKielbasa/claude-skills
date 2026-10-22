---
name: gh-pr-files-truncated
description: "`gh pr view --json files` zwraca tylko pierwsze ~100 plików PR-a; pełną listę daje `git diff --name-only base...head`"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a368be55-5242-4040-bdb7-af97764bd7b6
  modified: 2026-10-22T10:19:25.035Z
---

`gh pr view <n> --json files` ucina listę plików dużego PR-a (code-busters#1647 ma 312 plików, API oddało ~60 na
`features/*`), więc wniosek „PR nie dotyka X” z tej listy był fałszywy (2026-10-22, spec migracji ekranów).

**Why:** GitHub REST/GraphQL zwraca pliki PR-a stronami; `gh` nie dociąga kolejnych stron w `--json files`.

**How to apply:** zanim stwierdzisz, czego PR nie zmienia, zrób `git fetch origin <head>` i
`git diff --name-only origin/<base>...origin/<head>` (albo `gh api repos/<o>/<r>/pulls/<n>/files --paginate`);
`changedFiles` z `gh pr view` mówi, ile plików jest naprawdę. Patrz też [[commit-pathspec-wspolny-indeks]].
