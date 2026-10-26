# sledzone-typy-codegen-ukrywaja-zmiane-schematu-backendu

- **Skill:** ogólny (superpowers:writing-plans, superpowers:subagent-driven-development)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Klient z wygenerowanymi typami GraphQL w gicie przechodzi typecheck, lint i recenzje zadań. Tymczasem backend
usunął pola, z których korzystają dokumenty klienta. Błąd wychodzi dopiero na urządzeniu, jako brakujący element
UI, a nie jako komunikat błędu.

## Przyczyna źródłowa
`__generated__` jest śledzony i powstał z introspekcji starszego schematu. `tsc` sprawdza kod tylko względem tych
typów, więc zmiana schematu scalona w backendzie po ostatnim `pnpm codegen` jest dla niego niewidoczna. Dokument
sprawdza względem żywego schematu dopiero serwer, przy pierwszym zapytaniu. Fetcher rzuca wtedy na każdy wpis
`errors`, a hook, który przy błędzie chowa element, robi to bez śladu. Plan stawia `pnpm codegen` tylko przy
zmianie dokumentu, nigdy przy zmianie backendu.

## Dowody
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf),
  code-busters-mobile, bramka M1 na telefonie. Wiersz 3: „Brak paska na mobilce, jest jedynie na web”.
  - Sonda `ribbon-probe.mjs` pokazała błąd walidacji GraphQL na `Coupon.product`.
  - Przyczyną był code-busters#1670 (`8113138f8`), który usunął `Coupon.product`, `Product.discountPrice`,
    `Product.lowestPriceLast30Days` i `Product.coupons`. Popsuł 4 dokumenty mobile: paski, ekran kursu, marketplace
    i moment ukończenia.
  - `pnpm typecheck` był przez cały plan zielony.
  - Walidator `validate-docs.cjs` (wszystkie dokumenty wobec eksportu schematu DT-37) w jednym przebiegu wskazał
    te 4 dokumenty. Po naprawie dał `36 documents, 0 with errors`.
  - Ta sama niezgodność siedzi w aplikacji ze sklepu (`main` mobile).

## Rozwiązanie
W repo klienta ze śledzonymi typami codegen, przed bramką na urządzeniu i przed scaleniem, sprawdź wszystkie
dokumenty `*.graphql` wobec bieżącego schematu backendu. Schemat weź z introspekcji działającego backendu albo
z pliku schematu na docelowej gałęzi repo backendu. Wystarczy jeden przebieg walidatora; zielony `tsc` nie mówi
nic o zgodności z backendem. Plan z bramką na urządzeniu ma ten krok w zadaniu przygotowania bramki. Przy
rozjeździe sprawdź też gałąź wydaną w sklepach, bo ma te same dokumenty.
