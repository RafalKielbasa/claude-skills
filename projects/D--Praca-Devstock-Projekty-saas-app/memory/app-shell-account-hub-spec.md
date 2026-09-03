---
name: app-shell-account-hub-spec
description: "2026-09-02 spec obudowy aplikacji (AppShell w layoutach, TanStack Query, /account) po review codex, ZAŁOŻONE issues: epik #167 z CP-89..96 (#168-#175, CP-94 #173 pod #128), #157 przepisane i przepięte; spec w main (2f1b1d7)"
metadata: 
  node_type: memory
  type: project
  originSessionId: dccc8c8a-f247-4849-a78f-9510c55d16fd
  modified: 2026-09-03T11:16:08.821Z
---

**2026-09-02:** prośba „dostosuj issue 157" przerodziła się w brainstorm układu całej aplikacji.
Spec: `docs/superpowers/specs/2026-09-02-app-shell-and-account-hub-design.md`, status „zatwierdzony
po review" (codex 2x, uwagi wcielone), **w origin/main** (commit 2f1b1d7 „docs: app shell spec",
2026-09-02). Issues ZAŁOŻONE 2026-09-02: epik **#167** „Application shell and account hub"
z dziećmi #168 (CP-89), #169 (CP-90), #170 (CP-91), #171 (CP-92 BE), #172 (CP-93), #174 (CP-95),
#175 (CP-96) i #157 (CP-82, przepisane, przepięte spod #154); **#173 (CP-94 BE ranking szkoły)** pod
epikiem #128. **PR #166 (membership + panel pod subdomeną) ZMERGOWANY 2026-09-02**, więc „stan po #166" = main. **#137 (CP-40) PRZEPISANE 2026-09-02** na ranking szkoły (`/leaderboard`, pozycja „Ranking" w belce),
blocked by #168 i #173; assignee Konrad bez zmian; stara treść w scratchpadzie sesji.

**Decyzje Rafała (wszystkie w specu, tu skrót):** uczeń dostaje belkę globalną + szynę tylko w
kursie (menu boczne globalne ma tylko panel); lista szkół w menu pod avatarem; `/` zostaje
landingiem, centrum konta pod `/account` (zamiast `/student`); centrum = kafle „Twoje szkoły" +
„Odkryj szkoły" na klockach (endpoint katalogu szkół to osobny BE ticket); ranking per szkoła jako
pozycja w belce (Redis ma klucz `leaderboard:tenant:<id>` zapisywany, nigdy nieczytany; `addPoints`
bez wywołań produkcyjnych); szyna kursu tylko przy `hasAccess`; belka zawsze (gość: „Zaloguj się");
obudowa w `layout.tsx` (podejście 1); **TanStack Query wchodzi**, `useApiResource` do wygaszenia;
`lib/query/` (client, keys, invalidation) jako fundament + `docs/query-cache.md`.

**Tickety zaplanowane (CP-89..95, numery wolne wg GitHuba, max CP-85; CP-86-88 zarezerwowane w
hardeningu):** CP-89 fundament → CP-90 centrum, CP-91 szyna kursu, CP-95 porządki (równolegle) →
CP-82 (#157) po CP-90; CP-92 BE katalog szkół, CP-93 podpięcie; CP-94 BE ranking szkoły + przepisany
CP-40. Nowy epik „Application shell and account hub"; #157 przepiąć spod zamkniętego #154.

**Why:** Rafał chce najpierw posprzątać kompozycję (TopBar w 8 miejscach, własny fetch), potem
podstrony usera. Stwierdził, że widoki ucznia nie mają miejsca na nawigację.

**GEOMETRIA BELKI, decyzja Rafała 2026-09-03:** belka ma trzy strefy i **nic nie jest wyśrodkowane**.
Strefa marki o stałej szerokości **240 px** (razem z odstępem) = szerokość szyny zarządzania (`w-60`),
więc marka stoi nad szyną; za nią okruszki (panel) albo nawigacja (szkoła) **dosunięte do lewej**;
po prawej wyszukiwarka i avatar. Stałe 240 px obowiązuje we wszystkich trzech kontekstach, także tam,
gdzie szyny 240 px nie ma. Wcielone w sekcję 3 specu, w #168 i **w Figmie 2026-09-03**: wszystkie 7 wariantów `TopBar`
(963:396) przestawione ze `SPACE_BETWEEN` na `MIN`, marka `FIXED` 200 px (40 px padding + 200 =
240), slot nawigacji/okruszków `FILL` z wyrównaniem `MIN`, tekst marki `maxLines: 1` +
`textTruncation: ENDING`. Apex zostaje na `SPACE_BETWEEN`, bo ma tylko dwa dzieci.

**PODZIAŁ ZMIENIONY 2026-09-03:** Rafał stawia **cały układ** sam (belka, obie szyny, TanStack
Query), zespół dostaje wyłącznie **aktualizacje widoków**. Do CP-89 przeniesione: layout kursu +
`usePublicCourse` + `CourseRail` (z CP-91) oraz szyna konta + pełne `UserMenu` (z CP-90); CP-82
zależy już tylko od CP-89. CP-89 zostawia świadomy dług dla CP-91: podwójne pobranie kursu,
`CoursesProvider` bez filtrów, `progress-bar.tsx` z jednym konsumentem. Sekcja 5 specu poprawiona
w drzewie roboczym (niezacommitowana), sekcje 1-4 bez zmian. Szczegóły i nowy epik #178 (CP-99..103
z inwentarza Figmy) w [[github-issue-candidates-2026-08]].

**How to apply:** kolejność wykonania: CP-89 sam → CP-90/91/95/82 równolegle →
CP-93 po CP-90+92 → CP-96 po CP-95 → CP-94 na końcu (pusty do CP-38). Tickety wg
[[feedback-junior-tickets-no-code]]. Companion brainstormu (makiety) w `.superpowers/brainstorm/29992-1788362064/` (gitignored). Zob. [[github-issue-candidates-2026-08]],
[[fe-screen-gaps-2026-08-28]], [[user-tenant-membership-decisions]].
