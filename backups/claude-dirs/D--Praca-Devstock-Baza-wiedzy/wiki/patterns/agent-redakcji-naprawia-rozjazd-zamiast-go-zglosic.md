# agent-redakcji-naprawia-rozjazd-zamiast-go-zglosic

- **Skill:** kurs-redakcja (krok 4)
- **Typ:** porażka
- **Status:** otwarty

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

## Rozwiązanie
W prompcie grup A i B rozdzielić dwa przypadki, które dziś zlewają się w jeden:
rozjazd ze scenariuszem ZGŁASZASZ z cytatem obu wersji i nie naprawiasz go
(naprawa idzie przez bramkę albo `/kurs-lekcja`), a brakująca glosa angielskiego
terminu jest jedynym dozwolonym dopisaniem treści — pod warunkiem, że jej treść
pada w scenariuszu, i musi stać w raporcie w osobnej sekcji „dopisana treść",
nie wśród zmian formy.
