# git-worktree-remove-pada-na-dlugich-sciezkach-windows

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Na Windowsie `git worktree remove` dla worktree z zainstalowanym `node_modules` kończy się błędem
`Filename too long`. Worktree znika z `git worktree list`, a katalog zostaje na dysku z częścią plików.

## Przyczyna źródłowa
Harness zakłada worktree w `<repo>\.claude\worktrees\<długa nazwa>\`, więc głęboko zagnieżdżone pliki pnpm
w `node_modules` przekraczają 260 znaków (MAX_PATH). Git for Windows bez `core.longpaths` nie kasuje takich
plików. Zakładam, że to ta przyczyna; `core.longpaths` nie sprawdziłem. Usunięcie wpisu worktree i usunięcie
katalogu to dla gita osobne kroki, więc po błędzie zostaje sierota: katalog, którego git już nie śledzi.

## Dowody
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf),
  code-busters-mobile.
  - Po „usuń teraz jeśli zostało zmergowane do feature brancha” `git worktree remove "…/code-busters-mobile-app-migration-m1-shell"`
    zwrócił kod 255 i `error: failed to delete '…': Filename too long`.
  - Następnie `git worktree list` pokazał tylko główny checkout, a `Test-Path` na katalogu zwrócił `True`.
  - Katalog skasowało dopiero `cmd /c 'rd /s /q "\\?\D:\…\code-busters-mobile-app-migration-m1-shell"'`
    (kod 0, `Test-Path` → `False`), potem `git worktree prune`.
- 2026-10-28, sesja c0757c79-09ad-4165-ad02-a020e38adc07 (id claude.ai niedostępny), po „usuń zbędne worktree”:
  trzy z czterech worktree z `node_modules` padły tak samo — `code-busters-app-migration-w2-learning` (W2),
  `code-busters-mobile-app-migration-m2-learning` (M2) i `code-busters-v2-public-cms` (poza `.claude\worktrees`,
  więc długość prefiksu nie jest jedyną przyczyną). Każdy domknął `cmd /c rmdir /s /q "\\?\<ścieżka>"`
  (`Test-Path` → `False`) i `git worktree prune`; `git worktree list` pokazał tylko główne checkouty.
  `code-busters-app-migration-w1-shell` bez `node_modules` zszedł zwykłym `git worktree remove`. Dwa z nich
  miały blokadę `locked claude session (pid …)` z martwym pid (`Get-Process` pusty) — najpierw `git worktree
  unlock`. Przed każdym: `git status --short` pusty i `merge-base --is-ancestor` gałęzi z DT-37.

## Rozwiązanie
Usuwanie worktree na Windowsie: najpierw upewnij się, że drzewo jest czyste, a gałąź scalona
(`git merge-base --is-ancestor`); blokadę `locked claude session (pid N)` zdejmij `git worktree unlock` dopiero
po sprawdzeniu, że proces N nie żyje. Potem `git worktree remove <ścieżka>`. Gdy padnie `Filename too long`,
skasuj katalog przez `cmd /c 'rd /s /q "\\?\<ścieżka bezwzględna>"'`, uruchom `git worktree prune` i sprawdź
wynik przez `Test-Path` oraz `git worktree list`. Nie zgłaszaj usunięcia na podstawie samego kodu wyjścia
gita.
