# Self-check

Run against every draft before the user sees anything. Report failures as your
own, plainly, without softening them, and say how many checks you ran. A run
where you found nothing is a claim that every line below holds.

This list grows. When a codex finding turns out to be right and this list did not
catch it, that finding becomes a new line here, and the wiki pattern recording it
says so. Lines marked with a date came from a finding on that date.

## Per ticket

- [ ] Title is English and starts with the number, `<PREFIX>-<n> <Title>`.
- [ ] Body is Polish.
- [ ] No em dash and no en dash anywhere in the body.
- [ ] No solution code: no model, service, controller, DTO or component code.
- [ ] Every contract is a table, not a code block.
- [ ] The body names the mechanism to use, not the sequence of edits. No list of
      files to touch, no call sites, no "then wire it into X", unless it is a
      constraint the code cannot express, stated in a sentence.
- [ ] The ticket names the spec and the sections it comes from, and does not
      restate the spec's reasoning.
- [ ] Every path, module and file named in the body exists in the repository, or
      the body says this ticket creates it.
- [ ] Acceptance criteria are checkboxes, and each one is checkable by someone
      who did not write the ticket.
- [ ] Acceptance criteria state behaviour, not structure. A criterion naming a
      file is the walk-through coming back through a side door.
- [ ] Dependencies are named by ticket number, or the section says there are none.
- [ ] Out of scope is stated.
- [ ] A frontend ticket that renders a view builds on fixtures, and wiring it to
      the API is a different ticket.
- [ ] Domain terms used in the body are spelled out at first use.

### From findings

- [ ] **(2026-09-03)** Nothing that cannot be recovered from the code has been
      dropped. Compare against the source (the spec, or the previous body when
      rewriting) block by block, and for every block you removed, ask whether the
      implementer could reach it by reading the repository. A forced ordering, a
      lifetime rule, a framework requirement and an agreed value cannot be
      reached. Losing one of those is not a shorter ticket, it is a broken one.
- [ ] **(2026-09-03)** Every claim about how the repository behaves today was
      verified now, in the code, not carried over because the source already said
      it. Published text is not verified text.
- [ ] **(2026-09-03)** Every acceptance criterion is achievable inside this
      ticket's scope. A criterion about the whole repository ("X does not occur
      anywhere") fails when a third occurrence sits outside the scope.

## Per batch

- [ ] Numbers are consecutive from the reserved start and none collides with an
      existing issue.
- [ ] Every ticket in the batch belongs to exactly one epic.
- [ ] Every ticket has exactly one area label.
- [ ] Dependencies between tickets in the batch form no cycle.
- [ ] Every section of the spec is covered by at least one ticket, or is listed
      in the epic's out of scope.
- [ ] No ticket promises behaviour the spec does not describe.
