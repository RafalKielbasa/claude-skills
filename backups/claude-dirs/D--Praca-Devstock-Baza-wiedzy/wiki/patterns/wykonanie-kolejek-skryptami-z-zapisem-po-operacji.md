# wykonanie-kolejek-skryptami-z-zapisem-po-operacji

- **Skill:** daily (krok 8, kontrakt „Execution order” w `docs/spotkania-kolejki.md`)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Bramkę i wykonanie czterech daily w jednej sesji obsłużyły małe skrypty w scratchpadzie, nie ręczne
edycje i pojedyncze komendy:
- `setfield.mjs` zmienia jedno pole w bloku `- id: N`;
- `upsert-one.mjs` robi upsert jednego wpisu i od razu zapisuje `status: indexed`;
- `exec-tasks.mjs` zakłada issue z dodaniem do Backlogu albo dodaje komentarz, a potem zapisuje
  `issue`/`status` w `zadania.yaml` i numer w wierszu notatki.

Wyniki: 25 wpisów zaindeksowanych, 4 issue (DT-75…78), 9 komentarzy. Notatka i tablica zgodne,
żadnego powtórzonego ani zgubionego zapisu.

## Przyczyna źródłowa
Krok 8 wymaga, żeby każdy wynik trafił do kolejki zaraz po operacji, która go dała, i żeby numer
issue był w dwóch miejscach naraz (`zadania.yaml` i wiersz `## Action items`). Ręcznie to kilka
edycji na pozycję, łatwych do pominięcia przy przerwaniu. Skrypt robi operację i zapis w jednym
przebiegu, więc przerwany przebieg wznawia się od pierwszej pozycji bez `indexed`/`created`.
Skrypty żyją tylko w scratchpadzie sesji, więc każda nowa sesja pisze je od zera.

## Dowody
- 2026-10-28/29, sesja claude.ai/code/session_01WryF5UdQSho3p8jEyswqrD (lokalnie
  16c3aefd-ec1a-48b5-b40b-be038c6346a4): daily 23, 26, 27 i 28.10, około 45 decyzji przy bramkach,
  każda zapisana `setfield.mjs` tuż po odpowiedzi. `exec-tasks.mjs` przerywa przebieg, gdy wiersz
  notatki ma już numer issue (`row … already has an issue`), więc powtórne uruchomienie nie
  dubluje komentarza. Mapę wierszy (`rows-<data>.json`, id → dokładny prefiks wiersza) trzeba było
  pisać ręcznie dla każdego daily.
- 2026-11-02, sesja 8567a0be-7558-4543-9745-ad7e88f71207 (id claude.ai niedostępny),
  `/daily 2026-11-02 1200`. Skrypty znów pisane od zera w scratchpadzie, pod innymi nazwami:
  - `run-similar.cjs` (deduplikacja);
  - `run-upsert.cjs`: `spawnSync` bez powłoki i `status: indexed` zaraz po każdym upsercie;
  - `task-bodies.cjs` (body zadań do plików dla `gh`).

  Wynik: 8 wpisów, 2 issue, 2 komentarze, notatka i tablica zgodne. Issue i Backlog szły już
  pojedynczymi komendami `gh`, a numery do notatki dopisywał `Edit`. Druga sesja, w której cała
  mechanika kroku 8 powstała od nowa, bo poprzednie skrypty zginęły ze scratchpadem.

## Rozwiązanie
Przenieść te trzy operacje do repo jako komendy `kb-client` albo `tools/meeting-queue/`:
- `queue set <plik> <id> <pole> <wartość>` (parser YAML zamiast podmiany linii);
- `queue upsert <katalog spotkania> [id…]`;
- `queue exec-tasks <katalog spotkania> [id…]`, z dopasowaniem wiersza notatki po treści zadania
  zamiast ręcznej mapy.

Krok 8 skilla `daily` i `spotkanie` wskazuje te komendy. Wznowienie po przerwaniu to ponowne
uruchomienie tej samej komendy.
