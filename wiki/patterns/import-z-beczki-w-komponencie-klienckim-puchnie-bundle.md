# import-z-beczki-w-komponencie-klienckim-puchnie-bundle

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Nowy komponent kliencki strony publicznej importuje jeden hook przez plik zbiorczy (`~/hooks`). Strona działa, testy, typy i lint są zielone, a pierwsze ładowanie strony rośnie o jedną trzecią.

## Przyczyna źródłowa
Plik zbiorczy importuje wszystkie hooki aplikacji z ich zależnościami, a bundler Next 14 nie odcina ich dla komponentu `use client`. Żadne sprawdzenie poza tabelą rozmiarów z `next build` tego nie pokazuje, a tabeli nikt nie czyta, gdy build kończy się kodem 0.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): `Reveal.tsx` z `import { useScrollAnimation } from '~/hooks'` podniósł „First Load JS” strony `/[locale]` z 249 kB do 379 kB. Zauważone przed commitem tylko dlatego, że porównałem linię strony z logu builda z wcześniejszymi logami; po imporcie wprost z `~/hooks/useScrollAnimation` strona ma 250 kB.

## Rozwiązanie
W komponencie `use client` na stronie publicznej importuj hooki i narzędzia wprost z ich pliku, nie z pliku zbiorczego katalogu. Po dodaniu komponentu klienckiego do strony publicznej porównaj linię tej strony w tabeli `next build` („First Load JS”) z poprzednim buildem i podaj obie liczby w raporcie.
