# clip-path-na-elemencie-interaktywnym-obcina-fokus

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pikselowe (wcięte) narożniki przycisków zrobione `clip-path` na samym przycisku obcinają obrys
fokusu z klawiatury. W arkuszu komponentów stan „Fokus z klawiatury” nie miał obrysu przez trzy
iteracje i nikt tego nie zauważył.

## Przyczyna źródłowa
`clip-path` przycina wszystko, co element rysuje poza swoją ścieżką, w tym `outline`
i zewnętrzne `box-shadow`. Stan fokusu był w makiecie statyczny, a audyt sprawdzał kontrast
tokenu fokusu, nie widoczność obrysu.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny): kierunek 3 miał
  `.btn.p{clip-path:var(--notch-i)}` od v1; błąd wyszedł przy przenoszeniu tych przycisków do
  kierunku 7 — porównanie wycinków pokazało brak obrysu w kierunku 3. Naprawa w obu kierunkach:
  wycięcie na warstwie `::before` (tło i faza), przycisk bez `clip-path`; sumy MD5 pokazały
  zmianę tylko arkusza komponentów. Ramki kierunku 7 zrobione wcześniej czterema przesuniętymi
  cieniami (technika NES.css) właśnie po to, by nie obcinać fokusu.

## Rozwiązanie
Kształt nieprostokątny elementu interaktywnego rysuj na warstwie tła (`::before` z `clip-path`)
albo cieniami, nigdy `clip-path` na samym elemencie. W arkuszu komponentów zawsze pokazuj stan
fokusu i sprawdź go na wycinku PNG.
