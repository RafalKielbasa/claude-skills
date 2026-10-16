# druga-kontrola-lektora-ocenia-audio-avatarow-spoza-filmu

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Na ścieżce `mcp` kontrola lektora po pełnym renderze (krok 4b, drugi przebieg) zgłasza „inne słowo” w chunku avatara, a tego audio nie ma w filmie. Bez sprawdzenia trafiłoby to do bramki 5 jako miejsce do odsłuchu. W gorszym razie skończyłoby się poprawką scenariusza i płatnym nowym audio całej lekcji.

## Przyczyna źródłowa
Pełny render liczy łańcuch TTS od nowa, razem z chunkami avatarów (zob. `bramka-silnika-nie-wymienia-kosztu-ubocznego`), i nadpisuje `video/audio/NN.mp3`. Avatar w filmie gra jednak audio wgrane do HeyGen w pierwszym przebiegu: klip `klipy/NN.mp4` ma długość nagrania HeyGen, a nie nowego mp3. `kontrola-lektora` czyta `video/audio/NN.mp3` dla wszystkich chunków, więc przy avatarach ocenia audio z drugiego przebiegu.

## Dowody
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): lekcja agenty-ai 1.1, avatary 01, 06 i 08.
  - Pierwsza kontrola (po `--plan-avatara`): 01 i 06 bez problemów, w 08 tylko zapis „N8N”.
  - Pełny render nadpisał mp3 avatarów: 993 114 → 1 001 891 B, 1 072 526 → 1 098 021 B i 986 844 → 989 352 B.
  - Druga kontrola zgłosiła w `01.mp3` przy 0:57.60 „zatrudnianiem” → „zatrudnieniem”.
  - Rozstrzygnęło porównanie długości: `klipy/01.mp4` ma 61,975 s, tyle co avatar HeyGen, a nowe `01.mp3` ma 62,56 s. Uwaga nie poszła do odsłuchu.

## Rozwiązanie
Do kroku 4b `kurs-video`: „Na ścieżce `mcp` uwagi do chunków avatarów bierz z pierwszego przebiegu (po 4a), bo ten dźwięk gra w filmie. Drugi przebieg (po 4c) jest miarodajny tylko dla chunków slajdów i screencastów. Uwaga w chunku avatara z drugiego przebiegu dotyczy audio spoza filmu.” Docelowo `kontrola-lektora` powinna dla chunku avatara czytać audio z `video/avatar/NN-<hasz>.mp4`, jeśli plik istnieje.
