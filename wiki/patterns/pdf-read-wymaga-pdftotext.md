# pdf-read-wymaga-pdftotext

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wbudowane narzędzie `Read` nie wyciąga treści z plików PDF w tym środowisku —
zwraca błąd o braku `pdftoppm` zamiast tekstu stron.

## Przyczyna źródłowa
Odczyt PDF przez `Read` renderuje strony przez `pdftoppm` z pakietu poppler.
W tym środowisku (Windows, bez WSL) tego binarium nie ma ani zainstalowanego,
ani w `PATH`, więc narzędzie nie ma jak przekonwertować stron do przetwarzalnej
postaci. Dostępny jest za to `pdftotext` z pakietu mingw64.

## Dowody
- 2026-09-02, sesja session_019Hub3mysiz4zztWAWESMQn: użytkownik dodał
  `nauka/tech/agenci-ai/wikiskill-google-research-2026.pdf` i poprosił
  o omówienie; `Read` zwrócił błąd braku `pdftoppm`, obejściem było
  `pdftotext -layout <plik> <wyjście>` z mingw64, które poprawnie wydobyło
  tekst 28-stronicowego artykułu wraz z załącznikami.

## Rozwiązanie
Przy pliku PDF w tym środowisku nie zaczynać od `Read` — od razu użyć
`pdftotext -layout <ścieżka.pdf> <plik-wyjściowy.txt>` i pracować na wyjściu
tekstowym. Oszczędza to cykl próba-błąd-obejście przy każdym PDF.
