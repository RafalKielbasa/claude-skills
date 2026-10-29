# komenda-do-wklejenia-zaklada-git-bash

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Komendy, które Rafał ma wkleić sam, piszę w składni Git Bash (`cd X && claude --flagi …`). Terminal,
który otwiera, bywa PowerShellem 5.1, gdzie `&&` jest błędem parsera, więc komenda nie działa albo
Rafał uruchamia ją po kawałku i gubi część argumentów.

## Przyczyna źródłowa
Składnię biorę z powłoki narzędzia Bash tej sesji, a nie z terminala Rafała. Domyślnym terminalem
VS Code na tej maszynie jest Windows PowerShell 5.1, który nie zna `&&` ani `||`. Dopisek
„(Git Bash)" nad blokiem nie wystarcza, bo terminal otwiera się taki, jaki jest domyślny.

## Dowody
- 2026-10-15, sesja c51a0755-8b46-4b7b-bca0-4c9d99ee48bd (id claude.ai niedostępny; vault, start
  huba): podałem `cd C:/Users/rafal/.claude/hub && claude --name hub --append-system-prompt-file
  C:/Users/rafal/.claude/skills/hub/role.md`. Pierwsza próba dała sesję `hub-d0` bez flag (zakładam:
  `&&` odrzucony, a Rafał wpisał samo `claude`); druga — sesję `hub-94`, której pierwszy prompt to
  dosłownie `start --name hub`. Trzecia wersja, dwie osobne linie bez `&&`, zadziałała od razu
  (sesja `hub`). Koszt: trzy rundy i w końcu zmiana całego podejścia (hub w panelu VS Code).
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven) (strona odwrotna): komendę dla prefiksu `!` podałem w PowerShellu (`! Stop-Process -Id 28640,23724`), a `!` uruchamia Git Bash — `Stop-Process: command not found`. Zadziałało `! taskkill //PID … //F` (podwójne `//`, bo MSYS tłumaczy `/PID` na ścieżkę). Reguła działa w obie strony: składnię wybierać według powłoki celu.

## Rozwiązanie
Komenda do wklejenia przez Rafała: jedna komenda na linię, bez `&&`, `||`, `$(…)` i heredoków,
ze ścieżkami z ukośnikami `/`, w składni ważnej w PowerShell 5.1 i w Git Bash jednocześnie. Gdy
to niemożliwe, podaj dwa bloki z nazwą powłoki w pierwszym zdaniu nad każdym.
