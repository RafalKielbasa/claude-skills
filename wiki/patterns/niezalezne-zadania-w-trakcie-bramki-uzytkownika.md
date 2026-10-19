# niezalezne-zadania-w-trakcie-bramki-uzytkownika

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Plan ma bramkę użytkownika w środku (wynik, który dostarcza tylko on), a skill każe wykonywać zadania
bez przerw. Bramki nie rozstrzygam za użytkownika; zadania niezależne od jej wyniku idą dalej, a
zależne czekają.

## Przyczyna źródłowa
Ciągłość egzekucji ze skilla i zakaz ruszania bez decyzji z CLAUDE.md przestają być sprzeczne, gdy
skan pre-flight ma tabelę zależności między zadaniami. Z tabeli widać, które zadanie konsumuje wynik
bramki, więc wiadomo, co można uruchomić bez zgadywania.

## Dowody
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), plan 1
  biblioteki Kodożerców: bramka zadania 1 (zrzuty z telefonu) otwarta przez całą resztę sesji.
  Ledger: „Ruling: Task 4 (contrast guard) runs before Task 3 while the Task 1 gate is open — it
  consumes only resolveColor, composite, contrastRatio from Task 2”. Zadania 2 (z jedną rundą
  poprawek) i 4 zamknięte z czystym review, zadanie 3 nietknięte do wyniku sond. Każda tura kończyła
  się markerem „⏸ Czeka na decyzję: wyniki sond z telefonu”.

## Rozwiązanie
Przy bramce użytkownika w środku planu: z tabeli pre-flight wypisz zadania niezależne od wyniku
bramki i dispatchuj je, zmianę kolejności zapisz w ledgerze jako ruling z kosztem błędu, a zadania
zależne zostaw. Nie odgaduj wyniku bramki, żeby odblokować zależne.
