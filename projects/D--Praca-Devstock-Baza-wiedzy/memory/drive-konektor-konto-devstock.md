---
name: drive-konektor-konto-devstock
description: "Transkrypty spotkań pobiera `kb-client transcript` (webhook n8n 41_meeting_transcript), nie konektor Drive — konektor claude.ai zostaje na it-chef.com i nie widzi dysku `meetings`."
metadata:
  node_type: memory
  type: reference
  originSessionId: f7bf21f5-5b92-4551-a9f4-8f4ad317b15c
  modified: 2026-10-14T08:38:25.704Z
---

Od 2026-10-14 `/daily` i `/spotkanie` pobierają transkrypt komendą
`npm --prefix tools/kb-client run kb -- transcript --name <data>-<godzina>-transkrypt[-surowy].md`
(webhook n8n `41_meeting_transcript`, id `RzlEpwubay0clYEH`, eksport w
`devstock-team-agent/workflows/41_meeting_transcript.json`). Plik ląduje w `planning/transkrypty/`;
komenda odmawia nadpisania istniejącego. Błąd „Brak … w raw-transcripts” = n8n nie przetworzył
nagrania (albo zła nazwa).

Konektor Google Drive w claude.ai jest zalogowany na `rafal-kielbasa@it-chef.com` i ma tak zostać
(decyzja Rafała 2026-10-14) — na tym koncie nie widzi dysku współdzielonego `meetings`
(`0AAe3_HQ3HAOXUk9PVA`, folder `raw-transcripts` `1m3NaruSi4Kw1BsXUi0tK_YDBZ3H2DMmI`), więc
„Requested entity was not found” z Drive MCP dla transkryptów jest oczekiwane, nie awaria.

**Why:** dwa razy (2026-10-08/09 i 2026-10-14) szukano obejść, bo konektor bywał na koncie
it-chef.com; Rafał chce używać tego konta w Claude.

**How to apply:** po transkrypt sięgaj po `kb-client transcript`, nie po Drive MCP. Nie proś
Rafała o przełączenie konektora. Gdy webhook zawiedzie z innym komunikatem niż „Brak …”, poproś
o ręczne wgranie pliku do `planning/transkrypty/`.
