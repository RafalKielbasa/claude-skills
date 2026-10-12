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
- 2026-10-12, sesja 41420c90-30dc-4fb8-a253-35e0054ade7a (id claude.ai niedostępny; saas app): the
  same stale view in the binding step, not the ranking. In at least three answers the binding question
  offered "devstock-team#96 „[D2B-292] Określenie kształtu egzaminu zaliczenowego” (ready)" from the
  session-start brief; `gh issue view 96` checked only when Rafał asked for a new issue showed
  `CLOSED`. In the same session the fix worked for the ranking: `candidates` was run right before the
  ranking shown after #646 went to Done.

## Rozwiązanie
Run `candidates` immediately before every ranking you show, including after `status --to done`; never
reuse a list read earlier in the session or the brief's list. Before proposing "Do zamknięcia?", grep
today's entries in `D:\Notatki\notatki\praca-z-claude.md` for the issue number; a same-day decision
about it is shown with the proposal. The same holds for the binding card: run `pool` again (or
`gh issue view` on each listed ref) right before re-asking a binding question in a later answer.
