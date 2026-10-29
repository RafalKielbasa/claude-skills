---
name: kursy-tylko-z-galezi-dnia
description: "Course work (render, recording, montage) always runs in the main \"Baza wiedzy\" folder on the day branch, never in a .claude/worktrees worktree"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b67499c5-b75f-4569-a232-0f9261ba1dbe
  modified: 2026-10-28T15:15:26.821Z
---

Course production (`kursy/`: przebiegi, nagrania, lektor, montaż, `final.mp4`) always runs in the main folder `D:\Praca\Devstock\Baza wiedzy` on the day branch `rafal-kielbasa/DD-MM-YYYY`, never in a worktree under `.claude/worktrees/`. When the day branch lacks commits already merged to `origin/main` (e.g. automat fixes from another lesson), merge `origin/main` into the day branch first (`git fetch` before comparing — local `main` goes stale). Decided by Rafał 2026-10-28 (lesson 2.3, after 2.1 had been produced in worktree `baza-wiedzy-agenty-ai-modul-2-bilet`).

**Why:** media (`final.mp4`, recordings, lektor) are gitignored and non-recoverable in part; they live only in the folder that rendered them, so removing a worktree loses them.

**How to apply:** at the start of any course session, work from the main folder; if the lesson's history sits on a worktree branch, check it is merged into `origin/main` and merge that into the day branch. Related: [[tryb-commitow-per-repo]], [[commit-pathspec-wspolny-indeks]].
