# board-tracker-cli-fails-whole-op-on-board-step

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
`status --to done` and `close` return `ok:false` although the issue reached the requested state; only
one step of the operation failed. Taken at face value, the error means a retry or a false report to
Rafał.

## Przyczyna źródłowa
The CLI runs several GitHub writes per command (board status, then `closeIssue`; or `closeIssue`, then a
board update) and reports the first failing step as the result of the whole command, without reading the
final state. The board's own automation closes issues moved to Done and archives closed cards, so a later
step of the CLI races with it or hits an archived item.

## Dowody
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai niedostępny): `status --to done`
  for devstock-team#412 and edu_saas#190 returned `"GraphQL: Could not close the issue. (closeIssue)"`;
  `gh issue view` seconds later: both `CLOSED`/`COMPLETED`, board `Done`. #98 and #641 went through
  cleanly. `close --ref devstock-org/devstock-team#355 --reason not_planned` returned
  `"gh: The item is archived and cannot be updated"`; the issue was `CLOSED`/`NOT_PLANNED`, its card
  archived earlier that day.

## Rozwiązanie
In the CLI: after a failing step, read the issue state and board status and return `ok: true` with a
`warning` when the target state is reached; treat "already closed" on `closeIssue` and "item is archived"
on a board update as non-errors. In the skill, until then: on `ok:false` from `status` or `close`, read
`gh issue view <n> --repo <repo> --json state,stateReason,projectItems` once and report that state; never
retry the command.
