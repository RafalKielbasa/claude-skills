# kontrakt-danych-w-specu-niesprawdzony-wobec-konsumenta

- **Skill:** superpowers:brainstorming (też writing-plans)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Spec definiuje kontrakt danych (zapytanie, payload) w jednej sekcji, a ekrany, które go konsumują, w innej. Obie sekcje są spójne same w sobie, ale nie ze sobą ani z tym, jak magazyn przechowuje puste wartości. Rozjazd wychodzi dopiero w review całej gałęzi producenta, gdy poprawka kosztuje kolejne wdrożenie przed terminem.

## Przyczyna źródłowa
Sekcję kontraktu piszę od strony modelu danych (jakie pola są), a sekcje ekranów od strony makiety (co widać). Builder check i review planu czytają każdą sekcję pod kątem wykonalności, nikt nie mapuje elementu ekranu na pole kontraktu ani pola kontraktu na kolumnę i jej pustą wartość. SDL z `String` (nullable) sugeruje `null`, a pole `text()` Keystone trzyma `''`.

## Dowody
- 2026-10-21, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny), spec `kodozercy-platform-public-catalog`: sekcja 4.6 dawała w danych darmowej lekcji tylko tytuły lekcji, a sekcja 5.6 kazała ekranowi końcowemu pokazać dwie następne lekcje „z jednozdaniowym opisem”; kafel darmowej lekcji potrzebował też okładki kursu. Do tego `color`, `plannedMonth` i `description` wracały jako `''`, przez co fallback kafla do koloru `signal` przez `??` by nie zadziałał. Obie luki znalazło review całej gałęzi CMS; poprawione przed PR-em, żeby nie robić drugiego wdrożenia CMS przed live 28.10.
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven): seed `--marketplace` wg planu 5 odsłaniał w marketplace „two COINS”, a zapytanie `getCoinProducts` modala DevCoin bierze tylko produkty `isVisibleInMarketplace: false` — arkusz pokazałby modal z jedną paczką. Wyłapała recenzja całej gałęzi (Opus), nie review zadania.

## Rozwiązanie
Gdy spec definiuje kontrakt danych konsumowany w innej sekcji albo części, dołóż do specu tabelę „element ekranu → pole kontraktu → pole w magazynie i jego pusta wartość”. Każdy element ekranu bez pola i każde pole z pustą wartością różną od tej, którą zakłada konsument (`''` vs `null`), rozstrzygnij w specu, zanim powstanie plan.
