# msys-tlumaczy-sciezki-tylko-w-argv

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
W Git Bashu ścieżka w stylu POSIX działa albo nie, zależnie od tego, gdzie stoi. W argumencie
programu natywnego (git, node) jest tłumaczona, czasem wbrew intencji: `git show
feature/x:.claude/…` → `fatal: ambiguous argument 'feature\x;.claude\…'`. Wewnątrz kodu skryptu
nie jest tłumaczona wcale: `node -e '…readFileSync("/tmp/board.json")…'` → `ENOENT … 'D:\tmp\board.json'`,
choć `> /tmp/board.json` w tej samej komendzie zapisał plik poprawnie.

## Przyczyna źródłowa
MSYS przepisuje ścieżki tylko w argv przekazywanym programom natywnym, heurystycznie — ciąg z `/` i
`:` wygląda mu na listę ścieżek. Bash widzi `/tmp` jako montowanie MSYS (katalog Temp
użytkownika), a Node rozwiązuje `/tmp` względem bieżącego dysku Windows. Ten sam napis trafia więc
w dwa różne miejsca.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: (1) `git show
  feature/tor-stacjonarny:.claude/skills/daily/SKILL.md` → „ambiguous argument
  'feature\tor-stacjonarny;.claude\skills\daily\SKILL.md'"; zadziałało z `MSYS_NO_PATHCONV=1`.
  (2) `gh project item-list … > /tmp/board.json` zapisał plik, a `node -e` czytający `/tmp/board.json`
  dostał ENOENT na `D:\tmp\board.json`; zadziałało ze ścieżką Windows scratchpada.

## Rozwiązanie
`git show <rev>:<ścieżka>` w Git Bashu zawsze z `MSYS_NO_PATHCONV=1` (albo `<rev>:./<ścieżka>`).
Plików wymienianych między bashem a Node/Pythonem nie kłaść w `/tmp`: używać ścieżki Windows
(`C:/…/scratchpad/…`) w obu miejscach i przekazywać ją Node'owi jako argument, nie literał w kodzie.
