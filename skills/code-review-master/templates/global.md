---
budget: { slots: 5, max_files_per_axis: 40, confirm_above: 20, max_agents: 41, max_files_per_part: 12 }
confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 }
gate: blocking
gate_on_disputed: true
codex: { enabled: true, timeout_s: 300 }
---

# Global review configuration

Applies to every repository. A repository's `.claude/review/config.md` overrides
any setting here, replaces an axis by declaring the same `id`, and removes one
with `disable: [<id>]`.

## Report language and register

The report is written in **Polish**. Severities are `blocking` (blokujące),
`suggestion` (sugestia) and `nitpick` (drobiazg).

Every sentence names its referent. Not "something gets thrown", but
"`apiRequest` throws `ApiError(401)` at `api-client.ts:124`". Passive voice must
not hide the actor: if something is called, set, or cleared, name the function or
the line that does it. Order and causality are explicit, and "before" and "after"
point at lines. Code references are always `file:line`.

## What is a false positive

Never report:

- a pre-existing issue on lines the change did not touch;
- anything a linter, typechecker, or compiler catches — the repository names its
  `lint` and `typecheck` commands in this configuration, and they run separately;
- a nitpick a senior engineer would not raise: styling with no rule behind it, a
  preference stated as a defect, a rename that changes nothing;
- a finding deliberately silenced in code with a justified suppression comment;
- a functional change that is plainly intentional and part of the broader change.

## Secrets in the repository

```yaml
id: secrets
when: always
rank: always
severity_default: blocking
max_files_per_part: 40
semgrep: [p/secrets]
reads: search
```

- No credentials, API keys, tokens, or private keys committed to the repository.
- No committed `.env`; `.env.example` carries placeholder values only.
- A secret that reaches git history is blocking even after it is deleted from the
  working tree.

## Debug leftovers

```yaml
id: debug-leftovers
when: always
rank: rotate
severity_default: nitpick
max_files_per_part: 40
reads: search
```

- No `console.log`, `debugger`, or `print` left in production files. Test files
  and deliberate logging through the project's logger are exempt.
- No commented-out blocks of code. Deleted code lives in git history.

## Correctness and behaviour regressions

```yaml
id: correctness
when: always
rank: always
severity_default: blocking
```

- Compare what each changed file did before the change with what it does now;
  the diff shows what was removed or replaced. A behaviour an existing user,
  role or caller relied on, which the change alters or drops without that being
  its stated purpose, is blocking.
- Rendering conditions and access branches: whatever is shown, hidden, enabled
  or disabled depending on who the user is or what state they are in (role,
  enrolment, ownership, purchase, feature flag, loading, empty, error) is
  correct for every kind of user who can reach it. An element rendered without
  a condition where the previous version or sibling code guards it is blocking.
- A changed function, hook, component or endpoint still satisfies every caller:
  search for its usages before judging a changed signature, default, return
  value or thrown error.
- Edge cases of the changed logic: an empty list, a missing or null value, zero,
  the first and the last item, the boundary of a range, a request that fails.
  Report an edge case only when you can name the input and the wrong result it
  produces.

## Conformance with the issue

```yaml
id: issue-conformance
when: always
rank: always
severity_default: blocking
needs: [issue]
max_files_per_part: 40
```

- Every acceptance criterion and every requirement in the issue's description
  is met by the code, whether its checkbox is ticked or not: a tick is the
  author's claim, not evidence. An unmet element is blocking. A test the issue
  requires counts the same way: missing, or written so that it cannot fail, it
  is blocking.
- Every change belongs to the issue. A changed file, or a changed hunk inside
  a file the issue does cover, that no requirement of the issue calls for is
  code from another task and is blocking, however correct it is.
- A view, screen or component the issue names is compared with its design in
  Figma by the session that runs this review, not by you: judge behaviour and
  scope, not visual fidelity.
- Each finding quotes, in its claim, the sentence of the issue it rests on, and
  is anchored to a line of a changed file: the line that breaks the requirement,
  the line where the missing behaviour would have to be, the declaration of the
  unit that lacks a required test, or the first changed line of the hunk that
  is out of scope.
