---
name: drive-konektor-konto-devstock
description: "Konektor Google Drive (claude.ai) musi być zalogowany kontem rafal.kielbasa@devstock.com — na it-chef.com nie widzi dysku współdzielonego `meetings` z transkryptami."
metadata:
  node_type: memory
  type: reference
  originSessionId: f7bf21f5-5b92-4551-a9f4-8f4ad317b15c
  modified: 2026-10-14T07:23:39.271Z
---

Transkrypty spotkań kolektor n8n zapisuje w folderze `raw-transcripts` (`1m3NaruSi4Kw1BsXUi0tK_YDBZ3H2DMmI`) na dysku współdzielonym `meetings` (`0AAe3_HQ3HAOXUk9PVA`). Konektor Drive z claude.ai widzi dyski współdzielone — „Requested entity was not found" z 2026-10-08/09 wynikał wyłącznie z tego, że był zalogowany kontem `rafal-kielbasa@it-chef.com`. Po przełączeniu na `rafal.kielbasa@devstock.com` (2026-10-09) `get_file_metadata`, `search_files parentId = '1m3Naru…'` i `download_file_content` działają.

**Why:** dwa dni szukania obejść (dane wykonania n8n, ręczna kopia) przy błędnej diagnozie „konektor nie obsługuje dysków współdzielonych".

Przełączenie nie jest trwałe: 2026-10-14 konektor był znów na `it-chef.com` (cofnął się gdzieś między 10-09 a 10-14), więc „not found” wróciło przy `/spotkanie`. `/daily` i `/spotkanie` pobierają transkrypt tym samym konektorem, więc problem dotyczy obu naraz.

**How to apply:** gdy Drive MCP zwraca „not found" dla pliku z `kb-client pending`, najpierw `list_recent_files` i sprawdź pole `owner` — konto `it-chef.com` oznacza, że Rafał musi przełączyć konektor (claude.ai → Customize → Connectors → Google Drive → Disconnect/Connect). `download_file_content` dla transkryptu przekracza limit wyniku — harness zapisuje JSON do `tool-results/`, treść to base64 w polu `content`, dekoduj Node'em do `planning/transkrypty/`.
