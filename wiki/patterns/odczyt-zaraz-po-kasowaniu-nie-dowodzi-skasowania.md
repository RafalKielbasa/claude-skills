# odczyt-zaraz-po-kasowaniu-nie-dowodzi-skasowania

- **Skill:** ogólny (dotyczy skilla `talk` i każdego kasowania w zewnętrznym API)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sprawdzenie „GET → 404 zaraz po DELETE” przechodzi, raport mówi `deleted`, a zasób dalej leży
w zewnętrznym serwisie. Pozostałości wychodzą dopiero przy odczycie po kilku minutach albo przy
liście całej kolekcji. Akceptacja, która sprawdzała tylko znane identyfikatory, ich nie widzi.

## Przyczyna źródłowa
ElevenLabs przyjmuje DELETE rozmowy, która jest jeszcze w przetwarzaniu, i przez chwilę odpowiada
na GET kodem 404. Po zakończeniu przetwarzania rozmowa wraca ze `status=done`. Trwale znika tylko
rozmowa skasowana po `done`. Odczyt „zaraz po” trafia więc w przejściowe 404. Sprawdzenie po
identyfikatorach widzi tylko to, co zna bieżący przebieg, a pozostałości po starszym kodzie są
poza jego zasięgiem.

## Dowody
- 2026-10-23/24, sesja c0987db9-b09b-453f-8cfe-0770239787b8 (claude.ai session_01GxQKCzxfs88VmDWqtoSy3P),
  akceptacja planu 3 `hub-voice`:
  - przebieg 1: `deletion: deleted`, a ok. 6 min później 4 z 5 rozmów odpowiadały 200 `status=done`
    (A1);
  - przebieg 2: GET tuż po DELETE dał 404, później 200 `status=done` (A5);
  - 2026-10-24: lista rozmów agenta (`GET /v1/convai/conversations?agent_id=…`) znalazła 8 rozmów
    z 21–22.10, których żadne sprawdzenie per id nie widziało (A6). Akceptacja planu 2 z 21.10
    zaliczyła GET → 404 tuż po kasowaniu. Zakładam, że te z 21.10 to jej rozmowy.
  - Skasowane po `done`: każda 204, potem 404 po 15 s i po 11 min, a lista agenta pusta.

## Rozwiązanie
Kasowanie w zewnętrznym API weryfikuj trzema krokami:
1. kasuj dopiero po stanie końcowym zasobu (`done`/`failed`), nigdy w trakcie przetwarzania;
2. powtórz odczyt po kilku minutach;
3. „nic nie zostało” sprawdzaj listą całej kolekcji z filtrem (agent, projekt), nie GET-em znanych
   identyfikatorów.

Raport, który ma tylko odczyt „zaraz po”, nazywa skasowanie niezweryfikowanym.
