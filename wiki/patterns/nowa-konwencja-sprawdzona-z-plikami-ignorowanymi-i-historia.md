# nowa-konwencja-sprawdzona-z-plikami-ignorowanymi-i-historia

- **Skill:** superpowers:brainstorming
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: zanim powstała zasada procesu dla repo („codzienny worktree”), Claude
sprawdził dwie rzeczy:
- pliki, których nowe drzewo robocze nie dostanie (ignorowane, a potrzebne do
  pracy);
- historię podobnej konwencji w repo.

Oba odczyty zmieniły projekt, zanim cokolwiek zapisano.

## Przyczyna źródłowa
Prośba o konwencję gita brzmi jak jedna linijka w `CLAUDE.md`. Tymczasem
zasada działa na żywym środowisku:
- `.env` narzędzi, `node_modules` i media kursów są poza gitem;
- narzędzia szukają ich względnie do swojej lokalizacji;
- repo zwykle pamięta, jak zespół robił to wcześniej (nazwy gałęzi, merge
  przez PR).

Bez tych odczytów zasada byłaby poprawna na papierze i psułaby pracę od
pierwszego dnia.

## Dowody
- 2026-10-09, sesja ece85169-32f2-44b7-9695-689c071f34ce (id claude.ai
  niedostępny), repo Baza wiedzy:
  - `git ls-files --others --ignored --exclude-standard` pokazał `.env` w
    `tools/course-pipeline`, `tools/kb-client` i `tools/notion-import`,
    `CLAUDE.local.md` oraz ~300 MB `node_modules`. `du` pokazał media lekcji po
    200–560 MB.
  - Rafał zmienił decyzję z worktree na „Gałąź dnia, bez worktree”.
  - `git log --merges` pokazał, że dawne `rafal-kielbasa/DD-MM-YYYY` szły przez
    PR (#27–#31). Wybór padł na „PR na GitHubie” zamiast lokalnego merge'a, a
    format nazwy przejęto z historii.

## Rozwiązanie
Przy projektowaniu zasady procesu dla repo (gałęzie, worktree, katalogi
robocze) przed pierwszym pytaniem:
1. `git ls-files --others --ignored --exclude-standard`, żeby wiedzieć, co
   nie przejdzie do nowego drzewa;
2. `git branch` i `git log --merges`, żeby zobaczyć istniejącą konwencję
   nazw i scalania;
3. grep po skillach repo pod kątem `git switch`/`push`/`origin/main`.

Wyniki podać przy pytaniach jako fakty, które zmieniają opcje.
