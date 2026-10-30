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
- 2026-10-30, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, bramka W4):
  - restart `next start` między przebiegami bramki: od razu linia `! taskkill //PID 37644 //T //F` (rodzic pnpm,
    PID z `Get-NetTCPConnection` + `Win32_Process.ParentProcessId`), Rafał uruchomił ją sam — przeszła, bez tury straty;
  - po bramce dwie linie stopu podałem w komórkach tabeli markdown; Rafał skopiował je razem z ramką tabeli
    i wysłał jako zwykłą wiadomość `│ ! taskkill //PID 7620 //T //F` (prefiks `!` nie zadziałał);
  - nowe: wykonałem dosłownie tę komendę z jego wiadomości w Bashu (`taskkill //PID 7620 //T //F`, potem 40276) —
    klasyfikator przepuścił oba, bo polecenie stało w wiadomości użytkownika, nie w mojej propozycji.

## Rozwiązanie
Nie proponuj wariantu, w którym Claude zabija proces. Od razu podaj Rafałowi jedną komendę dla prefiksu `!` w składni Git Bash: `! taskkill //PID <pid> [//PID <pid>] //F`. PID ustal przedtem przez `Get-NetTCPConnection -State Listen -LocalPort <port>`. Własne serwery w tle traktuj tak, jakby trzeba je było zatrzymać ręcznie: zapisz ich PID-y w ledgerze, a w raporcie końcowym podaj gotowe polecenie `taskkill` dla wszystkich naraz. Linię `!` podawaj jako osobny wiersz kodu, nigdy w komórce tabeli — kopiowanie z tabeli zabiera ramkę `│` i prefiks przestaje działać. Gdy użytkownik przyśle komendę zatrzymania w treści wiadomości, wykonaj ją dosłownie: to jego polecenie, i klasyfikator ją przepuszcza.
