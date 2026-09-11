# instrukcja-zakotwiczona-na-pozycji-nie-na-naglowku

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Instrukcja skilla wskazuje miejsce zapisu pozycją w pliku („dopisz na górze
pliku"), a nie nagłówkiem sekcji. Gdy plik dostaje nową sekcję nad prowadzoną
treścią, reguła zaczyna wskazywać złe miejsce i nic tego nie sygnalizuje —
pierwszym objawem jest wpis wstawiony przed cudzą sekcją.

## Przyczyna źródłowa
Pozycja jest własnością całego pliku, nagłówek — własnością sekcji. Skill zna
tylko swoją sekcję, ale adresuje ją współrzędną globalną, więc każda zmiana
pliku wykonana poza skillem (przez użytkownika albo przez inny skill) cicho
unieważnia jego regułę. Plik współdzielony przez człowieka i skill zmienia
kształt częściej niż instrukcja skilla.

## Dowody
- 2026-09-03, sesja session_01TR43bKGaUWASqCrAsDE6GT: użytkownik poprosił
  o tabelę pomysłów nad dziennikiem w `praca-z-claude.md`. Krok 4 skilla
  `podsumuj-sesja-claude` brzmiał „dopisz na GÓRZE pliku", więc kolejny brief
  mógł wylądować nad tabelą. Kolizja wyszła na etapie planowania zmiany, przed
  zapisem; Krok 4 przekotwiczono na nagłówek `# Praca z Claude — dziennik
  sesji`. Poprawka objęła jeden skill — czy `start-day` i `tidy-journal`
  adresują `zadania.md` i `nauka-z-claude.md` tak samo, nie zostało sprawdzone.
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: brief Taska 6 adresował trzy edycje cytatem dokładnego zdania, czyli treścią, nie pozycją — i i tak się zestarzał. Commit `c1f26ef` przepisał i zawinął jedno ze zdań, `4f54506` dołożył drugą notatkę do bloku, który brief kazał przenieść w całości, a punkt w `CLAUDE.md` był w tym momencie edytowany przez drugą sesję. Adresowanie treścią jest odporniejsze od pozycji, ale nadal jest pomiarem drzewa z dnia pisania briefu.

## Rozwiązanie
Miejsce zapisu adresuj nagłówkiem sekcji, nie pozycją w pliku: „na górze"
znaczy „bezpośrednio pod nagłówkiem X", a treść poza sekcją zostaje nietknięta.
Dokładając sekcję do pliku prowadzonego przez skill, przeczytaj najpierw regułę
wstawiania tego skilla i popraw ją w tej samej sesji — inaczej rozjazd wyjdzie
dopiero przy następnym zapisie, już jako uszkodzony plik.
