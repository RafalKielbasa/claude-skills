---
name: specs-self-contained
description: "Rafał rejected a spec decision that defined conventions \"by mirroring code-review-master\"; specs and plans must state conventions explicitly, never by reference to another skill or codebase"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f61dadd2-b82d-454d-9f03-65491ef9af3e
  modified: 2026-09-06T13:53:11.654Z
---

On 2026-09-06 the idea-engine spec carried decision D8 "mirror the user's existing code-review-master skill". Rafał said he never ordered that ("ja tego nie zlecałem") and asked to rewrite D8 as self-contained (explicit `--json`/`--repo`, exit 0/2, `node --test`, one skill with modes). Done in `docs/superpowers/specs/2026-09-06-idea-engine-design.md` (D8 row and section 8.10).

**Why:** a decision recorded in a spec is treated by Rafał as his own; a convention imported by reference hides what was actually decided and forces executors to read unrelated code.

**How to apply:** when brainstorming or writing plans, never write "like skill X" / "mirroring crm" in a decisions table. Spell the convention out. If a previous session's proposal ends up in a decisions table, flag it as Claude's proposal, not Rafał's order. Related: [[ai-native-business-plan]].
