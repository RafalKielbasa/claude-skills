# python-na-windows-drukuje-w-cp1252

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`python -c` uruchomiony przez narzędzie Bash na Windowsie wywala się na
`UnicodeEncodeError: 'charmap' codec can't encode character`, gdy drukuje polski
tekst. Skrypt wykonał już całą pracę — pada dopiero na `print`, więc komunikat
sugeruje błąd w logice, a nie w wypisywaniu wyniku.

## Przyczyna źródłowa
Standardowe wyjście Pythona na Windowsie dziedziczy kodowanie konsoli (cp1252),
niezależnie od tego, że plik źródłowy i odczytywana treść są w UTF-8. Odczyt
i zapis przez `io.open(..., encoding='utf-8')` działa poprawnie; przewraca się
wyłącznie ścieżka `print` → strumień. Efekt jest mylący podwójnie: kod pada po
wykonaniu pracy (więc plik bywa już zapisany), a exit code 1 wygląda jak
niepowodzenie całej operacji.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: dwa razy w jednej sesji.
  Skrypt podmieniający regex w pliku pomocniczym zapisał plik i padł na
  `print(s)`: `'charmap' codec can't encode character 'ą' in position 16`.
  Chwilę później diagnostyka lokalizująca wiersze tabeli w artykule padła na
  `print(repr(s[i:j]))` z `can't encode character 'ł'` — a częściowe
  wyjście („SLACK ROW:") zdążyło się wypisać przed wyjątkiem, co wyglądało jak
  pusty wynik wyszukiwania. Oba przypadki naprawione prefiksem
  `PYTHONIOENCODING=utf-8`.
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: drugi dowód, druga sesja,
  dokładnie ten sam kształt. Skrypt wstawiający brief do
  `D:/Notatki/notatki/praca-z-claude.md` przeszedł wszystkie asercje wejścia,
  wypisał pierwszą linię diagnostyki i padł na drugiej:
  `UnicodeEncodeError: 'charmap' codec can't encode character '\u0144'` -
  bo drukował tytuł sąsiedniego wpisu („Silnik zadań"). Zapis pliku stoi
  w skrypcie PO tym `print`, więc dziennik nie został ruszony i `grep`
  potwierdził stary układ; gdyby kolejność była odwrotna, wpis wjechałby do
  pliku, a exit code 1 sugerowałby, że nic się nie stało. Naprawione
  `sys.stdout.reconfigure(encoding='utf-8')` w pierwszej linii skryptu -
  wariant przydatny tam, gdzie treść idzie heredokiem i nie ma jak dopisać
  prefiksu `PYTHONIOENCODING=utf-8` do wywołania.

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: trzeci dowód, trzecia sesja. Dwa razy w jednej
  sesji i oba razy dokładnie w kształcie ze strony. `python -c` drukujący linie
  artykułu padł na `can't encode character` po wypisaniu numeru pierwszej linii
  — wynik wyglądał na urwany w połowie. Groźniejszy był drugi: skrypt cofający
  zmiany w segmencie 8 zapisał **wszystkie cztery pliki lekcji** i padł dopiero
  na końcowym `print('OK: segment 8 przywrócony…')`. Exit code 1 przy komplecie
  wykonanej pracy — gdybym potraktował go jako awarię i powtórzył skrypt,
  asercje `find()` nie znalazłyby już starych brzmień i przerwałyby z „0
  trafien". Sprawdzenie stanu plików przed powtórzeniem, tak jak każe sekcja
  Rozwiązanie, pokazało, że powtarzać nie ma czego. Wszystkie późniejsze
  wywołania w sesji szły z `PYTHONIOENCODING=utf-8`.


## Rozwiązanie
Każde wywołanie `python`/`python -c` przez narzędzie Bash na Windowsie
poprzedzaj `PYTHONIOENCODING=utf-8`, jeśli cokolwiek drukuje treść inną niż
ASCII — także wtedy, gdy drukujesz tylko `repr()` albo krótką diagnostykę,
bo `repr` polskiego tekstu też zawiera te znaki.

`UnicodeEncodeError` na `print` czytaj jako awarię wypisywania, nie awarię
operacji: sprawdź stan pliku, zanim powtórzysz skrypt, bo zapis mógł już
przejść. Alternatywnie drukuj wyłącznie ASCII („ok", liczby, nazwy plików)
i trzymaj treść poza wyjściem — to działa też wtedy, gdy nie kontrolujesz
zmiennych środowiskowych wywołania.
