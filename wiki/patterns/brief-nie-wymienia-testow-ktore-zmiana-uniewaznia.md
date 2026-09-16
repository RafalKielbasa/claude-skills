# brief-nie-wymienia-testow-ktore-zmiana-uniewaznia

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis

Sekcja **Files** zadania w planie wymienia pliki, które zadanie tworzy i zmienia,
ale pomija istniejące testy, których asercje ta zmiana czyni fałszywymi.
Implementer trafia na czerwony suite w pliku, o którym brief nie wspomina, i musi
sam rozstrzygnąć, czy to jego błąd, czy nieaktualna asercja.

## Przyczyna źródłowa

Listę plików pisze się z perspektywy nowego kodu — „co muszę napisać" — i tak
samo czyta się ją w self-review. Pytanie odwrotne, „które istniejące
twierdzenia ta zmiana unieważnia", nie pada nigdzie w skillu: ani przy pisaniu
planu, ani w skanie pre-flight, ani w review planu przez codex, bo wszystkie
trzy oceniają plan wobec specu, a nie wobec zastanego suite'u.

## Dowody

- 2026-09-08/09, sesja session_01VwQutH9xHrU3vwiwnhbL8y: plan trybu `vision`
  silnika `idea-engine`, 8 zadań. **Dwa razy w jednym planie.** Task 1 rozszerzał
  przejścia statusu o `validated → validating`; jego lista plików nie zawierała
  `test/validate.test.mjs`, w którym stał test twierdzący, że `validate plan`
  odrzuca pomysł `validated` regułą R08 — to twierdzenie stawało się fałszywe
  wprost przez tę zmianę. Task 4 dodawał dwa pola do `ideaStatusRow`; brief
  wskazywał dwa miejsca z `assert.deepEqual` w `test/idea.test.mjs`, a trzecie
  leżało w `test/cli.test.mjs:381`, w innym pliku. Obaj implementerzy znaleźli
  brakujące miejsca sami i poprawili je trafnie (Task 4 zgłosił to jako
  `DONE_WITH_CONCERNS`), więc koszt został na poziomie zamieszania, nie defektu —
  ale w obu przypadkach rozstrzygnięcie „to nieaktualna asercja, nie mój błąd"
  podjął agent widzący tylko własne zadanie.
- 2026-09-16, sesja (id niedostępny), repo Baza wiedzy: drugi raz, inny plan, inne repo — i
  w ostrzejszym wariancie. Plan scalenia ściągi klawiaturowej z konspektem nagrania (8 zadań,
  `tools/course-pipeline`) dodawał w Tasku 4 bramkę odrzucającą lekcję bez sekcji
  „Do wklejenia i wpisania na ekranie". Self-review planu (pokrycie specu, placeholdery, spójność
  typów) tego nie złapał; złapało dopiero niezależne review przez `codex`, dwiema uwagami naraz:
  (1) `lekcjaDemo()` w `tests/plan-nagrania.test.js:648` domyślnie buduje lekcję z `KONSPEKT_DEMO`,
  którego nowa bramka odrzuca, więc każdy test sukcesu w tym `describe` by padł; (2)
  `tests/validate-lesson.test.js:354,365,379` zapisuje ten sam fixture, a dwa z tych testów wołają
  `generateRecordingPlan`. Deklarowany w planie pełny zielony przebieg był nieosiągalny.
  **Wzmocnienie wzorca:** najdroższy wariant to nie „istniejąca asercja o zmienianym zachowaniu",
  tylko **fixture, którego nowa walidacja nie przepuszcza**. Taki fixture unieważnia wszystkie
  testy, które go dotykają — także te, które o zmienianym zachowaniu nic nie mówią — więc `grep`
  po nazwie funkcji ani po komunikacie błędu go nie znajdzie; szukać trzeba po nazwie fixture'u.
  Naprawa wcielona do planu: przestawienie domyślnej wartości w helperze zamiast poprawiania
  wywołań po kolei.

## Rozwiązanie

Przy pisaniu planu, dla każdego zadania zmieniającego zachowanie już pokryte
testami, wyszukać istniejące asercje o tym zachowaniu (`grep` po nazwie
funkcji, po komunikacie błędu, po kodzie reguły) i dopisać znalezione pliki do
sekcji **Files** z jednym zdaniem: które twierdzenie przestaje być prawdziwe i
jak ma brzmieć po zmianie. Brak takiego wpisu przy zadaniu zmieniającym
zachowanie traktować w self-review planu jako lukę, nie jako brak potrzeby.
