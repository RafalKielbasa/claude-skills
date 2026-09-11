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

- 2026-09-10, sesja session_015PLcG6rJFegWQiawFUeamB: tym razem pomiar zdezaktualizowal sie
  W TRAKCIE jednej tury. Na starcie podsumowania zebralem `git status --short` — nizej dziewiec
  pozycji, w tym moj spec i plan jako niezacommitowane. Zanim cokolwiek z tego zapisalem,
  uzytkownik zrobil commit `9a94b3e`, wiec ten sam `git status` pokazywal juz jedna pozycje.
  Gdybym zlozyl sekcje „Stan” briefu z pierwszego pomiaru, dziennik klamalby o stanie repo
  w zdaniu, po ktore siega sie nastepnego dnia. Wykryte przypadkiem, bo subagent zaraportowal
  „index changing between two `git status` calls on files I never touched”.
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: trzeci dowod, i pierwszy,
  w ktorym „stala" nie byla liczba, tylko zalozeniem o stanie repo.
  Regula z `CLAUDE.md` mowi, ze nie commituje, wiec przez cala sesje
  zakladalem, ze pliki nowej lekcji leza w drzewie jako niezacommitowane,
  i tak mial brzmiec raport bramki. `git status --short` uruchomiony
  dopiero przy skladaniu raportu pokazal JEDNA pozycje zamiast szesciu:
  Rafal zacommitowal je pod sesja jako `80b53bf kurs: M02L01 struktura`
  i `a497ac0 docs: aktualizacja wiki`. Zdanie „zostawiam niezacommitowane"
  byloby falszywe, a pochodzilo nie z pomiaru, tylko z reguly.
  Wniosek do sekcji Rozwiazanie: hipoteza jest nie tylko stary pomiar,
  ale i stan wyprowadzony z reguly („ja tego nie robie, wiec tego nie ma") -
  taki tez trzeba zmierzyc w turze, w ktorej sie go cytuje.

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: literał `HASZ_BEZ_UWAG = 'e9f0efdc5de6'` wpisany do briefu Taska 4 dzień wcześniej jako "hasz sprzed zmiany" był już nieaktualny — commit `4f54506` przepisał w międzyczasie nagłówki w fiksturze `SCENARIUSZ_DEMO`. Przeliczony przed dispatchem na `cf19aa86f6c5`. Brief sam przewidywał ten przypadek i podawał komendę do przeliczenia, ale nic nie wymuszało jej uruchomienia.

## Rozwiazanie
Liczbe, ktora steruje decyzja albo trafia do promptu subagenta, mierz w tej samej turze, w ktorej
ja podajesz, i zapisuj razem z nia, czego dokladnie dotyczy pomiar (commit, migawka, katalog).
W dlugim przebiegu traktuj kazda liczbe starsza niz jedno zadanie jak hipoteze: przed cytatem
przemierz albo oznacz jako „stan z <moment>”.
