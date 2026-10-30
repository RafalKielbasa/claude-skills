# generator-wypisuje-dwie-listy-zadania-rownolegle

- **Skill:** kurs-zadania
- **Typ:** porażka
- **Status:** nawrót (2026-10-30)

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
- 2026-10-30, sesja ddceb20d-ddb9-4c33-a2fb-0c560fc81c28 (id claude.ai niedostępny; lekcja agenty-ai 3.2,
  `cwiczenia/dopasowanie-01-zwolnic-ponowic-odlozyc.json`): nowy wariant tej samej klasy (kolejność list
  zdradza odpowiedź), w kategorii CATEGORIZE. `elementy` napisane blokami po kategorii (dwie sytuacje
  „zwolnić”, dwie „ponowić”, dwie „odłożyć”), `npm run tasuj` przemieszał tylko `cele` („przetasowano
  cele”), walidator przeszedł czysto, bo przekątnej nie było. Na platformie sąsiednie karty dawałyby
  odpowiedź parami. Złapane okiem przed bramką, w kroku 4 skilla (punkt „czy zadanie da się rozwiązać bez
  wiedzy z lekcji”); elementy przestawione ręcznie, nieregularnie, jak w ćwiczeniu 2.4.

## Rozwiązanie
Kolejności list nie ustawia autor. Po wygenerowaniu ćwiczenia `dopasowanie`
uruchom `npm run tasuj -- <ścieżka-lekcji>` (krok 5 skilla): komenda przestawia
`cele` (MATCH/CATEGORIZE) albo `elementy` (SORT) poza przekątną, deterministycznie
i idempotentnie, nie ruszając `rozwiazanie`. Walidator odrzuca układ przekątny
przy 3+ elementach jako BŁĄD, więc plik z tym defektem nie przejdzie bramki.

Luka z 2026-10-30: w CATEGORIZE kilka elementów ma ten sam cel, więc przeciek nie
jest przekątną, tylko blokiem sąsiednich elementów z jednym celem. `tasuj` tego
nie rusza (miesza tylko `cele`), a walidator tego nie widzi. Poprawka idzie do
narzędzia, nie do reguły: `tasuj` przy CATEGORIZE miesza też `elementy` tak, żeby
żadne dwa sąsiednie nie miały tego samego celu, a walidator zgłasza taki blok
(dwa albo więcej sąsiednich elementów z jednym celem) co najmniej ostrzeżeniem.

Uogólnienie na przyszłe zadania: gdy defekt bierze się z nawyku generowania,
regułą w skillu go nie zamkniesz — potrzebne jest narzędzie, które ustawia
wynik, i sprawdzenie, które go pilnuje. Patrz `~/.claude/wiki/patterns/defekt-generowania-naprawiany-narzedziem-nie-regula.md`.
