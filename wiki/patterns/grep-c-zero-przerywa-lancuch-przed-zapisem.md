# grep-c-zero-przerywa-lancuch-przed-zapisem

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kontrola `grep -c …` wstawiona w łańcuch `&&` przed zapisem (commit, push) zatrzymuje cały łańcuch,
gdy wynik to 0, choć 0 jest tu wynikiem oczekiwanym. Wyjście wygląda jak udana kontrola („0”), a
commitu nie ma. Brak zapisu widać dopiero po tym, że następna komenda pokazuje inny HEAD.

## Przyczyna źródłowa
`grep` kończy się kodem 1, gdy nie znajdzie dopasowania, także z `-c` (wtedy wypisuje `0`). W
łańcuchu `&&` kod 1 przerywa wszystko, co stoi za nim. Kontrola „ma być zero” jest więc z definicji
porażką dla powłoki.

## Dowody
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; Baza wiedzy, DT-101):
  `git branch --show-current && grep -c $'\r' <2 pliki> && git commit -F - -- <3 ścieżki>` wypisało
  nazwę gałęzi i dwa razy `:0`, a `git log --oneline -1` na końcu pokazał cudzy commit `877f4818`
  (DT-83) zamiast mojego. Commit poszedł dopiero osobną komendą (`be977301`). Wcześniej tego samego
  dnia `git worktree remove … && git branch -D …` zostawił gałąź z tego samego powodu (kod błędu
  pierwszej komendy).

## Rozwiązanie
Kontrole diagnostyczne (`grep -c`, `test`, `diff --quiet`) nie stoją w łańcuchu `&&` przed zapisem:
oddziel je `;` albo dopisz `|| true`, a o zapisie decyduj osobno. Po każdym commicie potwierdź go
jego własnym wyjściem (linia `[gałąź hash] tytuł`), a nie ostatnią linią łańcucha. Do liczenia
znaków CR używaj `tr -cd '\r' | wc -c` (zob. python-write-text-na-windows-zmienia-konce-linii).
