---
name: baza-wiedzy-wdrozenie-task-12
description: Baza wiedzy wektorowa jest WDROŻONA i żyje na prodzie; odzysk legacy Notion zakończony 2026-07-23 (zero legacy). Od tego czasu baza rośnie z dwóch źródeł: repo (entry_id = ścieżka pliku) i aplikacji agentowej (entry_id = cuid, source=app, jednozdaniowe Decyzja/Ustalenie ze spotkań). Stan 2026-09-01: dev 588, marketing 222, product 121, company 28, sales 22, other 3, interns bez tabeli.
metadata: 
  node_type: memory
  type: project
  originSessionId: 646f7f86-1959-461c-91e0-c29028a59d7f
  modified: 2026-07-23T14:27:12.108Z
---

System łączenia Claude Code z wektorową bazą wiedzy (pgvector przez webhooki n8n)
jest **wdrożony i działa na prodzie** (`n8n-devstock.fly.dev`): `tools/kb-client`
(CLI), skill `baza-wiedzy`, workflowy `33_kb_ask` / `35_kb_admin` / `26_index_...`
v2. Wdrożenie Task 12 (import na prod + smoke) zrobione 2026-07-22.

Tego samego dnia dołożona **operacja `export`** (wierny zrzut chunków bez
embeddingów): akcja `export` w `35_kb_admin` (commit `60f8ab9` w repo
devstock-team-agent, branch `feat/01-split-classifier`) + komenda
`kb export --category <kat> [--out plik]` w kb-client. Design/plan:
`docs/superpowers/specs/2026-07-22-kb-export-odzysk-dev-design.md`,
`docs/superpowers/plans/2026-07-22-kb-export-odzysk-dev.md`.

**Odzysk kategorii `dev`** (2026-07-22): dev było w całości `(legacy)` z ery
Notion (131 chunków, bez `entry_id`). Wyeksportowane, zrekonstruowane i
wzbogacone → `knowledge-base/dev/` (44 pliki: `codebusters-v2/` odzyskane ze
zszytych chunków, `saas-app/` i `system-wieloagentowy/` skopiowane z projektów,
`notatki-spotkania.md`). Purge legacy + upsert 44 plików → dev = 484 chunki, zero
legacy, `entry_id` = ścieżki repo.

**Why:** Repo „Baza wiedzy" jest źródłem prawdy treści; dev było nieadresowalnym
blobem Notion, teraz to czyste, wersjonowane dokumenty projektowe.
**How to apply:**
- Kolumna treści w tabelach `{kat}_vector_db` to `text`; embedding to `embedding`;
  metadane w `metadata` (jsonb, klucz `entry_id`). Legacy = brak `entry_id`.
- **Purge (`delete --category X --yes`) blokuje auto-klasyfikator Claude Code** —
  Rafał musi odpalić go sam, np. `! npm --prefix "<...>/tools/kb-client" run kb --
  delete --category X --yes`. Przed purge zawsze pokaż `list`/`stats`.
- `.env` kb-client: `KB_BASE_URL` BEZ `/webhook` (klient sam dokleja).
- Pozostałe kategorie (`product`, `sales`, `company`, `other`) też mają wpisy
  legacy z Notion — ten sam mechanizm `export` → rekonstrukcja → re-indeks można
  powtórzyć osobno. Powiązane: [[kurs-agenty-ai-zakres]].

**Marketing — ZREINDEKSOWANE (2026-07-23):** odzysk `marketing` zakończony.
Purge 220 legacy → upsert 7 plików z `knowledge-base/marketing/` = **195 chunków,
7 wpisów z `entry_id`, zero legacy**. Przed reindeksem przegląd Rafała + cleanup
(commit `9fe267d`): zabłąkany chunk „2.4 Istniejący plan" przeniesiony z
`12-agencja-meta-ads.md` do `analiza-konkurencji-kodozercy.md` §2.4; wycięte puste
sekcje-zaślepki (Kampanie/Profile/Obserwacje), „Sentyment społeczności" →
odsyłacz do `11-analiza-chatu-kantyny.md`. RAG zweryfikowany (`ask`).
Skrypty rekonstrukcji z sesji odzysku: `reconstruct.js` + `clean-notes.js`
(przyjmują SRC + OUT jako argumenty). Export źródłowy: `planning/marketing-legacy-export.json`.

**Product — ZREINDEKSOWANE (2026-07-23):** odzysk `product` zakończony.
140 legacy było mieszanką: 64 chunki `text/markdown` (3 dokumenty 02/03/04) +
76 `text/plain` (fact-listy ze spotkań, okno przesuwne). `reconstruct.js` zszył md,
`clean-notes.js` rozbroił fact-listy (76→99 unikalnych statementów). Cleanup:
dokończony urwany chunk Lekcji 6 w `04`, usunięta sierota w `03`, wycięte puste
zaślepki, scalony duplikat. Purge → upsert 4 plików `knowledge-base/product/`
(02/03/04 + notatki-spotkania) = **91 chunków, 4 wpisy, zero legacy** (commit
`e1b40b3`). RAG zweryfikowany. Export: `planning/product-legacy-export.json`.

**Company — ZREINDEKSOWANE (2026-07-23):** 49 legacy = 7 md (1 dok „01 - Zespół
i ludzie") + 42 fact-listy → 50 uniq. Cleanup: puste linie przed tabelami w `01`,
wycięty klaster parafraz-duplikatów w notatkach (clean-notes.js nie łapie parafraz,
tylko dokładne podciągi — sprawdzaj ręcznie). Purge → upsert 2 plików
`knowledge-base/company/` = **18 chunków, 2 wpisy, zero legacy** (commit `607e1b8`).
UWAGA: pierwszy purge Rafała nie zadziałał (stats bez zmian) — trzeba było powtórzyć;
zawsze re-sprawdzaj `stats` po purge. RAG: dane OK, ale agent bywa słaby na złożonych
pytaniach (compound query pominął Mateusza; wprost — wyciągnął) — to retrieval agenta,
nie defekt danych. Export: `planning/company-legacy-export.json`.

**Sales + Other — ZREINDEKSOWANE (2026-07-23):** obie w 100% `text/plain`
(brak dokumentów, same fact-listy). `clean-notes.js`: sales 36→32 uniq → 8 chunków
(`knowledge-base/sales/notatki-sprzedaz.md`: ceny, wyniki kampanii, KPI, lejek);
other 4→5 uniq → 3 chunki (`knowledge-base/other/notatki-inne.md`: strategia,
ocena praktykantów). RAG zweryfikowany (sales — liczby kampanii wyciągnięte co do zł).
Commit `82c08b4` (patrz niżej: git). Exporty: `planning/{sales,other}-legacy-export.json`.

**ODZYSK LEGACY NOTION — ZAKOŃCZONY (2026-07-23).** Wszystkie 6 kategorii czyste,
zero legacy w całej bazie: `dev` (484), `marketing` (195), `product` (91),
`company` (18), `sales` (8), `other` (3). Każda ma `entry_id` = ścieżki repo
(`knowledge-base/{kat}/`). Wzorzec na przyszłość (nowe legacy / re-indeks):
export → `analyze-product.mjs` (md vs plain) → `reconstruct.js` (zszycie md) +
`clean-notes.js` (fact-listy) → przegląd/cleanup → **purge (Rafał, re-sprawdź stats!)**
→ upsert → `ask`. Skrypty: `d3e647cf.../scratchpad/{reconstruct,clean-notes}.js`,
`99a239aa.../scratchpad/analyze-product.mjs`.

**GIT:** commity KB `9fe267d` (marketing), `e1b40b3` (product), `607e1b8` (company)
są na `main`. Sales+other (`82c08b4`) wylądował na cudzej gałęzi
`feat/przerwy-miedzy-segmentami` (TTS, druga sesja przełączyła branch w tym samym
working tree). **Decyzja Rafała (2026-07-23): zostawić** — wjedzie na `main` przy
merge gałęzi TTS. Nie cherry-pickować, nie ruszać gita.

**STAN NA 2026-09-01 (odświeżenie po dosypaniu wpisów przez Rafała).** `stats`:
dev 588, marketing 222, product 121, company 28, sales 22, other 3, `interns` —
„brak tabeli" (kategoria jest w `src/categories.js` klienta, tabela
`interns_vector_db` nie istnieje). Liczby z odzysku legacy (dev 484 itd.) to
baseline z 2026-07-23, nie stan bieżący.

**Dwa źródła wpisów — rozpoznajesz po `metadata`:**
- `source: "repo"`, `entry_id` = ścieżka pliku (`knowledge-base/dev/kb-client.md`,
  `planning/2026-08-17-notatka/...`) — upsert z tego repo przez `kb-client`,
  wielochunkowe, ponowny zapis podmienia wektory.
- `source: "app"`, `entry_id` = cuid (`cmti86yuo0001l104xpsys8rr`) — jednochunkowe,
  jednozdaniowe fakty ze spotkań w formie „Decyzja: …" / „Ustalenie: …", wrzucane
  przez aplikację agentową, nie przez to repo. **Nie da się ich zaadresować po
  ścieżce** — żeby zobaczyć treść, użyj `export --category <kat>` i filtruj po
  `metadata.updated_at`; `list` pokaże tylko nieczytelne cuidy.

**Why:** `list` z samymi cuidami wygląda jak śmieci albo legacy — a to świeże,
wartościowe fakty ze spotkań; bez `export` nie zobaczysz, co w nich jest.
**How to apply:** po „dodałem nowe zapisy" → `stats`, potem `export` kategorii i
filtr po `updated_at` (nie `list`). Powiązane: [[spotkanie-skill-odroczone-poprawki]].

**MIGRACJA FAKTÓW `app` → repo (2026-09-01).** 22 fakty z 2026-08-20…09-01
przeniesione do `knowledge-base/{company,marketing,product,sales}/notatki-spotkania.md`
(sales: `notatki-sprzedaz.md`) jako datowana sekcja „Ustalenia ze spotkań —
sierpień/wrzesień 2026" na końcu pliku; 2 fakty o identyfikacji wizualnej pokrył
`product/identyfikacja-wizualna-agenci-ai.md`. Po upsercie skasowane wszystkie 22
wektory `source=app` (stats spadły dokładnie o 22). **Zostaje 58 starszych wpisów
`source=app`: 38 z 2026-08-12 i 20 z 2026-08-19** — ta sama klasa, nieprzeniesione.

**UWAGA — `/knowledge-base-update` NIE migruje faktów ze spotkań.** Skill skanuje
repozytoria i opisuje dryf kodu/assetów (kierunek kod → dokumentacja). Podanie mu
wyciągu faktów jako wejścia nic nie da — przebieg 2026-09-01 (commit `2fd03fa`)
zaktualizował docs dev/product i nie tknął ani jednego ustalenia ze spotkania.
Skill jest `disable-model-invocation` — Claude nie odpali go sam, musi Rafał.
**How to apply:** przeniesienie faktów to zwykła edycja plików notatek + `upsert`
+ `delete --entry-id` po cuidach, nie zadanie dla tego skilla. Przed kasowaniem
zawsze sprawdź, czy każdy fakt ma bliźniaka w chunku `source=repo` (dosłowne
porównanie tekstu po normalizacji białych znaków).

**PRZEBUDOWA KNOWLEDGE-BASE (2026-09-02).** Przegląd 6 notatek-śmietników (315
pozycji) sześcioma agentami read-only, potem naniesienie zmian przeze mnie
seryjnie. Notatki skurczyły się o ~60% (np. product 114→~70, sales 49→27),
a treść rozeszła się do **12 nowych dokumentów**: `sales/{cennik-i-drabinka-promocyjna,
historia-kampanii-platnych}.md`, `company/{02-problemy-i-diagnoza-firmy,
03-proces-pracy-i-spotkania}.md`, `product/{python-jako-kierunek,
akademia-2-0-ai-engineering,backlog-pomyslow-produktowych}.md`,
`dev/codebusters-v2/{backlog-ux-platformy.md,dziennik/}`,
`dev/projektowanie-widokow-komponenty-tokeny-ai.md`,
`marketing/{kanal-youtube-i-content-organiczny,zasady-komunikacji-i-pozycjonowania}.md`.

**Skasowane pliki:** `marketing/analiza-konkurencji-kodozercy.md` (369 l.) — był
zawarty w `context-pack-kamizelich-i-strategia-oferty-2026-07.md` (388 l.),
identyczny tytuł, 12 różniących się linii; wektory (34 chunki) też skasowane.
`knowledge-base/dokumentacja/praktyki/` — bajtowo identyczna kopia
`knowledge-base/praktyki/`; został ten drugi.

**Decyzje Rafała 2026-09-02, obowiązujące:** live 17.09 (nie 22.09 — poprawione
w 9 miejscach raportu); estymacja **2h/4h/8h/16h** (agent zadaniowy w
devstock-team-agent nadal ma `size/S|M|L|XL` — DO ZMIANY); Misja AI **147 zł /
87 zł po quizie**; kurs n8n 2.0 **zrealizowany w całości** (otwarte: bardziej
atomowy podział lekcji). **Kurs Agenty AI NIE jest skończony** — 2026-09-01 Rafał
powiedział, że treść jest gotowa, 2026-09-02 skorygował: gotowa jest jedna
lekcja, reszta zawartości do poprawy. Pliki `lekcja.yaml` są bardziej
optymistyczne niż stan faktyczny (5 × zatwierdzona) — nie ufaj im jako mierze
postępu i nie wpisuj do bazy stanu kursu bez potwierdzenia; przy sporze „ustalenie ze
spotkania vs pomiar z raportu" **wygrywa pomiar**; `other/` zostaje jako worek.

**Why:** RAG podawał przedtem trzy błędy w jednym zdaniu o stacku (PostgreSQL
zamiast MariaDB, GlueStack jako biblioteka UI, jedno monorepo) i „produkcja
trwa" o zakończonym kursie. Po przeindeksowaniu (26 upsertów) smoke test `ask`
odpowiada poprawnie.
**How to apply:** `praktyki/` NIE jest indeksowane — kategoria `interns` nadal
nie ma tabeli, więc treść przeniesiona do zasad praktyk nie trafia do RAG.
Wpisy `planning/2026-08-17-notatka/…` to **sekcje** pliku
`planning/2026-08-17-notatka.md` (skill `/spotkanie`), nie sieroty — nie kasuj
ich przy sprzątaniu po ścieżkach.

**PORZĄDKI W KATALOGACH (2026-09-02).** `knowledge-base/` zawiera odtąd
**wyłącznie wiedzę o firmie** — 6 kategorii plus `praktyki/`. Wyprowadzone:

- `materialy-dydaktyczne/` (467 eksportów z Notion) → `kursy/_zrodla-notion/`
- `materialy-zrodlowe/` (wsad dla `/kurs-nowy`) → `kursy/_zrodla/`
- `legacy-data/` (6 zrzutów JSON z odzysku) → **usunięte**, historia w gicie
- `projekty-research/` → `archiwum/projekty-research/` — projekt „Pieczęć"
  (escrow/trust dla aut używanych, pitch do Poczta Polska Finanse), którego
  Rafał nie rozpoznaje i którego nazwa nie pada nigdzie indziej w repo

**Why:** żaden z tych katalogów nigdy nie był indeksowany, a mieszały produkt
(treść kursów) z wiedzą organizacyjną — dokładnie defekt zdiagnozowany 25.08.
**How to apply:**
- Podkreślnik w `kursy/` (`_wspolne`, `_zrodla`, `_zrodla-notion`) = katalog
  pomijany przez skille kursowe; nie ma tam `kurs.yaml` ani `lekcja.yaml`.
- `tools/notion-import` NIE ma zaszytej ścieżki — `src/cli.js:67` pyta o nią
  interaktywnie; trafienie w `tests/sync.test.js:95` to atrapa `repo-root`.
- Poprawione odwołania: `.claude/skills/kurs-nowy/SKILL.md` (2×, jedno było
  błędne już wcześniej — wskazywało Agendę w `materialy-dydaktyczne`, a leżała
  w `materialy-zrodlowe`), `kursy/agenty-ai/zrodla.md` (2×).
- Zostawione świadomie: odwołania w `docs/superpowers/` i `planning/` — to
  zapisy historyczne, mają opisywać stan z chwili powstania.
