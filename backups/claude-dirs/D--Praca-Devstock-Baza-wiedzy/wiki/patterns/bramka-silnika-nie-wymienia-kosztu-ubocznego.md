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

## Rozwiązanie
Do opisu opcji `mcp` w bramce kroku 2 dopisać jedno zdanie: „chunki avatarowe
idą przez ElevenLabs dwa razy — raz w trybie planu, raz w pełnym renderze".
Przed pytaniem policzyć znaki segmentów `[ekran: avatar]` i podać narzut
liczbą, żeby wybór był świadomy po obu osiach: skąd schodzą pieniądze i ile
ich schodzi.
