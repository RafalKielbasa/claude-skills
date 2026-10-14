# drugie-nagranie-tej-samej-daty-przy-otwartej-bramce

- **Skill:** spotkanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Offsite z agendą ma więcej niż jedno nagranie tej samej daty. Notatka powstała z pierwszego i jest
już `finalna`, a bramka kolejek jest otwarta (wpisy `approved`, niewykonane, bez znacznika
`Opublikowano`). Wtedy w `planning/transkrypty/` pojawia się kolejny transkrypt tej daty. Tryb
„transkrypt” nie ma ścieżki dla takiego uzupełnienia, więc Claude improwizuje je za każdym razem:
status, `Źródła`, miejsce na treść spoza agendy i powrót zmienionych kandydatów do przeglądu.

## Przyczyna źródłowa
Krok 1 najpierw szuka otwartej bramki i przy dokładnie jednej każe „przejść od razu do kroku 5 …
nie szukaj transkryptów”. Gdyby Claude poszedł za krokiem 1, transkrypt ze skrzynki zostałby
pominięty, a przy egzekucji niepełna notatka poszłaby na Slacka (publikacja jest jednorazowa,
blokuje ją znacznik). Tryb z agendą zakłada jedną notatkę z jednego nagrania i mapuje treść tylko
na punkty agendy, więc brainstorming spoza agendy nie ma swojej sekcji.

## Dowody
- 2026-10-13, sesja nieustalona (ślad: commit `3ff6e423` „supplement the 2026-10-13 note from the
  meeting recording” i komentarz w `planning/2026-10-13-wpisy.yaml`): nagranie 10:25 dopisane do
  finalnej notatki blokiem „Uzupełnienie z nagrania”, a wpis 2 wrócił do przeglądu jako `proposed`.
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (id claude.ai niedostępny):
  `/spotkanie transkrypt` bez daty, w skrzynce `2026-10-13-1453-transkrypt.md` („Przed nami
  ostatnia część spotkania, czyli teraz brainstorming”). Claude zatrzymał się przed krokiem 1 i
  zapytał o kolejność. Rafał wybrał „13.10: najpierw 14:53”. Notatka dostała z powrotem status
  `szkic`, w `Źródłach` doszedł drugi transkrypt, w punktach 2, 3, 8 i 9 pojawiły się bloki
  „Uzupełnienie z nagrania”, a treść spoza agendy trafiła do nowego punktu „### 10. Brainstorming
  — tematy spoza agendy”. Wpisy 2, 3 i 6 wróciły do `proposed`, doszły wpisy 7 i 8.

## Rozwiązanie
W kroku 1: gdy data ma otwartą bramkę, a w `planning/transkrypty/` leży transkrypt tej daty, którego
nazwy nie ma w `**Źródła:**` notatki, zapytaj Rafała jednym pytaniem: „uzupełnij notatkę, potem
jedna egzekucja” (rekomendowane) albo „najpierw domknij bramkę”. Uzupełnienie: status `szkic` do
ponownej akceptacji, `Źródła` += plik, w każdym pasującym punkcie blok „Uzupełnienie z nagrania
(<plik>)”, treść spoza agendy w nowym punkcie „### N. Tematy spoza agendy”. Po akceptacji kandydaci
zmienionych punktów wracają do `proposed`, nowe punkty dostają kolejne `id`, a zatwierdzone
i niezmienione zostają `approved`.
