---
name: feedback-tickets-are-github-issues
description: "Tickets are GitHub issues in kodozercy/edu_saas; Jira is gone and every \"*-jira-tasks.md\" working file was deleted — any memory that says Jira is stale"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2575f4f5-c048-4594-a22b-bb2a19579e3c
  modified: 2026-09-04T09:20:42.277Z
---

Tasks for the team are **GitHub issues** in `kodozercy/edu_saas`. Jira is not used
at all. The `docs/superpowers/plans/*-jira-tasks.md` working files that used to
hold ticket text were all deleted (verified 2026-09-04: none on disk, none in the
notes vault). CP numbers (`CP-89`) remain the internal task ids and appear in
issue titles.

**Why:** Rafał on 2026-09-04: "jira ticket już nie obowiązuje, są to issues na
github, zmień w swojej pamięci ten zapis bo myli". Memories that said "enter into
Jira" or pointed at jira-tasks files were misleading him.

**How to apply:** say "issue" or "GitHub issue", never "Jira ticket". The source
of truth for a ticket's text is the issue body (`gh issue view <n>`), not a local
file. Writing tickets: the `github-tickets` skill and `docs/ticket-conventions.md`
([[feedback-junior-tickets-no-code]]). Current issue state:
[[github-issue-candidates-2026-08]].
