---
name: localhost-ipv6-port-hijack
description: "Obcy proces na [::1]:3001 przechwytuje ruch z localhost i FE dostaje 404 mimo zdrowego API — diagnoza przez curl -4 vs -6"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7844f44c-0244-4d6d-b515-5c3902552ad9
  modified: 2026-09-02T09:44:28.619Z
---

Na tej maszynie `localhost` rozwiązuje się **najpierw do IPv6 (`::1`)**, a gniazdo
związane z konkretnym adresem `[::1]` wygrywa z gniazdem związanym z wildcardem
`[::]`. Windows nie zgłasza przy tym żadnego konfliktu portu, bo formalnie go nie ma.

Skutek zaobserwowany 2026-09-02: API (`apps/api`, wildcard `0.0.0.0` + `[::]`) było
zdrowe, ale rewrite `/api/:path*` z `apps/web/next.config.ts` — czytający
`API_URL="http://localhost:3001"` — trafiał w **`json-server` z innego projektu**
(`D:\Praca\Devstock\Akademia\Live modul 2\sieciowe_zbiki\app-state`) siedzący na
`[::1]:3001`. Front dostawał 404 z ciałem `{}` przy w pełni działającym backendzie.

**Diagnoza, w tej kolejności:**

1. `netstat -ano | grep LISTENING | grep ":3001"` — dwa różne PID-y na tym samym
   porcie to cała odpowiedź; jeden na wildcardzie, drugi na `[::1]`.
2. `curl -4 http://127.0.0.1:3001/...` kontra `curl -6 http://[::1]:3001/...` —
   rozjazd kodów odpowiedzi potwierdza przechwycenie.
3. Ciało błędu odróżnia sprawcę: NestJS zwraca
   `{"message":"Cannot POST /...","error":"Not Found","statusCode":404}`, obcy proces
   zwykle coś innego (tu `{}`). Samo `x-powered-by: Express` **nie** dowodzi, że to
   nasze API — dowodzi tylko, że to jakiś Express.
4. `Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>'` daje pełną linię poleceń
   i wskazuje projekt, z którego pochodzi proces.

**Trwałe zabezpieczenie:** w `apps/web/.env.local` ustawić
`API_URL="http://127.0.0.1:3001"` zamiast `localhost` — wymusza IPv4 i odcina tę klasę
kolizji. Wymaga restartu `pnpm dev`, bo `next.config.ts` czyta `API_URL` przy starcie.

Nie myl tego z awarią aplikacji: żaden commit nie musi być winny, a testy jednostkowe
i e2e będą zielone, bo omijają rewrite Next.js.
