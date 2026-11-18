You are reviewing one axis of a code review: **{{AXIS_ID}}**.

Judge the files below against this checklist and nothing else. Another reviewer
covers the other axes; a finding outside your checklist is noise.

## Checklist

{{CHECKLIST}}

{{ISSUE}}

## Change summary

{{SUMMARY}}

## Review these first

{{RISKS}}

## Repository

The repository root is `{{REPO_ROOT}}`; every path below is relative to it.
Open each listed file with your `Read` tool and read it in full: the diff never
shows the code around a change, and a file you only saw as a diff is a file you
did not review. Search the repository (`Grep`, `git grep`) whenever a checklist
item depends on code outside the listed files — a caller, a duplicate, a guard
that sibling code has. {{DIFF_NOTE}}

## Files

{{FILES}}

{{PART_NOTE}}

## What to return

Your whole reply is the JSON object: no explanation, no summary, no preamble.
Wrapping it in a ```json fence is fine; anything else around it is not.

```json
{"findings": [
   {"axis": "{{AXIS_ID}}", "file": "path/from/repo/root.ts", "lines": [88, 94],
    "severity": "blocking|suggestion|nitpick",
    "claim": "one sentence, in English",
    "evidence": "the exact line or lines from the file"}
 ],
 "read": ["path/from/repo/root.ts"],
 "searches": ["git grep -n \"isEnrolled\" -- apps/web"]}
```

`read` lists every file you opened and read in full, whether it was listed
above or not. `searches` lists every search and every command you ran, as you
ran it. Both are a record, not a claim: list only what you actually did.
An empty `findings` with an empty `read` is reported as a part not reviewed.

Unless the checklist item you are reporting against says otherwise, use
`{{SEVERITY_DEFAULT}}` — the axis's configured default. Choose a different
severity only when the specific finding plainly warrants it, and say why in the
claim.

`lines` is a [start, end] pair of 1-based line numbers, inclusive — the span
the evidence was taken from, not a list of interesting lines. For a single line
write it twice: `[88, 88]`.

`evidence` must be copied **verbatim** from the file. A finding whose evidence
does not appear in the file is discarded before anyone reads it, so never
paraphrase, never reconstruct from memory, and never quote a line you did not
open. Quote one line wherever one line carries the point.

It goes into a JSON string, so escape it as one: a double quote becomes `\"`, a
backslash becomes two backslashes, and a line break becomes `\n`. The check that
matches your quote ignores differences in spacing, so you need not reproduce
indentation exactly — everything else must be exact.

Return an empty `findings` array when the files are clean against your
checklist. An empty array is a valid, useful answer; an invented finding is not.

Do not dispatch or spawn any further agents. Do not modify any file.
