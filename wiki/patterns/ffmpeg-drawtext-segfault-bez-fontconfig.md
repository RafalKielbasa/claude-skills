# ffmpeg-drawtext-segfault-bez-fontconfig

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`ffmpeg` z filtrem `drawtext` (np. podpis czasu na klatce kontrolnej) kończy się `Segmentation fault`. Wcześniej pada
komunikat „Fontconfig error: Cannot load default config file: File not found”. Nie powstaje żadna klatka.

## Przyczyna źródłowa
Build ffmpeg na tej maszynie z Windowsem ma `drawtext` z fontconfig, ale bez pliku konfiguracji fontconfig. Bez
`fontfile=` filtr szuka domyślnego fontu przez fontconfig i pada, zamiast zwrócić błąd.

## Dowody
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny, repo Baza wiedzy):
  - klatki z `nagranie-z-lektorem.mp4` do sprawdzenia synchronizacji czatu;
  - komenda `-vf "crop=…,scale=480:-1,drawtext=text='$t':…"` dała dwa segfaulty z rzędu;
  - obejście: klatki bez podpisów, czas zakodowany w nazwie pliku.

## Rozwiązanie
- Do etykiet na klatkach nie używaj `drawtext`. Czas zapisuj w nazwie pliku.
- Gdy napis musi być w obrazie, podaj `fontfile=` z jawną ścieżką (np. `C\:/Windows/Fonts/arial.ttf`).
  Ten wariant jest niesprawdzony: najpierw przetestuj go na jednej klatce, dopiero potem użyj w pętli.
