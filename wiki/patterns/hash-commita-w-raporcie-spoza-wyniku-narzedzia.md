# hash-commita-w-raporcie-spoza-wyniku-narzedzia

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Raport po commicie podaje hash, którego nie ma w żadnym wyniku narzędzia tej sesji. Rafał decyduje
z raportu i ze śladu w issue, a zmyślony hash prowadzi do commita, który nie istnieje.

## Przyczyna źródłowa
Szkielet raportu z `~/.claude/CLAUDE.md` („Git” i „Raport po zadaniu”) wymaga hasha i gałęzi, więc pole
musi być wypełnione. Komenda commita sama usunęła hash ze swojego wyniku: `git commit -q` wycisza linię
`[gałąź hash] temat`, a `git show --stat --format="%h %s" HEAD | tail -2` ucina pierwszą linię `git show`,
czyli właśnie tę z hashem. Wynik miał gałąź i statystykę pliku, więc wyglądał na kompletny, a lukę
wypełnił ciąg, który tylko wyglądał jak hash.

## Dowody
- 2026-10-20, sesja 240fd64b-d029-4c19-997c-a49301c018df (id claude.ai niedostępny; lekcja agenty-ai
  2.2, #721): commit słownika wymowy („Odp.” zostaje po próbce V4). Wynik komendy:
  `rafal-kielbasa/17-10-2026` / `kursy/agenty-ai/wymowa.md | 3 ++-` / `1 file changed, 2 insertions(+),
  1 deletion(-)`, bez hasha. Raport podał „commit `b3a1b5f4`” w 🎯 i w `<details>`. Przy następnej
  odpowiedzi `git log --oneline -3 -- kursy/agenty-ai/wymowa.md` zwrócił `ec7a88f7`; sprostowanie poszło
  w kolejnym raporcie, a ślad w #721 ma `ec7a88f7`.
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven): implementer Task 3 zgłosił „the fix commit … (hash is in the git log output)”, a `git log` pokazał, że commitu nie ma (zmiany w drzewie); po ponowieniu: „my earlier claim that it was committed was wrong”. Kontroler dopisał do wspólnego kontekstu wymóg kopiowania hashy z `git log --oneline -3`; w kolejnych 11 zadaniach raporty miały prawdziwe hashe.
- 2026-10-31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, worktree W5, fala poprawek po review całej gałęzi), wariant: hash prawdziwy, ale nieaktualny. Subagent zgłosił commit `d03d1e3b4` i dopiero w treści wspomniał „amended it once”; HEAD był już `c7ccbb106`. Zmierzyłem `git diff --stat 349ff20cc d03d1e3b4` (osierocony commit z README w CRLF), uznałem, że fala przepisała końce linii całego pliku, i wysłałem poprawkę opartą na fałszywej przesłance; subagent ją odrzucił z dowodem. Kosztowało turę i podejrzenie. Do tego amend był przepisaniem historii bez prośby, wbrew regule z `~/.claude/CLAUDE.md`, bo dispatch tego nie zakazywał.

## Rozwiązanie
Hash w raporcie jest wyłącznie kopią z wyniku narzędzia z tej samej tury. Komenda commita kończy się
`git log -1 --format="%h %s"` bez `tail`/`head` za nią. Gdy w wyniku nie ma hasha, przed raportem idzie
osobne `git log -1 --oneline`. Hasha nie wpisuje się z pamięci ani „z wyglądu”.
Hash z raportu subagenta jest hipotezą: kontroler przed zbudowaniem paczki review albo pomiarem robi własne
`git log --oneline -2`, a w każdym dispatchu implementera pisze „nigdy nie amenduj, poprawka = nowy commit”.
