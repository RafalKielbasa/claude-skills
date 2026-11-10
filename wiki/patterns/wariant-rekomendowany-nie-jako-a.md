# wariant-rekomendowany-nie-jako-a

- **Skill:** ogólny (protokół decyzji Recommendation-First)
- **Typ:** porażka
- **Status:** otwarty

## Opis
W bramce z kilkoma decyzjami rekomendacja jednej z nich wskazywała [B], choć format każe stawiać rekomendowany wariant zawsze jako [A]. Warianty ułożyłem od największego zakresu do najmniejszego, a rekomendację wybrałem dopiero po ich spisaniu. Rafał odpowiedział „ok”, co protokół wiąże z rekomendacją. Odstępstwo od formatu zgłosiłem dopiero w następnej turze.

## Przyczyna źródłowa
Warianty spisuję w kolejności, w jakiej powstają w analizie (często według zakresu albo kosztu). Rekomendację wybieram później, a przed wysłaniem nic nie każe przestawić liter. „OK” działa nadal, bo oznacza rekomendację. Ale użytkownik, który czyta [A] jako rekomendowany i odpowiada literą, wybierze inny wariant, niż sądzi.

## Dowody
- 2026-11-10, sesja session_01WryF5Vs7iJSRzH27PExCPE (lokalnie d05fa43f-c46f-49dc-9cd3-4eb8fdea782f; pytania recenzenta do specu darmowej lekcji):
  - „Rekomendacja agenta: D1 B, D2 A”. W D1 [A] był pełnym panelem zależnym od kursu, [B] darmową lekcją tylko w kursach z subskrypcji (rekomendowany), a [C] samymi kłódkami.
  - Rafał odpowiedział „ok”.
  - W następnym raporcie napisałem: „Rekomendacja nie stała tam jako [A], wbrew Twojemu formatowi. Jeśli chodziło Ci o coś innego, popraw.”

## Rozwiązanie
Najpierw wybierz rekomendację, potem nadaj litery: rekomendowany wariant to [A], pozostałe w dowolnej kolejności. Przed wysłaniem sprawdź linię „Rekomendacja agenta”: przy każdym `Dn` ma stać tylko „A”. Jeśli stoi inna litera, przestaw warianty, zanim wyślesz.
