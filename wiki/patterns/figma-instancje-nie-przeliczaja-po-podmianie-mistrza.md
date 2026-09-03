# figma-instancje-nie-przeliczaja-po-podmianie-mistrza

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Po wymianie dzieci komponentu-mistrza w Figmie istniejące instancje, które mają
własne nadpisania, zachowują stary układ: elementy renderują się na tych samych
współrzędnych, jeden na drugim. Mistrz i instancje bez nadpisań wyglądają przy
tym poprawnie, więc błąd nie rzuca się w oczy.

## Przyczyna źródłowa
Instancja przechowuje wyliczony układ dzieci. Podmiana dzieci mistrza przez
Plugin API nie unieważnia tego wyliczenia w instancjach, w których jakieś dziecko
ma nadpisanie (na przykład widoczność albo wariant). Weryfikacja przez zrzut
ekranu mistrza niczego nie wykryje, bo dotyczy węzła, który przelicza się
normalnie.

## Dowody
- 2026-09-03, sesja session_01PKwz2sPWn4S4MPAStw2DuF: po wymianie ramek `Nav/*`
  na instancje `NavItem` w wariantach komponentu `PanelRail` dwie instancje na
  ekranach analityki, jedyne z nadpisaną widocznością pozycji „Analityka",
  wyrenderowały `Nav/Analityka` i `Nav/Subskrypcja` na `y=56` obie naraz.
  Pozostałych jedenaście instancji, bez nadpisań, przeliczyło się samo.
  Naprawiło to `setProperties({prop: false})` i zaraz `true` na obu instancjach:
  pozycje wróciły na 20/56/92/128.

## Rozwiązanie
Po każdej operacji na dzieciach mistrza przejdź po instancjach i odczytaj `y`
oraz `height` ich dzieci, zamiast poprzestać na zrzucie mistrza. Instancję,
która nie przeliczyła układu, wymuś przełączeniem dowolnej jej właściwości tam
i z powrotem. Ryzyko dotyczy wyłącznie instancji z nadpisaniami, więc to je
sprawdzaj najpierw.
