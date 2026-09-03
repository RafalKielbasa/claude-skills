# Powtórki z notatek własnych — plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać do systemu powtórek interwałowych drugie źródło pozycji — notatki wiedzowe z `nauka/tech/`, rejestrowane automatycznie przez `tidy-journal` i przepytywane przez `nauka-z-claude` (zadania 1–5). Przy okazji naprawić skille i artefakty, które rozjechały się po wydzieleniu folderu `nauka/tech/` (zadania 6–8).

**Architecture:** Zmiana dotyczy wyłącznie plików instrukcji (Markdown): dwóch skilli, instrukcji projektu i README. Stan powtórek notatkowych mieszka w nowej sekcji `## Powtórki z notatek` na końcu `D:\Notatki\notatki\nauka-z-claude.md`, w formacie pozycji identycznym co do członu `[następna: …, interwał: …]` z pozycjami tematycznymi — dzięki czemu hook `powtorki-check.ps1` liczy je bez żadnej zmiany kodu. `tidy-journal` zasila sekcję, `nauka-z-claude` ją konsumuje.

**Tech Stack:** Markdown (definicje skilli Claude Code), PowerShell 5.1 (istniejący hook — tylko weryfikacja, bez zmian), vault Obsidiana.

**Spec:** `D:\Notatki\notatki\.claude\specs\2026-08-15-powtorki-z-notatek-design.md`

## Global Constraints

- **Bez commitów.** Zasada z globalnego `CLAUDE.md`: zmiany zostają w drzewie roboczym jako niezacommitowane. Żadne zadanie nie kończy się `git add`/`git commit` — kończy się weryfikacją.
- **Format `[następna: RRRR-MM-DD, interwał: Nd]` jest nietykalny** — czyta go regexem hook `~\.claude\hooks\powtorki-check.ps1` (wzorzec `nast\u0119pna: (\d{4}-\d{2}-\d{2})`).
- **Hook `powtorki-check.ps1` nie jest modyfikowany** w żadnym zadaniu.
- **Drabinka notatek:** `3 → 7 → 14 → 30 → 60 → 120`, dalej stale `120`. Reset schodzi do `3d`, nie do `1d`.
- **Drabinka pozycji tematycznych zostaje bez zmian:** `1 → 3 → 7 → 14 → 30`, po zaliczeniu 30d pozycja wypada jako „Utrwalone".
- **Budżet sesji:** ~12 pytań, po połowie na źródło, niewykorzystana część przechodzi na drugie źródło. Maksymalnie 3 notatki na sesję. Tryb tylko tematyczny zachowuje limit 10 pozycji.
- **Zakres rotacji:** notatki atomowe w `nauka/tech/` (rekurencyjnie — `agenci-ai/`, `chmura/`, `devops/`, `linux/`, `programowanie/`). Poza zakresem: notatki-huby (nazwa pliku = nazwa folderu), pozostałe gałęzie `nauka/` (`biznes/`, `jezyki/`, `czytelnia/`) i wszystko spoza `nauka/`. Wyjątek: jawnie wskazana pojedyncza notatka przy ręcznym dociąganiu (Task 3) wchodzi zawsze.
- **Notatka wiedzowa nie dostaje pól operacyjnych we frontmatterze** — reguła „notatka to czysta treść" z `CLAUDE.md` zostaje nienaruszona.
- **Konwencja tagów:** `#nauka/tech/<gałąź>` — tag odwzorowuje ścieżkę folderu (decyzja z 2026-08-15, realizowana w Task 6). Gałęzie spoza `tech/` zachowują tagi płaskie: `#nauka/biznes`, `#nauka/jezyki`, `#nauka/czytelnia`.
- Treść skilli po polsku, nazwy skilli i plików po angielsku w kebab-case.
- Zadania 1–5 budują funkcję powtórek z notatek; zadania 6–8 naprawiają skille i artefakty rozjechane przez wcześniejsze wydzielenie `nauka/tech/`.

---

### Task 1: Rozpoznanie trybów i format sekcji stanu w `nauka-z-claude`

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md:19-30` (sekcja „Krok 0 — plik postępu")
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md:97-134` (sekcja „Zapis postępu")
- Test: `$env:TEMP\powtorki-probka.md` (plik próbny, tylko do weryfikacji hooka)

**Interfaces:**
- Produces: nazwa sekcji stanu `## Powtórki z notatek`, format pozycji `- [następna: RRRR-MM-DD, interwał: Nd] (diagnoza)? [[<notatka>]] — <wskazówka>`, nazwy trzech trybów („mieszany", „tylko z notatek", „tylko tematyczny"). Zadania 2–4 opierają się na tych nazwach dosłownie.

- [ ] **Krok 1: Podmień punkt o powtórkach w „Krok 0 — plik postępu"**

Zastąp istniejące dwie linie:

```markdown
- Prośba o powtórki („zrób powtórki", „przepytaj mnie") albo kontekst hooka
  o zaległych pozycjach → sekcja „Powtórki".
```

nowym blokiem:

```markdown
- Prośba o powtórki albo kontekst hooka o zaległych pozycjach → sekcja
  „Powtórki". Najpierw rozpoznaj tryb:
  - „zrób powtórki", „przepytaj mnie", kontekst hooka → **tryb mieszany**
    (oba źródła, budżet dzielony),
  - „powtórka z notatek", „przepytaj mnie z <obszar>" (np. „z Google Cloud"),
    wskazany folder → **tryb tylko z notatek**, zawężony do wskazanego obszaru,
  - „powtórka z nauki z Claude", „przepytaj mnie z tematu X" → **tryb tylko
    tematyczny**.
- Prośba o dociągnięcie notatek do powtórek („dodaj do powtórek folder X",
  „wrzuć Google Cloud do powtórek") → sekcja „Dociąganie notatek do rotacji".
```

- [ ] **Krok 2: Dopisz format sekcji stanu w „Zapis postępu"**

Na końcu sekcji „Zapis postępu", pod istniejącym zdaniem o formacie czytanym przez hook (`Format [następna: YYYY-MM-DD, interwał: Nd] czyta regexem hook powtórek…`), dopisz:

````markdown
Poza sekcjami tematów plik trzyma jedną sekcję o stałej nazwie, **na samym końcu**:

```markdown
## Powtórki z notatek

- [następna: 2026-08-22, interwał: 7d] [[compute-engine]] — ostatnio padło
  rozróżnienie machine family; zacznij od niego.
- [następna: 2026-08-18, interwał: 3d] (diagnoza) [[cloud-storage]]
```

Budowa pozycji, w kolejności: człon `[następna: …, interwał: …]` (ten sam format
co w pozycjach tematycznych, czytany przez hook), opcjonalny znacznik
`(diagnoza)` dla notatki jeszcze nigdy nieprzepytanej, wikilink do notatki
(ze ścieżką, gdy nazwa pliku nie jest unikalna) i opcjonalna wskazówka po ` — `.
Wskazówkę **zastępujesz**, nie doklejasz — trzyma stan „od czego zacząć następnym
razem", nie historię potknięć. Sekcję zakładasz przy pierwszym zasileniu; pustej
nie tworzysz. Szczegóły obsługi — sekcja „Powtórki z notatek".
````

- [ ] **Krok 3: Zweryfikuj, że hook policzy pozycje notatkowe**

Utwórz plik próbny `$env:TEMP\powtorki-probka.md` o treści:

```markdown
# Nauka z Claude

## Temat próbny

### Powtórki

- [następna: 2099-01-01, interwał: 3d] pozycja tematyczna z przyszłości

## Powtórki z notatek

- [następna: 2026-08-10, interwał: 7d] [[compute-engine]] — wskazówka
- [następna: 2026-08-15, interwał: 3d] (diagnoza) [[cloud-storage]]
- [następna: 2099-12-31, interwał: 120d] [[looker]]
```

Uruchom (PowerShell), odtwarzając logikę hooka:

```powershell
$probka = Join-Path $env:TEMP 'powtorki-probka.md'
$content = Get-Content $probka -Raw -Encoding UTF8
$duePattern = "nast$([char]0x0119)pna: (\d{4}-\d{2}-\d{2})"
$today = '2026-08-15'
([regex]::Matches($content, $duePattern) | Where-Object { $_.Groups[1].Value -le $today } | Measure-Object).Count
```

Oczekiwane: `2` — obie zaległe pozycje notatkowe (`2026-08-10` i `2026-08-15`), bez pozycji z przyszłymi datami. Wynik inny niż 2 oznacza, że format pozycji rozjechał się z hookiem — popraw format, nie hook.

- [ ] **Krok 4: Usuń plik próbny**

```powershell
Remove-Item (Join-Path $env:TEMP 'powtorki-probka.md')
```

- [ ] **Krok 5: Weryfikacja końcowa zadania**

Przeczytaj zmienione fragmenty i potwierdź: (1) trzy tryby mają jednoznaczne wyzwalacze, (2) opis formatu pozycji wymienia wszystkie cztery człony, (3) nie zmieniłeś ani jednego znaku w członie `[następna: …, interwał: …]`. **Bez commita** — zmiany zostają w drzewie roboczym.

---

### Task 2: Mechanika sesji powtórek z notatek w `nauka-z-claude`

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md:71-95` (sekcja „Powtórki")
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md:136-162` (sekcje „Red flags" i „Częste błędy")

**Interfaces:**
- Consumes: z Task 1 — nazwa sekcji `## Powtórki z notatek`, format pozycji, nazwy trzech trybów.
- Produces: sekcja „Powtórki z notatek" w SKILL.md z podsekcjami „Dobór na sesję", „Przebieg", „Ocena" — Task 3 dopisuje sekcję sąsiadującą, Task 4 odwołuje się do nazwy sekcji i do reguł rejestracji pozycji.

- [ ] **Krok 1: Dopisz budżet i tryby na początku istniejącej sekcji „Powtórki"**

Pod istniejącym akapitem otwierającym sekcję („Uruchamiane ręcznie…"), przed listą numerowaną, wstaw:

```markdown
Sesja ma budżet **~12 pytań**, dzielony po połowie między dwa źródła: pozycje
tematyczne (jedna pozycja = jedno pytanie) i notatki wiedzowe (patrz „Powtórki
z notatek"). Niewykorzystana część jednego źródła przechodzi na drugie, więc
budżet się nie marnuje, a żadne źródło nie wypycha drugiego. Tryb tylko
tematyczny oddaje cały budżet pozycjom tematycznym, zachowując limit 10 pozycji
na sesję; tryb tylko z notatek — cały budżet notatkom.
```

- [ ] **Krok 2: Popraw punkt 1 listy w sekcji „Powtórki"**

Zastąp:

```markdown
1. Zbierz zaległe pozycje (`następna ≤ dziś`) ze **wszystkich** tematów.
   Najstarsza data pierwsza, maksymalnie 10 na sesję. Brak zaległych →
   powiedz to i podaj datę najbliższej powtórki.
```

na:

```markdown
1. Zbierz zaległe pozycje (`następna ≤ dziś`) ze **wszystkich** tematów.
   Najstarsza data pierwsza, w ramach przydziału pytań dla tego źródła
   (w trybie tylko tematycznym maksymalnie 10 pozycji). Brak zaległych w obu
   źródłach → powiedz to i podaj datę najbliższej powtórki.
```

- [ ] **Krok 3: Wstaw nową sekcję „Powtórki z notatek"**

Bezpośrednio po sekcji „Powtórki" (po zdaniu „Powtórki nie ruszają roadmapy…"), przed sekcją „Zapis postępu":

````markdown
## Powtórki z notatek

Drugie źródło powtórek: notatki wiedzowe z `nauka/tech/`, powstające przy
samodzielnej nauce z zewnętrznych źródeł i rejestrowane przez skill `tidy-journal`. To główny
nurt nauki użytkownika — pozycje tematyczne łatają luki wykryte w rozmowie,
notatki podtrzymują wiedzę, którą zdobył sam. Stan trzyma sekcja
`## Powtórki z notatek` na końcu pliku postępu; pytania układasz za każdym razem
na nowo z **aktualnej** treści notatki, więc rosną razem z nią.

Drabinka: `3 → 7 → 14 → 30 → 60 → 120` dni, dalej stale `120`. Notatka nigdy nie
wypada z rotacji — po dojściu do szczytu schodzi do konserwacji (raz na kwartał
jedno pytanie). Reset schodzi do `3d`, nie do `1d`.

### Dobór na sesję

1. Zaległe pozycje (`następna ≤ dziś`), najstarsza data pierwsza, **maksymalnie
   3 notatki na sesję** — lepiej przepytać trzy porządnie niż osiem po łebkach.
2. Notatka jest **niepodzielna**: przepytujesz ją w całości albo nie zaczynasz.
   Wchodzi do sesji tylko wtedy, gdy mieści się i w limicie 3 notatek, i
   w pozostałym przydziale pytań. Notatka odłożona zachowuje datę `następna`,
   więc wróci jako zaległa.
3. Zawężenie do obszaru (np. „z Google Cloud" → `nauka/tech/chmura/google-cloud/`)
   obejmuje podfoldery. Brak zaległych w zawężeniu → powiedz to i podaj datę
   najbliższej.
4. Notatka pusta albo szczątkowa (sam szablon, `## Szczegóły` bez treści) →
   pomiń przy doborze i zgłoś w podsumowaniu; nie ma z czego pytać.

### Przebieg

1. Przeczytaj notatkę. Liczba pytań = liczba odrębnych wątków w `## Szczegóły`,
   maksymalnie 3 (krótka notatka o jednym wątku → jedno pytanie).
2. Pytania sokratejskie **z innego ujęcia niż zapis w notatce** — inny przykład,
   przypadek brzegowy, „a co jeśli…". Nie cytuj zdań notatki przed odpowiedzią.
3. Pozycja ze wskazówką → **pierwsze pytanie idzie z tego wątku**.
4. Błędna odpowiedź dostaje naprowadzenie jak w pętli sokratejskiej, nie poprawkę;
   wyjaśnienie dopiero po dwóch nieudanych naprowadzeniach.
5. Zapisz pozycję po skończeniu notatki, przed przejściem do następnej.

### Ocena

| Wynik | Skutek |
|---|---|
| Wszystkie pytania poprawnie | awans o oczko drabinki, `następna` = dziś + nowy interwał, wskazówka skasowana |
| Część poprawnie | interwał **bez zmian**, `następna` = dziś + interwał, wskazówka = co padło |
| Wszystkie błędnie | reset: interwał `3d`, `następna` = dziś + 3, wskazówka = luki |
| Pozycja ze znacznikiem `(diagnoza)` | pierwsza powtórka **bez kary**: słaby wynik zostawia `3d` i zapisuje luki, dobry awansuje normalnie (`3d → 7d`). Znacznik zdejmujesz niezależnie od wyniku |

Tryb diagnozy istnieje, bo notatka często powstaje z materiału, którego użytkownik
nie przerabiał z Tobą (obejrzany kurs → zapiski w dzienniku → `tidy-journal`).
Pierwsze pytanie bywa wtedy pierwszym sprawdzeniem rozumienia, nie powtórką —
słaby wynik to punkt startu, nie regres.

Luka wykryta przy notatce **nie tworzy pozycji tematycznej** — zostaje wskazówką
przy pozycji notatki. Powtórki notatek nie ruszają roadmap ani sekcji tematów.

Sytuacje brzegowe:

- Pozycja wskazuje na nieistniejący plik (zmiana nazwy, przeniesienie, usunięcie)
  → zgłoś przy sesji i zapytaj, czy wskazać nową ścieżkę, czy usunąć pozycję.
  **Nigdy nie kasuj pozycji sam.**
- Duplikat pozycji dla tej samej notatki → scal w jedną, zachowując **wcześniejszą**
  datę `następna` i **niższy** interwał.
````

- [ ] **Krok 4: Dopisz wpisy do „Red flags — zatrzymaj się"**

Do istniejącej listy dopisz cztery pozycje:

```markdown
- „Notatka jest długa, przepytam dziś połowę, resztę następnym razem"
  (notatka jest niepodzielna — odłóż ją w całości)
- „Przy powtórce notatki wyszła luka, założę na nią pozycję tematyczną"
  (luka zostaje wskazówką przy notatce)
- „Pozycja wskazuje na nieistniejący plik, skasuję ją" (pytasz użytkownika)
- „Notatka świeża, użytkownik dopiero co ją pisał — zaliczę bez pytania"
  (diagnoza to nadal pytania)
```

- [ ] **Krok 5: Dopisz wiersze do tabeli „Częste błędy"**

```markdown
| Pytanie zadane zdaniem z notatki | Inne ujęcie — notatka to materiał, nie gotowy quiz |
| Reset notatki po pierwszej, diagnostycznej powtórce | Diagnoza bez kary: zostaje `3d` i wskazówka z lukami |
| Notatka urwana w połowie z braku budżetu | Notatka niepodzielna — odłóż w całości, data `następna` zostaje |
| Wskazówka doklejana do poprzednich | Wskazówka zastępowana; komplet poprawnych ją kasuje |
| Notatki traktowane jako dodatek do pozycji tematycznych | Budżet dzielony po połowie — to główny nurt nauki użytkownika |
```

- [ ] **Krok 6: Weryfikacja scenariuszowa**

Przeczytaj zapisany tekst i odpowiedz z niego (bez zgadywania) na pięć pytań. Każda odpowiedź musi wynikać wprost z zapisu:

1. Zaległe: 4 pozycje tematyczne i 5 notatek (po 2 pytania każda), tryb mieszany. Co wchodzi do sesji? → 4 pozycje tematyczne (przydział 6, zostaje 2 do przelania) + 3 notatki (limit notatek), razem 10 pytań.
2. Zostały 2 wolne pytania, następna zaległa notatka ma 3 wątki. Co robisz? → odkładasz ją w całości, `następna` bez zmian.
3. Notatka `(diagnoza)`, użytkownik nie odpowiedział poprawnie na żadne pytanie. Zapis? → interwał `3d`, `następna` = dziś + 3, wskazówka z lukami, znacznik `(diagnoza)` zdjęty.
4. Notatka na interwale 120d, komplet poprawnych. Zapis? → interwał `120d`, `następna` = dziś + 120, wskazówka skasowana.
5. Notatka na 30d, dwa pytania: jedno dobre, jedno złe. Zapis? → interwał `30d` bez zmian, `następna` = dziś + 30, wskazówka = co padło.

Rozbieżność między odpowiedzią a zapisem oznacza lukę w tekście — uzupełnij ją. **Bez commita.**

---

### Task 3: Ręczne dociąganie notatek do rotacji

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (nowa sekcja po „Powtórki z notatek" z Task 2)

**Interfaces:**
- Consumes: z Task 1 — nazwa sekcji stanu i format pozycji; z Task 2 — nazwa sekcji „Powtórki z notatek".
- Produces: sekcja „Dociąganie notatek do rotacji" — nic z niej nie korzysta, to punkt wejścia użytkownika.

- [ ] **Krok 1: Wstaw sekcję**

Bezpośrednio po sekcji „Powtórki z notatek", przed „Zapis postępu":

```markdown
## Dociąganie notatek do rotacji

Na prośbę „dodaj do powtórek <notatka|folder>" (dorobek sprzed wprowadzenia
powtórek albo obszar, który użytkownik chce świadomie odświeżyć):

1. **Wskazany folder:** zbierz notatki atomowe rekurencyjnie, pomijając
   notatki-huby (nazwa pliku = nazwa folderu), gałęzie `nauka/` spoza `tech/`
   (`biznes/`, `jezyki/`, `czytelnia/`) oraz notatki mające już pozycję
   w sekcji `## Powtórki z notatek`.
   **Wskazana pojedyncza notatka:** wchodzi zawsze, także spoza `nauka/tech/` —
   skoro użytkownik wskazuje ją palcem, to świadoma decyzja, nie przeoczenie.
   Pomijasz ją tylko wtedy, gdy ma już pozycję (powiedz o tym).
2. **Rozłóż daty startowe: maksymalnie 3 notatki na dzień**, zaczynając od
   dziś + 3 (kolejne trójki: dziś + 4, dziś + 5, …). Osiem notatek rozkłada się
   więc na 3 + 3 + 2 w trzech kolejnych dniach. Dwadzieścia notatek nie może
   spaść na użytkownika jednego poranka.
3. Wszystkie nowe pozycje dostają interwał `3d` i znacznik `(diagnoza)` —
   to wiedza jeszcze nigdy przy Tobie nie sprawdzana.
4. Pokaż listę (notatka → data startowa) do akceptacji i **dopiero po niej
   zapisz**. Nic nie zapisujesz przed zgodą użytkownika.
```

- [ ] **Krok 2: Weryfikacja obliczeniowa**

Sprawdź na zapisanym tekście: dociągnięcie 8 notatek 2026-08-15 daje daty `2026-08-18` (3 notatki), `2026-08-19` (3 notatki), `2026-08-20` (2 notatki), wszystkie z interwałem `3d` i znacznikiem `(diagnoza)`. Jeśli z tekstu wychodzi coś innego, popraw tekst. **Bez commita.**

---

### Task 4: Rejestracja notatek w rotacji w `tidy-journal`

**Files:**
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:46-94` (sekcja „Przebieg" — nowy punkt 9 i przenumerowanie)
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:96-98` (sekcja „Stan końcowy")
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:100-116` (sekcja „Czego nie robić")

**Interfaces:**
- Consumes: z Task 1 — nazwa sekcji `## Powtórki z notatek` i format pozycji `- [następna: RRRR-MM-DD, interwał: Nd] (diagnoza) [[<notatka>]] — <wskazówka>`; z Task 3 — reguła, że nowa pozycja startuje na `3d` ze znacznikiem `(diagnoza)`.
- Produces: pozycje w sekcji stanu, konsumowane przez tryb powtórek z Task 2.

- [ ] **Krok 1: Wstaw nowy punkt 9 w sekcji „Przebieg"**

Po obecnym punkcie 8 („Nauka z Claude"), przed obecnym punktem 9 („Pokaż plan i STOP"):

````markdown
9. **Powtórki z notatek.** Dla notatek wiedzowych z `nauka/tech/` objętych tym
   porządkowaniem przygotuj zmiany w sekcji `## Powtórki z notatek` pliku
   `nauka-z-claude.md` (sekcja na końcu pliku; utwórz ją, jeśli nie istnieje).
   Zakres: notatki atomowe w `nauka/tech/` (rekurencyjnie), **bez** notatek-hubów.
   Pozostałe gałęzie `nauka/` (`biznes/`, `jezyki/`, `czytelnia/`) oraz notatki
   spoza `nauka/` (`dom/`, `zdrowie/`, `praca/`) nie wchodzą do rotacji.
   - **nowa notatka** → nowa pozycja
     `- [następna: <dziś + 3>, interwał: 3d] (diagnoza) [[<notatka>]]`;
   - **notatka mająca już pozycję**, do której dopisujesz treść → interwał wraca
     na `3d`, `następna` = dziś + 3, wskazówka **zastąpiona** przez
     `nowy fragment: <co doszło>`, żeby pierwsze pytanie poszło ze świeżego
     materiału;
   - **notatka bez pozycji**, do której dopisujesz treść → nowa pozycja jak wyżej.

   Notatki wydestylowane z ukończonego tematu nauki (punkt 8) traktuj jak nowe
   notatki. Formatu `[następna: …, interwał: …]` nie zmieniaj — czyta go hook
   powtórek. Samych powtórek nie prowadzisz: to warsztat skilla `nauka-z-claude`,
   Ty wyłącznie rejestrujesz pozycje.
````

- [ ] **Krok 2: Przenumeruj kolejne punkty**

W sekcji „Przebieg": `9. Pokaż plan i STOP` → `10.`, `10. Wykonaj po akceptacji` → `11.`, `11. Raport` → `12.`

- [ ] **Krok 3: Popraw odwołania do przenumerowanych punktów**

Cztery wystąpienia, wszystkie w tekście punktów 3–5:

| Miejsce | Było | Ma być |
|---|---|---|
| punkt 3, o oznaczaniu sprostowań | `w planie (punkt 9)` | `w planie (punkt 10)` |
| punkt 4, o widoczności kondensacji | `widoczna w planie (punkt 9)` | `widoczna w planie (punkt 10)` |
| punkt 4, o archiwum | `trafi do `archiwum/` (punkt 10)` | `trafi do `archiwum/` (punkt 11)` |
| punkt 5, o kontekście zadania | `przy planie (punkt 9)` | `przy planie (punkt 10)` |

Odwołania do punktów 2, 3, 4, 6 i 8 (w tym wszystkie w sekcji „Czego nie robić") zostają bez zmian — te punkty nie zmieniły numerów.

- [ ] **Krok 4: Dopisz pozycje powtórek do planu (punkt 10) i raportu (punkt 12)**

W punkcie 10 („Pokaż plan i STOP"), w wyliczeniu pod tabelą, po `zmiany w nauka-z-claude.md (tematy do archiwizacji, kikuty powtórek)` dopisz:

```markdown
nowe i odświeżone pozycje w sekcji `## Powtórki z notatek` (notatka → data i interwał),
```

W punkcie 12 („Raport"), w wyliczeniu, po `co usunięte` dopisz:

```markdown
co doszło do rotacji powtórek i które pozycje wróciły na 3 dni,
```

- [ ] **Krok 5: Dopisz faktyczny zapis pozycji do punktu 11 („Wykonaj po akceptacji")**

Bez tego kroku pozycje pojawiłyby się w planie i raporcie, ale skill nie miałby instrukcji ich zapisania. W wyliczeniu punktu 11, po podpunkcie `Wykonaj zaakceptowane zmiany z punktu 8: przeniesienia sekcji do archiwum/nauka-z-claude.md…`, dopisz:

```markdown
- Zapisz zaakceptowane zmiany z punktu 9 w sekcji `## Powtórki z notatek`
  pliku `nauka-z-claude.md`: nowe pozycje dopisz na końcu sekcji, odświeżone
  zaktualizuj w miejscu (data, interwał, wskazówka). Sekcję utwórz na końcu
  pliku, jeśli jeszcze nie istnieje. Pozycji innych notatek nie ruszaj.
```

- [ ] **Krok 6: Uzupełnij „Stan końcowy"**

Do akapitu dopisz zdanie:

```markdown
Każda notatka wiedzowa z `nauka/tech/` utworzona albo dopisana w tym przebiegu
ma pozycję w sekcji `## Powtórki z notatek`.
```

- [ ] **Krok 7: Dopisz zakazy do „Czego nie robić"**

```markdown
- Nie rejestruj w powtórkach notatek-hubów ani notatek spoza `nauka/tech/` —
  `biznes/`, `jezyki/`, `czytelnia/`, `dom/`, `zdrowie/` i `praca/` są poza
  rotacją (patrz punkt 9).
- Nie prowadź powtórek samodzielnie — rejestrujesz pozycje, przepytuje skill
  `nauka-z-claude`.
- Nie zapisuj pozycji powtórek przed akceptacją planu — obowiązuje ta sama
  bramka co dla notatek.
```

- [ ] **Krok 8: Weryfikacja spójności numeracji**

Przejrzyj cały plik i potwierdź: (1) punkty biegną 1–12 bez luk i powtórzeń, (2) każde odwołanie „(punkt N)" wskazuje na punkt o właściwej treści — sprawdź wszystkie, czytając docelowy punkt, (3) nowy punkt 9 nie duplikuje reguł z punktu 8 (tamten dotyczy sekcji tematów, ten wyłącznie sekcji `## Powtórki z notatek`). **Bez commita.**

---

### Task 5: Dokumentacja — `CLAUDE.md` i `README.md`

**Files:**
- Modify: `D:\Notatki\notatki\.claude\CLAUDE.md` (sekcja „Struktura vaulta": akapit o `nauka-z-claude.md` oraz opis folderu `nauka/`)
- Modify: `D:\Notatki\notatki\README.md:14` (wiersz tabeli `tidy-journal`)
- Modify: `D:\Notatki\notatki\README.md:27` (opis `nauka-z-claude` w „Pliki w korzeniu")
- Modify: `D:\Notatki\notatki\README.md:33` (opis folderu `nauka/` — nieaktualny po dodaniu `tech/`)

**Interfaces:**
- Consumes: z Task 1 — nazwa sekcji stanu; z Task 2 — nazwy trybów; z Task 4 — rola `tidy-journal` jako rejestratora pozycji.

- [ ] **Krok 1: Uzupełnij `CLAUDE.md`**

W akapicie o `nauka-z-claude.md` (sekcja „Struktura vaulta"), na końcu, przed opisem `archiwum/`, dopisz:

```markdown
Na końcu pliku żyje sekcja `## Powtórki z notatek` — pozycje powtórek dla notatek
wiedzowych z `nauka/tech/` (bez hubów; pozostałe gałęzie `nauka/` są poza
rotacją), rejestrowane przez `tidy-journal` przy każdym utworzeniu lub dopisaniu
notatki i przepytywane przez `nauka-z-claude`. To drugie, niezależne źródło
powtórek obok pozycji tematycznych.
```

- [ ] **Krok 2: Zaktualizuj opis folderu `nauka/` w `CLAUDE.md`**

Obecny opis wymienia nieistniejące już ścieżki (`devops/`, `chmura/`, `agenci-ai/` leżą teraz pod `tech/`). Zastąp go:

```markdown
- `nauka/` — nauka i rozwój: `tech/` (wiedza techniczna: `agenci-ai/`, `chmura/` m.in. `google-cloud/`, `devops/`, `linux/`, `programowanie/` — tylko ta gałąź podlega powtórkom z notatek), `biznes/`, `jezyki/`, `czytelnia/`.
```

- [ ] **Krok 3: Popraw przykłady ścieżek w `CLAUDE.md`**

Dwa przykłady wskazują ścieżki sprzed wydzielenia `tech/`:

| Miejsce | Było | Ma być |
|---|---|---|
| „Konwencje Obsidiana", przykład kebab-case | `` `nauka/agenci-ai/` `` | `` `nauka/tech/agenci-ai/` `` |
| „Notatki wiedzowe", przykład huba | `` (np. `nauka/devops/devops.md`) `` | `` (np. `nauka/tech/devops/devops.md`) `` |

- [ ] **Krok 4: Uzupełnij wiersz `tidy-journal` w tabeli README**

Na końcu komórki „Co robi", po zdaniu o obsłudze `[[nauka-z-claude]]`, przed zdaniem `Zapisuje dopiero po akceptacji planu…`, wstaw:

```markdown
Każdą utworzoną lub dopisaną notatkę z `nauka/tech/` rejestruje w sekcji `## Powtórki z notatek` pliku [[nauka-z-claude]], skąd trafia do powtórek interwałowych.
```

- [ ] **Krok 5: Uzupełnij opis `nauka-z-claude` w „Pliki w korzeniu"**

Zastąp istniejący punkt:

```markdown
- [[nauka-z-claude]] — żywy plik postępu nauki prowadzonej skillem `nauka-z-claude` (sekcja na temat: roadmapa, powtórki interwałowe, notatki). Ukończone tematy destyluje do bazy wiedzy i archiwizuje skill `tidy-journal`. Na końcu pliku sekcja `## Powtórki z notatek` — powtórki z notatek wiedzowych `nauka/tech/`, rejestrowane przez `tidy-journal` i przepytywane przez `nauka-z-claude` (tryby: mieszany, tylko z notatek, tylko tematyczny).
```

- [ ] **Krok 6: Zaktualizuj opis folderu `nauka/` w README**

Zastąp istniejący punkt (wymienia ścieżki sprzed wydzielenia `tech/`):

```markdown
- `nauka/` — nauka i rozwój: `tech/` (wiedza techniczna: `agenci-ai/`, `chmura/` m.in. `google-cloud/`, `devops/`, `linux/`, `programowanie/` z `backend/`, `frontend/`, `mobile/`), `biznes/`, `jezyki/`, `czytelnia/`. Powtórkom z notatek podlega wyłącznie `tech/`.
```

- [ ] **Krok 7: Weryfikacja**

Sprawdź: (1) opisy w README i `CLAUDE.md` nie są ze sobą sprzeczne co do zakresu rotacji (`nauka/tech/`), (2) żaden z nich nie powtarza szczegółowych reguł rejestracji — te żyją w skillach, dokumentacja ma tylko wskazywać kierunek, (3) tabela skilli w README nadal renderuje się poprawnie (wstawiona komórka nie zawiera znaku `|`), (4) wymienione podfoldery `nauka/` zgadzają się z tym, co faktycznie leży na dysku. **Bez commita** — po tym zadaniu wszystkie zmiany leżą w drzewie roboczym do Twojego przeglądu.

---

### Task 6: Migracja tagów w `nauka/tech/` na hierarchię z `tech`

**Kontekst:** wydzielenie `nauka/tech/` przesunęło pliki, ale frontmattery zostały ze starymi tagami (`tags: [nauka/chmura]`), więc hierarchia tagów w Obsidianie przestała odpowiadać drzewu folderów. Decyzja użytkownika: tagi idą za folderami.

**Files:**
- Modify: 105 notatek w `D:\Notatki\notatki\nauka\tech\**\*.md` (frontmatter `tags:`)

**Interfaces:**
- Produces: konwencja tagów `#nauka/tech/<gałąź>` — Task 7 zapisuje ją w `tidy-journal` jako regułę mapowania tag → folder.

**Stan wyjściowy** (zmierzony 2026-08-15, `grep -rh "^tags:" nauka/tech/ | sort | uniq -c`):

| Tag | Liczba plików |
|---|---|
| `tags: [nauka/programowanie]` | 69 |
| `tags: [nauka/chmura]` | 25 |
| `tags: [nauka/linux]` | 6 |
| `tags: [nauka/devops]` | 2 |
| `tags: [nauka/agenci-ai]` | 2 |
| `tags:` (puste — `nauka/tech/chmura/google-cloud/google-cloud.md`) | 1 |

- [ ] **Krok 1: Zapisz stan przed migracją**

```bash
cd /d/Notatki/notatki && grep -rh "^tags:" nauka/tech/ | sort | uniq -c
```

Wynik musi zgadzać się z tabelą powyżej. Rozbieżność oznacza, że drzewo zmieniło się od czasu pisania planu — przelicz i dostosuj oczekiwania kolejnych kroków, zamiast migrować w ciemno.

- [ ] **Krok 2: Podmień tagi w pięciu gałęziach**

```bash
cd /d/Notatki/notatki
for t in programowanie chmura linux devops agenci-ai; do
  grep -rl "^tags: \[nauka/$t\]$" nauka/tech/ | while read -r f; do
    sed -i "s|^tags: \[nauka/$t\]$|tags: [nauka/tech/$t]|" "$f"
  done
done
```

- [ ] **Krok 3: Uzupełnij pusty tag w hubie `google-cloud`**

`nauka/tech/chmura/google-cloud/google-cloud.md` ma gołe `tags:` bez wartości. Ustaw w jego frontmatterze:

```yaml
tags: [nauka/tech/chmura]
```

- [ ] **Krok 4: Weryfikacja migracji**

```bash
cd /d/Notatki/notatki && grep -rh "^tags:" nauka/tech/ | sort | uniq -c
```

Oczekiwane dokładnie: `69 tags: [nauka/tech/programowanie]`, `26 tags: [nauka/tech/chmura]` (25 + uzupełniony hub), `6 tags: [nauka/tech/linux]`, `2 tags: [nauka/tech/devops]`, `2 tags: [nauka/tech/agenci-ai]`. Zero wystąpień bez `tech` i zero pustych `tags:`.

- [ ] **Krok 5: Sprawdź, że nie ruszyłeś gałęzi spoza `tech/`**

```bash
cd /d/Notatki/notatki && grep -rh "^tags:" nauka/biznes nauka/jezyki nauka/czytelnia | sort | uniq -c
```

Oczekiwane bez zmian: `1 tags: [nauka/biznes]`, `2 tags: [nauka/jezyki]`, `3 tags: [nauka/czytelnia]`. **Bez commita.**

---

### Task 7: Naprawa `tidy-journal` po wydzieleniu `tech/`

**Kontekst:** skill mapuje tag na folder regułą `#nauka/devops → nauka/devops/`, a taki folder już nie istnieje. Przy najbliższym porządkowaniu dziennika skill odtworzyłby starą strukturę obok `tech/` albo utknął na pytaniu o nowy folder.

**Files:**
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:18` (przykład frontmattera)
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:34` (przykład huba)
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:38` (przykład frontmattera huba)
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md:51` (reguła mapowania tag → folder w punkcie 2)

**Interfaces:**
- Consumes: z Task 6 — konwencja `#nauka/tech/<gałąź>`.

- [ ] **Krok 1: Popraw trzy przykłady ścieżek i tagów**

| Linia | Było | Ma być |
|---|---|---|
| 18 (przykład frontmattera notatki) | `tags: [nauka/devops]` | `tags: [nauka/tech/devops]` |
| 34 (zdanie o hubach) | `` (np. `nauka/devops/`) … (np. `nauka/devops/devops.md`) `` | `` (np. `nauka/tech/devops/`) … (np. `nauka/tech/devops/devops.md`) `` |
| 38 (przykład frontmattera huba) | `tags: [nauka/devops]` | `tags: [nauka/tech/devops]` |

- [ ] **Krok 2: Popraw regułę mapowania tag → folder (punkt 2)**

Zastąp:

```markdown
   - Tag ma pierwszeństwo: `#dom` → `dom/`, `#praca` → `praca/projekty/<projekt>/`, `#nauka/devops` → `nauka/devops/` itd.
```

na:

```markdown
   - Tag ma pierwszeństwo: `#dom` → `dom/`, `#praca` → `praca/projekty/<projekt>/`, `#nauka/tech/devops` → `nauka/tech/devops/` itd. Wiedza techniczna mieszka w `nauka/tech/<gałąź>/` (`agenci-ai`, `chmura`, `devops`, `linux`, `programowanie`); `nauka/biznes/`, `nauka/jezyki/` i `nauka/czytelnia/` leżą poza `tech/`. Tag zapisany po staremu, bez członu `tech` (np. `#nauka/chmura`), traktuj jako wskazanie odpowiedniej gałęzi w `nauka/tech/` — w dzienniku mogą jeszcze wisieć stare zapisy.
```

- [ ] **Krok 3: Weryfikacja**

```bash
cd /d/Notatki/notatki && grep -n "nauka/devops\|nauka/chmura\|nauka/agenci-ai\|nauka/linux\|nauka/programowanie" .claude/skills/tidy-journal/SKILL.md
```

Każde trafienie musi zawierać człon `tech` — z jedynym wyjątkiem zdania o tolerancji starych tagów z kroku 2. **Bez commita.**

---

### Task 8: Naprawa `compile-notes` i migracja manifestu eksportu

**Kontekst:** slug pliku manifestu i plików wyjściowych powstaje ze ścieżki folderu (`slugify(relPath)` w `compile.js`). Manifest wskazuje `nauka/chmura/google-cloud`, więc uruchomienie skilla na nowej ścieżce założyłoby **drugi** manifest i zaczęło wersjonowanie od `v1` — zamiast delty `v4` powstałaby pełna kompilacja wszystkich notatek, a `v1`–`v3` osierociałyby się.

**Files:**
- Modify: `D:\Notatki\notatki\.claude\skills\compile-notes\SKILL.md:22` (przykład wywołania)
- Rename: `D:\Notatki\notatki\eksport\nauka-chmura-google-cloud-notebooklm.manifest.json` → `nauka-tech-chmura-google-cloud-notebooklm.manifest.json`
- Rename: `D:\Notatki\notatki\eksport\nauka-chmura-google-cloud-notebooklm-v1.md` (oraz `-v2.md`, `-v3.md`) → `nauka-tech-chmura-google-cloud-notebooklm-v<N>.md`
- Modify: zawartość manifestu (pole `folder` i wszystkie klucze `notatki`)

- [ ] **Krok 1: Popraw przykład w `SKILL.md`**

| Było | Ma być |
|---|---|
| ``Przykład: `node .claude/skills/compile-notes/compile.js nauka/chmura/google-cloud` `` | ``Przykład: `node .claude/skills/compile-notes/compile.js nauka/tech/chmura/google-cloud` `` |

- [ ] **Krok 2: Przemianuj pliki eksportu**

```bash
cd /d/Notatki/notatki/eksport
for f in nauka-chmura-google-cloud-notebooklm*; do
  mv "$f" "nauka-tech-${f#nauka-}"
done
ls
```

Oczekiwane cztery pliki: `nauka-tech-chmura-google-cloud-notebooklm-v1.md`, `-v2.md`, `-v3.md`, `nauka-tech-chmura-google-cloud-notebooklm.manifest.json`.

- [ ] **Krok 3: Podmień ścieżki wewnątrz manifestu**

```bash
cd /d/Notatki/notatki/eksport
sed -i 's|nauka/chmura/google-cloud|nauka/tech/chmura/google-cloud|g' nauka-tech-chmura-google-cloud-notebooklm.manifest.json
```

Hashe zostają nietknięte — dzięki temu następny bieg policzy prawdziwą deltę, a nie pełną kompilację.

- [ ] **Krok 4: Weryfikacja bez skutków ubocznych**

Nie uruchamiaj `compile.js` (założyłby plik `v4`). Sprawdź, że każdy klucz manifestu wskazuje na istniejący plik:

```bash
cd /d/Notatki/notatki
node -e "const m=require('./eksport/nauka-tech-chmura-google-cloud-notebooklm.manifest.json'),fs=require('fs');const b=Object.keys(m.notatki).filter(p=>!fs.existsSync(p));console.log('folder:',m.folder,'| wersja:',m.wersja,'| notatek:',Object.keys(m.notatki).length,'| brakujących:',b.length);b.forEach(p=>console.log('BRAK',p))"
```

Oczekiwane: `folder: nauka/tech/chmura/google-cloud`, `wersja: 3`, `brakujących: 0`. Każdy `BRAK` oznacza notatkę przemianowaną lub przeniesioną poza `google-cloud/` — zgłoś ją użytkownikowi, nie zgaduj nowej ścieżki. **Bez commita.**

---

## Kolejność i zależności

Task 1 → Task 2 → Task 3 (jeden plik, narastające sekcje; kolejność wymuszona).
Task 4 zależy od Task 1 (format pozycji), ale nie od 2 i 3 — może iść po Task 1.
Task 6 (migracja tagów) → Task 7 (reguła mapowania w `tidy-journal`) — kolejność wymuszona, bo skill ma opisywać stan faktyczny.
Task 7 dotyka tego samego pliku co Task 4, ale innych linii; wykonuj je po kolei, nie równolegle.
Task 8 niezależny od wszystkich pozostałych.
Task 5 na końcu, gdy nazwy sekcji, trybów i struktura folderów są już ustalone.

Zadania 6–8 to naprawa skutków wydzielenia `nauka/tech/`, nie część funkcji powtórek — można je wykonać osobno i wcześniej, jeśli chcesz najpierw uspokoić vault.

## Czego ten plan nie robi

- Nie zmienia hooka `powtorki-check.ps1` ani drabinki pozycji tematycznych.
- Nie uruchamia `compile.js` — migracja manifestu jest weryfikowana bez generowania nowej wersji eksportu (Task 8).
- Nie migruje tagów poza `nauka/tech/` ani tagów wpisanych w notatkach dziennych czekających na przetworzenie — te rozstrzyga `tidy-journal` regułą tolerancji z Task 7.
- Nie zakłada sekcji `## Powtórki z notatek` w `nauka-z-claude.md` — powstanie przy pierwszym uruchomieniu `tidy-journal` albo ręcznym dociągnięciu.
- Nie rejestruje wstecznie istniejących notatek z `nauka/tech/` — to świadoma decyzja użytkownika, wykonywana komendą z Task 3.
- Nie commituje żadnej zmiany.
