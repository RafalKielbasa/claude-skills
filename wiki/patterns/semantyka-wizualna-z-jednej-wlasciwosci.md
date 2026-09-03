# semantyka-wizualna-z-jednej-wlasciwosci

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude rozstrzyga, czym różnią się dwa warianty wizualne, na podstawie jednej
wybranej właściwości węzła zamiast na podstawie renderu. Wybrana właściwość
brzmi wiarygodnie, ale nie jest tym, co koduje różnicę, więc wniosek jest pewny
i błędny.

## Przyczyna źródłowa
Metadane węzła są tanie i strukturalne, render kosztuje osobne wywołanie, więc
odruchem jest wnioskowanie z metadanych. Nie ma jednak kroku, który sprawdza,
czy wybrany dyskryminator faktycznie rozróżnia parę znaną z tego, że się różni.
Właściwość, która akurat ma tę samą wartość w obu przypadkach, czyta się jako
dowód braku różnicy zamiast jako dowód, że mierzy się nie to.

## Dowody
- 2026-09-03, sesja session_01PKwz2sPWn4S4MPAStw2DuF: przy wyłuskiwaniu
  komponentu `LessonRow` z szyny kursu w Figmie ikona wiersza została uznana za
  ikonę typu lekcji na podstawie liczby i rozmiarów wektorów (12×12 plus mniejszy
  kształt). Po zbudowaniu sześciu wariantów `Stan` × `Typ` zrzut ekranu pokazał,
  że wariant „Wideo" niesie zielony znacznik ukończenia: ikona koduje stan
  (ukończona, bieżąca), a typ pokazuje dopiero przy lekcji nietkniętej.
  Rozstrzygnął dopiero odczyt kolorów (`#5EC26A`, `#7C82F4`, `#6E7079`)
  i porównanie renderu z oryginałem. Trzy komponenty skasowane i zbudowane od nowa.
- 2026-09-03, sesja session_01PKwz2sPWn4S4MPAStw2DuF: w tej samej szynie
  sprawdzenie, czy nagłówek sekcji potrzebuje wariantu rozwinięta/zwinięta,
  poszło przez `rotation` szewronu. Wszystkie trzy sekcje zwróciły `0`, więc
  zapadła decyzja o komponencie bez wariantów. Różnica siedziała w geometrii
  wektora: rozwinięta 8×4 w punkcie (4,6), zwinięta 4×8 w (6,4). Wariant trzeba
  było dorobić po fakcie.

## Rozwiązanie
Zanim z powtarzalnych elementów wyprowadzisz oś wariantów, wyrenderuj je i
porównaj obrazy, a nie same metadane. Gdy mimo to opierasz się na właściwości,
najpierw zwaliduj ją na parze, o której wiesz, że się różni: właściwość, która
dla tej pary zwraca tę samą wartość, jest odrzucona jako dyskryminator, a nie
dowodem, że różnicy nie ma. Przy ikonach i kolorach czytaj `fills` i `strokes`
razem z geometrią, bo znaczenie bywa zapisane wyłącznie w kolorze.
