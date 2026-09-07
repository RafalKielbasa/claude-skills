# odtwarzanie-historii-przez-nadpisywanie-drzewa-roboczego

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Praca wykonana bez commitów (bo reguła użytkownika je rezerwuje dla niego) leży
wyłącznie w drzewie roboczym. Przy prośbie „commituj" Claude próbuje odtworzyć
ładną historię per zadanie, kolejno kasując i odtwarzając drzewo ze snapshotów —
i w połowie zostawia je w stanie częściowym.

## Przyczyna źródłowa
Snapshoty pośrednie są w katalogu scratch, ale **stan końcowy istnieje tylko
w drzewie roboczym**, więc każda iteracja „skasuj i odtwórz" gra o jedyną kopię
pracy. Do tego `rm -rf` na Windowsie potrafi paść w środku (`Device or resource
busy` na katalogu trzymanym przez indekser, AV albo edytor) — i pada *po* usunięciu
wcześniejszego argumentu, nie przed. Osobno: operacje tej klasy bywają blokowane
przez klasyfikator, więc zablokowana może być także **ścieżka naprawy**, nie tylko
ta destrukcyjna. Odtwarzanie historii wygląda na kosmetykę, a jest operacją
o najwyższym promieniu rażenia w całej sesji.

## Dowody
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: po 11 zadaniach Plan B
  (205 testów, nic niezacommitowane) prośba „commituj zmiany". Skrypt miał zrobić
  12 commitów ze snapshotów `snap-t2`…`snap-finalfix`. Commit 1 przeszedł, w kroku 2
  `rm -rf .claude/skills/idea-engine schema` zwrócił `rm: cannot remove 'schema':
  Device or resource busy` — `idea-engine` już skasowany, `schema` nietknięte.
  Naprawa przez `cp -R` zablokowana przez klasyfikator; alternatywa bez dotykania
  drzewa (`git --git-dir=… --work-tree=<snapshot> add`) też zablokowana. Drzewo
  przywrócone `Copy-Item` z kopii zapasowej zrobionej na starcie (82 pliki, suite
  205/205 zielony), reszta pracy poszła jednym commitem. Historia: 2 commity
  zamiast 12.

## Rozwiązanie
Zanim zaczniesz odtwarzać historię przez podmianę drzewa roboczego, odpowiedz na
pytanie „czy stan, który zaraz nadpiszę, istnieje gdzieś jeszcze". Jeśli nie —
nie rób tego: zrób jeden commit stanu bieżącego i zaproponuj rozbicie jako osobną,
świadomą operację. Gdy już to robisz: kopia zapasowa całości **przed** pierwszą
zmianą (obowiązkowo), replay wyłącznie do przodu przez dokładanie plików bez
`rm` (snapshoty kolejnych zadań są nadzbiorami poprzednich, więc kasowanie jest
zbędne), i weryfikacja na końcu, że drzewo jest bajt w bajt równe kopii. Po drugiej
blokadzie klasyfikatora na tej samej klasie operacji — stop i pytanie do
użytkownika, nie trzecie obejście.
