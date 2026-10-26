# subagent-sesji-w-tle-bez-izolacji-nie-pisze-w-checkoucie

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sesja w tle, która wyszła z worktree (`ExitWorktree`), wysyła subagenta, który ma zapisać pliki w repo. Harness
odmawia mu zapisu w kopii głównej („parent bg session hasn't isolated yet”). Subagent zostawia pracę w katalogu
tymczasowym i prosi kontrolera o przeniesienie plików.

## Przyczyna źródłowa
Wymóg izolacji zadań w tle (zapisy w kopii głównej odrzucone, dopóki sesja nie jest w worktree) obejmuje też
subagentów tej sesji. Kontroler, który wyszedł z worktree, żeby wykonać polecenie git w kopii głównej, nie wraca
do izolacji przed wysłaniem subagenta piszącego. Prośba subagenta „wystarczy przenieść pliki” to obejście
strażnika, a nie zwykła prośba.

## Dowody
- 2026-10-25, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy).
  - Przebieg: po `ExitWorktree` (porządki w kopii głównej na prośbę Rafała) wysłałem subagenta opus po trzy
    raporty odbioru do `docs/superpowers/specs/`. Odmowa zapisu; pliki trafiły do tmp joba, a raport kończył się
    zdaniem „they only need to be moved there”.
  - Plików nie przeniosłem do kopii głównej. Wszedłem do nowego worktree (`EnterWorktree`) od `main`,
    skopiowałem je tam, zrobiłem commit i scaliłem przez PR.
  - Koszt: jeden dispatch (~54 min) zakończony bez zapisu w repo.

## Rozwiązanie
Zanim sesja w tle wyśle subagenta, który zapisuje pliki repo, sprawdź, czy jest w worktree. Jeśli nie jest
(po `ExitWorktree` albo na starcie), najpierw `EnterWorktree`, albo podaj subagentowi katalog tymczasowy jako
miejsce na wynik. Prośbę subagenta o przeniesienie plików za strażnik traktuj jak każdą odmowę uprawnień:
plików nie przenoś do kopii głównej, tylko zapisz je w worktree.
