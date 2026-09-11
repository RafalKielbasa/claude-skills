# agent-redakcji-naprawia-rozjazd-zamiast-go-zglosic

- **Skill:** kurs-redakcja (krok 4)
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-11, kurs-redakcja)

## Opis
Agent redagujący artykuł zmienił twierdzenie („Przepływ **prawie nigdy** nie
niesie danych w liczbie pojedynczej" → „**nigdy**… **zawsze** niesie listę")
i dopisał siedem glos angielskich terminów, mimo reguły z promptu:
„wątpliwość merytoryczna = fragment ZOSTAJE bez zmian + wpis w raporcie".
Zgłosił oba miejsca uczciwie, ale dopiero po fakcie.

## Przyczyna źródłowa
Prompt daje agentowi dwie reguły, które w tym miejscu się wykluczają: „wolno
przepisywać zdania i akapity" oraz „merytoryka zostaje identyczna". Kontrola
strukturalna skilla dokłada trzecią: scenariusz jest źródłem prawdy, a rozjazd
artykuł–scenariusz to błąd artykułu. Agent rozstrzyga konflikt na rzecz
spójności ze scenariuszem, bo to jedyna reguła, która mówi mu, co jest prawdą.
Przy glosach działa to samo: styleguide wymaga wyjaśnienia angielskiego terminu,
więc dopisanie treści wygląda jak wymóg formy, nie jak nowa treść.

## Dowody
- 2026-09-09, sesja session_01PrFurqNDm53ZdkCryE5kjm: agent A (fable / xhigh)
  w `modul-00…/lekcja-02…/artykul.md` osłabił hedge do twierdzenia twardego
  i dopisał glosy do `Schema`, `Table`, `JSON`, `Fixed`, `Expression`,
  `Google Cloud Console`, `CRM`; sam napisał w raporcie „to jedyne miejsca,
  gdzie redakcja dotyka faktu albo dodaje treść". Obie zmiany zostawione
  w bramce jako zgodne ze scenariuszem, ale decyzja należała do Rafała, nie do
  agenta.
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi (redakcja M02L01):
  w `modul-02…/lekcja-01…` grupa A (fable / high) wypisała osiem rozjazdów
  artykuł↔scenariusz i nie naprawiła ani jednego — dokładnie tak, jak każe
  `redakcja.md`. Rafał uchylił regułę dwoma zdaniami: „popraw rozjazdy B-H
  w artykule, dodatkowo rozjazdy zawsze powinny być naprawiane w kurs-redakcja",
  a gdy do przepisanej reguły dopisałem wyjątek dla rozjazdu wywracającego tezę
  sekcji — „napraw też rozjazd A". Kierunek naprawy wyszedł odwrotny do tego,
  który ta strona proponowała: nie „zgłaszaj i nie naprawiaj", tylko „naprawiaj
  wszystko i wypisz w raporcie". Koszt odkładania był policzalny: rozjazd
  „dziś/wczoraj" krążył między trzema sesjami przez trzy dni.

## Rozwiązanie
**Zrewidowane 2026-09-11.** Pierwotna propozycja („rozjazd ZGŁASZASZ z cytatem
obu wersji i nie naprawiasz go") została odrzucona przez Rafała i zastąpiona
regułą odwrotną, wpisaną tego dnia do `kursy/_wspolne/redakcja.md` (sekcja
„Scenariusz jest źródłem prawdy" i drugi wyjątek w „Nietykalnych") oraz do
`kurs-redakcja` w krokach 4, 5, 7 i w „Zasadach": rozjazd artykuł↔scenariusz
naprawia się w redakcji, po stronie artykułu, ZAWSZE — łącznie z takim, który
wymaga przepisania tezy całej sekcji. Raport bramki wymienia każdą naprawę
w postaci „co mówił artykuł → co mówi scenariusz → jak brzmi po naprawie",
a naprawy zmieniające tezę oznacza osobno, żeby Rafał czytał je pierwsze.
Konflikt reguł opisany wyżej znika, bo znika jedna z nich: merytoryka artykułu
przestaje być nietykalna wobec scenariusza.

Otwarta zostaje druga połowa pierwotnej obserwacji, której ta zmiana nie
dotyczy: dopisanie glosy angielskiego terminu to wciąż dokładanie treści,
której w scenariuszu nie ma, i nadal powinno iść do osobnej sekcji raportu
„dopisana treść", nie ginąć wśród zmian formy.
