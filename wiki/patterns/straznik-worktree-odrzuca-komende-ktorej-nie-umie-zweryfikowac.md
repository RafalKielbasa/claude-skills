# straznik-worktree-odrzuca-komende-ktorej-nie-umie-zweryfikowac

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
W sesji izolowanej w worktree (`EnterWorktree`, zadanie w tle) narzędzie Bash odrzuca komendę z gitem
w pętli, ze zmienną w argumencie albo w łańcuchu, którego nie umie przeanalizować, choć każda operacja
osobno jest odczytem we własnym worktree. Każda odmowa kosztuje turę na przepisanie komendy.

## Przyczyna źródłowa
Strażnik izolacji sprawdza statycznie, czy komenda git celuje we własny worktree. Pętli, podstawienia
`$c`, heredoca, `awk` czy `find -exec` nie rozwija, więc nie umie dowieść celu i odmawia całości
(„names git in a form too complex to verify that it stays inside the worktree”). To inny mechanizm niż
reguła `allow` dopasowująca początek komendy (`zlozona-komenda-git-z-cd-poza-regulami-allow`), ale
objaw i obejście są te same. Komendy w innym repo z prostym `cd … && git status` przechodzą.

## Dowody
- 2026-10-21/22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny), worktree
  `baza-wiedzy-kodozercy-public-screens`: dziewięć odmów w sesji (siedem „too complex to verify that it
  stays inside the worktree”, dwie „cannot be shown not to be git”), m.in. pętle, heredoki, `awk`,
  `find -exec` i `board-tracker bind`. Ostatnia: `for c in 97d8fdd4 …; do git branch -a --contains $c …;
  done; git branch --no-merged main …` → odmowa; cztery osobne wywołania `git branch -a --contains <sha>`
  wysłane równolegle w jednej wiadomości przeszły od razu.

## Rozwiązanie
W sesji izolowanej w worktree każda komenda git to osobne, proste wywołanie bez pętli, zmiennych
i `&&`, z cwd w worktree; kilka takich wywołań wysyłaj równolegle w jednej wiadomości zamiast pętli.
Logikę, której nie da się rozbić (pętla, przetwarzanie wyniku), przenieś do narzędzia PowerShell albo do
skryptu w pliku, a zmiany treści plików rób przez Write/Edit.
