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

- 2026-09-10, sesja session_015PLcG6rJFegWQiawFUeamB: skrot `git diff -- <sciezki>` wobec HEAD,
  dopuszczony przez poprzedni dowod dla plikow nietknietych wczesniej, zawiodl. W rulingu
  pre-flight wybralem wlasnie ten wariant zamiast migawek. Zadanie 1 skonczylo sie o 13:12,
  a uzytkownik w tym samym momencie zrobil commit `9a94b3e`, ktory wciagnal `src/scenariusz.js`
  (+48) i `tests/scenariusz.test.js` (+92) razem z wlasna praca nad kursem. `git diff --stat`
  na tych plikach zwrocil pusto: zmian zadania nie bylo juz w drzewie roboczym, a paczka review
  wyszlaby pusta i recenzent zatwierdzilby kod, ktorego nie widzial. Ratunek: `git show 9a94b3e --
  <sciezki>`, mozliwy tylko dlatego, ze commit dalo sie zidentyfikowac po fakcie.
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: siedem zadań i fala poprawek bez ani jednego commita, paczki z migawek `task-N-before/`. Konwencja obroniła się dwa razy: gdy Rafał zacommitował pliki Taska 1 w trakcie pracy implementera (paczkę trzeba było złożyć z `git show 9a94b3e --`, nie z `git diff`) i gdy pod koniec runu zastage'ował całe `tools/course-pipeline/`, co unieważniłoby każdą paczkę liczoną wobec indeksu.

## Rozwiazanie
W repo bez commitow per zadanie: na starcie zapisz ruling o migawkach w ledgerze, przed kazdym
dispatchem kopiuj pliki zadania do katalogu roboczego planu, a paczke review buduj jako `diff -u`
migawki z drzewem. Numery testow i sciezki plikow podawaj recenzentowi wprost, bo `git log` nie
opowie historii zadania. Migawke odswiezaj po kazdej rundzie poprawek, inaczej kolejna paczka
niesie cudze zmiany.

Migawke rob dla KAZDEGO zadania, takze dla plikow nietknietych wczesniej — `git diff` wobec HEAD
jest odporny na wlasne zmiany, ale nie na to, ze uzytkownik commituje w trakcie pracy subagenta,
a wtedy diff zadania cicho znika. Migawka pliku sprzed dispatchu jest jedynym punktem odniesienia,
ktorego cudzy commit nie uniewazni.
