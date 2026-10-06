---
name: internship-exam-2026-09
description: "Egzamin z praktyk Konrada (CP-106 ogłoszenia + powiadomienia in-app) i Miłosza (CP-107 zaproszenia do zespołu); dokumenty napisane 2026-09-20, stan bramek i kalendarz"
metadata: 
  node_type: memory
  type: project
  originSessionId: c984816c-8f95-40f7-98e1-4f43366c2557
  modified: 2026-10-06T13:02:06.874Z
---

Egzamin z praktyk 2026-09 zaprojektowany 2026-09-20 (brainstorming, 6 sekcji zatwierdzonych).
Dokumenty w repo: `docs/exams/2026-09-internship-exam/` (README PL, CP-106, CP-107, rubric, plans/README)
i spec EN `docs/superpowers/specs/2026-09-20-internship-exam-design.md`. Zacommitowane 2026-09-20 na `main`
jako 4753cd9 (na prośbę Rafała), NIE wypchnięte. Issues CP-106/CP-107: drafty w
`docs/superpowers/plans/tickets/2026-09-20-internship-exam/` (epic.md, CP-106.md, CP-107.md), self-check
i codex review zrobione, czekają na „wyślij" Rafała (bramka 2 skilla `github-tickets`).

Kluczowe decyzje: prawdziwe funkcje do `main`; tylko egzamin przez miesiąc; AI dozwolone + obrona 60 min;
koncept produktowy bez kontraktów; przydział poza strefę komfortu (Konrad → BE-ciężkie ogłoszenia,
Miłosz → auth-ciężkie zaproszenia); próg 80/100, poziomy 0/40/80/100 %; komunikacja tylko Discord,
plan jako draft PR na GitHubie; komentarze w kodzie opcjonalne.

Kalendarz: kickoff pon 21.09; plan v1 do czw 24.09; Rafał na urlopie 23.09–04.10; akceptacja planu do
śr 30.09; twardy start implementacji czw 01.10; Figma od Rafała do pon 05.10; checkpoint BE wt 13.10;
zmiana wymagań + cross-review 12–16.10; ostatni commit nd 25.10; obrony czw 29.10 i pt 30.10.

Materiały sprawdzające (NIE dla kandydatów) w vaulcie: `D:\Notatki\notatki\praca\projekty\edu-saas\egzamin-praktyki-2026-09\`
(README z checklistą bramek, pytania-obrona-konrad/milosz, zmiana-wymagan, karta-oceny-*, dziennik-review, statusy);
utworzone 2026-09-20, niezacommitowane w vaulcie. Codex review dokumentów wcielony 2026-09-20 (24 uwagi, sekcja w specu).

Bramka 1, stan na 2026-09-26: plany v1 obu kandydatów wysłane w terminie jako draft PR-y — Konrad PR #199
(`plans/konrad.md`, commit `c372f32` z 24.09 17:33) i Miłosz PR #200 (`plans/milosz.md` + 12 makiet PNG
w `plans/milosz-assets/`, commit `56f7ec3`). Oba zrecenzowane i skomentowane 2026-09-26 z konta Rafała:
#199 → 17 braków (issuecomment-5846215345), #200 → 5 braków (issuecomment-5846484184). Akceptacji
(„Plan zaakceptowany") jeszcze NIE ma — termin śr 30.09. Jakość: plan Miłosza kompletny, 15 twierdzeń
o repo sprawdzonych i wszystkie trafione; plan Konrada ma poza brakami 2 błędy merytoryczne i 4
sprzeczności wewnętrzne, których Rafał świadomie nie wysłał.

Widoki w Figmie (obiecane na 05.10), start 2026-10-06: zakres = pełna macierz stanów z planów (44 ramki na 4 stronach),
decyzja Rafała. Bramki: komponenty → Ogłoszenia → Powiadomienia → Zespół → Zaproszenie. Termin realny: przed 12.10
(Konrad robi ekrany od zadania 10 „od razu według widoków"). Postęp i ID: `.dsb-state-exam-views-2026-10.json`
(zob. [[figma-design-system-library]]). Formalnego „Plan zaakceptowany" w #199/#200 nie ma, obaj implementują backend.
Stan 2026-10-06 wieczór: wszystkie 44 ramki zbudowane, bramki 1–4 zaakceptowane, bramka 5 (Zaproszenie `1331:7`)
czeka na review. Strony: Ogłoszenia `1315:7`, Powiadomienia `1323:7`, Zespół `1327:7`, Zaproszenie `1331:7`.
Zamiast wiadomości na Discord: linki do widoków i lista odstępstw od makiet kandydatów dopisane 2026-10-06
na końcu sekcji „Zanim zaczniesz" w issues #196 (CP-106) i #197 (CP-107); kandydatów informuje Rafał.

**Why:** stan bramek i daty nie wynikają z kodu; następna sesja może zacząć od „załóż issues" albo
„oceń plan Konrada" bez ponownego wywiadu.
**How to apply:** przed zakładaniem issues sprawdź, czy dokumenty są już w `main`; przy ocenie planów
używaj `rubric.md`, nie własnych kryteriów. Powiązane: [[feedback-no-commits-user-only]],
[[feedback-tickets-are-github-issues]], [[plans-dir-gitignored]].
