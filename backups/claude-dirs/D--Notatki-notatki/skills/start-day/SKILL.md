---
name: start-day
description: Użyj rano na start dnia — gdy użytkownik chce zaplanować dzień, uporządkować zadania, odpalić poranny rytuał albo pisze /start-day. Porządkuje zadania.md, analizuje wczorajszy dzień, proponuje priorytety w bloku „start dnia" i tworzy notatkę dzienną.
---

# Start dnia

Poranny rytuał zadaniowy — docelowo 2–3 minuty. Operuje na `zadania.md`, jedynym źródle prawdy o zadaniach.

**Zasada nadrzędna: najpierw jedna zbiorcza propozycja (porządki + treść bloku „start dnia"), zapisy dopiero po akceptacji użytkownika.**

**Zasada druga: zadanie istnieje w dokładnie jednym miejscu — `na dziś`, `backlog` albo archiwum. Nowe zadania użytkownik dopisuje w ciągu dnia domyślnie do backlogu (właściwy kontekst); sekcję „na dziś" kuruje sam, przenosząc tam to, co faktycznie robi danego dnia. Skill nie przenosi zadań między backlogiem a „na dziś" — to decyzja użytkownika.**

## Struktura zadania.md

```markdown
# Zadania

## start dnia — RRRR-MM-DD

**Wczoraj:** …opisowa analiza wczorajszego dnia…

**Dziś:** …opisowa sugestia 2–3 priorytetów…

## na dziś
### praca
### dom
### nauka
### prywatne

## backlog
### praca
### dom
### nauka
### prywatne
```

- `## start dnia — RRRR-MM-DD` — dokładnie jeden blok, nadpisywany każdego ranka po akceptacji. Wyłącznie opisowy (bez checkboxów i list zadań); do zadań odwołuje się treścią.
- `## na dziś` — zadania, które użytkownik świadomie wybrał na bieżący dzień; kuruje ją wyłącznie użytkownik. Wewnątrz zawsze wszystkie cztery podsekcje kontekstów `### praca/dom/nauka/prywatne` — puste zostają, tak jak w backlogu.
- `## backlog` — dom wszystkich pozostałych zadań, per kontekst: podsekcje `### praca/dom/nauka/prywatne`. Backlog trzyma zawsze wszystkie cztery podsekcje (puste zostają).

Format zadania: `- [ ] Treść #kontekst [[projekt]] ➕RRRR-MM-DD`

- `#kontekst` — tag zgodny z podsekcją kontekstu (`#praca`, `#dom`, `#nauka`, `#prywatne`),
- `[[projekt]]` — opcjonalny wikilink do notatki projektu,
- `➕RRRR-MM-DD` — data dodania (uzupełniają ją skille).

`archiwum/zadania-archiwum.md` przechowuje ukończone zadania w sekcjach miesięcy (`## RRRR-MM`, najnowszy miesiąc na górze), format: `- [x] Treść ✅RRRR-MM-DD ➕RRRR-MM-DD`.

## Przebieg

Kroki 1–5 to analiza i budowanie propozycji — bez żadnych zapisów; wszystkie zapisy wykonuje krok 6, po akceptacji użytkownika.

1. **Przygotowanie.** Jeśli `zadania.md` lub `archiwum/zadania-archiwum.md` nie istnieje, zaplanuj utworzenie go od zera (struktura wyżej) — to pierwsze uruchomienie.

2. **Porządki w `zadania.md`:**
   - `- [x]` (z `## na dziś` i z `## backlog`) → do archiwum, do sekcji bieżącego miesiąca (utwórz `## RRRR-MM`, jeśli brak), z `✅` i dzisiejszą datą, bez tagu kontekstu,
   - zadania bez daty `➕` → uzupełnij dzisiejszą datą,
   - tag brakujący lub niezgodny z podsekcją kontekstu → dopasuj do podsekcji,
   - zadanie treścią pasujące do innego kontekstu (albo dopisane poza podsekcjami) → zaproponuj przeniesienie do właściwej podsekcji (w obrębie tej samej sekcji — `na dziś` lub `backlog`); niejednoznaczne — zapytaj użytkownika,
   - puste podsekcje kontekstu zostają w obu sekcjach (`## na dziś` i `## backlog`) — po archiwizacji odhaczonych niczego nie usuwaj, a brakującą podsekcję odtwórz,
   - **nie przenoś zadań między `## na dziś` a `## backlog`** — to decyzja użytkownika.

3. **Zabłąkane zadania.** Przejrzyj notatki dzienne (`RRRR-MM-DD.md` w korzeniu vaulta, z pominięciem `archiwum/`) i sekcje `## zadania` notatek w `praca/spotkania/`:
   - nieodhaczone checkboxy → dopisz do `## backlog`, do podsekcji kontekstu dobranej po treści (niejednoznaczne — zapytaj), z `➕` i datą notatki, z której pochodzą; w miejscu pochodzenia zamień linię na zwykły punkt z dopiskiem `→ [[zadania]]`; puste checkboxy (sam szablon) pomijaj,
   - odhaczone zostaw bez zmian.

4. **Analiza wczoraj i sugestia na dziś.** Zbuduj treść nowego bloku `## start dnia — <dzisiejsza data>`:
   - **Wczoraj:** zadania z `✅` wczorajszą datą (archiwum) i świeżo archiwizowane z kroku 2, zestawione z sugestią z ustępującego bloku — co zrobiono, co nie ruszyło; istotne wątki z wczorajszej notatki dziennej,
   - **Dziś:** punkt wyjścia to sekcja `## na dziś` — co w niej jest i co warto z niej domknąć. Zadanie wiszące w `## na dziś` nieodhaczone z poprzednich dni (wynika to z zestawienia z ustępującym blokiem / wczorajszą notatką) wyraźnie wytknij — ale go nie przenoś. Następnie zaproponuj z `## backlog` 1–2 rzeczy warte dorzucenia dziś (sugestia opisowa, bez ruszania list). Zadania-zombie (`➕` starsze niż 14 dni, w całym pliku) wyraźnie wskaż.

5. **Zbiorcza propozycja.** Pokaż użytkownikowi jedną propozycję: wynik porządków (co do archiwum, korekty tagów i kategorii, zabłąkane zadania z proponowanymi kontekstami) + pełną treść nowego bloku „start dnia". **Czekaj na akceptację — do tego momentu żadnych zapisów.**

6. **Zapis.** Po akceptacji (lub korekcie) wykonaj wszystkie zapisy naraz: porządki + zastąpienie starego bloku `## start dnia` nowym. Utwórz dzisiejszą notatkę dzienną `RRRR-MM-DD.md` w korzeniu vaulta z `szablony/dziennik.md`, jeśli nie istnieje (istniejącej nie nadpisuj).

7. **Raport.** Podsumuj: co zarchiwizowane, co skorygowane i dokąd, sugestia dnia. Dla każdego projektu z `praca/projekty/<projekt>/`, do którego odnosi się jakiekolwiek otwarte zadanie (wikilink `[[projekt]]`, nazwa albo alias z frontmattera w treści zadania), pokaż skrót notatki stanu `<projekt>.md`: najnowsze pozycje z `## postępy` i `## planowane prace`. Dodatkowo sprawdź świeżość: odczytaj `sciezka:` z frontmattera i porównaj datę ostatniego commita (`git -C <sciezka> log -1 --format=%ci`; brak gita lub ścieżki → pomiń) z datą modyfikacji notatki stanu — jeśli commit jest nowszy, zasugeruj `/sync-project <projekt>`. To część raportu w terminalu, nie zapis w pliku; nie skanuj repo poza `git log -1`.

## Idempotencja

Ponowne uruchomienie tego samego dnia nie psuje stanu: blok z dzisiejszą datą jest aktualizowany (np. analiza uwzględnia świeżo odhaczone zadania), nie dublowany; świeżo odhaczone zadania się archiwizują. Nic się nie dubluje — przed dopisaniem zadania sprawdź, czy to samo zadanie (także sformułowane innymi słowami) już nie figuruje w `zadania.md`; duplikaty scalaj w jedno, zachowując starszą datę dodania.

## Czego nie robić

- Nie zapisuj niczego przed akceptacją zbiorczej propozycji.
- Nie zmieniaj treści zadań (poza tagiem kontekstu i datami).
- Nie usuwaj zadań — jedyna droga „w dół" to archiwum po odhaczeniu.
- Nie przenoś zadań między `## na dziś` a `## backlog` — sekcję „na dziś" kuruje wyłącznie użytkownik.
- Nie twórz nowych sekcji ani kontekstów; puste podsekcje kontekstów zostają w obu sekcjach — nie usuwaj ich.
- Nie umieszczaj w bloku „start dnia" checkboxów ani list zadań — priorytety wyłącznie opisowo.
- Nie dopisuj kolejnych bloków „start dnia" — zawsze dokładnie jeden, nadpisywany.
- Nie ustalaj sugestii bez udziału użytkownika — priorytety zatwierdza on.
