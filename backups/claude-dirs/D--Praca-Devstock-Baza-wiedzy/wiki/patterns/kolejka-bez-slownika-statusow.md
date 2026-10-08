# kolejka-bez-slownika-statusow

- **Skill:** daily (kontrakt `docs/spotkania-kolejki.md`, wspólny ze `spotkanie`)
- **Typ:** porażka
- **Status:** zaadresowany (2026-10-08, daily)

## Opis
Przy bramce Rafał edytuje `wpisy.yaml` i `zadania.yaml` w edytorze i wpisuje statusy, których
kontrakt nie zna (`accepted` zamiast `approved`) albo zostawia pole puste. Edytor przepisuje przy
okazji cytowanie całego pliku (cudzysłowy → apostrofy), więc skrypt wykonujący, który czyta pola
wyrażeniem regularnym, dostaje inną postać niż ta, którą sam zapisał.

## Przyczyna źródłowa
Dozwolone wartości statusu żyją tylko w `docs/spotkania-kolejki.md`, a plik kolejki pokazuje
jedną wartość (`proposed`) bez listy alternatyw — człowiek wpisuje słowo, które brzmi dobrze.
Krok 8 skilla mówi, co robić z `approved`, ale nie z wartością spoza słownika.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: wszystkie 8 wpisów
  `status: accepted`; w `zadania.yaml` #1 `status:` puste, #2 `proposed`. Po edycji #6 plik
  `wpisy.yaml` miał teksty w apostrofach (`text: '…'`), choć zapisany był w cudzysłowach — ponowny
  upsert czytał go już parserem YAML, nie regexem.
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny): przebudowa bramki na przejście kartami
  (`1ac982cb`, `ea378033`) — statusy wpisuje sama bramka, a `docs/spotkania-kolejki.md` („Resuming")
  uznaje za decyzję tylko `approved`/`rejected`/`indexed`/`created`/`commented`; inna wartość idzie
  jak `proposed`, a karta nazywa zastaną wartość. Test na sucho g1: `status: accepted` i pusty status
  przejęte jako niezdecydowane („Wpis 2/8 … status w pliku: accepted"). Komentarza-słownika na górze
  plików nie dodano — ręczna edycja przestała być główną ścieżką.

## Rozwiązanie
Generując kolejki, dopisać na górze każdego pliku komentarz ze słownikiem: `# status: proposed |
approved | rejected (indexed/created/commented wpisuje wykonanie)`. W kroku 8 status spoza słownika
→ jedno pytanie z interpretacją („`accepted` czytam jako `approved`") zamiast cichego pominięcia
albo zgadywania; pliki kolejki czytać zawsze parserem YAML.
