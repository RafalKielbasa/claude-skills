# ranking-from-session-start-snapshot

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
The ranking and "Do zamknięcia?" proposals are built from the candidate list read at the start of the
session. Hours later, after a parallel session has moved items and recorded decisions, Claude still
presents that list as the current board.

## Przyczyna źródłowa
The skill says "Use the brief's candidate list or `candidates`", so a snapshot is an accepted source.
The four boards are shared by parallel sessions on the same day, and same-day decisions about items
(archive instead of close, status moves) are recorded in the session journal, which the ranking step
never reads.

## Dowody
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai niedostępny): twice, after
  #641 went to Done and again in a later status line, Claude wrote "W Ready zostały #96, #151 i #166"
  from the `candidates` call made at session start. Another session (53ceea80) had moved #96 to Done
  and #151/#166 to backlog the same day; found only while writing the brief, when its journal entry
  was read (`gh issue view`: #96 `CLOSED`, #151/#166 `Backlog`). The same stale view proposed
  "Do zamknięcia? #355" without knowing Rafał had chosen that morning to only archive its card.

## Rozwiązanie
Run `candidates` immediately before every ranking you show, including after `status --to done`; never
reuse a list read earlier in the session or the brief's list. Before proposing "Do zamknięcia?", grep
today's entries in `D:\Notatki\notatki\praca-z-claude.md` for the issue number; a same-day decision
about it is shown with the proposal.
