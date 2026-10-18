---
name: wymowa-n8n-json-odsluch
description: "n8n w mowie to \"en osiem en\", JSON to dżejson (od 2026-09-09); od 2026-10-17 żaden scenariusz agenty-ai nie ma już starego zapisu \"n osiem n\"."
metadata:
  node_type: memory
  type: project
  originSessionId: 3440d7d5-4658-4c7e-b64a-fec3fcfee504
  modified: 2026-10-17T09:44:46.371Z
---

Kurs `agenty-ai`: w tekście lektora `n8n` zapisujemy `"en osiem en"`, a `JSON`
jako `dżejson` (bez cudzysłowu w mowie potocznej, w cudzysłowie jako nazwa
widoku). Decyzja z odsłuchu próbek 2026-09-09 (model v2), lista
`kursy/agenty-ai/wymowa.md`.

Stan 2026-10-17: stary zapis `"n osiem n"` usunięty ze wszystkich scenariuszy
(ostatnie: lekcja 1.5 przy re-renderze V4, commit `45a0b480`, i 1.4 w innej
sesji). Na V4 stary zapis nigdy nie był odsłuchany celowo; nowy brzmi dobrze
w zaakceptowanych filmach V4 (0.1, 0.2, 0.3, 1.2, 1.5).

**Why:** ElevenLabs v2 czytał `"n osiem n"` jako „ny osiem en", a `JSON`
sylabizował jako „dżejs-on".

**How to apply:** przed renderem sprawdź `grep "n osiem n" video/scenariusz.md`
już W BRAMCE (przed pierwszym płatnym wywołaniem, nie po `--plan-avatara`).
Kontrola lektora słyszy `"en osiem en"` jako „EN osiem N” - to zapis
rozpoznania, nie błąd. Nową decyzję fonetyczną potwierdzaj odsłuchem
(`tools/course-pipeline/experiments/wymowa-proba.mjs`), nigdy wpisem z głowy.
Patrz [[tts-model-decyzja-v2-przerwy]].
