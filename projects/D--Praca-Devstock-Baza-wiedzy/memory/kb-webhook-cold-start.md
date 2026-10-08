---
name: kb-webhook-cold-start
description: "Webhook index-knowledge-entry (n8n fly.dev) losowo zwraca puste 200; pętla ponowień pod rząd NIGDY nie pomaga — ponawiaj pojedynczo z odstępem, bywa 8 prób."
metadata:
  node_type: memory
  type: project
  originSessionId: 94b8d57c-3d7c-45f1-9597-fda32481e15d
  modified: 2026-10-08T09:02:38.715Z
---

Webhook `index-knowledge-entry` bazy wiedzy (n8n na `n8n-devstock.fly.dev`) losowo odpowiada HTTP 200 z pustym body — kb-client zgłasza `Nieoczekiwana odpowiedź z ... :` i wpis NIE jest zaindeksowany. Zaobserwowane 2026-08-12, 2026-08-15 i intensywnie 2026-09-01 (16 plików, kilkanaście pustych odpowiedzi).

**Why:** to nie jest wyłącznie zimny start fly.io, jak zakładał wcześniejszy zapis tej notatki. 2026-09-01 obalone dwie rzeczy: (1) „kolejne wywołania trafiają w rozgrzaną instancję" — pętla `for` z czterema upsertami padła na wszystkich czterech, dwa razy z rzędu, a potem te same pliki przeszły pojedynczo; (2) „jeśli po ponowieniu błąd się powtarza, to realny problem workflowu" — `system-architecture.md` padł 8 razy w rozproszeniu i za dziewiątym przeszedł bez żadnej zmiany w pliku. Wygląda na to, że workflow nie znosi wywołań seria po serii i potrzebuje odstępu między nimi. Rozmiar pliku nie różnicuje: 38 KB przechodzi, 14 KB pada.

**How to apply:** upserty puszczaj **pojedynczo, w osobnych wywołaniach**, nigdy w pętli — pętla ponowień pod rząd to strata czasu, nie diagnostyka. Przy porażce ponów po naturalnym odstępie (np. po zapisaniu innego pliku), spokojnie 5-8 razy, zanim uznasz to za awarię. `npm run kb -- stats` odpowiada poprawnie nawet wtedy, gdy `index-knowledge-entry` pada — to osobny webhook, więc **nie jest sondą zdrowia** dla indeksowania; przydaje się za to do potwierdzenia, że serwis i autoryzacja żyją, czyli do odróżnienia awarii przejściowej od błędu konfiguracji. Efekt weryfikuj licznikiem z `stats` przed i po (2026-09-01: dev 565 → 602). Powiązane: [[baza-wiedzy-wdrozenie-task-12]].

**Uzupełnienie 2026-10-08 (pierwszy twardy dowód przyczyny):** puste body to webhook w trybie `responseNode`, którego wykonanie padło przed węzłem Respond. Dla `37_kb_similar` wykonanie `27635` padło w `PGVector Load` na `Connection terminated unexpectedly` (zerwane połączenie z puli Postgresa po awarii sieci), a klient dostał pusty 200. Kolejne wywołanie 13 s później przeszło. Przy następnym pustym 200 sprawdź `search_executions` (MCP `n8n-prod`) z `status: error` i odczytaj błąd węzła, zamiast zgadywać. Od 2026-10-08 takie błędy raportuje też `40_error_notify` na `#automation_updates`. Zob. [[n8n-prod-inwentaryzacja]].
