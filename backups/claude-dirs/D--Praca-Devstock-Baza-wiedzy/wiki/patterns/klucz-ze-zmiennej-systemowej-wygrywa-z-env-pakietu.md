# klucz-ze-zmiennej-systemowej-wygrywa-z-env-pakietu

- **Skill:** kurs-video (`tools/course-pipeline`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Render lektora padł na `voice_not_found` dla głosu V4, który istniał na koncie kursu. Pipeline pracował na
prywatnym kluczu ElevenLabs Rafała ze zmiennych środowiskowych Windows zamiast na kluczu kursu z `.env`.

## Przyczyna źródłowa
Skrypty startują przez `node --env-file=.env`, a Node nie nadpisuje zmiennej, która już jest w środowisku.
`process.loadEnvFile` w `src/cli.js` i `src/montaz-cli.js` nie wczytywał też pliku, gdy klucz już był. Prywatny
`ELEVENLABS_API_KEY` w zakresie User wygrywał więc po cichu. Od strony API wyglądało to jak problem konta, bo
gotowe głosy biblioteki działały, a głosy własne konta kursu nie.

## Dowody
- 2026-10-22, sesja c6ebb064-81d9-4b6b-9857-7bf69d930b7a (id claude.ai niedostępny): lekcja agenty-ai 1.4, etap 1
  `/kurs-video`. `HTTP 404 voice_not_found` dla `2MLx6VudpP6LiJSGs38o`, sondy po 5 znaków: głosy własne 404, gotowy
  głos biblioteki 200. Przez trzy tury szukałem przyczyny w koncie ElevenLabs. Rafał: „Czy klucz idze na pewno
  z .env a nie zmiennych systemmowych, w nich mam dodany mój prywatny klucz”. Porównanie bez wypisywania wartości:
  `ELEVENLABS_API_KEY: set in system env, DIFFERENT from .env`. Poprawka D66 A, commit `5aeec35d`
  (`src/package-env.js`: `.env` pakietu nadpisuje środowisko i nazywa nadpisane zmienne).

## Rozwiązanie
Zrobione w kodzie CLI (`5aeec35d`). Zostaje luka: testy (import `uruchom`) i własne sondy z `node --env-file` dalej
widzą klucz systemowy, a `tests/tts.test.js` „rzuca gdy brak klucza API” pada przy ustawionej zmiennej. Do
`/kurs-video`, krok 3: „Jeśli ElevenLabs albo HeyGen zwraca 401/404 na zasobie, który istnieje na koncie kursu,
najpierw porównaj klucz w środowisku z kluczem w `.env`, bez wypisywania wartości. Dopiero potem szukaj przyczyny
w koncie”.
