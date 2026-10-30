# odpowiedz-bez-wariantu-wykonana-czesc-wspolna

- **Skill:** ogólny (decision protocol)
- **Typ:** sukces
- **Status:** otwarty

## Opis
The user answers a card with variants by reporting a fact ("Dodałem kredyty") without choosing between [A] and [B].
The variants share a first step and differ only in a later one. Doing the common step and asking about the
difference only when it actually matters keeps the work moving without picking a variant for the user.

## Przyczyna źródłowa
A card often combines a precondition (the user's action) with a decision that only takes effect later. A reply that
confirms the precondition is not an "OK" for the recommended variant. Waiting for a full answer would stall work that
is the same in every variant.

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny; Baza wiedzy, lesson agenty-ai 3.1).
  - The card had [A] a top-up with the counter raised to 3, [B] a top-up only.
  - Rafał: "Dodałem kredyty". I started the stage 1 render, which is the same in A and B, and wrote that the counter
    decision would come back only before a regeneration.
  - Rafał answered by himself: "A, podnieś licznik do 3". No extra card, and no variant chosen for him.

## Rozwiązanie
When a reply confirms the precondition of a card but does not settle a variant: do only the part shared by all the
variants, say in one sentence which decision is still open and when it will be needed, and do not do anything that
belongs to just one variant until the user answers.
