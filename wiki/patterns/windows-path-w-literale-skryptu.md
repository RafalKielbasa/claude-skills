# windows-path-w-literale-skryptu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Tekst zawierający ścieżkę Windows, wklejony do literału łańcuchowego w skrypcie,
wysadza parser na sekwencji ucieczki, zanim skrypt w ogóle się uruchomi.

## Przyczyna źródłowa
`C:\Users\...` w literale Pythona, który nie jest surowy, zaczyna się od `\U` —
czyli od sekwencji `\UXXXXXXXX`. Prefiks `r` rozwiązuje problem dla krótkiej
ścieżki, ale nie dla wielolinijkowej treści, która ma jednocześnie zawierać
znaki ucieczki i ścieżki. Treść przeznaczona do wstawienia do pliku nie jest
kodem i nie powinna przechodzić przez składnię języka.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: `restore.py` odtwarzający
  wpis dziennika padł na `SyntaxError: (unicode error) 'unicodeescape' codec
  can't decode bytes in position 3603-3604: truncated \UXXXXXXXX escape`.
  Pozycja 3603 wypadła dokładnie na `C:\Users\rafal\.claude\skills\...`
  wewnątrz odtwarzanej treści. Obejście: treść zapisana heredokiem do osobnego
  pliku `.md`, a skrypt tylko ją wczytał i wstawił.

## Rozwiązanie
Treść przeznaczoną do wstawienia do pliku trzymaj w osobnym pliku i wczytuj ją
w skrypcie, zamiast wklejać do literału. Skrypt ma wtedy w sobie wyłącznie
logikę i ścieżki (te jako literały surowe), a tekst nie przechodzi przez
składnię języka ani przez dwa poziomy cytowania powłoki.
