# przekierowanie-uzytkownika-respektowane-bez-oporu

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Gdy użytkownik w trakcie aktywnego przebiegu skilla wprost powiedział, że chce
zrobić coś innego, Claude porzucił przerwany tok i przeszedł do nowego zadania,
bez próby dokończenia bieżącego kroku ani ponawiania pytania.

## Przyczyna źródłowa
Brak — to zachowanie pożądane, zapisane jako wzorzec-sukces po to, żeby przyszłe
zmiany skilli go nie zepsuły. Ryzyko jest realne: kroki `nauka-z-claude`
zachęcają do domknięcia pytania sprawdzającego przed przejściem dalej, więc
nieostrożna zmiana mogłaby zamienić tę zachętę w wymóg.

## Dowody
- 2026-09-02, sesja session_019Hub3mysiz4zztWAWESMQn: po zdaniu „Nie będę się
  uczył teraz, czy możesz zaimplementować coś z tego artykułu do naszej
  codziennej pracy" Claude domknął stan w pliku postępu nauki i uruchomił
  `superpowers:brainstorming`, bez ponawiania pytania sprawdzającego.

## Rozwiązanie
Utrzymać regułę: jawna prośba o zmianę kierunku pracy ma pierwszeństwo przed
dokończeniem aktualnego kroku skilla. Żadna przyszła zmiana skilla nie powinna
wymuszać domknięcia przerwanego kroku przed przejściem dalej.
