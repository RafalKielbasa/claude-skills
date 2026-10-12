# exam-assessment-material-kept-out-of-candidate-text

- **Skill:** ogólny (code-review-master `send`, board-tracker)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Success: before review remarks went to two exam candidates, the findings the planned requirement
change is designed to reveal were held back, and the tracker issue describing the work was written
without scores, the change variant or the withheld findings.

## Przyczyna źródłowa
The repo's review rule makes every duplicate a finding, so the default path sends everything. The
assessment design (requirement change variants, defence questions) lives in the vault, outside the
repo, and is consulted only if Claude goes looking. A remark pointing at the exact duplicate the
change tests turns the change into a known fix and destroys its diagnostic value; text on a shared
tracker can reach a candidate later.

## Dowody
- 2026-10-12, sesja 41420c90-30dc-4fb8-a253-35e0054ade7a (saas app): Konrad, PR #199 — copy of
  recipient resolution in `prisma/seed/announcements.ts:40-52` withheld, because variant A
  ("ogłoszenie do kursu także do owner i admin") tests whether recipients are resolved in one
  place; offered to Rafał as the default, sent without it (review 5493597602).
- Same session: Miłosz, PR #200 — `zmiana-wymagan.md` read before drafting; the hard-coded 7 days in
  `prisma/seed/verify.ts:438` and in tests withheld, because variant A (validity 1/7/30 days) tests
  whether expiry is computed in one place. Listed to Rafał as withheld, he answered „wyślij”
  (review 5494000452).
- Same session: DT-10 (devstock-org/devstock-team#646) body and trail without scores, variant or
  withheld items; `gh api repos/devstock-org/devstock-team` (`visibility=internal`) and the
  candidates' org membership (`no`) checked before writing, the content kept out regardless.

## Rozwiązanie
In any review or tracker text that a candidate may read: first read the assessment materials
(requirement change variants, defence questions) and drop every remark that would pre-empt them,
listing the withheld ones to the reviewer in chat. Keep scores, variants and withheld findings out
of every text outside the vault, even on trackers the candidates cannot open today.
