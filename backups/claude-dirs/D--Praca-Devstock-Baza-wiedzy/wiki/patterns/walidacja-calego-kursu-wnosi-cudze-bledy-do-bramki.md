# walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki

- **Skill:** kurs-redakcja (poprawiony 2026-09-07), kurs-lekcja (niepoprawiony)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Krok 6 skilla kazał walidować cały kurs (`npm run validate -- ../../kursy/<slug>`),
więc do bramki redakcyjnej jednej lekcji weszło 57 błędów z quizów czterech
innych lekcji, a raport dla Rafała musiał je tłumaczyć i odsuwać zamiast
zamknąć się na redagowanych plikach.

## Przyczyna źródłowa
Jednostką pracy skilla jest lekcja, ale komenda walidacji została napisana
z katalogiem kursu. Walidator przyjmuje katalog lekcji, a nic w skillu nie
mówiło, że wynik ma dotyczyć tylko redagowanych plików. Instrukcja „napraw
wszystkie BŁĘDY" przy walidacji kursu jest w zakresie redakcji jednej lekcji
niewykonalna, więc albo się ją łamie, albo rozszerza zakres bez pytania.

## Dowody
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: redakcja M00L01 kursu
  agenty-ai. `npm run validate -- ../../kursy/agenty-ai` →
  `NIEPOWODZENIE — błędów: 57, ostrzeżeń: 25`, wszystkie błędy w
  `modul-01-*/quiz.json` (sierotki; lekcje 01: 18, 02: 8, 03: 13, 05: 18),
  pliki nietknięte w `git status`. Walidacja katalogu lekcji →
  `walidacja czysta (ostrzeżeń: 0)`. Rafał: „czemu uruchamiamy walidator
  całego kursu, przecież pracujemy lekcja po lekcji". Skill poprawiony w tej
  samej sesji (`SKILL.md:108-110`), wpis w `skill-impact.md`.
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: ta sama komenda stoi
  w `kurs-lekcja` krok 5 (`npm run validate -- ../../kursy/<slug>`), którego
  poprawka z 2026-09-07 nie objęła. Generowanie lekcji 0.3 →
  `NIEPOWODZENIE — błędów: 58, ostrzeżeń: 25`, z czego 0 z generowanej lekcji;
  58 błędów rozłożonych na cztery `quiz.json` z modułu 1 i jeden
  `artykul.md` z modułu 0. Żeby w ogóle zobaczyć wynik własnej lekcji, trzeba
  było filtrować wyjście (`| grep -E "lekcja-03-debugging|NIEPOWODZENIE"`)
  i osobno policzyć cudze błędy po plikach, a raport w bramce musiał je
  wytłumaczyć i odsunąć - dokładnie ten sam koszt co w dowodzie z 2026-09-07.
  **To nie jest nawrót poprawki w `kurs-redakcja`** (ta trzyma się od dwóch
  sesji), tylko dowód, że poprawka weszła do jednego skilla z rodziny `kurs-*`,
  choć instrukcja jest w nich powielona.

## Rozwiązanie
W kroku 6 walidować katalog lekcji:
`npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`. Błędy spoza lekcji
nie należą do bramki redakcji; jeśli wyjdą przy okazji, trafiają do briefu jako
osobne zadanie, nie do listy „napraw". Ta sama zasada dla każdego skilla
`kurs-*`, który pracuje na jednej lekcji.

Poprawkę wpisaną do jednego skilla z rodziny przenieść od razu do pozostałych,
w których stoi ta sama instrukcja: po zmianie w `kurs-redakcja` zostało
`kurs-lekcja` krok 5 i `kurs-zadania` krok 4, oba z katalogiem kursu -
sprawdzone `grep -rn "npm run validate" .claude/skills/` 2026-09-09.
`kurs-nowy` krok 7 zostaje bez zmian: on zakłada program całego kursu, więc
walidacja kursu jest tam właściwą jednostką.
