# swiezy-implementer-na-samym-skillu-testuje-skill

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Gdy plan pisze skill i potem go używa, ostatnie zadanie produkcyjne dostał świeży implementer z poleceniem pracy z samego
tekstu skilla i zgłaszania, gdzie tekst myli. Znalazł lukę, która dawała zły film, a której nie wykrył implementer znający
kontekst planu.

## Przyczyna źródłowa
Implementer, który pisał albo poprawiał skill, wypełnia luki tekstu tym, co pamięta z pracy nad nim. Świeży agent ma tylko
tekst, więc luka staje się błędem albo pytaniem, tak jak u przyszłego użytkownika skilla. Polecenie nieedytowania skilla
zostawia ocenę i zapis kontrolerowi.

## Dowody
- 2026-11-04, sesja 78788d89-0fb4-49f8-86e8-69106f4e6036 (id claude.ai niedostępny), plan narration sync, zadanie 8. Dispatch:
  „A future agent will pair from that text alone, so if the text misleads you or leaves a gap, say so in your report.” Wynik:
  sześć luk w `/kurs-montaz`. Pierwsza, wstęp przenoszący `close_node` pod lektora poprzedniego akapitu, dotknęła 6 akapitów
  i przeszła wcześniej przez zadania 6, 7 i 9 oraz przegląd całego planu. Kontroler wpisał ją do skilla i specu.

## Rozwiązanie
Gdy plan pisze skill albo procedurę i ma zadanie używające jej na prawdziwych danych, daj to zadanie świeżemu implementerowi,
nie temu z poprzednich zadań. W dispatchu poproś o listę luk tekstu w raporcie i zabroń edycji skilla. Luki oceń przez recenzenta,
a zmianę w skillu wpisz sam, przed zamknięciem planu.
