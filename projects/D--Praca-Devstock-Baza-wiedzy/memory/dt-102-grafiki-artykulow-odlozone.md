---
name: dt-102-grafiki-artykulow-odlozone
description: "DT-102 article images — plan 1 executed 2026-11-12, partly accepted; open: phone check (#432 draft), probe P3 after prod release"
metadata:
  node_type: memory
  type: project
  originSessionId: 91257f05-fa1f-48b2-b84f-d0fc0b9e0932
  modified: 2026-11-12T19:06:57.504Z
---

DT-102 (devstock-org/devstock-team#853), part `content-deploy-article-images`: plan 1 executed and partly accepted on 2026-11-12. The pipeline code sits on the day branch `rafal-kielbasa/12-11-2026` (`5d0746fd`..`31aa6651`). The CMS route `/api/course-pipeline/asset` was merged in kodozercy/code-busters#1749. Mobile is in the draft PR kodozercy/code-busters-mobile#432. Probes P1 and P2 passed. Acceptance report: `docs/superpowers/specs/2026-11-12-content-deploy-article-images-plan-1-acceptance.md`.

Open:
- Rafał's phone check (iOS and Android) of lesson 1 of `misja-ai-start`; #432 leaves draft only after it.
(`review-ai` with images passed on 2026-11-12: 127 s on the Pro model. On Rafał's "OK" the timeout is now 300 s, overridable by `GEMINI_TIMEOUT_MS` (`5415348d`), and the styleguide allows article images (`65ef0000`); both closed.)
- Probe P3 after the prod release with the route, only on Rafał's word.

The SDD ledger stays in `.superpowers/sdd/2026-11-12-content-deploy-article-images-plan-1/` until these close.

**Why:** every deploy of code-busters `main` reseeds staging. On staging, `misja-ai-start` lives in the seed course „Wprowadzenie do Sztucznej Inteligencji” (`cmg0pne2g000iejpdfekwmd8l`), not under its own name.

**How to apply:** after each merge to `main`, one staging send per course rebuilds staging. `--dry-run` does not show the reset. Image production is separate work: #921 (DT-140). See [[tts-model-decyzja-v2-przerwy]] for courses pinned to v2.
