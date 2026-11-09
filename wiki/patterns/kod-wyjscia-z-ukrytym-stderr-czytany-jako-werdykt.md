# kod-wyjscia-z-ukrytym-stderr-czytany-jako-werdykt

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Komenda w postaci `cmd >/dev/null 2>&1 && echo OK || echo ZŁE` zamienia kod wyjścia na dwa werdykty. Każdy błąd inny niż ten, o który pytam (nieznana flaga, stara wersja narzędzia, brak pliku), ląduje w gałęzi „ZŁE” bez śladu. Wynik wygląda na merytoryczny.

## Przyczyna źródłowa
Wyciszony stderr usuwa jedyny ślad, że komenda w ogóle nie zadziałała. Mapowanie „kod ≠ 0 = werdykt negatywny” zakłada, że niezerowy kod ma jedno znaczenie. `git merge-tree` zwraca 1 przy konflikcie, a 129 przy błędzie użycia. Flaga z nowszej wersji narzędzia daje błąd użycia na starszej.

## Dowody
- 2026-11-09, sesja 0facbde7-f16e-4ba0-a2f0-b304f63f372a (id claude.ai niedostępny; worktree code-busters, przed PR DT-81).
  - Komenda: `git merge-tree --write-tree --name-only HEAD origin/main >/dev/null 2>&1 && echo "merge-tree: clean" || echo "merge-tree: CONFLICT"`.
  - Wypisała `merge-tree: CONFLICT`, choć w tym samym wywołaniu `behind: 0 ahead: 0`.
  - `git --version` dał 2.35.1.windows.2, a `--write-tree` jest dopiero od 2.38.
  - Sprawdzenie drugą metodą (`git rev-parse` HEAD, origin/main, FETCH_HEAD i `git ls-remote`) pokazało ten sam commit `afbb250f7`, więc konflikt był niemożliwy.
  - Złapałem to przez sprzeczność z drugim faktem, zanim werdykt trafił do raportu.

## Rozwiązanie
Gdy zamieniasz kod wyjścia na werdykt:
- nie wyciszaj stderr;
- rozróżnij kod oczekiwany (np. 1 = konflikt) od pozostałych, które oznaczają, że komenda nie zadziałała;
- przy fladze, której wersji nie znasz, sprawdź `--version`.

Werdykt sprzeczny z innym faktem z tej samej komendy sprawdź drugą metodą, zanim go podasz.

Powiązane: [[potok-z-tail-maskuje-ubity-proces]].
