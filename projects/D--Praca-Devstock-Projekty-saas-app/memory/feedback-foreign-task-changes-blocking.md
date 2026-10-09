---
name: feedback-foreign-task-changes-blocking
description: Zmiany z innego zadania na gałęzi PR-a (poza zakresem jego issue) to w review zawsze uwaga BLOKUJĄCA
metadata:
  node_type: memory
  type: feedback
  originSessionId: d1166696-ae05-41e9-8848-8ed9022a56fe
  modified: 2026-10-09T18:32:54.919Z
---

2026-10-09: Rafał: „Jeśli trafiły na branch informacje z innego zadania, to jest to
blokujące”. Kod spoza zakresu issue, do którego jest PR, blokuje merge niezależnie od
jakości tego kodu; poprawka to wycofanie go z gałęzi i osobny PR pod własnym issue.

**Why:** przypadek wyzwalający to PR #198 (CP-100, issue #180). Commit 35db0f2 „fix: address
review changes” wniósł zmiany w `apps/api/src/modules/quizzes/` (endpoint `GET edit`,
`findForAdmin`, `passingScore`), a issue mówi wprost, że jedyna część API to miniatura
w `GET /search/courses`. Reguła nie jest jeszcze zapisana w repo (brak w
`.claude/review/config.md` i `docs/review-guide.md`).

**How to apply:** przy każdym review i recheck porównuję listę zmienionych plików z zakresem
issue (`gh issue view <n>`), także w commitach „address review”. Znalezisko oznaczam jako
Blocking i cytuję zdanie issue, które wyznacza zakres. Powiązane:
[[feedback-duplication-is-blocking]], [[code-review-master-config-2026-09-07]].
