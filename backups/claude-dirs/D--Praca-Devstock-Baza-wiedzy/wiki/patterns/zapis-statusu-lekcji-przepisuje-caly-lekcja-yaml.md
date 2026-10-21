# zapis-statusu-lekcji-przepisuje-caly-lekcja-yaml

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Render ustawia `status.video: wyrenderowane` i przy tym przepisuje cały `lekcja.yaml`. Długie wartości łamią się na
80 znakach, a komentarze znikają. W commicie zmiany statusu pojawia się wtedy zmiana, której nikt nie robił.

## Przyczyna źródłowa
`src/video.js:558` i `src/video.js:593` zapisują lekcję przez `zapiszYaml` (`src/course-files.js:15-17`), czyli
`YAML.stringify` całego drzewa z domyślną szerokością linii. W tym samym pliku jest `updateYamlIn`
(`src/course-files.js:86-100`), który zmienia jedną wartość i zachowuje formatowanie reszty, ale render go nie używa.

## Dowody
- 2026-10-21, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3. Commit
  akceptacji `954921eb` miał „3 insertions(+), 2 deletions(-)” zamiast jednej linii, bo render zawinął `cel:` na dwie
  linie. Claude zauważył to po `git show --stat`, sprawdził diff (wartość ta sama) i opisał zmianę w raporcie.

## Rozwiązanie
W `src/video.js` zastąp `zapiszYaml(lekcjaYamlSciezka, lekcja)` wywołaniem
`updateYamlIn(lekcjaYamlSciezka, ['status', 'video'], 'wyrenderowane')`. Do skilli, które commitują `lekcja.yaml`: po
commicie sprawdź `git show --stat HEAD`. Statystyka większa niż sama zmiana statusu oznacza, że trzeba obejrzeć diff,
zanim podasz hash w raporcie.
