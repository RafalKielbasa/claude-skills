# setup-lokalny-oddany-uzytkownikowi-zamiast-wykonany

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Lokalne i odwracalne kroki przygotowania środowiska (globalna instalacja CLI, logowanie do
narzędzia) podaję jako komendy do wklejenia z „Twoja kolej”. Rafał odbija polecenie z powrotem
jednym słowem, bo oczekuje, że wykonam je sam. Każde odbicie kosztuje turę.

## Przyczyna źródłowa
Regułę z CLAUDE.md o GCP („podaję komendę, nie uruchamiam”) rozciągam przez analogię na każde
narzędzie zewnętrzne, choć dotyczy ona zmian stanu w chmurze. Interaktywny prompt (logowanie,
brak TTY w narzędziu Bash) biorę za blokadę, zamiast szukać trybu nieinteraktywnego.

## Dowody
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), setup dev
  clienta EAS: po „Krok 1 — instalacja EAS CLI … uruchom go sam” Rafał napisał „instaluj”; po
  „krok 2 (logowanie) wymaga Twojego konta Expo … uruchom go sam” napisał samo „eas login”.
  `eas login` z Basha padł z podpowiedzią „Use eas login --device --non-interactive”. Tryb
  urządzenia zadziałał: link i kod, Rafał zatwierdza w przeglądarce i podaje liczbę, potem
  `--resume <id> --match <liczba>`. Jeden kod wygasł (`expired_token`), bo liczba przyszła po
  kilku minutach; nowy kod rozwiązał sprawę.
- 2026-10-22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny), bramka urządzenia
  nr 2 planu 3 biblioteki: trzy razy podałem Rafałowi `pnpm storybook:dev` do uruchomienia w jego
  terminalu (pierwotnie, po poprawce historii i po zatrzymaniu starego Metro). Rafał odbił:
  „uruchom storybook na 8001”. Uruchomione w tle (`pnpm storybook:dev --port 8001`), gotowość
  sprawdzona przez `/status`, adres do wpisania w dev cliencie; po „ok” log Metro pokazał czysty
  start. Serwer deweloperski to odwracalny setup lokalny, a QR nie jest potrzebny, gdy adres
  wpisuje się ręcznie.

## Rozwiązanie
Instalacje narzędzi na komputerze użytkownika i logowania z trybem urządzenia wykonuję sam, gdy są
odwracalne i nie zmieniają stanu współdzielonego. Użytkownikowi oddaję tylko to, czego nie da się
zrobić bez TTY albo bez jego osoby (zatwierdzenie w przeglądarce, prompt keystore'a), a usługi
płatne i zmiany w chmurze pokazuję jako decyzję z wariantami. Logowanie CLI bez TTY: najpierw szukaj
flag `--device` i `--non-interactive`; kod urządzenia podaj od razu, a gdy odpowiedź przychodzi po
kilku minutach, wygeneruj nowy, zanim użyjesz `--resume`.
