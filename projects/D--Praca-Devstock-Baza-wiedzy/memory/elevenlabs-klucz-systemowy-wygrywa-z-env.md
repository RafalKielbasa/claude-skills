---
name: elevenlabs-klucz-systemowy-wygrywa-z-env
description: Prywatny ELEVENLABS_API_KEY Rafała w zmiennych użytkownika Windows wygrywa z kluczem kursu z tools/course-pipeline/.env (node --env-file nie nadpisuje); objaw voice_not_found na głosie lektora.
metadata:
  node_type: memory
  type: project
  originSessionId: c6ebb064-81d9-4b6b-9857-7bf69d930b7a
  modified: 2026-10-22T06:57:16.902Z
---

2026-10-22: Rafał ma w zmiennych środowiskowych Windows (zakres User) swój prywatny `ELEVENLABS_API_KEY`. Skrypty
`tools/course-pipeline` startują przez `node --env-file=.env`, a Node nie nadpisuje zmiennej, która już jest
w środowisku. Tak samo działa `process.loadEnvFile` w `src/cli.js:175` i `src/montaz-cli.js:190`, który zresztą
w ogóle nie ładuje pliku, gdy klucz już jest. Pipeline szedł więc na prywatnym koncie, na którym nie ma głosu
lektora V4 `2MLx6VudpP6LiJSGs38o`, i dostawał HTTP 404 `voice_not_found`. Gotowe głosy z biblioteki ElevenLabs
działały normalnie. Od kiedy zmienna jest ustawiona, nie wiadomo (ostatnie udane audio kursu: 2026-10-20 11:07).
Sprawdzone porównaniem wartości bez ich wypisywania (`env-source.mjs` w scratchpadzie sesji c6ebb064). Klucze HeyGen
w środowisku systemowym nie są ustawione.

**Why:** 404 na głosie wyglądało na skasowany głos albo złe konto. Rafał zgłosił podejrzenie, że skrypt bierze klucz
ze zmiennych systemowych, i potwierdziło się.

**Naprawione 2026-10-22 (D66 A, commit `5aeec35d` na `rafal-kielbasa/17-10-2026`):** bezpośrednie uruchomienie
`src/cli.js` wczytuje `.env` pakietu z nadpisaniem (`src/package-env.js`) i wypisuje
`UWAGA: .env pakietu nadpisał zmienne środowiska systemowego: ELEVENLABS_API_KEY`. Testy idą przez import
`uruchom`, nie przez CLI, więc dalej widzą klucz systemowy. Przy ustawionej zmiennej `tests/tts.test.js`
„rzuca gdy brak klucza API” pada (robi prawdziwe wywołanie, dostaje 404). Taki zestaw testów uruchamiaj
z `env -u ELEVENLABS_API_KEY`.

**How to apply:** zanim zdiagnozujesz `voice_not_found`, 401 albo brak uprawnień ElevenLabs, sprawdź, czy
`ELEVENLABS_API_KEY` w środowisku systemowym różni się od tego w `.env`. Skrypt spoza `src/cli.js` (np. sonda
z `node --env-file`) nadal bierze klucz systemowy. Klucza w środowisku nie usuwaj sam; korzysta z niego coś
innego Rafała.
Powiązane: [[tts-model-decyzja-v2-przerwy]], [[elevenlabs-klucz-bez-user-read]] (te 401 mogły pochodzić
z prywatnego klucza; tego nie sprawdzono).
