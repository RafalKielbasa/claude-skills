---
name: elevenlabs-klucz-bez-user-read
description: "Klucz ELEVENLABS_API_KEY w tools/course-pipeline/.env jest zawężony — brak user_read (limit/zużycie kredytów) i brak speech_to_text (npm run kontrola-lektora pada 401)."
metadata: 
  node_type: memory
  type: project
  originSessionId: afb24f69-6270-4bf0-9b52-663556c0609b
  modified: 2026-10-08T11:33:12.923Z
---

Klucz z `tools/course-pipeline/.env` ma uprawnienia wyłącznie do TTS. `GET /v1/user/subscription` zwraca:

> `HTTP 401 — {"detail":{"type":"authentication_error","code":"unauthorized","message":"The API key you used is missing the permission user_read to execute this operation."}}`

Sprawdzone 2026-09-11.

Ten sam klucz nie ma też `speech_to_text`: `npm run kontrola-lektora` (agenty-ai M00L01, 2026-10-08) kończy się:

> `BŁĄD: ElevenLabs Speech-to-Text: HTTP 401 - {"detail":{"type":"authentication_error","code":"unauthorized","message":"The API key you used is missing the permission speech_to_text to execute this operation.","status":"missing_permissions",...}}`

**Why:** Pytania „ile nam zostało kredytów", „na jaki plan nas stać", „czy stać nas na PCM (wymaga Pro)" nie mają odpowiedzi programowej — nie próbuj czytać ich z API. Kontrola lektora i rozpoznanie mowy slajdów/plansz (odsłony, `npm run montaz -- plansze`) wymagają STT, więc na tym kluczu nie ruszą.

**How to apply:** Stan planu i zużycia bierz z dashboardu ElevenLabs albo poproś Rafała o wklejenie. Do liczenia kosztów wystarczy arytmetyka: 1 znak = 1 kredyt, API $0,10/1000 znaków, identycznie dla `eleven_multilingual_v2` i `eleven_v3`. Znaki narracji policzysz parserem z repo — patrz [[tts-model-decyzja-v2-przerwy]]. Przed krokiem z STT sprawdź, czy Rafał dodał kluczowi `speech_to_text` (dashboard ElevenLabs → API keys); sam uprawnień nie zmienisz.
