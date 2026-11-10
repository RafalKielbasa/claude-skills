# plan-pisany-jednym-zapisem-przekracza-limit-odpowiedzi

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan z kompletnym kodem dla kilkunastu zadań ma 3-5 tysięcy linii. Pisany
jednym wywołaniem `Write` przekracza limit długości jednej odpowiedzi: zapis
urywa się w środku, a harness prosi o wznowienie bez podsumowania.

## Przyczyna źródłowa
Skill każe podać w planie pełny kod każdego kroku, ale nie mówi nic
o objętości wyjścia. Jedna odpowiedź modelu mieści mniej niż taki plan,
a `Write` nie ma trybu dopisywania — więc pierwszy zapis planu z natury jest
za duży, a limit wychodzi dopiero po tym, jak większość treści już powstała.

## Dowody
- 2026-09-15, sesja session_01FP9aoLo5yuoCv411Gis6gR: plan toru stacjonarnego
  (17 zadań, docelowo 4167 linii). Pierwsza tura z zamiarem `Write` całości
  padła na „Output token limit hit" jeszcze przed nagłówkiem planu (limit
  zjadły trzy edycje specu w tej samej turze). Po wznowieniu plan powstał
  w siedmiu częściach: `Write` nagłówka i zadań 1-2 z linią-znacznikiem
  `<!-- CONTINUE -->` na końcu, potem sześć `Edit` podmieniających znacznik na
  kolejne 2-3 zadania plus znacznik, ostatni bez znacznika. Skan po `CONTINUE`
  na końcu potwierdził, że nic nie zostało. Zero utraconej treści, jedna
  zmarnowana tura.
- 2026-11-10, sesja session_01WryF5Vs7iJSRzH27PExCPE (lokalnie d05fa43f-c46f-49dc-9cd3-4eb8fdea782f; DT-83): plan 1 darmowej lekcji (9 zadań, same
  sygnatury i testy, bez ciał funkcji, jak każe writing-plans 7.0.0) pisany jednym `Write`. Po ok.
  2 min odpowiedź urwała się na „API Error: Connection lost mid-response”; Rafał napisał
  „kontynuuj” po 11 min. Po wznowieniu ten sam plan i plan 2 przeszły jednym `Write` bez błędu.
  Wpis wątpliwy jako ten sam mechanizm: to zerwane połączenie, nie limit tokenów. Wspólne jest to,
  że przerwana długa odpowiedź traci cały zapis i turę użytkownika.

## Rozwiązanie
Plan powyżej ok. 8 zadań z kodem pisz w częściach od pierwszego zapisu:
`Write` nagłówka, ograniczeń i 2-3 zadań zakończony linią `<!-- CONTINUE -->`,
potem `Edit` znacznika na kolejne 2-3 zadania i nowy znacznik, ostatnia część
bez znacznika. Na końcu `grep -c CONTINUE <plan>` musi zwrócić 0.
