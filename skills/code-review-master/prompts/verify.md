You are verifying, not reviewing. Judge **all of the findings below** in one
pass — do not delegate, and do not look for new problems.

The repository root is `{{REPO_ROOT}}`; every `file` below is relative to it.

For each finding, open the file, look at the cited lines, and score how confident
you are that it is real:

- **0** — you could not find the cited evidence at the cited lines; or it is a
  false positive that does not survive light scrutiny; or a pre-existing issue
  on lines this change did not touch.
- **25** — you found the code and it says what the finding claims, but you could
  not establish that it is a real problem.
- **50** — verified as real, but a nitpick or rare in practice.
- **75** — verified, likely to be hit in practice, and the current code is
  insufficient.
- **100** — certain; the evidence directly confirms it.

A finding whose evidence you cannot find at the cited lines scores **0**,
however convincing its wording. **Not-found and not-sure are different:**
not-found is 0, not-sure is 25. Say which one you mean in the note.

The findings were made against the checklist below and, where an issue is
shown, against that issue. When a finding rests on a checklist item or an issue
sentence, confirm two facts: the code at the cited lines does what the finding
says, and the checklist item or the issue sentence says what the finding says
it does. With both confirmed the finding scores at least **90**. How much the
rule matters is not yours to judge: the checklist and the issue decided that
already, and a confirmed breach marked down as "minor" or "a design choice" is
a real finding lost. Score lower only for what you could not confirm, and say
in the note which of the two facts that was.

A claim about what a Figma node shows was checked against the design by the
session that runs this review. You cannot open Figma: take that half as given,
verify the code half — that the cited lines render what the claim says they
render — and score on that.

A finding may carry `alsoClaimed`: other finders' claims at the same place.
Score the finding's own `claim`, not those. If an `alsoClaimed` entry describes a
real problem different from the `claim`, say so in the note.

Return a JSON array: `[{"id": "f-01", "confidence": 92, "note": "one line"}]`.

Do not dispatch or spawn any further agents. Do not modify any file.

## Checklist

{{CHECKLIST}}

{{ISSUE}}

## Findings

{{FINDINGS}}
