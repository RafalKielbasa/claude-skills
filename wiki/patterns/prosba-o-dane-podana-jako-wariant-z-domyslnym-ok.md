# prosba-o-dane-podana-jako-wariant-z-domyslnym-ok

- **Skill:** ogólny (protokół decyzji Recommendation-First)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Następny krok wymaga danych, które ma tylko użytkownik (liczby z jego konta). Pytanie o nie jest zapisane jako wariant [A] zakończony linią „[Domyślnie] Wpisz "OK"”. Użytkownik odpowiada „ok”, a tej odpowiedzi nie da się wykonać, więc tura przepada. Prośba nie mówi też, gdzie te dane leżą, więc druga tura idzie na pytanie „jaki jest adres”.

## Przyczyna źródłowa
Szablon decyzji dokleja linię „[Domyślnie] OK” do każdej sekcji ❓. Prośba o dane wciśnięta w kształt wariantu dziedziczy więc obietnicę, że jedno słowo wystarczy, a przy prośbie o dane nie wystarczy. Prośba wylicza, co przepisać, ale pomija miejsce, choć adres był do ustalenia z repo. Użytkownik musi więc najpierw sam ustalić źródło, zanim może odpowiedzieć.

## Dowody
- 2026-11-03, sesja e1d033e0-b255-476e-aac9-b2900ad7d9a9 (id claude.ai niedostępny), lekcja agenty-ai 3.2, plansza `limity-zapytan`:
  - Prośbę o trzy limity Claude Haiku 5.5 z konsoli zadałem dwa razy.
  - Za pierwszym razem odpowiedź „ok” wzięta jako „ruszaj z resztą”.
  - Za drugim razem [A] brzmiało „Podajesz trzy liczby…” z linią „[Domyślnie] Wpisz "OK"”. Rafał odpowiedział „ok”, a ja musiałem ponowić prośbę.
  - Potem przyszło pytanie Rafała „jaki jest adres do sprawdzenia limitów”. Adres `platform.claude.com/settings/limits` dało się wyprowadzić z `kursy/agenty-ai/zrodla.md` (`/settings/keys`, `/settings/billing`) już przy pierwszej prośbie.
  - Liczby przyszły jako zrzut ekranu dopiero w piątej turze od pierwszej prośby.

## Rozwiązanie
„Gdy następny krok wymaga danych, których nie da się wyliczyć (liczby z konta użytkownika, ścieżka, treść), to prośba o dane, nie wariant. Podaj dokładne miejsce odczytu (URL, menu, ścieżka) i oczekiwany format odpowiedzi, np. »wklej trzy liczby albo zrzut«. Linii „[Domyślnie] OK” nie dawaj wariantowi, którego nie da się wykonać bez danych: domyślne „OK” uruchamia wtedy wariant bez danych albo w ogóle go nie ma.”
