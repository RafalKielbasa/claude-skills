# indeks-projektu-rozjechany-miedzy-galeziami-sesji

- **Skill:** project-index
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dwie sesje tego samego projektu aktualizują jeden plik indeksu na różnych gałęziach repo (gałąź dnia
i gałąź worktree sesji). Każda pisze na wersji ze swojej gałęzi, więc przy scalaniu do `main` indeks
ma kilka konfliktów. Linia „Teraz” obejmuje wszystkie części, a wiersze części i punkty
„Następny krok” sąsiadują ze sobą, więc konflikt powstaje nawet wtedy, gdy każda sesja zmienia tylko
swoją część.

## Przyczyna źródłowa
Skill każe zapisać indeks „w checkoucie, w którym pracujesz” i nie sprawdza, czy inna gałąź ma nowszą
wersję pliku. Sesje równoległe w worktree Bazy wiedzy (`.claude/worktrees/…`) są normą, a indeks jest
z założenia wspólny dla wszystkich części projektu.

## Dowody
- 2026-10-22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny): zamknięcie planu 3
  biblioteki na `rafal-kielbasa/17-10-2026`. Sesja ekranów publicznych (f8d64eed) pięć razy zmieniła
  indeks na `worktree-baza-wiedzy-kodozercy-public-screens` (ostatnio `66a0aba5`). Pierwsza wersja
  moich zmian dała w `git merge-file` 4 konflikty (Teraz, sąsiednie wiersze części, początek
  „Rozstrzygnięte”, „Następny krok”). Wyszło to tylko dzięki `git log --all -- <indeks>`.
  Rozwiązanie: wersja `66a0aba5` plus moje wpisy, czyli nadzbiór, i notka w commicie `98f6e04e`,
  że konflikt rozwiązuje się przez wzięcie tej wersji.

## Rozwiązanie
Przed zapisem indeksu uruchom `git log --all --format='%h %ad %D %s' -- <indeks>`. Gdy inna gałąź ma
nowszy commit tego pliku, zacznij od jej wersji (`git show <sha>:<indeks>`) i nanieś na nią swoje
zmiany, żeby Twoja wersja była nadzbiorem. Sprawdź `git merge-file` (baza = ostatnia wspólna wersja)
i w treści commita napisz, którą wersję brać przy konflikcie.
