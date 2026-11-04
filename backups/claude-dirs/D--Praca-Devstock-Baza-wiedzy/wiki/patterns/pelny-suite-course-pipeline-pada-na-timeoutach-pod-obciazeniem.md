# pelny-suite-course-pipeline-pada-na-timeoutach-pod-obciazeniem

- **Skill:** ogólny (`tools/course-pipeline`, testy; dotyka kurs-video i kurs-montaz przy weryfikacji)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pełny `npm test` w `tools/course-pipeline` daje kilka do kilkunastu błędów `Test timed out in 5000ms`, gdy na tym samym komputerze pracują równolegle inne sesje (rendery, testy z Chrome). Te same pliki uruchomione osobno przechodzą, więc czerwony pełny zestaw nie mówi nic o zmianie.

## Przyczyna źródłowa
Część testów woła prawdziwe binarki (ffmpeg w `cisza.test.js`, Python w `zadania-sali.test.js`, testy „zgodność z HEAD”) pod domyślnym limitem vitest 5 s. Pod obciążeniem sam import trwał 147 s, a pojedyncze wywołanie ffmpeg przekracza 5 s. Limit jest dobrany do spokojnej maszyny, a praca równoległych sesji to teraz norma.

## Dowody
- 2026-10-16, sesja 1506ab90-7988-4231-ab1a-6beb3e2c2db1: dwa pełne przebiegi po zmianie tylko `src/tts.js` - 11 timeoutów w 8-9 plikach (`Tests 11 failed | 1368 passed`), wszystkie „Test timed out in 5000ms”. Te same 7 plików razem: 2 timeouty w `cisza.test.js`; `cisza.test.js` sam: 29/29 (dwa razy).
- 2026-11-04, sesja 83cd4b89-dc72-4c37-aab9-f5b63095719c (kontynuacja 78788d89-0fb4-49f8-86e8-69106f4e6036; id claude.ai niedostępny): dwa przebiegi `npm test`, po 5 błędów, różny zestaw. `karta-lekcji`, `deck-render`, `render-slides`, `znak-ai-wariant` to timeouty i przechodzą osobno. `tts.test.js` przechodzi z `env -u ELEVENLABS_API_KEY`, a `oprawa-zgodnosc` jest znaną usterką odtworzoną na `d4d415cd`.

## Rozwiązanie
Przed uznaniem pełnego zestawu `tools/course-pipeline` za czerwony: wypisz pliki z `Test timed out`, uruchom każdy osobno i podaj oba wyniki w raporcie. Błąd, który zostaje w osobnym przebiegu albo nie jest timeoutem, traktuj jako prawdziwy. Trwała poprawka (wyższy limit dla testów z prawdziwymi binarkami) to decyzja Rafała - zgłoś ją, nie zmieniaj sam.
