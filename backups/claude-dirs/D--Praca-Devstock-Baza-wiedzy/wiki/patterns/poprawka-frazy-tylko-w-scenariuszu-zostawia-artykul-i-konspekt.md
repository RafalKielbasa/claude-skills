# poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt

- **Skill:** kurs-uwagi, kurs-redakcja, kurs-lekcja
- **Typ:** porażka
- **Status:** otwarty

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

## Rozwiązanie
Przy nanoszeniu uwagi zmieniającej dosłowny tekst wpisywany na ekranie (cokolwiek
stoi w scenariuszu w cudzysłowie i jednocześnie w konspekcie w odwrotnych
apostrofach) wyszukać tę frazę w `artykul.md` i `konspekt-nagrania.md` i albo
poprawić oba wystąpienia, albo wypisać je na bramce jako zmianę wymuszoną.
Docelowo: porównywać literały cytowane w kroku konspektu z literałami z linii
`[AKCJA: ...]` osobno od parowania kroków — para sparowana poprawnie nie znaczy,
że cytat w niej jest ten sam. Patrz też
[[naniesienie-uwagi-siega-poza-akapit-znacznika]] i
[[rozjazd-scenariusza-z-konspektem-wykrywany-maszynowo]].
