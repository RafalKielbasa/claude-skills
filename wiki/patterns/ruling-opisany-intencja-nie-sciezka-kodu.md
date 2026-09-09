# ruling-opisany-intencja-nie-sciezka-kodu

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porazka
- **Status:** otwarty

## Opis
Kontroler rozstrzyga uwage z review zdaniem o intencji („zastosuj to do zwyklego
dopasowania”, „nie ruszaj petli wchlaniania”), a implementer wykonuje je doslownie
w miejscu, w ktorym kod sie rozgalezia. Regula lada na sciezce, ktorej kontroler nie mial na
mysli, i wywala istniejacy test.

## Przyczyna zrodlowa
Ruling powstaje w glowie kontrolera, ktory widzi zachowanie, a jest wykonywany przez implementera,
ktory widzi warunki. Nazwa zachowania („zwykle dopasowanie”) nie ma odpowiednika
w kodzie, gdy dwa rozne przypadki wchodza ta sama galezia — pierwsze trafienie sklejonej
wskazowki jest jednoczesnie „zwyklym dopasowaniem”. Kontroler nie ma tez zwyczaju
wymieniac warunkow wykluczajacych, bo dla niego sa oczywiste z kontekstu, ktorego implementer nie
dostal.

## Dowody
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: uwaga „krotka wskazowka zawarta w kroku wygrywa po cichu” rozstrzygnieta
  trzy razy. Runda 1: „czesc wskazowki do 3 slow to niepewne dopasowanie” — wywalilo
  trzy testy z dokladnymi trafieniami. Runda 2: dodane „i zbior slow kroku jest scisle
  wiekszy”, ze zdaniem „stosuj do zwyklego dopasowania, nie ruszaj petli
  wchlaniania” — nadal wywalilo test sklejonej wskazowki, bo jej pierwsze trafienie idzie
  ta sama sciezka. Runda 3: regula podana jako trzy warunki na `stepIndexes.length === 1`, liczbe
  czesci akcji i rozmiary zbiorow slow — weszla za pierwszym razem. Dwie stracone rundy
  implementera i recenzenta.

## Rozwiazanie
Ruling zapisuj jako warunki na identyfikowalnych bytach kodu, nie jako opis zachowania: wymien
predykaty, ktore musza zachodzic, i wymien jawnie przypadki wykluczone, nawet gdy wydaja sie
oczywiste. Gdy nie umiesz nazwac warunku, nie umiesz jeszcze rozstrzygnac uwagi — dopisz do
polecenia, ktora sciezke kodu regula ma ominac, i ktory istniejacy test to potwierdzi.
