---
name: knowledge-base-update
description: Aktualizuje knowledge-base/ — porównuje stan tego repo i repozytoriów zewnętrznych z dokumentacją, aktualizuje dokumenty tematyczne, dopisuje datowane wpisy o decyzjach i indeksuje je w bazie wektorowej. Wyłącznie na jawne wywołanie Rafała.
disable-model-invocation: true
---

# /knowledge-base-update — aktualizacja bazy wiedzy

Tryby wywołania:

- `/knowledge-base-update` — krok 1, potem krok 2,
- `/knowledge-base-update repo` — tylko krok 1 (to repo),
- `/knowledge-base-update <slug>` — tylko jeden projekt zewnętrzny.

Slugi projektów: `saas-app`, `codebusters-v2`, `codebusters-mobile`,
`devstock-team-agent`, `company-agent-chat`.

## Zasady nadrzędne

- **Nie commitujesz.** Zmiany zostają w drzewie roboczym; commit robi Rafał.
  Powiedz to wprost w podsumowaniu.
- **Dwie bramki na krok: zakres, potem treść.** Przed zgodą Rafała nic nie
  ląduje na dysku — żadnego pliku, żadnej edycji, żadnego `upsert`.
- **Bramki są per krok.** Krok 1 domyka się w całości (zakres → treść →
  zapis → indeks), dopiero potem rusza krok 2.
- **Skanowanie zlecasz subagentowi `kb-scan`** (`Agent`,
  `subagent_type: "kb-scan"`). Ty dokładasz warstwę, której on nie widzi:
  decyzje i wnioski z tej rozmowy.
- **Nie kasujesz** plików ani wektorów. Wyłącznie tworzysz i aktualizujesz.
- **Nie klonujesz** repozytoriów i nie zmieniasz stanu repo zewnętrznych.
- **Nie tworzysz nowych kategorii** `kb-client`. Dostępne: `dev`,
  `marketing`, `product`, `sales`, `company`, `other`, `interns`.
- **Przy niejasności pytasz Rafała** — jedno pytanie na wiadomość. Nie
  zgadujesz obszaru, kategorii ani intencji zmiany.

## Granice wobec innych skilli

- **`podsumuj-sesja-claude`** pisze brief „gdzie skończyłem" — stan pracy
  w toku, dla Rafała na jutro, żywotność kilka dni. Ty piszesz wiedzę firmy:
  rzeczy zamknięte i uzasadnione, żywotność miesiące, czytane też przez
  agentów RAG. Nie wołasz go i nie duplikujesz jego treści.
- **`/spotkanie`** zapisuje ustalenia i decyzje do `planning/*-notatka.md`.
  Dlatego pomijasz `planning/` (patrz `## Mapa obszarów`).
- **`/baza-wiedzy`** jest narzędziem do operacji ręcznych na wektorach
  (`ask`, `list`, `delete`, `export`). Ty używasz tego samego CLI, ale
  wykonujesz **wyłącznie `upsert`** — nigdy `delete`, nigdy `--yes`.

## Plik stanu

`knowledge-base/.kb-update-state.json` — znacznik „dokąd doszliśmy" per
źródło. Brak pliku → pierwsze uruchomienie (patrz `## Przypadki brzegowe`).

```json
{
  "version": 1,
  "sources": {
    "baza-wiedzy": {
      "lastCommit": "dfb8619",
      "updatedAt": "2026-08-14T12:00:00Z",
      "documentedDirty": {
        "kursy/agenty-ai/lekcja-3.md": {
          "hash": "a94a8fe5ccb1",
          "entry": "knowledge-base/product/dziennik/2026-08-14-lekcja-3-domknieta.md"
        }
      }
    },
    "saas-app": { "lastCommit": "a1b2c3d", "updatedAt": "2026-08-14T12:00:00Z" }
  }
}
```

SHA i `hash` są w przykładzie skrócone dla czytelności. Zapisujesz **pełne**
wartości zwrócone przez `git rev-parse HEAD` i `git hash-object`.

Klucze `sources`: `baza-wiedzy` dla tego repo plus slugi projektów.

**`lastCommit`** — ostatni przetworzony commit. Dla tego repo bieżący stan
odczytujesz przez `git rev-parse HEAD`, dla projektów zewnętrznych przez
`git rev-parse origin/main`.

**`documentedDirty`** (tylko `baza-wiedzy`) — mapa `ścieżka źródłowa →
{ hash, entry }` dla pracy udokumentowanej, gdy była jeszcze
niezacommitowana. Bez tego pola ta sama niezacommitowana praca wracałaby
jako propozycja przy każdym uruchomieniu aż do commita Rafała.

- `hash` — skrót zmiany. Liczysz go **inaczej dla plików śledzonych
  i nieśledzonych**; o klasyfikacji decyduje
  `git status --porcelain -- <ścieżka>`:
  - śledzony (`M`, `A`) → `git diff HEAD -- <ścieżka> | git hash-object --stdin`
    (wariant z `HEAD` łapie też zmiany zastage'owane),
  - nieśledzony (`??`) → `git hash-object <ścieżka>`.

  Rozdzielenie jest konieczne, nie kosmetyczne: dla pliku nieśledzonego
  `git diff` nie zwraca nic, więc `git hash-object --stdin` policzyłby skrót
  pustego bloba (`e69de29b…`) — identyczny dla każdej takiej ścieżki. Stan
  „skrót inny" byłby wtedy nieosiągalny, a nieśledzone pliki to typowa postać
  świeżej pracy, którą ten skill ma dokumentować.
- `entry` — ścieżka wpisu albo dokumentu, który tę pracę udokumentował,
  względem korzenia repo. Bez tego pola nie dałoby się wskazać Rafałowi,
  który wpis wymaga aktualizacji, gdy plik zmieni się po udokumentowaniu.
  Jedna ścieżka źródłowa udokumentowana kilkoma plikami → wpisz ten, który
  opisuje ją najpełniej.

Trzy stany przy kolejnym uruchomieniu:

| stan | znaczenie | co robisz |
|---|---|---|
| skrót zgodny | praca udokumentowana, plik bez zmian | pomiń ścieżkę |
| skrót inny | plik zmieniony po udokumentowaniu | zaproponuj aktualizację wpisu wskazanego w `entry`; pokaż tę ścieżkę Rafałowi w bramce zakresu. `entry` z pliku stanu ma **pierwszeństwo** nad polem `cel` znaleziska dla tej samej ścieżki — inaczej ta sama praca dostałaby drugi datowany wpis |
| ścieżka czysta | Rafał zacommitował | usuń wpis z `documentedDirty` |

**Kiedy zapisujesz znacznik:** dopiero po udanym zapisie plików danego
źródła. Źródło pominięte albo przerwane błędem odczytu (brak klonu, nieudany
`fetch`) znacznika **nie przesuwa**. Odrzucenie wszystkiego przez Rafała
w bramce zakresu też **nie przesuwa** znacznika.

**Indeksowanie wektorowe nie wpływa na znacznik** — pliki są już na dysku,
a nieudany `upsert` ponawia się osobno komendą `kb-client`.

## Mapa obszarów

Krok 1 — ścieżka zmiany w tym repo → miejsce w bazie wiedzy:

| zmiana w | obszar | kategoria `kb-client` |
|---|---|---|
| `kursy/` | `knowledge-base/product/` | `product` |
| `live-events/` | `knowledge-base/marketing/` | `marketing` |
| `tools/` | `knowledge-base/dev/` | `dev` |
| `.claude/skills/`, `.claude/agents/`, `docs/superpowers/` | `knowledge-base/dev/baza-wiedzy-repo/` | `dev` |
| `planning/` | **pomijasz** — obsługuje `/spotkanie` | — |
| `knowledge-base/` | **pomijasz** — to cel, nie źródło | — |
| cokolwiek innego | **pytasz Rafała** | — |

`knowledge-base/dev/baza-wiedzy-repo/` może jeszcze nie istnieć — utwórz
katalog przy pierwszym wpisie do niego.

Krok 2 — obszar docelowy odczytujesz z **trzeciej kolumny rejestru
w `CLAUDE.md`** (kolumna „wiedza w tym repo"); nigdy nie składasz go ze
sluga. `devstock-team-agent` i `company-agent-chat` leżą pod
`knowledge-base/dev/system-wieloagentowy/`, więc ścieżka złożona ze sluga
wskazywałaby nieistniejący katalog. Kategoria nadal zawsze `dev`.

Datowane wpisy trafiają do `<obszar>/dziennik/`, np.
`knowledge-base/product/dziennik/` albo
`knowledge-base/dev/saas-app/dziennik/`.

**Wyjątek `planning/`:** przeniesienie trwałej decyzji z notatki spotkania
do bazy wiedzy robisz wyłącznie wtedy, gdy Rafał wskaże to wprost w tym
wywołaniu. Z własnej inicjatywy nie tykasz `planning/`.

## Krok 1 — to repo

### 1.1 Ustal zakres

1. Wczytaj `knowledge-base/.kb-update-state.json`, weź `sources["baza-wiedzy"]`.
   Brak pliku albo brak tego źródła → pierwsze uruchomienie; zakres ustalasz
   według `## Przypadki brzegowe` (domyślnie 30 dni, uzgodnione z Rafałem).
2. Sprawdź osiągalność znacznika:
   `git merge-base --is-ancestor <lastCommit> HEAD`.
   Kod wyjścia ≠ 0 → historia przepisana (force push, rebase); przejdź na
   zakres po dacie `updatedAt` — zamieniony na parę SHA jak niżej — i
   **powiedz o tym Rafałowi**.
3. Zakres commitów: `<lastCommit>..HEAD`. Drzewo robocze uwzględniasz zawsze
   — Rafał commituje sam, więc świeża praca zwykle jeszcze w nim siedzi.
4. Odfiltruj ścieżki, których skrót zgadza się z `documentedDirty` (patrz
   `## Plik stanu`). **Filtrujesz listę znalezisk PO skanie, nie przed nim** —
   subagent sam enumeruje drzewo robocze i nie ma pola na wykluczenia.

**`zakres` przekazywany subagentowi zawsze jest parą SHA.** Datę zamieniasz
na SHA tutaj, przed wywołaniem: `git diff --stat --since=<data>` nie jest
błędem — git po cichu ignoruje `--since`, zwraca diff drzewa roboczego i kod
wyjścia 0, więc subagent nie ma jak wykryć, że commitów z okna nie
przeczytał.

    git log --since=<data> --format=%H | tail -1

Wynik to najstarszy commit w oknie; jako `zakres` podajesz `<sha>^..HEAD`.

- Ten commit nie ma rodzica (korzeń historii — `git rev-parse <sha>^` kończy
  się błędem) → podaj `<sha>..HEAD` i powiedz Rafałowi, że najstarszy commit
  okna zostaje poza zakresem.
- `git log` nic nie zwraca → w oknie nie ma commitów; skanujesz wyłącznie
  drzewo robocze i mówisz o tym wprost.

### 1.2 Zleć skan

Wywołaj `Agent` z `subagent_type: "kb-scan"`, podając wszystkie sześć pól:

```
repozytorium: <korzeń tego repo>
zakres: <lastCommit>..HEAD
drzewo robocze: tak
korzeń bazy wiedzy: <korzeń tego repo>
mapa:
- kursy/ -> knowledge-base/product/
- live-events/ -> knowledge-base/marketing/
- tools/ -> knowledge-base/dev/
- .claude/skills/, .claude/agents/, docs/superpowers/ -> knowledge-base/dev/baza-wiedzy-repo/
kontekst: <jedno zdanie o tym, czego szukamy w tym przebiegu>
```

Przy pierwszym uruchomieniu (albo po przepisanej historii) w polu `zakres`
trafia para SHA wyliczona z daty według 1.1 — nigdy sama data.

Ścieżki `planning/` i `knowledge-base/` świadomie pomijasz w mapie —
subagent ma je zignorować.

### 1.3 Dołóż warstwę z rozmowy

Przejrzyj **tę** rozmowę i dopisz do listy znalezisk to, czego w diffie nie
widać:

- decyzje i ich uzasadnienia („zostajemy na `eleven_multilingual_v2`, bo v3
  nie ma stitchingu"),
- wnioski operacyjne z debugowania („webhook zwraca puste 200 po
  bezczynności — najpierw rozgrzać `stats`"),
- warianty odrzucone i powód odrzucenia.

Nadaj im ten sam format co znaleziskom subagenta, z `dowód: sesja Claude`.

**Brak zmian w git nie kończy kroku.** Sesja czysto koncepcyjna, po której
zapadła decyzja, to poprawny przypadek użycia — wtedy wszystkie propozycje
pochodzą z tej sekcji.

### 1.4 BRAMKA ZAKRESU

Pokaż Rafałowi trzy listy:

1. **Zaktualizuję** — dokument, miejsce w nim, na czym polega rozbieżność.
   Tu trafiają też **nowe dokumenty tematyczne** (`rodzaj: stan` +
   `cel: NOWY WPIS`): podajesz proponowaną ścieżkę `<obszar>/<temat>.md`
   i zaznaczasz, że dokument jeszcze nie istnieje (patrz 1.5).
2. **Dopiszę jako nowy wpis** — proponowany tytuł, obszar, rodzaj.
3. **Nie ruszam** — co i dlaczego (już udokumentowane przez
   `documentedDirty`, `planning/`).

Znaleziska `pewność: niska` oraz znaleziska ze ścieżką spoza mapy obszarów
**nie trafiają na listę „Nie ruszam"** — idą wyłącznie do osobnej grupy
wymagających decyzji. Na liście „Nie ruszam" Rafał nie zobaczyłby, że
czekano na jego rozstrzygnięcie, i po cichu straciłby znalezisko.

Rafał skreśla i dopisuje. **Czekasz na jego odpowiedź** — brak odpowiedzi
to nie zgoda. Odrzucenie wszystkiego → kończysz **ten krok** bez zapisu
i bez przesuwania znacznika; przy pełnym przebiegu krok 2 rusza normalnie,
bo bramki są per krok.

### 1.5 BRAMKA TREŚCI

Przygotuj **wszystkie** drafty naraz i pokaż je w jednej wiadomości:

- dla dokumentów tematycznych — konkretny diff (fragment przed / po),
- dla nowych wpisów — pełna treść z `szablony/wpis.md`, z wypełnionymi
  polami i bez komentarzy `<!-- -->`,
- dla indeksu — dodawany wiersz `dziennik/README.md`, a przy zakładaniu
  nowego dziennika cała treść pliku z `szablony/indeks.md`. Indeks też jest
  zapisem na dysk, więc też wymaga zgody.

Wartość `**Rodzaj:**` we wpisie wyprowadzasz z pola `rodzaj` znaleziska —
słowniki nie są identyczne:

| `rodzaj` znaleziska | `**Rodzaj:**` we wpisie |
|---|---|
| `stan` | brak — to aktualizacja dokumentu tematycznego, nie wpis |
| `decyzja` | `decyzja` |
| `wniosek` | `wniosek operacyjny` |
| — | `zamknięta praca` powstaje **wyłącznie z warstwy rozmowy** (1.3); subagent tej wartości nie emituje, bo z gita nie wynika, czy praca jest domknięta |

**Nowy dokument tematyczny** — para `rodzaj: stan` + `cel: NOWY WPIS` jest
legalna: opisywany stan istnieje, dokument jeszcze nie. Taki dokument trafia
do `<obszar>/<temat>.md`, **nie** do `dziennik/` — to opis stanu, a nie
datowany wpis. Nazwa pliku w kebab-case z tematu, bez polskich znaków.
Szablonu dla nowych dokumentów tematycznych nie ma (istniejące opracowania
w `knowledge-base/` nie trzymają wspólnej struktury) — układ dopasowujesz do
sąsiednich dokumentów w tym samym obszarze. Na bramce treści pokazujesz
**pełną treść** zamiast diffa „przed / po", bo „przed" nie istnieje. Kolizja
nazwy z istniejącym plikiem oznacza, że to jednak aktualizacja tego
dokumentu, nie nowy dokument.

Placeholdery szablonów wypełniasz tak:

| placeholder | wartość |
|---|---|
| `{{TYTUŁ}}` | sedno decyzji, nie temat |
| `{{RRRR-MM-DD}}` | data uruchomienia skilla |
| `{{OBSZAR}}` | dokładnie w formie z pola `obszar` znaleziska — `product` albo `dev / saas-app` |
| `{{RODZAJ}}` | z tabeli wyżej |
| `{{ŹRÓDŁO}}` | pole `dowód` ze znaleziska |
| `{{PLIK}}` (w `szablony/indeks.md`) | sama nazwa pliku wpisu, bez katalogu — link jest względny wewnątrz `dziennik/` |

W zapisanym pliku nie zostaje ani jedno `{{`, ani jeden komentarz `<!-- -->`.

Zasady edycji dokumentów tematycznych:

- **Edycja punktowa** — zmieniasz akapit, który się rozjechał, i nic poza
  nim. Żadnego przepisywania dokumentu od nowa.
- **Bez cichego kasowania** — usunięcie sekcji musi być osobną pozycją
  pokazaną już w bramce zakresu.
- **Styl dokumentu zostaje** — nagłówki, konwencja tabel, język.
- **Konflikt zamiast zgadywania** — gdy dokument i kod mówią co innego,
  a z diffa nie wynika, która wersja jest zamierzona, zapytaj Rafała.

Czekasz na „tak". Dopiero potem cokolwiek zapisujesz.

### 1.6 Zapis, indeks, znacznik

1. **Pliki.** Zapisz zaktualizowane dokumenty, nowe dokumenty tematyczne
   (`<obszar>/<temat>.md` — kebab-case, bez polskich znaków, poza
   `dziennik/`) i nowe wpisy
   (`<obszar>/dziennik/YYYY-MM-DD-<slug>.md`). Slug z tytułu: małe litery,
   bez polskich znaków, myślniki zamiast spacji. Kolizja tego samego dnia →
   sufiks `-2`, `-3`.
2. **Indeks.** Brak `<obszar>/dziennik/README.md` → utwórz go
   z `szablony/indeks.md`. Istnieje → dodaj wiersz **na górze** tabeli.
3. **Indeksowanie wektorowe.** Dla każdego zapisanego pliku, z katalogu
   `tools/kb-client`:

       npm run kb -- upsert --category <kategoria> --file "<ścieżka bezwzględna>"

   Kategoria z `## Mapa obszarów`. `entry_id` liczy CLI ze ścieżki — nie
   podawaj go ręcznie.
4. **Znacznik.** Zakładając plik od zera, zapisz `version: 1`. Zapisz
   `lastCommit` = `git rev-parse HEAD` (pełny SHA) i `updatedAt` = bieżący
   czas UTC w ISO 8601.

   Do `documentedDirty` wpisujesz **każdą brudną ścieżkę źródłową objętą
   zapisanym dokumentem** — nie tylko te, które subagent wymienił w polu
   `dowód`. `dowód` cytuje pliki, na których oparł konkretne znalezisko;
   zapisany dokument opisuje zwykle szerszy kawałek pracy. Ścieżka pominięta
   tutaj wraca do skanu przy każdym kolejnym uruchomieniu — aż do commita
   Rafała — i za każdym razem kosztuje pełne porównanie z dokumentacją.

   Praktycznie: po zapisaniu dokumentów przejrzyj `git status --porcelain`,
   odrzuć `knowledge-base/` i `planning/`, a dla każdej pozostałej brudnej
   ścieżki zadaj pytanie „czy któryś z zapisanych dokumentów ją opisuje?".
   Jeśli tak — wpisz ją, wskazując w `entry` ten dokument. Jeśli nie —
   zostaw poza mapą, wróci w kolejnym przebiegu jako praca do opisania.

   Dla każdej wpisanej ścieżki zapisz obiekt: `entry` = ścieżka
   zapisanego wpisu lub dokumentu, który tę pracę opisał, oraz `hash`
   liczony zależnie od tego, co mówi `git status --porcelain -- <ścieżka>`:
   - śledzony (`M`, `A`) → `git diff HEAD -- <ścieżka> | git hash-object --stdin`,
   - nieśledzony (`??`) → `git hash-object <ścieżka>`.

   Wariantu dla nieśledzonych nie „upraszczaj" z powrotem do
   `git diff -- <ścieżka> | git hash-object --stdin`: dla pliku spoza indeksu
   `git diff` nie zwraca nic, więc skrót wyszedłby jako pusty blob i stan
   „skrót inny" nigdy by nie zaszedł.

   Ścieżki, które w tym przebiegu okazały się czyste, usuń z mapy.

## Krok 2 — repozytoria zewnętrzne

### 2.1 Ustal cele

Rejestr projektów jest w `CLAUDE.md` (tabela „Rejestr repo zewnętrznych"),
ścieżki lokalne w `CLAUDE.local.md` (plik niecommitowany, per użytkownik).

Razem ze ścieżką lokalną odczytujesz z rejestru **obszar docelowy** — trzecia
kolumna „wiedza w tym repo". To ona wyznacza katalog w `knowledge-base/`,
nie slug projektu.

**Oba pliki odczytujesz świeżo** narzędziem `Read` w momencie uruchomienia.
Nie polegaj na kopii wciągniętej do kontekstu przy starcie sesji przez
import `@CLAUDE.local.md` — Rafał mógł w międzyczasie dopisać projekt,
poprawić ścieżkę po przeniesieniu katalogu albo wyciąć wiersz.

Dla każdego projektu:

- brak wiersza w `CLAUDE.local.md` → **pomiń i powiedz wprost**,
- ścieżka jest, ale katalogu nie ma na dysku → **pomiń i powiedz wprost**,
- **nigdy nie klonuj** repozytorium.

Wywołanie z konkretnym slugiem zawęża listę do jednego projektu.

### 2.2 Pobierz stan

Dla każdego projektu:

    git -C "<ścieżka>" fetch origin
    git -C "<ścieżka>" log --oneline <lastCommit>..origin/main

Czytasz wyłącznie `origin/main`. Drzewo robocze i bieżąca gałąź Rafała
pozostają nietknięte — żadnego `checkout`, `switch`, `pull` ani `merge`.

`fetch` nie przechodzi (brak sieci, brak dostępu) → pomiń projekt z podaniem
przyczyny. **Nie sięgaj po nieaktualny stan lokalny po cichu.**

Osiągalność znacznika sprawdzasz jak w 1.1, tyle że względem `origin/main`:
`git -C "<ścieżka>" merge-base --is-ancestor <lastCommit> origin/main`.

Zakres po dacie zamieniasz na parę SHA tak samo jak w 1.1 — tutaj
odpowiednikiem jest `<sha>^..origin/main`:

    git -C "<ścieżka>" log --since=<data> --format=%H origin/main | tail -1

Korzeń historii → `<sha>..origin/main` z informacją dla Rafała. Brak
commitów w oknie → nie ma czego skanować (drzewa roboczego tu nie czytasz),
więc pomijasz projekt i mówisz o tym wprost.

Gdy gałąź domyślna nie nazywa się `main`, ustal ją według `## Przypadki
brzegowe` i podstaw jej nazwę wszędzie, gdzie 2.2, 2.3 i 2.4 mówią
`origin/main`.

### 2.3 Skan równoległy

Projekty są niezależne — wywołaj `kb-scan` dla wszystkich w **jednej
wiadomości**, żeby poszły współbieżnie. Pola wejściowe per projekt:

```
repozytorium: <ścieżka lokalna projektu>
zakres: <lastCommit>..origin/main
drzewo robocze: nie
korzeń bazy wiedzy: <korzeń repo „Baza wiedzy">
mapa:
- <cały projekt> -> <obszar z trzeciej kolumny rejestru w CLAUDE.md>
kontekst: <jedno zdanie o tym, czego szukamy>
```

`drzewo robocze: nie` jest istotne — niezacommitowana praca Rafała w cudzym
repo nie jest jeszcze stanem projektu i nie dokumentujesz jej.

### 2.4 Bramki, zapis, znacznik

Dalej identycznie jak w kroku 1: bramka zakresu (1.4) → bramka treści (1.5)
→ zapis, indeks, znacznik (1.6). Różnice:

- obszar z trzeciej kolumny rejestru w `CLAUDE.md`, nigdy złożony ze sluga
  (dla `devstock-team-agent` i `company-agent-chat` jest to
  `knowledge-base/dev/system-wieloagentowy/<slug>/`); kategoria zawsze `dev`,
- wpisy do `<obszar>/dziennik/`,
- `lastCommit` = `git -C "<ścieżka>" rev-parse origin/main`,
- `documentedDirty` **nie dotyczy** projektów zewnętrznych (nie czytasz ich
  drzewa roboczego),
- warstwa z rozmowy (1.3) obowiązuje też tutaj — decyzja o cudzym projekcie
  omówiona w tej sesji jest materiałem na wpis.

Znacznik przesuwasz **per projekt**, po zapisie plików tego projektu.
Projekt pominięty nie przesuwa swojego znacznika i nie blokuje pozostałych.

## Zakończenie

Podsumowanie w pięciu punktach:

1. co zaktualizowane (ścieżki dokumentów),
2. co dopisane (ścieżki wpisów),
3. co zaindeksowane, a co nie i dlaczego,
4. co pominięte i dlaczego,
5. czy `knowledge-base/.kb-update-state.json` został utworzony albo
   zaktualizowany — to jedyny zapis do `knowledge-base/`, którego Rafał nie
   ogląda na żadnej bramce, a commituje go razem z resztą.

Na końcu jawnie: **nie commitowałem — zmiany zostają w drzewie roboczym.**

## Przypadki brzegowe

| sytuacja | zachowanie |
|---|---|
| Brak `knowledge-base/.kb-update-state.json` | Pierwsze uruchomienie. Nie odtwarzaj całej historii — zaproponuj Rafałowi zakres (domyślnie 30 dni) i powiedz wprost, że starsze zmiany zostają nieprzejrzane. Uzgodnioną datę **zamień na parę SHA** — komenda i oba warianty brzegowe są w 1.1. Subagentowi nigdy nie podajesz `--since`, bo `git diff` ignoruje je bez błędu. Plik utwórz dopiero przy zapisie znacznika |
| Brak wpisu źródła w istniejącym pliku stanu | Jak wyżej, ale tylko dla tego źródła |
| `lastCommit` nieosiągalny (`git merge-base --is-ancestor` ≠ 0) | Przejdź na zakres po dacie `updatedAt`, zamieniony na parę SHA według 1.1, i powiedz o tym Rafałowi |
| Brak `tools/kb-client/.env` | Zapisz pliki, pomiń indeksowanie, podaj gotowe komendy `upsert` do uruchomienia później. Znacznika **nie** blokuj |
| `upsert` kończy się błędem | Pliki zostają, znacznik przesuwasz. Wypisz nieudane wpisy z gotowymi komendami do ponowienia. Rozróżnij przyczynę: konfiguracja (`.env`), autoryzacja (Basic Auth), walidacja (zła kategoria), serwer. Nie ponawiaj ślepo |
| Brak zmian od znacznika i brak decyzji z rozmowy | Powiedz „nic nowego" i zakończ — bez bramek, bez pustych wpisów, bez przesuwania znacznika |
| Rafał odrzuca wszystko w bramce zakresu | Zakończ **ten krok** bez zapisu; znacznika nie przesuwaj. Przy pełnym przebiegu krok 2 rusza normalnie — bramki są per krok |
| Ścieżka zmiany spoza mapy obszarów | Zapytaj Rafała o obszar. Nie zgaduj i nie wrzucaj do `other` |
| Subagent zwraca `cel: DO USTALENIA` | Pokaż w bramce w grupie „wymagające decyzji" |
| Brak ścieżki projektu w `CLAUDE.local.md` lub brak klonu na dysku | Pomiń projekt, wypisz w podsumowaniu. Nie klonuj |
| `git fetch` nie przechodzi | Pomiń projekt z podaniem przyczyny; nie sięgaj po nieaktualny stan lokalny po cichu |
| `origin/main` nie istnieje (inna nazwa gałęzi domyślnej) | Łańcuch dwóch prób, obie wyłącznie do odczytu: najpierw `git -C "<ścieżka>" symbolic-ref refs/remotes/origin/HEAD`, a gdy kończy się `fatal: ref refs/remotes/origin/HEAD is not a symbolic ref` — `git -C "<ścieżka>" ls-remote --symref origin HEAD`. Ustaloną gałąź podstaw wszędzie, gdzie 2.2, 2.3 i 2.4 mówią `origin/main`. Nie zgaduj `master` |
