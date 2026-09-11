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

## Rozwiazanie
Po kazdej redakcji scenariusza lekcji demo przegenerowac plan nagrania i przeczytac ostrzezenia,
zanim lekcja pojdzie do nagrania. Konspekt i scenariusz maja nazywac ten sam kadr tymi samymi
slowami: rozjazd nazewnictwa objawia sie jako „sparowany po kolejnosci” i jest sygnalem
do ujednolicenia tresci, nie do zmiany progu.
