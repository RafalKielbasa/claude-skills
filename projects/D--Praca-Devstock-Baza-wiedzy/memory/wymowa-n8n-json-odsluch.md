---
name: wymowa-n8n-json-odsluch
description: Od 2026-09-09 n8n w mowie to "en osiem en", a JSON to dżejson; podmienione tylko w M00L02, siedem starszych scenariuszy ma stary zapis.
metadata:
  type: project
---

Kurs `agenty-ai`: w tekście lektora `n8n` zapisujemy `"en osiem en"`, a `JSON`
jako `dżejson` (bez cudzysłowu w mowie potocznej, w cudzysłowie jako nazwa
widoku). Decyzja z odsłuchu próbek 2026-09-09, lista `kursy/agenty-ai/wymowa.md`.
Podmieniona **tylko** lekcja M00L02. Stary zapis `"n osiem n"` stoi jeszcze
w `modul-00/lekcja-01` (15 wystąpień, `video: brak` — podmiana darmowa)
i w pięciu scenariuszach modułu 1 (23 wystąpienia, wszystkie
`video: wyrenderowane`).

**Why:** ElevenLabs czytał `"n osiem n"` jako „ny osiem en", a `JSON` sylabizował
jako „dżejs-on". Zakres podmiany Rafał świadomie zawęził do jednej lekcji, bo
w module 1 zmiana scenariusza unieważnia gotowe paczki lektora i avatarów.

**How to apply:** przed renderem albo re-renderem którejkolwiek z tych lekcji
sprawdź `grep "n osiem n" video/scenariusz.md` i zapytaj Rafała o podmianę —
inaczej kurs zabrzmi dwiema różnymi nazwami tego samego narzędzia. Nową decyzję
fonetyczną potwierdzaj odsłuchem (`tools/course-pipeline/experiments/wymowa-proba.mjs`),
nigdy wpisem z głowy. Patrz [[tts-model-decyzja-v2-przerwy]] i
[[kurs-video-tor-b-bez-spiecia]].
