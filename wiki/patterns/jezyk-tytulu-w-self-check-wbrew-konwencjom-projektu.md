# jezyk-tytulu-w-self-check-wbrew-konwencjom-projektu

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-10, github-tickets)

## Opis
`references/self-check.md` wymaga angielskiego tytułu w formacie `<PREFIX>-<n> <Title>`, a
`docs/ticket-conventions.md` w `devstock-org/devstock-team` każe pisać tytuły DT po polsku w formacie
`DT-<n>: <tytuł>`. Przy każdym tickecie DT linia listy kontrolnej „nie przechodzi”, choć ticket jest zgodny
z konwencjami projektu.

## Przyczyna źródłowa
Skill powstał z założeniem angielskich tytułów i wpisał je na sztywno do listy kontrolnej i szablonu
(`references/ticket-template.md:3`), choć krok 0 każe brać język tytułu z pliku konwencji projektu. Lista
kontrolna nie odwołuje się do parametrów z kroku 0.

## Dowody
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny): DT-138 (#916) z polskim
  tytułem zgodnie z konwencjami; self-check pokazał rozjazd, rozstrzygnięty na korzyść konwencji i opisany
  Rafałowi na bramce 2.

## Rozwiązanie
W `references/self-check.md`: „Title language and format follow the conventions file read at step 0 (for
example `DT-<n>: <tytuł>` in Polish for `devstock-org/devstock-team`).” (wpisane 2026-11-10). Do rozważenia
przy `/evolve-skill github-tickets`: ta sama poprawka w `references/ticket-template.md:3`.
