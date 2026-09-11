# git-diff-bez-head-gubi-wlasna-prace

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`git diff --stat` przestał pokazywać pliki, które przed chwilą zmieniłem, bo
użytkownik zastagował je równolegle ze swojej strony. Przez jedną turę
wyglądało to na utratę pracy i poszła diagnostyka („czy ktoś zacommitował?",
`git log`, `reflog`), zamiast jednej komendy, która od razu pokazałaby prawdę.

## Przyczyna źródłowa
`git diff` bez argumentu porównuje drzewo robocze z **indeksem**, nie z `HEAD`,
więc zmiana zastagowana znika z jego wyjścia, choć plik jest zmieniony wobec
ostatniego commita. W sesji jednoosobowej indeks rusza się tylko wtedy, gdy ja
go ruszę, więc różnica nigdy nie wychodzi. W repo dzielonym z użytkownikiem,
który commituje i staguje sam (u Rafała to reguła: „commit robi Rafał"),
indeks jest stanem zewnętrznym, zmieniającym się w trakcie mojej pracy — a moim
punktem odniesienia jest ostatni commit, nie indeks. Objaw jest mylący, bo
pusty diff czyta się jak „nic nie zmieniłem", czyli jak wynik, a nie jak zły
zakres pytania.

## Dowody
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi (repo Baza wiedzy): po
  naprawie ośmiu rozjazdów w `artykul.md` i zmianie reguły w dwóch plikach
  `git diff --stat` wypisał wyłącznie cudze pliki (`publish.js`, `wiki/log.md`),
  a wszystkie moje zniknęły. Pierwsza hipoteza brzmiała „użytkownik zacommitował
  w trakcie", `git log` jej nie potwierdził (HEAD bez zmian), dopiero
  `git status --short` pokazał `M ` w pierwszej kolumnie, czyli staging.
  `git diff HEAD --stat` od razu pokazał komplet. Godzinę wcześniej ten sam
  mechanizm zadziałał w drugą stronę: `?? quiz.json` zmieniło się w ` M`, bo
  w trakcie przebiegu Workflow wszedł commit `42b5a51`.

## Rozwiązanie
Do przeglądu i raportowania własnej pracy używaj `git diff HEAD` (albo
`git status --short`, gdzie kolumna indeksu jest widoczna), nigdy gołego
`git diff` — punktem odniesienia jest ostatni commit, nie indeks, którego
zawartością steruje użytkownik. Pusty albo niepełny wynik `git diff` w repo,
w którym użytkownik commituje sam, traktuj jako podejrzenie złego zakresu
pytania, zanim zaczniesz szukać utraconych zmian. Patrz też
[[plik-zmieniony-miedzy-odczytem-a-edycja]] — ta sama rodzina: stan repo jest
współdzielony i zmienia się między moimi komendami.
