---
name: commit-pathspec-wspolny-indeks
description: "In the shared \"Baza wiedzy\" working tree commit only with an explicit pathspec - other sessions leave staged changes in the same git index"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 240fd64b-d029-4c19-997c-a49301c018df
  modified: 2026-10-20T08:22:15.513Z
---

In "Baza wiedzy" several sessions work in one folder, so they share one git index. A plain `git add <my files>` + `git commit -m ...` also commits whatever another session staged. On 2026-10-20 the lesson 2.2 commit `d045f8df` (#721) swept in the 2.1 session's staged deletion of `lekcja-01-tools-agent-wtyczki/video/dane-do-nagrania.md` and +11 lines of `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js` from another session.

**Why:** a commit carrying other sessions' changes under the wrong message and issue is hard to untangle on the shared day branch: rewriting history needs Rafał's explicit request, and other sessions keep committing on top.

**How to apply:** commit as `git commit -m "..." -- <path> <path>` (pathspec commits only those paths, whatever else is staged); check `git diff --cached --stat` before any commit; after it, `git show --stat HEAD` must list only this session's files. Related: [[tryb-commitow-per-repo]].
