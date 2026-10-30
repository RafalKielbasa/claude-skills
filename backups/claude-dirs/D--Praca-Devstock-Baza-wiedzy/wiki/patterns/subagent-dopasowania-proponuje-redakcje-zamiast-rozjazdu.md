# subagent-dopasowania-proponuje-redakcje-zamiast-rozjazdu

- **Skill:** kurs-nagrywanie (stage 7, fitting to the recording)
- **Typ:** porażka
- **Status:** otwarty

## Opis
The subagent comparing the frames of the final recording with the script reports, next to real mismatches, changes
that the frame does not contradict:
- paraphrases of a rule ("Nie wie tego. I ma to napisać.");
- extra explanations ("Czerwony kolor i undefined to nie błąd").
Applied, they would change approved content outside the self-applied change bound (D1), with the argument "to fit
the screen".

## Przyczyna źródłowa
The analysis questions of step 4 ask about mismatches, but the subagent prompt also asks for "a corrected sentence".
The model treats it as an invitation to improve the narration. Its `Typ: scenariusz` does not distinguish "the frame
contradicts" from "the beat could be clearer".

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson 3.1: 5 `scenariusz` and
  7 `niepewne` findings.
  - Steps 4 (a paraphrase of the "nie zgaduj" rule) and 29 (an explanation of the red expression) I rejected as not
    contradicted by the frame.
  - Steps 7, 11, 13, 44, 49 and 50 resolved under the transient screen rule or with a second method (frame from
    `surowe.mp4`, crop).
  - 5 changes applied (17, 21, 31, 36, 53).

## Rozwiązanie
In the subagent prompt of stage 7: "Report a sentence only when the frame contradicts it (a name, state, number,
claim of absence or result different from what is visible). Do not propose explanations or style improvements; a
sentence that is true on screen is not a finding." In the session: before writing a marker, name for each finding
what on the frame contradicts the quote.
