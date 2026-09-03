# PURPOSE: github-tickets

Section names below are Polish because `evolve-skill` reads them by those names.
The rest of the file is English, like the skill.

## Pochodzenie

Created 2026-09-03, in one session, from a design approved in that session:
`docs/superpowers/specs/2026-09-03-github-tickets-skill-design.md` in the
`edu_saas` repository, with the implementation plan at
`docs/superpowers/plans/2026-09-03-github-tickets-skill.md` (that directory is
gitignored, so the plan is local only). Nothing here is reconstructed; every item
below has a named source.

**What the skill was built to fix.** Ticket writing had no owner. The procedure
was reconstructed from the previous batch every time, the rules were recorded in
a memory file written for Jira and left stale after the move to GitHub issues,
nothing checked a batch before it shipped, and no mistake ever became an
improvement, because the wiki loop had no patterns about ticket writing to grind.

**Rules absorbed from elsewhere.** These lived as memory files and now live in
the skill and in `docs/ticket-conventions.md`:

- Four of the five ticket rules from `feedback-junior-tickets-no-code.md`, taken
  as they were: no em dash, never solution code, English titles, and an epic
  description written as its own text rather than repeated inside the tickets.
- The fifth rule, **revised on the day the skill was born**. It asked for tickets
  that are "fairly descriptive" and "describe flows step by step". It now says the
  opposite about depth: name the goal, the contract and the mechanism, and let the
  implementer discover the wiring. The audience is still an inexperienced junior;
  what changed is how much of their job the ticket does for them. Issue #168, the
  clearest example of the old style, stopped being the model on the same day.
- The split rule from `feedback-fe-mocks-then-wiring.md`: a frontend view and its
  states are one ticket built on fixtures, and wiring it to the API is another.

**Decisions made in the design session, with their reasons.**

- The skill sends to GitHub itself, rather than printing commands to paste,
  because the user asked for it, gated behind an explicit send.
- The `CP` prefix stays and the skill computes the next number, because the
  existing issues carry it and the team speaks in those numbers.
- Project parameters live in `docs/ticket-conventions.md` in the repository, not
  in the skill, so the skill works in the next project.
- Assignees are never set by the skill: that is a decision about people.
- Area labels are set by the skill, because the labels existed in the repository
  and no issue used them.
- Dependencies are set as native GitHub relations, not only as prose, because the
  repository already used them and leaving them in prose meant the owner setting
  every one by hand after every batch.
- A rewrite mode was considered on 2026-09-03 and **declined by the user**. The
  rewrite prompt survives in `references/codex-review-prompt.md` as prompt B, for
  the ad-hoc case; there is no dedicated mode and step 5 points at it.

**What the skill was taught by its own construction.** The rules were applied by
hand to fifteen existing tickets (CP-89 to CP-103) before the skill existed, and
codex reviewed the result. Five findings were right, and four of them became
lines in `references/self-check.md` under "From findings":

- a whole scope item was cut in the name of the depth rule, not just a detail;
- two constraints that cannot be recovered from code were cut the same way;
- two false claims about the repository were carried forward from the old bodies
  because published text was treated as verified text;
- one acceptance criterion was impossible inside the ticket's own scope.

The checklist therefore started at twenty-three lines rather than the nineteen
the plan predicted. The same batch confirmed that reading state immediately
before drafting is not pedantry: the highest reserved number rose from 98 to 103
inside one hour, because another session was working in parallel.

**Patterns this skill already addresses at birth**, from `~/.claude/wiki/`:

- `windows-path-w-literale-skryptu`: step 3 requires the file-writing tool rather
  than a shell heredoc, because ticket text carries apostrophes and Windows
  paths. This fired again during construction, on a heredoc holding English
  possessives.
- `twierdzenie-o-pliku-bez-odczytu`: step 1 requires reading state from tools,
  step 8 requires reading the result back from GitHub, and the red flags forbid
  both remembering a number and trusting a command that returned no error.
- `opcje-z-tego-co-mierzalne-nie-z-celu`: gate one presents a split, which is the
  goal, rather than metrics about the drafts.

## Historia ewolucji

(empty: no evolution proposed by `evolve-skill` yet)
