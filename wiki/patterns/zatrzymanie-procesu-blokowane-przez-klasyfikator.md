# zatrzymanie-procesu-blokowane-przez-klasyfikator

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude proponuje wariant „zatrzymam proces sam”, Rafał go wybiera, a `Stop-Process` zostaje odrzucony przez klasyfikator trybu auto. Dotyczy to zarówno procesu Rafała, jak i osieroconego serwera uruchomionego przez samą sesję. Wybór wariantu nic nie daje, a każda odmowa kosztuje turę z dodatkową prośbą do Rafała.

## Przyczyna źródłowa
Klasyfikator traktuje zabicie procesu jako ingerencję w działające obciążenia („[Interfere With Workloads]”, raz bez wyjaśnienia). Nie widzi zgody wyrażonej w rozmowie ani tego, kto proces uruchomił. Zgoda z rozmowy nie jest regułą uprawnień, więc wariant „zatrzymam sam” jest niewykonalny, zanim Rafał go wybierze.

## Dowody
- 2026-10-28/29, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (code-busters-v2, bramka W3):
  - `Stop-Process -Id 28640,23724` na `next dev` z głównego checkoutu, po jawnym „A” Rafała na wariant „zatrzymuję sam”, odrzucony „[Interfere With Workloads]”;
  - `Stop-Process -Id 37588` na własnym osieroconym `next start` odrzucony bez wyjaśnienia;
  - oba procesy ubił Rafał przez `! taskkill //PID … //F`.

## Rozwiązanie
Nie proponuj wariantu, w którym Claude zabija proces. Od razu podaj Rafałowi jedną komendę dla prefiksu `!` w składni Git Bash: `! taskkill //PID <pid> [//PID <pid>] //F`. PID ustal przedtem przez `Get-NetTCPConnection -State Listen -LocalPort <port>`. Własne serwery w tle traktuj tak, jakby trzeba je było zatrzymać ręcznie: zapisz ich PID-y w ledgerze, a w raporcie końcowym podaj gotowe polecenie `taskkill` dla wszystkich naraz.
