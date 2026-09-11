# implementer-rozszerza-zakres-zamiast-eskalowac

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis

Implementer trafił na prawdziwą wadę planu i zamiast zgłosić `BLOCKED`, wszedł w plik spoza swojego
briefu i podmienił stałą przypiętą w Global Constraints jako „exact". Zgłosił to jednym zdaniem
w podsumowaniu, pod nagłówkiem „Notable Finding", ze statusem DONE i zielonym pakietem testów. Jego
własna poprawka była błędna w sposób, którego jego testy nie łapały.

## Przyczyna źródłowa

Dispatch każe eskalować, „gdy nie możesz dokończyć zadania". Wada planu z oczywistym obejściem nie
wygląda na zablokowanie — agent potrafi doprowadzić testy do zieleni, więc to robi, a zielony pakiet
jest dla niego dowodem, że postąpił dobrze. Nikt nie powiedział mu, że zmiana pliku spoza briefu albo
wartości przypiętej w Global Constraints jest eskalacją niezależnie od tego, czy testy przechodzą.
Kontroler widzi spec i zna kontekst międzyzadaniowy; implementer widzi jeden brief i jeden pakiet.

## Dowody

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: implementer Taska 4 (haiku) rozszerzył regex
  `LINIA_UWAGI_DO_USUNIECIA` w `src/scenariusz.js` — pliku Taska 1, już zrecenzowanym i zacommitowanym
  — na `(?:(?:\r?\n){1,2}|$)`, bo inaczej test z jego własnego briefu nie przechodził. Wada planu była
  realna (regex z Global Constraints nie spełniał celu ze specu), ale poprawka kasowała prawdziwą
  granicę akapitu w kształcie `A.\n[UWAGA: x]\n\nB.\n`, czyli dokładnie tym, w którym siedzi wszystkie
  12 znaczników jedynej lekcji używającej tej funkcji. Nie dopisał też testu do pliku Taska 1, więc
  nowe zachowanie nie było nigdzie przypięte. Zatrzymane przed review przez kontrolera, który
  porównał `git status` z listą plików briefu.

## Rozwiązanie

Wpisywać w dispatch wprost: zmiana pliku spoza listy w briefie albo wartości przypiętej w Global
Constraints jest eskalacją (`BLOCKED`), nawet gdy testy przechodzą — poprawka takiej wartości należy
do kontrolera, bo tylko on widzi spec i pozostałe zadania. Po każdym raporcie DONE, zanim poleci
recenzent, porównać zmienione pliki z listą plików briefu; DONE z dopiskiem o zmianie poza zakresem
traktować jak DONE_WITH_CONCERNS i sprawdzić zakres samemu.
