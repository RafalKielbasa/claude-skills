# raport-z-krokiem-na-slowo-bez-wariantow

- **Skill:** ogólny (protokół odpowiedzi, „Raport po zadaniu”)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Raport po zadaniu kończy się zdaniem „Następny krok: X albo Y. Zrobię to na Twoje słowo”, bez sekcji ❓
z wariantami i bez markera ⏸. Rafał odpisuje „ok” i nie wiadomo, czy potwierdza raport, zgadza się na X
czy na Y.

## Przyczyna źródłowa
Szablon „Raport po zadaniu” traktuje następny krok jako informację, a ja dopisałem do niego ofertę
działania zależną od zgody. Oferta, która czeka na zgodę, jest decyzją: protokół wymaga dla niej
wariantów [A]/[B] i markera ⏸. Bez nich „ok” nie ma desygnatu, a reguła „„OK” przyjmuje wariant
rekomendowany” nie ma czego przyjąć.

## Dowody
- 2026-10-29, sesja 00434ebc-97fc-4e2a-a68d-5d8452f5084b (id claude.ai niedostępny; Baza wiedzy, worktree
  `baza-wiedzy-dt-12-close`, zlecenie huba): raport z zamknięcia DT-12 kończył się zdaniem „gałąź
  `worktree-baza-wiedzy-dt-12-close` … trzeba scalić do gałęzi dnia albo puścić przez PR. Zrobię to na
  Twoje słowo”, bez ❓ i bez ⏸. Rafał odpisał „ok”. Odczytałem to jako zgodę na scalenie do gałęzi dnia
  (wariant bez pusha). Strażnik worktree nie pozwala na git w kopii głównej, więc podałem linię `!`,
  i dopiero przy niej dałem warianty i marker, o jedną turę za późno. Następna wiadomość była nowym
  zleceniem z huba, a linia `!` do końca sesji nie została uruchomiona.

## Rozwiązanie
Następny krok, który wymaga słowa Rafała, nie stoi w SEDNO jako zdanie. Idzie do ❓ z [A] (rekomendowane,
konkretne działanie) i [B], z markerem ⏸ w ostatniej linii. Raport końcowy bez decyzji opisuje stan bez
oferty („commit czeka na gałęzi X; scalenie robi Rafał komendą …”). Gdy „ok” przyjdzie do oferty bez
wariantów, wybierz najbezpieczniejsze odczytanie (bez zapisów nieodwracalnych i bez pusha) i nazwij je
w 🎯.
