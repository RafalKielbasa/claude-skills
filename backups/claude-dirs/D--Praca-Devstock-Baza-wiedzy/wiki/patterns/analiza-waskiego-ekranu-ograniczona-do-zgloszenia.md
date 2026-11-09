# analiza-waskiego-ekranu-ograniczona-do-zgloszenia

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Analiza widoku na telefonie objęła tylko wady wymienione w zgłoszeniu (spis lekcji nad treścią, segmenty postępu przy 8+ krokach). Makiety i odczyty mierzyły tylko te elementy. Nieczytelny tytuł lekcji w nagłówku tego samego pierwszego ekranu zauważył dopiero Rafał.

## Przyczyna źródłowa
Zakres oceny przejąłem z listy wad w specu i zgłoszeniu, jakby była kompletna. Skill każe obejrzeć wąski ekran „gdy istotne”, ale nie każe przejść całego pierwszego ekranu niezależnie od zgłoszenia. Skrypt odczytu na makiecie zbudowałem pod nazwane wady, więc liczby innych elementów nie powstały.

## Dowody
- 2026-11-09, sesja 0facbde7-f16e-4ba0-a2f0-b304f63f372a (id claude.ai niedostępny; DT-81, `/free-lesson` na telefonie).
  - Argument skilla wymieniał dwie wady ze specu (sekcja 13).
  - Warianty A, B i C w Storybooku porównywały tylko położenie spisu.
  - Po makietach Rafał napisał: „Mam uwagę do tej sekcji jest mało czytelna. Czym jest sekcja „Co się stało przez trzy lata”?” i dołączył zrzut.
  - Pomiar dopiero po tej uwadze: tytuł w kolumnie 156 px, 4–5 wierszy, wyśrodkowany, bez odstępu od krawędzi nagłówka.
  - Doszła decyzja D5 i kolejna iteracja makiet.

## Rozwiązanie
Analiza widoku na wąskim ekranie obejmuje cały pierwszy ekran, a nie tylko elementy ze zgłoszenia. Zanim pokażesz warianty, zmierz na makiecie albo na żywej stronie:
- każdy blok tekstu: szerokość i liczbę wierszy;
- odstępy od krawędzi;
- kontrast każdego wskaźnika nietekstowego (≥ 3:1).

Wady spoza zgłoszenia pokaż w tej samej bramce co warianty, jako osobną decyzję.

Powiązane: [[makieta-storybook-z-klasami-aplikacji-jako-pomiar]].
