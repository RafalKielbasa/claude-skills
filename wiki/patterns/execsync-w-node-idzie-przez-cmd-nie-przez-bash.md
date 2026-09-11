# execsync-w-node-idzie-przez-cmd-nie-przez-bash

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt Node uruchomiony przez narzędzie Bash (czyli w Git Bashu) woła
`execSync('git show <sha>^:plik')`. Komenda kończy się sukcesem i zwraca
zawartość pliku — tyle że z niewłaściwej rewizji. Wynik wygląda wiarygodnie,
więc błąd wychodzi tylko wtedy, gdy ktoś zna prawidłową odpowiedź z innego
źródła.

## Przyczyna źródłowa
`child_process` na Windowsie uruchamia komendę przez `cmd.exe` (`%ComSpec%`),
niezależnie od tego, że sam proces Node wystartował z Git Basha. W `cmd.exe`
`^` jest znakiem ucieczki, więc `<sha>^:plik` dociera do gita jako `<sha>:plik`.
Git dostaje poprawną, istniejącą revspec, więc nie zgłasza niczego — rodzic
commita cicho zamienia się w sam commit.

Różnica wobec `windows-path-w-literale-skryptu` jest w objawie, nie w rodzinie:
tam znak składniowy wysadza parser i skrypt nie rusza, tu przechodzi wszystko
i zwraca wynik odwrotny do zamierzonego.

## Dowody
- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: skrypt mierzący skalę
  defektu w plikach kursu przed poprawką wypisał `MATCH 0/7 na przekatnej`
  dla ćwiczenia, o którym z wcześniejszego przebiegu walidatora wiedziałem, że
  ma 7/7. Wszystkie pięć liczb było z wersji **po** zmianie. Po podmianie
  `6c7bb30^` na `git rev-parse 6c7bb30~1` i użyciu wyliczonego SHA wyszło
  `7/7`, `6/6`, `0/6`, `1/6`, `1/6`. Gdyby nie sprzeczność z wcześniejszym
  pomiarem, liczby trafiłyby do wiki i do briefu jako fakt.

## Rozwiązanie
W `execSync`/`exec` nie podawaj revspeców ani argumentów ze znakami, które
`cmd.exe` traktuje jako składnię (`^ & | < > %`). Rewizję wyliczaj osobno
(`git rev-parse <sha>~1`, `git rev-parse HEAD~1`) i przekazuj gotowy SHA, albo
wymuś powłokę: `execSync(cmd, { shell: 'bash' })`. Tyldy `~` cmd nie rusza,
więc `HEAD~1` jest bezpieczniejsze od `HEAD^` nawet bez tych zabezpieczeń.

Reguła szersza: liczba z komendy, która „wyszła ładnie", ale przeczy
wcześniejszemu pomiarowi z tej samej sesji, jest podejrzana po stronie komendy,
nie po stronie wcześniejszego pomiaru. Sprawdź ją, zanim ją zacytujesz.
