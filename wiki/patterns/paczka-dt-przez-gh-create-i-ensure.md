# paczka-dt-przez-gh-create-i-ensure

- **Skill:** github-tickets (z board-tracker)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Paczkę ticketów DT na tablicy „core team main project” założyłem przez `gh issue create`
(bez assignee) i `board-tracker ensure --ref … --status … --epic <n>`, a przypiąłem tylko issue, nad
którym sesja pracuje. Statusy, rodzic i brak assigneeów zgadzały się z planem przy odczycie.

## Przyczyna źródłowa
`board-tracker create` dodaje `--assignee @me` i przypina każde issue do sesji, a skill
`github-tickets` każe nie ustawiać assigneeów, a board-tracker wymaga „tak” na dopisanie Rafała.
`ensure` robi tylko tablicę, status i epik, więc składa się z `gh issue create` bez konfliktu reguł.

## Dowody
- 2026-10-25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf): DT-60…DT-69 (#764–#773), dziesięć `ensure` z `--epic 741`; cztery pominęły „added_to_board”, bo projekt sam dodał issue. Odczyt po wysyłce: zero assigneeów, statusy In review / In progress / Backlog jak w planie, `bind` tylko na #765. Numer DT liczony ręcznie tuż przed wysyłką (59 w tytułach, 52 w `docs/`).
- 2026-10-29, sesja 00434ebc-97fc-4e2a-a68d-5d8452f5084b (id claude.ai niedostępny; Baza wiedzy, zamknięcie
  DT-12): przeciwny przypadek. Dwa issue z pytaniami produktowymi (#813 DT-79, #814 DT-80) założyłem przez
  `board-tracker create --status backlog` po „ok” na bramce z kartami, w których assignee Rafał był wpisany.
  `create` przypiął oba do sesji, choć sesja nad nimi nie pracowała. Śladów w nich nie zostawiłem, a magazyn
  przypięć ma trzy wpisy zamiast jednego (#650). Szkody brak, ale potwierdza się reguła tej strony: issue,
  które nie jest pracą sesji, zakładaj przez `gh issue create` i `ensure`, także przy dwóch sztukach.

## Rozwiązanie
Paczka nowych DT: numer sam (krok 1 `github-tickets`), `gh issue create --label <domena> --label size/<S>` bez assignee, potem `board-tracker ensure --ref <ref> --status <state> --epic <n>`, a `bind` tylko dla issue, nad którym sesja pracuje. `board-tracker create` zostaw dla pojedynczego issue z karty „Nowe issue”.
