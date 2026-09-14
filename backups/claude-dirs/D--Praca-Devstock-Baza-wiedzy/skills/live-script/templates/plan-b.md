# Plany B — <TYTUŁ>, <DD.MM.YYYY>

<!--
Wzór: `live-events/2026-08-27-agenci-ai/runbook/plany-b.md`. Ten dokument
tam był zbudowany z trzech poziomów degradacji opisanych prozą; tutaj ta sama
treść idzie do tabeli (jedna awaria — jeden wiersz), bo tabela jest tym, co
ktoś czyta w piętnaście sekund w trakcie transmisji, a nie tym, co się
opowiada. Poziomy zostają jako słownik odwołań w kolumnie "Poziom", nie jako
osobne sekcje. Usuń ten komentarz po wypełnieniu.
-->

## Poziomy degradacji — słownik

- **Poziom 1 — retry na żywo.** Powtórka tego samego kroku, bez komentowania
  awarii. Limit: zwykle dwa podejścia.
- **Poziom 2 — instancja/konto zapasowe.** Przełączenie na przygotowany
  zapasowy workspace/konto/bota; narracja bez zmian.
- **Poziom 3 — nagranie z próby generalnej.** Puszczamy nagranie danego
  fragmentu z próby, ekspert komentuje na żywo.

## Awarie, które demo może faktycznie mieć

<!--
Jeden wiersz na każdą awarię, którą `documents.demo` (sekcja "Wariant
zapasowy") realnie przewiduje dla TEGO dema — nie generyczna lista "internet
padł". Wzór kolumn i stylu: sierpniowy `plany-b.md`, sekcja "Awarie
punktowe". Kolumna "Ile czekasz" ma konkretną liczbę sekund/prób, nigdy
"trochę" albo "jak długo trzeba".
-->

| # | Co może zawieść | Jak to poznasz | Co robisz zamiast | Kto decyduje | Ile czekasz, zanim przełączysz |
|---|---|---|---|---|---|
| 1 | <awaria> | <sygnał — na ekranie, w czacie, w narzędziu> | <konkretna czynność zastępcza, poziom degradacji> | <inicjał/rola> | <liczba sekund albo liczba prób> |

## Totalna awaria

<!--
Co się dzieje, gdy zawodzi wszystko naraz (internet, prąd, platforma) —
zwykle Poziom 3 dla bieżącego bloku i powrót do wersji live od następnego,
jeśli usterka minie w trakcie transmisji. Wzór: sierpniowy dokument, sekcja
"Poziom 3".
-->

<opis jednym-dwoma zdaniami, plus warunek powrotu do wersji live>.
