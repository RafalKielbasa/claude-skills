# sciaga-nagraniowa-blokuje-etap-ktory-jej-nie-czyta

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Bramka wejścia `/kurs-video` przy `typ_video: demo` każe odesłać do
`/kurs-lekcja` krok 8, gdy brakuje `video/dane-do-nagrania.md`. Etap 1 toru B —
płatne TTS paczki lektora i avatary HeyGen — tego pliku nie czyta ani razu.
Czyta go wyłącznie generator planu (`readCheatSheet`, `src/plan-nagrania.js:527`),
żeby dołożyć kolumnę „Do wpisania", i przy jego braku wypisuje ostrzeżenie,
a plan i tak składa.

## Przyczyna źródłowa
Warunek jest warunkiem **nagrywania** (ściąga ma być w ręku przy włączonej
kamerze), ale stoi w bramce **renderu**, który nagrywania nie dotyczy i
wykonuje się przed nim. Skill sam dzieli tor B na dwa etapy — materiały i
spięcie — ale bramka wejścia jest jedna i nie pyta, w którym etapie stoimy,
mimo że etap rozpoznaje kilka linijek niżej po obecności
`video/nagranie-z-lektorem.mp4`.

## Dowody
- 2026-09-22, sesja (id niedostępny): lekcja `agenty-ai` 3.1 nie miała
  `video/dane-do-nagrania.md`. `npm run plan-nagrania` wypisał
  `OSTRZEŻENIE: brak video/dane-do-nagrania.md - plan bez kolumny "Do wpisania"
  (ściągę pisze /kurs-lekcja, krok 8)` i mimo to zbudował plan (35 kB).
  Zamiast odesłać Rafała, jak każe krok 1 skilla, pytanie poszło do niego
  razem z pytaniem o silnik avatara; wybrał „Renderuj teraz, ściąga potem".
  Etap 1 przeszedł do końca (paczka lektora `02–04.mp3` + `spis.md`, dwa
  avatary) bez jednego odwołania do brakującego pliku — odesłanie kosztowałoby
  dzień zwłoki na materiałach, które ze ściągą nie mają nic wspólnego.

## Rozwiązanie
W kroku 1 skilla rozdzielić warunki po etapie, tak jak skill rozdziela sam
render. Brak `video/dane-do-nagrania.md` przy braku
`video/nagranie-z-lektorem.mp4` (czyli na etapie materiałów) → ostrzeżenie
w raporcie plus zdanie „ściągę dopisz przez `/kurs-lekcja` krok 8 zanim
włączysz nagrywanie", i render idzie dalej. Twarde odesłanie zostawić tylko
tam, gdzie następnym krokiem faktycznie jest nagrywanie.
