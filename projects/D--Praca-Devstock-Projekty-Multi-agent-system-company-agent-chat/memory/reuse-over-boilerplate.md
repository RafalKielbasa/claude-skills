---
name: reuse-over-boilerplate
description: User strongly prefers reusing existing components/logic over duplicating; avoid boilerplate
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c695db45-6656-4924-960a-e61b6d807cbc
---

User stated it is "bardzo ważne" (very important) to reuse existing components and logic and to avoid generating boilerplate code. This aligns with the project's DRY rule in CLAUDE.md.

**Why:** The codebase already enforces shared abstractions (e.g. the three-layer chat pattern `useChatView`/`ChatPanel`/view-wrapper in AGENTS.md). The user wants new features to generalize/extend existing pieces, not copy-paste parallel stacks.

**How to apply:** When adding a feature analogous to an existing one (e.g. tasks-review mirroring knowledge-review), extract shared generic components/hooks/server-action factories and have BOTH domains use them — refactor the existing one onto the shared abstraction rather than duplicating files. Prefer slots/render-props/config over copied state machines.
