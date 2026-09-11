# zrzut-ekranu-w-tresci-uwagi

- **Skill:** kurs-uwagi
- **Typ:** sukces
- **Status:** otwarty

## Opis

Rafał wkleił do trzech uwag ścieżki do zrzutów ekranu z Greenshota, wprost w treść znacznika
`[UWAGA: ...]`. Otwarcie tych plików zamieniło trzy ogólne sygnały w dokładne poprawki i wyjęło je
z puli pytań do bramki.

## Przyczyna źródłowa

Uwaga o interfejsie jest z samego tekstu prawie nie do naniesienia. „Input nie jest jawny" nie mówi,
co wobec tego pokazać na ekranie; „nie widzę treści opisu w trybie automatycznym" nie mówi, co widać
zamiast niej. Zrzut ekranu niesie dokładnie tę informację, a znacznik jest zwykłą linią tekstu, więc
ścieżka do pliku mieści się w nim bez żadnej zmiany formatu i bez osobnego pliku obok.

## Dowody

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: trzy zrzuty rozstrzygnęły trzy uwagi. Pierwszy
  pokazał węzeł „AI Agent" bez śladu ostrzeżenia o braku narzędzia. Drugi i trzeci — że pole
  `"Tool Description"` w trybie `"Set Automatically"` nie pokazuje treści, a po przełączeniu na
  `"Set Manually"` widać w nim `Get many messages in Gmail`. Czwarty — że panel wykonania pokazuje
  ładunek wyzwalacza czatu plus komunikat `No parameters are set up to be filled by AI`, a nie
  parametry od modelu. Piąty — że lista narzędzi jest podzielona na kategorie i wtyczki do usług
  siedzą pod `"Action in an app"`. Bez otwarcia tych plików każda z tych uwag poszłaby do pytań na
  bramce jako sygnał bez wskazanej naprawy.

## Rozwiązanie

W kroku 2 (inwentarz) wykrywać w treści uwagi ścieżkę do pliku graficznego i otworzyć ją przed
klasyfikacją; w tabeli inwentarza zaznaczyć, że zrzut został odczytany. Uwaga ze zrzutem prawie nigdy
nie należy do pytań kroku 3 — obraz rozstrzyga to, co tekst zostawia otwarte, więc naniesienie jest
wtedy poprawką faktu, nie zgadywaniem intencji.
