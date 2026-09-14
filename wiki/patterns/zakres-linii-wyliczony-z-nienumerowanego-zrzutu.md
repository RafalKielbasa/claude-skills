# zakres-linii-wyliczony-z-nienumerowanego-zrzutu

- **Skill:** ogolny
- **Typ:** porazka
- **Status:** otwarty

## Opis
Podmiana zakresu linii w pliku (`lines[a-1:b] = nowe`) wykonana na numerach
policzonych z nienumerowanego zrzutu - `sed -n '1,40p'`, `cat` bez `-n`, wyjscie
innego narzedzia - trafia obok o jedna pozycje. Skutek jest cichy: skrypt konczy
sie sukcesem, wypisuje "OK", a w pliku zjedzona jest jedna linia sprzed zakresu
i wisi jedna osierocona za nim.

## Przyczyna zrodlowa
Numer linii z nienumerowanego zrzutu powstaje przez reczne liczenie wierszy
wyjscia, wiec jedno przeoczone pustej linii albo jeden wiersz naglowka przesuwa
caly zakres. Podmiana przez slice nie ma zadnego sprawdzenia tozsamosci: Python
podmieni dowolne `b-a+1` linii bez slowa protestu, bo slice jest poprawny
skladniowo niezaleznie od tego, co w nim stoi. Asercja na PIERWSZEJ linii zakresu
nie wystarcza, gdy pomylka jest w dlugosci - zakres zaczyna sie dobrze, a konczy
w srodku nastepnego akapitu.

## Dowody
- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: dwa razy w jednej sesji, w tym samym pliku.
  (1) Podmiana bloku "Skrzynka pocztowa" w `konspekt-nagrania.md` poszla na zakres
  21-29 policzony z `sed -n '1,40p'`, a blok stal w 22-30. Skrypt wypisal
  "OK [21-29] -> 11" i skasowal linie "wpisu. Dodawanie filtra jest pointa
  segmentow 3 i 5.", zostawiajac osierocona "wraca w segmentach 2, 5 i 7." -
  wyszlo dopiero z `git diff`, nie ze skryptu. (2) Przy poprawianiu kroku 24
  `L[115:120]` zamiast linii 116-120 zniszczylo koniec kroku 22 i caly krok 23,
  zostawiajac dwie linie duplikatu; zobaczylem to dopiero na wydruku kontrolnym
  po zapisie. Obie naprawy wymagaly osobnej rundy. Wszystkie pozostale podmiany
  tej sesji, robione z numerow z `cat -n` / `grep -n` i z asercja na pierwszej
  linii zakresu, przeszly bez chybienia.

## Rozwiazanie
Numery linii do podmiany bierz wylacznie z wyjscia numerowanego (`cat -n`,
`grep -n`, wlasny wydruk z indeksem) - nigdy z liczenia wierszy w zrzucie bez
numerow. Kazda podmiana zakresu ma miec asercje na OBU granicach: pierwsza linia
zakresu zaczyna sie tak, jak oczekujesz, i linia tuz ZA zakresem tez - to drugie
lapie bledna dlugosc, ktorej asercja na poczatku nie widzi. Po zapisie wydrukuj
okolice zmiany z numerami i przeczytaj ja, zamiast ufac komunikatowi "OK".
