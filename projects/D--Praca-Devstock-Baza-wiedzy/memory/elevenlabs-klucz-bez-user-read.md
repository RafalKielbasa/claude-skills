---
name: elevenlabs-klucz-bez-user-read
description: "Klucz ELEVENLABS_API_KEY w tools/course-pipeline/.env jest zawężony — brak uprawnienia user_read, więc limitu i zużycia kredytów nie da się odczytać z API."
metadata: 
  node_type: memory
  type: project
  originSessionId: afb24f69-6270-4bf0-9b52-663556c0609b
  modified: 2026-09-11T16:06:01.995Z
---

Klucz z `tools/course-pipeline/.env` ma uprawnienia wyłącznie do TTS. `GET /v1/user/subscription` zwraca:

> `HTTP 401 — {"detail":{"type":"authentication_error","code":"unauthorized","message":"The API key you used is missing the permission user_read to execute this operation."}}`

Sprawdzone 2026-09-11.

**Why:** Pytania „ile nam zostało kredytów", „na jaki plan nas stać", „czy stać nas na PCM (wymaga Pro)" nie mają odpowiedzi programowej — nie próbuj czytać ich z API.

**How to apply:** Stan planu i zużycia bierz z dashboardu ElevenLabs albo poproś Rafała o wklejenie. Do liczenia kosztów wystarczy arytmetyka: 1 znak = 1 kredyt, API $0,10/1000 znaków, identycznie dla `eleven_multilingual_v2` i `eleven_v3`. Znaki narracji policzysz parserem z repo — patrz [[tts-model-decyzja-v2-przerwy]].
