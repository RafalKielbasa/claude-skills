# bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu

- **Skill:** kurs-redakcja
- **Typ:** sukces
- **Status:** otwarty

## Opis
Krok 2 (model, effort) i krok 3 (plan, ostrzeżenia, potwierdzenie startu)
poszły w jednym `AskUserQuestion` z trzema pytaniami, poprzedzonym
inwentaryzacją i konsekwencjami statusów. Rafał odpowiedział raz i przy okazji
rozszerzył zakres (scenariusz + artykuł zamiast samego scenariusza).

## Przyczyna źródłowa
Oba kroki czekają na tę samą osobę i żadna odpowiedź z kroku 2 nie zmienia
treści pytania z kroku 3. Rozdzielenie ich kosztuje turę, a reguła „czekaj na
odpowiedź, timeout to nie zgoda" jest spełniona tak samo, bo trzecie pytanie
jest jawnym potwierdzeniem startu z opcją „Nie startuj". Warunek: lista plików
i konsekwencje (statusy `video`, koszt re-renderu) muszą stać w tekście przed
pytaniem, inaczej potwierdzenie jest ślepe.

## Dowody
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: jedno wywołanie
  z pytaniami Model / Effort / Start (opcje: tylko scenariusz, scenariusz
  i artykuł, nie startuj), nad nim tabela plików i statusów oraz opis
  niezacommitowanych dopisków; odpowiedź „fable, xhigh, Scenariusz i artykuł"
  — zakres większy niż w prośbie, bez dodatkowej tury.

## Rozwiązanie
W skillu połączyć kroki 2 i 3: po inwentaryzacji jedno `AskUserQuestion`
z modelem, effortem i potwierdzeniem zakresu (z opcją odmowy), przy czym lista
plików i konsekwencje statusów stoją w wiadomości nad pytaniem. Timeout nadal
nie jest zgodą.
