# create-task-przypina-issue-zakladane-na-pozniej

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przy zamykaniu DT-92 założyłem trzy follow-upy przez `create-task --card <karta> --status backlog`. Wszystkie trzy
zostały przypięte do sesji (`done` zawiera `bound`), choć sesja nad nimi nie pracowała. Reguła śladu każe pisać ślad
„dla każdego przypięcia, nad którym sesja pracowała”, więc zostaje wybór: trzy puste ślady albo pominięcie z
wyjaśnieniem. Ranking po Done musiał je ręcznie odfiltrować jako „przypięte do tej sesji”. To jeden dowód, a skala
szkody jest mała (szum w przypięciach), więc wzorzec jest do potwierdzenia.

## Przyczyna źródłowa
`create` i `create-task` są zaprojektowane dla pracy bieżącej sesji: issue dostaje status „w toku” i zostaje
przypięte. Skill nie ma ścieżki dla issue zakładanych na później. Obejście istnieje tylko dla kart DT
([[paczka-dt-przez-gh-create-i-ensure]]: `gh issue create` + `ensure`, bez `bind`).

## Dowody
- 2026-11-12, sesja 0437af48-c40c-473a-a2a5-5d2bb978768c (id claude.ai niedostępny; code-busters-v2, DT-92 #833):
  - `create-task … --status backlog --card devstock-org/devstock-team#833` założył kodozercy/code-busters#1755,
    #1756 i #1757;
  - każdy wynik miał `done: [created, added_to_board, status:backlog, linked, bound]`;
  - ślady w tych issue pominąłem, z adnotacją w raporcie;
  - ranking po Done pominął te trzy issue jako przypięte do sesji.

## Rozwiązanie
Follow-up, nad którym sesja nie pracuje, zakładaj bez przypięcia:
- w repo projektu: `gh issue create`, potem `ensure --ref <nowe> --status backlog`, potem
  `link --card <karta> --task <nowe>`. Zakładam, że `ensure` działa dla issue z trackera projektu tak samo jak
  dla DT; tego nie sprawdzałem;
- w `devstock-team`: jak w [[paczka-dt-przez-gh-create-i-ensure]].

Docelowo flaga `--no-bind` w `create` i `create-task`.
