# furtka-testowa-w-strazniku-produkcyjnym

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis

Strażnik bezpieczeństwa blokuje ścieżkę, której test musi dosięgnąć. Naturalnym
odruchem jest dodanie przełącznika, który go wyłącza „tylko dla testów" —
zmiennej środowiskowej albo flagi. **Furtka dla testów jest furtką w produkcji**:
to ta sama ścieżka kodu, a środowisko nie odróżnia, kto nią idzie.

## Przyczyna źródłowa

Logika warta przetestowania siedzi **za** strażnikiem, w warstwie, której nie da
się wywołać jednostkowo — zwykle w CLI albo w handlerze. Przełącznik wygląda
wtedy na najtańsze wyjście, bo alternatywą pozornie jest rezygnacja z testu.
Właściwym rozwiązaniem jest przeniesienie logiki przed strażnika, nie osłabienie
strażnika.

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: `crm fixable` odmawia
  bez terminala, żeby nienadzorowany przebieg nie mógł zacząć naprawiania kodu.
  Testy spawnują CLI, a proces spawnowany nigdy nie ma terminala — agent
  potwierdził to empirycznie i dodał `CRM_TEST_FORCE_TTY=1`, **zgłaszając to do
  zatwierdzenia zamiast uznać za oczywiste**. Odrzucone: zmienna ustawiona w
  konfiguracji CI, przypadkiem albo przez kogoś „naprawiającego" pipeline,
  otwierałaby dokładnie ten przepływ, któremu strażnik ma zapobiegać. Logika
  wyboru poszła do `lib/fixable.mjs` jako czysta funkcja testowana jednostkowo,
  a sam strażnik jest testowany jedynym uczciwym sposobem — spawnem
  asertującym odmowę.

## Rozwiązanie

Nie dodawaj przełącznika wyłączającego strażnika. Wyciągnij logikę zza niego do
czystej funkcji w warstwie testowalnej jednostkowo; strażnikowi zostaw tylko
decyzję i wywołanie. Sam strażnik testuj przez uruchomienie w warunkach, dla
których powstał, asertując **odmowę**. Jeśli mimo to przełącznik wydaje się
konieczny, zgłoś to do decyzji zamiast dodawać go samodzielnie — i nazwij
wprost, co ta zmienna otwiera w produkcji.
