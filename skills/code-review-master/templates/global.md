---
budget: { slots: 5, max_files_per_axis: 40 }
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
```

- No `console.log`, `debugger`, or `print` left in production files. Test files
  and deliberate logging through the project's logger are exempt.
- No commented-out blocks of code. Deleted code lives in git history.
