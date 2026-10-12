# agenda-walkthrough-started-past-point-1

- **Skill:** spotkanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Asked to walk through the agenda before the meeting, Claude starts with the proposals in the pre-meeting
notes (point 2) instead of point 1, the review of what was settled since the previous meeting. Rafał
interrupts the first question.

## Przyczyna źródłowa
The words of the request ("pytania przed spotkaniem") matched the file name
`notatki-przed-spotkaniem/<data>-notatki-przed.md`, so Claude chose a section by word match. The skill
fixes point 1 as always the action-item review, but has no walk-through mode, so nothing says where a
walk-through starts.

## Dowody
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai niedostępny): "Przejdźmy przez
  agendę, przez te pytania przed spotkaniem" → Claude read the Claude Docs proposals doc and asked about
  decisions 1–3 of the subscription start; Rafał rejected the question: "Nie chodziło mi o tą sekcję,
  chodziło mi o to, co zostało rozstrzygnięte po poprzednim spotkaniu." The walk-through of the 21.09
  action items and parked threads then went smoothly: 8 items in two four-question calls with cards in
  the previews, statuses written to point 1 of the agenda.

## Rozwiązanie
A walk-through of an agenda starts at point 1 (action items and parked threads of the previous meeting)
and goes in agenda order, unless Rafał names a point. Each item gets a card with the evidence checked in
the repo and on GitHub; his statuses go into the point 1 table, marked with his name and the date.
