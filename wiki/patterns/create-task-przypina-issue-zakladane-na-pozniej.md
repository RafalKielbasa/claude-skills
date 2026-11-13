# create-task-przypina-issue-zakladane-na-pozniej

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przy zamykaniu DT-92 założyłem trzy follow-upy przez `create-task --card <karta> --status backlog`. Wszystkie trzy
zostały przypięte do sesji (`done` zawiera `bound`), choć sesja nad nimi nie pracowała. Reguła śladu każe pisać ślad
„dla każdego przypięcia, nad którym sesja pracowała”, więc zostaje wybór: trzy puste ślady albo pominięcie z
wyjaśnieniem. Ranking po Done musiał je ręcznie odfiltrować jako „przypięte do tej sesji”. Pierwszy dowód dał mały
szum w przypięciach. Drugi (2026-11-13) dał większą szkodę: `bind` z listy `next` po częściowo nieudanym
`create-task` przesunął issue zatwierdzone do Backlogu na „w toku”.

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
- 2026-11-13, sesja 7d286730-a904-4694-a25c-8e90c19e7273 (id claude.ai niedostępny; code-busters-mobile, zamknięcie DT-93 #834). Drugi dowód, tym razem ze szkodą większą niż szum: zmiana statusu.
  - `create-task --status backlog --card-title … --domain dev --size M` założył kodozercy/code-busters-mobile#437 i kartę #945, ale zakończył się błędem na kroku karty (patrz [[board-tracker-cli-fails-whole-op-on-board-step]]).
  - `next` kazał uruchomić `ensure`, `link` i `bind`; wykonałem je zgodnie ze skillem.
  - `bind` zwrócił `moved: true, state: in_progress`: issue, które Rafał zatwierdził do Backlogu, trafiło do „w toku”.
  - Cofnąłem to przez `status --to backlog`, w granicach zgody na Backlog, i zgłosiłem w raporcie.
  - Strony tego wzorca nie przeczytałem przed zakładaniem, choć jego rozwiązanie (`gh issue create` + `ensure` + `link`) ominęłoby i przypięcie, i zmianę statusu.

## Rozwiązanie
Follow-up, nad którym sesja nie pracuje, zakładaj bez przypięcia:
- w repo projektu: `gh issue create`, potem `ensure --ref <nowe> --status backlog`, potem
  `link --card <karta> --task <nowe>`. Zakładam, że `ensure` działa dla issue z trackera projektu tak samo jak
  dla DT; tego nie sprawdzałem;
- w `devstock-team`: jak w [[paczka-dt-przez-gh-create-i-ensure]].

Docelowo flaga `--no-bind` w `create` i `create-task`.
