# Optymalizacja codziennej pracy — projekt systemu zadań i porannego rytuału

Data: 2026-07-09
Status: zatwierdzony do implementacji

## Cel

Usprawnić codzienną pracę z vaultem w trzech obszarach: zarządzanie zadaniami (zadania nie giną w starych notatkach dziennych), poranny rytuał planowania (szybki start dnia na jedno polecenie) i praca zawodowa (spotkania, projekty, wątki wielodniowe).

Rytm użytkownika: rano kilka minut na planowanie, w ciągu dnia szybkie dopiski. Brak wieczornego rytuału — uzgadnianie stanu dzieje się rano następnego dnia.

## Zasada działania

`zadania.md` to jedyne miejsce życia zadań: wrzutki (inbox), plan na dziś i backlog per kontekst — wszystko w jednym pliku. Zadania przesuwają się między sekcjami (nigdy nie są kopiowane), więc nie istnieje problem synchronizacji. Dziennik służy wyłącznie do notatek.

Konwencja nazw skilli: zawsze po angielsku (kebab-case), treść skilla po polsku.

## Struktura plików

### `zadania.md` (nowy, korzeń vaulta)

```markdown
# Zadania

## wrzutki

- [ ] (szybkie dopiski w ciągu dnia, bez kontekstu i daty)

## plan na dziś — 2026-07-09

- [ ] Przygotować zadania na SaaS [[saas]] #praca ➕2026-07-09

## praca

- [ ] Review moduł 2 ➕2026-07-09

## dom

- [ ] Odebrać tynk mozaikowy ➕2026-07-09

## nauka

## prywatne
```

- **`wrzutki`** — inbox: użytkownik dopisuje tu zadania w ciągu dnia bez żadnej ceremonii; skill `start-day` rozdziela je rano do kontekstów.
- **`plan na dziś — RRRR-MM-DD`** — zadania wybrane na dziś, **przeniesione** (nie skopiowane) z sekcji kontekstów; każde nosi tag kontekstu (`#praca`, `#dom`, `#nauka`, `#prywatne`), żeby nieukończone mogło wrócić do swojej sekcji.
- **Sekcje kontekstów** (`praca`, `dom`, `nauka`, `prywatne`) — backlog otwartych zadań; sekcje są stałe, puste zostają w pliku. Tag kontekstu jest tu zbędny (sekcja = kontekst).
- Format zadania: `- [ ] Treść [[projekt]] ➕RRRR-MM-DD`; `➕` to data dodania (uzupełniana przez skille), `[[projekt]]` — opcjonalny wikilink do notatki projektu.

### `zadania-archiwum.md` (nowy, korzeń vaulta)

Ukończone zadania, grupowane po miesiącach, najnowsze na górze:

```markdown
# Zadania — archiwum

## 2026-07

- [x] Review Miłosza ✅2026-07-09 ➕2026-07-09
```

Vault nie jest repozytorium gita — archiwum jest jedyną historią wykonanych zadań.

### `szablony/dziennik.md` (zmiana)

Dziennik służy wyłącznie notatkom — sekcja `## zadania` znika:

```markdown
## notatki

-
```

### `szablony/spotkanie.md` (nowy)

Szablon notatki ze spotkania: frontmatter z właściwościami `data`, `uczestnicy`, `temat` (plugin Properties jest włączony); sekcje `## notatki` i `## zadania`. Pliki spotkań lądują w `praca/spotkania/RRRR-MM-DD-temat.md` (kebab-case).

### Notatki projektów (`praca/projekty/<projekt>.md`)

Sekcja `## na czym skończyłem` z krótkimi datowanymi wpisami (najnowszy na górze, np. `- 2026-07-09 — skonfigurowany load balancer, zostały health checki`). Aktualizowana przez skille na podstawie dziennika; źródło porannego przypomnienia kontekstu.

## Skill `start-day` (nowy)

Uruchamiany rano poleceniem `/start-day`. Operuje głównie na `zadania.md`. Kroki:

1. **Uzgodnienie stanu:**
   - zadania odhaczone gdziekolwiek w `zadania.md` (plan lub konteksty) → przeniesione do `zadania-archiwum.md` z `✅` i datą,
   - nieodhaczone zadania ze starego `plan na dziś` → wracają do sekcji swojego kontekstu (wg tagu),
   - `wrzutki` → rozdzielone do kontekstów z datą dodania; skill proponuje kontekst na podstawie treści i pyta tylko przy niejednoznacznych,
   - zadania zabłąkane w notatkach dziennych od ostatniego uruchomienia oraz w sekcjach `## zadania` notatek spotkań → traktowane jak wrzutki (przeniesione do `zadania.md`),
   - duplikaty scalane, nie dublowane.
2. **Utworzenie dzisiejszej notatki dziennej** z szablonu, jeśli nie istnieje (istniejącej nie nadpisuje).
3. **Plan na dziś:**
   - prezentacja otwartych zadań per kontekst,
   - oznaczenie zadań-zombie (data dodania starsza niż 14 dni),
   - propozycja 2–3 priorytetów do zatwierdzenia lub zmiany przez użytkownika,
   - zatwierdzone zadania przeniesione do `## plan na dziś` z dzisiejszą datą w nagłówku i tagiem kontekstu.
4. **Powrót do kontekstu:** dla projektów z otwartymi zadaniami skill wyświetla ostatni wpis z `## na czym skończyłem` ich notatek.

Docelowy czas rytuału: 2–3 minuty. Skill jest idempotentny — ponowne uruchomienie tego samego dnia nie dubluje wpisów ani nie psuje planu (co najwyżej doarchiwizuje świeżo odhaczone zadania i pozwoli skorygować plan).

## Rozszerzenie skilla `tidy-journal` (zmiana)

Przy porządkowaniu dziennika dodatkowo:

- **kondensacja surowych wklejek:** wpisy będące wklejonym materiałem obcym (transkrypty filmów, fragmenty artykułów, treści kursów — rozpoznawalne po długości, cudzym stylu, redundancji, często po angielsku) nigdy nie trafiają do notatek wiedzowych w surowej formie; skill destyluje z nich skondensowaną wiedzę po polsku w formacie notatki atomowej (Podsumowanie / Szczegóły), zachowując istotne komendy i fragmenty kodu w oryginale; terminy branżowe (np. load balancer, health check, forwarding rule) pozostają po angielsku — nie tłumaczymy ich na polski; pełna surowa treść i tak ląduje w `dziennik/archiwum/` (dotychczasowa reguła), więc nic nie ginie; skondensowana wersja jest widoczna w planie do akceptacji przed zapisem,
- zadania znalezione w notatkach dziennych trafiają do `wrzutek` w `zadania.md` (albo od razu do kontekstu, jeśli jest oczywisty) zamiast ginąć w treści,
- wpisy dotyczące projektów aktualizują sekcję `## na czym skończyłem` w notatce projektu (scalanie, nie doklejanie listy dat — zgodnie z dotychczasową filozofią skilla),
- zapiski wyglądające na notatki ze spotkań są proponowane do przeniesienia do `praca/spotkania/` wg szablonu spotkania.

Podział ról: `start-day` = codzienny, szybki rytuał zadaniowy; `tidy-journal` = rzadsze, głębsze porządkowanie treści wiedzowych. Oba skille operują na `zadania.md` idempotentnie — kolejność uruchamiania dowolna.

## Skill `meeting` (nowy, opcjonalny — najniższy priorytet)

`/meeting <temat>` tworzy w `praca/spotkania/` notatkę `RRRR-MM-DD-<temat-kebab-case>.md` z szablonu spotkania. Zadania z sekcji `## zadania` notatki spotkania trafiają do `zadania.md` przy najbliższym uruchomieniu `start-day` lub `tidy-journal`. Może powstać po wdrożeniu pozostałych elementów — sam szablon wystarczy na start.

## Przypadki brzegowe

- **Brak notatek dziennych / spotkań do przejrzenia** — nic do uzgodnienia, skill przechodzi dalej bez błędu.
- **Ręczne edycje `zadania.md`** — dozwolone i spodziewane; użytkownik może sam dopisywać, przesuwać i odhaczać zadania — skill uzgadnia stan przy najbliższym uruchomieniu.
- **Zadanie bez daty dodania** (dopisane ręcznie) — skill uzupełnia datę przy najbliższym uruchomieniu (data uruchomienia).
- **Zadanie w planie bez tagu kontekstu** — skill proponuje kontekst i pyta przy niejednoznacznym.
- **Pierwsze uruchomienie** — `zadania.md` i `zadania-archiwum.md` nie istnieją; skill tworzy je i zasila zadaniami z istniejących notatek dziennych.
- **Weekend / przerwa** — nagłówek planu ma starą datę; nieukończone zadania wracają do kontekstów, plan dostaje dzisiejszą datę.

## Kryteria sukcesu

- Żadne nieukończone zadanie nie ginie — ani w dzienniku, ani w starym planie.
- Do notatek wiedzowych nie trafia żadna surowa wklejka — tylko skondensowana, przetworzona wiedza; oryginały są w archiwum dziennika.
- Poranny rytuał zamyka się w 2–3 minutach i jednym poleceniu.
- `zadania.md` zawiera wyłącznie otwarte zadania; historia wykonania w archiwum.
- Zadanie istnieje zawsze w dokładnie jednym miejscu (wrzutki / plan / kontekst / archiwum) — zero duplikacji.
- Ponowne uruchomienie `start-day` tego samego dnia nie psuje stanu (idempotencja).

## Zakres wdrożenia

1. Pliki: `zadania.md`, `zadania-archiwum.md`, zmiana `szablony/dziennik.md`, nowy `szablony/spotkanie.md`.
2. Skill `start-day` (`.claude/skills/start-day/SKILL.md`).
3. Rozszerzenie `.claude/skills/tidy-journal/SKILL.md`.
4. Aktualizacja `.claude/CLAUDE.md`: opis `zadania.md` i archiwum w strukturze vaulta, konwencja angielskich nazw skilli, nowa rola dziennika (tylko notatki).
5. (Opcjonalnie, na końcu) skill `meeting`.

Poza zakresem: pluginy Obsidiana, widoki Bases, automatyczne przypomnienia/harmonogramy.
