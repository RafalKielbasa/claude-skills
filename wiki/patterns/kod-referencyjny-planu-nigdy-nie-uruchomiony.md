# kod-referencyjny-planu-nigdy-nie-uruchomiony

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis

Plan implementacyjny zawiera kompletne bloki kodu, żeby implementer nie
improwizował. Te bloki powstają w jednym przebiegu pisania i **nigdy nie są
uruchamiane**, zanim staną się briefem. Defekt w nich propaguje się do kodu z
pełną wiernością, a review zadania go nie widzi, bo zadanie zgadza się ze swoim
briefem co do znaku.

## Przyczyna źródłowa

Plan jest oceniany jako dokument (self-review, review przez codex), a nie jako
program. Oba przeglądy czytają kod, żaden go nie wykonuje. Im wierniej
implementer przepisuje, tym pewniej defekt planu dociera do repozytorium — a
wierność jest tym, o co się go prosi.

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: budowa skilla
  `code-review-master` z planu o 19 zadaniach. Finalne review całej gałęzi
  orzekło **not ready** — 5 uwag krytycznych, każda odtworzona na prawdziwym
  repozytorium, **wszystkie w tekście planu**, żadna w transkrypcji agentów.
  Najgroźniejsza: `{ id, codex: null, ...finding }` ze spreadem na końcu, przez
  co agent podający własne `id` sprawiał, że dwie uwagi blokujące znikały, a
  raport meldował „brak uwag" i kończył zerem. Wcześniej w tej samej sesji plan
  dał: parser YAML milcząco łykający składnię spoza podzbioru, `commitAll` po
  `makeRepo` bez niczego do zacommitowania, test nazwany „sekcja bez yaml nie
  jest osią" niezawierający sekcji bez yaml, sprzeczne liczebniki polskie
  (kod i test niezgodne ze sobą i oba błędne), `runCodex` niemogący uruchomić
  codexa na Windowsie, oraz `crm gate` czytające „ostatni przebieg" bez pojęcia,
  którego przebiegu dotyczy pytanie.

## Rozwiązanie

Zanim plan stanie się źródłem briefów, uruchom jego kod: dla każdego bloku,
który implementer ma przepisać, odpal choćby raz jego najważniejszą funkcję na
danych z jego własnego testu. Blok, którego nikt nie wykonał, oznacz w planie
jako niezweryfikowany, żeby review zadania wiedziało, że jest pierwszym
czytelnikiem, który może go sprawdzić.
