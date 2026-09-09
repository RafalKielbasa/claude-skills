# zweryfikowana-liczba-powtarzana-jako-stala

- **Skill:** ogolny
- **Typ:** porazka
- **Status:** otwarty

## Opis
Liczba zmierzona raz (liczba bledow walidacji, rozklad wierszy, stan bazy) trafia do kolejnych
promptow i raportow jako stala. Repozytorium zmienia sie pod trwajaca sesja, a liczba jedzie dalej
jako fakt — az ktos ja zacytuje w kontekscie, w ktorym jest juz nieprawdziwa.

## Przyczyna zrodlowa
Pomiar jest kosztowny, wiec naturalnie sie go zapamietuje; nic nie uniewaznia zapisanej wartosci.
W dlugiej sesji agentowej zrodel zmiany jest kilka naraz: uzytkownik pracuje rownolegle w tym samym
drzewie, wczesniejsza wlasna poprawka moze zostac odrzucona, a kolejne zadania zmieniaja dokladnie
ten kod, ktorego pomiar dotyczyl.

## Dowody
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: baze walidacji „57 bledow / 25 ostrzezen” wpisywalem do dispatchow zadan
  6 i 7 jako stala. W miedzyczasie sam ja wyzerowalem poprawka sierotek, potem poprawka zniknela
  z drzewa (uzytkownik odrzucil zmiany, `git stash list` pusty), wiec liczba znow byla prawdziwa
  — przypadkiem. W tej samej sesji podalem recenzentowi rozklad wierszy alignera „8
  krokow bez wskazowki, 25 wskazowek bez kroku” z pomiaru sprzed dwoch zadan; recenzent
  zmierzyl migawke sprzed fali poprawek i pokazal, ze prawidlowe wartosci to 9 i 26, czyli
  przesunal sie inny kubelek, niz raportowalem.

## Rozwiazanie
Liczbe, ktora steruje decyzja albo trafia do promptu subagenta, mierz w tej samej turze, w ktorej
ja podajesz, i zapisuj razem z nia, czego dokladnie dotyczy pomiar (commit, migawka, katalog).
W dlugim przebiegu traktuj kazda liczbe starsza niz jedno zadanie jak hipoteze: przed cytatem
przemierz albo oznacz jako „stan z <moment>”.
