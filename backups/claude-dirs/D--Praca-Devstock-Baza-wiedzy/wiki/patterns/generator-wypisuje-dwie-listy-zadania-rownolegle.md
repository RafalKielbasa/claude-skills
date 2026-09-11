# generator-wypisuje-dwie-listy-zadania-rownolegle

- **Skill:** kurs-zadania
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-11, kurs-zadania)

## Opis
Ćwiczenie `dopasowanie` powstaje z `elementy` i `cele` wypisanymi równolegle:
pierwszy element pasuje do pierwszego celu, drugi do drugiego i tak do końca.
Platforma renderuje obie kolumny w kolejności z bazy, więc kursant rozwiązuje
zadanie, łącząc karty po przekątnej, bez sięgania do treści lekcji.

## Przyczyna źródłowa
Dwie powiązane listy pisane w jednym przebiegu wychodzą w zgodnej kolejności —
tak się je układa, żeby nie pomylić par. Nic dalej tego nie prostowało: front
nie miesza (`DragActivity.tsx:160-161` podaje `content` i `targets` wprost do
komponentu), `struktura-zadania.md` nie miał reguły o kolejności, a walidator
sprawdzał poprawność par, nie ich układ. Defekt widać dopiero na zrzucie
ekranu z platformy, czyli po publikacji.

## Dowody
- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: Rafał przysłał zrzut
  ekranu z platformy — siedem par połączonych idealną przekątną. Pomiar na
  commicie `c3a94f6`: `dopasowanie-01-gdzie-w-n8n.json` **7/7 na przekątnej**,
  `dopasowanie-01-sygnaly-na-kanwie.json` **6/6**. Oba to MATCH generowane
  przez `/kurs-zadania`. SORT i oba CATEGORIZE były czyste — SORT dlatego, że
  jego ówczesny format trzymał kolejność w osobnym polu `kolejnosc`, więc
  `elementy` musiały być wymieszane, żeby plik w ogóle miał sens.

## Rozwiązanie
Kolejności list nie ustawia autor. Po wygenerowaniu ćwiczenia `dopasowanie`
uruchom `npm run tasuj -- <ścieżka-lekcji>` (krok 5 skilla): komenda przestawia
`cele` (MATCH/CATEGORIZE) albo `elementy` (SORT) poza przekątną, deterministycznie
i idempotentnie, nie ruszając `rozwiazanie`. Walidator odrzuca układ przekątny
przy 3+ elementach jako BŁĄD, więc plik z tym defektem nie przejdzie bramki.

Uogólnienie na przyszłe zadania: gdy defekt bierze się z nawyku generowania,
regułą w skillu go nie zamkniesz — potrzebne jest narzędzie, które ustawia
wynik, i sprawdzenie, które go pilnuje. Patrz `~/.claude/wiki/patterns/defekt-generowania-naprawiany-narzedziem-nie-regula.md`.
