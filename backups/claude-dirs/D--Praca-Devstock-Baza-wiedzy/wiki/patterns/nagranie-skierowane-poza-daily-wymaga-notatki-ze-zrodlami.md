# nagranie-skierowane-poza-daily-wymaga-notatki-ze-zrodlami

- **Skill:** daily
- **Typ:** sukces
- **Status:** otwarty

## Opis
Rafał kazał przetworzyć nagranie spotkania inaczej niż `/daily` i `/spotkanie` (przez idea-engine
w innym repo). Bez notatki w `planning/` hook `nagrania-check.ps1` i `/daily` bez argumentu
zgłaszałyby je jako nieprzetworzone bez końca. Krótka notatka w `planning/robocze/` z linią
`**Źródła:**` i wskazaniem, gdzie żyje wynik, zamknęła sprawę jednym commitem.

## Przyczyna źródłowa
Hook i tryb raportu `/daily` uznają nagranie za przetworzone tylko na trzy sposoby: notatka
`planning/daily/<date>-<time>/`, notatka `planning/robocze/<date>-<time>-*/` albo linia
`**Źródła:**` z nazwą transkryptu w dowolnej `notatka.md` pod `planning/`. Trzecia droga
przetworzenia (poza oboma skillami) nie ma własnego znacznika, więc trzeba ją podpiąć pod
jeden z tych trzech.

## Dowody
- 2026-10-30, sesja 175d9d6c-86dd-4439-baff-018e8848c10a (id claude.ai niedostępny): nagranie
  `2026-10-30-1404` (spotkanie planistyczne Fit Body) przetworzone przez idea-engine w
  `E:\Praca\agent-biznes`, wynik wypchnięty do `fit-body/fit-body-business`. W bramce padło pytanie
  D4 „Co zrobić z nagraniem po przetworzeniu?”; Rafał wybrał wariant rekomendowany: notatka
  `planning/robocze/2026-10-30-1404-fit-body/notatka.md` (metadane, temat, gdzie wynik, action
  items, bez kolejek i bez Slacka), transkrypt skasowany jak w kroku 7 `/daily`, commit `51d01c98`.

## Rozwiązanie
Do `/daily` (sekcja Modes albo Rules): „When Rafał routes a recording to processing outside
`/daily` and `/spotkanie`, write `planning/robocze/<date>-<time>-<slug>/notatka.md` with the
`**Źródła:**` line naming the transcript, a `**Tryb:**` line naming where the result lives, and
the spoken action items; delete the transcript from `planning/transkrypty/`. No queues, no
publish. Ask about it at the gate of that other processing, not after.”
