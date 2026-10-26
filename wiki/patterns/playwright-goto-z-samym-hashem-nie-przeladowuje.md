# playwright-goto-z-samym-hashem-nie-przeladowuje

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Seria zrzutów tej samej strony różniących się tylko `#hash` (`page.goto(url#k=a)`, potem
`page.goto(url#k=b)`) dała identyczne PNG — strona nie przeładowała się i nie przeczytała nowego
stanu.

## Przyczyna źródłowa
Zmiana samego fragmentu URL to nawigacja w obrębie dokumentu: przeglądarka nie wykonuje skryptów
ponownie, tylko emituje `hashchange`. Strona, która czyta stan z hasha wyłącznie przy starcie,
zostaje w pierwszym stanie.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny; Baza wiedzy, makiety kierunków szaty):
  `renderuj.js` zrenderował landing w trzech kierunkach — wszystkie trzy PNG wyglądały jak
  kierunek 1. Wykryte obejrzeniem PNG, zanim trafiły do użytkownika. Naprawa: `page.goto('about:blank')`
  przed każdą nawigacją i nasłuch `hashchange` w samej makiecie.
- 2026-10-24, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy, okno konta
  planu 4 `nagrywanie-autonomy-gates`): ten sam błąd w kodzie produkcyjnym automatu, nie w skrypcie zrzutów.
  - Kod: `send_mail` w `kursy/agenty-ai/_nagrywanie/uslugi/gmail.js` po „Wyślij” robił `page.goto` z
    `/mail/u/1/#inbox` na `/mail/u/1/#sent`, żeby zobaczyć nowy wiersz w Wysłanych.
  - Skutek: 7 z 10 wysyłek skończyło stanem `NIEUSTALONY` po 30 s.
  - Dowód przyczyny: następne uruchomienie znalazło każdy z tych wierszy od razu, bo czytało Wysłane z
    `/mail/u/0/`, czyli z nowego dokumentu. Sonda w Chrome: `goto` na identyczny adres też zostaje w tym samym
    dokumencie (odpowiedź `null`).
  - Kod pisał subagent, który tego wiki nie czyta, więc reguła istniała, a nie zadziałała.
  - Naprawa w `5d9c076c`: `page.reload` co 20 s, przypięte przełącznikiem strony testowej `wysylka=przeladuj`.

## Rozwiązanie
W skryptach Playwright zmieniających stan strony przez `#hash` wymuś przeładowanie
(`about:blank` przed `goto` albo `page.reload()`), a w stronie obsłuż `hashchange`. Po pierwszym
przebiegu porównaj PNG dwóch różnych stanów — identyczne sumy przy różnych stanach to sygnał tego
błędu. To samo przy odczycie listy po akcji w aplikacji SPA z routingiem w hashu (Gmail, n8n): świeży
odczyt to `page.reload()`, nie `goto` na adres różniący się fragmentem. Regułę wpisz do briefu
subagenta, który pisze taki kod, bo subagenci nie czytają tego wiki.
