# inwentarz-wymowy-od-listy-gubi-akronim-spoza-niej

- **Skill:** kurs-video (etap 1, przed płatnym TTS); też kurs-redakcja i kurs-uwagi
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przegląd wymowy przed renderem objął tylko słowa, które mają już wpis w `wymowa.md`. „API” wpisu nie miało, więc
lektor przeczytał je literami („A PE I”). Wyłapał to dopiero odsłuch Rafała w gotowym filmie. Poprawka samego zapisu
fonetycznego po nagraniu kosztuje cały łańcuch: nowy lektor lekcji, nowy avatar, nowy przebieg próbny i nowe ujęcie.

## Przyczyna źródłowa
Inwentarz szedł od listy do tekstu: każdy wpis `wymowa.md` → jego wystąpienia w scenariuszu. Słowa bez wpisu nie
widzi więc z definicji. Kierunek odwrotny nie jest krokiem żadnego skilla: każdy token, który TTS może przeczytać
po angielsku albo literami → czy ma wpis. Koszt kaskady bierze się z haszu: `zrodla-hasz` planu nagrania obejmuje
narrację. Zmiana samej wymowy unieważnia przebieg próbny, a `edl` odmawia ujęcia nagranego „dla innego planu”.

## Dowody
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny): lekcja agenty-ai 1.2.
  - Inwentarz przed renderem zmapował 5 wpisów (`Message`, `credential`, `AI`, `AI Agent`, `Anthropic Chat Model`)
    na linie scenariusza. Zauważył brak wpisu dla `Chat Model`, ale nie dla `API`.
  - Rafał po obejrzeniu: „klucz API czytaj jak klucz API a nie klucz A PE I”, potem wybór `api`.
  - Skutek: nowy lektor V4 całej lekcji, avatar segmentu 8 (MCP), przebieg runda 3 i ujęcie `v4d` po odmowie
    `edl --nadpisz` („nagranie powstało dla innego planu”). Commity `a0ed9773`, `16ba0b48`.

## Rozwiązanie
Przed płatnym TTS (etap 1 `/kurs-video`) i przy każdej redakcji narracji przejdź tekst lektora od tokenów do listy:
1. wypisz każdy skrót wersalikami (`\b[A-Z]{2,}\b`, bez `-i`) i każde słowo łacińskim alfabetem spoza polszczyzny;
2. sprawdź każde w `wymowa.md`;
3. słowa bez wpisu pokaż Rafałowi przed renderem, z propozycją zapisu albo próbką z
   `tools/course-pipeline/experiments/wymowa-proba.mjs`.
