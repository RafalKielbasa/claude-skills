# twierdzenie-negatywne-o-narzedziu-bez-zrodla

- **Skill:** kurs-lekcja (kroki 2 i 4), dotyczy też kurs-redakcja
- **Typ:** porażka
- **Status:** otwarty

## Opis
Do artykułu lekcji weszło zdanie o tym, czego narzędzie NIE robi („wiadomość
jedzie do modelu na czas jednej odpowiedzi i nie zostaje w żadnej bazie po
Twojej stronie"), i było nieprawdziwe: treść zostaje w historii wykonań n8n
oraz w pamięci rozmowy agenta. Ani walidator, ani `review-ai` tego nie zgłosiły
— wyszło przy własnym, ostatnim czytaniu przed bramką.

## Przyczyna źródłowa
Styleguide wymaga źródła dla „każdego twierdzenia o narzędziu, limicie czy
cenie", ale twierdzenie negatywne z natury nie ma cytatu: dokumentacja opisuje,
co produkt robi, nie czego nie robi. Zdanie „X nigdzie nie zostaje" nie generuje
więc żadnego wpisu w `zrodla.md` i przechodzi przez krok 2 bez śladu. `review-ai`
dostaje jedną lekcję bez wcześniejszych, więc nie może skonfrontować twierdzenia
z mechanizmem opisanym w innej lekcji tego samego kursu - tu w 0.3, która uczy
czytania historii wykonań. Zdanie jest przy tym atrakcyjne, bo domyka wątek
RODO uspokajającą pointą.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: lekcja 2.1 kursu
  agenty-ai, sekcja „Czego wtyczka nie zmienia w Twoich obowiązkach". Zdanie
  o braku trwałego zapisu miało kontrastować z bazą wektorową z lekcji 1.5
  i było potrzebne narracyjnie. `zrodla.md` dla lekcji 2.1 miał 13 pozycji,
  żadna nie dotyczyła tego twierdzenia — bo nie było czego zacytować.
  `review-ai` wystawił AKCEPTACJĘ i osobno pochwalił, że „wszystkie twierdzenia
  techniczne i informacje o limitach posiadają odpowiednie odniesienia do
  źródeł". Naprawa w tej samej turze: akapit rozbity na dwa (co NIE trafia do
  bazy wektorowej / gdzie treść JEDNAK zostaje), źródło
  `types-of-executions` dopisane do `zrodla.md`.

## Rozwiązanie
W kroku 4 (samokontrola) przejść po zdaniach mówiących, czego narzędzie nie robi
albo gdzie czegoś nie ma — „nie zostaje", „nic nie zapisuje", „nie da się",
„bez śladu" — i przy każdym zadać pytanie odwrotne: **gdzie ta treść jednak
ląduje i który mechanizm z wcześniejszych lekcji temu przeczy?** Twierdzenie
negatywne wymaga źródła tak samo jak pozytywne, tylko źródłem jest opis
mechanizmu, który by je obalił, albo jawne „sprawdzone, nie znalazłem".

Zdanie, którego nie da się podeprzeć ani obalić, przepisz na zakresowe („nie
trafia do bazy wektorowej" zamiast „nie zostaje nigdzie") — węższe twierdzenie
jest prawdziwe i zwykle niesie dokładnie tę samą pointę.
