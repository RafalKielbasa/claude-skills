---
name: dt37-galaz-biblioteki
description: Kodożercy redesign lives on feat/rafal-kielbasa/dt-37-design-system-tokens in web and mobile; a task closes when its scope is ready on DT-37, the merge to main closes only the epic
metadata:
  node_type: memory
  type: project
  originSessionId: 7875e423-9ae8-4e55-a56b-31766c608f4e
  modified: 2026-10-26T07:29:31.118Z
---

Since 2026-10-16 (Rafał): the component library (#665, direction 8 „Pikselowe pola”, dark + light theme) and the related screen work go on the existing branch `feat/rafal-kielbasa/dt-37-design-system-tokens` in both code repos (web `code-busters-v2`, mobile `code-busters-mobile`). PRs #1652 (web) and #403 (mobile) go to `main` once, for the whole redesign.

Since 2026-10-26 (Rafał): the merge of DT-37 to `main` is the closing stage of the epic (redesign epic devstock-org/devstock-team#741; the merge itself is stream W5 #772 web and M5 #773 mobile), not of the individual tasks. A task (#665, #688, #651, W1–W4, M1–M4 …) is done and can be closed when its scope is ready on DT-37; "not merged to main" is not a missing item of a task. Rafał himself guards closing the epic through the merge.

**Why:** Rafał prepares the whole redesign first and deploys it in one go; tasks that are finished but waiting for the merge should not hang open.

**How to apply:** when assessing whether a redesign task can close, check its scope on DT-37 (commits, gates), not on `main`; list the merge to `main` only under the epic. Start new library/screen streams from DT-37 (sub-branches or worktrees merged back into it), never from `main`. Note: #665 and #741 are both children of #78, so #665 is not formally under the epic. Related: [[tryb-commitow-per-repo]].
