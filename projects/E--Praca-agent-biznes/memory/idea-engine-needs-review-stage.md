---
name: idea-engine-needs-review-stage
description: "Rafał wants to steer the idea-engine's content, not just its procedure: brainstorming on the concept, Polish readable findings, a realistic interview plan — the built pipeline gives JSON and a hand-off (2026-09-07/08)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 226bb5ac-01d2-4b69-b371-68c264dfd5f2
  modified: 2026-09-08T07:02:12.132Z
---

After the first full `import` + `validate fit-fast-food` run (2026-09-07) Rafał said he had imagined it differently: he expected a stage where I explain and we discuss the research results and possibly change the plan before moving on. On 2026-09-08 he restated it more sharply: the run lacked any brainstorming ("odbijanie pomysłów, burza mózgów"), the conclusions were invisible to him ("nie wiem jakie są w ogóle wnioski z opracowania"), everything landed in JSON files he cannot read, and the hand-off to interviews left him not knowing whom to call. The only two questions the engine asked him in that run were procedural (screen vs import; accept the default title/concept).

**Why:** the engine is a decision tool for Rafał, not an unattended pipeline. He wants to take part in shaping the concept and interpreting evidence; the JSON layer is for the CLI and a future app, not for him.

**How to apply:** any mode that produces findings must end with a Polish, human-readable layer (conversation and/or a document in the idea directory) before proposing the next mode; the concept itself must be open to variants before expensive research; interview output must be actionable (few questions, concrete kinds of people and where to find them). Treat adding these stages to the skill/spec as a design change that goes through brainstorming with Rafał. Related: [[specs-self-contained]], [[ai-native-business-plan]].
