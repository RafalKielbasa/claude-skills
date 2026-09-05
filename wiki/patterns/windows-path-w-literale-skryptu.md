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

- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC (druga część): ten sam
  kształt bez żadnej ścieżki Windows. Zapis specu heredokiem `<<'SPECEOF'` przez
  narzędzie Bash padł na `unexpected EOF while looking for matching ''`, bo
  narzędzie owija komendę w pojedyncze cudzysłowy, a treść zawierała angielskie
  dopełniacze (`skill's own checklist`, `the child's database id`). Naprawą było
  porzucenie heredoku na rzecz narzędzia zapisującego plik wprost. Ta sama
  lekcja weszła potem do skilla `github-tickets` jako reguła kroku 3 i jako
  wymóg podawania promptu codeksowi przez stdin, nie argumentem.

- 2026-09-04, sesja session_013eH7DXzW8DZjC16fy2ZCs4: trzeci raz ten sam
  wyzwalacz. Skrypt składający payload review dla PR #165, zapisywany heredokiem
  `<<'SCRIPT'` przez narzędzie Bash, padł na `unexpected EOF while looking for
  matching ''` — treść komentarzy zawierała angielskie dopełniacze i skrócenia
  (`student's name`, `endpoint's contract`, `does not`). Naprawa ta sama co
  poprzednio: skrypt zapisany narzędziem Write, uruchomiony z osobnego pliku,
  payload podany do `gh api` przez `--input`, nie argumentem.
- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: skrypty Pythona wklejane do heredoca przez narzędzie Bash wielokrotnie zjadły sekwencje ucieczki w podmienianym kodzie. Regex miał wejść jako klasa znaków dopasowująca ukośnik i backslash, a wyszedł z jednym backslashem mniej, czyli jako coś innego. Ciąg oznaczający nową linię stał się prawdziwą nową linią w środku literału szablonu, a escapowany cudzysłów zamienił się w goły. Naprawa za każdym razem szła przez narzędzie Edit na pliku docelowym. **Trzecia sesja z tym samym objawem — i zdarzyło się to ponownie przy zapisywaniu tego właśnie dowodu.**

## Rozwiązanie
Treść przeznaczoną do wstawienia do pliku trzymaj w osobnym pliku i wczytuj ją
w skrypcie, zamiast wklejać do literału. Skrypt ma wtedy w sobie wyłącznie
logikę i ścieżki (te jako literały surowe), a tekst nie przechodzi przez
składnię języka ani przez dwa poziomy cytowania powłoki.

Wyzwalaczem nie jest sama ścieżka Windows, tylko dowolny znak, który jeden
z poziomów cytowania traktuje jako składnię: odwrotny ukośnik w literale
nie-surowym, apostrof wewnątrz `bash -c '...'`, backtick w podwójnym cudzysłowie.
Prozy pisanej dla człowieka nie da się z góry przeczyścić z takich znaków, więc
nie przepuszczaj jej przez powłokę: użyj narzędzia zapisującego plik wprost,
a przy wywołaniach CLI podawaj długi tekst plikiem albo na stdin.
