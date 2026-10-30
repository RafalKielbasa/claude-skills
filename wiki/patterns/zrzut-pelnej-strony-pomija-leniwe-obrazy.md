# zrzut-pelnej-strony-pomija-leniwe-obrazy

- **Skill:** ogólny (harness bramki wizualnej, Playwright)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zrzut całej strony (`page.screenshot({ fullPage: true })`) zostawia puste miejsca po obrazach daleko pod
pierwszym ekranem. Raport bramki tego nie widzi, bo nie ma ani nieudanego żądania, ani błędu konsoli —
obraz po prostu nigdy nie zaczął się ładować. Na arkuszu wygląda to jak zepsuta strona.

## Przyczyna źródłowa
`next/image` (i każde `<img loading="lazy">`) korzysta z natywnego leniwego ładowania. Chromium zaczyna
pobierać taki obraz dopiero, gdy wejdzie w próg odległości od widocznego okna. Zrzut całej strony zszywa obraz
bez przewijania, więc obrazy dalej niż próg od pierwszego ekranu zostają nietknięte. Na krótszych stronach
(lista bloga, ~2100 px) problem się nie pokazuje, więc harness przechodzi pierwsze strumienie bez śladu.

## Dowody
- 2026-10-30, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, bramka W4):
  wpis bloga ma ~5200 px; okładki „Zobacz także” na samym dole były puste we wszystkich motywach i szerokościach,
  a okładki w panelu bocznym (wyżej) się załadowały. Raport przebiegu 1 nie miał w tym miejscu żadnego wpisu.
  Złapane tylko obejrzeniem zrzutu; poprawka `loadLazyImages` w `e2e/gate/capture.spec.ts` (`3b5bafe17`),
  w przebiegu 2 okładki obecne.

## Rozwiązanie
Przed zrzutem całej strony przewiń stronę w krokach wysokości okna do końca i z powrotem na górę, potem poczekaj
(z limitem czasu, bez wywracania przypadku), aż każdy `img` w `document.images` ma `complete === true` — obraz,
który się nie załadował (np. 403 z S3), też jest `complete`. Rób to w harnessie raz dla wszystkich tras, nie
w aplikacji (nie zmieniaj `loading` na `eager`). Przy pierwszym arkuszu nowego harnessu obejrzyj co najmniej
jedną najdłuższą stronę do samego dołu.
