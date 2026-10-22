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

## Rozwiązanie
Hash w raporcie jest wyłącznie kopią z wyniku narzędzia z tej samej tury. Komenda commita kończy się
`git log -1 --format="%h %s"` bez `tail`/`head` za nią. Gdy w wyniku nie ma hasha, przed raportem idzie
osobne `git log -1 --oneline`. Hasha nie wpisuje się z pamięci ani „z wyglądu”.
