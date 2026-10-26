# bash-przekracza-120-s-takze-na-trywialnej-komendzie

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Komenda narzędzia Bash przekracza limit 120 s i dokańcza się w tle, choć sama trwa sekundy:
`git push` w vaultcie, a w gorszej sesji także `sed -n`, `cat` i `git status`. Odczyty
narzędziami `Read` i `Grep` w tej samej chwili wracają od razu. Każde przekroczenie to dwie
minuty ciszy i dodatkowe wywołanie po wynik.

## Przyczyna źródłowa
Niepotwierdzona. Czas idzie poza samą komendą: start Git Basha z profilu użytkownika albo
blokada systemu plików czy sieci, a nie praca `sed`. Wynik tła przychodzi poprawny (exit 0),
więc nic nie wymusza zmiany narzędzia, a odruch każe ponawiać ten sam kanał.

## Dowody
- 2026-10-24, sesja session_01GxQKCzxfs88VmDWqtoSy3P: `git push` w vaultcie przekroczył 120 s
  i dokończył się w tle (zapisane wtedy jako jednorazowe).
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa: `review-package` raz przekroczył 120 s
  (zapisane jako jednorazowe).
- 2026-10-26, sesja 13cf4e4b-eabc-4759-85fd-9f693f32f51f (id claude.ai niedostępny), vault
  „Notatki”, nauka: `git commit && git push` → tło; potem `sed -n` po `agent.py`,
  `cat` pliku wyjścia z `git status -sb` i `sed -n` po `index.md` wiki — każde „did not
  complete within its 120s timeout”. `Read` tych samych plików wracał od razu.

## Rozwiązanie
W vaultcie `git push` od razu z `run_in_background`. Po pierwszym przekroczeniu limitu przez
komendę, która powinna trwać sekundy, czytać pliki przez `Read`/`Grep`, a w Bashu zostawić
tylko git, i to w tle. W linii statusu napisać, że powłoka zwalnia, zamiast czekać w ciszy.
