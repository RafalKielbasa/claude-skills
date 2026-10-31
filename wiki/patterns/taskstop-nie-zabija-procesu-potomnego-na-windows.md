# taskstop-nie-zabija-procesu-potomnego-na-windows

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`TaskStop` na zadaniu tła, które uruchomiło serwer przez `pnpm exec nest start`
(albo dowolny wrapper menedżera pakietów), kończy powłokę zadania, ale proces
`node.exe` żyje dalej i trzyma port. Następny start dostaje `EADDRINUSE` albo —
gorzej — testy trafiają w stary proces, który wygląda na nowy.

## Przyczyna źródłowa
Wrapper (`pnpm exec`) spawnuje serwer jako proces potomny; zatrzymanie zadania
na Windowsie sygnalizuje tylko proces wierzchni, bez zabicia drzewa (brak
odpowiednika `taskkill /T`). Port zwalnia dopiero wyjście `node.exe`, a wynik
`TaskStop` brzmi „Successfully stopped", więc nic nie sugeruje, że coś zostało.

## Dowody
- 2026-09-07, sesja session_01YYxVxgP1QYqdEoh63ozDfs: po `TaskStop b7ulgf0ae`
  (`pnpm exec nest start`) `netstat -ano` pokazał `:3001 LISTENING` przez PID
  8536 (`node.exe`, ten sam PID co w linii startowej Nesta); zabity
  `taskkill //PID 8536 //F //T`. Restart był potrzebny, bo proces trzymał w
  pamięci wygasły refresh token ADC — bez `netstat` „nowe" API byłoby starym
  procesem i test poświadczeń niczego by nie sprawdził. Powtórzone przy
  sprzątaniu: PID 40624 przeżył `TaskStop bl8y8fbfj`.
- 2026-10-20, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny): drugi dowód. Metro (`expo start` przez `pnpm` w `code-busters-mobile`, zadanie tła) przeżyło `TaskStop`; `node.exe` o PID 31248 działał dalej. `Stop-Process -Id 31248` z sesji zablokował klasyfikator trybu auto, więc komenda poszła do Rafała do wklejenia.
- 2026-10-22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny): trzeci dowód, trzecia sesja, i skutki rozlane na dwa dni. Metro PID 31248 z dowodu drugiego (start 20.10 21:12) wciąż trzymało `:8081`, więc `pnpm storybook:dev` Rafała wstało 22.10 na `:8082`, a dev client na telefonie zgłosił `Failed to connect to /192.168.0.190:8082 … ECONNABORTED`. Diagnoza z PowerShella (`Get-NetTCPConnection`, `Win32_Process.CommandLine`, reguły zapory dla `node.exe`, `/status` → `packager-status:running`) wykazała dwa Metro z tego samego repo; `Stop-Process -Id 31248` po „A” Rafała przeszło. Ta sama sesja: `TaskStop` zadania `pnpm storybook:dev --port 8001` zwrócił „Successfully stopped”, a `netstat` pokazał `:8001 LISTENING` przez PID 39596, zabity `Stop-Process` po sprawdzeniu linii poleceń.
- 2026-10-29, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven): `TaskStop` zadania `pnpm --filter @devstock/codebusters start` zakończył wrapper, a `next start` (PID 37588) dalej trzymał :3000 ze starym buildem; `Stop-Process` na nim odrzucił klasyfikator, ubił go Rafał przez `! taskkill //PID 37588 //F`.
- 2026-10-29, sesja 1f1d010e-6776-42d9-8434-75b5bef761bc (id claude.ai niedostępny; saas app, worktree `edu-saas-cp-106-defence-prep`): piąta sesja. `TaskStop` obu zadań (`pnpm --filter @app/api dev`, `pnpm --filter @app/web dev`) zwrócił „Successfully stopped”, a `netstat` pokazał `:3001` przez PID 18220 (`node … apps\api\dist\src\main`, ten sam PID co w linii startowej Nesta) i `:3000` przez PID 36452 (`next`). Linie poleceń i rodziców sprawdziłem przez `Get-CimInstance Win32_Process` (oba z tego worktree), potem `taskkill /PID <rodzic> /T /F` w narzędziu PowerShell na rodzicach (27256 `next dev`, 35792 `cmd.exe` watchera Nesta) zabił całe drzewa. Klasyfikator nie odmówił; Rafał zatwierdził wcześniej „OK” wariant „zatrzymuję oba serwery”.
- 2026-10-31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, worktree W5), dowód potwierdzający przyczynę od drugiej strony: te same serwery uruchomione w zadaniu tła Bash **bez wrappera** (`node -r ./tracer.js node_modules/@keystone-6/core/bin/cli.js dev --no-db-push`, `node node_modules/next/dist/bin/next start -p 3000`) — `TaskStop` za każdym razem zwolnił port (`Get-NetTCPConnection` po 3 s: brak nasłuchu), pięć razy dla CMS i raz dla `next start`. Martwy proces potomny bierze się z wrappera menedżera pakietów, nie z samego `TaskStop`.

## Rozwiązanie
Najpierw zapobiegaj: serwer, który sesja ma potem zatrzymać, uruchamiaj w zadaniu tła jako goły `node <plik startowy>` (zajrzyj w skrypt `dev`/`start` pakietu po ścieżkę binarki), nie przez `pnpm`/`npm`. Po `TaskStop` zadania, które uruchomiło serwer przez wrapper menedżera pakietów
na Windowsie, sprawdź port: `netstat -ano | grep ":<port> .*LISTENING"` i zabij
drzewo `taskkill //PID <pid> //F //T`. Gdy restart ma podnieść nowe
poświadczenia albo konfigurację, przed startem potwierdź, że PID z linii
startowej poprzedniego procesu zniknął — inaczej test sprawdza stary proces.
Gdy zabicie procesu blokuje klasyfikator, podaj użytkownikowi gotową komendę z PID-em i powiedz, który proces i port trzyma.
Przed startem serwera deweloperskiego (Metro, Storybook) sprawdź domyślny port: proces z poprzedniej sesji przesuwa nowy serwer na inny port i psuje połączenie z urządzeniem. Zabijaj tylko po sprawdzeniu `CommandLine` procesu (repo i polecenie), a cudzy serwer — po zgodzie użytkownika.
