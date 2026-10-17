---
name: v4-angielskie-nazwy-bez-fonetyki
description: Odsłuch 2026-10-16 (lekcja agenty-ai 1.3) - lektor eleven_v4 czyta angielskie nazwy w polskim tekście poprawnie; zapis fonetyczny przegrał we wszystkich 22 parach
metadata:
  node_type: memory
  type: project
  originSessionId: 541cf3f0-bb8c-449a-92fd-d69e74d140fc
  modified: 2026-10-16T19:34:46.403Z
---

Rafał 2026-10-16 odsłuchał 44 próbki V4 (22 pary: zapis angielski vs mój fonetyczny, zdania z lekcji 1.3: PDF, HTML, Markdown, Word, Binary, Map Reduce, Max Pages, CSV/XLSX, Basic LLM Chain, Extract from File, Summarization Chain, Chunk Overlap, Options, Execute step, Chat Model, HTML to Markdown, Web...) i wybrał zapis angielski w każdej. Jego wniosek: "wejście modelu V4 spowodowało poprawne czytanie angielskich słów w ramach polskiego tekstu", słowniczek `wymowa.md` uważa za zbędny.

Kontrprzykład z tego samego dnia: `API` na V4 przeczytane literami "A PE I" (lekcja 1.2) - skróty wersalikami nadal potrafią wyjść źle. Niesprawdzone na V4: `JSON` (wpis `dżejson` z odsłuchu v2), `n8n` w pisowni oryginalnej, `credential`. Kurs `misja-ai-start` jest na v2 - tam lista nadal obowiązuje.

**Why:** reguła "nazwy trudne dla TTS zapisujemy fonetycznie" (`kursy/_wspolne/redakcja.md`) powstała na v2; na V4 fonetyka angielskich słów brzmi gorzej niż oryginał.
**How to apply:** w kursach na V4 nie proponuj zapisu fonetycznego dla angielskich słów i nazw; inwentarz wymowy ([[inwentarz-wymowy]] w wiki repo) zawężaj do skrótów wersalikami, cyfr w nazwach i nazw bez polskich znaków. Zmiana `redakcja.md`/`wymowa.md` zależy od decyzji Rafała (stan: pytanie zadane 16.10). Powiązane: [[wymowa-n8n-json-odsluch]], [[tts-model-decyzja-v2-przerwy]].
