---
name: galaz-dnia-scalona-w-trakcie-sesji
description: "The day branch can be merged and deleted by another session mid-session, leaving the shared folder on main; check the branch in a separate command and stop on main"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8c81b3d1-cb64-4c72-97ce-98d2b72ade56
  modified: 2026-10-30T07:29:18.624Z
---

In "Baza wiedzy" another session can merge the day PR, run `git switch main` and delete `rafal-kielbasa/<data>` while this session is still working. The shared folder is then on `main`, and the next commit lands there. This happened on 2026-10-29: PR #822 was merged at 20:28, and commit `f01f4be4` (lesson 3.1) went to local `main`. A chained `git branch --show-current && git commit` printed "main" and still committed.

**Why:** the working tree and the checked-out branch are shared between sessions. A check chained into the commit command does not stop the commit.

**How to apply:**
- Run `git branch --show-current` as its own command before every commit, and read the result before sending the commit.
- If it says `main` after a merge, stop and ask Rafał.
- The fix used on 2026-10-30, on his word: create a new day branch from local `main` (it carries the stray commit), then `git branch -f main origin/main`.

Related: [[commit-pathspec-wspolny-indeks]], [[kursy-tylko-z-galezi-dnia]].
