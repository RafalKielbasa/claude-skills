# PURPOSE: board-tracker

Section names below are Polish because `evolve-skill` reads them by those names.
The rest of the file is English, like the skill.

## Pochodzenie

Created 2026-10-09 from a design approved section by section in one session:
`docs/superpowers/specs/2026-10-09-board-tracker-design.md` in `D:\Praca\Devstock\Baza wiedzy`
(repo `devstock-org/devstock-team`), with the plan
`docs/superpowers/plans/2026-10-09-board-tracker.md`.

**What it was built to fix.** On 2026-10-09 Rafał's board showed three items in progress, untouched
since 2026-07-24, 2026-09-13 and 2026-09-16, one of them (#412) declaring itself pointless, while
his commits (35 on 2026-10-08 alone) covered topics with no issue at all. He also said he forgets to
work through his backlog.

**Decisions with their reasons** (all Rafał's, from the brainstorming):

- Source of truth: Claude Code sessions in four registered repositories; commits without Claude
  and work outside repositories are out.
- Work without an issue: a card at the start, the work starts at once, the issue waits for "tak".
- One issue per topic across sessions, a sub-issue of its epic.
- In a code repository with its own issue, bind to that issue; DT only when none exists anywhere.
- Claude ranks next tasks with a reason; no board field is changed to make ranking possible.
- A one-time inventory of open threads from 30 days, plus a review of existing open items.

## Historia ewolucji

- 2026-10-09: created.
