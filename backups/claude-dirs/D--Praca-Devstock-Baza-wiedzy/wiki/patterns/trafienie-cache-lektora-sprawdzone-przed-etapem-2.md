# trafienie-cache-lektora-sprawdzone-przed-etapem-2

- **Skill:** kurs-video
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed etapem 2 toru B (spięcie `final.mp4`) Claude sprawdził bez wywołań API, że lektor trafi w cache lekcji. Dopiero
potem uruchomił render. Etap 2 przeszedł bez płatnego TTS i bez HeyGena.

## Przyczyna źródłowa
Etap 2 zawsze woła `wygenerujLancuch` na całym łańcuchu (`src/video.js:454`). Przy markerze
`video/audio/.lesson-cache` niezgodnym z kluczem (`src/video.js:104`) funkcja kasuje wszystkie chunki
(`src/video.js:122`) i generuje lekcję od nowa, czyli ok. 1,4 $ za TTS bez żadnego pytania. Skill mówi tylko, że etap 2
to „normalnie trafienie cache”, i nie daje komendy, która to sprawdza. To samo porównanie markera robi
`kontrola-lektora` (`src/kontrola-lektora.js:363-371`, `zakres`), ale razem z rozpoznawaniem mowy.

## Dowody
- 2026-10-21, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3, etap 2
  `--avatar=mcp`. Skrypt w scratchpadzie (`cache_check.mjs`) policzył `kluczLancucha` z tych samych funkcji co render
  (`opcjeChunkowLekcji`, `obrobkaLektora`, `resolveTtsProfile` z `kurs.yaml`) i zwrócił
  `{"marker":"69fb6b9e5ace66f7","klucz":"69fb6b9e5ace66f7","trafienie":true,"chunki":4,"model":"eleven_v4"}`.
  Render: „OK: video wyrenderowane”, audio z 2026-10-20 nietknięte.

## Rozwiązanie
Przed etapem 2 i przed każdym ponownym renderem lekcji z gotowym audio porównaj bez API marker
`video/audio/.lesson-cache` z `kluczLancucha(chunks, …)` z `src/video.js`, z tym samym profilem i chunkowaniem co
render. Niezgodność oznacza, że render wygeneruje audio całej lekcji: zatrzymaj się i podaj Rafałowi koszt. Docelowo
flaga `npm run video -- <lekcja> --sprawdz-cache`, która wypisuje trafienie albo przyczynę rozjazdu.
