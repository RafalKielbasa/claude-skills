---
name: elevenlabs-klucz-systemowy-wygrywa-z-env
description: Prywatny ELEVENLABS_API_KEY Rafała w zmiennych użytkownika Windows wygrywa z kluczem kursu z tools/course-pipeline/.env (node --env-file nie nadpisuje); objaw voice_not_found na głosie lektora.
metadata:
  node_type: memory
  type: project
  originSessionId: c6ebb064-81d9-4b6b-9857-7bf69d930b7a
  modified: 2026-10-22T06:35:05.251Z
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

**How to apply:** zanim zdiagnozujesz `voice_not_found`, 401 albo brak uprawnień ElevenLabs, sprawdź, czy
`ELEVENLABS_API_KEY` w środowisku systemowym różni się od tego w `.env`. Klucza w środowisku nie usuwaj sam.
Pojedyncze uruchomienie na kluczu kursu: `env -u ELEVENLABS_API_KEY npm run …`, ale tylko za zgodą Rafała.
Powiązane: [[tts-model-decyzja-v2-przerwy]], [[elevenlabs-klucz-bez-user-read]] (te 401 mogły pochodzić
z prywatnego klucza; tego nie sprawdzono).
