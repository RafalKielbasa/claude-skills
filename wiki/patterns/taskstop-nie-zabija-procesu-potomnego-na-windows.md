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

## Rozwiązanie
Po `TaskStop` zadania, które uruchomiło serwer przez wrapper menedżera pakietów
na Windowsie, sprawdź port: `netstat -ano | grep ":<port> .*LISTENING"` i zabij
drzewo `taskkill //PID <pid> //F //T`. Gdy restart ma podnieść nowe
poświadczenia albo konfigurację, przed startem potwierdź, że PID z linii
startowej poprzedniego procesu zniknął — inaczej test sprawdza stary proces.
Gdy zabicie procesu blokuje klasyfikator, podaj użytkownikowi gotową komendę z PID-em i powiedz, który proces i port trzyma.
Przed startem serwera deweloperskiego (Metro, Storybook) sprawdź domyślny port: proces z poprzedniej sesji przesuwa nowy serwer na inny port i psuje połączenie z urządzeniem. Zabijaj tylko po sprawdzeniu `CommandLine` procesu (repo i polecenie), a cudzy serwer — po zgodzie użytkownika.
