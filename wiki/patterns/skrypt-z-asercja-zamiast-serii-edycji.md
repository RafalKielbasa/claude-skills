# skrypt-z-asercja-zamiast-serii-edycji

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Wiele rozproszonych zmian w jednym pliku wykonane jednym skryptem z asercją na
stan wejściowy, a poprawność wyniku potwierdzona osobnym skryptem
porównującym rezultat z kopią sprzed zmiany.

## Przyczyna źródłowa
Seria kilkudziesięciu edycji nie zostawia dowodu, że nic poza planem nie zostało
ruszone — każdą trzeba by oglądać osobno, a błąd w jednej ginie w szumie.
Skrypt zamienia plan cięcia w dane (lista numerów linii), więc plan da się
przeczytać przed wykonaniem, a wynik porównać z oczekiwaniem mechanicznie.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: 68 zaplanowanych cięć
  w 655-liniowym `praca-z-claude.md` (17 sekcji `Stan:`, 51 punktów, 1 przycięcie
  treści). `tidy.py` z `assert len(src) == 655` wykonał je razem z renumeracją
  list i zwijaniem pustych linii; `verify.py` odtworzył oczekiwany wynik z kopii
  i porównał linia po linii — 379 linii treści oczekiwanych, 379 obecnych,
  0 różnic. Dowód poprawności powstał przed pokazaniem wyniku użytkownikowi.
- 2026-09-03, sesja session_01PKwz2sPWn4S4MPAStw2DuF: ten sam wzorzec poza
  plikiem, w Figmie. Podmiana ramek na instancje komponentów kasuje nadpisania,
  więc przed operacją powstał spis stanu: dla 22 instancji `TopBar` która pozycja
  nawigacji jest aktywna (15 Katalog, 2 Moje kursy, 2 Ranking, 3 bez aktywnej),
  dla 7 instancji szyny kursu która lekcja jest bieżąca i które ukończone. Stan
  odtworzono po podmianie jako właściwości komponentu, a wynik zweryfikowano
  odczytem właściwości ze wszystkich instancji, nie zrzutem ekranu. Zgodność
  z zapisem sprzed operacji wyszła pełna.

## Rozwiązanie
Przy więcej niż kilkunastu zmianach w jednym pliku pisz skrypt, nie serię edycji:
asercja na stan wejściowy zatrzymuje zapis, gdy plik zmienił się od czasu
planowania, a osobny skrypt weryfikujący wobec kopii zamienia „chyba dobrze
poszło” w liczbę. Kopię rób przed pierwszą zmianą, nie po.

Ta sama reguła obowiązuje poza plikami tekstowymi. Gdy operacja niszczy stan,
którego nie da się odtworzyć z artefaktu po fakcie (nadpisania instancji
w Figmie, ustawienia w panelu, dane w bazie), najpierw zrzuć ten stan jako dane,
potem wykonaj zmianę, na końcu odczytaj stan wynikowy i porównaj z zapisem.
Zrzut ekranu potwierdza jeden przypadek, odczyt potwierdza wszystkie.
