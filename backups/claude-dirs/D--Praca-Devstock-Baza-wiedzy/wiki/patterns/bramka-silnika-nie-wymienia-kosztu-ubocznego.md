# bramka-silnika-nie-wymienia-kosztu-ubocznego

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Bramka wyboru silnika avatara (krok 2) stawia `mcp` i `api` jako wybór źródła
rozliczenia: plan konta HeyGen kontra kredyty API. Nie mówi, że ścieżka `mcp`
płaci dodatkowo po stronie ElevenLabs — `--plan-avatara` generuje audio chunków
avatarowych, a późniejszy pełny render przelicza łańcuch całej lekcji od nowa,
razem z tymi samymi chunkami.

## Przyczyna źródłowa
Koszt uboczny jest opisany w kroku 4 skilla, w nawiasie („pełny render po nim
policzy łańcuch lekcji od nowa — to zamierzone"), czyli w kroku, który czyta się
PO podjęciu decyzji. Bramka ma pełny opis skutku finansowego jednej osi (skąd
schodzą pieniądze) i zero o drugiej (ile ich schodzi). Cache TTS jest per lekcja,
nie per plik, więc nie da się go obejść — tryb planu i pełny render to z definicji
dwa różne łańcuchy.

## Dowody
- 2026-09-22, sesja (id niedostępny): lekcja `agenty-ai` 3.1, dwa segmenty
  avatarowe (1 i 10), narracja całej lekcji ~17 000 znaków. `--plan-avatara`
  o 16:09 wygenerował `video/audio/01.mp3` (1 643 877 B) i `05.mp3`
  (1 574 914 B). Pełny render `--avatar=mcp` nadpisał oba: `01.mp3` o 16:17
  (1 670 626 B), `05.mp3` o 16:20 (1 556 942 B) — **inne rozmiary**, czyli
  realnie przeliczone, nie odtworzone z cache. Ok. 3,4 tys. znaków zapłacone
  dwa razy, czyli ~20% narzutu wobec ścieżki `api`. Rafał wybierał silnik,
  mając przed sobą wyłącznie oś „plan konta kontra kredyty API".
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai
  niedostępny): lekcja `agenty-ai` 1.1, trzy segmenty avatarowe (1, 6, 8),
  ~3,3 tys. z ~9,45 tys. znaków lekcji. Pełny render nadpisał `01.mp3`
  (993 114 → 1 001 891 B), `06.mp3` (1 072 526 → 1 098 021 B) i `08.mp3`
  (986 844 → 989 352 B), więc narzut wyniósł ~35%. Moja własna bramka podała
  „TTS całej lekcji ~9 450 znaków (~1 $)”, bez podwójnego TTS avatarów, czyli
  ten sam brak, tym razem w treści bramki, którą napisałem sam. Skutek uboczny
  tego samego mechanizmu: `druga-kontrola-lektora-ocenia-audio-avatarow-spoza-filmu`.

## Rozwiązanie
Do opisu opcji `mcp` w bramce kroku 2 dopisać jedno zdanie: „chunki avatarowe
idą przez ElevenLabs dwa razy — raz w trybie planu, raz w pełnym renderze".
Przed pytaniem policzyć znaki segmentów `[ekran: avatar]` i podać narzut
liczbą, żeby wybór był świadomy po obu osiach: skąd schodzą pieniądze i ile
ich schodzi.
