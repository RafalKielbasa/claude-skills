# rozjazd-scenariusza-z-konspektem-wykrywany-maszynowo

- **Skill:** kurs-lekcja, kurs-redakcja, kurs-video
- **Typ:** sukces
- **Status:** otwarty

## Opis
`video/scenariusz.md` i `video/konspekt-nagrania.md` opisuja ten sam przebieg nagrania z dwoch
stron i rozjezdzaja sie przy kazdej redakcji jednego z nich. Generator planu nagrania paruje kroki
z akcjami po tresci i zglasza kazda pare, ktorej nie umial zestawic — dzieki temu rozjazd
wychodzi przed nagraniem, a nie w trakcie.

## Przyczyna zrodlowa
Nic w pipeline nie czytalo obu plikow naraz: walidator sprawdzal konspekt wylacznie na istnienie
i niepustosc (`src/validate-lesson.js`). Redakcja scenariusza jest tania i czesta, konspekt
poprawia sie osobno, wiec rozbieznosc powstaje domyslnie, a kosztuje dopiero przy kamerze.

## Dowody
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: pierwsze uruchomienie generatora na M00L03 dalo cztery ostrzezenia, z czego dwa
  opisywaly swiezy rozjazd wprowadzony tego samego dnia — Rafal zredagowal segment 5 tak, ze
  narracja nie uruchamia juz wezla przed przypieciem i doklada przeladowanie strony, a konspekt
  nadal kazal „otworz wezel i uruchom go”. Po dociagnieciu konspektu zostaly dwa
  ostrzezenia i oba sa poprawne (wskazowka timingowa bez wlasnego kroku, krok robiony w ciszy).
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: mechanizm zlapal tez moja wlasna redakcje — krok 15 przepisany na „pasek
  nad danymi z informacja o przypieciu” przestal pasowac do wskazowki „pokaz baner
  o przypietych danych” i wrocil jako „sparowany po kolejnosci”. Powrot do slowa
  „baner” ostrzezenie zdjal.

- 2026-09-11, sesja session_01Ed5FeuzWuuXgE2NexUX3pe: mechanizm dzialal, ale ostrzezenie nikt nie przeczytal. Krok 44 konspektu M02L01 ("pokaz liste wezlow narzedziowych i przewin ja powoli") stoi w planie jako "parowanie po kolejnosci", bo linia `[AKCJA: ...]` scenariusza kaze w tym miejscu WYSZUKAC Slack, Notion, Trello i Airtable - czyli wpisac cztery frazy, o ktorych konspekt milczy. Rozjazd wyszedl dopiero przy recznym skladaniu sciagi klawiaturowej, dwa dni po wygenerowaniu planu. Granica metody: ostrzezenie w wygenerowanym pliku jest warte tyle, ile kroki procedury, ktore kaza je przeczytac - zaden skill nie ma dzis punktu "przejdz ostrzezenia planu przed nagraniem".

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi (pamięć rozmowy w M02L01): ostrzeżenia zostały
  przeczytane i posłużyły jako **sygnał akceptacji zmiany**, a nie tylko jako
  lista do przejrzenia. Po każdej z trzech rund zmian w segmentach 8 i 9
  przegenerowałem plan i porównałem zbiór ostrzeżeń ze stanem sprzed zmian:
  15 przed i 15 po, wszystkie stare, żadne nowe w segmencie 8. Kroki 31 i 39
  po przepisaniu na wielolinijkowe bloki z uzasadnieniem sparowały się po
  treści, nie „po kolejności" — czyli rozjazdu nazewniczego nie wprowadziłem.
  Metoda działa też jako kontrola regresji przy własnej edycji, o ile ma się
  liczbę wyjściową sprzed zmiany; bez niej 15 ostrzeżeń wygląda jak awaria.
  Granica z poprzedniego dowodu potwierdzona: krok 40, który mówi nieprawdę
  o treści narracji, parował się czysto przez całą sesję.


- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: piaty dowod i pierwszy, w ktorym generator znalazl
  defekt **starszy niz sesja**, a nie swiezo wprowadzony. Pierwsze uruchomienie na
  M02L02 dalo 12 ostrzezen; dwa z nich ("Segment 2, krok 5: sparowany po kolejnosci"
  oraz "akcja «otworz wezel Google Sheets i pokaz pola Document i Sheet» bez kroku
  w konspekcie") mialy wspolna przyczyne: konspekt zlal dwa beaty scenariusza w jeden
  krok i opisal inny panel, niz mowi narracja. W wygenerowanym planie widac to bylo
  jako wiersz z narracja `#7` i **pusta komorka ekranu** - narracja bez kadru do
  nagrania. Po poprawieniu kroku 5 i dolozeniu kroku 6 ostrzezen zostalo 10
  i wszystkie okazaly sie nieszkodliwe (parowanie po kolejnosci x6, brak narracji x4,
  kazde przejrzane para po parze w pliku). Wniosek metodyczny: pusta komorka ekranu
  przy narracji, ktora nie jest zdaniem otwierajacym segment, jest mocniejszym
  sygnalem niz samo ostrzezenie - warto ja liczyc osobno.

## Rozwiazanie
Po kazdej redakcji scenariusza lekcji demo przegenerowac plan nagrania i przeczytac ostrzezenia,
zanim lekcja pojdzie do nagrania. Konspekt i scenariusz maja nazywac ten sam kadr tymi samymi
slowami: rozjazd nazewnictwa objawia sie jako „sparowany po kolejnosci” i jest sygnalem
do ujednolicenia tresci, nie do zmiany progu.
