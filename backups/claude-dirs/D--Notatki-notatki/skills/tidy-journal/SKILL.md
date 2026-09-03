---
name: tidy-journal
description: Użyj, gdy użytkownik chce uporządkować dziennik, wyczyścić brudnopis albo rozlokować wpisy z notatek dziennych (RRRR-MM-DD.md w korzeniu vaulta) do notatek wiedzowych w folderach tematycznych vaulta.
---

# Porządkowanie dziennika

Rozkłada wpisy z notatek dziennych do atomowych notatek wiedzowych w folderach tematycznych, aktualizuje huby tych folderów, przenosi oryginały do `archiwum/` i zostawia czysty dziennik. Zadania trafiają do `zadania.md`, wątki projektów do notatek stanu projektów (`praca/projekty/<projekt>/<projekt>.md`), zapiski ze spotkań do `praca/spotkania/`. Dodatkowo obsługuje `nauka-z-claude.md`: wiedzę ukończonych tematów destyluje do bazy wiedzy, a ich sekcje archiwizuje.

**Zasada nadrzędna: żadnego zapisu przed akceptacją planu przez użytkownika.**

## Format notatki wiedzowej

Obowiązują uniwersalne zasady notatek wiedzowych z CLAUDE.md (sekcja „Notatki wiedzowe"): cel — uczyć i łączyć wiedzę, ziarno zagadnienia, styl mieszany, wzbogacanie tylko braków i nieścisłości, linkowanie inline, lżejsze reguły dla treści nietechnicznych. Notatka atomowa (jedno spójne zagadnienie = jeden plik, kebab-case) ma stały szablon — patrz `szablony/notatka-wiedzowa.md`:

```
---
tags: [nauka/tech/devops]
---

## Podsumowanie

1-2 zdania: co to jest / definicja / kontekst.

## Szczegóły

Rozwinięcie, rosnące w czasie.

## Powiązane

- [[inna-notatka-atomowa]]
```

Każdy folder liściowy (np. `nauka/tech/devops/`) ma notatkę-hub o tej samej nazwie co folder (np. `nauka/tech/devops/devops.md`), wzorowaną na `szablony/hub.md`:

```
---
tags: [nauka/tech/devops]
---

## Notatki

- [[kubernetes-network-policy]] — kontrola ruchu sieciowego w K8s
```

## Przebieg

1. **Zbierz** wszystkie notatki dzienne `RRRR-MM-DD.md` z korzenia vaulta (z pominięciem `archiwum/`), łącznie z dzisiejszą.

2. **Sklasyfikuj każdy wpis** z sekcji `## notatki`:
   - Tag ma pierwszeństwo: `#dom` → `dom/`, `#praca` → `praca/projekty/<projekt>/`, `#nauka/tech/devops` → `nauka/tech/devops/` itd. Wiedza techniczna mieszka w `nauka/tech/<gałąź>/` (`agenci-ai`, `chmura`, `devops`, `linux`, `programowanie`); `nauka/biznes/`, `nauka/jezyki/` i `nauka/czytelnia/` leżą poza `tech/`. Tag zapisany po staremu, bez członu `tech` (np. `#nauka/chmura`), traktuj jako wskazanie odpowiedniej gałęzi w `nauka/tech/` — w dzienniku mogą jeszcze wisieć stare zapisy.
   - Wpis bez tagu klasyfikuj po treści.
   - Wiedza techniczna trafia do `nauka/<temat>` niezależnie od tego, przy jakim projekcie powstała. Wiedza specyficzna dla klienta/projektu (nazwy, decyzje, konfiguracja) trafia do notatki dokumentacji projektu `praca/projekty/<projekt>/<projekt>-dokumentacja.md` (do pasującej sekcji), a wątki postępu prac do notatki stanu — patrz punkt 6.
   - Cel wpisu: pasująca notatka atomowa w docelowym folderze (dopasowanie po temacie/treści) albo nowa notatka atomowa w kebab-case. Ziarno: jedno spójne zagadnienie — wpisy z jednej sesji nauki o wspólnym temacie (np. trzy fragmenty kursu o Cloud Storage) scalaj w jedną notatkę zagadnienia, nie w osobne mikro-notatki.
   - Treści nietechniczne prowadź wg lżejszych reguł z CLAUDE.md („Notatki wiedzowe" → typy treści): słówka (`#nauka/jezyki`) → wiersze tabeli w `nauka/jezyki/slowka-angielski.md`; notatka z książki → jedna notatka na książkę w `nauka/czytelnia/`; dom/zdrowie → zwięzły zapis faktów w `dom/` lub `zdrowie/`. Punkt 3 (weryfikacja) dotyczy tylko wiedzy technicznej.
   - Wpis pasujący do kilku notatek albo bez pasującego folderu → oznacz `?` w planie i zaproponuj rozwiązanie. Nowy folder wolno utworzyć tylko za zgodą użytkownika.

3. **Zweryfikuj kompletność i poprawność wiedzy technicznej.** Dla wpisu trafiającego do `nauka/` (albo będącego wiedzą techniczną w `praca/projekty/`): gołe hasło bez wyjaśnienia albo lukę uniemożliwiającą zrozumienie uzupełnij rzeczowym wyjaśnieniem z własnej wiedzy (definicja, kontekst, typowe zastosowanie); nieścisłość lub błąd merytoryczny sprostuj, wyraźnie oznaczając każde sprostowanie w planie (punkt 10). Kompletnych treści nie dopychaj dodatkami — notatka ma uczyć, nie puchnąć. Jeśli temat jest niejednoznaczny (kilka możliwych znaczeń, literówka, brak kontekstu) albo nie jesteś pewien faktów — nie zgaduj i nie zmyślaj: zaznacz `?` w planie i zapytaj, zamiast wpisywać niepewną treść.

4. **Skondensuj surowe wklejki.** Wpis będący wklejonym materiałem obcym — transkrypt filmu, fragment artykułu, treść kursu; rozpoznasz po długości, cudzym stylu, redundancji, często po angielsku — nigdy nie trafia do notatki wiedzowej w surowej formie:
   - wydestyluj z niego skondensowaną wiedzę po polsku w strukturze notatki atomowej (`Podsumowanie` / `Szczegóły`),
   - istotne komendy i fragmenty kodu zachowaj w oryginale,
   - terminów branżowych (np. load balancer, health check, forwarding rule) nie tłumacz na polski — tłumaczysz narrację, nie terminologię,
   - skondensowana wersja musi być widoczna w planie (punkt 10) do akceptacji przed zapisem,
   - pełna surowa treść i tak trafi do `archiwum/` (punkt 11), więc nic nie ginie.

5. **Zadania.** Checkboxy znalezione w notatkach dziennych (w dowolnej sekcji) oraz w sekcjach `## zadania` notatek w `praca/spotkania/`:
   - Niezakończone `- [ ]` → do sekcji `## backlog` w `zadania.md`, do podsekcji kontekstu (`### praca`, `### dom`, `### nauka`, `### prywatne`) z tagiem kontekstu (`#praca`, `#dom`, `#nauka`, `#prywatne`), jeśli kontekst jest oczywisty z treści, inaczej zapytaj użytkownika o kontekst przy planie (punkt 10); dopisz datę dodania `➕RRRR-MM-DD` (data notatki, z której pochodzi). Nie dopisuj do `## na dziś` — tę sekcję kuruje użytkownik. Przed dopisaniem sprawdź, czy to samo zadanie już nie figuruje w `zadania.md` — duplikaty scalaj w jedno, zachowując starszą datę dodania. W notatce spotkania zamień przeniesioną linię na zwykły punkt z dopiskiem `→ [[zadania]]`; puste checkboxy (sam szablon) pomijaj. Nigdy nie rozlokowuj zadań tematycznie do notatek wiedzowych.
   - Zakończone `- [x]` → w dzienniku zostają w oryginale, który trafi do archiwum; w notatkach spotkań zostają bez zmian.

6. **Wątki projektów.** Wpisy opisujące postęp prac w projekcie (co zrobiono, na czym stanięto, co dalej) → zaktualizuj notatkę stanu projektu (`praca/projekty/<projekt>/<projekt>.md`): zrobione scalaj do `## postępy` jako krótki datowany wpis na górze sekcji (np. `- 2026-07-09 — skonfigurowany load balancer`), plany do `## planowane prace`. Fakty możesz doprecyzować, zaglądając (tylko odczyt) do repo projektu — ścieżka w polu `sciezka:` frontmattera notatki stanu (np. sprawdź w `git log` lub dokumentacji repo, czego dokładnie dotyczył wpis „naprawiłem walidację"). Jeśli folder lub notatka stanu projektu nie istnieje — oznacz `?` w planie i zaproponuj uruchomienie `/sync-project <projekt>`, który je utworzy.

7. **Spotkania.** Zapiski wyglądające na notatkę ze spotkania (uczestnicy, ustalenia, decyzje z rozmowy) → zaproponuj w planie przeniesienie do `praca/spotkania/RRRR-MM-DD-<temat-kebab-case>.md` wg `szablony/spotkanie.md` (data z notatki dziennej, temat z treści).

8. **Nauka z Claude.** Przeczytaj `nauka-z-claude.md` (żywy plik postępu nauki w korzeniu vaulta):
   - Tematy w trakcie (status „w trakcie", nieodhaczone kroki roadmapy) zostawiaj nietknięte — to warsztat skilla `nauka-z-claude`.
   - Temat ukończony (wszystkie kroki roadmapy `[x]` albo status „ukończony"): wydestyluj wiedzę z sekcji `### Notatki` (w tym pozycje „Utrwalone:") i przerobionych kroków do notatek wiedzowych w `nauka/` według punktów 2–3 (klasyfikacja, ziarno, weryfikacja) — te propozycje trafiają do planu jak każdy wpis z dziennika. Sekcję tematu przenieś w całości do zbiorczego `archiwum/nauka-z-claude.md` jako kolejną sekcję `## <Temat>` (plik utwórz z nagłówkiem `# Nauka z Claude — archiwum`, jeśli nie istnieje).
   - Jeśli temat ma aktywne pozycje w `### Powtórki`, zostaw w żywym pliku kikut: nagłówek `## <Temat>`, linia `- **Status:** ukończony (w archiwum)` i podsekcja `### Powtórki` z tymi pozycjami. Formatu `[następna: RRRR-MM-DD, interwał: Nd]` nie zmieniaj — czyta go hook powtórek.
   - Kikut bez aktywnych pozycji powtórek (wszystkie utrwalone) → dołącz jego pozostałości (np. wpisy „Utrwalone:") do sekcji tematu w `archiwum/nauka-z-claude.md` i usuń kikut z żywego pliku; świeżo utrwalone pozycje, których nie ma jeszcze w bazie wiedzy, wydestyluj jak wyżej.

9. **Powtórki z notatek.** Dla notatek wiedzowych z `nauka/tech/` objętych tym
   porządkowaniem przygotuj zmiany w sekcji `## Powtórki z notatek` pliku
   `nauka-z-claude.md` (sekcja na końcu pliku; utwórz ją, jeśli nie istnieje).
   Zakres: notatki atomowe w `nauka/tech/` (rekurencyjnie), **bez** notatek-hubów.
   Pozostałe gałęzie `nauka/` (`biznes/`, `jezyki/`, `czytelnia/`) oraz notatki
   spoza `nauka/` (`dom/`, `zdrowie/`, `praca/`) nie wchodzą do rotacji.
   - **nowa notatka** → nowa pozycja
     `- [następna: <dziś + 7>, interwał: 7d] (diagnoza) [[<notatka>]]`;
   - **notatka mająca już pozycję**, do której dopisujesz treść → interwał wraca
     na `7d`, `następna` = dziś + 7, wskazówka **zastąpiona** przez
     `nowy fragment: <co doszło>`, żeby pierwsze pytanie poszło ze świeżego
     materiału. Cofnięcie na `7d`, a nie niżej, jest celowe: dopisanie treści
     nie może karać mocniej niż utworzenie notatki od zera;
   - **notatka bez pozycji**, do której dopisujesz treść → nowa pozycja jak wyżej.

   Notatki wydestylowane z ukończonego tematu nauki (punkt 8) traktuj jak nowe
   notatki. Formatu `[następna: …, interwał: …]` nie zmieniaj — czyta go hook
   powtórek. Samych powtórek nie prowadzisz: to warsztat skilla `nauka-z-claude`,
   Ty wyłącznie rejestrujesz pozycje.

10. **Pokaż plan i STOP.** Tabela: wpis (skrót) → notatka docelowa (nowa / dopisanie) → pełny podgląd treści: cała nowa notatka albo cała zmieniana sekcja dokładnie tak, jak zostanie zapisana (z uzupełnieniami i sprostowaniami z punktu 3 — sprostowania wyraźnie oznaczone — oraz kondensacją z punktu 4, jeśli dotyczy) → czy wymaga aktualizacji huba. Pod tabelą: zadania do przeniesienia do `zadania.md` (z proponowanym kontekstem), aktualizacje notatek stanu projektów, proponowane notatki spotkań, zmiany w `nauka-z-claude.md` (tematy do archiwizacji, kikuty powtórek), nowe i odświeżone pozycje w sekcji `## Powtórki z notatek` (notatka → data i interwał), pliki do archiwum, puste notatki do usunięcia. **Czekaj na akceptację użytkownika — do tego momentu nie wykonuj żadnego zapisu, przeniesienia ani usunięcia.** Poprawki użytkownika nanieś i pokaż zaktualizowany plan.

11. **Wykonaj po akceptacji:**
   - Dla nowej notatki atomowej: utwórz plik z szablonu `szablony/notatka-wiedzowa.md`, wypełnij `Podsumowanie` i `Szczegóły` treścią wpisu (razem z uzupełnieniami i sprostowaniami z punktu 3 lub kondensacją z punktu 4, jeśli je zaakceptowano).
   - Dla istniejącej notatki: wpleć nową treść w `## Szczegóły`, integrując ją ze spójnym tekstem (bez duplikacji); zaktualizuj `Podsumowanie`, jeśli wpis zmienia lub rozszerza definicję zagadnienia.
   - Linkowanie: w zapisywanej treści zamień wystąpienia tematów mających już notatkę (również w innym folderze) na wikilinki inline; sekcję `## Powiązane` uzupełnij o szersze konteksty, które nie padły w treści.
   - Dla każdej nowo utworzonej notatki atomowej: dopisz do niej link (z krótkim opisem) w hubie folderu docelowego; jeśli hub nie istnieje — utwórz go z `szablony/hub.md`.
   - Zapisz zaakceptowane zmiany w `zadania.md`, notatkach projektów i notatkach spotkań.
   - Wykonaj zaakceptowane zmiany z punktu 8: przeniesienia sekcji do `archiwum/nauka-z-claude.md`, kikuty powtórek i usunięcia kikutów w `nauka-z-claude.md`.
   - Zapisz zaakceptowane zmiany z punktu 9 w sekcji `## Powtórki z notatek` pliku `nauka-z-claude.md`: nowe pozycje dopisz na końcu sekcji, odświeżone zaktualizuj w miejscu (data, interwał, wskazówka). Sekcję utwórz na końcu pliku, jeśli jeszcze nie istnieje. Pozycji innych notatek nie ruszaj.
   - Przenieś przetworzone oryginały do `archiwum/` **w niezmienionej treści**. Jeśli plik o tej nazwie już tam istnieje, dopisz treść na końcu po separatorze `---`.
   - Notatki puste (sam szablon, bez treści) usuń bez archiwizowania.
   - Utwórz dzisiejszą notatkę na nowo w korzeniu vaulta z szablonu `szablony/dziennik.md` (sama sekcja `## notatki`).

12. **Raport:** co dokąd trafiło (nowa notatka / dopisanie / aktualizacja huba / `zadania.md` / wątek projektu / notatka spotkania), co w archiwum (w tym zarchiwizowane tematy nauki), co usunięte, co doszło do rotacji powtórek i które pozycje wróciły na 7 dni, które notatki wiedzowe zrobiły się zbyt duże/wielowątkowe (sugestia ręcznego podziału).

## Stan końcowy

W korzeniu vaulta z notatek dziennych zostaje wyłącznie dzisiejsza (pusta sekcja `## notatki`); przetworzone oryginały leżą płasko w `archiwum/`. Wszystkie otwarte zadania żyją w `zadania.md`. W `nauka-z-claude.md` zostają tylko tematy w trakcie oraz kikuty powtórek tematów ukończonych. Każda notatka wiedzowa z `nauka/tech/` utworzona albo dopisana w tym przebiegu ma pozycję w sekcji `## Powtórki z notatek`.

## Czego nie robić

- Nie zapisuj niczego przed akceptacją planu — także „oczywistych" wpisów.
- Nie zostawiaj w notatkach dziennych resztek: wpisów niejednoznacznych, odhaczonych zadań, stopek z linkami. Oryginał w całości idzie do archiwum, a niejasności rozstrzyga plan.
- Nie kasuj treści bez śladu — jedyny wyjątek to notatki puste (sam szablon).
- Nie twórz nowych folderów tematycznych bez zgody użytkownika.
- Nie doklejaj wpisów jako płaskiej listy dat (`- RRRR-MM-DD: treść`) — zawsze scalaj z treścią notatki.
- Nie dziel automatycznie rozrośniętych notatek — tylko sygnalizuj to w raporcie.
- Nie zostawiaj notatki z tematu nauki jako gołego hasła bez wyjaśnienia (patrz punkt 3) — wyjątek: temat faktycznie niejednoznaczny, wtedy oznacz `?` zamiast zmyślać.
- Nie dopychaj kompletnych treści dodatkami; wzbogacaj tylko braki i nieścisłości (patrz punkt 3).
- Nie dodawaj pól źródeł we frontmatterze ani sekcji pytań kontrolnych — notatka to czysta treść.
- Nie przenoś surowych wklejek do notatek wiedzowych (patrz punkt 4) — zawsze destyluj.
- Nie tłumacz terminów branżowych na polski.
- Nie zostawiaj otwartych zadań w notatkach dziennych ani nie przenoś ich do notatek wiedzowych — ich miejsce to `zadania.md`.
- Nie ruszaj tematów w trakcie w `nauka-z-claude.md` — destylujesz i archiwizujesz wyłącznie ukończone (patrz punkt 8).
- Nie zmieniaj formatu pozycji powtórek `[następna: RRRR-MM-DD, interwał: Nd]` ani nie usuwaj aktywnych powtórek przy archiwizacji — zostają w kikucie, aż się utrwalą.
- Nie rejestruj w powtórkach notatek-hubów ani notatek spoza `nauka/tech/` — `biznes/`, `jezyki/`, `czytelnia/`, `dom/`, `zdrowie/` i `praca/` są poza rotacją (patrz punkt 9).
- Nie prowadź powtórek samodzielnie — rejestrujesz pozycje, przepytuje skill `nauka-z-claude`.
- Nie zapisuj pozycji powtórek przed akceptacją planu — obowiązuje ta sama bramka co dla notatek.
