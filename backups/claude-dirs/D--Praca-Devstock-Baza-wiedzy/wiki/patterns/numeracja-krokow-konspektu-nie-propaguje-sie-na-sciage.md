# numeracja-krokow-konspektu-nie-propaguje-sie-na-sciage

- **Skill:** kurs-uwagi, kurs-redakcja
- **Typ:** porazka
- **Status:** otwarty

## Opis
`video/dane-do-nagrania.md` adresuje swoje bloki numerami krokow
z `video/konspekt-nagrania.md` ("| 25 | okno czatu |", "### Krok 36",
"kolumna `klient` (krok 8)"). Dodanie albo usuniecie kroku w konspekcie
przesuwa cala numeracje, a sciaga zostaje ze starymi numerami i wskazuje kroki,
ktorych pod tymi numerami juz nie ma.

## Przyczyna zrodlowa
Numer kroku jest kontraktem miedzy dwoma plikami, ale nie jest literalem
w sensie regul propagacji: nie da sie go znalezc `grep`-em po starym brzmieniu,
bo "6" wystepuje w obu plikach w dziesiatkach innych rol. Tabele propagacji
w obu skillach wymieniaja nazwy pol, pytania do czatu i linie `[AKCJA: ...]`,
a numeracje pomijaja. Walidator nigdy nie porownuje plikow miedzy soba,
a `plan-nagrania` paruje kroki z akcjami po tresci i o numerach w sciadze
nie wie nic.

## Dowody
- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: w drzewie roboczym lezala niezacommitowana
  zmiana konspektu M02L02, ktora usunela dwa kroki "Zapisz przeplyw" (stare 11
  i 35) i przenumerowala plik z 45 na 43 kroki. `dane-do-nagrania.md` zostal przy
  starej numeracji w **19 odwolaniach**. Wyszlo to dopiero wtedy, gdy generator
  planu zaczal wypisywac ostrzezenia z numerami krokow i musialem je zestawic ze
  sciaga. Naprawa w tej samej sesji dolozyla jeszcze jeden krok (brakujace ujecie
  w segmencie 2), wiec numeracja ruszyla sie drugi raz, 43 -> 44. Ostatecznie
  z 19 odwolan zmienily sie trzy (6->7, 8->9, 36->35), bo usuniecie dwoch krokow
  i dodanie jednego znosi sie w przedziale 12-34 - czyli szesnascie odwolan
  wrocilo na swoje miejsce przypadkiem. To gorsze niz jawny rozjazd, bo maskuje
  skale problemu: wyrywkowe sprawdzenie trafia w odwolanie, ktore akurat sie zgadza.

## Rozwiazanie
Do tabeli propagacji w obu skillach (`kurs-uwagi` krok 7, `kurs-redakcja` krok 6)
dopisac wiersz: "zmiana liczby albo kolejnosci krokow w `konspekt-nagrania.md`
-> wszystkie odwolania numeryczne w `dane-do-nagrania.md`". Kontrola nie przez
`grep` po numerze, tylko przez zestawienie maszynowe: dla kazdego numeru uzytego
w sciadze wypisac tresc kroku o tym numerze w konspekcie i sprawdzic, czy to ten
sam krok. W raporcie cytowac to zestawienie, nie samo "sprawdzilem".
