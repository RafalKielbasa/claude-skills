# sdd-bez-commitow-paczki-review-z-migawek

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Skill opiera cala mechanike review na zakresach commitow (`BASE..HEAD`, `review-package`), a repo
moze commitow zabraniac. Zastapienie ich migawkami plikow robionymi przed kazdym zadaniem daje
recenzentom dokladnie ten sam material i nie wymaga zadnego odstepstwa od reguly uzytkownika.

## Przyczyna zrodlowa
Skill zaklada, ze jednostka pracy jest commit, bo w typowym przeplywie tak jest. Gdy commitowanie
jest zablokowane (`permissions.deny` w `.claude/settings.json`, uzytkownik commituje sam), pada nie
sam commit, ale wszystko, co z niego wyprowadzone: diff zadania, zakres poprawki, ledger
odtwarzalny z `git log`. Diff jest jednak funkcja dwoch stanow plikow, nie dwoch commitow.

## Dowody
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: siedem zadan i piec rund poprawek przeprowadzonych bez ani jednego commita. Przed
  kazdym dispatchem kopia dotykanych plikow do `<workspace>/task-N-base/`, po zadaniu `diff -u` tej
  kopii z drzewem roboczym jako paczka review; dla plikow nietknietych wczesniej wystarczal
  `git diff -- <sciezki>` wobec HEAD. Recenzenci nie zglosili braku kontekstu ani razu, a jeden sam
  uzyl migawki `task-2-base` do sprawdzenia, czy nowy test pada przed poprawka. Ledger przejal role
  `git log` jako mapa odtworzenia po kompaktowaniu.

## Rozwiazanie
W repo bez commitow per zadanie: na starcie zapisz ruling o migawkach w ledgerze, przed kazdym
dispatchem kopiuj pliki zadania do katalogu roboczego planu, a paczke review buduj jako `diff -u`
migawki z drzewem. Numery testow i sciezki plikow podawaj recenzentowi wprost, bo `git log` nie
opowie historii zadania. Migawke odswiezaj po kazdej rundzie poprawek, inaczej kolejna paczka
niesie cudze zmiany.
