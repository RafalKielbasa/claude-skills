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

## Rozwiązanie

Przy pisaniu planu, dla każdego zadania zmieniającego zachowanie już pokryte
testami, wyszukać istniejące asercje o tym zachowaniu (`grep` po nazwie
funkcji, po komunikacie błędu, po kodzie reguły) i dopisać znalezione pliki do
sekcji **Files** z jednym zdaniem: które twierdzenie przestaje być prawdziwe i
jak ma brzmieć po zmianie. Brak takiego wpisu przy zadaniu zmieniającym
zachowanie traktować w self-review planu jako lukę, nie jako brak potrzeby.
