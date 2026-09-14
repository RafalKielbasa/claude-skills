# Scenografia — sceny OBS, <TYTUŁ> <DD.MM.YYYY>

(do zbudowania i przeklikania z produkcją na próbie generalnej)

<!--
Wzór: `live-events/2026-08-27-agenci-ai/runbook/scenografia-obs.md`. Jedna
scena tutaj na każdą scenę, którą `documents.script` nazywa w którymkolwiek
`[CUE]` — łącznie ze sceną "Studio" (kamery prowadzących), nawet jeśli
sierpniowy wzór jej osobno nie opisywał, bo była domyślna. Kolejność scen w
tym dokumencie nie musi odpowiadać kolejności bloków — grupuj sceny, które
używają tego samego układu źródeł. Usuń ten komentarz po wypełnieniu.
-->

## Scena „<nazwa>"

**Źródła, w kolejności z-order (od spodu):**

1. <kamera / nagranie ekranu / przeglądarka / obraz — konkretne źródło>
2. <…>

**Plansza:** <która plansza (jeśli jakaś) należy do tej sceny — nazwa
zgodna z `[CUE]` w scenariuszu, albo "brak">

**Kto przełącza i na jaki `[CUE]`:** <rola> przełącza na tę scenę na
`[CUE]` w bloku <N> scenariusza (`documents.script`).

<!--
Powtórz sekcję "## Scena „<nazwa>"" dla każdej sceny. Usuń ten komentarz w
gotowym dokumencie.
-->

---

## Przejścia

<!--
Wzór: wynika wprost z kolejności `[CUE]` w scenariuszu — która scena
następuje po której, i na jaki sygnał. Nie duplikuj tu treści scenariusza w
całości; wystarczy lista przejść.
-->

- <scena A> → <scena B>: <na jaki sygnał/CUE>
- …

## Co zostaje na ekranie między scenami

<!--
Overlaye, które przeżywają zmianę sceny (np. licznik prezentu, plansza
oferty w rogu) i te, które znikają przy zmianie sceny. Wzór: sierpniowy
dokument, sekcja "Zasady" — czcionki/zoom przetestowane na 720p, konta
zalogowane w osobnym profilu.
-->

- <element overlayu> — <zostaje na ekranie od bloku N do bloku M / znika przy
  zmianie sceny>

## Zasady

- <czytelność czcionek/zoomu przetestowana na podglądzie streamu>
- <konta demo zalogowane w osobnym, czystym profilu przeglądarki>
- <kto odpowiada za overlaye (plansze, liczniki)>
