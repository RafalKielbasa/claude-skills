# pod-decyzja-odlozona-w-rozstrzygnietej-znika-z-czekajacych

- **Skill:** project-index
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przy rozstrzyganiu decyzji wychodzi pytanie poboczne, np. gdzie wdrożyć poprawkę albo czy dodać
funkcję. Trafia ono do tekstu wpisu w „Rozstrzygniętych” i do „Następnego kroku”, a nie do „Decyzji
czekających”. Kiedy Rafał potem je odkłada, odłożenie też ląduje w środku rozstrzygniętego wpisu. W efekcie:
- lista czekających decyzji go nie pokazuje;
- każda zmiana odpowiedzi przepisuje kilka miejsc indeksu, zamiast dopisać jedną linię.

## Przyczyna źródłowa
Procedury 5–7 skilla (otwarcie, rozstrzygnięcie i odłożenie decyzji) uruchamiają się dla decyzji
z własną nazwą. Pytanie poboczne pojawia się w tej samej turze, w której piszę wpis rozstrzygnięcia.
Nie ma nazwy, więc zostaje zdaniem tego wpisu. Potem treść wariantu w bramce („zmieniam w dwóch
miejscach…”) utrwala to miejsce, zanim ktoś sprawdzi procedurę 7.

## Dowody
- 2026-11-03, sesja 1bb3295d-0143-449c-a32a-2455751c1556 (id claude.ai niedostępny), indeks
  `kodozercy-platform.md`:
  - Pytanie przy DT-80 „gdzie wdrożyć automatyczne 10 zadań dla subskrybenta” trafiło do wpisu
    „Model darmowych zadań (DT-80)” i do „Następnego kroku” jako „kandydat #807” (`cb1c79ba`).
    Procedura 5 nie została użyta.
  - Rafał w rozmowie głosowej przez hub: „Nie ruszamy tego”. Korekta przepisała trzy miejsca
    (`82afc6ad`).
  - Odłożenie „bez terminu” stoi we wpisie w „Rozstrzygniętych” i w „Następnym kroku”. W „Decyzjach
    czekających” są tylko „Aplikacja ze sklepu a backend po #1670” i „Ekran celu dziennego po scaleniu
    DT-37”.

## Rozwiązanie
Pytanie, którego Rafał nie rozstrzyga w tej samej odpowiedzi co decyzję główną, dostaje własną nazwę
i własną linię w „Decyzjach czekających” (procedura 5). Wpis w „Rozstrzygniętych” odsyła do niego po
nazwie. Odłożenie dopisuje w tej linii „Odłożona RRRR-MM-DD do <termin albo warunek>.” (procedura 7),
także wtedy, gdy terminu nie ma („bez terminu”). Bramka, która proponuje zmianę indeksu, podaje sekcję,
do której trafi wpis, zgodną z procedurą.
