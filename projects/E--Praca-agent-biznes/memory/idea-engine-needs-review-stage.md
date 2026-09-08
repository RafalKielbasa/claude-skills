---
name: idea-engine-needs-review-stage
description: "Rafał expects a discussion stage after each idea-engine research step (explain findings, change the plan) — the validate mode as built has none (2026-09-07)"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 226bb5ac-01d2-4b69-b371-68c264dfd5f2
  modified: 2026-09-07T20:00:34.792Z
---

After the first full `validate fit-fast-food` run (2026-09-07) Rafał said he had imagined it differently: he expected a stage where I explain and we discuss the research results and possibly change the plan (claims, assumptions, interview plan) before moving on. The idea-engine skill's `validate` mode ends with the CLI summary table and a pointer to `interviews/plan.json`; there is no conversational review step and the skill forbids me to edit files under `ideas/` by hand.

**Why:** the engine is a decision tool for Rafał, not an unattended pipeline; the hand-off points (interviews, synthesize) are where he wants to steer.

**How to apply:** after `validate finish` (and likely after `import finish`, `ingest finish`), present the findings per dimension, the three mandatory answers, conflicts, the model's weakest assumptions and the interview plan, then ask what to change before proposing the next mode. Treat adding a formal review step to the skill/spec as a scope change that is Rafał's decision. Related: [[specs-self-contained]], [[ai-native-business-plan]].
