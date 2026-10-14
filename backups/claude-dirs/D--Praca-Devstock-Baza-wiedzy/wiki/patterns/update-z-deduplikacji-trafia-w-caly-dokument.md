# update-z-deduplikacji-trafia-w-caly-dokument

- **Skill:** daily (kontrakt `docs/spotkania-kolejki.md`, wspólny ze `spotkanie`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
`kb-client similar` zwraca najbliższe chunki, a kontrakt każe każdy kandydat z `distance <= 0.25`
oznaczyć `action: update` i przy wykonaniu zrobić upsert pod `similar_to`. Gdy trafieniem jest
chunk dokumentu z `knowledge-base/*.md` (jeden `entry_id` = cały plik, wiele chunków), zatwierdzony
`update` zastąpiłby cały dokument jednym akapitem z daily. Gdy trafieniem jest wpis innego
spotkania o innym temacie, `update` skasowałby tamten wpis.

## Przyczyna źródłowa
Kontrakt zakłada, że każdy `entry_id` w bazie to pojedynczy wpis tego samego kształtu co kandydat,
a baza trzyma też dokumenty indeksowane z plików. Do tego próg 0,25 jest tymczasowy (Task 10) i
łapie treści powiązane tematycznie, nie duplikaty. Rafał zatwierdził kolejkę zmianą statusów, nie
ruszając `action` — w edytorze `update` nie wygląda na operację niszczącą.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: 5 z 8 kandydatów dostało
  `update` — 3 na całe dokumenty (`product/notatki-spotkania.md` 0,2259, `marketing/13-seo-i-blog.md`
  0,2059, `product/identyfikacja-wizualna-agenci-ai.md` 0,2247), 2 na wpisy spotkania 2026-08-17 o
  innym temacie (0,2406, 0,2239). Wszystkie 8 oznaczone `accepted` bez zmiany `action`; przy bramce
  wychwycone komentarzem `# UWAGA` w `wpisy.yaml`, Rafał wybrał „zmień na new".
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny): w testach na sucho bramki agenci grający
  `/daily` sami oznaczali wpisy #3, #6, #7 (`similar_to` = `knowledge-base/product/notatki-spotkania.md`,
  `marketing/13-seo-i-blog.md`, `product/identyfikacja-wizualna-agenci-ai.md`) jako ryzyko nadpisania
  dokumentu repo tekstem z daily. Kontrakt deduplikacji bez zmian; nowa karta `update` pokazuje
  dopasowanie i „Akceptuj jako nowy", ale nie ostrzega, że celem jest cały dokument.
- 2026-10-09, daily 11:31 (id sesji niedostępny; ślad w `planning/daily/2026-10-09-1131/wpisy.yaml`):
  5 z 8 kandydatów z trafieniem w progu, w tym 3 na dokumenty repo (`sales/notatki-sprzedaz.md`
  0,1952 i 0,2310, `dev/notatki-spotkania.md` 0,1817) i 1 na wpis z 2026-10-08 o tym samym temacie
  (0,1349). Każdy z komentarzem „Rafał 2026-10-09: zapisać jako new, niczego nie nadpisywać".
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: 10 z 11 kandydatów dostało `update`, w tym
  5 na fragmenty dokumentów repo (`product/notatki-spotkania.md` 0,1604 i 0,1898,
  `product/kodozercy-research-rynku-i-oferty.md` 0,2335, `marketing/13-seo-i-blog.md` 0,2243,
  `dev/system-wieloagentowy/PLAN-ROZWOJU-2026-H2.md` 0,2114). Karty ostrzegały w `SKUTEK`, że
  „Nadpisz istniejący" kasuje cały dokument, a „Akceptuj jako nowy" szło jako opcja rekomendowana.
  Rafał wybrał ją przy wszystkich 10 kartach, także przy dwóch trafieniach w wpis daily o tym samym
  temacie (0,1348 `tempo-subskrypcji`, 0,1405 `przepisanie-platformy`), bo nowy wpis uzupełniał
  stary, a nie go poprawiał. Opcji „Nadpisz istniejący" nie wybrał ani razu w trzech kolejnych dailych.
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (pierwszy raz w `/spotkanie`, offsite
  13.10): 4 z 5 kandydatów dostały `update`, w tym 3 na fragmenty dokumentów repo
  (`product/kodozercy-research-rynku-i-oferty.md` 0,1681, `marketing/live-agenci-ai-mapa-decyzji.md`
  0,1652 — mapa decyzji innego live'a, `product/notatki-spotkania.md` 0,1757) i 1 na wpis daily
  2026-10-12 o innym temacie (0,1739). Kandydaci byli długi, 5–6 tys. znaków, i dawali odległości
  niższe niż krótkie wpisy dailych, mimo że trafienia nie były duplikatami. Rafał wybrał
  „Akceptuj jako nowy” przy wszystkich 4 kartach.

## Rozwiązanie
`action: update` tylko wtedy, gdy `similar_to` jest wpisem spotkania (prefiks `planning/`) i to
ten sam temat; trafienie w `knowledge-base/*.md` albo w wpis o innym temacie → `action: new` z
komentarzem nad blokiem (`similar_to`, `distance`), żeby ślad został. Przy bramce każdy `update`
wypisać osobno z tym, co zostanie nadpisane. Pomiary z tego dnia (0,21–0,24 dla „powiązane, inne")
wziąć do kalibracji w Task 10.

Uzupełnienie po 2026-10-12: wpis z daily to datowana migawka, więc późniejsze spotkanie o tym samym
temacie zwykle dopisuje stan, a nie poprawia poprzedni. Nawet trafienie w wpis spotkania o tym samym
temacie domyślnie idzie jako `new` obok. `update` proponować tylko wtedy, gdy kandydat jawnie
koryguje fakt z tamtego wpisu (inna data, cofnięta decyzja). Karta takiego kandydata ma nazwać
korygowany fakt.
