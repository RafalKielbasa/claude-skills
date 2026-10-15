---
name: intern-evaluation-2026-10
description: "Porównawcza ocena Norberta (po module 5), Konrada i Miłosza (śródegzaminacyjna) z 2026-10-15; gdzie leży raport, metodyka, regresja #192 na main"
metadata:
  node_type: memory
  type: project
  originSessionId: 33ae55ee-fc4a-46e7-a35a-aa869be08cd2
  modified: 2026-10-15T07:52:23.271Z
---

Raport z 2026-10-15 w vaulcie: `D:\Notatki\notatki\praca\projekty\edu-saas\ocena-praktykantow-2026-10.md`
(niezacommitowany). Metodyka: regulamin praktyk (`Baza wiedzy/knowledge-base/praktyki/zasady-wspolpracy-praktyki.md`,
„Ocena postępów” = porównawczo na tle kursantów) + poziomy z `docs/exams/2026-09-internship-exam/rubric.md`
jako punkt odniesienia; dwa okna: równy staż (13 tyg.) i wspólny kalendarz 14.07–20.09.

Wnioski: Norbert ~75% przepustowości kolegów przy tym samym stażu, bez wzrostu, CR rośnie (2→3→10 w m1–m3),
10 klas uwag wraca po wskazaniu (najmocniej barrel/importy), 5/10 PR-ów z obcym albo zgubionym kodem
(#198 quizy z CP-104 w `35db0f2`). Konrad: nauka w tenancy/e2e, duplikacja wraca w 6 PR-ach. Miłosz:
najszybszy i najpełniej reagujący, płytki jako recenzent. Pierwszego (wcześniejszego) sprawdzenia Konrada
i Miłosza nie znaleziono nigdzie.

Decyzja Rafała 2026-10-15: moduł 5 Norberta niezadowalający, przed modułem 6 weryfikacja 4 celów (obce pliki, uwaga = klasa błędu / ≤1 runda CR, AC z dowodem, odpowiedź na każdą uwagę); szkic dla Norberta w vaulcie `feedback-norbert-modul-5.md`, termin weryfikacji nieustalony. Wpis też w `edu-saas.md` (postępy + planowane prace).

Niezgłoszona regresja: merge `eaac0ea` Norberta w #192 cofnął na `main` poprawkę Miłosza z #191 w
`apps/web/src/app/tenant/[subdomain]/creator/layout.tsx:22` (`flex ... flex-col` → `min-w-0 flex-1`).
Issue założone 2026-10-15: #204 CP-109 (epik #178, `frontend`), przypisane Norbertowi z komentarzem o pochodzeniu regresji (issuecomment-6189152351).

**Why:** decyzja o module 5 Norberta i feedback dla K/M opierają się na tych liczbach; regresja na `main` ma ticket #204 (CP-109, Norbert).
**How to apply:** przy feedbacku dla K/M nie zdradzać zmiany wymagań A (zob. [[internship-exam-2026-09]]);
przed ponownym cytowaniem liczb przelicz je, bo PR-y #199/#200/#202 wciąż się zmieniają.
