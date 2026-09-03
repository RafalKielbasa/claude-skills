---
name: edit-tool-crlf-flip
description: "On this repo the Edit tool can flip an LF file to CRLF, exploding the git diff to the whole file"
metadata: 
  node_type: memory
  type: project
  originSessionId: ac573fe8-a2b4-418c-8d70-7ac7dcfcc9aa
  modified: 2026-07-20T19:42:39.019Z
---

Editing source files in this repo (Python under `engine/`, `api/`; TS under `web/`) with the Edit/Write tools sometimes rewrites the file's line endings from LF to CRLF, which makes `git diff` show the ENTIRE file as removed-and-readded instead of the few lines actually changed. Seen repeatedly across engine tasks (variables.py, constraints.py).

**Why:** Bloated diffs waste reviewer context/cost and cause noisy merge conflicts; a genuine ~15-line change balloons to 100+ lines.

**How to apply:** After editing, run `git diff --stat <file>` before committing. If the changed-line count is way larger than your edit, the line endings flipped — fix with `sed -i 's/\r$//' <file>` (or `dos2unix`), re-verify the stat is small, and re-run the covering test before committing. Consider a repo `.gitattributes` with `* text=auto eol=lf` as a permanent fix. Related infra note: [[docker-desktop-cold-start]], [[ortools-sigill-workers]].

**Uzupełnienie 2026-07-20:** flip zdarza się w OBIE strony — skrypt Pythona
z `pathlib.write_text()` zapisał LF w pliku, który w repo jest CRLF
(`web/src/pages/ScheduleEditorPage.test.tsx`), diff urósł do 290 linii zamiast
16. Repo ma `core.autocrlf=false` i **brak `.gitattributes`**, więc git zapisuje
bajty as-is, a konwencja plików web/ to CRLF. Naprawa w tę stronę:
`sed -i 's/$/\r/' <plik>`. Do sprawdzania **nie używać `grep -c $'\r$'`** — w tym
środowisku Bash zwraca mylne wyniki (raz 153, raz 0 dla tego samego pliku);
wiarygodne jest `head -2 <plik> | cat -A` (szukaj `^M$`). Przy pisaniu plików
skryptem Pythona: `read_text(newline="")` + `write_text(..., newline="")`
zachowuje oryginalne końce linii.
