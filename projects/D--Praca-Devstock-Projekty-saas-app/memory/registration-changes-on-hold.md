---
name: registration-changes-on-hold
description: "Decision 2026-07-15: no registration-flow changes until PR #105 review done — CP-78/CP-81 written but ON HOLD"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3d3f6afb-0f97-44f2-a6d7-436ffb1a0573
  modified: 2026-08-21T11:09:13.180Z
---

Rafał's decision (2026-07-15): **no changes to the registration flow** until the review of PR #105 (CP-70/71/72 login/register views) is finished; revisit afterwards.

**Update 2026-08-21:** PR #105 merged 2026-07-20 → the hold's formal condition has expired. Do NOT unblock CP-78/81 on your own — Rafał's explicit decision is still required; they are still not on GitHub. The profile half of the doc WAS entered on 2026-08-21: epic #154 with #155 (CP-79), #156 (CP-80), #157 (CP-82). Two stale claims were corrected when entering them: there is no users module in the API at all (not "a service without a controller"), and the student profile page now lives under tenant routing (`app/tenant/[subdomain]/(student)/profile/`), not a flat `/profile` file.

**Why:** registration views are mid-review; adding the subdomain live-check endpoint + form wiring now would churn the same code.

**How to apply:** CP-78 (subdomain availability endpoint) and CP-81 (live-check in /register) are fully written in `docs/superpowers/plans/2026-07-15-profile-registration-jira-tasks.md` but marked WSTRZYMANE — do not enter them into Jira or propose registration work until Rafał unblocks. Profile tickets CP-79/CP-80/CP-82 from the same doc remain active. Figma states for the live-check already exist (nodes 304:21, 304:294 on page 76:7). Related: [[student-tenant-resolution-blocker]]
