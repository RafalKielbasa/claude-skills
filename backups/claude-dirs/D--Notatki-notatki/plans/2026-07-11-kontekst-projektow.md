# Kontekst zewnętrznych projektów — plan wdrożenia

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Cel:** Skille vaulta czytają kontekst projektów z dysku (repo + dokumentacja), a nowy skill `sync-project` generuje i aktualizuje notatki projektów w `praca/projekty/<projekt>/`.

**Architektura:** Mapowanie projekt→ścieżka żyje we frontmatterze (`sciezka:`) notatki stanu projektu. Każdy projekt to folder z dokładnie dwiema notatkami: stanu (`<projekt>.md`) i dokumentacji technicznej (`<projekt>-dokumentacja.md`). Repo wyłącznie do odczytu; wszystkie zapisy w vaultcie za zgodą użytkownika.

**Tech stack:** Markdown (Obsidian), skille Claude Code (`.claude/skills/*/SKILL.md`), `.claude/settings.json`.

**Specyfikacja:** `.claude/specs/2026-07-11-kontekst-projektow-design.md`

## Ograniczenia globalne

- Vault NIE jest repozytorium git — bez kroków commit; weryfikacja = odczyt/sprawdzenie plików.
- Treść notatek i skilli po polsku; nazwy skilli angielskie kebab-case; nazwy plików/folderów kebab-case.
- Linki wewnętrzne w składni `[[wikilink]]`.
- Do repozytoriów projektów (`D:\Praca\...`) nigdy nic nie zapisujemy.
- Ścieżki projektów: edu-saas → `D:\Praca\Devstock\Projekty\saas app`, system-wieloagentowy → `D:\Praca\Devstock\Projekty\Multi agent system`, duty-rota-app → `D:\Praca\Side projects\duty-rota-app`.

---

### Task 1: Uprawnienia — `additionalDirectories` w settings.json

**Files:**
- Modify: `.claude/settings.json`

**Interfaces:**
- Produces: możliwość czytania trzech katalogów projektów bez promptów o zgodę (używana przez Taski 2–5 i skille w runtime).

- [ ] **Step 1: Dopisz `additionalDirectories` do sekcji `permissions`**

Docelowa pełna treść pliku:

```json
{
  "language": "polish",
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep"
    ],
    "additionalDirectories": [
      "D:\\Praca\\Devstock\\Projekty\\Multi agent system",
      "D:\\Praca\\Devstock\\Projekty\\saas app",
      "D:\\Praca\\Side projects\\duty-rota-app"
    ]
  },
  "extraKnownMarketplaces": {
    "obsidian-skills": {
      "source": {
        "source": "github",
        "repo": "kepano/obsidian-skills"
      }
    }
  },
  "enabledPlugins": {
    "obsidian@obsidian-skills": true
  }
}
```

- [ ] **Step 2: Zweryfikuj poprawność JSON**

Uruchom (PowerShell): `Get-Content .claude/settings.json -Raw | ConvertFrom-Json | Out-Null; if ($?) { "OK" }`
Oczekiwane: `OK`.

---

### Task 2: Nowy skill `sync-project`

**Files:**
- Create: `.claude/skills/sync-project/SKILL.md`

**Interfaces:**
- Consumes: ścieżki z Task 1 (odczyt repo bez promptów).
- Produces: definicja struktury notatek projektu (frontmatter `sciezka:`, sekcje `## podsumowanie stanu` / `## postępy` / `## planowane prace` oraz `## czym jest projekt` / `## stack` / `## architektura` / `## struktura repo`) — Taski 3–6 odwołują się do dokładnie tych nazw.

- [ ] **Step 1: Utwórz plik SKILL.md o dokładnie tej treści**

````markdown
---
name: sync-project
description: Użyj, gdy użytkownik chce zaktualizować notatki projektu w vaultcie na podstawie stanu repozytorium na dysku — pisze /sync-project <projekt>, „odśwież stan projektu X", „zaktualizuj dokumentację projektu". Czyta repo (dokumentację, git log, manifesty) i regeneruje dwie notatki w praca/projekty/<projekt>/.
---

# Synchronizacja projektu

Utrzymuje aktualne notatki projektu w `praca/projekty/<projekt>/` na podstawie rzeczywistego stanu repozytorium na dysku. Notatki projektowe są artefaktem generowanym: użytkownik pisze w `zadania.md` i dzienniku, a ten skill przenosi stan repo i dokumentacji do vaulta.

**Zasada nadrzędna: najpierw zbiorcza propozycja zmian, zapisy dopiero po akceptacji użytkownika.**

**Zasada druga: repozytorium projektu jest wyłącznie do odczytu — żadnych zapisów poza vaultem.**

## Struktura notatek projektu

Każdy projekt to folder `praca/projekty/<projekt>/` z dokładnie dwiema notatkami.

**Notatka stanu** — `<projekt>.md` (nazwa = nazwa folderu; hub projektu, cel wikilinków `[[projekt]]` z zadań):

```markdown
---
tags: [praca/projekty]
sciezka: D:\Sciezka\do\projektu
aliasy: [potoczna nazwa]
---

## podsumowanie stanu

2–4 zdania: czym projekt jest i gdzie jest teraz.

## postępy

- 2026-07-10 — co ostatnio zrobiono (z git log, dokumentacji repo, ukończonych zadań)

## planowane prace

- co przed nami (z dokumentacji repo i otwartych zadań)
```

- `sciezka:` — ścieżka do projektu na dysku, jedyne źródło mapowania projekt→repo,
- `aliasy:` — opcjonalne potoczne nazwy (np. „projekt taty" dla duty-rota-app), pomagają skillom łączyć zadania z projektem.

**Dokumentacja techniczna** — `<projekt>-dokumentacja.md` (prefiks projektu dla jednoznaczności wikilinków):

```markdown
---
tags: [praca/projekty]
---

## czym jest projekt

## stack

## architektura

## struktura repo
```

## Przebieg

Kroki 1–5 to analiza — bez żadnych zapisów; zapisy wykonuje krok 6, po akceptacji.

1. **Wybór projektu.** Argument wywołania wskazuje projekt. Bez argumentu — wylistuj podfoldery `praca/projekty/` i zapytaj, który synchronizować (albo „wszystkie"). Przy „wszystkie" wykonaj analizę dla każdego projektu, ale pokaż jedną zbiorczą propozycję.

2. **Ścieżka do repo.** Odczytaj `sciezka:` z frontmattera notatki stanu:
   - projekt nowy (brak folderu lub notatki stanu) → zapytaj użytkownika o ścieżkę na dysku i zaplanuj utworzenie folderu z obiema notatkami,
   - brak którejś z dwóch notatek → zaplanuj jej utworzenie,
   - ścieżka nie istnieje na dysku → zgłoś i pomiń ten projekt.

3. **Zbierz informacje z repo (tylko odczyt):**
   - dokumentacja: `README*`, `STATUS*`, pliki `*.md` w korzeniu (specyfikacje, podsumowania), katalog `docs/`,
   - git: `git -C <sciezka> log --since=<data ostatniej modyfikacji notatki stanu> --oneline` (repo bez gita → pomiń),
   - stack: manifesty typu `package.json`, `pnpm-workspace.yaml`, `docker-compose.yml`, `Dockerfile`, `requirements.txt`,
   - czytaj selektywnie (nagłówki, kluczowe fragmenty); pomijaj `node_modules`, katalogi buildów i zależności.

4. **Zbierz informacje z vaulta:** otwarte zadania w `zadania.md` odnoszące się do projektu (wikilink `[[projekt]]`, nazwa lub alias w treści) oraz ukończone z bieżącego miesiąca w `zadania-archiwum.md`.

5. **Zbuduj propozycję obu notatek.** Pełna nowa treść:
   - notatka stanu — sekcje `podsumowanie stanu` / `postępy` / `planowane prace` zregenerowane z zebranych informacji,
   - dokumentacja techniczna — `czym jest projekt` / `stack` / `architektura` / `struktura repo`,
   - treść kondensuj po polsku; terminów branżowych nie tłumacz; nie wklejaj surowych fragmentów dokumentacji repo,
   - **ochrona przed utratą danych:** porównaj z obecną treścią notatek; każdą informację, która znika, wypisz osobno na liście „do usunięcia" z uzasadnieniem (nieaktualna / zastąpiona nowszą); w razie wątpliwości zachowaj treść i oznacz `?`.

6. **Pokaż propozycję i STOP.** Nowa treść obu notatek + lista usuwanych informacji. **Czekaj na akceptację — do tego momentu żadnych zapisów.** Po akceptacji zapisz wszystko naraz (utwórz folder i notatki, jeśli nowe).

7. **Raport:** co się zmieniło w każdej notatce, co usunięto; jeśli w repo widać zaplanowane prace nieobecne w `zadania.md`, zasugeruj je w raporcie (bez dopisywania — decyzja użytkownika).

## Idempotencja

Ponowne uruchomienie bez zmian w repo daje pustą lub minimalną propozycję („brak zmian"). Skill nie dubluje wpisów w `postępach` — scala je z istniejącymi.

## Czego nie robić

- Nie zapisuj niczego przed akceptacją propozycji.
- Nie zapisuj niczego do repozytorium projektu ani nigdzie poza vaultem.
- Nie modyfikuj `zadania.md` — skill czyta zadania, sugestie zostawia w raporcie.
- Nie usuwaj informacji z notatek bez wypisania ich na liście „do usunięcia".
- Nie twórz notatek innych niż dwie ustalone (stan + dokumentacja) ani podfolderów projektu.
- Nie wklejaj surowej dokumentacji repo — zawsze kondensuj; terminów branżowych nie tłumacz.
````

- [ ] **Step 2: Zweryfikuj**

Uruchom: `ls .claude/skills/sync-project/SKILL.md` — plik istnieje. Sprawdź, że frontmatter ma pola `name` i `description` (pierwsze 5 linii pliku).

---

### Task 3: Migracja notatki edu-saas do struktury folderowej

**Files:**
- Create: `praca/projekty/edu-saas/edu-saas.md`
- Delete: `praca/projekty/edu-saas.md`

**Interfaces:**
- Consumes: strukturę notatki stanu z Task 2 (sekcje, frontmatter `sciezka:`).
- Produces: pierwszy folder projektu; wikilink `[[edu-saas]]` wskazuje nową notatkę stanu. Notatkę `edu-saas-dokumentacja.md` utworzy pierwsze uruchomienie `/sync-project` (obsługa „brak którejś z dwóch notatek").

- [ ] **Step 1: Utwórz `praca/projekty/edu-saas/edu-saas.md` o treści**

```markdown
---
tags: [praca/projekty]
sciezka: D:\Praca\Devstock\Projekty\saas app
---

## podsumowanie stanu

Platforma SaaS do udostępniania kursów (projekt Devstock). Trwają prace nad flow rejestracji (dwustopniowa walidacja) i landingiem z podglądem kursów.

## postępy

- 2026-07-11 — przygotowane zadania na SaaS, przeniesione dostępy (z zadań).
- 2026-07-10 — review modułu 2 (z zadań).

## planowane prace

- w formularzu rejestracji dodać mechanikę powtórzenia hasła i potwierdzenia email,
- zaktualizować dokumentację o nowe flow (dwustopniowa walidacja),
- dodać na landing podgląd wszystkich udostępnionych kursów z możliwością wyboru przez twórcę, które kursy są widoczne,
- rozpisać zadania na frontend po weryfikacji BE (otwarte zadanie w [[zadania]]).
```

- [ ] **Step 2: Usuń starą notatkę**

Uruchom (PowerShell): `Remove-Item "praca/projekty/edu-saas.md" -Confirm:$false`

- [ ] **Step 3: Zweryfikuj**

Uruchom: `ls praca/projekty; ls praca/projekty/edu-saas`
Oczekiwane: w `praca/projekty/` tylko folder `edu-saas` (bez pliku `edu-saas.md` luzem); w folderze plik `edu-saas.md`.

---

### Task 4: Aktualizacja skilla `start-day` (raport z notatek stanu + świeżość)

**Files:**
- Modify: `.claude/skills/start-day/SKILL.md` (krok 7 „Raport")

**Interfaces:**
- Consumes: strukturę notatki stanu i pole `sciezka:`/`aliasy:` z Task 2.

- [ ] **Step 1: Podmień krok 7**

Stara treść (do znalezienia w pliku):

```markdown
7. **Raport.** Podsumuj: co zarchiwizowane, co skorygowane i dokąd, sugestia dnia. Dla każdego projektu, do którego linkuje jakiekolwiek otwarte zadanie, pokaż ostatni wpis z sekcji `## na czym skończyłem` notatki projektu (jeśli sekcja istnieje) — to część raportu w terminalu, nie zapis w pliku.
```

Nowa treść:

```markdown
7. **Raport.** Podsumuj: co zarchiwizowane, co skorygowane i dokąd, sugestia dnia. Dla każdego projektu z `praca/projekty/<projekt>/`, do którego odnosi się jakiekolwiek otwarte zadanie (wikilink `[[projekt]]`, nazwa albo alias z frontmattera w treści zadania), pokaż skrót notatki stanu `<projekt>.md`: najnowsze pozycje z `## postępy` i `## planowane prace`. Dodatkowo sprawdź świeżość: odczytaj `sciezka:` z frontmattera i porównaj datę ostatniego commita (`git -C <sciezka> log -1 --format=%ci`; brak gita lub ścieżki → pomiń) z datą modyfikacji notatki stanu — jeśli commit jest nowszy, zasugeruj `/sync-project <projekt>`. To część raportu w terminalu, nie zapis w pliku; nie skanuj repo poza `git log -1`.
```

- [ ] **Step 2: Zweryfikuj**

Grep w pliku: fraza `na czym skończyłem` nie występuje; frazy `## postępy` i `sync-project` występują w kroku 7.

---

### Task 5: Aktualizacja skilla `tidy-journal` (wątki projektów → notatki stanu)

**Files:**
- Modify: `.claude/skills/tidy-journal/SKILL.md` (wstęp, krok 2, krok 6, krok 8)

**Interfaces:**
- Consumes: strukturę obu notatek projektu z Task 2.

- [ ] **Step 1: Podmień we wstępie (linia po nagłówku `# Porządkowanie dziennika`)**

Stara treść: `Zadania trafiają do `zadania.md`, wątki projektów do sekcji `## na czym skończyłem`, zapiski ze spotkań do `praca/spotkania/`.`

Nowa treść: `Zadania trafiają do `zadania.md`, wątki projektów do notatek stanu projektów (`praca/projekty/<projekt>/<projekt>.md`), zapiski ze spotkań do `praca/spotkania/`.`

- [ ] **Step 2: Podmień w kroku 2 (klasyfikacja) zdanie o wiedzy projektowej**

Stara treść: `Wiedza specyficzna dla klienta/projektu (nazwy, decyzje, konfiguracja) trafia do `praca/projekty/<projekt>/`.`

Nowa treść: `Wiedza specyficzna dla klienta/projektu (nazwy, decyzje, konfiguracja) trafia do notatki dokumentacji projektu `praca/projekty/<projekt>/<projekt>-dokumentacja.md` (do pasującej sekcji), a wątki postępu prac do notatki stanu — patrz punkt 6.`

- [ ] **Step 3: Podmień cały krok 6**

Stara treść:

```markdown
6. **Wątki projektów.** Wpisy opisujące postęp prac w projekcie (co zrobiono, na czym stanięto, co dalej) → zaktualizuj sekcję `## na czym skończyłem` w notatce projektu (`praca/projekty/<projekt>.md`): krótki datowany wpis na górze sekcji (np. `- 2026-07-09 — skonfigurowany load balancer, zostały health checki`), scalony z istniejącą treścią. Jeśli sekcja nie istnieje — dodaj ją na końcu notatki projektu.
```

Nowa treść:

```markdown
6. **Wątki projektów.** Wpisy opisujące postęp prac w projekcie (co zrobiono, na czym stanięto, co dalej) → zaktualizuj notatkę stanu projektu (`praca/projekty/<projekt>/<projekt>.md`): zrobione scalaj do `## postępy` jako krótki datowany wpis na górze sekcji (np. `- 2026-07-09 — skonfigurowany load balancer`), plany do `## planowane prace`. Fakty możesz doprecyzować, zaglądając (tylko odczyt) do repo projektu — ścieżka w polu `sciezka:` frontmattera notatki stanu (np. sprawdź w `git log` lub dokumentacji repo, czego dokładnie dotyczył wpis „naprawiłem walidację"). Jeśli folder lub notatka stanu projektu nie istnieje — oznacz `?` w planie i zaproponuj uruchomienie `/sync-project <projekt>`, który je utworzy.
```

- [ ] **Step 4: Podmień w kroku 8 frazę planu**

Stara treść: `aktualizacje `## na czym skończyłem``

Nowa treść: `aktualizacje notatek stanu projektów`

- [ ] **Step 5: Zweryfikuj**

Grep w pliku: fraza `na czym skończyłem` nie występuje; frazy `## postępy`, `-dokumentacja.md` i `sync-project` występują.

---

### Task 6: Aktualizacja `CLAUDE.md`

**Files:**
- Modify: `.claude/CLAUDE.md` (sekcje „Struktura vaulta" i „Notatki wiedzowe")

- [ ] **Step 1: Podmień linię o `praca/`**

Stara treść: `- `praca/` — notatki zawodowe: `projekty/`, `spotkania/`.`

Nowa treść: `- `praca/` — notatki zawodowe: `projekty/` (folder na projekt: `praca/projekty/<projekt>/` z dwiema notatkami utrzymywanymi skillem `sync-project` — notatką stanu `<projekt>.md` z frontmatterem `sciezka:` wskazującym repo na dysku i sekcjami podsumowanie stanu / postępy / planowane prace, oraz dokumentacją techniczną `<projekt>-dokumentacja.md`; repo czytamy, nigdy nie zapisujemy) i `spotkania/`.`

- [ ] **Step 2: Podmień pierwsze zdanie sekcji „Notatki wiedzowe"**

Stara treść: `- W `nauka/` i `praca/projekty/` notatki wiedzowe są atomowe: jeden plik = jedno zagadnienie, wg szablonu `szablony/notatka-wiedzowa.md` (sekcje: Podsumowanie, Szczegóły, Powiązane).`

Nowa treść: `- W `nauka/` notatki wiedzowe są atomowe: jeden plik = jedno zagadnienie, wg szablonu `szablony/notatka-wiedzowa.md` (sekcje: Podsumowanie, Szczegóły, Powiązane). W `praca/projekty/` obowiązuje konwencja projektowa: dokładnie dwie notatki na projekt (stan + dokumentacja techniczna), generowane skillem `sync-project`.`

- [ ] **Step 3: Zweryfikuj**

Grep w `.claude/CLAUDE.md`: fraza `sync-project` występuje 2 razy; fraza `sciezka:` występuje.

---

### Task 7: Aktualizacja `README.md`

**Files:**
- Modify: `README.md` (tabela skilli, sekcja „Foldery", sekcja „Konwencje notatek wiedzowych")

- [ ] **Step 1: Dopisz wiersz do tabeli skilli (po wierszu `compile-notes`)**

```markdown
| `sync-project`  | `/sync-project <projekt>`                                                              | Regeneruje notatki projektu w `praca/projekty/<projekt>/` (stan + dokumentacja techniczna) na podstawie repo na dysku: dokumentacji, git log, manifestów oraz zadań z [[zadania]]. Repo tylko czyta; zapisuje po akceptacji propozycji.            |
```

- [ ] **Step 2: Podmień linię o `praca/` w sekcji Foldery**

Stara treść: `- `praca/` — notatki zawodowe: `projekty/` (notatki projektowe) i `spotkania/` (notatki ze spotkań tworzone skillem `meeting`).`

Nowa treść: `- `praca/` — notatki zawodowe: `projekty/` (folder na projekt z notatką stanu i dokumentacją techniczną, utrzymywane skillem `sync-project`; frontmatter `sciezka:` notatki stanu wskazuje repo na dysku) i `spotkania/` (notatki ze spotkań tworzone skillem `meeting`).`

- [ ] **Step 3: Podmień sekcję „Konwencje notatek wiedzowych"**

Stara treść: `W `nauka/` i `praca/projekty/` notatki są atomowe (jeden plik = jedno zagadnienie, sekcje: Podsumowanie, Szczegóły, Powiązane), a każdy folder liściowy ma notatkę-hub o nazwie folderu (np. `nauka/devops/devops.md`) spinającą linki do notatek atomowych. Nazwy plików i folderów w kebab-case; wyjątkiem są notatki dziennika (`RRRR-MM-DD.md`).`

Nowa treść: `W `nauka/` notatki są atomowe (jeden plik = jedno zagadnienie, sekcje: Podsumowanie, Szczegóły, Powiązane), a każdy folder liściowy ma notatkę-hub o nazwie folderu (np. `nauka/devops/devops.md`) spinającą linki do notatek atomowych. W `praca/projekty/` każdy projekt ma dokładnie dwie notatki: stanu (`<projekt>.md`, pełni rolę huba projektu) i dokumentacji technicznej (`<projekt>-dokumentacja.md`). Nazwy plików i folderów w kebab-case; wyjątkiem są notatki dziennika (`RRRR-MM-DD.md`).`

- [ ] **Step 4: Zweryfikuj**

Grep w `README.md`: fraza `sync-project` występuje co najmniej 3 razy.

---

### Task 8: Weryfikacja końcowa (smoke test)

**Files:** brak zmian — tylko odczyty.

- [ ] **Step 1: Spójność struktury**

Sprawdź, że istnieją: `.claude/skills/sync-project/SKILL.md`, `praca/projekty/edu-saas/edu-saas.md`; że NIE istnieje `praca/projekty/edu-saas.md`; że `.claude/settings.json` parsuje się jako JSON.

- [ ] **Step 2: Spójność nazw sekcji między skillami**

Grep frazy `## postępy` i `## planowane prace` w: `sync-project/SKILL.md`, `start-day/SKILL.md`, `tidy-journal/SKILL.md`, `praca/projekty/edu-saas/edu-saas.md` — wszędzie identyczna pisownia (małe litery). Fraza `na czym skończyłem` nie występuje w żadnym skillu ani w CLAUDE.md.

- [ ] **Step 3: Test funkcjonalny (z użytkownikiem)**

Zaproponuj użytkownikowi uruchomienie `/sync-project` w wariancie „wszystkie": utworzy foldery `system-wieloagentowy/` i `duty-rota-app/` (z pytaniem o aliasy, np. „projekt taty"), uzupełni `edu-saas-dokumentacja.md` i pokaże pierwszą pełną propozycję. To naturalny test end-to-end całego wdrożenia.
