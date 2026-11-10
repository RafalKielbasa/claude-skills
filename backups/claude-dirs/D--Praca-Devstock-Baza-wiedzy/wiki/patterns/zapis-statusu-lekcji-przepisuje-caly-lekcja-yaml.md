# zapis-statusu-lekcji-przepisuje-caly-lekcja-yaml

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Render ustawia `status.video: wyrenderowane` i przy tym przepisuje cały `lekcja.yaml`. Długie wartości łamią się na
80 znakach, a komentarze znikają. W commicie zmiany statusu pojawia się wtedy zmiana, której nikt nie robił.

## Przyczyna źródłowa
`src/video.js:558` i `src/video.js:593` zapisują lekcję przez `zapiszYaml` (`src/course-files.js:15-17`), czyli
`YAML.stringify` całego drzewa z domyślną szerokością linii. W tym samym pliku jest `updateYamlIn`, ale do
`be977301` (2026-11-10) on też zapisywał cały plik przez `doc.toString()`: zachowywał komentarze, a mimo to łamał
długie wartości na 80 znakach, zmieniał odstępy w `{ }` i `[ ]` i składał długie wyrażenia regularne. Od `be977301`
`updateYamlIn` i `deleteYamlIn` zmieniają tylko tekst węzła docelowego; render dalej woła `zapiszYaml`
(`src/video.js:615`, `src/video.js:657`, `src/znak-ai/film.js:55`).

## Dowody
- 2026-10-21, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3. Commit
  akceptacji `954921eb` miał „3 insertions(+), 2 deletions(-)” zamiast jednej linii, bo render zawinął `cel:` na dwie
  linie. Claude zauważył to po `git show --stat`, sprawdził diff (wartość ta sama) i opisał zmianę w raporcie.
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; odbiór DT-101, wysyłka zaległych
  `agenty-ai` na staging): zapis ID przez `updateYamlIn` przepisał 164 linie `kursy/agenty-ai/kurs.yaml` (mapy
  `{ … }` sesji nagrywania, regexy `widokiBezId`) i pole `cel` lekcji 4.1; dane po sparsowaniu bez zmian. Format
  przywrócony ręcznie przed commitem `440407c9` (podmiana samych linii ID w tekście z HEAD, równość danych
  sprawdzona), przyczynę usunął `be977301` (edycja tekstu węzła z kontrolą danych i awaryjną pełną serializacją
  z `OSTRZEŻENIE`).

## Rozwiązanie
W `src/video.js` (i `src/znak-ai/film.js`) zastąp `zapiszYaml(lekcjaYamlSciezka, lekcja)` wywołaniem
`updateYamlIn(lekcjaYamlSciezka, ['status', 'video'], 'wyrenderowane')`; od `be977301` zachowuje on format pliku. Do skilli, które commitują `lekcja.yaml`: po
commicie sprawdź `git show --stat HEAD`. Statystyka większa niż sama zmiana statusu oznacza, że trzeba obejrzeć diff,
zanim podasz hash w raporcie.
