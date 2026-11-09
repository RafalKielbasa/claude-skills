# wartosc-do-wpisania-opisana-zamiast-odczytana

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
W kroku dla Rafała opisuję wartość, którą ma wpisać („kod, który hub dał teraz sesji test-a”), zamiast
podać ją wprost. Rafał staje na kroku i pyta, o którą wartość chodzi. Wartość była już w pliku stanu,
który mogłem przeczytać jednym poleceniem.

## Przyczyna źródłowa
Krok piszę z perspektywy ekranu produktu, czyli z tego, co Rafał zobaczy, a zapominam, że mam bezpośredni
dostęp do stanu (plik kolejki, rejestr, log). Opis „ten po B” jest jednoznaczny dla mnie, bo znam historię
kroków, a dla czytającego, który ma przed sobą kilka linii z kodami, nie.

## Dowody
- 2026-11-09, sesja session_01WryF5WMM6e7iBT7efWZwJS (lokalnie 3089ecd1-38b8-4995-a6db-28273c325475),
  akceptacja planu 1 `hub-approvals`, wiersz 3.
  - Krok brzmiał: „odczytaj kod, który hub dał teraz sesji test-a (ten po „B”)”.
  - Rafał: „Nie rozumiem który kod odczytac”.
  - Kod a11 leżał w `~/.claude/hub/queue.json` od 8 minut; podałem go dopiero w następnej turze.
  - Wcześniej w tej samej sesji (przed kompakcją), przy sondach: „Coś poszło nie tak, nie rozumiem kroku 2”;
    wtedy brakowało nazwy okna i dokładnych klawiszy.

## Rozwiązanie
Zanim wyślesz krok dla użytkownika, każdą wartość, którą ma wpisać (kod, ścieżkę, id, port, nazwę), a którą
możesz odczytać sam, odczytaj i podaj dosłownie, w gotowej komendzie. Wartość, której jeszcze nie ma, bo
powstanie w trakcie kroku, opisz miejscem i wyglądem („w zakładce huba linia `announce: aN … test-c`, wpisz
to aN”), nigdy odwołaniem do historii („ten po B”).
