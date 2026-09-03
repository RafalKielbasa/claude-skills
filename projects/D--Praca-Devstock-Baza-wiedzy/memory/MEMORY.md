# Memory Index

- [Demo live Agenci AI 27.08 — status](demo-live-agenci-ai-status.md) — spec + plan (17 tasków) + assety `demo/live-agenci-ai/` gotowe 2026-08-13; n8n Cloud świeże konto, sam Google, bez wektorów, Telegram; środowiska klika Rafał, Claude wspiera.
- [Plansze na live — źródło obrazu nieustalone](plansze-live-zrodlo-obrazu.md) — komplet plansz gotowy, ale puszcza je laptop Bartka, nie OBS; decyzja o modelu (deck vs narzutki) w poniedziałek 2026-08-24.
- [Webhook KB — losowe puste 200](kb-webhook-cold-start.md) — `index-knowledge-entry` pada losowo; pętla ponowień pod rząd NIGDY nie pomaga, ponawiaj pojedynczo z odstępem (bywa 8 prób); `stats` to osobny webhook, nie sonda zdrowia.

- [Tor B — mapa deklarowana (przebudowa 2026-07-30)](tor-b-mapa-deklarowana.md) — nagranie bez dźwięku, czasy ręczne w szkielecie mapy; STT+Gemini skasowane; kalibracja stałych ostrzeżeń po pierwszym realnym użyciu.
- [Kurs agenty-ai — zakres](kurs-agenty-ai-zakres.md) — 6 modułów no-code; moduły pro (Computer Use, Multi-Agent) odłożone na etap 2.
- [Skill /spotkanie — odroczone poprawki](spotkanie-skill-odroczone-poprawki.md) — 6 drobnych szlifów do jednego commita po pierwszym realnym spotkaniu.
- [Baza wiedzy — wdrożona + odzysk legacy ZAKOŃCZONY](baza-wiedzy-wdrozenie-task-12.md) — system żyje na prodzie; operacja `export`; wszystkie 6 kategorii odzyskane z legacy Notion i re-indeksowane na czysto, zero legacy. Stan 2026-09-01: dev 588, marketing 222, product 121, company 28, sales 22, other 3, interns bez tabeli; baza rośnie też z aplikacji agentowej (entry_id = cuid, source=app) — treść tych wpisów widać tylko przez `export`, nie `list`. Uwaga: sales+other commit na cudzej gałęzi TTS — do posprzątania.
- [TTS lektor — decyzja v2 z przerwami](tts-model-decyzja-v2-przerwy.md) — zostajemy na eleven_multilingual_v2 + przerwy; v3 ładniejszy, ale odłożony (brak stitching, limit 5k znaków).
- [Nie commituj — Rafał sam](nie-commituj-rafal-sam.md) — Claude NIE robi commitów/pushy w tym repo; egzekwowane przez `.claude/settings.json`.
- [n8n: webhook z basicAuth bez credentiala](n8n-webhook-basicauth-bez-credentiala.md) — objaw to 500 "No authentication data defined on node!", nie 401; sonda złym hasłem odróżnia zepsuty webhook od zdrowego.
