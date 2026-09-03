---
name: feedback-junior-tickets-no-code
description: "Ticket rules moved: the procedure lives in the github-tickets skill, the project parameters in docs/ticket-conventions.md; the descriptiveness rule was revised on 2026-09-03"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e4032bd2-589e-43fc-82d3-1fbaa145c2b6
  modified: 2026-09-03T12:47:04.989Z
---

Ticket-writing rules are no longer recorded here. Two places hold them now, and
this file exists only to point at them.

- **How a ticket is written and published:** the global skill
  `~/.claude/skills/github-tickets/`, with the shapes in its `references/` and
  its origin in `PURPOSE.md`.
- **What is specific to edu_saas:** `docs/ticket-conventions.md` in the
  repository, tracked in git, readable by the team as well as by the skill.

**Why:** the rules recorded here were written while the team used Jira and went
stale after the move to GitHub issues, while still reading as authoritative. Four
of the five (no em dash, never solution code, English titles, an epic description
of its own) moved unchanged to the two places above.

**The fifth rule was reversed on 2026-09-03**, and that is the one thing worth
remembering from this file. It used to ask for tickets that are "fairly
descriptive" and "describe flows step by step". It now says: name the goal, the
contract and the mechanism, and leave the wiring for the implementer to discover.
The audience is still an inexperienced junior; what changed is how much of their
job the ticket does for them. Two things are exempt, because neither can be found
by reading the code: a constraint the code cannot express, and a contract that
does not exist yet. Issue #168 was the clearest example of the old style and
stopped being the model on the same day, when CP-89 to CP-103 were rewritten to
the new one.

See [[feedback-fe-mocks-then-wiring]] for the split rule the skill also absorbed.

**How to apply:** when writing or reviewing a ticket, read
`docs/ticket-conventions.md`. Do not restate ticket rules in memory again: a rule
in two places drifts, which is exactly how this file went stale.
