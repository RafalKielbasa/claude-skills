---
name: gh-issue-create-504-tworzy-issue
description: "gh issue create z 504 Gateway Timeout potrafi mimo to utworzyć issue; przed ponowieniem szukaj go po tytule, inaczej powstanie duplikat."
metadata:
  node_type: memory
  type: reference
  originSessionId: a70b061f-baec-4d73-912c-99f058fc1e43
  modified: 2026-11-09T09:00:03.894Z
---

`gh issue create` w `devstock-org/devstock-team` zwrócił `non-200 OK status code: 504 Gateway Timeout` (strona „Unicorn!”), a issue i tak powstało: #899, DT-128, 2026-11-09, z etykietami i assignee jak w komendzie.

**How to apply:** po timeoucie albo 5xx przy zakładaniu issue nie ponawiaj od razu. Najpierw `gh issue list --state all --limit 15 --json number,title` i szukaj tytułu z numerem DT. Ponawiaj dopiero wtedy, gdy go nie ma. Dotyczy też skilli `github-tickets`, `/daily` i `/spotkanie`. Powiązane: [[tablica-3-auto-dodawanie-issue]].
