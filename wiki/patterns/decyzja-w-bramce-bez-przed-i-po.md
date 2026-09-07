# decyzja-w-bramce-bez-przed-i-po

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Punkt „do decyzji" w raporcie bramki opisuje zmianę skrótem: fragment nowego
brzmienia w cudzysłowie plus uzasadnienie w postaci reguły. Użytkownik
odpowiada „nie rozumie" i bramka kosztuje dodatkową turę na wyjaśnienie tego,
co powinno było stać w raporcie od razu.

## Przyczyna źródłowa
Tabela zmian w tym samym raporcie ma kolumnę „przed → po", ale lista decyzji
jest pisana jak lista tematów, nie jak lista zmian: brakuje dosłownego
„przed", a powód, dla którego to decyzja użytkownika („to dodaje treść,
a redakcja zmienia tylko język"), stoi jako reguła bez pokazania, co konkretnie
dodano. Użytkownik nie może odtworzyć zmiany z opisu, więc nie ma na czym
oprzeć decyzji; punkty z konkretem obok przechodzą za pierwszym razem.

## Dowody
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: bramka `/kurs-redakcja`
  M00L01, punkt 2: „Dopisek w haku artykułu (`artykul.md:7`): «W Zielonym
  Ogrodzie, sklepie z roślinami, który będzie nam towarzyszyć przez cały kurs,
  …». To jedyna zmiana na granicy merytoryki: agent uzasadnia, że M00 idzie
  przed M01L01, gdzie firma jest wprowadzana." Rafał: „2. nie rozumie".
  Dopiero druga wersja — dosłowne „przed" i „po", gdzie firma jest wprowadzana
  (M01L01 `artykul.md:7`), dlaczego to wykracza poza `redakcja.md`, źródło
  faktu (`kurs.yaml:3`), rekomendacja — dostała „Zostaje". Punkty 1, 3, 4 i 5
  tej samej listy, każdy z konkretem, zostały rozstrzygnięte za pierwszym
  razem.

## Rozwiązanie
Każdy punkt, który prosi użytkownika o decyzję, ma stały kształt:
`plik:linia`, dosłowne „przed", dosłowne „po", jedno zdanie, dlaczego to jego
decyzja, a nie moja, i rekomendacja. Skrót wolno stosować w tabeli zmian już
zaakceptowanych, nigdy w liście decyzji.
