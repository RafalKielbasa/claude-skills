# walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki

- **Skill:** kurs-redakcja
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-07, kurs-redakcja)

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

## Rozwiązanie
W kroku 6 walidować katalog lekcji:
`npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`. Błędy spoza lekcji
nie należą do bramki redakcji; jeśli wyjdą przy okazji, trafiają do briefu jako
osobne zadanie, nie do listy „napraw". Ta sama zasada dla każdego skilla
`kurs-*`, który pracuje na jednej lekcji.
