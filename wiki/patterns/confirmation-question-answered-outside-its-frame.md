# confirmation-question-answered-outside-its-frame

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
The user ends a sentence about their own next step with a confirmation tag ("O ile się nie mylę,
prawda?"). Claude checks the sentence against the widest source at hand, answers "Prawie tak" and
adds a table of stages the user already knows about, so the user has to restate the scope before the
requested action runs.

## Przyczyna źródłowa
The tag reads like a request to verify a factual claim, and the claim's words ("zostaje tylko
ostateczne review") get checked against the whole process calendar instead of the frame the sentence
sets: its subject is the user's own action ("ja nie sprawdzam po raz kolejny"). A correction with a
table feels like diligence, so nothing signals that it answers a question nobody asked; the cost is a
turn and a delayed action.

## Dowody
- 2026-10-12, sesja 41420c90-30dc-4fb8-a253-35e0054ade7a (id claude.ai niedostępny; saas app,
  checkpoint BE egzaminu): Rafał — „Wyślij mu jako komentarz informacje o duplikacji kodu, ale nie
  jest to blokujące, rusza dalej, ja nie sprawdzam po raz kolejny, zostaje tylko ostateczne review.
  O ile się nie mylę, prawda?”. Answer opened with „**Prawie tak.** … do końca egzaminu zostało
  więcej niż samo review końcowe” and a six-row table (zmiana wymagań, cross-review, statusy,
  ostatni commit, review końcowe, obrona). Rafał: „Chodziło mi tylko o moje wcześniejsze review,
  a nie o inne etapy. To jest oczywiste, że są jeszcze. Wysyłaj to review.”

## Rozwiązanie
Read a confirmation tag in the frame of the sentence it closes: when the subject is the user's own
action, verify only that. True in that frame → answer "Tak" and do the requested action. Mention a
wider-scope item only when it changes what the user is about to do, in one line, never as a
correction ("prawie").
