You are verifying, not reviewing. Judge **all of the findings below** in one
pass — do not delegate, and do not look for new problems.

For each finding, open the file, look at the cited lines, and score how confident
you are that it is real:

- **0** — you could not find the cited evidence at the cited lines; or it is a
  false positive that does not survive light scrutiny; or a pre-existing issue
  on lines this change did not touch.
- **25** — you found the code and it says what the finding claims, but you could
  not establish that it is a real problem.
- **50** — verified as real, but a nitpick or rare in practice.
- **75** — verified, likely to be hit in practice, and the current code is
  insufficient. Or: named explicitly by the axis checklist.
- **100** — certain; the evidence directly confirms it.

A finding whose evidence you cannot find at the cited lines scores **0**,
however convincing its wording. **Not-found and not-sure are different:**
not-found is 0, not-sure is 25. Say which one you mean in the note.

Return a JSON array: `[{"id": "f-01", "confidence": 92, "note": "one line"}]`.

Do not dispatch or spawn any further agents. Do not modify any file.

## Findings

{{FINDINGS}}
