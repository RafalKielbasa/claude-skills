# uwaga-review-planu-sprawdzona-w-planie-siostrzanym

- **Skill:** superpowers:writing-plans
- **Typ:** sukces
- **Status:** otwarty

## Opis
Gdy jedna sesja pisze dwa plany o tej samej budowie (strumień web i mobile tej samej części), uwagę `codex`
do jednego planu sprawdza się w drugim i wciela w oba, zanim drugi pójdzie do commita.

## Przyczyna źródłowa
`codex exec` dostaje jeden plan naraz i nie wie o planie siostrzanym. Plany siostrzane mają te same
kroki weryfikacji i bramki, bo powstały z tego samego wzoru, więc luka w jednym (próg zamiast twardej
bramki, brak sprawdzenia po usunięciu) prawie zawsze jest i w drugim. Review drugiego planu tej luki nie
zgłosi, gdy oba review lecą równolegle albo gdy drugi plan sformułował ją inaczej.

## Dowody
- 2026-10-30, sesja 71a4e9dd-49b4-401d-b0e0-5d3ec341952f (id claude.ai niedostępny; Baza wiedzy, plany 9 (W5)
  i 10 (M5) migracji Kodożerców). Review planu 9: 4 uwagi, żadna o lincie. Review planu 10: uwaga 1 „lint
  z tolerancją bazy, a spec 8.4 wymaga czystego” i uwaga 2 „brak grepa usuniętych nazw po usunięciu (spec 6.7)”.
  Plan 9 miał obie luki („LINTALL ≤ Task 1”, grep tylko w zadaniu 6, nie w 5). Obie wcielone także w plan 9
  w tym samym commicie co plan 10 (`823b53f6`), z adnotacją w Osi indeksu; tabela uwag dla Rafała mówi, że
  dwie uwagi poszły do obu planów.

## Rozwiązanie
Po review każdego z planów siostrzanych przejdź listę uwag i dla każdej sprawdź, czy drugi plan ma ten sam
krok albo tę samą bramkę; jeśli ma, popraw oba i zapisz to w tabeli uwag („wcielona także w plan N”).
Najczęściej dotyczy to bramek weryfikacji (progi, kody wyjścia, greps po usunięciu), a rzadziej kroków
domenowych.
