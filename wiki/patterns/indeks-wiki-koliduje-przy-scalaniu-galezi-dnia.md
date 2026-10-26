# indeks-wiki-koliduje-przy-scalaniu-galezi-dnia

- **Skill:** podsumuj-sesja-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dwie gałęzie dnia, na których różne sesje dopisały dowody do tych samych wzorców repo, kolidują przy scalaniu
w `.claude/wiki/index.md`, bo każda zmienia tę samą linię wzorca. Kolidują też w `log.md`, bo każda dopisuje
wpis na tym samym końcu pliku. Konflikt trafia do osoby albo sesji scalającej, która nie wie, która wersja jest
nowsza.

## Przyczyna źródłowa
Indeks ma jedną linię na wzorzec z opisem i licznikiem dowodów, a skill każe przepisać go w całości. Dwie gałęzie
od tej samej bazy zmieniają tę samą linię inaczej (każda dopisuje swój dowód i podbija licznik), a log rośnie
od tego samego miejsca. Pokrewne: `indeks-projektu-rozjechany-miedzy-galeziami-sesji` (indeks projektu,
project-index).

## Dowody
- 2026-10-25, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy, scalanie
  gałęzi dnia 17-10 i 22-10 z `main`).
  - Scalenie Rafała w kopii głównej stanęło na konflikcie w `index.md` i `log.md`.
  - 17-10 z `main`: trzy linie w `index.md` (`niepewny-fragment-cytowany-zamiast-przypisany` 2 vs 3 dowody,
    `skill-zostawia-commit-rafalowi-po-zmianie-polityki-repo` 6 vs 5, `ui-probe-before-actions-surfaces-scenario-drift`
    3 vs 2) i blok w `log.md` (6 wpisów sesji z gałęzi dnia, 2 z `main`).
  - 22-10 z `main`: dwie linie w `index.md`.
  - Rozwiązane skryptem: przy każdej linii wzorca strona z większą liczbą dowodów, a w logu wpisy obu stron.

## Rozwiązanie
Przy konflikcie scalania w `.claude/wiki/index.md` rozstrzygaj osobno każdą linię wzorca: weź stronę z większą
liczbą dowodów i sprawdź ją z sekcją „Dowody” strony wzorca, która scala się bez konfliktu, bo dowody są
dopisywane w różnych miejscach. W `log.md` zachowaj wpisy sesji z obu stron, najpierw te z gałęzi dnia. Gdy
konflikty wracają przy każdym scaleniu, rozważ w skillu podsumowania aktualizację punktową indeksu zamiast
przepisywania go w całości także bez równoległej sesji.
