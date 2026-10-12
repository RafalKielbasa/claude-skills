---
name: codex-review-delegates-back-to-claude
description: "2026-10-12 `codex exec --sandbox read-only` used as a reviewer delegates the review to `claude -p` (global execution contract), which fails with ECONNREFUSED; codex then stops and asks for consent"
metadata:
  node_type: memory
  type: project
  originSessionId: bbf04b0a-b00e-4022-825d-4502fd8b5ab5
  modified: 2026-10-12T10:25:56.260Z
---

2026-10-12: during `github-tickets` step 5 (review of CP-108), `codex exec --sandbox read-only - < prompt`
did not review anything itself. Following the "Codex and Claude global execution contract"
in `~/.codex/AGENTS.md`, it dispatched `claude -p`; the nested Claude died with
`API Error: Connection refused ... (ECONNREFUSED)` inside the read-only sandbox, and codex
refused to take the work over without the user's explicit consent. Rafał chose to skip codex.

The same session's `crm codex` (code-review-master, PR #202) ended `{"status":"timeout"}` —
probably the same loop, not verified.

**Why:** the contract makes Codex an orchestrator of Claude, so any skill that calls codex as an
*independent reviewer* from inside Claude loops back to Claude and loses the second opinion.

**How to apply:** when a codex review returns no findings or times out, check its output for a
`claude -p` dispatch before trusting the result. A fix belongs in the codex prompts
(github-tickets `references/codex-review-prompt.md`, code-review-master `prompts/codex.md`,
writing-plans rule in global CLAUDE.md) or as a review exception in the contract — Rafał's call.
Related: [[code-review-master-config-2026-09-07]].
