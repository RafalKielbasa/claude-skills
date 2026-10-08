# stare-repo-przyjmuje-pushe-po-migracji

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Po `push --mirror` do nowego repo stare zostaje zapisywalne do czasu archiwizacji, a cudze klony
wciąż pushują pod jego adres. Praca wypchnięta w tym oknie istnieje tylko w starym repo, a
porównanie gałęzi obu repo pokazuje „identyczne", jeśli ktoś gałąź utworzył i skasował.

## Przyczyna źródłowa
Plan migracji ustawił archiwizację na koniec, bo transfer issues wymaga zapisu w obu repo —
okno trwało godzinami. Nikt poza sesją nie wie o migracji, więc klony innych osób nie mają
powodu zmienić `origin`, a GitHub przyjmuje push bez ostrzeżenia. Weryfikacja przez
`git ls-remote --heads` widzi tylko stan końcowy, nie zdarzenia.

## Dowody
- 2026-10-07/08, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7: mirror o 20:24, zmiana nazwy,
  archiwizacja odłożona „po issues". O 22:20 Grzegorz (`elstyropiano`) utworzył w starym repo
  `skill/przygotuj-glos` (`1b486d0f`, 15 plików, +2752 linie) i o 22:23 ją skasował. `ls-remote`
  obu repo + `diff` → `IDENTICAL`. Zdarzenia pokazało dopiero `gh api
  repos/<stare>/activity` (`branch_creation`, `branch_deletion`); commit nie istnieje w nowym
  repo (`422 No commit found`).

## Rozwiązanie
Wszystko, co wymaga zapisu w starym repo (transfer i zamykanie issues, PR-y), zrób PRZED
mirrorem; archiwizuj zaraz po mirrorze i zmianie nazwy, w tej samej turze. Weryfikację migracji
opieraj na `gh api repos/<stare>/activity` od znacznika czasu mirrora, nie na porównaniu gałęzi,
i raportuj każde zdarzenie po mirrorze z autorem i SHA.
