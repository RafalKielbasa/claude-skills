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

## Rozwiązanie
`action: update` tylko wtedy, gdy `similar_to` jest wpisem spotkania (prefiks `planning/`) i to
ten sam temat; trafienie w `knowledge-base/*.md` albo w wpis o innym temacie → `action: new` z
komentarzem nad blokiem (`similar_to`, `distance`), żeby ślad został. Przy bramce każdy `update`
wypisać osobno z tym, co zostanie nadpisane. Pomiary z tego dnia (0,21–0,24 dla „powiązane, inne")
wziąć do kalibracji w Task 10.
