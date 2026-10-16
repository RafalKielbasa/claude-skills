# kotwica-odslony-z-ogolnych-slow-trafia-za-wczesnie

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kotwica odsłony zbudowana z ogólnych słów segmentu („Agent dostaje coś innego”) trafiła kilka sekund przed zdaniem, którego dotyczyła. Punkt wjechałby wtedy, zanim lektor o nim powie. Przy okazji podgląd odsłon wyglądał tak, jakby kotwice nic nie zmieniły, bo czytałem nie ten plik.

## Przyczyna źródłowa
`align()` (`tools/course-pipeline/src/odslony-dopasowanie.js`) dopasowuje kotwicę jako zbiór słów kluczowych. Bierze **najwcześniejszego** kandydata z wynikiem ≥ max(0,62; najlepszy − 0,08) w oknie za poprzednim punktem. Słowa częste w segmencie („agent”, „dostaje”) dają dobre wyniki już we wcześniejszym zdaniu. Osobna sprawa: `npm run odslony` zapisuje podgląd do `klipy/odslony/dopasowanie-podglad.md`, a `dopasowanie.md` zostaje z ostatniego renderu.

Automat bez kotwic myli się z innego powodu. Wybiera fragment, który najdosłowniej powtarza tekst punktu. Dlatego na slajdzie z przykładem kolumny wjechały przy przykładzie, a nie przy pytaniu, które je wprowadza.

## Dowody
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): lekcja agenty-ai 1.1.
  - Przegląd `dopasowanie.md` po renderze złapał, że kolumny slajdu 3 wjeżdżają w 50,98 s i 53,02 s (przykład „Wejście zawsze takie samo…”), a pytania padają w 11,8 s i 31,7 s. Punkty slajdu 4 szły poza kolejnością narracji, a „Cel” na slajdzie 2 wyszedł „rozłożone”.
  - Kotwica „Agent dostaje coś innego” trafiła w 1,30 s („…Automatyzacja dostaje od Ciebie… Agent”). Po zmianie na „coś innego: cel i zestaw narzędzi” trafiła w 8,64 s.
  - Pierwszy odczyt po `npm run odslony` dotyczył starego `dopasowanie.md`.

## Rozwiązanie
Do kroku 3 `kurs-video` („Odsłony punktów”), za zdaniem o kotwicach:
- „Kotwica ma zawierać słowo, które w segmencie pada po raz pierwszy przy jej zdaniu. Dopasowanie bierze najwcześniejsze trafienie, więc słowa częste w segmencie («agent», «narzędzia») ściągają kotwicę w wcześniejsze zdanie.”
- „Sprawdzaj kotwice podglądem: `npm run odslony` pisze do `klipy/odslony/dopasowanie-podglad.md`, nie do `dopasowanie.md`.”
- „Na slajdzie z przykładem, który powtarza tekst punktów, kotwicz punkty na zdaniu, które je wprowadza.”
