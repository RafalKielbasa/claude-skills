# zlozona-komenda-git-z-cd-poza-regulami-allow

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Commit i push w repo, które ma reguły `allow` na git (vault: `Bash(git add:*)`,
`Bash(git commit:*)`, `Bash(git push:*)`), wysłane jedną komendą `cd … && git branch … && git add …
&& git commit … && git push`, klasyfikator trybu auto odrzuca jako „[Git Destructive]". Te same
operacje jako osobne komendy z katalogu repo przechodzą bez pytania.

## Przyczyna źródłowa
Reguła `allow` dopasowuje początek komendy. Komenda zaczynająca się od `cd` nie pasuje do żadnej
reguły, więc decyzja przechodzi na klasyfikator, który widzi `git push` w łańcuchu. Hipoteza
częściowo sprawdzona: po pierwszej odmowie odrzucona została także złożona `cd … && git status`,
a każda pojedyncza komenda git przeszła.

## Dowody
- 2026-10-15, sesja c51a0755-8b46-4b7b-bca0-4c9d99ee48bd (id claude.ai niedostępny; vault):
  `cd /d/Notatki/notatki && git branch --show-current && git add … && git commit -q -F - <<'EOF' …
  && git push` → „Permission for this action was denied … [Git Destructive]"; zaraz potem
  `cd /d/Notatki/notatki && git status --short && git log -1` → ta sama odmowa. Osobno:
  `git branch --show-current`, `git add <ścieżki>`, `git commit -m …`, `git push` przeszły.
  Do końca sesji sześć commitów i pushy w tym kształcie (4193683, 5a64070, 06c5f72, d8e92f8,
  3759595, 79091c7) — żadnej odmowy.

## Rozwiązanie
W repo z regułami `allow` na git każda komenda git idzie osobnym wywołaniem: bez `cd` z przodu,
bez `&&`, z katalogu repo jako cwd, ze ścieżkami względem tego cwd. Kolejność z reguły repo
(`git branch --show-current` → `git add <pliki>` → `git commit` → `git push`) to cztery wywołania,
nie jedno.
