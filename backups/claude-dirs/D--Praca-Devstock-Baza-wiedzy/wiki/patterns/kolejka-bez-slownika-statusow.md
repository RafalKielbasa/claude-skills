# kolejka-bez-slownika-statusow

- **Skill:** daily (kontrakt `docs/spotkania-kolejki.md`, wspólny ze `spotkanie`)
- **Typ:** porażka
- **Status:** otwarty

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

## Rozwiązanie
Generując kolejki, dopisać na górze każdego pliku komentarz ze słownikiem: `# status: proposed |
approved | rejected (indexed/created/commented wpisuje wykonanie)`. W kroku 8 status spoza słownika
→ jedno pytanie z interpretacją („`accepted` czytam jako `approved`") zamiast cichego pominięcia
albo zgadywania; pliki kolejki czytać zawsze parserem YAML.
