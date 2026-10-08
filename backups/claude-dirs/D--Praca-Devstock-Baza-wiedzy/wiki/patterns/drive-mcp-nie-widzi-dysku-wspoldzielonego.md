# drive-mcp-nie-widzi-dysku-wspoldzielonego

- **Skill:** daily, spotkanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Krok 2 `/daily` (i krok 2 trybu „transkrypt" `/spotkanie`) każe pobrać transkrypt z Drive
narzędziami Drive MCP. Kolektor n8n zapisuje transkrypty w folderze `raw-transcripts` na dysku
współdzielonym `meetings`, a Drive MCP takich plików nie widzi: `get_file_metadata` po id zwraca
„Requested entity was not found", a `search_files` z `parentId` folderu wraca pusty.

## Przyczyna źródłowa
Konektor Drive z claude.ai przeszukuje „Mój dysk" i „Udostępnione dla mnie", bez dysków
współdzielonych (brak odpowiednika `supportsAllDrives`/`corpora=allDrives`). Skill zakłada, że
każdy plik, który n8n zapisał na Drive, jest osiągalny tym samym konektorem — a n8n pisze
credentialem z dostępem do dysku współdzielonego.

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

## Rozwiązanie
W kroku 2: gdy Drive MCP zwróci „not found" albo pusty wynik, nie przerywać od razu — pobrać treść
z wykonania kolektora (`search_executions` dla `01_Process_meeting` + `get_execution`, węzeł
`Format Transcript`, pole `content`; surowy: `Poll Transcription Status`), a gdy n8n MCP też jest
niedostępny — poprosić o ręczną kopię. Docelowo komenda `kb-client transcript <date> <time>` przez
webhook n8n (jak `39_meeting_pending`), żeby skill nie zależał od konektora Drive.
