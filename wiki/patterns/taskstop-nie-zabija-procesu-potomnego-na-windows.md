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

## Rozwiązanie
Po `TaskStop` zadania, które uruchomiło serwer przez wrapper menedżera pakietów
na Windowsie, sprawdź port: `netstat -ano | grep ":<port> .*LISTENING"` i zabij
drzewo `taskkill //PID <pid> //F //T`. Gdy restart ma podnieść nowe
poświadczenia albo konfigurację, przed startem potwierdź, że PID z linii
startowej poprzedniego procesu zniknął — inaczej test sprawdza stary proces.
