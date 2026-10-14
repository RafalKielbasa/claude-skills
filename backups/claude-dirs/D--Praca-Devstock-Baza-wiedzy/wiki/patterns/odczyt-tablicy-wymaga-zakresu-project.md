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
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (`/spotkanie`, egzekucja kolejek 13.10):
  token ma już `project` (`Token scopes: 'gist', 'project', 'read:org', 'repo', 'workflow'`), więc
  odczyt tablicy (416 kart) i Backlog przeszły. Nowe zjawisko: projekt 3 sam dodaje nowe issues
  devstock-team do Backlogu. Pierwsze `gh project item-add` zwróciło
  „GraphQL: Content already exists in this project (addProjectV2ItemById)”, choć issue #672 miało
  już status `Backlog`. #673 i #674 dodał `item-add`, bo automat jeszcze nie zdążył, a #675 automat
  dodał przed odczytem (wyścig). W kolejce 13.10 zostało też „dodanie 14 nowych issues do Backlogu NIE wykonane”
  z czasu, gdy tokenowi brakowało zakresu.

## Rozwiązanie
Na początku kroku 6 sprawdzić `gh auth status` i szukać `project` w `Token scopes`; brak →
powiedzieć od razu, z dokładną komendą `! gh auth refresh -h github.com -s read:project,project`
(device flow w przeglądarce) i informacją, że PAT w ustawieniach GitHuba nie pomoże. Dopisać to
wymaganie do „Parameters" w `docs/ticket-conventions.md`.

Uzupełnienie po 2026-10-14: przed `gh project item-add` sprawdź `gh issue view <n> --json
projectItems`. Gdy issue jest już w projekcie (automatyczne dodawanie), tylko ustaw `Status` przez
`item-edit`. Błąd „Content already exists in this project” po utworzeniu issue to nie porażka
egzekucji.
