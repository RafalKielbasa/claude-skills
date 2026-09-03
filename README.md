# claude-skills - kopia zapasowa konfiguracji Claude Code

To repozytorium jest jednocześnie katalogiem `C:\Users\rafal\.claude`. Przechowuje
konfigurację, skille z każdego katalogu `.claude` na tej maszynie oraz pamięć
projektów.

Synchronizacja jest automatyczna: `hooks/backup-claude.ps1` jest podpięty jako hook
`SessionEnd`, więc uruchamia się po każdej sesji Claude Code w każdym katalogu. Gdy
nic się nie zmieniło, kończy działanie bez commitu.

## Odtwarzanie na nowej maszynie

1. Zainstaluj Claude Code i zaloguj się. Poświadczeń tu nie ma: `.credentials.json`
   jest celowo poza repozytorium.

2. Podłącz repozytorium do istniejącego `~/.claude`:

   ```powershell
   git clone https://github.com/RafalKielbasa/claude-skills.git "$env:TEMP\claude-skills"
   Move-Item "$env:TEMP\claude-skills\.git" "$env:USERPROFILE\.claude\.git"
   cd "$env:USERPROFILE\.claude"; git checkout -- .
   ```

   Przeniesienie samego `.git`, zamiast klonowania bezpośrednio do katalogu, jest
   konieczne, ponieważ Claude Code przy pierwszym uruchomieniu tworzy pliki w
   `~/.claude`, a `git clone` odmawia pracy w niepustym katalogu. Efekt uboczny jest
   dokładnie taki, o jaki chodzi: katalog od razu staje się repozytorium i dalej
   commituje.

3. Rozeslij pozostałe katalogi `.claude` z powrotem na ich ścieżki:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\restore-claude.ps1"
   ```

   Bez flagi skrypt tylko wypisuje, co by zrobił. Gdy lista wygląda dobrze:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\restore-claude.ps1" -Apply
   ```

   Jeśli ścieżki się zmieniły (inna litera dysku, inny układ), dodaj mapowanie:

   ```powershell
   ... -Apply -Map "D:\Praca=E:\Praca"
   ```

   Mapowanie obejmuje też katalogi `projects/<slug>/memory`: ich nazwy pochodzą ze
   ścieżki projektu, więc bez mapowania Claude nie znajdzie swojej pamięci.

4. Zainstaluj ponownie pluginy:

   ```
   /plugin marketplace add anthropics/claude-plugins-official
   /plugin marketplace add kepano/obsidian-skills
   /plugin install superpowers@claude-plugins-official
   /plugin install figma@claude-plugins-official
   /plugin install obsidian@obsidian-skills
   ```

   Dostajesz najnowsze wersje. Stan sprzed awarii jest zapisany w
   `plugins/installed_plugins.json` - zajrzyj tam, jeśli nowa wersja coś popsuje.

5. Sprawdź, czy wszystko wróciło:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\tests\run-all.ps1"
   ```

   Oraz wewnątrz sesji Claude Code: `/skills` pokazuje globalne skille, `/hooks`
   pokazuje `SessionEnd`.

## Co celowo nie jest tu zapisane

| Brakuje | Dlaczego |
|---|---|
| `.credentials.json`, `*.key`, `*.pem`, `.env`, `.env.*` | poświadczenia i sekrety; zaloguj się / skonfiguruj ponownie |
| `projects/**/*.jsonl`, `history.jsonl` | transkrypty sesji i historia promptów - generowane, rosną codziennie, setki megabajtów |
| `paste-cache/`, `file-history/`, `cache/`, `shell-snapshots/`, `debug/`, `downloads/`, `telemetry/` | cache i dane diagnostyczne |
| `sessions/`, `daemon/`, `jobs/`, `tasks/`, `session-env/`, `ide/` | stan uruchomieniowy |
| `plugins/cache/`, `plugins/marketplaces/` | kod stron trzecich, do odtworzenia z manifestu (krok 4) |
| `*.lock` | pliki blokad |

Jeśli szukasz tu czegoś z tej tabeli: nigdy nie było to zapisywane w kopii i nie
wróci.

## Codzienna obsługa

| Sytuacja | Komenda |
|---|---|
| Ręczna synchronizacja | `hooks\backup-claude.ps1` |
| Pojawił się nowy katalog `.claude` | `hooks\backup-claude.ps1 -Rescan` |
| Sprawdzenie, co poszło nie tak | `Get-Content backups\sync.log -Tail 30` |
| Uruchomienie testów | `hooks\tests\run-all.ps1` |

`backups/claude-dirs/` zawiera kopie **jednokierunkowe**. Edycja pliku tam nie
zmienia źródła i zostanie nadpisana przy kolejnej synchronizacji. Skille edytuj w
ich oryginalnych lokalizacjach.
