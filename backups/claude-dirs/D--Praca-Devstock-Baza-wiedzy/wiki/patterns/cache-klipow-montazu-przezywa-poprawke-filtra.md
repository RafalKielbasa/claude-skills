# cache-klipow-montazu-przezywa-poprawke-filtra

- **Skill:** kurs-montaz (narzędzie `tools/course-pipeline`, `src/montaz-render.js`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Po poprawce w kodzie filtra montażu render dalej pokazywał stary defekt. Niezmienione akapity przyszły z cache klipów,
więc poprawka wyglądała na nieskuteczną, dopóki nie podbiłem ręcznie stałej wersji.

## Przyczyna źródłowa
Klucz cache klipu akapitu (`montaz-render.js:390-394`) to hasz danych wejściowych: EDL, zaznaczeń, wymiarów i odcisku
pliku źródła. Do tego dochodzi ręcznie prowadzona stała `WERSJA_RENDERU` (`montaz-render.js:48`). Kod, który z tych
danych buduje graf ffmpeg (`zbudujFiltrKlipu` i funkcje przez nią wołane), do klucza nie wchodzi. Zmiana w funkcji
filtra bez podbicia stałej daje więc ten sam klucz.

## Dowody
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny):
  - nowy efekt `rozmycie` (`warstwaRozmycia`) dawał zielone kreski na krawędzi prostokąta;
  - poprawka `format=yuv444p` przed `gblur` przeszła testy, a klipy z cache nadal miały kreski;
  - dopiero zmiana `WERSJA_RENDERU` z 5 na 6 wymusiła nowy render (`faf40bc2`).

## Rozwiązanie
- Każda zmiana w kodzie budującym filtry klipu podbija `WERSJA_RENDERU` w tym samym commicie.
- Gdy po poprawce render pokazuje stary defekt, najpierw sprawdź, czy klip nie przyszedł z cache.
- Docelowo do klucza cache wchodzi hasz źródła modułu renderu.
