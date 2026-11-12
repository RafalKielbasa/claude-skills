---
name: dt-102-grafiki-artykulow-odlozone
description: "DT-102 (#853, content-deploy-article-images) — implementacja odłożona 2026-11-12; gdzie leży plan 1 i spec, co czeka przy wznowieniu"
metadata:
  node_type: memory
  type: project
  originSessionId: 4a866f6c-3581-40fc-baf4-c2b15facfe32
  modified: 2026-11-12T10:14:13.908Z
---

Rafał odłożył implementację DT-102 (devstock-org/devstock-team#853, publikacja artykułów lekcji z grafikami) 2026-11-12, bez terminu, i poprosił o zapisanie lokalizacji planu.

- Plan 1 (11 zadań, trzy repo, sondy P1–P3, po review Codexa, NIEZAAKCEPTOWANY): `D:\Praca\Devstock\Baza wiedzy\docs\superpowers\plans\2026-11-12-content-deploy-article-images-plan-1.md`
- Spec (zaakceptowany, z zadaniem mobilnym): `D:\Praca\Devstock\Baza wiedzy\docs\superpowers\specs\2026-11-12-content-deploy-article-images-design.md`
- Indeks: `docs/superpowers/projects/content-deploy.md` — część ⏸ wstrzymane, decyzja czekająca „Akceptacja planu 1 i tryb wykonania” (rekomendacja: subagenci z recenzją).
- Stan 2026-11-12: spec, plan i zmiana indeksu NIEZACOMMITOWANE w głównym folderze (gałąź `rafal-kielbasa/11-11-2026`); commit tylko na `rafal-kielbasa/12-11-2026`, którą zakłada Rafał. Sprawdź `git status` przy wznowieniu — mogły trafić do cudzego commita albo zniknąć.
- Produkcja grafik (model, zrzuty, plansze z kodu) to osobna karta #921 (DT-140), backlog, epik #122 — nie część DT-102.

**Why:** Rafał wraca do tego później i chce trafić prosto do planu.
**How to apply:** przy „wracamy do DT-102” / „grafiki w artykułach” zacznij od akceptacji planu 1 i trybu wykonania; zadanie 1 to sonda P1 (Rafał porównuje host `Hosted URL` w CMS stagingu i produ). Zmiany w code-busters-v2 i code-busters-mobile dopiero po akceptacji planu, commit tam tylko na polecenie. Powiązane: [[codebusters-publish-diagnoza-500]], [[ilustracje-podpis-w-artykulach]], [[kodozercy-zmiana-web-sprawdz-mobile]].
