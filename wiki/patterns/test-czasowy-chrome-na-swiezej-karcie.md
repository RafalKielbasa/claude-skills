# test-czasowy-chrome-na-swiezej-karcie

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Test mierzący czas na wideo Playwrighta (plansza kalibracyjna, chwila przełączenia) przechodzi
samodzielnie i w kilku pełnych przebiegach, a pada pod obciążeniem: nagranie świeżo utworzonej karty
rusza później niż zdarzenie, które test w nim mierzy.

## Przyczyna źródłowa
Playwright zaczyna screencast nowej strony asynchronicznie po `newPage()`; pod obciążeniem CPU pierwsza
klatka przychodzi po setkach milisekund. Test skraca konfigurację względem produkcji (tam karty istnieją
sekundy przed planszą), więc tylko test trafia w okno startu nagrania.

## Dowody
- 2026-10-15, sesja ad16420c-5965-4484-a54d-32148a48f6ea (id claude.ai niedostępny), repo Baza wiedzy:
  sonda `tools/nagrywanie/test/tabs-probe.test.js` zielona w Tasku 1 (headless i z oknem) i w pełnym
  suicie, czerwona w kolejnym pełnym przebiegu: „Nie wykryto planszy synchronizacji” w wideo karty `b`.
  Analiza zachowanego wideo serią kolorów: `M:0.00-0.20  B:0.20-9.08` — nagranie zaczęło się w trakcie
  planszy 0,8 s, a detektor wymaga 0,4 s. Samodzielnie 3/3 zielone. Poprawka `241135bd`: `sleep(1500)`
  przed planszami, jak w produkcji.

## Rozwiązanie
Test czasowy na wideo Playwrighta zaczyna pomiar dopiero po rozgrzewce strony porównywalnej z produkcją
(≥ 1–1,5 s nagrywania przed pierwszym zdarzeniem). Niestabilność diagnozować na zachowanym pliku:
wypisać serie kolorów klatek (`ffmpeg -vf fps=25,scale=1:1 -f rawvideo`) i sprawdzić, kiedy wideo się
zaczyna, zanim cokolwiek zmieni się w progach.
