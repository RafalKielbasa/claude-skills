# plik-zmieniony-miedzy-odczytem-a-edycja

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Między odczytem pliku a jego edycją mija długi czas wypełniony analizą i rundą
pytań do użytkownika. W tym oknie plik zmienia inny proces, a Claude planuje
edycję na nieaktualnych numerach linii.

## Przyczyna źródłowa
Odczyt na starcie sesji służy dwóm celom naraz: zrozumieniu treści i zebraniu
adresów do edycji. Pierwszy cel przeżywa upływ czasu, drugi nie. Bramka
zatwierdzenia projektu przez użytkownika wydłuża to okno o kilkadziesiąt minut,
a plik w katalogu współdzielonym z inną sesją Claude albo z Obsidianem nie jest
niczyją wyłączną własnością.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: `praca-z-claude.md`
  odczytany o 09:45 miał 89 044 bajty i 19 wpisów; o 10:24 miał 85 067 bajtów
  i 18 wpisów — druga sesja Claude skasowała cały wpis o WikiSkillu. Zmiana
  wyszła na jaw przypadkiem, przy porównaniu rozmiaru kopii z oryginałem, a nie
  przez świadome sprawdzenie. Numery linii do cięcia zebrano ponownie.
- 2026-09-03, sesja session_01TR43bKGaUWASqCrAsDE6GT: dwa rozjazdy w jednej
  sesji, z dwóch różnych źródeł. (1) `praca-z-claude.md` zmienił się między
  `Read` a `Edit`, bo użytkownik wypełniał w Obsidianie tabelę pomysłów
  równolegle z pisaniem briefu — narzędzie ostrzegło („file had been modified
  on disk"), a wpis w briefie o „pustym wierszu" trzeba było poprawić, bo
  wiersze były już dwa. (2) `~/.claude/wiki/index.md` odczytany na starcie
  Kroku 5 wymieniał 15 wzorców; kwadrans później na dysku było 19 —
  równoległa sesja session_0115YBg2ri1ajCfG8GNynEsZ dopisała cztery. Krok 5.8
  każe przepisać `index.md` w całości, więc zapis z nieodświeżonego kontekstu
  skasowałby te cztery wpisy.
- 2026-09-06/07, sesja session_01T6FrJW1rs56KS6EsPB5agM: dwie sesje Claude w
  jednym drzewie `E:\Praca\agent-biznes` — jedna wykonywała Plan A przez SDD,
  druga pisała Plan B na podstawie kodu tej pierwszej. `lib/idea.mjs` i
  `bin/ide.mjs` zmieniły się na dysku po odczycie (Taski 16–18 i poprawki
  reviewera: `BOOLEAN_FLAGS` w `parseArgs`, komunikaty `CliError`
  przetłumaczone na polski), więc Plan B cytuje `requireSlug` i końcówkę
  `model` w brzmieniu, którego już nie ma, a jego testy asertują angielskie
  komunikaty — rozjazd do naprawienia przed Taskiem 1. Drugi rozjazd:
  `praca-z-claude.md` między `head -60` na starcie podsumowania a `Read` przed
  edycją dostał wpis drugiej sesji (06:11) dokładnie pod nagłówkiem, w
  miejscu, w które szedł nowy wpis — złapane, bo plik został przeczytany
  ponownie tuż przed `Edit`, a nie edytowany z adresów zebranych na starcie.
- 2026-09-06/07, sesja session_01CqWuPYXRh5VSuurqzqb5y3: druga strona tej samej
  pary sesji, i pierwszy raz, gdy mechanizm zadziałał jak zabezpieczenie. `Edit`
  na `patterns/kod-referencyjny-planu-nigdy-nie-uruchomiony.md` **odmówił
  zapisu** („File has been modified since read"), bo tamta sesja dopisała tam
  własny dowód w oknie między moim odczytem a edycją. Odmowa zachowała się
  dokładnie jak asercja wejścia z „Rozwiązania": wymusiła ponowny odczyt, ten
  pokazał cudzy dowód, a mój trafił obok niego zamiast go nadpisać. Z tego
  samego powodu `index.md` zaktualizowałem punktowo zamiast przepisać w całości
  wbrew krokowi 5.8 — druga sesja miała tam już swoje wpisy i licznik dowodów
  podniesiony do dwóch. Odstępstwo wróciło potem do samego skilla: krok 5.8 ma
  teraz jawny wyjątek na równoległą sesję (`skill-impact.md`, wpis
  2026-09-07 — podsumuj-sesja-claude).

## Rozwiązanie
Przed edycją pliku, który odczytałeś wcześniej niż przed chwilą, potwierdź jego
stan — rozmiar, `mtime` albo sumę kontrolną — i dopiero wtedy zbieraj adresy do
zmiany. Gdy edycję wykonuje skrypt, wbuduj w niego asercję na stan wejściowy
(liczba linii, hash), żeby rozjazd zatrzymał zapis zamiast go wykonać.
Osobno traktuj zapisy przepisujące plik w całości: tam rozjazd nie psuje
numerów linii, tylko kasuje cudzą treść, więc plik przeczytaj ponownie
bezpośrednio przed złożeniem nowej wersji, a nie na początku procedury.
