# walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki

- **Skill:** kurs-redakcja (2026-09-07), kurs-lekcja (2026-09-10),
  kurs-zadania (2026-09-10) — cała rodzina poprawiona
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-10, kurs-zadania)

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
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: trzeci dowod, nowa manifestacja — koszt ponosi subagent, nie bramka. Krok weryfikacji zadan 6 i 7 uruchamia `npm run validate -- ../../kursy/agenty-ai`; oba raporty wrocily z „57 bledow / 25 ostrzezen” jako wlasna troska, a jeden zajal sie dowodzeniem, ze to nie jego wina. Wszystkie 57 to sierotki w quizach czterech lekcji modulu 1, zero z dotykanych plikow. Musialem wpisywac te baze do kazdego kolejnego dispatchu, zeby recenzenci nie gonili cudzego bledu.
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: czwarty dowod, czwarta
  sesja, pierwsza na `kurs-lekcja` po tym, jak cudze BLEDY zniknely.
  **Sprostowanie z tej samej sesji:** pierwotnie stalo tu zdanie, ze krok 5
  skilla „wciaz ma katalog kursu" - nieprawda. Rafal poprawil krok 5 W TRAKCIE
  tej sesji, a ja pracowalem na wersji skilla wczytanej na jej starcie, wiec
  walidowalem caly kurs mimo poprawionej instrukcji. Koszt byl realny,
  przyczyna inna, niz zapisalem: nie tresc skilla, tylko jego migawka
  w kontekscie sesji. To wlasny przypadek wzorca globalnego
  `twierdzenie-o-pliku-bez-odczytu` - napisalem o zawartosci `SKILL.md`,
  nie odczytawszy go z dysku. Wniosek na przyszlosc: instrukcje skilla
  o stanie innego pliku sprawdzaj odczytem, takze wtedy, gdy „masz go
  w kontekscie" - kontekst jest migawka ze startu sesji.
  Generowanie lekcji 2.1 dalo `OK - walidacja czysta (ostrzezen: 25)`;
  wszystkie 25 pochodzi z lekcji 1.1-1.4 (limity dlugosci odpowiedzi
  w czterech `quiz.json`, dopisek „zaznacz wszystkie" w trzech, slowo
  „ranga" w artykule i scenariuszu 1.2), zero z generowanej lekcji.
  Kazdy z czterech przebiegow walidacji trzeba bylo filtrowac
  (`| grep -i "BLAD\|lekcja-01-tools-agent\|^OK:"`), a raport bramki
  i tak musial wytlumaczyc, skad 25 ostrzezen przy czystej lekcji.
  Nowa obserwacja: gdy cudzych bledow nie ma, sygnalem jest samo slowo
  „czysta" przy niezerowym liczniku - latwo je przeczytac jako sukces
  wlasnej pracy i nie sprawdzic, czyje sa te ostrzezenia.


## Rozwiązanie
W kroku 6 walidować katalog lekcji:
`npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`. Błędy spoza lekcji
nie należą do bramki redakcji; jeśli wyjdą przy okazji, trafiają do briefu jako
osobne zadanie, nie do listy „napraw". Ta sama zasada dla każdego skilla
`kurs-*`, który pracuje na jednej lekcji.

Poprawkę wpisaną do jednego skilla z rodziny przenieść od razu do pozostałych,
w których stoi ta sama instrukcja. Po zmianie w `kurs-redakcja` (2026-09-07)
zostały `kurs-lekcja` krok 5 i `kurs-zadania` krok 4, oba z katalogiem kursu -
sprawdzone `grep -rn "npm run validate" .claude/skills/` 2026-09-09.
`kurs-lekcja` poprawiony 2026-09-10 przez `/evolve-skill`, a `kurs-zadania`
tego samego dnia, tą samą drogą - i to jest **krok 5, nie 4** (`SKILL.md:72`;
wcześniejsze zdania tej strony podawały zły numer). Trzy skille z trzech,
więc wzorzec jest od 2026-09-10 `zaadresowany`.
`kurs-nowy` krok 7 zostaje bez zmian: on zakłada program całego kursu, więc
walidacja kursu jest tam właściwą jednostką.

Rytm, który się z tego wyłania: gdy poprawka trafia do jednego skilla
z rodziny, w tej samej sesji zrób `grep` po całym katalogu skilli i wypisz
pozostałe wystąpienia jako listę do zrobienia. Trzy sesje z rzędu płaciły za to,
że lista nie powstała.

Stan końcowy na 2026-09-10 (`grep -n "npm run validate"
.claude/skills/kurs-*/SKILL.md`): `kurs-redakcja` krok 6, `kurs-lekcja` krok 5
i `kurs-zadania` krok 5 — wszystkie na katalogu lekcji; `kurs-nowy` krok 7
zostaje na katalogu kursu i tak ma być. Nawrotem będzie powrót którejkolwiek
z tych trzech komend do `<slug>` albo nowy skill rodziny, który powtórzy
ten sam zapis — bo właśnie tak ten wzorzec rośł przez cztery sesje.
