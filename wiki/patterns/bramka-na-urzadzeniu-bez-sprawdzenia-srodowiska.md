# bramka-na-urzadzeniu-bez-sprawdzenia-srodowiska

- **Skill:** superpowers:writing-plans (też superpowers:brainstorming)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan stawia bramkę, którą użytkownik wykonuje na własnym sprzęcie albo koncie (dev client na
telefonie, konto w usłudze zewnętrznej), bez sprawdzenia, że to środowisko istnieje. Bramka
zamienia się w wieloetapowy setup, a wszystkie zadania zależne od jej wyniku stoją.

## Przyczyna źródłowa
Spec i plan traktują narzędzie użytkownika jak stały fakt („Rafał uruchamia w dev cliencie”).
Jedyne zastrzeżenie siedzi w opisie wariantu decyzji, nie w pytaniu ani w zadaniu przygotowania.
Środowiska po stronie użytkownika (aplikacja na telefonie, członkostwo w organizacji usługi) nie
widać z repo, więc nie wychodzi ani w self-review, ani w review planu, ani w builder checku.

## Dowody
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), plan 1 biblioteki
  komponentów Kodożerców, Task 1 „Spikes on the device (gate: Rafał's screenshots)”. Wariant D6 w specu
  mówił tylko „Zakładam, że masz zbudowany dev client”. Po raporcie bramki Rafał: „Przeprowadź mnie
  krok po kroku”, potem „Nie mam deweloperskiej wersji aplikacji na telefonie. Chyba trzeba zrobić pełny
  setup.” Dalej: brak `eas-cli`, konta `rafalkielbasa` i nowe `rafalkielbasapraca` z `Entity Not
  Authorized` na projekcie EAS `devstock`, `eas init` pod prywatnym kontem i commit `7ab1618` na gałęzi
  sondy. Na koniec sesji build dev clienta wciąż przed nami; zadanie 3 i wszystkie za nim czekają.
- 2026-10-20, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny): drugi dowód, ciąg dalszy tej samej bramki. Build dev clienta na prywatnym EAS padał kolejno na `ENOTFOUND api.expo.dev`, `ERR_PNPM_IGNORED_BUILDS` (obraz EAS z pnpm 11; przypięte `"pnpm": "10.4.1"` na gałęzi sond), potem aplikacja na telefonie rzuciła `EXPO_PUBLIC_GRAPHQL_URL is not set` (brak `.env` w mobile), a na „aplikacja nie stoi” okazało się, że Metro nie działa. Cztery tury Rafała na setup, zanim padł pierwszy zrzut sondy.
- 2026-10-22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny), bramka urządzenia nr 2 planu 3 biblioteki: trzeci dowód, trzecia sesja. Kontroler oddał bramkę jako „uruchom `pnpm storybook:dev`” bez uruchomienia czegokolwiek sam. Rafał wrócił najpierw z logiem „Storybook się nie uruchamia” (`Couldn't find an UnhandledLinkingContext context.` — elementy React w `args` historii, których typecheck i lint nie widzą), potem z `Failed to connect to /192.168.0.190:8082` (stare Metro z 20.10 na `:8081`). Zadziałało dopiero „uruchom storybook na 8001”: kontroler postawił Metro w tle na jawnym porcie, poczekał na `/status`, a po „ok” Rafała przeczytał log Metro (`Android Bundled … 5673 modules`, zero `ERROR`) i potwierdził poprawkę bez proszenia o wklejanie logów.
- 2026-10-21/22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny), plan 2 `kodozercy-platform-public-catalog`: czwarty dowód, czwarta sesja, tym razem środowisko na komputerze, nie na telefonie. Zadanie 12, krok 4 zakładał MariaDB z `docker-compose.yml` i `apps/cms/.env` z `.env.example`. Przy bramce 21.10 ok. 23:24 demon nie odpowiadał (`failed to connect to the docker API … dockerDesktopLinuxEngine`), więc bramka zamieniła się w decyzję D5 i czekała do rana. Po starcie Docker Desktop `db:push` odrzucił sekret z `.env.example` („session secret must be at least 32 characters”), a `.env` aplikacji trzeba było skopiować z głównego checkoutu i doinstalować Chromium Playwrighta. Wszystko poza uruchomieniem Docker Desktop kontroler zrobił sam, zgodnie z drugą połową rozwiązania.
- 2026-10-22/24, sesja session_01UTQuE3EwUpLuJMEs83YJwD (lokalnie 362d75a8-47e4-4b51-a94a-5c747a21b5c6), plan W1 migracji Kodożerców: piąty dowód, te same awarie co w czwartym, choć plan W1 powstał po nim i dalej nie miał zadania „przygotowanie środowiska”. Demon Dockera umarł między sprawdzeniem (ok. 17:00 odpowiadał) a startem stosu (19:24: brak `dockerDesktopLinuxEngine`, `com.docker.backend` nie działa); wymuszone zamknięcie Docker Desktop zablokował klasyfikator, więc bramka czekała do rana. `pnpm --filter @devstock/cms dev` uruchamia `docker compose up -d db` z katalogu worktree, więc tworzy nowy projekt compose `w1-shell` i pada na zajętym porcie 3336. Sekret z `.env.example` znów był za krótki, a jego zmiana tylko po stronie CMS rozjechała `SESSION_SECRET` z aplikacją (puste dane po zalogowaniu). Bramka W1 wyszła 24.10 rano zamiast 23.10 wieczorem.
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf), bramka M1 mobile: szósty dowód, szósta sesja.
  - Plan M1 też nie miał zadania „przygotowanie środowiska”. Skrypt bramki `m1-gate.md` miał jedną linię przygotowania: „`pnpm dev` … `EXPO_PUBLIC_GRAPHQL_URL` z LAN IP, jeśli backend lokalny”.
  - Worktree nie miał `.env`, bo pliki ignorowane nie przechodzą do nowego worktree. Aplikacja rzuciła `EXPO_PUBLIC_GRAPHQL_URL is not set`, a `.env` trzeba było skopiować z głównego checkoutu.
  - Moją edycję `.env` na LAN IP Rafał odrzucił w prompcie i uruchomił backend sam („już uruchomiłem BE”). Mój start CMS-u zatrzymałem (`TaskStop`).
  - Zanim padł wiersz 1, Rafał dopytał trzy razy: „podaj adres pliku do uruchomienia”, „podaj dane do logowania”, „podaj jeszcze raz krok po kolei”.
- 2026-10-27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), bramka M2 mobile: siódmy dowód, siódma sesja.
  - Skrypt bramki `m2-gate.md` (52 wiersze) miał jedną linię „Uruchom” bez katalogów, choć rozwiązanie tej strony je wymienia. Szkic pisał subagent z briefem bez wymogu sekcji „Przygotowanie”, a ja go nie dopisałem.
  - Rafał: „Podaj mi adresy do uruchomienia CMS oraz mobilki do testów”. Odpowiedziałem URL-ami (`localhost:3001`, LAN IP, `adb reverse`). Rafał: „chodziło mi o adresy na dysku”.
  - Nowe: dla Rafała „adres” w kontekście uruchamiania to ścieżka katalogu, tak samo jak w szóstym dowodzie („adres pliku do uruchomienia”).

## Rozwiązanie
Gdy spec albo plan zawiera krok, który wykonuje użytkownik na swoim sprzęcie lub koncie (urządzenie,
zainstalowana aplikacja, konto w usłudze zewnętrznej), w brainstormingu zadaj jedno pytanie, czy to
środowisko istnieje, i sprawdź z terminala, co się da (wersja CLI, `whoami`, dostęp do projektu).
Brak środowiska = osobne zadanie „przygotowanie środowiska” przed bramką, z komendami, kosztem i tym,
kto je wykonuje, a nie założenie w opisie wariantu.
Przy samej bramce na urządzeniu kontroler stawia serwer deweloperski sam (w tle, na jawnym porcie, po
sprawdzeniu, że port nie jest zajęty przez stary proces), podaje adres do wpisania w dev cliencie
i czyta log serwera po otwarciu aplikacji: błędy uruchomienia i połączenia widzi wtedy sam, zanim
użytkownik przejdzie tabelę bramki.
Skrypt bramki zaczyna się od sekcji „Przygotowanie” z gotowymi wartościami:
- katalog, z którego uruchomić aplikację (ścieżka worktree), i katalog każdej usługi (np. CMS) — gdy Rafał prosi o „adres” do uruchomienia, chodzi o ścieżkę na dysku, nie o URL;
- komenda i adres do wpisania w dev cliencie;
- konto testowe albo informacja, skąd je wziąć;
- lista usług, które muszą działać, i kto je stawia.

W nowym worktree sprawdź pliki ignorowane potrzebne do startu (`.env`). Zanim zmienisz `.env` albo postawisz
backend współdzielony z innymi sesjami, zapytaj, którego backendu użyć i kto go uruchamia. Metro sesji stawiasz
sam (patrz [[setup-lokalny-oddany-uzytkownikowi-zamiast-wykonany]]). Drogę do każdego ekranu opisuje
[[wiersz-bramki-bez-drogi-do-ekranu]], a zgodność dokumentów GraphQL z backendem sprawdza
[[sledzone-typy-codegen-ukrywaja-zmiane-schematu-backendu]].
