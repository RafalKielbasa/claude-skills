# dluga-akceptacja-bez-mapy-postepu

- **Skill:** ogólny (akceptacja z użytkownikiem)
- **Typ:** porażka
- **Status:** otwarty

## Opis
W długiej akceptacji prowadzonej wiersz po wierszu każda wiadomość opisuje tylko bieżący wiersz. Po
godzinie Rafał pyta, ile zostało. Odpowiedź (9 sprawdzeń, około 45 min) zaraz potem doprowadziła do
decyzji o przerwie, którą mógłby podjąć wcześniej.

## Przyczyna źródłowa
Mapa całości żyje w planie i w moich notatkach, nie w rozmowie. Każdy krok piszę jako samodzielną
instrukcję, więc użytkownik nie ma podstaw, żeby zaplanować czas ani wybrać momentu przerwy.

## Dowody
- 2026-11-09, sesja session_01WryF5WMM6e7iBT7efWZwJS (lokalnie 3089ecd1-38b8-4995-a6db-28273c325475),
  akceptacja planu 1 `hub-approvals`: po około 75 minutach i siedmiu wierszach Rafał: „Czy dużo nam
  zostało>”. Po tabeli bloków: „Kończymy na teraz, zamykam sesje, wrócimy do testowania po moich
  spotkaniach”.

## Rozwiązanie
W akceptacji albo bramce z ponad pięcioma krokami dla użytkownika: na starcie tabela bloków z czasem, a w
nagłówku każdej kolejnej wiadomości jedna linia postępu, np. „blok 2 z 7 · zostało około 35 min”. Przy
każdym bloku powiedz, czy po nim jest dobry moment na przerwę, i czy coś nie czeka.
