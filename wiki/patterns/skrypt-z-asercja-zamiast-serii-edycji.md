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
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC (druga część): wstawienie
  wpisu na górę `praca-z-claude.md` wykonane jednym poleceniem z asercją, że
  pierwsza linia to nagłówek dziennika, i z porównaniem przyrostu liczby linii
  z oczekiwaniem (635 + 39 + 2 = 676, wynik 676). Plik miał już trzy wpisy z tego
  samego dnia od innych sesji, więc edycja „w miejscu” po numerze linii byłaby
  zgadywaniem. Ten sam ruch powtórzył się przy wysyłce piętnastu ticketów, gdzie
  weryfikacją była nie liczba linii, tylko odczyt treści z GitHuba i porównanie
  z draftem, z pominięciem końcowej pustej linii dokładanej przez GitHub.
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: twarde spacje w artykule
  kursu (styleguide wymaga U+00A0 po `a i o u w z`) wstawione skryptem
  `sierotki.mjs`, którego regex jest kopią regexa walidatora
  (`tools/course-pipeline/src/typografia.js`), a nie odgadniętą regułą. Skrypt
  pomija bloki kodu i kod inline tym samym podziałem co walidator i na końcu
  sam raportuje własny wynik: `pozostale sierotki poza kodem: 0`. Uruchomiony
  trzy razy — po pierwszym zapisie i po dwóch rundach poprawek — za każdym
  razem z tym samym wynikiem, potwierdzonym niezależnie przez
  `npm run validate`. Ręcznie było do wstawienia ponad sto znaków niewidocznych
  w edytorze, czyli klasa zmian, której żadne oko nie zweryfikuje.
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: `fix-sierotki.mjs` z regexem skopiowanym z `src/typografia.js`, wykonany dwa razy (po tym, jak pierwsza poprawka zniknela z drzewa). Asercja wejscia w postaci dry-run z liczba pol, a po zapisie dwa niezalezne weryfikatory: porownanie kazdego pliku z wersja z HEAD po zamianie U+00A0 z powrotem na spacje (diff wylacznie typograficzny) i sprawdzenie, ze 34 pozycje `poprawne` nadal maja odpowiednik w `odpowiedzi`. Drugi weryfikator zlapal realne ryzyko: tresc odpowiedzi powtarza sie doslownie w `poprawne`, wiec podmiana tylko jednej kopii rozspojnilaby quiz.

- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: szosty dowod i pierwszy
  kontrprzyklad - asercja wejscia przeszla, a zmiany i tak przepadly.
  Skrypt aktualizujacy wiki planowal dwanascie operacji: kazda czytala plik
  z dysku, sprawdzala kotwice i odkladala do listy PELNA nowa tresc, a zapis
  szedl dopiero na koncu, po kolei. Do `index.md` byly trzy operacje, wiec
  ostatnia z nich - zbudowana z odczytu SPRZED dwoch poprzednich - nadpisala
  ich wynik: cztery nowe wzorce weszly, oba liczniki dowodow zostaly stare.
  Skrypt wypisal dwanascie linii „OK" i „zapisanych plikow: 12", bo kazda
  asercja liczyla sie na oryginale i kazda byla prawdziwa. Wykryte dopiero
  osobnym weryfikatorem po zapisie (`s.count('(otwarty, 4 dowody)')` -> 0),
  czyli przez ten sam mechanizm, ktory ta strona zaleca.
- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: siodmy dowod, i pierwszy,
  w ktorym asercja zatrzymala zapis do dziennika sesji z wlasciwego powodu.
  Kazda zmiana w `struktura-zadania.md`, `SKILL.md`, `cli.js` i `package.json`
  szla przez skrypt z funkcja `podmien(przed, po)`, ktora rzuca `nie znaleziono
  fragmentu` - szesc podmian w szablonie i trzy w skillu przeszly za pierwszym
  razem, zadna nie trafila w niewlasciwe miejsce. Wpis do `praca-z-claude.md`
  mial trzy asercje naraz (naglowek dziennika, liczba linii 1167, brak wpisu
  z dzis) i wstawil sie jedna operacja `splice`. Nauka z szostego dowodu
  zastosowana: na kazdy plik jedna operacja, zadnych dwoch odczytow tego samego
  pliku przed zapisem.

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

Asercja wejscia chroni przed cudza zmiana pliku, ale nie przed wlasna: skrypt,
ktory dla kilku operacji na TYM SAMYM pliku buduje osobne wersje calej tresci
z jednego odczytu, przy zapisie zostawi tylko ostatnia, a wszystkie asercje
przejda, bo liczyly sie na oryginale. Kumuluj zmiany na jednym ciagu i zapisuj
raz na plik, a weryfikator uruchamiaj PO zapisie i na odczycie z dysku - liczba
linii „OK" z samego skryptu nie jest dowodem, ze zapis przetrwal.
