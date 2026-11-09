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
- [ ] **(2026-09-09)** In an investigation ticket, every hypothesis passes two
      checks, not one: the code or configuration state it describes is true
      today, **and** that state could actually produce the reported symptom. A
      true fact that cannot produce it is worse than no hypothesis, because the
      rest of the ticket is verified and the reader trusts this line too.
- [ ] **(2026-09-09)** A criterion asking for no regression names the scenario to
      re-run. "X behaves as before" is not checkable without asking the author
      what "before" covered.
- [ ] **(2026-09-20)** A sentence that restates a rule from the spec or another
      governing document (a gate, a deadline, a disqualifier, a threshold) keeps
      the rule's exact condition. Compare the condition word by word with the
      source: "no accepted plan" is a different rule from "no submitted plan",
      and a ticket that tightens or loosens a rule contradicts the document it
      points at.
- [ ] **(2026-10-15)** A claim about several elements at once ("X, Y and Z do W")
      is checked per element in the code. A reviewer's summary that groups them
      is a hypothesis for each one: in CP-109 a review comment said three state
      screens were "not centered", but the loading skeleton never centres.
- [ ] **(2026-11-09)** Every manual verification step passes the same two tests
      as an acceptance criterion: its result is observable, and it can be carried
      out under every choice the ticket leaves to the implementer. A step that
      depends on an optional outcome ("the rule that was moved") is written as
      conditional. "Answers without reading the file" is not observable;
      "answers without a file-read tool call" is.
- [ ] **(2026-11-09)** Every example command in the body was run or grepped and
      produces the result the body states. A file that exists but does not
      contain the searched text makes the example prove nothing.
- [ ] **(2026-11-09)** The rows of a contract table are checked against each
      other: no example in one row also matches another row with a different
      outcome. In DT-128 `node --env-file=.env` sat in an "allowed" row while it
      also named the file that the "refused" row covers.
- [ ] **(2026-11-09)** When the body documents a limit of the mechanism it
      prescribes, the contract is achievable under that limit. "Confirm by
      trying" does not resolve a contradiction the documentation already decides.
- [ ] **(2026-11-09)** An exception in a contract is no wider than the instruction
      it serves: it names the concrete commands or files, not a pattern that lets
      an arbitrary script through.
- [ ] **(2026-11-09)** A number read from a session's context rather than from a
      file says so, because nobody can measure it again.
- [ ] **(2026-11-09)** A measurement of a file in another repository is taken from
      the default branch on the remote. The local checkout may stand on a feature
      branch: in DT-128 the audit measured the mobile `CLAUDE.md` on a `dt-37`
      branch at 201 lines, while `main` had 208.

## Per batch

- [ ] Numbers are consecutive from the reserved start and none collides with an
      existing issue.
- [ ] Every ticket in the batch belongs to exactly one epic.
- [ ] Every ticket has exactly one area label.
- [ ] Dependencies between tickets in the batch form no cycle.
- [ ] Every section of the spec is covered by at least one ticket, or is listed
      in the epic's out of scope.
- [ ] No ticket promises behaviour the spec does not describe.
