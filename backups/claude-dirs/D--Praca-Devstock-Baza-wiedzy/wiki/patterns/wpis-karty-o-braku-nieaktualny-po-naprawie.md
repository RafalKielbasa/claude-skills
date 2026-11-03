# wpis-karty-o-braku-nieaktualny-po-naprawie

- **Skill:** kurs-video (karta lekcji, `npm run karta`), też kurs-montaz
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wpis `miejsce` na karcie lekcji opisuje brak, np. „brak planszy X”. Po naprawie w tej samej lekcji wpis zostaje i `karta buduj` dalej pokazuje Rafałowi nieprawdę przy kolejnej bramce G5.

## Przyczyna źródłowa
`karta` ma tylko `dopisz` i `buduj`, bo karta jest dziennikiem. Wpis `miejsce` opisuje jednak stan, nie zdarzenie, więc naprawa go unieważnia. Do zmiany albo usunięcia wpisu nie ma komendy, a ponowny `buduj` niczego nie wykrywa.

## Dowody
- 2026-11-03, sesja e1d033e0-b255-476e-aac9-b2900ad7d9a9 (id claude.ai niedostępny), lekcja agenty-ai 3.2:
  - Po dołożeniu planszy `limity-zapytan` wpis „brak planszy limity-zapytan…” w `video/karta.json:776` przeżył `karta buduj`.
  - Pole `co` zmieniłem ręcznie na opis dołożonej planszy z miejscem do obejrzenia (8:27–8:47) i zrobiłem `buduj` (commit `a715b1b4`).

## Rozwiązanie
Do `kurs-video`, przy G5 w trybie biletu: „Wpis `miejsce` o braku, który naprawiasz w tej samej lekcji, zamieniasz w `video/karta.json` (pole `co`) na opis naprawy z miejscem do obejrzenia, potem `karta buduj`. Nie dopisujesz drugiego wpisu, który przeczy pierwszemu.”

Docelowo `karta` dostaje komendę zmiany wpisu z walidacją jak przy `dopisz`.
