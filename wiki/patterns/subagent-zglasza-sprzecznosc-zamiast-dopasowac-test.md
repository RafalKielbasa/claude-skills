# subagent-zglasza-sprzecznosc-zamiast-dopasowac-test

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis

Dispatchowany implementer trafia na sprzeczność między tym, co każe mu brief, a
tym, co robi kod albo mówi test. Zamiast nagiąć jedno do drugiego — co zawsze
jest szybsze i wygląda na ukończone zadanie — **zatrzymuje się i zgłasza
rozbieżność**. Za każdym razem w tej sesji rozbieżność okazywała się realnym
defektem specyfikacji, nie nieporozumieniem.

## Przyczyna źródłowa

Dopasowanie testu do kodu (albo odwrotnie) usuwa objaw i kasuje jedyny ślad po
przyczynie. Implementer widzi tylko swoje zadanie, więc nie wie, czy sprzeczność
jest lokalną pomyłką, czy skutkiem decyzji z innego zadania — a kontroler wie.
Zachowanie utrzymuje się, gdy dispatch mówi to **wprost i z uzasadnieniem**, a
nie tylko „nie zmieniaj testów".

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: osiem wystąpień, ani
  jednego fałszywego alarmu. Wybrane: `commitAll` po `makeRepo` bez niczego do
  zacommitowania (defekt fixture'u w planie); helper w `test/` liczony przez
  `node --test` jako pusty przechodzący test, przez co licznik akceptacji
  wszystkich 15 pozostałych zadań był mylny o jeden; kod i test planu podające
  **niezgodne i oba błędne** polskie liczebniki („1 osi" wobec „1 oś"); test
  kolejności pękający dwa razy z powodu niezwiązanego z tym, co sprawdzał;
  sprawdzenie regresji przez podmianę argumentów, które **nie padło**, bo
  fixture nie miał remote'a i funkcja zwracała `null`, zanim dotknęła
  argumentów; wreszcie odmowa edycji testu napisanego przez kontrolera z
  powołaniem się na wcześniejszą instrukcję kontrolera o innym teście.

## Rozwiązanie

W każdym dispatchu implementera pisz wprost: „jeśli asercja w briefie przeczy
kodowi, którego nie kazałem zmieniać, powiedz to i zatrzymaj się na tej pozycji
zamiast wymuszać" — z uzasadnieniem, że sprzeczność jest informacją potrzebną
kontrolerowi i to jego rzecz do rozstrzygnięcia. Przy prośbie o sprawdzenie
regresji żądaj **obu wyników** (czerwonego po mutacji i zielonego po
przywróceniu), bo samo „sprawdzenie przeszło" bywa prawdziwe i bezwartościowe.
