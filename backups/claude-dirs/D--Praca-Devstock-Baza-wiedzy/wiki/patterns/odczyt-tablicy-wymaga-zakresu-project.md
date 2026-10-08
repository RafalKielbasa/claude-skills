# odczyt-tablicy-wymaga-zakresu-project

- **Skill:** daily, spotkanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Deduplikacja zadań w kroku 6 czyta tablicę (project 3 w `devstock-org`) przez `gh project
item-list`, a wykonanie dodaje issue do Backlogu. Token `gh` po zwykłym `gh auth login` nie ma
zakresów `read:project`/`project`, więc odczyt pada (`your authentication token is missing required
scopes [read:project]`). Rafał „odnowił token", ale zakresy się nie zmieniły — odnowił inne
poświadczenie.

## Przyczyna źródłowa
`gh` trzyma własny token OAuth (`gho_…`) w Menedżerze poświadczeń Windows (`gh:github.com:<login>`),
a zakresy dokłada mu tylko `gh auth refresh -s …`. Odnowienie PAT w ustawieniach GitHuba albo
poświadczenia git (`git:https://github.com`) go nie dotyka. Ani skill, ani
`docs/ticket-conventions.md` nie wymieniają tego wymagania wstępnego.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: pierwszy realny `/daily`;
  kolejka zadań poszła trybem awaryjnym (`action: new`, komentarz w `zadania.yaml`). Po „odnowiłem
  token" `gh auth status` dalej: `Token scopes: 'gist', 'read:org', 'repo', 'workflow'`; dopiero
  `! gh auth refresh -h github.com -s read:project,project` dodał `project`. Potem odczyt tablicy
  (312 pozycji) i utworzenie DT-1 (#556) w Backlogu przeszły.

## Rozwiązanie
Na początku kroku 6 sprawdzić `gh auth status` i szukać `project` w `Token scopes`; brak →
powiedzieć od razu, z dokładną komendą `! gh auth refresh -h github.com -s read:project,project`
(device flow w przeglądarce) i informacją, że PAT w ustawieniach GitHuba nie pomoże. Dopisać to
wymaganie do „Parameters" w `docs/ticket-conventions.md`.
