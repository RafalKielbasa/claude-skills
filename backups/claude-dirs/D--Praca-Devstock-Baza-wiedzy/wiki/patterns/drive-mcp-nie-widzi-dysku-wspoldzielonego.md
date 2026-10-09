# drive-mcp-nie-widzi-dysku-wspoldzielonego

- **Skill:** daily, spotkanie
- **Typ:** porażka
- **Status:** zaadresowany (2026-10-09, daily) — przyczyną było konto konektora, nie dysk współdzielony

## Opis
Krok 2 `/daily` (i krok 2 trybu „transkrypt" `/spotkanie`) każe pobrać transkrypt z Drive
narzędziami Drive MCP. Kolektor n8n zapisuje transkrypty w folderze `raw-transcripts`
(`1m3NaruSi4Kw1BsXUi0tK_YDBZ3H2DMmI`) na dysku współdzielonym `meetings`
(`0AAe3_HQ3HAOXUk9PVA`), a Drive MCP takich plików nie widział: `get_file_metadata` po id zwracał
„Requested entity was not found", a `search_files` z `parentId` folderu wracał pusty.

## Przyczyna źródłowa
Konektor Drive z claude.ai był zalogowany kontem `rafal-kielbasa@it-chef.com`, które nie jest
członkiem dysku `meetings`. Pierwsza diagnoza („konektor nie obsługuje dysków współdzielonych")
była błędna — po przełączeniu konektora na `rafal.kielbasa@devstock.com` te same sondy działają.
Pierwszy dowód z 2026-10-08 sondował też zły folder (`1KbFsbOn…`); folder, który czyta
`39_meeting_pending`, to `1m3Naru…`.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: pierwszy realny
  `/daily 2026-10-08 1000`. `get_file_metadata` dla `1MyiEgT0Fx-…` (redagowany) i
  `1iJz2_jseQ…` (surowy) → „Requested entity was not found"; wcześniej `search_files
  parentId = '1KbFsbOnbPqc7iksHWKx7NHC6Ioqz2Ny4'` → `{}`. Transkrypt wzięty z danych wykonania n8n
  (`Format Transcript` w exec `27678` = dokładnie treść zapisana przez `Save Transcript to Drive`).
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny): fixture testu bramki potrzebował
  transkryptu 2026-10-08 10:00; `read_file_content` po id z `kb-client pending` zwrócił „Requested
  entity was not found", `search_files` po nazwie — pusto. Testy poszły bez transkryptu, ścieżka kart
  „ŹRÓDŁO — transkrypt" i pole `KONTEKST` zostały niesprawdzone.

- 2026-10-09, `/daily 2026-10-09 1131`: na koncie `it-chef.com` `get_file_metadata` dla folderu
  `1m3Naru…` i dla dysku `0AAe3_…` → „not found", `list_recent_files` → same pliki z
  `owner: rafal-kielbasa@it-chef.com`. Rafał przełączył konektor (Disconnect → Connect) na
  `rafal.kielbasa@devstock.com`: folder → `title: raw-transcripts`, `search_files parentId` →
  transkrypty z 08.10 i 09.10, `download_file_content` → plik (56 656 B).

## Rozwiązanie
Konektor Drive musi być zalogowany kontem członka dysku `meetings` (`rafal.kielbasa@devstock.com`).
Gdy w kroku 2 Drive MCP zwróci „not found", najpierw `list_recent_files` i pole `owner` — inne konto
oznacza, że trzeba przełączyć konektor w claude.ai (Customize → Connectors → Google Drive). Obejście
na czas przełączenia: treść z wykonania kolektora (`01_Process_meeting`, węzeł `Format Transcript`,
pole `content`). `download_file_content` transkryptu przekracza limit wyniku narzędzia — harness
zapisuje JSON do `tool-results/`, a `content` to base64 do zdekodowania do `planning/transkrypty/`.
