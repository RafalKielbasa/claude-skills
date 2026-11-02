---
name: python-crlf-on-windows
description: "Python text-mode writes on this Windows machine turn LF repo files into CRLF and blow up the diff; open with newline=''"
metadata:
  node_type: memory
  type: feedback
  originSessionId: f41f82bc-6d72-42e8-9246-cc22711b50cb
  modified: 2026-11-02T09:26:55.249Z
---

Editing repo files with a Python one-off (`open(p, 'w')` in text mode) on Rafał's Windows machine rewrites every `\n` as `\r\n`. The repo files are LF, so `pl.json` showed a 5,600-line diff for a 10-line change (2026-11-02).

**Why:** Python's default `newline=None` on write translates to `os.linesep`. Prettier fixes it for files it formats, but not for `.graphql`/`.json` you don't run it on.

**How to apply:** in Python edits use `open(p, encoding='utf-8', newline='')` for both read and write, or prefer the Edit tool; after any scripted edit check `git ls-files --eol <files>` (want `w/lf`) and fix with `sed -i 's/\r$//'`.
