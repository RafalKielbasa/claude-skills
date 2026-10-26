# plik-wyjety-z-repo-kasowany-przy-przejsciu-przez-commit-ktory-go-sledzi

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plik z lokalnymi danymi wyjęty z repo przez `git rm --cached` (zostaje na dysku, objęty `.gitignore`) znika z
dysku w tym samym checkoucie, gdy ten przechodzi na gałąź, która jeszcze go śledzi, i potem pobiera commit z
usunięciem.

## Przyczyna źródłowa
Dla gita plik ignorowany jest do nadpisania. `git switch` na commit, który śledzi tę ścieżkę, po cichu podmienia
plik z dysku wersją z commita, więc plik znowu jest śledzony. Fast-forward przez commit z usunięciem kasuje go z
drzewa, tak samo jak każdy śledzony plik. Ostrzeżenie „inne checkouty stracą kopię przy `pull`” nie obejmuje
checkoutu, który sam zrobił `rm --cached`, a potem przechodzi przez starszą gałąź.

## Dowody
- 2026-10-26, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy).
  - Plik: `kursy/agenty-ai/_nagrywanie/google-grant.json`, zapis cofnięcia dostępu n8n.cloud z sondy P-D.
  - Przebieg: `git rm --cached` i commit `b8e90a5` na gałęzi dnia 25-10 w kopii głównej. W raporcie
    napisałem, że plik zostaje na dysku, a znikną tylko kopie w innych checkoutach. Po scaleniu PR-ów
    `git switch main` (na `05f545e9` plik był jeszcze śledzony) i `git pull --ff-only` (z usunięciem) skasowały go.
  - Wykryte od razu przez `ls` po pullu. Przywrócony przez
    `git show 05f545e9:<ścieżka> > <ścieżka>`: 145 B, ta sama treść, `git check-ignore` potwierdza
    ignorowanie.

## Rozwiązanie
Przed wyjęciem pliku danych z repo skopiuj go do katalogu tymczasowego. Po każdym `switch` i `pull`, który
przechodzi przez commit śledzący ten plik, sprawdź, czy plik jest na dysku, i w razie potrzeby przywróć go z
kopii albo przez `git show <ostatni commit, który go śledził>:<ścieżka>`. Ostrzeżenie o utracie pliku przy
`pull` odnieś do każdego checkoutu, który przejdzie przez starszą gałąź, także do tego, w którym zrobiono
`rm --cached`.
