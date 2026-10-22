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

2026-10-22: dokument do wysłania Norbertowi `praca/projekty/edu-saas/analiza-pracy-norbert-2026-10-22.md`
(vault, commit `f23a9de`, wypchnięty) + wiadomość na Discord podana w czacie, wysyła Rafał. Na prośbę Rafała
porównanie z Konradem i Miłoszem po imieniu, ale tylko liczby (tempo, dni, rundy CR), bez ich słabości i bez
spraw egzaminu. Październik 05–22.10: N 7 dni z commitem / 2 089 linii, K 9 / 5 765, M 9 / 6 702; tydzień
12–18.10 N 1 commit; poprawka 14 linii w #202 po 4 d 20 h; 0 odpowiedzi w wątkach #202; #204 (CP-109) bez
ruchu od 15.10; 0 z 41 commitów z `(CP-n)`; poprawa: brak obcego kodu w #202 i #205. Odczucia Rafała
(z Discorda): Norbert szczery w statusach (plus), nie wychodzi ok. 20 h/tydz. z regulaminu. Warunki
zaliczenia: 7 punktów. Harmonogram od Rafała (22.10): termin końcowy 14.01.2027 (6 mies. od startu 14.07), punkt kontrolny w połowie po ~1,5 mies. = 04.12.2026 (data wyliczona przeze mnie z „po 1,5 miesiąca”); commit `c684ccb`.

Przeliczenie całego okresu 2026-10-22 (plik zaktualizowany, vault `7a27ea3`). Metoda, która odtwarza liczby z 15.10
co do linii: linie netto = `git diff merge-base(origin/main, refs/pull/N/head)..head` z filtrem (bez lockfile/.md/obrazów,
testy osobno), a gdy wychodzi 0 (wczesne PR-y scalone merge commitem) — pliki z `gh pr view --json files`;
`gh` obcina listę do 100 plików (#199, #200), więc nie jako główne źródło. PR liczony wg daty otwarcia. Commit-sumy
zawyżają (przepisywany kod, np. #145): Norbert w oknie równego stażu wychodzi wtedy ≈ Miłosz — nie używać do tempa.
Wyniki 14.07–22.10 (ten sam kalendarz): linie netto/tydz. N 549, K 1 002, M 1 327 (55% / 41%); dni z commitem/tydz.
2,6 / 2,3 / 3,3; linie na dzień z commitem 214 / 438 / 407; CR na scalony PR 1,9 / 0,7 / 0,3; mediana CR→poprawka
19,7 / 16,0 / 2,4 h (Norbert po review Rafała 9,1 h, po review kolegów 23,4 h). Równy staż potwierdzony: 574 / 768 / 757.
Trend CR wg miesiąca stażu: N 2, 3, 9, (3 w 11 dniach m4); K 9, 4, 3, 0; M 5, 4, 5, 2, 1. Fałszywy wyróżnik: odpowiedzi
w wątkach review — wszyscy prawie nie odpisują (N 4%, K 5%, M 2%), więc nie jako słabość Norberta na tle zespołu.
Wrzesień: Miłosz miał 4 PR-y (nie 3), 0 CR. Skrypty w scratchpadzie sesji 5c87bf80 (`full/`), nietrwałe.
