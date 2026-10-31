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
- 2026-10-31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, bramka regresji W5),
  skutek uboczny poprawki: po `loadLazyImages` zrzut idzie przy niezerowym przewinięciu, więc lepki pasek boczny,
  pasek górny i dialogi `fixed` lądują na zrzucie całej strony setki pikseli niżej niż w arkuszach W1–W3
  (zaakceptowanych przed `3b5bafe17`). Różnice pikselowe 0.05–0.71 na zrzutach jasnych i dialogowych przy zerowych
  licznikach bramki; maskują prawdziwe różnice pod warstwami `sticky`/`fixed`. Nie sprawdzone, czy przesunięcie
  było już przed W5. Pozycja 43 w #833.

## Rozwiązanie
Przed zrzutem całej strony przewiń stronę w krokach wysokości okna do końca i z powrotem na górę, potem poczekaj
(z limitem czasu, bez wywracania przypadku), aż każdy `img` w `document.images` ma `complete === true` — obraz,
który się nie załadował (np. 403 z S3), też jest `complete`. Rób to w harnessie raz dla wszystkich tras, nie
w aplikacji (nie zmieniaj `loading` na `eager`). Przy pierwszym arkuszu nowego harnessu obejrzyj co najmniej
jedną najdłuższą stronę do samego dołu. Po powrocie na górę potwierdź `window.scrollY === 0` (i poczekaj klatkę)
tuż przed zrzutem — inaczej warstwy `sticky`/`fixed` zszyją się w złym miejscu; zmiana harnessu unieważnia
porównania z arkuszami zrobionymi starą wersją, więc nowy arkusz wzorcowy albo bisekcja na starym commicie.
