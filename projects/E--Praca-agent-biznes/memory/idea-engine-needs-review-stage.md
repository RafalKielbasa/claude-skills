---
name: idea-engine-needs-review-stage
description: "Rafał must be able to steer an idea's content, not just the engine's procedure — the complaint that produced the vision mode, and the shape of the fix (2026-09-07/09)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 226bb5ac-01d2-4b69-b371-68c264dfd5f2
  modified: 2026-09-08T22:25:35.188Z
---

After the first live `import` + `validate fit-fast-food` run (2026-09-07) Rafał said the engine had given him no way in: no brainstorming, no idea what the research concluded, everything in JSON he cannot read, and a hand-off to interviews without knowing whom to call. Seventeen agents ran; he was asked two procedural questions.

**Why:** the engine is his decision tool, not an unattended pipeline. He wants to shape the concept and interpret the evidence; JSON is for the CLI and a future app, not for him.

**Fixed on 2026-09-09** by the `vision` mode (spec `docs/superpowers/specs/2026-09-08-idea-engine-vision-mode-design.md`, 13 commits, suite 246). What the fix assumes, and what to preserve if this area is touched again:

- A business is eleven blocks in one Polish `vision.md`, each with a thesis, evidence and a status. Brainstorming happens in conversation before any research is dispatched; light desk research runs one agent per block and writes a Polish note.
- Every mode that produces findings ends by explaining them to Rafał in Polish and asking what to change, then waiting. The `validate` discussion must be read from `claims/*.json` and `model/assumptions.json`, never from the CLI's summary counts — narrating counts is the original defect.
- The block note's `## Odpowiedzi` section comes first in that discussion: it answers the questions Rafał himself wrote. A review caught its omission; shipping without it would have rebuilt the machinery and kept the defect.
- `validate` is gated behind a finished vision so fifteen agents are not spent on an unshaped idea, and its researchers receive the vision instead of one sentence from `idea.json`.

Still open, deliberately: the interview planner is unchanged, so plans still name roles and not where to find such people. Rafał deferred that to a separate spec. Related: [[specs-self-contained]], [[ai-native-business-plan]].
