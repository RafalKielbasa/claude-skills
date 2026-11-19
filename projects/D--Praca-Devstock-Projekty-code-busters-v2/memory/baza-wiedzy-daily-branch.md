---
name: baza-wiedzy-daily-branch
description: Baza wiedzy works on a daily branch rafal-kielbasa/DD-MM-YYYY (merged to main by PR); another session may switch the shared tree to it mid-session
metadata:
  node_type: memory
  type: project
  originSessionId: a4902244-17fa-4847-b225-68b59e61f86f
  modified: 2026-11-19T11:01:58.533Z
---

Baza wiedzy (`D:\Praca\Devstock\Baza wiedzy`, devstock-org/devstock-team) is worked on through a daily branch `rafal-kielbasa/DD-MM-YYYY`, created from `main` during the day and merged by PR (e.g. #1044 for 18-11-2026). On 2026-11-19 another session switched the shared working tree from `main` to the new daily branch between two commits of this session, so later commits landed there.

**Why:** the working tree is shared between sessions; the branch can change under a running session.

**How to apply:** check `git branch --show-current` as a separate step before each Baza wiedzy commit (not chained with the commit) and name the branch in the report; a daily branch built from `main` that already holds the session's earlier commits is the expected place, not an error.
