# font-dekoracyjny-sprawdzony-renderem-znakow

- **Skill:** konsultant-ux-kodozercy
- **Typ:** sukces
- **Status:** otwarty

## Opis
Krój wyświetlaczowy (pikselowy, szeroki „kosmiczny”) wybrany do makiety ma pojedyncze znaki,
które w rozmiarach interfejsu czytają się jak inne. Ujawnia to dopiero render konkretnych cyfr
i znaków, nie nazwa fontu ani nagłówek w dużym rozmiarze.

## Przyczyna źródłowa
Fonty dekoracyjne projektuje się pod hasła w dużym rozmiarze; cyfry, `%` i rzadsze litery bywają
stylizowane kosztem odróżnialności, a polskie znaki bywają niekompletne. W grywalizacji liczby
(XP, ranking, procent postępu) niosą informację, więc jeden mylący glif zmienia treść.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny): Pixelify Sans (font ładowany dziś przez
  platformę) w licznikach — „1 240” czytało się jak „1 840”, „Czołem” jak „Ozołem”; grubość 400
  nie pomogła. Test renderu („C 2 Z Czołem 1240 Zaktualizowano” w 48 i 24 px obok Jersey 10,
  Tiny5, Silkscreen) pokazał przyczynę w samym kroju; Silkscreen nie ma polskich znaków.
- 2026-10-14, ta sama sesja: Michroma (w duchu Eurostile, kierunek „2001”) — polskie znaki
  komplet, ale na dashboardzie „42%” czytało się jak „420/o”, bo `%` w tym kroju to „0/o”.
  Michroma została w nagłówkach i dużych liczbach, procenty i liczniki w Lexend Deca.

## Rozwiązanie
Przed użyciem kroju dekoracyjnego wyrenderuj próbkę w docelowych rozmiarach (nagłówek
i 14–24 px): „Czołem 1 240 2 210 320 42% ąęśćżźłń C0 2Z” i obejrzyj PNG. Krój, który myli cyfry
albo `%`, zostaje wyłącznie w nagłówkach i dużych liczbach bez znaków specjalnych; liczby
w treści, procenty i liczniki idą w foncie interfejsu.
