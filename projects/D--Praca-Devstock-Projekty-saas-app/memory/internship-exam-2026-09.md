---
name: internship-exam-2026-09
description: "Egzamin z praktyk Konrada (CP-106 ogłoszenia + powiadomienia in-app) i Miłosza (CP-107 zaproszenia do zespołu); dokumenty napisane 2026-09-20, stan bramek i kalendarz"
metadata: 
  node_type: memory
  type: project
  originSessionId: c984816c-8f95-40f7-98e1-4f43366c2557
  modified: 2026-10-29T11:11:00.996Z
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

Checkpoint BE Konrada 2026-10-12 (PR #199, tip `ae6206f`): BE OK, CI zielone, bez wycieku tenantów. Wysłane
review 5493597602 typu COMMENT, decyzja Rafała: duplikaty nieblokujące, bez ponownego sprawdzenia,
następne jest review końcowe. 3 uwagi (kurs zamiast `validateBelongsToTenant`, 5. kopia `P2025`, `trim` z
`UpdateUserDto`). Celowo NIE wysłana: kopia wyznaczania odbiorców w `prisma/seed/announcements.ts:40-52`,
bo to sprawdza zmiana wymagań A. Wstępnie „dobry junior”: schemat 8/10, serwisy 12/15.

Checkpoint BE Miłosza 2026-10-12 (PR #200, tip `a34e24b`; #197 to issue CP-107): BE OK, CI zielone, bez wycieku,
token tylko jako sha256. Review 5494000452 typu COMMENT, ta sama formuła co u Konrada, 7 uwag o duplikatach
(`normalizeEmail` vs `auth.service`, sha256 vs refresh token, token w seedzie, reguła `super_admin`/rang vs
`membership-rank.ts`, dwa handlery 409, odczyt nazwy szkoły, `P2002`/`P2025` → osobny ticket). Celowo NIE wysłane:
zaszyte 7 dni w `prisma/seed/verify.ts:438` i testach, bo to sprawdza zmiana wymagań A (ważność 1/7/30 dni).
Otwarte: Miłosz zgłosił brak `team/guards/invite-throttler.guard.ts` w `when` osi `rate-limiting` w `config.md`.
Wstępnie: schemat 8/10, serwisy 12/15.

Review końcowe Konrada 2026-10-22 (PR #199, tip `c08f46d`, nic nie wysłane na GitHub): bramki zielone w worktree
(API 562, web 353, e2e 207 na osobnej bazie `course_platform_test_cp106`); code-review-master run `20261022-115856-ckab`
leży w worktree `scratchpad/pr199` sesji e115bb16 (nie w repo), artefakt https://claude.ai/artifact/4pQASqtPjekez3P23dehUE.
Jedyna uwaga blokująca: seed powiela wyznaczanie odbiorców (`seed/announcements.ts:40-52` vs `announcements.service.ts:97-109`),
codex ją odrzuca (zakłada wywołanie `publish()`), ja trzymam. Bez wycieku tenantów i sekretów. Cross-review #200 = „LGTM:-)”
(18.10), Miłosz na #199 to samo 2 min później. `docs/announcements.md` 2358 słów vs 556 w `rate-limiting.md`. W kodzie brak
śladu zmiany wymagań A ani B; Rafał potwierdził 22.10: zmiana wymagań NIE poszła do Konrada.
Decyzje 22.10: review tylko do vaulta (`egzamin-praktyki-2026-09/review-koncowe-konrad.md`, commity `1e9691f`, `19b08b9`,
z 15-krokową checklistą i pytaniami na obronę), nic na GitHub przed 25.10. Tablica: DT-56 #745 w devstock-team, jedno issue
dla Konrada i Miłosza, bez treści ocen (nie przypinać do #196/#197, bo widzą je kandydaci). Przejście po aplikacji
przełożone na 23.10, start od kroku 1. Środowisko: baza `course_platform_cp106_dev` (seed z PR, zweryfikowany), API z worktree
`scratchpad/pr199` sesji e115bb16 (`.env` przepięty na tę bazę), web z worktree `D:\Praca\Devstock\Projekty\cp106-review`
(krótka ścieżka: w Temp Turbopack pada na limicie 260 znaków), `API_URL=127.0.0.1:3001`. Figma MCP zalogowana; w pliku
D1 = dzwonek z plakietką, D2 = bez plakietki (strona 1323:7). Na Windows `taskkill` w Git Bash wymaga `//PID`; klasyfikator
nie pozwala mi zabijać procesów, robi to Rafał.

Review końcowe Miłosza 2026-10-22 (PR #200, tip `8e6d0d5`, nic nie wysłane na GitHub): lint/typecheck/unit zielone
w worktree `D:\Praca\Devstock\Projekty\cp107-review` (API 607, web 494); e2e lokalnie NIE (Docker Desktop: proces żyje,
silnik nie), dowód z CI na tym tipie: 244/244. Bazy `course_platform_cp107_dev` i `_test_cp107` jeszcze NIE założone
(docker exec padł), `.env`/`.env.test`/`.env.local` w worktree już przepięte. crm run `20261022-150436-6a71` (w worktree),
artefakt https://claude.ai/artifact/QVKd1VYukbF436EAzyqUXA: 4 znaleziska, wszystkie <próg. Blokująca ręcznie (f-02, codex
potwierdził): 7 dni powielone w `seed/invitations.ts:83` i `verify.ts:438`. W1: podtytuł „Zespół” z subdomeną (sam zgłosił w PR).
Cross-review #199 „LGTM 👍”. Oba PR-y dodają `admin@`/`instructor@kuznia.local` z innymi ID (konflikt przy drugim merge'u).
Dokument w vaulcie `review-koncowe-milosz.md` (commit `beffec7`) z 18-krokową checklistą (Figma Z1–Z5, M1–M5, I1–I9;
tokeny linków SQL-em `encode(sha256(convert_to(...)),'hex')`) i 13 pytaniami. Wstępnie ≈82,6/90 bez obrony.
Na 23.10 (Rafał: „jutro dokończymy”): silnik Dockera zawieszony (`docker desktop restart` padł na wiszących `wsl.exe`);
wariant A czeka na Rafała: Quit Docker Desktop, `wsl --shutdown` (zatrzyma też Ubuntu), start. Potem: CREATE DATABASE
`course_platform_cp107_dev` i `course_platform_test_cp107`, `prisma migrate deploy` na obie, seed + `verify.ts`, lokalne e2e,
wyniki do `review-koncowe-milosz.md`; następnie przejścia po aplikacji (Konrad od kroku 1, Miłosz wg 18 kroków).

Zmiana wymagań: decyzja Rafała z 2026-10-12, wysyłka śr 14.10 (nie wt 13.10 z vaulta); wariant jeszcze
niewybrany (rekomendacja A dla obu). Rafał potwierdził 22.10: zmiana NIE poszła do żadnego z nich (wpisane w tabeli
„wysłane”, vault `792d863`); plan Miłosza zaakceptowany na Discordzie 26.09 (v2).

Obrona Konrada 2026-10-29: **zdał, wynik bardzo dobry** (Rafał: 10 pytań z odpowiedziami zadowalającymi, przygotowany,
wiedział, o czym mówi); punkty per kryterium obrony jeszcze niewpisane, karta w vaultcie niewypełniona. Ustalenia Rafała z 29.10:
zwolnił Konrada ze statusu 23.10 (bez obniżki), zaakceptował wszystkie elementy planu v2 (Discord). Materiał do obrony:
`.claude/review/reports/2026-10-29-cp-106-defence-prep.md` w worktree `.claude/worktrees/edu-saas-cp-106-defence-prep`
(gitignored, zniknie razem z worktree); wstępnie 79,6/90 bez obrony. Aplikację uruchomiłem z tego worktree (`.env` na
`course_platform_cp106_dev` i Redis db 2); `prisma migrate reset` blokuje sama Prisma bez jawnej zgody Rafała. PR #199
zmergowany 29.10 11:07 UTC przez Konrada (merge commit `ef801bb`) po review Rafała APPROVED „Good job :)” (11:06); issue #196
zamknięte automatycznie. f-01 (duplikat wyznaczania odbiorców w seedzie) weszła do `main` bez poprawki, podobnie odłożony
helper `P2025` → kandydaci na osobne issues. Obrona Miłosza: pt 30.10.

**Why:** stan bramek i daty nie wynikają z kodu; następna sesja może zacząć od „załóż issues" albo
„oceń plan Konrada" bez ponownego wywiadu.
**How to apply:** przed zakładaniem issues sprawdź, czy dokumenty są już w `main`; przy ocenie planów
używaj `rubric.md`, nie własnych kryteriów. Powiązane: [[feedback-no-commits-user-only]],
[[feedback-tickets-are-github-issues]], [[plans-dir-gitignored]].
