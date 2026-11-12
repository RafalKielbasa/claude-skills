# przejscie-zgodnosci-lekcji-lista-twierdzen-do-subagenta

- **Skill:** kurs-lekcja (krok 1, kontekst; poprawa lekcji napisanej dawno przed sąsiednimi)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Lekcja w `do_review` od dwóch miesięcy wymagała dopasowania do szesnastu zatwierdzonych później lekcji (około 56 tys. słów artykułów). Zamiast czytać wszystkie artykuły w głównym kontekście, wypisałem z lekcji każde odwołanie do wcześniejszego materiału jako numerowane twierdzenie i dałem tę listę jednemu subagentowi Explore z poleceniem werdyktu CONFIRMED / CONTRADICTED / PARTIAL / NOT FOUND z `plik:linia` i cytatem. Raport dał 11 pozycji „4.1 must change”, z których każda dała się sprawdzić jednym odczytem.

## Przyczyna źródłowa
Krok 1 skilla każe czytać „W CAŁOŚCI” artykuły wszystkich wcześniejszych lekcji, co ma sens przy pisaniu nowej lekcji. Przy poprawie istniejącej pytanie jest węższe: czy jej konkretne odwołania nadal są prawdą. Lista twierdzeń zamienia lekturę na weryfikację, a werdykt z cytatem pozwala sprawdzić subagenta bez powtarzania jego pracy.

## Dowody
- 2026-11-12, sesja 62c8c4bb-8377-436d-a2b6-aea1aa8bd57b: 15 twierdzeń lekcji agenty-ai 4.1 (JSON z 0.2, pinData z 0.3, okres próbny z 0.1, Form Trigger z 1.3, stan Asystenta z 2.3, karty Notion i spis cenników z 3.x, zapowiedzi z 3.4, terminologia). Wynik: otwarcie cytowało pytanie z 3.2 zamiast 3.4, brak Inżyniera zapowiedzianego w 3.4:258, nieznane wklejenie JSON z 1.4:49, okres próbny bez warunku i 90 dni z 0.1:41, arkusz bez nagłówków wbrew 0.2:37. Dwa ustalenia sprawdziłem sam przed użyciem (znak `=` w migawce Asystenta, 1.4:47-49). Równolegle drugi subagent badał zasięg automatu - osobny temat, bez nakładania się plików.

## Rozwiązanie
W `/kurs-lekcja`, krok 1, dopisać tryb poprawy lekcji istniejącej: „Gdy lekcja ma już treść, a wcześniejsze lekcje zmieniły się po niej, wypisz z artykułu i scenariusza każde odwołanie do wcześniejszego materiału (lekcja, nazwa, stan przepływu, liczba, zapowiedź) jako numerowane twierdzenie i zleć jednemu subagentowi werdykt dla każdego z `plik:linia` i cytatem. Ustalenia, na których opierasz zmianę faktu, sprawdź sam jednym odczytem. Artykuły poprzedniej lekcji i lekcji sąsiednich w module czytasz w całości sam.”
