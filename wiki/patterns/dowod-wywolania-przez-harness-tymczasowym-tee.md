# dowod-wywolania-przez-harness-tymczasowym-tee

- **Skill:** ogólny (dotyka update-config)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Tymczasowy `tee` w komendzie `statusLine` pokazał w kilka sekund prawdziwy payload od Claude
Code i prawdziwy stdout skryptu. Nie trzeba było restartu, a test z ręcznym payloadem nie
dowodzi, że Claude Code w ogóle uruchamia komendę. Dowód ma jeden skutek uboczny: działa od
razu we wszystkich otwartych sesjach.

## Przyczyna źródłowa
Procedura dowodu w `update-config` obejmuje tylko hooki Pre/PostToolUse, a status line
uruchamia się poza turą. Każda żywa sesja przeładowuje globalny `~/.claude/settings.json`,
więc komendę wywołuje od razu także każda sesja poza tą, która ją zmienia.

## Dowody
- 2026-11-05, sesja e70485da-f464-4147-b956-8e00c7c5e2e2 (id claude.ai niedostępny): pierwszy
  odczyt pochodził z cudzej sesji `4e6952d2…` w „Bazie wiedzy” i miał pusty plik wyjścia, bo
  trafił w trakcie zapisu. Dopiero próbkowanie po `session_id` przez 14 s dało wynik tej sesji,
  zgodny z `git status`. Payload ujawnił też, że BOM-u w nim nie ma, i pole `workspace.repo`.
  Pliki z `tee` zostały w scratchpadzie, bo wywołanie sprzątające Rafał odrzucił.

## Rozwiązanie
Żeby udowodnić, że Claude Code uruchamia komendę z globalnych ustawień, opakuj ją na chwilę w
`tee` do plików w scratchpadzie i próbkuj wynik z filtrem po `session_id`. Komendę końcową
przywróć zaraz po odczycie, a pliki usuń, bo zawierają dane innych sesji. W raporcie zaznacz,
że dowód dotyczył wersji z `tee` i że otwarte sesje też ją uruchamiały.
