---
name: n8n-fetch-bez-browser-id-wylogowuje
description: Własny fetch do /rest n8n Cloud bez nagłówka browser-id zwraca 401 i kończy sesję profilu kursu; potem potrzebne ręczne logowanie Rafała
metadata:
  node_type: memory
  type: reference
  originSessionId: e0706d53-499b-42b8-bb96-921149b2959b
  modified: 2026-11-05T22:16:10.034Z
---

Fetch ze strony n8n Cloud do `/rest/...` bez nagłówka `browser-id` (wartość z `localStorage['n8n-browserId']`) dostaje 401, a sesja profilu kursu znika: kolejne otwarcie ląduje na `/signin`, `login --refresh` zgłasza „widoczne pole hasła”. Stało się 2026-11-05 przy skrypcie szukającym id workflow przed sondą 4K. Sprawdzone: sesja działała przed skryptem, po dwóch uruchomieniach jej nie ma. Zakładam, bez sprawdzenia: n8n czyści ciasteczko przy błędzie weryfikacji `browser-id`.

**How to apply:** do `/rest` na koncie kursu używaj helpera `api` z `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js:24` albo tych samych nagłówków. Blokada zapisów niczego tu nie chroni, bo to odpowiedź na GET. Przywrócenie: ręczne `npm run nagrywanie -- login <lekcja> --usluga n8n` z rękami Rafała.
