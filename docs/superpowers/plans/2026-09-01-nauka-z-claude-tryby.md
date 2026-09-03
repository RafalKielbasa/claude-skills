# Nauka z Claude — tryby i rejestr fundamentów: plan implementacji

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rozdzielić w skillu `nauka-z-claude` ekspozycję materiału od sprawdzania wiedzy: dodać tryb `wyjaśnij`, rejestr konceptów fundamentalnych, scalić powtórki w jedną sesję z trzema pulami i zwęzić pytania z notatek do zakresu notatki.

**Architecture:** Cała zmiana to edycja plików Markdown — dwóch plików skilli, dwóch plików dokumentacji i jednego pliku danych. Nie ma kodu do skompilowania ani testów jednostkowych. Rolę testów pełnią komendy weryfikacyjne (`grep`, `sed`, skrypt PowerShell odtwarzający regex hooka), sprawdzające, że wstawiony tekst jest na miejscu, że nie zniknęło nic, co miało zostać, i że format `[następna: …, interwał: …]` nadal pasuje do wzorca czytanego przez hook.

**Tech Stack:** Markdown; PowerShell 5.1 (hook `powtorki-check.ps1`); Git Bash (`grep`, `sed`, `awk`) do weryfikacji.

**Spec:** `C:\Users\rafal\.claude\docs\superpowers\specs\2026-09-01-nauka-z-claude-tryby-design.md`

## Global Constraints

- **Bez commitów.** Globalny `CLAUDE.md` użytkownika zabrania `git add`, `git commit`, `git push` i tworzenia PR-ów. Skill `writing-plans` przewiduje krok „Commit" w każdym zadaniu — **ten krok jest w tym planie świadomie pominięty**. Zmiany zostają w drzewie roboczym jako niezacommitowane. Wykonawca kończy zadanie na weryfikacji i raporcie.
- **Bramka na pytania.** Gdy zadanie każe zapytać użytkownika, wykonawca **czeka na odpowiedź**. Brak odpowiedzi ani timeout nie są zgodą.
- **Format pozycji powtórkowej jest nienaruszalny:** `[następna: RRRR-MM-DD, interwał: Nd]`. Czyta go regex hooka `powtorki-check.ps1:26` (`"nast$([char]0x0119)pna: (\d{4}-\d{2}-\d{2})"`) oraz skill `tidy-journal`. Żadne zadanie nie zmienia tego formatu.
- **Język:** treść skilli po polsku, z pełną diakrytyką. Nazwy skilli i plików po angielsku w kebab-case.
- **Ścieżki:**
  - skill uczący: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (293 linie przed zmianami)
  - skill porządkujący: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md`
  - plik postępu (dane): `D:\Notatki\notatki\nauka-z-claude.md` (518 linii przed zmianami)
  - instrukcje vaulta: `D:\Notatki\notatki\.claude\CLAUDE.md`
  - README vaulta: `D:\Notatki\notatki\README.md`
  - hook: `C:\Users\rafal\.claude\hooks\powtorki-check.ps1` — **nie modyfikujemy go w żadnym zadaniu**
- **Nie uruchamiaj hooka `powtorki-check.ps1` do testów.** Hook zapisuje dzisiejszą datę do `powtorki-last-check.txt` (`powtorki-check.ps1:21`) i przez to wycisza przypomnienie na resztę dnia. Weryfikuj regex osobnym, jednorazowym skryptem — tak, jak pokazuje Task 9.
- **Kolejność zadań jest wiążąca.** Zadania 1–6 edytują ten sam plik; wykonywane równolegle rozjadą się na konfliktach.

---

### Task 1: Rejestr konceptów — format zapisu

Definiuje strukturę danych, na której opierają się zadania 2, 3 i 4. Musi być pierwsze.

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (sekcja `## Zapis postępu`, ok. linii 197–254)

**Interfaces:**
- Produces: nazwy sekcji `## Koncepty do poznania` i `### Powtórki fundamentów`, format wpisu rejestru `- [ ] <oś> (<podpojęcia>)` + wiersz `— wywołany przez: …`, drabinka fundamentów `1 → 3 → 7 → 14 → 30`. Zadania 2–4 odwołują się do tych nazw dosłownie.

- [ ] **Step 1: Znajdź kotwicę w sekcji `## Zapis postępu`**

Otwórz plik i znajdź akapit kończący opis sekcji `## Powtórki z notatek` — dokładnie ten tekst:

```
Budowa pozycji, w kolejności: człon `[następna: …, interwał: …]` (ten sam format
co w pozycjach tematycznych, czytany przez hook), opcjonalny znacznik
`(diagnoza)` dla notatki jeszcze nigdy nieprzepytanej, wikilink do notatki
(ze ścieżką, gdy nazwa pliku nie jest unikalna) i opcjonalna wskazówka po ` — `.
Wskazówkę **zastępujesz**, nie doklejasz — trzyma stan „od czego zacząć następnym
razem", nie historię potknięć. Sekcję zakładasz przy pierwszym zasileniu; pustej
nie tworzysz. Szczegóły obsługi — sekcja „Powtórki z notatek".
```

- [ ] **Step 2: Wstaw opis rejestru bezpośrednio po tej kotwicy**

Wklej poniższy blok **po** akapicie ze Step 1, przed nagłówkiem `## Red flags — zatrzymaj się`:

````markdown
Drugą sekcją o stałej nazwie jest rejestr konceptów fundamentalnych, umieszczony
**przed** `## Powtórki z notatek`:

```markdown
## Koncepty do poznania

- [ ] TCP i koszt sieci (RTT, handshake, keep-alive, strumienie)
      — wywołany przez: Redis krok 2, GCS krok 5 (ECONNRESET), FE→BE krok 9
- [x] Pętla zdarzeń i uchwyty — przerobione 2026-09-05

### Powtórki fundamentów

- [następna: 2026-09-06, interwał: 1d] RTT jako jednostka kosztu płacona za
  połączenie, nie za komendę — pięć komend po jednym połączeniu to jedno RTT
  plus pięć krótkich wymian, nie pięć uścisków
```

Rejestr trzyma osie wiedzy leżące **warstwę poniżej** tematów: pojęcia, których
brak wysadza naukę niezależnie od tego, który temat akurat przerabiacie.

- Wpis zakłada tryb „pytania" (test fundamentu), tryb „wyjaśnij" (gdy wskazanego
  konceptu jeszcze nie ma) albo użytkownik jawnie.
- Ta sama oś wywołana z kolejnego tematu **dopisuje się do listy „wywołany
  przez"**; drugiego wpisu nie zakładasz.
- Wpisu nie kasujesz sam. Przerobiony dostaje `[x]` i datę.
- Podsekcja `### Powtórki fundamentów` trzyma pozycje powtórkowe konceptów.
  Drabinka: `1 → 3 → 7 → 14 → 30` dni, jak w pozycjach tematycznych; reset po
  błędnej odpowiedzi → `1d`. Zaliczenie pozycji stojącej na `30d` usuwa ją
  z podsekcji bez przenoszenia gdziekolwiek — śladem zostaje odhaczony wpis
  w rejestrze.
- Obie sekcje zakładasz przy pierwszym zasileniu; pustych nie tworzysz.
````

- [ ] **Step 3: Zweryfikuj wstawienie i kolejność sekcji**

Run:
```bash
grep -n "Koncepty do poznania\|Powtórki fundamentów\|## Red flags" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: `## Koncepty do poznania` i `### Powtórki fundamentów` pojawiają się **przed** `## Red flags — zatrzymaj się`, a poprzedni opis `## Powtórki z notatek` nadal istnieje.

- [ ] **Step 4: Zweryfikuj, że nie ruszyłeś formatu pozycji**

Run:
```bash
grep -c "następna: RRRR-MM-DD, interwał: Nd\|następna: …, interwał: …" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: liczba ≥ 4 (format opisany w kilku miejscach, żadne nie zostało przepisane).

- [ ] **Step 5: Bez commita**

Zostaw zmianę w drzewie roboczym. Nie wywołuj `git add` ani `git commit`.

---

### Task 2: Tryb `wyjaśnij`

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (frontmatter `description`, linia 3; sekcja `## Krok 0 — plik postępu`, ok. linii 19–38; nowa sekcja po `## Nowy temat`)

**Interfaces:**
- Consumes: nazwy `## Koncepty do poznania` i `### Powtórki fundamentów` z Task 1.
- Produces: wyzwalacz `/nauka-z-claude wyjaśnij <koncept>`; regułę „pozycję dostaje mechanizm, który wymagał drugiego podejścia, sufit 3 na sesję" — Task 6 dopisuje do niej red flagi.

- [ ] **Step 1: Rozszerz `description` o nowy wyzwalacz**

Znajdź linię 3 (`description: …`). Zamień **końcówkę** zdania — dokładnie ten fragment:

```
explicit /nauka-z-claude, or a SessionStart hook reporting overdue review items. NOT for one-off questions ("co to jest X?", "wyjaśnij mi X") without intent to study the topic over multiple sessions.
```

na:

```
explicit /nauka-z-claude, explicit /nauka-z-claude wyjaśnij <koncept> for the exposition mode, or a SessionStart hook reporting overdue review items. NOT for one-off questions ("co to jest X?", "wyjaśnij mi X") without intent to study the topic over multiple sessions — the exposition mode requires the explicit command, a phrase like "wyjaśnij mi X" alone does NOT trigger it.
```

- [ ] **Step 2: Dopisz rozpoznanie trybu w Kroku 0**

W sekcji `## Krok 0 — plik postępu` znajdź wiersz:

```
- Prośba o dociągnięcie notatek do powtórek („dodaj do powtórek folder X",
  „wrzuć Google Cloud do powtórek") → sekcja „Dociąganie notatek do rotacji".
```

i wstaw **przed nim**:

```
- Jawne `/nauka-z-claude wyjaśnij <koncept>` → sekcja „Tryb wyjaśnij". Samo
  „wyjaśnij mi X" rzucone w rozmowie **nie** uruchamia tego trybu — odpowiadasz
  zwyczajnie, bez zapisu do pliku i bez pozycji powtórkowej.
```

- [ ] **Step 3: Wstaw sekcję `## Tryb wyjaśnij`**

Wklej poniższy blok **między** sekcję `## Nowy temat` a sekcję `## Pętla sokratejska (rdzeń)`:

```markdown
## Tryb wyjaśnij

Jedyny tryb, w którym **wykładasz**. Istnieje, bo metoda sokratejska nie działa
na materiale, którego użytkownik nigdy nie widział: nie da się wydedukować, że
handshake TCP to trzy pakiety. Jednostką jest **koncept** z rejestru „Koncepty
do poznania" — oś wiedzy leżąca poniżej tematów, na jedną, najwyżej dwie sesje.
Materiał na pięć sesji to temat: idzie ścieżką „Nowy temat" z roadmapą.

Wchodzi **wyłącznie** na jawne `/nauka-z-claude wyjaśnij <koncept>`.

1. Przeczytaj plik postępu. Znajdź koncept w rejestrze; jeśli go nie ma —
   dopisz go przed startem.
2. **Pokaż zakres i czekaj na zatwierdzenie:** 3–6 mechanizmów składających się
   na tę oś, wypisanych jednym zdaniem każdy. Użytkownik może wyciąć te, które
   już umie. Bez jego odpowiedzi nie zaczynasz.
3. Mechanizm po mechanizmie: porcja **2–4 akapity** → **jedno** pytanie
   sprawdzające → ocena.
   - Dobra odpowiedź → następny mechanizm.
   - Zła → ten sam mechanizm z innej strony. Nie następna porcja i nie to samo
     wyjaśnienie powtórzone tymi samymi słowami.
4. Przykłady kotwicz w miejscach, które ten koncept wywołały — RTT tłumaczysz na
   jego Redisie z kroku 2, nie na abstrakcyjnym serwerze. Kod cytuj snippetem,
   nie samym `plik:linia`: użytkownik nie zawsze ma repo otwarte.
5. Zapis na koniec sesji:
   - Pozycję w `### Powtórki fundamentów` (interwał `1d`, `następna` = jutro)
     dostaje mechanizm, który **wymagał drugiego podejścia albo poprawki**.
     Zrozumiany od razu — nie dostaje. Sufit **3 pozycje na sesję**.
   - Wszystkie mechanizmy z zatwierdzonego zakresu przerobione → wpis w rejestrze
     na `[x]` z datą. Inaczej → `**Następny krok:**` przy wpisie.

Tryb wyjaśnij nie rusza roadmap tematów ani ich pozycji powtórkowych.
```

- [ ] **Step 4: Zweryfikuj obecność i miejsce sekcji**

Run:
```bash
grep -n "^## " "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: kolejność nagłówków to `## Overview`, `## Krok 0 — plik postępu`, `## Nowy temat`, `## Tryb wyjaśnij`, `## Pętla sokratejska (rdzeń)`, …

- [ ] **Step 5: Zweryfikuj wykluczenie w `description`**

Run:
```bash
sed -n '3p' "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md" | grep -c "does NOT trigger it"
```
Expected: `1`

- [ ] **Step 6: Bez commita**

---

### Task 3: Tryb `pytania` — test fundamentu

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (sekcja `## Pętla sokratejska (rdzeń)`, ok. linii 49–69; sekcja `## Zapis postępu`, akapit o trudności wykrytej w trakcie nauki)

**Interfaces:**
- Consumes: `## Koncepty do poznania` (Task 1), `## Tryb wyjaśnij` (Task 2).
- Produces: sformułowanie „test fundamentu", do którego odwołuje się Task 6.

- [ ] **Step 1: Wstaw test fundamentu do pętli sokratejskiej**

W sekcji `## Pętla sokratejska (rdzeń)` znajdź wiersz:

```
- Widoczna luka w rozumieniu blokuje przejście dalej, nawet po formalnie
  poprawnej odpowiedzi.
```

i wstaw **bezpośrednio po nim**:

```
- **Test fundamentu.** Zanim zapiszesz trudność jako pozycję powtórkową tematu,
  rozstrzygnij, na której warstwie leży. Luka jest **fundamentem**, gdy
  odpowiedź wymaga pojęcia spoza dziedziny bieżącego tematu (Redis wymagający
  TCP, JWT wymagający kryptografii) albo gdy ta sama oś padła już w innym
  temacie. W przeciwnym razie to luka tematyczna.
  - Luka tematyczna → pozycja w `### Powtórki` tematu, interwał `1d`.
  - Fundament → wpis w `## Koncepty do poznania` (albo dopisanie bieżącego
    tematu do „wywołany przez" istniejącego wpisu), a potem **pytanie do
    użytkownika**: przerywamy teraz na tryb wyjaśnij, czy notujemy i idziemy
    dalej. Czekasz na decyzję; brak odpowiedzi nie jest zgodą na żaden wariant.
  - Wyzwalacz testu: dwa „nie wiem" pod rząd na tej samej warstwie albo
    naprowadzenia, które nie trafiają, bo brakuje pojęcia niższego poziomu.
```

- [ ] **Step 2: Zaktualizuj regułę zapisu trudności**

W sekcji `## Zapis postępu` znajdź zdanie:

```
Trudność wykryta w trakcie nauki → od razu pozycja
w `### Powtórki` z interwałem 1d, nie luźna notatka.
```

i zamień je na:

```
Trudność wykryta w trakcie nauki → od razu pozycja
w `### Powtórki` z interwałem 1d, nie luźna notatka — chyba że test fundamentu
z „Pętli sokratejskiej" wskaże warstwę niższą; wtedy wpis idzie do
`## Koncepty do poznania`.
```

- [ ] **Step 3: Zweryfikuj obie zmiany**

Run:
```bash
grep -n "Test fundamentu\|test fundamentu" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: dwa trafienia — jedno w „Pętli sokratejskiej", jedno w „Zapisie postępu".

- [ ] **Step 4: Zweryfikuj, że bramka na pytanie jest jawna**

Run:
```bash
grep -c "brak odpowiedzi nie jest zgodą\|Brak odpowiedzi" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: liczba ≥ 2 (nowa reguła plus istniejąca w sekcji „Powtórki").

- [ ] **Step 5: Bez commita**

---

### Task 4: Tryb `powtórki` — trzy pule i budżet

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (sekcja `## Krok 0 — plik postępu`, lista rozpoznania trybu; sekcja `## Powtórki`, ok. linii 79–112)

**Interfaces:**
- Consumes: `### Powtórki fundamentów` (Task 1).
- Produces: sufit 4 pytań na pulę i kolejność fundamenty → tematyczne → notatki; Task 6 odwołuje się do tego w tabeli błędów.

- [ ] **Step 1: Zastąp rozpoznanie trybów w Kroku 0**

Znajdź w `## Krok 0 — plik postępu` cały ten fragment:

```
- Prośba o powtórki albo kontekst hooka o zaległych pozycjach → sekcja
  „Powtórki". Najpierw rozpoznaj tryb:
  - „zrób powtórki", „przepytaj mnie", kontekst hooka → **tryb mieszany**
    (oba źródła, budżet dzielony),
  - „powtórka z notatek", „przepytaj mnie z <obszar>" (np. „z Google Cloud"),
    wskazany folder → **tryb tylko z notatek**, zawężony do wskazanego obszaru,
  - „powtórka z nauki z Claude", „przepytaj mnie z tematu X" → **tryb tylko
    tematyczny**.
```

i zamień go na:

```
- Prośba o powtórki albo kontekst hooka o zaległych pozycjach → sekcja
  „Powtórki". To jeden tryb obsługujący trzy pule; prośba może go zawęzić:
  - „zrób powtórki", „przepytaj mnie", kontekst hooka → **bez zawężenia**,
    wszystkie trzy pule wg budżetu,
  - „powtórka z notatek", „przepytaj mnie z <obszar>" (np. „z Google Cloud"),
    wskazany folder → **zawężenie do puli notatek**, dodatkowo do wskazanego
    obszaru,
  - „powtórka z nauki z Claude", „przepytaj mnie z tematu X" → **zawężenie do
    puli tematycznej**,
  - „powtórz fundamenty", „przepytaj mnie z konceptów" → **zawężenie do puli
    fundamentów**.
```

- [ ] **Step 2: Zastąp akapit o budżecie**

W sekcji `## Powtórki` znajdź cały akapit:

```
Sesja ma budżet **~12 pytań**, dzielony po połowie między dwa źródła: pozycje
tematyczne (jedna pozycja = jedno pytanie) i notatki wiedzowe (patrz „Powtórki
z notatek"). Niewykorzystana część jednego źródła przechodzi na drugie, więc
budżet się nie marnuje, a żadne źródło nie wypycha drugiego. Tryb tylko
tematyczny oddaje cały budżet pozycjom tematycznym, zachowując limit 10 pozycji
na sesję; tryb tylko z notatek — cały budżet notatkom.
```

i zamień go na:

```
Sesja ma budżet **~12 pytań** i trzy pule, obsługiwane w tej kolejności, każda
z sufitem **4 pytań**:

1. **Fundamenty** — pozycje z `### Powtórki fundamentów` (jedna pozycja = jedno
   pytanie).
2. **Tematyczne** — pozycje z `### Powtórki` w sekcjach tematów (jedna pozycja =
   jedno pytanie).
3. **Notatki** — notatki wiedzowe (patrz „Powtórki z notatek"), dodatkowo
   maksymalnie 3 notatki na sesję, notatka niepodzielna.

Niewykorzystany przydział spływa na pule **niżej** w kolejności, więc budżet się
nie marnuje. Kolejność nie jest przypadkowa: jeśli fundament leży, pytanie
tematyczne postawione nad nim i tak skończy się „nie wiem" — marnują się wtedy
dwa pytania zamiast jednego. Zawężenie z Kroku 0 oddaje cały budżet wskazanej
puli, z zachowaniem limitu 3 notatek na sesję dla puli notatek i limitu
10 pozycji dla puli tematycznej.
```

- [ ] **Step 3: Zaktualizuj krok 1 przebiegu powtórek**

W tej samej sekcji znajdź:

```
1. Zbierz zaległe pozycje (`następna ≤ dziś`) ze **wszystkich** tematów.
   Najstarsza data pierwsza, w ramach przydziału pytań dla tego źródła
   (w trybie tylko tematycznym maksymalnie 10 pozycji). Brak zaległych w obu
   źródłach → powiedz to i podaj datę najbliższej powtórki.
```

i zamień na:

```
1. Zbierz zaległe pozycje (`następna ≤ dziś`) z trzech pul: `### Powtórki
   fundamentów`, `### Powtórki` **wszystkich** tematów oraz `## Powtórki
   z notatek`. W każdej puli najstarsza data pierwsza, w ramach jej przydziału
   pytań (przy zawężeniu do puli tematycznej maksymalnie 10 pozycji). Brak
   zaległych we wszystkich trzech pulach → powiedz to i podaj datę najbliższej
   powtórki.
```

- [ ] **Step 4: Dopisz obsługę drabinki fundamentów do kroku 3**

Znajdź:

```
3. Ocena własnymi słowami. Poprawna → następny interwał drabinki
   1 → 3 → 7 → 14 → 30 dni, `następna = dziś + nowy interwał`. Błędna →
   naprowadzenie jak w pętli sokratejskiej, a przy zapisie reset:
   interwał 1d, `następna = jutro`.
```

i zamień na:

```
3. Ocena własnymi słowami. Poprawna → następny interwał drabinki
   1 → 3 → 7 → 14 → 30 dni, `następna = dziś + nowy interwał`. Błędna →
   naprowadzenie jak w pętli sokratejskiej, a przy zapisie reset:
   interwał 1d, `następna = jutro`. Ta sama drabinka i ten sam reset obowiązują
   pozycje z puli fundamentów; pula notatek ma własną drabinkę (patrz „Powtórki
   z notatek").
```

- [ ] **Step 5: Zaktualizuj krok 4 o los pozycji fundamentu**

Znajdź:

```
4. Zaliczenie pozycji stojącej na interwale 30d → pozycja wypada z Powtórek;
   przenieś ją do „Notatek" z prefiksem „Utrwalone:".
```

i zamień na:

```
4. Zaliczenie pozycji stojącej na interwale 30d → pozycja wypada z Powtórek.
   Pozycję tematyczną przenieś do `### Notatki` tematu z prefiksem
   „Utrwalone:". Pozycję z puli fundamentów usuń bez przenoszenia — śladem
   zostaje odhaczony wpis w `## Koncepty do poznania`.
```

- [ ] **Step 6: Zweryfikuj sumę sufitów i kolejność pul**

Run:
```bash
grep -n "sufitem \*\*4 pytań\|Fundamenty\|spływa na pule" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: trafienia w sekcji `## Powtórki`; 3 pule × sufit 4 = budżet 12, zgodnie z akapitem.

- [ ] **Step 7: Zweryfikuj, że stara terminologia trybów zniknęła**

Run:
```bash
grep -n "tryb mieszany\|tryb tylko z notatek\|tryb tylko tematyczny" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: brak trafień (pusty wynik, kod wyjścia 1).

- [ ] **Step 8: Bez commita**

---

### Task 5: Pula notatek — zakres jako granica i drabinka 7d

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (sekcja `## Powtórki z notatek` z podsekcjami `### Dobór na sesję`, `### Przebieg`, `### Ocena`, ok. linii 113–175; sekcja `## Dociąganie notatek do rotacji`, ok. linii 176–196)

**Interfaces:**
- Consumes: `## Koncepty do poznania` (Task 1) — luka spoza zakresu notatki idzie tam.
- Produces: start diagnozy `7d`, awans diagnozy na `14d`; Task 7 dopasowuje do tego `tidy-journal`, Task 9 podnosi istniejące pozycje.

- [ ] **Step 1: Zamień drabinkę notatek**

W sekcji `## Powtórki z notatek` znajdź akapit:

```
Drabinka: `3 → 7 → 14 → 30 → 60 → 120` dni, dalej stale `120`. Notatka nigdy nie
wypada z rotacji — po dojściu do szczytu schodzi do konserwacji (raz na kwartał
jedno pytanie). Reset schodzi do `3d`, nie do `1d`.
```

i zamień na:

```
Drabinka: `3 → 7 → 14 → 30 → 60 → 120` dni, dalej stale `120`. Notatka nigdy nie
wypada z rotacji — po dojściu do szczytu schodzi do konserwacji (raz na kwartał
jedno pytanie). Reset schodzi do `3d`, nie do `1d`.

Pozycja nowa (diagnostyczna) startuje z **`7d`**, nie z `3d`. Powód jest
arytmetyczny: pojemność rotacji = (notatki na sesję) × (interwał), więc przy
limicie 3 notatek na sesję start `3d` utrzymuje tylko 9 notatek na najniższym
szczeblu, a start `7d` — 21. Zaliczona diagnoza awansuje stąd na `14d`.
```

- [ ] **Step 2: Zwęź zakres pytań w `### Przebieg`**

Znajdź punkt 2 w podsekcji `### Przebieg`:

```
2. Pytania sokratejskie **z innego ujęcia niż zapis w notatce** — inny przykład,
   przypadek brzegowy, „a co jeśli…". Nie cytuj zdań notatki przed odpowiedzią.
```

i zamień na:

```
2. Pytania sokratejskie **z innego ujęcia niż zapis w notatce**, ale **wyłącznie
   w granicach jej treści**: inne sformułowanie, zestawienie dwóch rzeczy
   z notatki, przykład złożony z jej elementów. Twardy warunek: na pytanie musi
   dać się odpowiedzieć z samej notatki. Przypadek brzegowy wymagający
   mechanizmu, którego notatka nie omawia, jest niedozwolony — cel tej puli to
   zapamiętanie treści kursu, nie deep dive. Gdy taki mechanizm okaże się
   potrzebny, to sygnał do wpisu w `## Koncepty do poznania`, nie temat pytania.
   Nie cytuj zdań notatki przed odpowiedzią.
```

- [ ] **Step 3: Zaktualizuj wiersz diagnozy w tabeli `### Ocena`**

Znajdź wiersz tabeli:

```
| Pozycja ze znacznikiem `(diagnoza)` | pierwsza powtórka **bez kary**: słaby wynik zostawia `3d` i zapisuje luki, dobry awansuje normalnie (`3d → 7d`). Znacznik zdejmujesz niezależnie od wyniku |
```

i zamień na:

```
| Pozycja ze znacznikiem `(diagnoza)` | pierwsza powtórka **bez kary**: słaby wynik zostawia `7d` i zapisuje luki, dobry awansuje normalnie (`7d → 14d`). Znacznik zdejmujesz niezależnie od wyniku |
```

- [ ] **Step 4: Zaktualizuj dociąganie notatek do rotacji**

W sekcji `## Dociąganie notatek do rotacji` znajdź punkty 2 i 3:

```
2. **Rozłóż daty startowe: maksymalnie 3 notatki na dzień**, zaczynając od
   dziś + 3 (kolejne trójki: dziś + 4, dziś + 5, …). Osiem notatek rozkłada się
   więc na 3 + 3 + 2 w trzech kolejnych dniach. Dwadzieścia notatek nie może
   spaść na użytkownika jednego poranka.
3. Wszystkie nowe pozycje dostają interwał `3d` i znacznik `(diagnoza)` —
   to wiedza jeszcze nigdy przy Tobie nie sprawdzana.
```

i zamień na:

```
2. **Rozłóż daty startowe: maksymalnie 3 notatki na dzień**, zaczynając od
   dziś + 7 (kolejne trójki: dziś + 8, dziś + 9, …). Osiem notatek rozkłada się
   więc na 3 + 3 + 2 w trzech kolejnych dniach. Dwadzieścia notatek nie może
   spaść na użytkownika jednego poranka.
3. Wszystkie nowe pozycje dostają interwał `7d` i znacznik `(diagnoza)` —
   to wiedza jeszcze nigdy przy Tobie nie sprawdzana.
```

- [ ] **Step 5: Zweryfikuj, że nigdzie nie został start 3d dla diagnoz**

Run:
```bash
grep -n "interwał \`3d\`\|dziś + 3\|(\`3d → 7d\`)" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: pozostaje **wyłącznie** trafienie w wierszu „Wszystkie błędnie | reset: interwał `3d`, `następna` = dziś + 3" — reset świadomie zostaje na 3d (spec, sekcja „Drabinka i interwały"). Żadnego trafienia w wierszu diagnozy ani w „Dociąganiu".

- [ ] **Step 6: Zweryfikuj twardą granicę zakresu**

Run:
```bash
grep -c "musi\s*dać się odpowiedzieć z samej notatki\|w granicach jej treści" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: liczba ≥ 1.

- [ ] **Step 7: Bez commita**

---

### Task 6: Red flags i tabela częstych błędów

**Files:**
- Modify: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` (sekcja `## Red flags — zatrzymaj się`, ok. linii 255–274; sekcja `## Częste błędy`, ok. linii 275–293)

**Interfaces:**
- Consumes: reguły z zadań 2–5 (sufit 3 pozycji, test fundamentu, kolejność pul, granica zakresu notatki).

- [ ] **Step 1: Dopisz red flagi**

W sekcji `## Red flags — zatrzymaj się` znajdź ostatnią pozycję listy:

```
- „Notatka świeża, użytkownik dopiero co ją pisał — zaliczę bez pytania"
  (diagnoza to nadal pytania)
```

i dopisz **po niej**:

```
- „Użytkownik napisał «wyjaśnij mi X», czyli chce tryb wyjaśnij" (tryb wchodzi
  wyłącznie na jawne `/nauka-z-claude wyjaśnij`; zwykła prośba dostaje zwykłą
  odpowiedź)
- „Przy powtórce notatki brakuje mu mechanizmu, dopytam o ten mechanizm"
  (pytanie musi mieścić się w notatce; mechanizm idzie do rejestru konceptów)
- „W trybie wyjaśnij zrozumiał wszystko od razu, zapiszę i tak pozycje ze
  wszystkich mechanizmów" (pozycję dostaje tylko mechanizm, który się oparł;
  sufit 3 na sesję)
- „Wykryłem fundament, od razu przerywam temat i tłumaczę" (wpis do rejestru
  tak, przerwanie dopiero po decyzji użytkownika)
- „W trybie wyjaśnij zadam pytanie sokratejskie zamiast wyłożyć" (to jedyny
  tryb, w którym masz wyłożyć — ekspozycja jest tu celem, nie porażką)
```

- [ ] **Step 2: Dopisz wiersze do tabeli częstych błędów**

W sekcji `## Częste błędy` znajdź ostatni wiersz tabeli:

```
| Notatki traktowane jako dodatek do pozycji tematycznych | Budżet dzielony po połowie — to główny nurt nauki użytkownika |
```

i zamień go na:

```
| Notatki traktowane jako dodatek do pozycji tematycznych | Trzy pule z sufitem 4 pytań każda — notatki to główny nurt nauki użytkownika |
| Luka fundamentalna zapisana jako pozycja tematyczna | Test fundamentu: pojęcie spoza dziedziny tematu idzie do rejestru konceptów |
| Pytanie z notatki wychodzące poza jej treść | Odpowiedź musi dać się wyprowadzić z samej notatki |
| Pula notatek przepytywana przed fundamentami | Kolejność: fundamenty → tematyczne → notatki |
| Tryb wyjaśnij prowadzony jak wykład bez przerw | Porcja 2–4 akapity, potem jedno pytanie sprawdzające |
| Zakres konceptu ustalony bez pytania użytkownika | 3–6 mechanizmów pokazanych do zatwierdzenia przed startem |
```

- [ ] **Step 3: Zweryfikuj spójność liczb z zadaniami 2 i 4**

Run:
```bash
grep -n "sufit \*\*3 pozycje\|sufit 3 na sesję\|sufitem \*\*4 pytań\|sufitem 4 pytań" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Expected: sufit 3 dotyczy **pozycji zapisywanych w trybie wyjaśnij**, sufit 4 dotyczy **pytań na pulę w trybie powtórek**. Jeśli którakolwiek liczba pojawia się w odwrotnym kontekście — popraw.

- [ ] **Step 4: Bez commita**

---

### Task 7: `tidy-journal` — rejestracja pozycji na 7d

Bez tego zadania decyzja o 7d nie zadziała: pierwszy przebieg `tidy-journal` znów zaleje pulę pozycjami na 3d.

**Files:**
- Modify: `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md` (punkt 9, ok. linii 86–92; punkt 12, ok. linii 114; sekcja „stan docelowy", ok. linii 118)

**Interfaces:**
- Consumes: start diagnozy `7d` z Task 5.

- [ ] **Step 1: Zamień interwały w punkcie 9**

Znajdź fragment:

```
   - **nowa notatka** → nowa pozycja
     `- [następna: <dziś + 3>, interwał: 3d] (diagnoza) [[<notatka>]]`;
   - **notatka mająca już pozycję**, do której dopisujesz treść → interwał wraca
     na `3d`, `następna` = dziś + 3, wskazówka **zastąpiona** przez
     `nowy fragment: <co doszło>`, żeby pierwsze pytanie poszło ze świeżego
     materiału;
```

i zamień na:

```
   - **nowa notatka** → nowa pozycja
     `- [następna: <dziś + 7>, interwał: 7d] (diagnoza) [[<notatka>]]`;
   - **notatka mająca już pozycję**, do której dopisujesz treść → interwał wraca
     na `7d`, `następna` = dziś + 7, wskazówka **zastąpiona** przez
     `nowy fragment: <co doszło>`, żeby pierwsze pytanie poszło ze świeżego
     materiału. Cofnięcie na `7d`, a nie niżej, jest celowe: dopisanie treści
     nie może karać mocniej niż utworzenie notatki od zera;
```

- [ ] **Step 2: Zamień wzmiankę w raporcie (punkt 12)**

Znajdź w punkcie 12 fragment:

```
co doszło do rotacji powtórek i które pozycje wróciły na 3 dni
```

i zamień na:

```
co doszło do rotacji powtórek i które pozycje wróciły na 7 dni
```

- [ ] **Step 3: Zweryfikuj, że w kontekście powtórek nie został żaden 3d**

Run:
```bash
grep -n "3d\|dziś + 3\|na 3 dni" "D:/Notatki/notatki/.claude/skills/tidy-journal/SKILL.md"
```
Expected: brak trafień (pusty wynik). Jeśli coś zostanie — sprawdź, czy dotyczy powtórek; jeśli tak, popraw na 7.

- [ ] **Step 4: Zweryfikuj, że nowa wartość jest na miejscu**

Run:
```bash
grep -c "interwał: 7d\|na \`7d\`\|dziś + 7" "D:/Notatki/notatki/.claude/skills/tidy-journal/SKILL.md"
```
Expected: liczba ≥ 3.

- [ ] **Step 5: Bez commita**

---

### Task 8: Dokumentacja vaulta

**Files:**
- Modify: `D:\Notatki\notatki\.claude\CLAUDE.md` (sekcja „Struktura vaulta", akapit o `nauka-z-claude.md`)
- Modify: `D:\Notatki\notatki\README.md` (opis skilla `nauka-z-claude`)

**Interfaces:**
- Consumes: nazwy sekcji z Task 1, nazwy trybów z zadań 2–5.

- [ ] **Step 1: Uzupełnij opis pliku postępu w `CLAUDE.md`**

W `D:\Notatki\notatki\.claude\CLAUDE.md`, w sekcji „Struktura vaulta", znajdź zdanie kończące akapit o `nauka-z-claude.md`:

```
To drugie, niezależne źródło powtórek obok pozycji tematycznych.
```

i zamień je na:

```
To drugie źródło powtórek obok pozycji tematycznych. Trzecim jest sekcja
`## Koncepty do poznania` (przed `## Powtórki z notatek`) — rejestr osi wiedzy
leżących warstwę poniżej tematów, wraz z podsekcją `### Powtórki fundamentów`.
Wpisy zakłada tryb „pytania" po teście fundamentu albo tryb „wyjaśnij", jedyny
tryb tego skilla, w którym Claude wykłada; wchodzi wyłącznie na jawne
`/nauka-z-claude wyjaśnij <koncept>`. Wszystkie trzy pule przepytuje jedna sesja
powtórek, w kolejności fundamenty → tematyczne → notatki.
```

- [ ] **Step 2: Zaktualizuj opis pliku postępu w README**

`nauka-z-claude` nie ma własnego wiersza w tabeli skilli README (tabela opisuje skille mieszkające w vaultcie, a ten jest globalny w `~/.claude/skills`). Jedyne miejsce do zmiany to wiersz listy struktury, **linia 27**, kończący się dziś tak:

```
przepytywane przez `nauka-z-claude` (tryby: mieszany, tylko z notatek, tylko tematyczny).
```

Zamień tę końcówkę na:

```
przepytywane przez `nauka-z-claude`. Przed nią sekcja `## Koncepty do poznania` — rejestr osi wiedzy leżących warstwę poniżej tematów, z podsekcją `### Powtórki fundamentów`. Skill ma trzy tryby: `wyjaśnij` (ekspozycja konceptu porcjami, wyłącznie na jawne `/nauka-z-claude wyjaśnij <koncept>`), `pytania` (pętla sokratejska po roadmapie, z testem fundamentu zasilającym rejestr) i `powtórki` (jedna sesja, trzy pule: fundamenty → tematyczne → notatki).
```

Zachowaj format wiersza: cała pozycja listy to jedna linia, bez łamania — tak jak sąsiednie wpisy w tym pliku.

- [ ] **Step 3: Sprawdź, czy wiersz `tidy-journal` w tabeli nie kłamie**

Run:
```bash
sed -n '14p' "D:/Notatki/notatki/README.md" | grep -o "3d\|3 dni\|interwał[^|]*"
```
Expected: brak trafień na `3d` / `3 dni`. Wiersz `tidy-journal` (linia 14) opisuje rejestrację pozycji bez podawania interwału, więc zmiana z Task 7 go nie dotyczy. Jeśli grep coś zwróci — popraw na 7.

- [ ] **Step 4: Zweryfikuj obie zmiany**

Run:
```bash
grep -c "Koncepty do poznania" "D:/Notatki/notatki/.claude/CLAUDE.md" "D:/Notatki/notatki/README.md"
```
Expected: obie liczby ≥ 1.

- [ ] **Step 5: Bez commita**

---

### Task 9: Operacja porządkowa na pliku postępu

Jedyne zadanie dotykające **danych** użytkownika, nie instrukcji. Wykonywane na końcu, bo zależy od reguł ustalonych w zadaniach 1 i 5.

**Files:**
- Modify: `D:\Notatki\notatki\nauka-z-claude.md`

**Interfaces:**
- Consumes: format rejestru (Task 1), interwał diagnozy `7d` (Task 5).

- [ ] **Step 1: Zrób kopię zapasową do scratchpada**

Run:
```bash
cp "D:/Notatki/notatki/nauka-z-claude.md" "C:/Users/rafal/AppData/Local/Temp/claude/D--Notatki-notatki/ea779960-c9ad-4429-b7ad-a9c56cb7e323/scratchpad/nauka-z-claude.przed-porzadkami.md"
```
Expected: brak wyjścia, plik istnieje. To nie jest commit — to siatka bezpieczeństwa na czas edycji.

- [ ] **Step 2: Zbierz stan wyjściowy**

Run:
```bash
cd "D:/Notatki/notatki" && grep -o "następna: [0-9-]*, interwał: [0-9]*d" nauka-z-claude.md | sort | uniq -c | sort -rn | head -30
echo "--- diagnozy:" && grep -c "(diagnoza)" nauka-z-claude.md
echo "--- wszystkie pozycje:" && grep -c "\[następna:" nauka-z-claude.md
```
Expected (stan na 2026-09-01): **51 pozycji łącznie** — 22 tematyczne i 29 notatkowych, z czego 27 ze znacznikiem `(diagnoza)`, wszystkie na `interwał: 3d`. Zaległych (`następna ≤ dziś`) jest 44. Zapisz te liczby — Step 7 je porówna. Dwie pozycje notatkowe bez znacznika `(diagnoza)` stoją już na drabince i **nie podlegają** podniesieniu w Step 3.

- [ ] **Step 3: Podnieś interwał pozycji diagnostycznych na 7d**

Zmień `interwał: 3d` na `interwał: 7d` **wyłącznie** w liniach zawierających `(diagnoza)`. Nie ruszaj pola `następna` — ustala je Step 4.

```bash
cd "D:/Notatki/notatki" && sed -i "/(diagnoza)/s/interwał: 3d/interwał: 7d/" nauka-z-claude.md
grep -c "(diagnoza).*interwał: 7d\|interwał: 7d.*(diagnoza)" nauka-z-claude.md
```
Expected: `27`.

Uwaga: człon `[następna: …, interwał: …]` stoi **przed** znacznikiem `(diagnoza)` w tej samej linii, więc oba wzorce `grep` powyżej pokrywają ten układ; liczy się wynik niezerowy równy 27.

- [ ] **Step 4: Wylicz nowy rozkład dat skryptem podglądu**

**Dzienny limit to 4 pozycje łącznie, licząc te, które już stoją na danym dniu.** W pliku jest 7 pozycji z datami przyszłymi (`2026-09-02` — 3 sztuki, `09-03` — 3, `09-04` — 1); ich nie ruszamy, ale zajmują miejsca. Rozsyp, który by je zignorował, wsadziłby 4 nowe pozycje na 2 września obok 3 istniejących i złamał kryterium akceptacji nr 8.

Zapisz poniższy skrypt do `<scratchpad>/rozsyp-podglad.sh` (narzędziem Write — nie heredokiem, bo apostrofy w treści rozbijają quoting Bash toola). Skrypt **niczego nie zapisuje** do vaulta:

```bash
#!/usr/bin/env bash
# Podgląd rozsypu zaległych pozycji powtórkowych. NIC NIE ZAPISUJE.
# Drukuje tabelę: linia | data stara | data nowa | skrót pozycji.
set -uo pipefail

PLIK="${1:-D:/Notatki/notatki/nauka-z-claude.md}"
LIMIT="${2:-4}"
TODAY="$(date +%Y-%m-%d)"

# --- 1. Wszystkie pozycje: numer linii <TAB> data <TAB> skrót treści.
#     Kotwica "- [nast" jest czysto ASCII, więc nie zależy od kodowania.
ALL="$(awk '
  /^- \[nast/ {
    if (match($0, /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/)) {
      d = substr($0, RSTART, 10)
      p = index($0, "] ")
      txt = (p > 0) ? substr($0, p + 2, 60) : ""
      printf "%d\t%s\t%s\n", NR, d, txt
    }
  }
' "$PLIK")"

# --- 2. Zajętość dni przez pozycje, których NIE ruszamy (data > dziś).
declare -A OCC
while IFS=$'\t' read -r _ d _; do
  [ -z "$d" ] && continue
  if [[ "$d" > "$TODAY" ]]; then
    OCC["$d"]=$(( ${OCC["$d"]:-0} + 1 ))
  fi
done <<< "$ALL"

# --- 3. Zaległe (data <= dziś), posortowane rosnąco po dacie.
DUE="$(echo "$ALL" | awk -F'\t' -v t="$TODAY" '$2 <= t' | sort -t$'\t' -k2,2 -k1,1n)"
DUE_COUNT="$(echo "$DUE" | grep -c . || true)"

echo "dzisiaj:           $TODAY"
echo "pozycji lacznie:   $(echo "$ALL" | grep -c .)"
echo "zaleglych:         $DUE_COUNT"
echo "limit na dzien:    $LIMIT (pomniejszany o miejsca juz zajete)"
echo
printf "%-6s | %-10s | %-10s | %s\n" "linia" "data stara" "data nowa" "pozycja (skrot)"
printf "%-6s-+-%-10s-+-%-10s-+-%s\n" "------" "----------" "----------" "----------------------------------"

# --- 4. Przydział dat: kolejne dni od dziś, każdy do LIMIT pozycji łącznie
#     (już zajęte przez pozycje przyszłe liczą się do limitu).
offset=0
free=0
cur=""

next_day() {
  cur="$(date -d "$TODAY + $offset day" +%Y-%m-%d)"
  free=$(( LIMIT - ${OCC["$cur"]:-0} ))
  offset=$(( offset + 1 ))
}

next_day
while IFS=$'\t' read -r ln old body; do
  [ -z "$ln" ] && continue
  while [ "$free" -le 0 ]; do next_day; done
  printf "%-6s | %-10s | %-10s | %s\n" "$ln" "$old" "$cur" "$body"
  free=$(( free - 1 ))
done <<< "$DUE"

echo
echo "--- kontrola: rozklad po rozsypie (data -> ile pozycji) ---"
{
  echo "$ALL" | awk -F'\t' -v t="$TODAY" '$2 > t {print $2}'
  offset=0; free=0; cur=""
  next_day
  while IFS=$'\t' read -r ln old body; do
    [ -z "$ln" ] && continue
    while [ "$free" -le 0 ]; do next_day; done
    echo "$cur"
    free=$(( free - 1 ))
  done <<< "$DUE"
} | sort | uniq -c | sort -k2,2
```

Uruchom:
```bash
bash "<scratchpad>/rozsyp-podglad.sh"
```

Expected (przy stanie z 2026-09-01 i uruchomieniu tego dnia): 51 pozycji łącznie, 44 zaległe, tabela 44 wierszy, a w kontroli na końcu **każda data występuje maksymalnie 4 razy** — konkretnie 12 dni po 4 i ostatni dzień z 3. Jeśli któraś data ma 5 lub więcej, przerwij i zgłoś: to znaczy, że plik zmienił się względem założeń planu.

**Pokaż użytkownikowi całą tabelę i wiersz kontroli. Czekaj na akceptację — nie zapisuj przed nią.** Brak odpowiedzi nie jest zgodą.

- [ ] **Step 5: Zapisz zaakceptowany rozkład dat**

Nanieś zaakceptowane zmiany pola `następna`, kierując się kolumną „linia" z tabeli. Edytuj pozycje pojedynczo (Edit z unikalnym kontekstem), nie globalnym `sed` — daty się powtarzają i podmiana hurtem trafi w niewłaściwe linie. Pole `interwał` zostaje takie, jakie ustawił Step 3.

- [ ] **Step 6: Dopisz rejestr konceptów**

Wstaw poniższą sekcję **bezpośrednio przed** nagłówkiem `## Powtórki z notatek` (ostatnia sekcja pliku). Podsekcji `### Powtórki fundamentów` **nie** zakładasz — jest pusta, a pustych sekcji nie tworzymy; powstanie przy pierwszej sesji trybu wyjaśnij.

```markdown
## Koncepty do poznania

- [ ] Model wykonania Node/JS (pętla zdarzeń, uchwyty, `await` jako punkt
      przerwania, wyścigi, zasięg stanu)
      — wywołany przez: Komunikacja FE→BE kroki 5 i 7, Redis krok 2
- [ ] Kryptografia: podpis kontra szyfrowanie, symetria kontra asymetria
      — wywołany przez: Komunikacja FE→BE krok 4 (HMAC-SHA256), Upload do GCS
        kroki 2–3 (signed URL)
- [ ] Sieć od dołu (TCP, RTT, strumienie, gniazda)
      — wywołany przez: Redis krok 2, Upload do GCS krok 5 (ECONNRESET),
        Komunikacja FE→BE krok 9 (keep-alive)
- [ ] Zasoby procesu i systemu operacyjnego (deskryptory, garbage collector
      a zasoby OS, pamięć, tożsamość procesu)
      — wywołany przez: Redis krok 2, Upload do GCS kroki 1 i 3
- [ ] HTTP: kto jest aktorem — przeglądarka czy JS
      — wywołany przez: Komunikacja FE→BE kroki 2–3, Upload do GCS krok 5
- [ ] Gwarancje systemów rozproszonych (at-least-once, idempotencja, brak
      gwarancji kolejności)
      — wywołany przez: Redis krok 1, Potwierdzanie płatności (poziom startowy)
```

- [ ] **Step 7: Zweryfikuj integralność pliku**

Run:
```bash
cd "D:/Notatki/notatki" && echo "pozycje:" && grep -c "\[następna:" nauka-z-claude.md
echo "diagnozy na 7d:" && grep "(diagnoza)" nauka-z-claude.md | grep -c "interwał: 7d"
echo "daty wcześniejsze niż dziś:" && grep -o "następna: [0-9-]*" nauka-z-claude.md | awk -F': ' -v d="$(date +%Y-%m-%d)" '$2 < d' | wc -l
echo "najczęstsza data (ile razy):" && grep -o "następna: [0-9-]*" nauka-z-claude.md | sort | uniq -c | sort -rn | head -3
echo "sekcje:" && grep -c "^## Koncepty do poznania" nauka-z-claude.md
```
Expected:
- liczba pozycji **taka sama** jak w Step 2 (żadna nie zginęła),
- diagnozy na 7d: `27`,
- daty wcześniejsze niż dziś: `0`,
- najczęstsza data występuje **maksymalnie 4 razy**,
- sekcja `## Koncepty do poznania`: `1`.

- [ ] **Step 8: Zweryfikuj, że hook nadal widzi pozycje**

Odtwórz regex hooka bez uruchamiania samego hooka (uruchomienie nadpisałoby marker `powtorki-last-check.txt` i wyciszyło dzisiejsze przypomnienie):

```powershell
$content = Get-Content -Path 'D:\Notatki\notatki\nauka-z-claude.md' -Raw -Encoding UTF8
$duePattern = "nast$([char]0x0119)pna: (\d{4}-\d{2}-\d{2})"
$all = [regex]::Matches($content, $duePattern)
$today = Get-Date -Format 'yyyy-MM-dd'
$due = $all | Where-Object { $_.Groups[1].Value -le $today }
"dopasowania regexu: $($all.Count)"
"zaległe na dzis: $(($due | Measure-Object).Count)"
```
Expected: liczba dopasowań równa liczbie pozycji ze Step 7 (format nietknięty), a liczba zaległych ≤ 4 (tylko dzisiejsza porcja).

- [ ] **Step 9: Raport i brak commita**

Zdaj użytkownikowi raport: ile pozycji podniesiono na 7d, jak rozłożono daty, ile zaległych zostało na dziś, jakie sześć osi trafiło do rejestru. Powiedz wprost, że **żadna zmiana nie została zacommitowana** — całość leży w drzewie roboczym vaulta jako zmiany niezacommitowane, zgodnie z zasadą z globalnego `CLAUDE.md`.

---

## Weryfikacja końcowa (po wszystkich zadaniach)

- [ ] **Przegląd kryteriów akceptacji ze specu**

Przejdź kryteria 1–9 z sekcji „Kryteria akceptacji" specu i przy każdym wskaż zadanie, które je realizuje:

| Kryterium | Zadanie |
|---|---|
| 1. `/nauka-z-claude wyjaśnij` uruchamia ekspozycję z zakresem do zatwierdzenia | Task 2 |
| 2. „wyjaśnij mi X" **nie** uruchamia trybu | Task 2 (Step 1, Step 5) |
| 3. ≤ 3 pozycje z sesji wyjaśnij, tylko za mechanizmy, które się oparły | Task 2 (Step 3, pkt 5), Task 6 |
| 4. Test fundamentu zakłada wpis i pyta o przerwanie | Task 3 |
| 5. Kolejność pul i sufity 4 pytań | Task 4 |
| 6. Pytanie z notatki odpowiadalne wyłącznie z notatki | Task 5 (Step 2) |
| 7. `tidy-journal` rejestruje na 7d | Task 7 |
| 8. Rozkład dat ≤ 4 dziennie, diagnozy na 7d | Task 9 (Step 3–7) |
| 9. Hook działa bez zmian i liczy fundamenty | Task 9 (Step 8) |

- [ ] **Kontrola spójności całego SKILL.md**

Run:
```bash
grep -n "budżet\|sufit\|drabinka\|3d\|7d\|1d" "C:/Users/rafal/.claude/skills/nauka-z-claude/SKILL.md"
```
Sprawdź, czy nie ma dwóch sprzecznych liczb dla tej samej reguły: pula fundamentów startuje `1d`, pula notatek `7d` dla diagnozy i `3d` przy resecie, budżet 12 = 3 × 4.
