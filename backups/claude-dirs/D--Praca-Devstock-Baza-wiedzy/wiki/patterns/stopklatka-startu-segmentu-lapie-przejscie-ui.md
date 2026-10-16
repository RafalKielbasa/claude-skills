# stopklatka-startu-segmentu-lapie-przejscie-ui

- **Skill:** kurs-montaz
- **Typ:** porażka
- **Status:** otwarty

## Opis
Akapit „▶ START SEGMENTU” ze stopklatką (`do: null`) pokazał przez cały akapit, czyli ponad 5 s, klatkę ze środka animacji interfejsu (panel w połowie chowania się). Arkusze kontrolne i bramka próbki tego nie złapały. Złapał to dopiero Rafał w `final.mp4`.

## Przyczyna źródłowa
Automat ustawia `od` stopklatki na znaczniku początku pierwszego kroku segmentu. W tej samej chwili może jeszcze trwać animacja z poprzedniego kroku: zamykanie panelu albo przejście widoku. Render bierze ostatnią klatkę zakresu [od, od + 0,1 s] (`KAWALEK_STOPKLATKI_S`, `tools/course-pipeline/src/montaz-edl.js:58`), więc wystarczy przejście startujące 0,02 s po `od`. Pojedynczy kafel stykówki nie niesie informacji o ruchu, dlatego panel w połowie drogi wygląda na nim jak zwykły stan ekranu.

## Dowody
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): lekcja agenty-ai 0.3, akapit 8:1. `od` z automatu wynosiło 248,58 s, a panel AI Nodes zaczyna się chować ok. 248,6 s. Rafał: „Około 12:32 jest kadr który wskazuje na zawieszenie się obrazu” oraz „przejście trwa dosłownie ułamek sekundy, a nie wiele sekund jak na filmiku”. Poprawka: `od` 248,45, montaż i etap 2 wyrenderowane od nowa. Pozostałe stopklatki startów (2:1–7:1 i 3:4) sprawdzone klatka po klatce i były nieruchome.

## Rozwiązanie
Do kroku 5 `kurs-montaz` (przed pokazaniem próbki i przed pełnym renderem): „Dla każdego akapitu z `do: null` porównaj klatki w `od - 0,3`, `od` i `od + 0,1` (ffmpeg, różnica pikseli). Jeśli się różnią, stopklatka łapie przejście: przesuń `od` wcześniej, na ostatnią nieruchomą klatkę przed nim. Kafel stykówki nie wystarcza, bo nie pokazuje ruchu.” Docelowo `montaz sprawdz` mógłby ostrzegać, gdy okno [od, od + 0,1] nie jest nieruchome.
