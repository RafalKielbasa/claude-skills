---
name: board-tracker-done-false-error
description: "board-tracker `status --to done` can return ok:false \"Could not close the issue\" while the issue is in fact closed and Done"
metadata:
  node_type: memory
  type: reference
  originSessionId: d06ea110-eacf-4754-90ea-c7b325490912
  modified: 2026-10-12T16:27:35.115Z
---

On 2026-10-12 `status --to done` for devstock-team#412 and edu_saas#190 returned
`{"ok":false,"error":"GraphQL: Could not close the issue. (closeIssue)"}`, yet both issues were
CLOSED/COMPLETED with board status Done seconds later (#98 and #641 went through cleanly). Likely the
board's Done automation closes the issue before the CLI's own closeIssue call.

**How to apply:** on this error do not retry; read the state with
`gh issue view <n> --repo <repo> --json state,stateReason,projectItems` and report what it shows.
Related: [[board-tracker-status]].
