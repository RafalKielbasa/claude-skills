# edit-po-odczycie-z-basha-odrzucony

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude czyta fragment pliku przez Bash (`sed -n`, `grep -n`, `cat`) i od razu wysyła `Edit`, często
kilka równolegle. Narzędzie odrzuca każdy z nich komunikatem `File has not been read yet. Read it
first before writing to it.`, więc tura idzie na marne i trzeba ją powtórzyć po `Read`.

## Przyczyna źródłowa
Warunek wstępny `Edit` uznaje wyłącznie odczyt narzędziem `Read` w tej rozmowie. Odczyt przez Bash
nie rejestruje pliku jako przeczytanego, choć treść jest już w kontekście. Przy edycjach wysłanych
równolegle odrzucenie trafia we wszystkie naraz.

## Dowody
- 2026-10-22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny): dwa razy
  w jednej sesji. Pierwszy: `CLAUDE.md` repo mobile czytany `sed -n 109p`, `Edit` odrzucony. Drugi:
  `components/ds/pixel-icon/pixel-icon.tsx` czytany przez `cat`, cztery równoległe `Edit`, wszystkie
  odrzucone. Dopiero `Read` (choćby 2–5 linii) przepuścił poprawki.

## Rozwiązanie
Plik, który zamierzasz zmienić narzędziem `Edit`, czytaj narzędziem `Read`, choćby kilka linii
z `offset`/`limit`. Bash zostaw do przeszukiwania i do plików, których nie edytujesz. Przed paczką
równoległych `Edit` upewnij się, że plik był przeczytany przez `Read` w tej rozmowie.
