---
name: feedback-blocking-review-moves-card-to-be-fixed
description: "After sending a blocking PR review, move the linked issue's card on the edu-saas board to \"To be fixed\" without asking; non-blocking review → Rafał merges and the card goes to Done by itself"
metadata:
  node_type: memory
  type: feedback
  originSessionId: bbf04b0a-b00e-4022-825d-4502fd8b5ab5
  modified: 2026-10-12T13:09:31.299Z
---

2026-10-12, Rafał (standing authorization): when a review I send has blocking remarks
(`REQUEST_CHANGES`), I move the card of the issue the PR closes to **"To be fixed"** myself.
When the review is not blocking, the PR gets merged and the board moves the card to Done
automatically — I touch nothing.

**Why:** first case was PR #202 / issue #184 (CP-104). I proposed the move and waited; Rafał
misread the proposal and moved the card himself. The rule removes that round-trip. It is an
explicit exception to the board-tracker rule that status changes wait for his "tak" — only
for this transition, only after a blocking review was actually posted.

**How to apply:** board `kodozercy` project #2 "edu-saas" (id `PVT_kwDOEAMo084BW9l1`), Status
field `PVTSSF_lADOEAMo084BW9l1zhSN0dM`, option "To be fixed" = `e9d8eeda` (read 2026-10-12;
re-read if an edit fails). The board-tracker CLI cannot set it (`status --to` knows only
canonical states; "To be fixed" maps to in_progress), so use `gh project item-edit` with the
issue's project item id. Report the move in the closing summary. Related:
[[feedback-unmet-issue-element-blocking]], [[code-review-master-config-2026-09-07]].
