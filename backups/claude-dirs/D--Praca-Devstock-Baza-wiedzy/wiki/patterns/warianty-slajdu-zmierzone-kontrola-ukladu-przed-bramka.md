# warianty-slajdu-zmierzone-kontrola-ukladu-przed-bramka

- **Skill:** kurs-video
- **Typ:** sukces
- **Status:** otwarty

## Opis
Kontrola układu odrzuciła slajd, więc według kroku 3 trzeba wrócić do treści, czyli do decyzji Rafała. Zanim zadałem pytanie, sprawdziłem trzy warianty poprawki tą samą kontrolą na kopii lekcji w scratchpadzie. Do bramki poszły tylko warianty, które się mieszczą, ze zrzutami, i Rafał wybrał jednym słowem („D1 A”).

## Przyczyna źródłowa
`kontrola-ukladu` przyjmuje dowolny katalog lekcji (`node src/cli.js kontrola-ukladu <katalog> -o <wyjście>`), nic nie kosztuje i trwa kilkanaście sekund. Dzięki temu „czy się zmieści” da się zmierzyć przed pytaniem i nie trzeba tego szacować. Bez pomiaru wariant wybrany w bramce mógłby nie przejść kontroli i bramka wróciłaby drugi raz. Tak by się stało z wariantem B (8 krótkich wierszy plus skrócony lead): wyglądał na mieszczący się, a nie przeszedł.

## Dowody
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): lekcja agenty-ai 1.1, slajd 5 (tabela 8 wierszy z leadem) przepełniony na motywie `agenci-ai-konsola`. Kopie lekcji z `kurs.yaml` w trzech katalogach scratchpadu. Pierwszy przebieg wszystkich trzech padł na `zlozDeck`: sierotka „Mail z potwierdzeniem”, bo nowy tekst nie miał U+00A0 po jednoliterowych słowach. Po wstawieniu U+00A0 wynik był taki:
  - A (8 wierszy w jednej linii, bez leadu): „OK”;
  - C (3 wiersze według werdyktu, z leadem): „OK”;
  - B: „przepełnienie: TD „Zmiana stawki VAT”…”.
  Wybrany wariant A przeszedł potem kontrolę na prawdziwej lekcji bez zmian.

## Rozwiązanie
Do kroku 3 `kurs-video`, przy „Problem w raporcie = zatrzymaj się i wróć do /kurs-lekcja”: „Zanim zapytasz o poprawkę, sprawdź 2–3 warianty slajdu na kopii lekcji w scratchpadzie (`kontrola-ukladu <kopia> -o <katalog>`). W nowym tekście wstaw U+00A0 po `a i o u w z`, bo inaczej `zlozDeck` odmówi. Do bramki daj tylko warianty z wynikiem OK, każdy ze zrzutem slajdu.” Ten sam mechanizm co w globalnym `symulacja-doboru-osi-przed-bramka-zatwierdzenia`.
