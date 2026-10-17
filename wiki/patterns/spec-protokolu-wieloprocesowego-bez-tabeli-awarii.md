# spec-protokolu-wieloprocesowego-bez-tabeli-awarii

- **Skill:** superpowers:brainstorming (też superpowers:writing-plans)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Spec protokołu, który dzielą osobne procesy (kolejka, rezerwacja, blokada), opisuje szczęśliwą ścieżkę i jedną awarię, a resztę awarii odkrywa review po implementacji. Każda kolejna fala poprawek łata jeden stan i potrafi otworzyć następny.

## Przyczyna źródłowa
Brainstorming pyta o cele, decyzje i anty-cele, ale nie wymusza przeglądu „co, jeśli proces zginie w tym stanie”. Anty-cel („lekcja czeka po cichu w nieskończoność”) był w specu, ale bez wyliczenia stanów, w których może się spełnić. Plan dziedziczy tę lukę: testy sprawdzają opisane stany, a stan nienazwany nie ma testu.

## Dowody
- 2026-10-16/17, sesja 1506ab90-7988-4231-ab1a-6beb3e2c2db1: spec kolejki do konta kursu (`docs/superpowers/specs/2026-10-16-nagrywanie-parallel-lessons-design.md` §6) opisał tylko martwego posiadacza. Po 5 zadaniach przyszły 4 fale poprawek, każda na nienazwany stan: martwe czoło kolejki (fala 1), `station-leave` cofany przez trwające oczekiwanie, rezerwacja tymczasowa po zabitym procesie (fala 1), kaskada bramek z wpisu lekcji, która właśnie zgłosiła (fala 2, wprowadzona przez fix fali 1), blokada po oczekiwaniu zabitym w trakcie zapisu, uśpienie komputera > 30 min, drugi żywy proces tej samej lekcji (fala 4). Recenzja ostatniej fali nadal znalazła 3 Minor tej klasy (ponowne użycie pid, oczekiwanie bez okna łaski po wybudzeniu, skok zegara wstecz).

## Rozwiązanie
Gdy projekt obejmuje stan współdzielony przez osobne procesy albo sesje, spec zawiera tabelę „stan × zdarzenie”, zanim pójdzie do planu: wiersze to każdy stan uczestnika (trzyma, czeka w kolejce, zgłosił i czeka na człowieka, rezerwacja tymczasowa, w trakcie zapisu), kolumny to zdarzenia (proces zabity, zabity w trakcie zapisu pod blokadą, komputer uśpiony dłużej niż próg, zegar przestawiony, pid użyty ponownie, ten sam uczestnik uruchomiony drugi raz). Każda komórka mówi, co widzi człowiek (jedna bramka, kiedy) i co się dzieje z zasobem. Plan dostaje po jednym teście na komórkę, a review sprawdza tabelę sondą z prawdziwymi procesami.
