# skill-invocation-rule-overrides-user-usage-limit

- **Skill:** ogólny (superpowers:using-superpowers × code-review-master)
- **Typ:** porażka
- **Status:** otwarty

## Opis
A request matching a skill's trigger ("przygotuj weryfikację … w PR") makes Claude load
`code-review-master`, whose run dispatches 1 + 2 × axes agents, although the user's memory caps
subagents at 3 and says a PR review request means an inline review. The conflict surfaced only after
the skill was loaded and `crm plan` had run, before any dispatch.

## Przyczyna źródłowa
`using-superpowers` says a skill that applies even at 1% must be invoked before any response, and that
check runs before memory feedback is weighed. The memory rule is phrased about agents and about
`/code-review`, not about `code-review-master`, so the trigger match wins the first step; the skill's
own budget appears only later, in `crm plan`.

## Dowody
- 2026-10-12, sesja 41420c90-30dc-4fb8-a253-35e0054ade7a (saas app): Rafał — „Przygotuj proszę
  weryfikację backendu egzaminu Konrada…”. Claude invoked `code-review-master` on its own and ran
  `crm plan` (`reports/20261012-135518-uffd-plan.json`), then stopped before dispatch because
  `feedback-no-multiagent-fanout.md` sets the limit at 3; the review was done inline. The second
  review in the session (PR #200) went inline from the start.

## Rozwiązanie
Before invoking a skill whose run dispatches agents, check memory feedback for a usage limit; a user
rule capping agents or saying "review = inline" outranks the skill's trigger, because user
instructions outrank skills. Use only the skill's deterministic parts (e.g. `crm plan` for axes and
checklists) when they help, and say in one line that the multi-agent run is skipped and why.
