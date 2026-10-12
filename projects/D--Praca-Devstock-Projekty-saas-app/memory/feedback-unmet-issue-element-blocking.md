---
name: feedback-unmet-issue-element-blocking
description: "Every element of the issue a PR does not fulfil is a BLOCKING review remark; tests the issue requires must be added, always"
metadata:
  node_type: memory
  type: feedback
  originSessionId: bbf04b0a-b00e-4022-825d-4502fd8b5ab5
  modified: 2026-10-12T12:47:56.140Z
---

2026-10-12, Rafał: „Zawsze niewypełnienie elementu issue jest uwagą blokującą. Jeśli Norbert
nie dodał testów pomimo, że były wymagane, jest to uwaga blokująca. Zawsze w przyszłości
również, jeżeli testy są wymagane, mają być dodane.”

**Why:** PR #202 (CP-104, issue #184) left the criterion „Testy: walidacja formularza, zapis
pełnej listy pytań, …” unchecked and added no `apps/web` test; the five review axes never
compare a PR with its issue, so the gap surfaced only from a manual read of the issue.

**How to apply:**
- In every `pr`/`recheck` review, read the linked issue (`gh pr view <n> --json
  closingIssuesReferences`, then `gh issue view`) and check each acceptance criterion and
  each requirement in the description against the code myself — a ticked checkbox is the
  author's claim, not evidence. Every unmet element is Blocking, cited with the issue sentence.
- Tests the issue requires are part of the task: missing ones are Blocking, and in my own
  implementation work I add them whenever the issue asks for them.
- Mirror of [[feedback-foreign-task-changes-blocking]] (extra scope blocks too); see also
  [[feedback-duplication-is-blocking]], [[code-review-master-config-2026-09-07]].
