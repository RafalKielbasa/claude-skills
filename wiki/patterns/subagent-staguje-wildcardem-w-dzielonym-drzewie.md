# subagent-staguje-wildcardem-w-dzielonym-drzewie

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis

Dispatchowany implementer kończy zadanie przez `git add -A` (albo `git commit -a`) i wciąga do swojego commita pliki, których nie tknął - pracę równoległej sesji Claude albo użytkownika, powstałą w drzewie w trakcie jego przebiegu. Commit ma poprawną treść zadania i myślący temat, a w środku niesie cudzą, niezwiązaną zmianę. Objawem bywa też sytuacja odwrotna: to cudza sesja robi zamiatający commit i połyka w nim gotową pracę implementera.

## Przyczyna źródłowa

Implementer rozumuje o drzewie roboczym tak, jakby był w nim sam - bo jego brief opisuje tylko jego własne pliki, a `git add -A` jest najkrótszą drogą do „zacommituj to, co zrobiłem". Założenie „wszystko, co brudne, jest moje" jest prawdziwe w izolowanym worktree i fałszywe w drzewie dzielonym; nic w domyślnym prompcie implementera tego nie odróżnia. Okno jest szerokie, bo między pierwszą edycją a commitem mija cały przebieg zadania, a druga sesja pisze w tym czasie w zupełnie innym katalogu repo, więc konfliktu plików nie ma - jest tylko konflikt **zakresu commita**, którego git nie zgłasza.

Naprawa po fakcie jest droga nieproporcjonalnie do szkody: wymaga `rebase -i` albo `reset`, czyli operacji na historii, na której zdążyła już stanąć inna sesja.

## Dowody

- 2026-09-22, sesja session_01FoJzsTt4AksGtALq4JXv7T, repo „Baza wiedzy", plan `cheat-sheet-in-konspekt`: commit Task 1 `f709277` obok czterech plików `tools/course-pipeline/` zawiera `quiz.json`, `cwiczenia/dopasowanie-01-…json` i przestawiony `status.zadania` w `lekcja.yaml` lekcji 3.1 - wygenerowane przez równoległą sesję między czystym `git status` o 15:42 a commitem o 15:47. Implementer nie wspomniał o nich w raporcie; wykryło je review zadania, czytając listę plików w diffie. Kontroler mierzył czystość drzewa przed dispatchem i uznał to za wystarczające - nie było.
- 2026-09-22, ta sama sesja, przypadek odwrotny: zbatchowane zadania 6+7+8 zostały zacommitowane **nie przez swojego implementera**, tylko przez równoległą sesję, commitem `eb84cc3` „agents:skill update", który zamiótł sześć gotowych plików bloku plus jedną cudzą linię. Implementer zgłosił to jako `DONE_WITH_CONCERNS` z własnej inicjatywy („I did NOT create this commit myself"). Pokazuje, że sama dyscyplina stagowania po stronie implementera nie wystarcza - drugi kierunek zamiatania jest poza jego kontrolą.
- 2026-09-22, ta sama sesja, skutek uboczny tej samej przyczyny: po wprowadzeniu reguły „staguj po nazwie" żaden z pięciu kolejnych commitów (`a36c5aa`, `1570d00`, `50f3aa3`, `0138cd4`, `faa7340`, `95e1a15`, `5d83ec1`) nie zawierał cudzego pliku, mimo że druga sesja pisała przez cały czas. Reguła działa i kosztuje jedną linię promptu.

## Rozwiązanie

Do szablonu dispatchu implementera (i do fix-rounds) wchodzi stała klauzula, gdy praca idzie w drzewie nieizolowanym:

> Staguj wyłącznie własne pliki, po nazwie: `git add <ścieżka> <ścieżka>`. Nigdy `git add -A`, `git add .` ani `git commit -a`. Bezpośrednio przed commitem uruchom `git status --short` i potwierdź, że wszystko, co stagujesz, jest Twoje; jeśli widzisz pliki spoza swojego zadania, zostaw je. Po commicie uruchom `git show --stat --oneline HEAD` i sprawdź, że commit zawiera dokładnie Twoje pliki - jeśli zawiera coś jeszcze, zgłoś to, nie naprawiaj sam.

Kontroler dokłada do dispatchu **listę konkretnych ścieżek, które w tej chwili są brudne i nie należą do zadania** - implementer nie ma jak ich odróżnić samodzielnie. Sam kontroler nie traktuje czystego `git status` przed dispatchem jako gwarancji: liczy się stan w momencie commita, nie w momencie startu. Radykalniejszy wariant, gdy druga sesja jest aktywna: izolowany worktree (`superpowers:using-git-worktrees`), który znosi całą klasę problemu kosztem osobnego `npm install`.
