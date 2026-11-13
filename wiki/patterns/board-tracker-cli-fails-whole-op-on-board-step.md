# board-tracker-cli-fails-whole-op-on-board-step

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
`status --to done`, `close` and the card step of `create-task` return `ok:false` although the issue (or
card) reached the requested state; only one step of the operation failed. Taken at face value, the error means a retry or a false report to
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
- 2026-11-04, sesja e0cd735e-fa23-4ebd-8d25-7d8684be5ab4 (id claude.ai niedostępny; Baza wiedzy): `status --ref
  devstock-org/devstock-team#851 --to done` after Rafał's „Uważam że issue #851 jest do zamknięcia” returned
  `"GraphQL: Could not close the issue. (closeIssue)"`, exit 1. The skill's interim rule worked: one
  `gh issue view 851 --json state,stateReason,closedAt` showed `CLOSED`/`COMPLETED` at 10:31:08Z, no retry.
  The later `trail` on the same issue returned `closed: true`, as expected.
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; Baza wiedzy + code-busters-v2, DT-101 #852): `status --ref devstock-org/devstock-team#852 --to done` po „ok” (D1 A) zwrócił
  `"GraphQL: Could not close the issue. (closeIssue)"`, exit 1. Jeden odczyt `gh issue view 852 --json
  state,stateReason,closedAt` i zapytanie GraphQL o status karty: `CLOSED COMPLETED` 21:19:20Z, „Devstock main
  board: Done”; bez ponawiania. Późniejszy `trail` zwrócił `closed: true`, zgodnie z oczekiwaniem.
- 2026-11-13, sesja 7d286730-a904-4694-a25c-8e90c19e7273 (id claude.ai niedostępny; code-busters-mobile, zamknięcie DT-93 #834). Dwa przypadki w jednej sesji, w tym nowa komenda:
  - `create-task --status backlog` z nową kartą zwrócił `ok: false`, `failed: "card devstock-org/devstock-team#945: gh: Content already exists in this project"`, a `done` wymieniało już `card:…#945`. Następne z `next` `ensure --ref …#945 --status backlog` zwróciło `steps: []`, czyli karta była na tablicy w docelowym stanie; prawdopodobnie CLI dodawał ją drugi raz. Tej przyczyny nie sprawdzałem.
  - `status --ref …#834 --to done` zwrócił `"GraphQL: Could not close the issue. (closeIssue)"`, exit 1. `gh issue view` i zapytanie GraphQL pokazały `CLOSED`/`COMPLETED` o 10:29:21Z oraz Status `Done`. Bez ponawiania.

## Rozwiązanie
In the CLI: after a failing step, read the issue state and board status and return `ok: true` with a
`warning` when the target state is reached; treat "already closed" on `closeIssue` and "item is archived"
on a board update as non-errors. In the skill, until then: on `ok:false` from `status` or `close`, read
`gh issue view <n> --repo <repo> --json state,stateReason,projectItems` once and report that state; never
retry the command.
