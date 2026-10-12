# codex-reviewer-delegates-back-to-claude

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
A skill that calls `codex exec` as an independent second reader gets no review back. Codex hands the
reading to `claude -p`, the nested Claude cannot reach the API from the read-only sandbox, and Codex then
stops and asks the user whether it may do the work itself. The second opinion the skill relies on silently
becomes a question nobody is there to answer.

## Przyczyna źródłowa
The "Codex and Claude global execution contract" in `~/.codex/AGENTS.md` makes Claude the operational
executor and forbids Codex from taking over failed operational work without the user's explicit decision.
Reading a repository to review it counts as operational work, so Codex dispatches Claude even when Claude is
the caller. Under `--sandbox read-only` the nested `claude -p` has no network and fails at once.

## Dowody
- 2026-10-12, sesja bbf04b0a-b00e-4022-825d-4502fd8b5ab5 (id claude.ai niedostępny): `github-tickets` step 5
  for CP-108 ran `codex exec --sandbox read-only - < prompt`. Codex launched `claude -p` with its own brief,
  which ended `API Error: Connection refused — a firewall or proxy may be blocking it (ECONNREFUSED)`;
  Codex closed with "Czy mam wykonać całe review samodzielnie narzędziami Codexa?". Rafał skipped the codex
  review. The same session's `crm codex` (code-review-master, PR #202) returned `{"status":"timeout"}`;
  `crm codex` does not keep codex's stdout, so whether it was the same loop is not verified.

## Rozwiązanie
When a skill calls codex as a reviewer, the prompt says that for this call Codex is the reviewer itself,
reads the repository with its own read-only tools and must not dispatch Claude; or the global contract gets
an explicit exception for review calls made from Claude. Which of the two is Rafał's decision, because the
contract is shared by every project. Until then, treat an empty or timed-out codex result as "no second
opinion" and check its output for a `claude -p` dispatch before reporting it as "no findings".
