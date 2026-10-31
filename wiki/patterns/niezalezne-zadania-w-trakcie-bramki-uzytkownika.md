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
- 2026-10-30/31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, plan 9 W5), wariant: bramka na wspólnym zasobie zamiast na wyniku. Każde uruchomienie lokalnego stosu (wspólnego z sesją M5) wymagało słowa Rafała. Ruling R4: wszystkie przebiegi na stosie (seed `--paywall`, E2E z flagą wł./wył., smoke, bramka regresji) zebrane w jedno okno po zadaniach 1–10, weryfikacji i review całej gałęzi; kod E2E i smoke recenzowany przed przebiegiem. Jedna prośba zamiast czterech, praca bez postoju ~20 godzin zegarowych. Koszt widoczny: dwie rundy poprawek smoke dopiero w oknie (wzorzec wiersza sylabusa, tytuł ankiety w bazie inny niż w seedzie) i brak `db:push` po scaleniu #1713 wykryty dopiero tam — przeszły recenzję zawężoną, nie review całości.

## Rozwiązanie
Przy bramce użytkownika w środku planu: z tabeli pre-flight wypisz zadania niezależne od wyniku
bramki i dispatchuj je, zmianę kolejności zapisz w ledgerze jako ruling z kosztem błędu, a zadania
zależne zostaw. Nie odgaduj wyniku bramki, żeby odblokować zależne.
