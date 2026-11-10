---
name: dt37-galaz-biblioteki
description: Kodożercy redesign was built on feat/rafal-kielbasa/dt-37-design-system-tokens in web and mobile and merged to main on 2026-11-04 (web #1730, mobile #403); new work starts from main, the epic #741 stays open for the store release and unconfirmed production steps
metadata:
  node_type: memory
  type: project
  originSessionId: 7875e423-9ae8-4e55-a56b-31766c608f4e
  modified: 2026-11-10T19:17:25.369Z
---

Since 2026-10-16 (Rafał): the component library (#665, direction 8 „Pikselowe pola”, dark + light theme) and the related screen work go on the existing branch `feat/rafal-kielbasa/dt-37-design-system-tokens` in both code repos (web `code-busters-v2`, mobile `code-busters-mobile`). PRs #1652 (web) and #403 (mobile) go to `main` once, for the whole redesign.

Since 2026-10-26 (Rafał): the merge of DT-37 to `main` is the closing stage of the epic (redesign epic devstock-org/devstock-team#741; the merge itself is stream W5 #772 web and M5 #773 mobile), not of the individual tasks. A task (#665, #688, #651, W1–W4, M1–M4 …) is done and can be closed when its scope is ready on DT-37; "not merged to main" is not a missing item of a task. Rafał himself guards closing the epic through the merge.

Since 2026-10-28 (Rafał: „Do main nie wdrażamy, wszystko ląduje na feature branchach”): nothing reaches `main` before W5/M5, not even the separate CMS PR code-busters#1669 (its branch is already in DT-37). A push to web `main` also auto-deploys the staging CMS (`deploy-main-cms.yml`, without `db:push`).

**Since 2026-11-04 the merge is done, so the "nothing to main" rule is over:** web PR code-busters#1730 (replaced #1652; `c195d145b`, no recorded review) and mobile PR #403 (`269393b2b`) are in `main`, web is on production from release `2026-11-04v1`. Checked 2026-11-05 on GitHub and EAS. Both look squashed: `main...DT-37` still shows ~285 commits ahead, so that comparison says nothing about whether work is merged. New work starts from `main` (DT-94 already does).

**Why:** Rafał prepared the whole redesign first and deployed it in one go; tasks that were finished but waiting for the merge should not hang open.

**How to apply:** do not start new streams from DT-37 any more; the epic #741 stays open only for the mobile store release and the unconfirmed production steps of W5. For the pre-merge history of a task, look at DT-37 commits, not `main`. **Web: since 2026-11-10 no local `dt-37-*` branch or W3–W5 worktree exists** (all deleted after a check that each tip is an ancestor of the #1730 head `da17cc22a`; none was on `origin`). The history is in `git fetch origin pull/1730/head`. The SDD ledgers of plans 5, 7 and 9 are in `.superpowers/sdd/` of the main checkout. Note: #665 and #741 are both children of #78, so #665 is not formally under the epic. Related: [[tryb-commitow-per-repo]].
