# audyt-i-niezalezne-review-przed-bramka-konceptu

- **Skill:** konsultant-ux-kodozercy
- **Typ:** sukces
- **Status:** otwarty

## Opis
Automatyczny audyt wyrenderowanych makiet i dwóch niezależnych recenzentów wykryli przed bramką
błędy, których autor makiet nie widział: dark pattern przy CTA okresu próbnego, brak fokusu,
kontury pól poniżej 3:1, serię wyróżnioną mocniej niż naukę, tekst 10–11 px i cele dotyku
poniżej 44 px.

## Przyczyna źródłowa
Autor ocenia własną pracę przez pryzmat zamiaru. Skill każe ocenić według sekcji 3 i obejrzeć
PNG, ale nie każe mierzyć (kontrast każdego tekstu do efektywnego tła, rozmiary, cele dotyku)
ani oddać oceny komuś bez kontekstu tworzenia.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny): `audyt.js` (Playwright) na 27, potem
  77 ekranach — przed poprawkami 6 tekstów pod progiem kontrastu, do 45 tekstów < 12 px i do
  5 celów < 44 px na ekran, 9–13 rozmiarów fontu; po poprawkach 0/0/0 i 4–8. Recenzent
  „charakter i sprzedaż”: brak informacji o karcie przy „7 dni za 0 zł” (forced continuity),
  seria przed nauką. Recenzent „czytelność”: brak `:focus-visible`, kontury pól 1,42–1,89:1.
  Wszystko wprowadzone przed zapisem do `platforma/`.
- Ta sama sesja: audyt miał własną lukę (tło w `::before` niewidoczne → 21 fałszywych błędów
  na przyciskach); poprawiony w kodzie audytu, a nie wyjaśniony słownie.
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): pakiet ekranów dla niezalogowanego (oś czasu, próbka, koniec próbki,
  rejestracja z planem, przebudowany landing i katalog) przygotowany przez subagenta z audytem
  kontrastu w obu motywach kierunku 8: 0 błędów w nowych miejscach, a audyt wskazał problem
  istniejący już w makiecie — etykieta zakładki mobile w motywie jasnym 4,19:1, poprawka:
  etykieta w kolorze `text`. Motywu jasnego nikt jeszcze nie oglądał poza makietą, więc audyt był
  jedynym pomiarem jego czytelności przed bramką.

## Rozwiązanie
Przed bramką konceptu z wieloma ekranami: (1) zmierz automatycznie kontrast każdego tekstu
względem efektywnego tła (z pseudo-elementami), teksty < 12 px, cele dotyku < 44 px w mobile
i liczbę rozmiarów fontu na ekran; (2) oddaj PNG dwóm niezależnym recenzentom z różnymi
soczewkami (czytelność i nauka; charakter, motywacja, sprzedaż); ich ustaleń nie przyjmuj bez
sprawdzenia w kodzie makiety.
