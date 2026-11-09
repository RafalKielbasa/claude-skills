# karta-sprintu-ponawiana-po-korekcie-jednoznacznej

- **Skill:** sprint (bramka `docs/spotkania-kolejki.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rafał wpisał w „Other” korektę, która w całości rozstrzygała zapis karty osoby. Skill kazał zadać tę samą kartę jeszcze raz, a Rafał przerwał to pytanie i napisał „kontynnuj”. Ponowne pytanie kosztowało turę i niczego nie chroniło.

## Przyczyna źródłowa
Reguła „Other carries a correction: apply it, then ask the same card again” obejmuje każdą korektę. Korekta, która wybiera pozycje już widoczne na karcie albo podaje dni dla nazwanej pozycji, nie wnosi niczego, czego Rafał nie widział. Na ponownej karcie potwierdza więc to samo zdanie, które już napisał. Ponowne pytanie ma sens tylko wtedy, gdy korekta dokłada treść zaproponowaną przez Claude: nowe issue, pozycję spoza karty z estymatą Claude albo moją interpretację niejasnego zdania.

## Dowody
- 2026-11-09, sesja 3633cf62-9947-4cd6-8645-95bc257b4e9c (id claude.ai niedostępny): na karcie Barta Rafał wpisał „Dodaj DT-51”. Ponowna karta („Bart po poprawce (+ DT-51 / #740)”) wróciła jako „The user doesn't want to proceed with this tool use”, a następna wiadomość brzmiała „kontynnuj”. Zapisane zostało samo #740. Jednocześnie ponowne karty po korektach z nowymi issue (cel 1: n1 i n2, cel 3: n3 i n4, Grzegorz: n5) przeszły bez sprzeciwu, a po pierwszej ponownej karcie celu 1 Rafał dopisał kolejne korekty. Granica przebiega więc między korektą jednoznaczną a korektą dokładającą treść Claude. Obserwacja z jednej sesji, wątpliwa do czasu drugiego dowodu.

## Rozwiązanie
Gdy korekta z „Other” wybiera pozycje widoczne na karcie albo ustawia dni nazwanej pozycji i nie dodaje niczego spoza karty, zapisz ją od razu i potwierdź jedną linią w czacie: co zapisane i co zostało poza sprintem. Kartę zadaj ponownie tylko wtedy, gdy korekta dokłada nowe issue, pozycję spoza karty z estymatą Claude albo wymaga interpretacji.
