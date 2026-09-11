# kontrakt-platformy-opisany-ze-schematu-bez-kodu-konsumenta

- **Skill:** kurs-zadania
- **Typ:** porażka
- **Status:** otwarty

## Opis
`struktura-zadania.md` opisuje, jak pola autorskie mapują się na modele
platformy. Wpis o `DragActivity` twierdził, że dla `kategoria: SORT` pole
`targets` jest **pomijane**. Platforma buduje z tego pola sloty zadania, więc
opisany kontrakt dawał ćwiczenie renderowane bez ani jednego slotu.

## Przyczyna źródłowa
Mapowanie spisano z modelu danych, nie z kodu, który to pole czyta.
`DragActivity.targets` w Keystone ma `defaultValue: []` i nie jest oznaczone
jako wymagane, więc sam schemat nie zdradza niczego. Wymóg mieszka w kodzie
konsumenta: `useSortTask.tsx:29-31` buduje sloty jako `Array(targets.length)`,
a `SortTaskDesktop.tsx:56` podaje `targets[id]` jako etykietę slotu. Pole
opcjonalne w schemacie bywa obowiązkowe dla renderera — i schemat tego nie mówi.

To samo dotyczy `taskSolution`: schemat pokazuje kształt `{content, target}`,
ale że `target` przy SORT jest jednobazowym indeksem jako string, wynika
dopiero z `Number(e.target) === index + 1` w tym samym hooku.

## Dowody
- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: `struktura-zadania.md:264`
  mówił `targets←cele lub pominięte dla SORT`, a linia 179-180 nazywała `cele`
  przy SORT „nieużywanymi". Rafał przysłał realny payload z CMS-a, w którym
  `targets` to `["1"…"6"]`, a `taskSolution` mapuje treść na te numery. Jedyny
  istniejący plik SORT (`dopasowanie-01-kolejnosc-podlaczenia-arkusza.json`)
  nie miał żadnego z tych pól — trzymał `kolejnosc`, którą miał kiedyś
  przeliczyć nieistniejący `/kurs-publikuj`.

## Rozwiązanie
Wiersz tabeli mapowania wolno napisać dopiero po otwarciu kodu, który pole
czyta — nie po samym `schema.prisma` ani definicji listy Keystone. Przy każdym
polu, którego wartość nie jest zwykłym przepisaniem treści (indeksy, identyfikatory,
puste kolekcje), w opisie ma stać `plik:linia` konsumenta, tak jak teraz stoi
przy `SORT` w `struktura-zadania.md`. Schemat mówi, co wolno zapisać; kod frontu
mówi, co musi tam być, żeby zadanie się wyświetliło.
