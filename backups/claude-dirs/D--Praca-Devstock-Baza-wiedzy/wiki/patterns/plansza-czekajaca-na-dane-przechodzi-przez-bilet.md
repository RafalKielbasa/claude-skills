# plansza-czekajaca-na-dane-przechodzi-przez-bilet

- **Skill:** kurs-nagrywanie (karta bilet produkcyjny (G1)), kurs-video i kurs-montaz w trybie biletu
- **Typ:** porażka
- **Status:** otwarty

## Opis
Karta G1 przyjmuje `video/plansze.yaml` z planszą, której treść zależy od danych dostępnych tylko Rafałowi, z dopiskiem „po podaniu danych”. Etapy biletu idą bez bramek, więc prośba o dane wraca dopiero przy bramce film z kartą lekcji (G5). Film zostaje zaakceptowany bez planszy, a jej dołożenie kosztuje ponowny montaż, etap 2 i drugą bramkę G5.

## Przyczyna źródłowa
Bilet zapisuje odroczenie tylko w `notes`, a między G1 a G5 nie ma tury, w której prośba o dane trafia do Rafała sama. Ani `/kurs-montaz`, ani `/kurs-video` nie porównują `plansze.yaml` z konspektem, który zapowiada planszę („wpisane na planszę montażu `limity-zapytan`”). Brak planszy wychodzi więc dopiero na karcie lekcji, po renderze.

## Dowody
- 2026-11-03, sesja e1d033e0-b255-476e-aac9-b2900ad7d9a9 (id claude.ai niedostępny), lekcja agenty-ai 3.2:
  - Bilet z 2026-11-02 miał w `notes`: „plus limity-zapytan once Rafał gives the three Haiku 5.5 limits”.
  - Etap 1, montaż i etap 2 przeszły bez planszy, a karta dostała wpis `miejsce` „brak planszy limity-zapytan”.
  - Rafał zatwierdził film („zatwierdzam video”, `db0ed43f`), a zaraz potem napisał „Dołóż plansze z limitem zapytań”.
  - Dalej poszły: `montaz plansze`, montaż (19:06), etap 2 (22:14) i druga akceptacja (`da6a876a`).
  - Same liczby wymagały pięciu tur, zob. globalne `prosba-o-dane-podana-jako-wariant-z-domyslnym-ok`.

## Rozwiązanie
Do karty G1 w `kurs-nagrywanie`: „Plansza, której treść wymaga danych od Rafała (liczby z jego konta, zrzut z konsoli), jest na karcie G1 prośbą o dane, z adresem odczytu. Bilet nie powstaje z planszą »po podaniu danych«.”

Do `/kurs-montaz` w trybie biletu: „Gdy konspekt zapowiada planszę, której nie ma w `plansze.yaml`, prośba o dane idzie w pierwszej turze po etapie 1, przed montażem, a nie przy G5.”
