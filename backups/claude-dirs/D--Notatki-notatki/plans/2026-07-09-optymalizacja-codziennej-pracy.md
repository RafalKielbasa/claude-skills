# Plan implementacji: system zadań i poranny rytuał

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cel:** Wdrożyć w vaultcie system zadań z jednym źródłem prawdy (`zadania.md`), poranny skill `start-day`, rozszerzony `tidy-journal` (kondensacja surowych wklejek, zadania do `zadania.md`, wątki projektów, spotkania) oraz szablon i skill spotkań.

**Architektura:** Vault Obsidiana (Markdown, po polsku). Całe życie zadań w `zadania.md` (sekcje: wrzutki / plan na dziś / konteksty); zadania przesuwają się między sekcjami, nigdy nie są kopiowane. Dziennik służy wyłącznie notatkom. Skille to pliki `SKILL.md` w `.claude/skills/<nazwa>/` — implementacja polega na pisaniu plików Markdown, nie kodu.

**Tech stack:** Markdown + Obsidian (wikilinki `[[...]]`, tagi, frontmatter properties), skille Claude Code.

**Specyfikacja:** `.claude/specs/2026-07-09-optymalizacja-codziennej-pracy-design.md`

## Global Constraints

- Vault NIE jest repozytorium gita — pomiń wszystkie kroki commit; weryfikacja = odczyt i sprawdzenie treści pliku.
- Treść vaulta i skilli po polsku; nazwy skilli zawsze po angielsku (kebab-case).
- Nazwy plików i folderów kebab-case; notatki dziennika `RRRR-MM-DD.md`.
- Linki wewnętrzne w składni Obsidiana `[[wikilink]]`, nie Markdown.
- Terminy branżowe (load balancer, health check, forwarding rule itp.) nigdy nie są tłumaczone na polski.
- Format zadania: `- [ ] Treść [[projekt]] ➕RRRR-MM-DD` (`[[projekt]]` opcjonalny); w sekcji planu dodatkowo tag kontekstu `#praca`/`#dom`/`#nauka`/`#prywatne`; w archiwum `- [x] Treść ✅RRRR-MM-DD ➕RRRR-MM-DD`.
- Skille nie zapisują niczego bez akceptacji użytkownika (wzorzec z `tidy-journal`).
- Nie zmieniaj plików w `.obsidian/`.

---

### Task 1: Pliki zadań — `zadania.md` i `zadania-archiwum.md`

**Files:**
- Create: `zadania.md`
- Create: `zadania-archiwum.md`

**Interfaces:**
- Produces: strukturę sekcji, na której operują `start-day` (Task 4) i `tidy-journal` (Task 5): `## wrzutki`, `## plan na dziś`, `## praca`, `## dom`, `## nauka`, `## prywatne`; archiwum z sekcjami miesięcy `## RRRR-MM`.

- [ ] **Step 1: Utwórz `zadania.md`** (w korzeniu vaulta) z dokładnie tą treścią:

```markdown
# Zadania

## wrzutki

## plan na dziś

## praca

## dom

## nauka

## prywatne
```

Uwaga: nagłówek planu bez daty, dopóki plan jest pusty — `start-day` dopisuje ` — RRRR-MM-DD` przy wypełnianiu. Sekcje kontekstów zostają puste — zasilenie zadaniami z dziennika to zadanie pierwszego uruchomienia `/start-day` (Task 8), nie tego kroku.

- [ ] **Step 2: Utwórz `zadania-archiwum.md`** (w korzeniu vaulta) z dokładnie tą treścią:

```markdown
# Zadania — archiwum
```

Sekcje miesięcy (`## RRRR-MM`) tworzą skille przy pierwszej archiwizacji.

- [ ] **Step 3: Weryfikacja.** Odczytaj oba pliki i sprawdź: `zadania.md` ma nagłówek `# Zadania` i 6 sekcji w kolejności wrzutki → plan na dziś → praca → dom → nauka → prywatne; `zadania-archiwum.md` ma tylko nagłówek. Istniejące notatki vaulta nie zostały zmienione.

---

### Task 2: Szablon dziennika — tylko notatki

**Files:**
- Modify: `szablony/dziennik.md`

**Interfaces:**
- Produces: szablon używany przez `start-day` (Task 4) i `tidy-journal` (Task 5) do tworzenia dzisiejszej notatki; zawiera wyłącznie sekcję `## notatki`.

- [ ] **Step 1: Zastąp całą treść `szablony/dziennik.md`** (obecnie ma sekcje `## zadania` i `## notatki`) dokładnie tą treścią:

```markdown
## notatki

-
```

- [ ] **Step 2: Weryfikacja.** Odczytaj plik: nie zawiera sekcji `## zadania` ani `## plan na dziś`, zawiera wyłącznie `## notatki` z pustym punktem. Nie zmieniaj dzisiejszej notatki `dziennik/2026-07-09.md` — jej zadania zbierze pierwsze uruchomienie `/start-day` (Task 8).

---

### Task 3: Szablon spotkania

**Files:**
- Create: `szablony/spotkanie.md`

**Interfaces:**
- Produces: szablon dla notatek w `praca/spotkania/RRRR-MM-DD-temat.md`, używany przez `tidy-journal` (Task 5) i skill `meeting` (Task 7). Sekcja `## zadania` to źródło zadań zbieranych przez `start-day`.

- [ ] **Step 1: Utwórz `szablony/spotkanie.md`** z dokładnie tą treścią:

```markdown
---
data:
uczestnicy:
temat:
---

## notatki

-

## zadania

- [ ]
```

- [ ] **Step 2: Weryfikacja.** Odczytaj plik: frontmatter ma trzy właściwości (`data`, `uczestnicy`, `temat`), po nim sekcje `## notatki` i `## zadania`. Folder `praca/spotkania/` może jeszcze nie istnieć — tworzy go dopiero pierwsza notatka spotkania; nie twórz go teraz.

---

### Task 4: Skill `start-day`

**Files:**
- Create: `.claude/skills/start-day/SKILL.md`

**Interfaces:**
- Consumes: strukturę `zadania.md` i `zadania-archiwum.md` (Task 1), szablon `szablony/dziennik.md` (Task 2), sekcje `## zadania` notatek spotkań (Task 3), sekcje `## na czym skończyłem` w notatkach projektów.
- Produces: polecenie `/start-day` — poranny rytuał; reguły przesuwania zadań, z którymi spójny musi być `tidy-journal` (Task 5).

- [ ] **Step 1: Utwórz `.claude/skills/start-day/SKILL.md`** z dokładnie tą treścią:

````markdown
---
name: start-day
description: Użyj rano na start dnia — gdy użytkownik chce zaplanować dzień, uporządkować zadania, odpalić poranny rytuał albo pisze /start-day. Uzgadnia zadania.md, tworzy notatkę dzienną, ustala plan na dziś i przypomina kontekst projektów.
---

# Start dnia

Poranny rytuał zadaniowy — docelowo 2–3 minuty. Operuje na `zadania.md`, jedynym źródle prawdy o zadaniach.

**Zasada nadrzędna: najpierw jedna zbiorcza propozycja (uzgodnienie + plan dnia), zapisy dopiero po akceptacji użytkownika.**

**Zasada druga: zadania przesuwają się między sekcjami — nigdy nie są kopiowane. Każde zadanie istnieje w dokładnie jednym miejscu: wrzutki / plan / kontekst / archiwum.**

## Struktura zadania.md

- `## wrzutki` — inbox: dopiski użytkownika w ciągu dnia, bez kontekstu i daty.
- `## plan na dziś — RRRR-MM-DD` — zadania wybrane na dziś; bez daty w nagłówku, gdy plan pusty.
- `## praca`, `## dom`, `## nauka`, `## prywatne` — backlog per kontekst.

Format zadania: `- [ ] Treść [[projekt]] ➕RRRR-MM-DD`

- `➕RRRR-MM-DD` — data dodania (uzupełniają ją skille),
- `[[projekt]]` — opcjonalny wikilink do notatki projektu,
- w sekcji planu zadanie nosi dodatkowo tag kontekstu (`#praca`, `#dom`, `#nauka`, `#prywatne`), żeby nieukończone mogło wrócić do swojej sekcji.

`zadania-archiwum.md` przechowuje ukończone zadania w sekcjach miesięcy (`## RRRR-MM`, najnowszy miesiąc na górze), format: `- [x] Treść ✅RRRR-MM-DD ➕RRRR-MM-DD`.

## Przebieg

1. **Przygotowanie.** Jeśli `zadania.md` lub `zadania-archiwum.md` nie istnieje, zaplanuj utworzenie go od zera (struktura wyżej) — to pierwsze uruchomienie.

2. **Uzgodnienie `zadania.md`:**
   - `- [x]` gdziekolwiek (plan, konteksty, wrzutki) → do archiwum, do sekcji bieżącego miesiąca (utwórz `## RRRR-MM`, jeśli brak), z `✅` i dzisiejszą datą, bez tagu kontekstu,
   - nieodhaczone zadania z planu o starej dacie → z powrotem do sekcji wg tagu kontekstu (tag usuń); zadanie w planie bez tagu → zaproponuj kontekst po treści, przy niejednoznacznym zapytaj,
   - wrzutki → zaproponuj kontekst po treści i dopisz `➕` z dzisiejszą datą; niejednoznaczne oznacz `?` i zapytaj użytkownika,
   - zadania bez daty `➕` → uzupełnij dzisiejszą datą.

3. **Zabłąkane zadania.** Przejrzyj notatki dzienne (`dziennik/*.md`, z pominięciem `dziennik/archiwum/`) i sekcje `## zadania` notatek w `praca/spotkania/`:
   - nieodhaczone checkboxy → potraktuj jak wrzutki (zaproponuj kontekst po treści, dopisz dzisiejszą datę), a w miejscu pochodzenia zamień linię na zwykły punkt z dopiskiem `→ [[zadania]]`,
   - odhaczone zostaw bez zmian.

4. **Notatka dzienna.** Utwórz `dziennik/RRRR-MM-DD.md` z `szablony/dziennik.md`, jeśli nie istnieje. Istniejącej nie nadpisuj.

5. **Plan na dziś.** Pokaż użytkownikowi jedną zbiorczą propozycję:
   - wynik uzgodnienia (co do archiwum, co wraca do kontekstów, wrzutki z proponowanymi kontekstami),
   - otwarte zadania per kontekst, z wyraźnym oznaczeniem zadań-zombie (`➕` starsze niż 14 dni),
   - propozycję 2–3 priorytetów na dziś.
   **Czekaj na akceptację — do tego momentu żadnych zapisów.** Po akceptacji (lub korekcie) przenieś wybrane zadania do `## plan na dziś — <dzisiejsza data>` z tagiem kontekstu.

6. **Powrót do kontekstu.** Dla każdego projektu, do którego linkuje jakiekolwiek otwarte zadanie, pokaż ostatni wpis z sekcji `## na czym skończyłem` notatki projektu (jeśli sekcja istnieje). To część raportu, nie zapis.

7. **Wykonanie i raport.** Po akceptacji wykonaj wszystkie zapisy naraz i podsumuj: co zarchiwizowane, co przeniesione i dokąd, plan dnia, przypomnienia z projektów.

## Idempotencja

Ponowne uruchomienie tego samego dnia nie psuje stanu: plan z dzisiejszą datą zostaje (użytkownik może go skorygować), świeżo odhaczone zadania się archiwizują, nowe wrzutki są rozdzielane. Nic się nie dubluje — przed dopisaniem zadania sprawdź, czy to samo zadanie (także sformułowane innymi słowami) już nie figuruje w `zadania.md`; duplikaty scalaj w jedno, zachowując starszą datę dodania.

## Czego nie robić

- Nie zapisuj niczego przed akceptacją zbiorczej propozycji.
- Nie kopiuj zadań między sekcjami ani plikami — tylko przesuwaj.
- Nie zmieniaj treści zadań przy przenoszeniu (poza tagiem kontekstu i datami).
- Nie usuwaj zadań — jedyna droga „w dół" to archiwum po odhaczeniu.
- Nie twórz nowych sekcji kontekstów; puste sekcje zostają w pliku.
- Nie ustalaj planu bez udziału użytkownika — priorytety zatwierdza on.
````

- [ ] **Step 2: Weryfikacja.** Odczytaj plik i sprawdź: frontmatter ma `name: start-day` (po angielsku) i opis z wyzwalaczami; treść zawiera 7 punktów przebiegu, regułę „żadnych zapisów przed akceptacją", regułę przesuwania (nie kopiowania), próg zombie 14 dni, obsługę pierwszego uruchomienia i sekcję idempotencji. Formaty zadań zgodne z Global Constraints.

---

### Task 5: Rozszerzenie skilla `tidy-journal`

**Files:**
- Modify: `.claude/skills/tidy-journal/SKILL.md` (pełne zastąpienie treści)

**Interfaces:**
- Consumes: strukturę `zadania.md` (Task 1: sekcja `## wrzutki` i sekcje kontekstów), szablon `szablony/dziennik.md` (Task 2), szablon `szablony/spotkanie.md` (Task 3).
- Produces: rozszerzone porządkowanie dziennika spójne z regułami `start-day` (Task 4).

- [ ] **Step 1: Zastąp całą treść `.claude/skills/tidy-journal/SKILL.md`** dokładnie tą treścią (zmiany względem obecnej wersji: nowy punkt 4 — kondensacja surowych wklejek; punkt 5 — zadania do `zadania.md` zamiast do dzisiejszej notatki; nowe punkty 6–7 — wątki projektów i spotkania; zaktualizowany stan końcowy i lista „czego nie robić"):

````markdown
---
name: tidy-journal
description: Użyj, gdy użytkownik chce uporządkować dziennik, wyczyścić brudnopis albo rozlokować wpisy z notatek dziennych (dziennik/RRRR-MM-DD.md) do notatek wiedzowych w folderach tematycznych vaulta.
---

# Porządkowanie dziennika

Rozkłada wpisy z notatek dziennych do atomowych notatek wiedzowych w folderach tematycznych, aktualizuje huby tych folderów, przenosi oryginały do archiwum i zostawia czysty dziennik. Zadania trafiają do `zadania.md`, wątki projektów do sekcji `## na czym skończyłem`, zapiski ze spotkań do `praca/spotkania/`.

**Zasada nadrzędna: żadnego zapisu przed akceptacją planu przez użytkownika.**

## Format notatki wiedzowej

Notatka atomowa (jedno zagadnienie = jeden plik, kebab-case) ma stały szablon — patrz `szablony/notatka-wiedzowa.md`:

```
---
tags: [nauka/devops]
---

## Podsumowanie

1-2 zdania: co to jest / definicja / kontekst.

## Szczegóły

Rozwinięcie, rosnące w czasie.

## Powiązane

- [[inna-notatka-atomowa]]
```

Każdy folder liściowy (np. `nauka/devops/`) ma notatkę-hub o tej samej nazwie co folder (np. `nauka/devops/devops.md`), wzorowaną na `szablony/hub.md`:

```
---
tags: [nauka/devops]
---

## Notatki

- [[kubernetes-network-policy]] — kontrola ruchu sieciowego w K8s
```

## Przebieg

1. **Zbierz** wszystkie pliki `dziennik/*.md` (z pominięciem `dziennik/archiwum/`), łącznie z dzisiejszym.

2. **Sklasyfikuj każdy wpis** z sekcji `## notatki`:
   - Tag ma pierwszeństwo: `#dom` → `dom/`, `#praca` → `praca/projekty/<projekt>/`, `#nauka/devops` → `nauka/devops/` itd.
   - Wpis bez tagu klasyfikuj po treści.
   - Wiedza techniczna trafia do `nauka/<temat>` niezależnie od tego, przy jakim projekcie powstała. Wiedza specyficzna dla klienta/projektu (nazwy, decyzje, konfiguracja) trafia do `praca/projekty/<projekt>/`.
   - Cel wpisu: pasująca notatka atomowa w docelowym folderze (dopasowanie po temacie/treści) albo nowa notatka atomowa w kebab-case.
   - Wpis pasujący do kilku notatek albo bez pasującego folderu → oznacz `?` w planie i zaproponuj rozwiązanie. Nowy folder wolno utworzyć tylko za zgodą użytkownika.

3. **Rozwiń niewyjaśnione tematy z nauki.** Jeśli wpis trafia do `nauka/` (albo jest wiedzą techniczną w `praca/projekty/`) i tylko wymienia temat bez wyjaśnienia — samo hasło, nazwa technologii/wzorca/narzędzia bez definicji i kontekstu — dopisz do `## Szczegóły` rzeczowe wyjaśnienie tego tematu z własnej wiedzy: definicję, kontekst, typowe zastosowanie. Notatka ma czytelnika uczyć zagadnienia, nie tylko dokumentować, że się pojawiło. Jeśli sam temat jest niejednoznaczny (kilka możliwych znaczeń, literówka, brak wystarczającego kontekstu, żeby rozpoznać o co chodzi) albo nie jesteś pewien faktów — nie zgaduj i nie zmyślaj: zaznacz `?` w planie i zapytaj, zamiast wpisywać niepewną treść.

4. **Skondensuj surowe wklejki.** Wpis będący wklejonym materiałem obcym — transkrypt filmu, fragment artykułu, treść kursu; rozpoznasz po długości, cudzym stylu, redundancji, często po angielsku — nigdy nie trafia do notatki wiedzowej w surowej formie:
   - wydestyluj z niego skondensowaną wiedzę po polsku w strukturze notatki atomowej (`Podsumowanie` / `Szczegóły`),
   - istotne komendy i fragmenty kodu zachowaj w oryginale,
   - terminów branżowych (np. load balancer, health check, forwarding rule) nie tłumacz na polski — tłumaczysz narrację, nie terminologię,
   - skondensowana wersja musi być widoczna w planie (punkt 8) do akceptacji przed zapisem,
   - pełna surowa treść i tak trafi do `dziennik/archiwum/` (punkt 9), więc nic nie ginie.

5. **Zadania.** Checkboxy znalezione w notatkach dziennych (w dowolnej sekcji):
   - Niezakończone `- [ ]` → do `zadania.md`: do sekcji kontekstu (`## praca`, `## dom`, `## nauka`, `## prywatne`), jeśli kontekst jest oczywisty z treści, inaczej do `## wrzutki`; dopisz datę dodania `➕RRRR-MM-DD` (data notatki dziennej, z której pochodzi). Przed dopisaniem sprawdź, czy to samo zadanie już nie figuruje w `zadania.md` — duplikaty scalaj. Nigdy nie rozlokowuj zadań tematycznie do notatek wiedzowych.
   - Zakończone `- [x]` → zostają w oryginale, który trafi do archiwum.

6. **Wątki projektów.** Wpisy opisujące postęp prac w projekcie (co zrobiono, na czym stanięto, co dalej) → zaktualizuj sekcję `## na czym skończyłem` w notatce projektu (`praca/projekty/<projekt>.md`): krótki datowany wpis na górze sekcji (np. `- 2026-07-09 — skonfigurowany load balancer, zostały health checki`), scalony z istniejącą treścią. Jeśli sekcja nie istnieje — dodaj ją na końcu notatki projektu.

7. **Spotkania.** Zapiski wyglądające na notatkę ze spotkania (uczestnicy, ustalenia, decyzje z rozmowy) → zaproponuj w planie przeniesienie do `praca/spotkania/RRRR-MM-DD-<temat-kebab-case>.md` wg `szablony/spotkanie.md` (data z notatki dziennej, temat z treści).

8. **Pokaż plan i STOP.** Tabela: wpis (skrót) → notatka docelowa (nowa / dopisanie) → podgląd zmiany w sekcji `## Szczegóły` (uwzględniający rozwinięcie z punktu 3 lub kondensację z punktu 4, jeśli dotyczy) → czy wymaga aktualizacji huba. Pod tabelą: zadania do przeniesienia do `zadania.md` (z proponowanym kontekstem), aktualizacje `## na czym skończyłem`, proponowane notatki spotkań, pliki do archiwum, puste notatki do usunięcia. **Czekaj na akceptację użytkownika — do tego momentu nie wykonuj żadnego zapisu, przeniesienia ani usunięcia.** Poprawki użytkownika nanieś i pokaż zaktualizowany plan.

9. **Wykonaj po akceptacji:**
   - Dla nowej notatki atomowej: utwórz plik z szablonu `szablony/notatka-wiedzowa.md`, wypełnij `Podsumowanie` i `Szczegóły` treścią wpisu (razem z rozwinięciem z punktu 3 lub kondensacją z punktu 4, jeśli je zaakceptowano).
   - Dla istniejącej notatki: wpleć nową treść w `## Szczegóły`, integrując ją ze spójnym tekstem (bez duplikacji); zaktualizuj `Podsumowanie`, jeśli wpis zmienia lub rozszerza definicję zagadnienia.
   - Dla każdej nowo utworzonej notatki atomowej: dopisz do niej link (z krótkim opisem) w hubie folderu docelowego; jeśli hub nie istnieje — utwórz go z `szablony/hub.md`.
   - Zapisz zaakceptowane zmiany w `zadania.md`, notatkach projektów i notatkach spotkań.
   - Przenieś przetworzone oryginały do `dziennik/archiwum/` **w niezmienionej treści**. Jeśli plik o tej nazwie już tam istnieje, dopisz treść na końcu po separatorze `---`.
   - Notatki puste (sam szablon, bez treści) usuń bez archiwizowania.
   - Utwórz dzisiejszą notatkę na nowo z szablonu `szablony/dziennik.md` (sama sekcja `## notatki`).

10. **Raport:** co dokąd trafiło (nowa notatka / dopisanie / aktualizacja huba / `zadania.md` / wątek projektu / notatka spotkania), co w archiwum, co usunięte, które notatki wiedzowe zrobiły się zbyt duże/wielowątkowe (sugestia ręcznego podziału).

## Stan końcowy

`dziennik/` zawiera wyłącznie dzisiejszą notatkę (pusta sekcja `## notatki`) oraz folder `archiwum/`. Wszystkie otwarte zadania żyją w `zadania.md`.

## Czego nie robić

- Nie zapisuj niczego przed akceptacją planu — także „oczywistych" wpisów.
- Nie zostawiaj w notatkach dziennych resztek: wpisów niejednoznacznych, odhaczonych zadań, stopek z linkami. Oryginał w całości idzie do archiwum, a niejasności rozstrzyga plan.
- Nie kasuj treści bez śladu — jedyny wyjątek to notatki puste (sam szablon).
- Nie twórz nowych folderów tematycznych bez zgody użytkownika.
- Nie doklejaj wpisów jako płaskiej listy dat (`- RRRR-MM-DD: treść`) — zawsze scalaj z treścią notatki.
- Nie dziel automatycznie rozrośniętych notatek — tylko sygnalizuj to w raporcie.
- Nie zostawiaj notatki z tematu nauki jako gołego hasła bez wyjaśnienia (patrz punkt 3) — wyjątek: temat faktycznie niejednoznaczny, wtedy oznacz `?` zamiast zmyślać.
- Nie przenoś surowych wklejek do notatek wiedzowych (patrz punkt 4) — zawsze destyluj.
- Nie tłumacz terminów branżowych na polski.
- Nie zostawiaj otwartych zadań w notatkach dziennych ani nie przenoś ich do notatek wiedzowych — ich miejsce to `zadania.md`.
````

- [ ] **Step 2: Weryfikacja.** Odczytaj plik i porównaj ze specyfikacją: jest punkt kondensacji (4) z regułą terminów branżowych, zadania idą do `zadania.md` z deduplikacją (5), są wątki projektów (6) i spotkania (7), plan-i-STOP pozostał (8), stan końcowy mówi „wszystkie otwarte zadania żyją w zadania.md". Nazwa skilla w frontmatter bez zmian: `tidy-journal`.

---

### Task 6: Aktualizacja `CLAUDE.md`

**Files:**
- Modify: `.claude/CLAUDE.md`

**Interfaces:**
- Consumes: nazwy i role plików z Tasków 1–5.
- Produces: dokumentację vaulta zgodną z nowym systemem (czytaną w każdej sesji Claude).

- [ ] **Step 1: Zaktualizuj opis dziennika** w sekcji „Struktura vaulta". Zamień linię:

```markdown
- `dziennik/` — notatki dzienne (`RRRR-MM-DD.md`), brudnopis dnia: szybkie zapiski, które docelowo są porządkowane i rozdzielane do folderów tematycznych.
```

na:

```markdown
- `dziennik/` — notatki dzienne (`RRRR-MM-DD.md`), brudnopis dnia wyłącznie na notatki: szybkie zapiski, które docelowo są porządkowane i rozdzielane do folderów tematycznych. Zadań nie zapisujemy w dzienniku — ich miejsce to `zadania.md`.
- `zadania.md` — centralna lista zadań, jedyne źródło prawdy: sekcje `wrzutki` (inbox na szybkie dopiski), `plan na dziś` i konteksty (`praca`, `dom`, `nauka`, `prywatne`). Zadania przesuwają się między sekcjami (nigdy kopiowane); obsługiwane głównie przez skill `start-day`.
- `zadania-archiwum.md` — ukończone zadania z datami wykonania, grupowane po miesiącach.
```

- [ ] **Step 2: Dopisz szablon spotkania.** W tej samej sekcji zamień linię:

```markdown
- `szablony/` — szablony notatek (folder pluginu Templates): `dziennik.md` (notatka dzienna), `notatka-wiedzowa.md` (notatka atomowa), `hub.md` (notatka spinająca notatki atomowe folderu).
```

na:

```markdown
- `szablony/` — szablony notatek (folder pluginu Templates): `dziennik.md` (notatka dzienna), `notatka-wiedzowa.md` (notatka atomowa), `hub.md` (notatka spinająca notatki atomowe folderu), `spotkanie.md` (notatka ze spotkania w `praca/spotkania/`).
```

- [ ] **Step 3: Dodaj konwencję nazw skilli.** W sekcji „Konwencje Obsidiana" dopisz na końcu listy:

```markdown
- Skille Claude Code mają zawsze angielskie nazwy w kebab-case (np. `start-day`, `tidy-journal`); ich treść i opisy są po polsku.
```

- [ ] **Step 4: Weryfikacja.** Odczytaj `CLAUDE.md`: struktura vaulta wymienia `zadania.md` i `zadania-archiwum.md`, opis dziennika mówi „wyłącznie na notatki", lista szablonów zawiera `spotkanie.md`, konwencje zawierają regułę angielskich nazw skilli. Reszta pliku niezmieniona.

---

### Task 7: Skill `meeting` (opcjonalny, najniższy priorytet)

**Files:**
- Create: `.claude/skills/meeting/SKILL.md`

**Interfaces:**
- Consumes: `szablony/spotkanie.md` (Task 3).
- Produces: polecenie `/meeting <temat>` tworzące notatkę spotkania; jej sekcję `## zadania` zbiera `start-day` (Task 4, punkt 3 przebiegu).

- [ ] **Step 1: Utwórz `.claude/skills/meeting/SKILL.md`** z dokładnie tą treścią:

```markdown
---
name: meeting
description: Użyj, gdy użytkownik chce utworzyć notatkę ze spotkania — pisze /meeting <temat>, „notatka ze spotkania X", „zaczynam spotkanie" — tworzy plik w praca/spotkania/ z szablonu spotkania.
---

# Notatka ze spotkania

Tworzy notatkę spotkania w `praca/spotkania/` z szablonu `szablony/spotkanie.md`.

## Przebieg

1. **Ustal temat** z argumentu polecenia; gdy go brak — zapytaj. Przekształć na kebab-case (małe litery, myślniki, bez polskich znaków), np. „Planowanie SaaS Q3" → `planowanie-saas-q3`.
2. **Utwórz plik** `praca/spotkania/RRRR-MM-DD-<temat>.md` (dzisiejsza data) z szablonu `szablony/spotkanie.md`; wypełnij we frontmatterze `data` (RRRR-MM-DD) i `temat`; `uczestnicy` uzupełnij, jeśli użytkownik ich podał, inaczej zostaw puste. Folder `praca/spotkania/` utwórz, jeśli nie istnieje.
3. **Kolizja nazwy:** jeśli plik o tej nazwie już istnieje, dopytaj — kontynuacja w istniejącym pliku czy nowy z sufiksem `-2`.
4. **Poinformuj**, że zadania zapisane w sekcji `## zadania` trafią do `zadania.md` przy najbliższym `/start-day` lub `/tidy-journal`.

## Czego nie robić

- Nie nadpisuj istniejących notatek spotkań.
- Nie twórz notatki poza `praca/spotkania/`.
```

- [ ] **Step 2: Weryfikacja.** Odczytaj plik: frontmatter ma `name: meeting`, przebieg obejmuje kebab-case tematu, kolizję nazw i informację o zbieraniu zadań.

---

### Task 8: Weryfikacja end-to-end — pierwsze uruchomienie `/start-day`

**Wymaga udziału użytkownika — wykonaj w sesji głównej, nie w subagencie.**

**Files:**
- Modify (przez skill, po akceptacji użytkownika): `zadania.md`, `zadania-archiwum.md`, `dziennik/2026-07-09.md` (lub bieżąca notatka dzienna)

**Interfaces:**
- Consumes: wszystko z Tasków 1–5.

- [ ] **Step 1: Uruchom `/start-day`** w sesji głównej. Oczekiwany przebieg na obecnym stanie vaulta (notatka `dziennik/2026-07-09.md` z sekcją `## zadania`):
  - propozycja przeniesienia nieodhaczonych zadań („Opracować notatnik obsydian", „Przenieść dostępy", „Przygotować zadania na SaaS", „odebrać tynk mozaikowe", „review moduł 2") do kontekstów `zadania.md` z datą `➕` i zamiany linii w dzienniku na punkty z `→ [[zadania]]`,
  - odhaczone „Review Miłosza" zostaje w notatce dziennej bez zmian,
  - propozycja 2–3 priorytetów i wypełnienie `## plan na dziś — <data>`,
  - żadnych zapisów przed akceptacją użytkownika.

- [ ] **Step 2: Sprawdź stan po akceptacji.** `zadania.md`: wszystkie przeniesione zadania w sekcjach kontekstów lub w planie (z tagiem kontekstu), każde dokładnie raz, każde z datą `➕`. Notatka dzienna: zamiast checkboxów punkty z `→ [[zadania]]`.

- [ ] **Step 3: Test idempotencji — uruchom `/start-day` ponownie.** Oczekiwane: skill wykrywa, że stan jest uzgodniony (plan ma dzisiejszą datę, brak wrzutek i zabłąkanych checkboxów), nie proponuje duplikatów; co najwyżej pozwala skorygować plan.

- [ ] **Step 4: Raport dla użytkownika:** co działa, co wymagało korekty; jeśli skill zachował się niezgodnie ze specyfikacją — popraw `SKILL.md` i powtórz test.

---

## Poza zakresem

Pluginy Obsidiana, widoki Bases, automatyczne przypomnienia/harmonogramy (zgodnie ze specyfikacją).
