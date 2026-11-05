# pipe-powershella-dokleja-bom-do-stdin

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt Node uruchomiony przez `$json | & node skrypt.mjs` w PowerShell 5.1 dostaje na
stdin BOM przed JSON-em. `JSON.parse` go odrzuca, a ścieżka awaryjna skryptu przykrywa
błąd wiarygodnym wynikiem z innego katalogu, więc wygląda to na błąd logiki, nie wejścia.

## Przyczyna źródłowa
Pipe PowerShella koduje tekst dla procesu natywnego i w części środowisk dokleja
preambułę UTF-8, mimo że `$OutputEncoding.GetPreamble().Length` zwraca 0. Sprawdzone:
ten sam test uruchomiony z narzędzia PowerShell dostawał BOM, a uruchomiony z Git Basha
nie. Zakładam, że decyduje kodowanie konsoli; tego nie rozstrzygnąłem. Prawdziwy payload
Claude Code BOM-u nie ma, więc problem dotyczy testów i ręcznych wywołań. Ten sam surowy
`JSON.parse(raw)` ma `skills/hub/bin/hub-hook.mjs:15`.

## Dowody
- 2026-11-05, sesja e70485da-f464-4147-b956-8e00c7c5e2e2 (id claude.ai niedostępny):
  przypadki testu status line zwracały stan repo `.claude` zamiast piaskownicy; zrzut bajtów
  stdin pokazał `efbbbf7b2263…`, a bajty payloadu z Claude Code zaczynały się od `{`.
- 2026-11-05, ta sama sesja: sekwencja ucieczki U+FEFF wpisana w parametr `Edit` trafiła do
  pliku jako niewidoczny znak. Wyszło to dopiero w `Read` i przy mutacji, której `sed` nie
  znalazł. Zastąpione przez `raw.trim()`.

## Rozwiązanie
Skrypt czytający JSON ze stdin parsuje `JSON.parse(raw.trim())`, bo `trim()` usuwa też U+FEFF.
Test obsługi BOM podaje bajty jawnie przez `ProcessStartInfo` i `StandardInput.BaseStream`,
nie przez pipe PowerShella. Gdy skrypt zwraca wynik z niewłaściwego katalogu, najpierw zrzuć
stdin w hex. Znaku U+FEFF nie wpisuj w `Edit` ani `Write` jako sekwencji ucieczki: parametr
narzędzia dekoduje ją do niewidocznego znaku.
