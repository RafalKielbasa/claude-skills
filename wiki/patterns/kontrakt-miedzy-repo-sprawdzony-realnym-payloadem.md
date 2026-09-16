# kontrakt-miedzy-repo-sprawdzony-realnym-payloadem

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis

Zmiana kontraktu rozłożona na dwa repozytoria — jedno produkuje payload, drugie go waliduje
i zapisuje — została przed oddaniem sprawdzona jednym artefaktem: prawdziwy payload zbudowany
kodem producenta przeszedł przez walidator konsumenta. Test po stronie konsumenta był tymczasowy
i został skasowany po przebiegu, a w raporcie stanęło, co dokładnie sprawdzono.

## Przyczyna źródłowa

Każda strona ma własne testy na własnych fixture'ach, pisanych w tej samej sesji tą samą ręką.
Fixture konsumenta powstaje z lektury kodu producenta, nie z jego wyjścia, więc literówka
w nazwie klucza, inny typ liczby albo pole wysyłane warunkowo przechodzą zielono po obu stronach.
Rozjazd wychodzi dopiero jako odrzucenie na żywym środowisku — a tam koszt jest najwyższy, bo
publikacja idzie do danych produkcyjnych i wymaga wdrożenia drugiego repo, żeby w ogóle spróbować.

## Dowody

- 2026-09-16, sesja (id niedostępny), repo Baza wiedzy + code-busters-v2: nowa kategoria aktywności
  `VIDEO` — payload składa `tools/course-pipeline/src/publish.js`, przyjmuje zod
  `apps/cms/src/utils/coursePipeline/schema.ts`. Skrypt w scratchpadzie zbudował payload modułu 2
  prawdziwym `buildLessonPayload` (13 aktywności, ID Vimeo wstrzyknięte w pamięci, pliki lekcji
  nietknięte), a tymczasowy test w repo platformy przepuścił ten JSON przez `lessonPayloadSchema`
  — `safeParse` zielony, jedna aktywność `VIDEO`. Test skasowany zaraz po przebiegu, `git status`
  platformy czysty. Same testy jednostkowe obu stron (801 i 73) tego nie pokrywały: obie strony
  przeszłyby też wtedy, gdyby producent wysyłał `videoUrl` liczbą, a nie tekstem.

## Rozwiązanie

Przy zmianie kontraktu obejmującej dwa repozytoria zaplanować jeden przebieg end-to-end **bez
sieci**: wygenerować artefakt prawdziwym kodem producenta (dane realne, nie fixture), zapisać go
do katalogu tymczasowego i przepuścić walidatorem konsumenta w tej samej sesji. Test tymczasowy
kasować od razu po przebiegu i sprawdzić `git status` obcego repo, żeby nic po nim nie zostało.
W raporcie napisać, co przeszło i czego ten przebieg **nie** sprawdza (tu: zapisu do bazy i
wdrożenia endpointu), żeby zielony wynik nie był brany za gotowość do publikacji.
