# poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt

- **Skill:** kurs-uwagi, kurs-redakcja, kurs-lekcja
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-11, kurs-uwagi)

## Opis
Fraza, którą nagrywający wpisuje na ekranie (pytanie do czatu, nazwa credentiala,
wartość pola), żyje naraz w trzech plikach lekcji: dosłownie w `artykul.md`,
dosłownie w `konspekt-nagrania.md` i w mowie w `video/scenariusz.md`. Poprawka
naniesiona do scenariusza zostawia dwa pozostałe wystąpienia nietknięte. Efekt
widać dopiero na nagraniu: pytanie wpisane w czacie mówi co innego niż głos lektora.

## Przyczyna źródłowa
`/kurs-uwagi` z definicji rusza wyłącznie plik ze znacznikiem i obiecuje, że poza
akapitem znacznika plik zostaje bajt w bajt — nic w tym kontrakcie nie wychodzi
poza jeden plik. Generator planu nagrania paruje kroki konspektu z liniami
`[AKCJA: ...]` po treści całego kroku, więc para różniąca się jednym słowem
paruje się czysto i nie daje ostrzeżenia; różnicy w cytowanym literale nikt nie
porównuje. Artykuł nie jest wtedy porównywany z niczym.

## Dowody
- 2026-09-11, sesja session_01Ed5FeuzWuuXgE2NexUX3pe: przy składaniu ściągi
  klawiaturowej do `dane-do-nagrania.md` lekcji 2.1 wyszło, że `artykul.md`
  (Krok 5 i Krok 7) oraz `konspekt-nagrania.md` (kroki 21, 31, 39) każą wpisać
  „Co dziś przyszło na skrzynkę?" i „Czy ktoś dziś pytał o storczyki?", a
  narracja mówi „wczoraj" (`video/scenariusz.md:93`, `:137`, `:169`). Zmiana na
  „wczoraj" weszła tego samego dnia przez `/kurs-uwagi`, sesja
  session_01YVYBimtiCfF3SS1QHH4Cvi — jest wymieniona w jej logu jako jedna
  z uwag sięgających poza akapit znacznika. `npm run validate` na lekcji
  przechodzi czysto, plan nagrania nie zgłasza tej pary. Sekcja 3 tego samego
  `dane-do-nagrania.md` każe przy tym wysłać maile **w dniu nagrania**, co pasuje
  tylko do wersji „dziś" — rozjazd dotyka więc też przygotowania środowiska.

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi (redakcja M02L01):
  naprawa rozjazdu „dziś/wczoraj" objęła trzy miejsca w `artykul.md` (kroki 5,
  7 i 8), a `video/konspekt-nagrania.md` została nietknięta i nadal każe wpisać
  `Co dziś przyszło na skrzynkę?` (linia 101) oraz `Czy ktoś dziś pytał
  o storczyki?` (linie 126 i 147). Przyczyna po stronie procedury, nie uwagi:
  krok 1 `/kurs-redakcja` wymienia pliki do redakcji (`artykul.md`,
  `video/scenariusz.md`, `video/prezentacja.yaml`, `quiz.json`,
  `cwiczenia/*.json`) i konspektu w tym zestawie nie ma, a nowa reguła rozjazdów
  dopisana tego samego dnia mówi wyłącznie o artykule. `plan-nagrania.md`
  przegenerowany po redakcji zestawia krok 21 „wpisz `Co dziś przyszło na
  skrzynkę?`" z narracją „Co wczoraj przyszło na skrzynkę" i nie daje
  ostrzeżenia, bo paruje po treści kroku, nie po literale — dokładnie granica
  metody opisana w [[rozjazd-scenariusza-z-konspektem-wykrywany-maszynowo]].
  Trzeci dzień tej samej frazy w obiegu.

## Rozwiązanie
**Zaadresowane 2026-09-11 w `kurs-uwagi`** — decyzja Rafała: „skill kurs-uwagi
powinien aktualizować wszystkie treści które są zależne, czyli artykuł,
scenariusz, konspekt, i dane do nagrania, w innym wypadku zawsze będzie
rozjazd". Skill ma teraz krok 7 „Propagate to every file the change touches"
z tabelą rodzajów zmiany i ich odpowiedników, regułą jednokierunkowości
(scenariusz źródłem prawdy), nakazem tłumaczenia pisowni zamiast kopiowania
stringu i obowiązkiem `grep` po STARYM brzmieniu we wszystkich plikach
zależnych; krok 1 inwentaryzuje pliki zależne, krok 8 wymaga zacytowania
liczników `grep` w raporcie, a „Zasady" nazywają uwagę naniesioną tylko
w scenariuszu naniesioną w połowie. Poniżej pierwotna propozycja tej strony,
zgodna co do kierunku, ale węższa — mówiła o wyszukaniu frazy, nie o kroku
procedury z własnym raportem.

Przy nanoszeniu uwagi zmieniającej dosłowny tekst wpisywany na ekranie (cokolwiek
stoi w scenariuszu w cudzysłowie i jednocześnie w konspekcie w odwrotnych
apostrofach) wyszukać tę frazę w `artykul.md` i `konspekt-nagrania.md` i albo
poprawić oba wystąpienia, albo wypisać je na bramce jako zmianę wymuszoną.
Docelowo: porównywać literały cytowane w kroku konspektu z literałami z linii
`[AKCJA: ...]` osobno od parowania kroków — para sparowana poprawnie nie znaczy,
że cytat w niej jest ten sam. Patrz też
[[naniesienie-uwagi-siega-poza-akapit-znacznika]] i
[[rozjazd-scenariusza-z-konspektem-wykrywany-maszynowo]].
