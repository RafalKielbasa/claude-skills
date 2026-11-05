# zamkniecie-na-slowo-mimo-sprzecznego-dowodu

- **Skill:** board-tracker (z project-index)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rafał każe zamknąć zadanie i podaje przesłankę („wdrożone”). Moja kontrola tej przesłance przeczy, a zapis
i tak idzie, ze sprzecznością dopisaną tylko w śladzie. Przy okazji zapisuję wynik w indeksie, zanim zapis
się wykona, i zamykam powiązaną decyzję na tej samej przesłance.

## Przyczyna źródłowa
Reguła „Done dopiero po „tak”” kończy się na słowie użytkownika i nie mówi, co zrobić, gdy własny odczyt
temu słowu przeczy. Łatwo uznać, że skoro zapis da się cofnąć, wystarczy go wykonać i oznajmić rozjazd.
Tymczasem cofnięcie nie jest pełnym kosztem: zamknięcie #773 zdjęłoby z tablicy jedyny ślad po nieskończonym
wydaniu. Kolejność z [[zamkniecie-issue-z-bramka-i-sladem-zamykajacym]] (commit indeksu, ślad, `status`)
zapisuje wynik przed wykonaniem, a klasyfikator potrafi odrzucić akurat ten zapis, więc indeks wyprzedza stan.

## Dowody
- 2026-11-05, sesja 78d1f9a8-a534-43a0-8215-3ee7c33255f6 (id claude.ai niedostępny; Baza wiedzy, DT-52 #741):
  - Rafał: „Web i Mobile wdrożone na produkcje (…) redesing uważam za zakończony (…) zrób porządek na tablicy”.
  - Sprawdziłem przed zapisem: strona Google Play pokazywała 1.0.0, a EAS nie miał builda `production` 1.1.0.
    Wysłałem mimo to `status --ref …#773 --to done`. Zatrzymał je klasyfikator („[External System Writes]”),
    nie moja ocena; #772 w tej samej turze przeszło.
  - Rozjazd pokazałem dopiero w raporcie. Rafał: „Wdrożeniem mobilki na produkcje zajmuje się Szymon, przypisz
    jemu to zadanie w inProgress”, więc przesłanka o mobile nie była pełna.
  - Koszt: indeks z `fa711a33` opisywał zamknięcia, których nie było, i wymagał dwóch kolejnych commitów
    (`329325f8`, `327f9460`). Ślady #773 i #741 przepisane. Decyzję „Aplikacja ze sklepu a backend po #1670”
    zamknąłem jako nieaktualną na tej samej przesłance i musiałem przywrócić.

## Rozwiązanie
Gdy własny odczyt przeczy przesłance polecenia zamknięcia, wstrzymaj tylko zapis, którego dotyczy sprzeczność.
Resztę polecenia wykonaj, sprzeczność podaj w 🎯 i zapytaj o ten jeden zapis, z wariantami. Decyzji powiązanej
nie zamykaj przy okazji: jeśli jej nieaktualność wynika z tej samej przesłanki, czeka razem z zapisem. Commit
indeksu rób przed `status` tylko wtedy, gdy nie ma otwartej sprzeczności; inaczej najpierw zapis, potem indeks.
