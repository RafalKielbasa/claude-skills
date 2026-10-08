# gotowe-na-galezi-roboczej-zgloszone-bez-galezi-integracji

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Na pytanie „czy wszystko zostało zrobione" Claude potwierdza gotowość na podstawie plików w
drzewie roboczym i testów, nie mówiąc, na której gałęzi praca leży i czy jest w gałęzi
domyślnej. Kolejny krok użytkownika (test na produkcji, użycie skilla) zakłada, że praca jest
dostępna — a po przełączeniu drzewa na `main` jej nie ma.

## Przyczyna źródłowa
Odczyt plików i testy mierzą gałąź aktualnie wybraną, a w drzewie współdzielonym z drugą sesją ta
gałąź zmienia się pod rozmową. „Gotowe" bez nazwy gałęzi i bez sprawdzenia scalenia jest
twierdzeniem o stanie, który może przestać obowiązywać przed następną turą.

## Dowody
- 2026-10-05/08, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7: raport z 5.10 „skille po stronie
  repo są gotowe" (pliki `/daily`, hook, `kb-client` 65/65) — wszystko na
  `feature/tor-stacjonarny`. 8.10 drzewo stało na `main` (przełączyła je druga sesja),
  `kb -- pending --json` wypisało tylko „Użycie", `git merge-base --is-ancestor` → gałąź
  niezmergowana (48 przed, 122 za `main`). Lista kroków testu z 5.10 nie miała kroku „merge do
  `main`".
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: reguła zastosowana, skutek i
  tak przyszedł. Przed publikacją kolektora n8n pytanie-bramka nazwało gałąź wprost („`/daily`
  … są tylko na `feature/tor-stacjonarny`, niezmergowane") z rekomendacją „Po merge"; Rafał wybrał
  „Od razu". Pierwsze `/daily 2026-10-08 1000` na `main` → `Unknown skill: daily`, osobny
  `git worktree` gałęzi, a w połowie skilla Rafał przerwał: „merguj tą gałąź". Wniosek: przy
  „przełączeniu toru" merge powinien być krokiem planu przełączenia, nie osobną rekomendacją.

## Rozwiązanie
Raport kompletności zawsze podaje gałąź, na której leży praca, i wynik
`git merge-base --is-ancestor <gałąź> <domyślna>`. Gdy praca nie jest w gałęzi domyślnej, lista
kroków dla użytkownika zaczyna się od merge'u albo od wskazania gałęzi, z której trzeba testować.
