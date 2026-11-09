# makieta-storybook-z-klasami-aplikacji-jako-pomiar

- **Skill:** konsultant-ux-kodozercy
- **Typ:** sukces
- **Status:** otwarty

## Opis
Żywa platforma nie miała danych ekranu: na prodzie nie było lekcji próbnej, a worktree nie miał `.env`. Makiety w Storybooku repo aplikacji, z klasami skopiowanymi z komponentów i z odczytem liczb na samej makiecie, dały pomiar, na którym oparto pięć decyzji i wpis w `decyzje.md`.

## Przyczyna źródłowa
Skill zakłada zrzut „przed” z żywej aplikacji i grafiki w folderze tymczasowym poza repo. Gdy ekran istnieje w kodzie, ale nie ma danych, nie ma też zrzutu. Rekonstrukcja z tymi samymi klasami Tailwinda i tokenami daje te same wymiary co aplikacja, a odczyt na makiecie zamienia wrażenie w liczbę.

## Dowody
- 2026-11-09, sesja 0facbde7-f16e-4ba0-a2f0-b304f63f372a (id claude.ai niedostępny; DT-81, `/free-lesson`).
  - Makiety leżały w `packages/ui/src/mockups/free-lesson-phone/`: obecny układ, warianty A, B i C, story `HeaderTitle` i `PendingSegments`, viewport iPhone 12 (390 × 844).
  - Odczyty dały:
    - tytuł w kolumnie 156 px na 4–5 wierszach;
    - kontrast tokenów z tłem nagłówka: `track` 1,00, `px-line` 1,54, `control-line` 3,97 (motyw ciemny).
  - Rafał wybrał warianty po zrzutach.
  - Przed PR makiety usunięto: były nieśledzone w gicie, a zrzuty zostały w scratchpadzie.
  - Do PR weszła tylko poprawka konfiguracji Storybooka (`colors.js` w `optimizeDeps`), bez której żadne story się nie ładowało.

## Rozwiązanie
Gdy żywa strona nie pokazuje danego stanu ekranu, zrób makietę w Storybooku repo aplikacji:
- klasy skopiuj z komponentów, a w story umieść odczyt liczb (szerokości, liczba wierszy, kontrast);
- makiet nie commituj i usuń je przed PR, a zrzuty zachowaj poza repo;
- w dokumentach podawaj źródło pomiaru („makieta 390 × 844 z klasami komponentów”), nie „zrzut”.

Powiązane: [[analiza-waskiego-ekranu-ograniczona-do-zgloszenia]].
