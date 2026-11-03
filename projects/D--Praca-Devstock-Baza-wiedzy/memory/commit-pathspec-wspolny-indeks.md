---
name: commit-pathspec-wspolny-indeks
description: "In the shared \"Baza wiedzy\" working tree commit only with an explicit pathspec - other sessions leave staged changes in the same git index"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 240fd64b-d029-4c19-997c-a49301c018df
  modified: 2026-11-03T12:25:38.885Z
---

In "Baza wiedzy" several sessions work in one folder, so they share one git index. A plain `git add <my files>` + `git commit -m ...` also commits whatever another session staged. On 2026-10-20 the lesson 2.2 commit `d045f8df` (#721) swept in the 2.1 session's staged deletion of `lekcja-01-tools-agent-wtyczki/video/dane-do-nagrania.md` and +11 lines of `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js` from another session.

**Why:** a commit carrying other sessions' changes under the wrong message and issue is hard to untangle on the shared day branch: rewriting history needs Rafał's explicit request, and other sessions keep committing on top.

**How to apply:** commit as `git commit -m "..." -- <path> <path>` (pathspec commits only those paths, whatever else is staged); check `git diff --cached --stat` before any commit; after it, `git show --stat HEAD` must list only this session's files. Related: [[tryb-commitow-per-repo]].

**Never `git commit --amend` here, and say so in every subagent brief.** HEAD can already be another session's commit seconds after yours. On 2026-11-03 a Task 4 implementer (content-deploy plan 1) amended its CRLF fix of `tools/course-pipeline/src/vimeo/lesson.js`; by then HEAD was the 3.3 session's `44ab3169`, which became `a873222d` with our file inside. Content was intact, but the other session's reported hash vanished from the branch. Fix your own mistake with a new commit.
