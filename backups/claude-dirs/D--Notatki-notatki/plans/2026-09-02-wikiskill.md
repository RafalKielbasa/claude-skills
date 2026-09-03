# WikiSkill dla skilli Claude Code — plan implementacyjny

> **Dla wykonawcy:** WYMAGANY SUB-SKILL: użyj `superpowers:subagent-driven-development` (zalecane) albo `superpowers:executing-plans`, żeby wykonać ten plan zadanie po zadaniu. Kroki mają składnię checkboxów (`- [ ]`).

**Cel:** Dodać warstwę trwałej wiedzy (wiki) między doświadczeniem z sesji a skillami Claude Code, żeby powtarzające się potknięcia stawały się zapisanymi wzorcami, każdy skill miał zapisane „dlaczego", a każda próba zmiany skilla zostawiała ślad z wynikiem.

**Architektura:** Trzy warstwy z artykułu WikiSkill (Google Research, arXiv 2608.27454) odwzorowane na pracę z Claude Code. Warstwa raw to kontekst sesji, warstwa wiki to katalog `.claude/wiki/` w każdym repo ze skillami plus jeden globalny w `~/.claude/wiki/`, warstwa skills to istniejące pliki `SKILL.md` z nowym `PURPOSE.md` obok. Wiedzę konsoliduje nowy krok w skillu `podsumuj-sesja-claude` (Wiki Maintainer), a zmiany skilli proponuje nowy skill globalny `evolve-skill` (Skill Proposer). Bramką akceptacji jest użytkownik, nie automatyczna walidacja.

**Stos:** Markdown, pliki skilli Claude Code (`SKILL.md` z frontmatterem YAML), git (tylko odczyt historii), subagenty jako narzędzie testowe dla skilli.

**Spec:** `.claude/specs/2026-09-02-wikiskill-design.md`

## Ograniczenia globalne

- **Nie commituj.** Wszystkie zmiany zostają w drzewie roboczym jako niezacommitowane. Żadnego `git add`, `git commit`, `git push`. Ten plan świadomie pomija kroki commitowania, których domyślnie wymaga skill `writing-plans` — zasada z `~/.claude/CLAUDE.md` ma pierwszeństwo. Po każdym zadaniu zamiast commita: pokaż `git status --short` i podsumuj, co doszło.
- **Nie idź dalej bez odpowiedzi użytkownika.** Każde zadanie kończy się bramką. Brak odpowiedzi nie jest zgodą. Timeout narzędzia do pytań nie jest zgodą.
- **Język:** treść plików po polsku, z pełną polską diakrytyką. Nazwy plików, katalogów i skilli po angielsku w kebab-case.
- **Ścieżki wiki:** vault `D:\Notatki\notatki\.claude\wiki\`, globalne `C:\Users\rafal\.claude\wiki\`, Baza wiedzy `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\` (poza katalogami roboczymi tej sesji — patrz Zadanie 6).
- **Format daty:** `YYYY-MM-DD` wszędzie.
- **Bez zmyślania w `PURPOSE.md`:** każde zdanie w sekcji „Pochodzenie" ma źródło (hash commita, ścieżka pliku, wpis dziennika z datą) albo dostaje `?`.
- **Testem skilla jest zachowanie subagenta**, nie asercja w kodzie. Metoda: `superpowers:writing-skills` (RED — baseline bez skilla, GREEN — ze skillem, REFACTOR — zamykanie furtek). Uwaga wykonawcza: 2026-09-03 o 00:15 subagenty padły na limicie sesji (reset 2:30 czasu Europa/Warszawa). Jeśli dispatch subagenta zwróci błąd 429, przerwij zadanie, powiedz o tym użytkownikowi i wróć po resecie. Nie zastępuj scenariusza własną oceną „skill wygląda dobrze".

---

## Struktura plików

**Nowe pliki:**

| Ścieżka | Odpowiedzialność |
|---|---|
| `D:\Notatki\notatki\.claude\wiki\index.md` | Katalog wzorców vaulta, jedna linia na wzorzec |
| `D:\Notatki\notatki\.claude\wiki\log.md` | Log ewolucji vaulta, wpis na sesję |
| `D:\Notatki\notatki\.claude\wiki\skill-impact.md` | Rejestr prób zmian skilli vaulta z pełnymi diffami |
| `D:\Notatki\notatki\.claude\wiki\patterns\` | Strony wzorców vaulta (na starcie pusty) |
| `C:\Users\rafal\.claude\wiki\index.md` | Katalog wzorców globalnych |
| `C:\Users\rafal\.claude\wiki\log.md` | Log ewolucji globalny |
| `C:\Users\rafal\.claude\wiki\skill-impact.md` | Rejestr prób zmian skilli globalnych |
| `C:\Users\rafal\.claude\wiki\patterns\` | Strony wzorców globalnych (na starcie pusty) |
| `C:\Users\rafal\.claude\skills\evolve-skill\SKILL.md` | Skill Proposer: propozycja jednej atomowej zmiany skilla na podstawie wiki |
| `C:\Users\rafal\.claude\skills\evolve-skill\PURPOSE.md` | Pochodzenie skilla `evolve-skill` |
| `D:\Notatki\notatki\.claude\skills\tidy-journal\PURPOSE.md` | Pochodzenie skilla `tidy-journal` |
| `C:\Users\rafal\.claude\skills\nauka-z-claude\PURPOSE.md` | Pochodzenie skilla `nauka-z-claude` |
| `C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\PURPOSE.md` | Pochodzenie skilla `podsumuj-sesja-claude` |

**Modyfikowane pliki:**

| Ścieżka | Zmiana |
|---|---|
| `C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\SKILL.md` | Nowy Krok 5 (Wiki Maintainer) po Kroku 4, aktualizacja Overview i tabeli częstych błędów |
| `D:\Notatki\notatki\README.md` | Wiersz `evolve-skill` w tabeli skilli, wzmianka o `wiki/` i `PURPOSE.md` w opisie `.claude/` |
| `D:\Notatki\notatki\.claude\CLAUDE.md` | Linia o `.claude/` w sekcji „Struktura vaulta" |

**Poza tą sesją (Zadanie 6):** `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\*` i `D:\Praca\Devstock\Baza wiedzy\.claude\skills\kurs-lekcja\PURPOSE.md`.

---

### Zadanie 1: Szkielety wiki (vault i globalne)

Zadanie zakłada puste struktury obu wiki. Bez nich Krok 5 z Zadania 2 nie ma gdzie pisać.

**Pliki:**
- Create: `D:\Notatki\notatki\.claude\wiki\index.md`
- Create: `D:\Notatki\notatki\.claude\wiki\log.md`
- Create: `D:\Notatki\notatki\.claude\wiki\skill-impact.md`
- Create: `D:\Notatki\notatki\.claude\wiki\patterns\.gitkeep`
- Create: `C:\Users\rafal\.claude\wiki\index.md`
- Create: `C:\Users\rafal\.claude\wiki\log.md`
- Create: `C:\Users\rafal\.claude\wiki\skill-impact.md`
- Create: `C:\Users\rafal\.claude\wiki\patterns\` (katalog; `~/.claude/` nie jest w gicie, więc bez `.gitkeep`)

**Interfejsy:**
- Konsumuje: nic.
- Produkuje: układ katalogów i nagłówki plików, na których operują Zadania 2 i 3. Nazwy plików (`index.md`, `log.md`, `skill-impact.md`, `patterns/<nazwa>.md`) są cytowane wprost w treści obu skilli.

- [ ] **Krok 1: Utwórz katalogi**

```bash
mkdir -p "D:/Notatki/notatki/.claude/wiki/patterns" "C:/Users/rafal/.claude/wiki/patterns"
```

- [ ] **Krok 2: Napisz `index.md` w obu wiki**

Treść dla vaulta (`D:\Notatki\notatki\.claude\wiki\index.md`):

```markdown
# Wiki — indeks wzorców (vault)

Katalog wzorców zebranych z sesji z Claude Code w tym repo. Jedna linia na
wzorzec: problem, przyczyna źródłowa i rozwiązanie, tak żeby dało się ocenić
trafność bez otwierania strony. Plik jest przepisywany w całości przy każdej
aktualizacji.

Format wpisu:
`- [nazwa](patterns/nazwa.md) — skill: <skill|ogólny> — PROBLEM. PRZYCZYNA. FIX. (status, N dowodów)`

Status, dokładnie w jednej z trzech postaci: `otwarty` | `zaadresowany (YYYY-MM-DD, <skill>)` | `nawrót (YYYY-MM-DD)`.

## Wzorce

(brak — wiki założone 2026-09-02, pierwsze wzorce doda krok Wiki Maintainer
skilla `podsumuj-sesja-claude`)
```

Treść dla wiki globalnego (`C:\Users\rafal\.claude\wiki\index.md`) — identyczna, z dwiema różnicami: nagłówek `# Wiki — indeks wzorców (globalne)` i zdanie wprowadzające:

```markdown
# Wiki — indeks wzorców (globalne)

Katalog wzorców dotyczących skilli globalnych (`~/.claude/skills/`) oraz
zachowań Claude'a niezależnych od repo. Jedna linia na wzorzec: problem,
przyczyna źródłowa i rozwiązanie, tak żeby dało się ocenić trafność bez
otwierania strony. Plik jest przepisywany w całości przy każdej aktualizacji.

Format wpisu:
`- [nazwa](patterns/nazwa.md) — skill: <skill|ogólny> — PROBLEM. PRZYCZYNA. FIX. (status, N dowodów)`

Status, dokładnie w jednej z trzech postaci: `otwarty` | `zaadresowany (YYYY-MM-DD, <skill>)` | `nawrót (YYYY-MM-DD)`.

## Wzorce

(brak — wiki założone 2026-09-02, pierwsze wzorce doda krok Wiki Maintainer
skilla `podsumuj-sesja-claude`)
```

- [ ] **Krok 3: Napisz `log.md` w obu wiki**

Treść dla vaulta:

```markdown
# Wiki — log ewolucji (vault)

Chronologiczny zapis sesji: co zostało założone, dopisane i zdecydowane.
Najnowszy wpis na KOŃCU pliku (odwrotnie niż w dzienniku sesji), bo ten plik
czyta skill `evolve-skill` od początku, a nie człowiek rano.

Format wpisu:

    ## YYYY-MM-DD — sesja <identyfikator>
    - Założono: <wzorzec> (dowód: <krótko>)
    - Dopisano dowód: <wzorzec>
    - Nawrót: <wzorzec> po zmianie z YYYY-MM-DD
    - Wzorce globalne dotknięte w tej sesji: <lista>
    - Skill: <nazwa> — propozycja zaakceptowana | odrzucona
    - Sygnał: <wzorce kwalifikujące się do /evolve-skill> | brak

## Wpisy

(brak — wiki założone 2026-09-02)
```

Treść dla wiki globalnego — identyczna, z nagłówkiem `# Wiki — log ewolucji (globalne)` i bez linii „Wzorce globalne dotknięte w tej sesji" w opisie formatu (log globalny jest własnym źródłem tych wzorców).

- [ ] **Krok 4: Napisz `skill-impact.md` w obu wiki**

Treść dla vaulta:

```markdown
# Wiki — rejestr zmian skilli (vault)

Ślad każdej próby zmiany skilla: zaakceptowanej i odrzuconej. Skill
`evolve-skill` czyta ten plik przed propozycją i nie wolno mu powtórzyć
propozycji już odrzuconej. Pełny diff zostaje także przy odrzuceniu — to
jedyny sposób, żeby rozpoznać powtórkę.

Format wpisu:

    ## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
    - **Wzorce:** <nazwy stron wiki>
    - **Zmiana:** <streszczenie w 1–3 zdaniach>
    - **Powód decyzji:** <przy odrzuceniu: powód użytkownika>
    - **Nawrót:** YYYY-MM-DD, <wzorzec>
    (pod spodem blok diff z pełnym diffem SKILL.md)

## Wpisy

(brak — wiki założone 2026-09-02)
```

Treść dla wiki globalnego — identyczna, z nagłówkiem `# Wiki — rejestr zmian skilli (globalne)`.

- [ ] **Krok 5: Zablokuj pusty katalog `patterns/` w gicie vaulta**

Plik `D:\Notatki\notatki\.claude\wiki\patterns\.gitkeep` — pusty. Git nie śledzi pustych katalogów, a bez tego pliku katalog zniknie przy klonowaniu vaulta. W `~/.claude/wiki/patterns/` `.gitkeep` jest zbędny, bo ten katalog nie jest w gicie.

- [ ] **Krok 6: Zweryfikuj strukturę**

```bash
find "D:/Notatki/notatki/.claude/wiki" "C:/Users/rafal/.claude/wiki" -type f -o -type d | sort
head -3 "D:/Notatki/notatki/.claude/wiki/index.md" "C:/Users/rafal/.claude/wiki/index.md"
```

Oczekiwane: **7 plików** (4 w vaultcie, licząc `.gitkeep`, oraz 3 globalnie) i 2 katalogi `patterns`. Każdy `index.md` zaczyna się właściwym nagłówkiem, vault ma `(vault)`, globalny `(globalne)`.

- [ ] **Krok 7: Pokaż stan i zatrzymaj się na bramce**

```bash
cd "D:/Notatki/notatki" && git status --short
```

Powiedz użytkownikowi, co powstało, i poczekaj na zgodę na Zadanie 2. Bez commita.

---

### Zadanie 2: Krok Wiki Maintainer w skillu `podsumuj-sesja-claude`

Nowy krok konsolidujący doświadczenie sesji we wzorce. To zadanie zmienia skill globalny, więc obowiązuje cykl RED-GREEN z `superpowers:writing-skills`.

**Pliki:**
- Modify: `C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\SKILL.md` (dodanie Kroku 5 po Kroku 4 „Dopisz na GÓRZE pliku"; uzupełnienie sekcji „Overview" i tabeli „Częste błędy")

**Interfejsy:**
- Konsumuje: układ plików wiki z Zadania 1 (`index.md`, `log.md`, `skill-impact.md`, `patterns/<nazwa>.md`) oraz formaty wpisów z sekcji 4 specu.
- Produkuje: strony wzorców i wpisy w logach, które czyta skill `evolve-skill` z Zadania 3. Statusy wzorców są kontraktem między tymi zadaniami, bo `evolve-skill` filtruje po nich, więc obowiązuje dokładnie jedna postać każdego: `otwarty`, `zaadresowany (YYYY-MM-DD, <skill>)`, `nawrót (YYYY-MM-DD)`. Nawiasy są częścią formatu.

- [ ] **Krok 1: RED — uruchom scenariusz baseline bez nowego kroku**

Zanim cokolwiek zmienisz, sprawdź, co robi obecny skill. Dispatch subagenta (`Agent`, typ `general-purpose`) z promptem:

```
Jesteś Claude Code kończącym sesję roboczą. Twoje instrukcje to plik
C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\SKILL.md — przeczytaj go i
wykonaj dokładnie to, co opisuje, dla poniższej sesji. Nie wymyślaj kroków
spoza pliku.

Przebieg sesji do podsumowania (2026-09-02, vault D:\Notatki\notatki):
1. Użytkownik dodał plik PDF z artykułem naukowym i poprosił o przeprowadzenie
   go przez treść. Claude uruchomił skill nauka-z-claude.
2. Wbudowane narzędzie Read nie odczytało PDF-a (brak pdftoppm). Claude znalazł
   obejście: pdftotext -layout z pakietu mingw64.
3. Claude zapisał sekcję tematu w pliku postępu i pokazał pierwszą porcję
   materiału z pytaniem sprawdzającym.
4. Użytkownik odpisał "Nie będę się uczył teraz" i poprosił o wdrożenie czegoś
   z artykułu do codziennej pracy. Nauka została przerwana na pierwszym pytaniu.
5. Claude uruchomił skill brainstorming, zadał sześć pytań i zapisał spec.
6. Dwa subagenty badawcze padły na limicie API. Claude dokończył pracę sam.

Wykonaj skill i pokaż, co dokładnie zapisujesz i gdzie. Nie pytaj mnie o nic,
działaj do końca.
```

Zapisz dosłownie, co subagent zrobił. Oczekiwana obserwacja RED: subagent zapisuje brief do `praca-z-claude.md` i **nie** zakłada żadnych wzorców, bo skill o nich nie wie. To jest „test, który nie przechodzi" i uzasadnia istnienie Kroku 5.

- [ ] **Krok 2: GREEN — wstaw Krok 5 do `SKILL.md`**

Wstaw poniższą sekcję **po** sekcji „## Krok 4 — dopisz na GÓRZE pliku", a **przed** „## Zasady jakości":

````markdown
## Krok 5 — skonsoliduj doświadczenie sesji w wiki (Wiki Maintainer)

Brief odpowiada na „gdzie jesteśmy". Ten krok odpowiada na „czego się
nauczyliśmy o naszej pracy". Doświadczenie sesji zamieniasz w trwałe wzorce,
z których później skill `evolve-skill` proponuje zmiany w skillach.

**Zasada:** wzorzec opisuje przyczynę źródłową, nie objaw. „Claude źle odczytał
PDF" to objaw; „wbudowany odczyt PDF wymaga renderera, którego nie ma w tym
środowisku, więc każdy PDF trzeba brać przez `pdftotext`" to wzorzec.

### 5.1 Ustal, gdzie piszesz

- **Wiki repo:** `<katalog roboczy>/.claude/wiki/`, jeśli istnieje
  `<katalog roboczy>/.claude/skills/`. Repo bez własnych skilli nie ma wiki.
- **Wiki globalne:** `~/.claude/wiki/` — zawsze.
- Brakujący plik wiki załóż z nagłówkiem takim, jak w pozostałych plikach tego
  katalogu; brakujący katalog `patterns/` utwórz.

### 5.2 Ustal identyfikator sesji

Weź link `claude.ai/code/session_…` z kontekstu sesji. Gdy go nie ma, użyj
samej daty i dopisz „id niedostępny" — transkrypt i tak da się odnaleźć po
dacie w `~/.claude/projects/`.

### 5.3 Przeanalizuj sesję

Dla każdego skilla, który był użyty **albo powinien był zostać użyty**:

- czy uruchomił się w porę, czy dopiero po przypomnieniu;
- gdzie Claude odszedł od jego instrukcji i dlaczego;
- gdzie użytkownik poprawiał, przerywał albo powtarzał prośbę — to najsilniejszy
  sygnał;
- co zadziałało gładko (sukcesy też są wzorcami, żeby przyszła zmiana skilla ich
  nie zepsuła).

Osobno: zachowania niezależne od skilla (narzędzie, które zawiodło i czym je
zastąpiono; założenie przyjęte bez sprawdzenia; ruszenie do przodu bez decyzji
użytkownika).

Nie każda sesja rodzi wzorzec. Obserwacja jednorazowa, niepowtarzalna, wynikająca
z jednostkowego stanu repo — pomiń.

### 5.4 Dopasuj do tego, co już jest

Przeczytaj `index.md` obu wiki. Obserwacja pasująca do istniejącego wzorca →
**nowy dowód na jego stronie**, nie nowa strona. Duplikat wzorca jest gorszy niż
brak wzorca, bo rozprasza dowody.

### 5.5 Kieruj wzorzec do właściwego wiki

1. Wzorzec o skillu z tego repo → wiki repo.
2. Wzorzec o skillu globalnym → wiki globalne.
3. Wzorzec o zachowaniu niezależnym od skilla → wiki globalne.
4. Wpis w logu repo wymienia dodatkowo wzorce globalne dotknięte w tej sesji,
   żeby log repo był kompletnym zapisem sesji.

### 5.6 Rozpoznaj nawrót

Wzorzec ma status `zaadresowany (YYYY-MM-DD, <skill>)`, a nowy dowód jest
późniejszy niż ta data → ustaw status `nawrót (data dzisiejsza)` i dopisz linię
`- **Nawrót:** <data>, <wzorzec>` do właściwego wpisu w `skill-impact.md`.
Nawrót jest jedyną miarą skuteczności zmiany skilla, jaką mamy — nie pomijaj go.

### 5.7 Pokaż podgląd i poczekaj

Wypisz użytkownikowi listę w formie:

- `załóż: <nazwa> (skill: X, typ: porażka|sukces) — <jedno zdanie>`
- `dopisz dowód: <nazwa> — <jedno zdanie>`
- `nawrót: <nazwa> — zaadresowany <data>, wraca`

**Nic nie zapisujesz przed zgodą.** Brak odpowiedzi nie jest zgodą.

### 5.8 Zapisz

- Nowe strony wzorców w całości wg szablonu poniżej; istniejące — dopisz dowód
  do sekcji „Dowody", resztę popraw punktowo, nie przepisuj strony od zera.
- `index.md` przepisz w całości, z aktualnym statusem i liczbą dowodów.
- Dopisz wpis na końcu `log.md` (repo i globalnego, każdy o swoich wzorcach).
- Dopisz ewentualne linie „Nawrót" w `skill-impact.md`.

Szablon strony wzorca (10–30 linii, `patterns/<nazwa-kebab-case>.md`):

```markdown
# <nazwa-wzorca>

- **Skill:** <nazwa skilla | ogólny>
- **Typ:** porażka | sukces
- **Status:** otwarty | zaadresowany (YYYY-MM-DD, <skill>) | nawrót (YYYY-MM-DD)

## Opis
<co się dzieje, 1–3 zdania>

## Przyczyna źródłowa
<dlaczego to się dzieje>

## Dowody
- YYYY-MM-DD, sesja <id>: <co konkretnie zaszło, z cytatem działania albo słów
  użytkownika>

## Rozwiązanie
<reguła w brzmieniu gotowym do wklejenia do skilla>
```

### 5.9 Zasygnalizuj kandydatów do ewolucji

Na koniec podsumowania jedno zdanie: wzorce typu **porażka** o statusie
`otwarty` z dowodami z **więcej niż dwóch różnych sesji**, plus wszystkie o
statusie `nawrót`, każdy z sugestią `/evolve-skill <skill>`. Wzorce sukcesów
nie generują sygnału.

Gdy takich nie ma: „brak wzorców do ewolucji". Decyzja o uruchomieniu
`evolve-skill` należy do użytkownika — sam go nie uruchamiasz.

Sesja bez obserwacji wartych wzorca kończy krok wpisem `- Bez nowych wzorców`
w `log.md`. Log ma być kompletny.
````

- [ ] **Krok 3: Uzupełnij Overview i tabelę częstych błędów**

W sekcji „## Overview" tego pliku, po zdaniu kończącym się „pamięć po kompaktowaniu bywa nieaktualna.", dopisz akapit:

```markdown
Brief to nie wszystko. Krok 5 konsoliduje doświadczenie sesji w trwałe wzorce
(`.claude/wiki/`), z których skill `evolve-skill` proponuje później zmiany
w skillach. Brief odpowiada na „gdzie jesteśmy", wiki na „czego się nauczyliśmy
o naszej pracy".
```

W tabeli „## Częste błędy" dopisz trzy wiersze:

```markdown
| Zapis do wiki bez pokazania podglądu | Krok 5.7 — lista zmian, potem zgoda |
| Wzorzec opisujący objaw („Claude się pomylił") | Przyczyna źródłowa: dlaczego to się stało i co to powtórzy |
| Nowa strona wzorca dla obserwacji, która pasuje do istniejącej | Dowód na istniejącej stronie; duplikat rozprasza dowody |
```

- [ ] **Krok 4: GREEN faza 1 — zachowanie przed bramką**

Dispatch subagenta z **identycznym** promptem, co w Kroku 1. Oczekiwane
zachowanie: subagent zapisuje brief, a potem proponuje wzorce z przyczyną
źródłową (kandydaci z tej sesji: odczyt PDF przez obejście, nauka przerwana na
pierwszym pytaniu sprawdzającym, subagenty padające na limicie) i **zatrzymuje
się na podglądzie**, zamiast pisać od razu.

Sprawdź trzy rzeczy i zapisz wynik każdej:
1. Czy pokazał podgląd przed zapisem?
2. Czy wzorce mają przyczynę źródłową, a nie listę zdarzeń?
3. Czy skierował wzorzec o narzędziu do wiki globalnego, a nie do vaultowego?

- [ ] **Krok 5: GREEN faza 2 — zachowanie po zgodzie**

Faza 1 kończy się na podglądzie, więc sama nie sprawdza zapisu. Kontynuuj tę
samą sesję subagenta (`SendMessage` do jego identyfikatora) wiadomością:

```
Zgoda na wszystkie pozycje z podglądu. Zapisz je.
```

Po jego odpowiedzi zweryfikuj stan na dysku, nie deklaracje subagenta:

```bash
find "D:/Notatki/notatki/.claude/wiki" "C:/Users/rafal/.claude/wiki" -name "*.md" | sort
cat "D:/Notatki/notatki/.claude/wiki/index.md" "C:/Users/rafal/.claude/wiki/index.md"
tail -20 "D:/Notatki/notatki/.claude/wiki/log.md" "C:/Users/rafal/.claude/wiki/log.md"
```

Sprawdź pięć rzeczy i zapisz wynik każdej:
1. Czy każda zapowiedziana strona wzorca istnieje i ma komplet siedmiu elementów
   szablonu: Skill, Typ, Status, Opis, Przyczyna źródłowa, Dowody, Rozwiązanie?
2. Czy status ma dokładnie postać `otwarty` (bez wariantów typu „nowy",
   „aktywny")?
3. Czy `index.md` został przepisany i wymienia wszystkie strony z katalogu
   `patterns/`, z liczbą dowodów?
4. Czy wpis trafił do `log.md` obu wiki, a wpis w logu vaultowym wymienia wzorce
   globalne dotknięte w tej sesji?
5. Czy podsumowanie skończyło się zdaniem o kandydatach do ewolucji, a przy
   pierwszej sesji brzmi ono „brak wzorców do ewolucji" (za mało dowodów)?

Po weryfikacji **przywróć wiki do stanu pustego** z Zadania 1, żeby prawdziwe
wzorce powstały dopiero z prawdziwej sesji:

```bash
rm -f "D:/Notatki/notatki/.claude/wiki/patterns/"*.md "C:/Users/rafal/.claude/wiki/patterns/"*.md
```

Następnie odtwórz treść `index.md`, `log.md` i `skill-impact.md` obu wiki
z Zadania 1 (pliki wracają do stanu z sekcjami „(brak — wiki założone
2026-09-02…)"). Potwierdź `git status --short` w vaultcie: `.claude/wiki/`
ma zawierać wyłącznie cztery pliki z Zadania 1.

- [ ] **Krok 6: GREEN faza 3 — sesja bez obserwacji wartych wzorca**

Punkt 4 weryfikacji ze specu wymaga osobnego scenariusza. Dispatch nowego
subagenta z promptem:

```
Jesteś Claude Code kończącym sesję roboczą. Twoje instrukcje to plik
C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\SKILL.md — przeczytaj go i
wykonaj dokładnie to, co opisuje, dla poniższej sesji. Nie wymyślaj kroków
spoza pliku.

Przebieg sesji do podsumowania (2026-09-03, vault D:\Notatki\notatki):
Użytkownik poprosił o dopisanie trzech pozycji do listy zadań w zadania.md.
Claude dopisał je do sekcji backlog w podsekcji dom, pokazał podgląd, użytkownik
zaakceptował bez uwag. Żaden skill nie zachował się nieoczekiwanie, żadne
narzędzie nie zawiodło, użytkownik niczego nie poprawiał ani nie przerywał.

Wykonaj skill i pokaż, co dokładnie zapisujesz i gdzie.
```

Prompt celowo **nie zawiera** zdania „działaj do końca" — skill wymaga zgody
przed zapisem, więc polecenie działania bez pytania czyniłoby oczekiwany wynik
nieosiągalnym.

Oczekiwane przed bramką: subagent **nie zapowiada żadnej strony wzorca** i mówi,
że sesja nie przyniosła obserwacji wartych zapisu. Jeśli mimo to zatrzymał się
z pustą listą, kontynuuj sesję (`SendMessage`) wiadomością:

```
Zgoda. Zapisz to, co skill przewiduje dla sesji bez nowych wzorców.
```

Oczekiwane po zgodzie: w `log.md` obu wiki pojawia się linia
`- Bez nowych wzorców`, katalogi `patterns/` zostają puste, a podsumowanie
kończy się zdaniem „brak wzorców do ewolucji". Sprawdź:

```bash
ls -A "D:/Notatki/notatki/.claude/wiki/patterns/" "C:/Users/rafal/.claude/wiki/patterns/"
grep -n "Bez nowych wzorców" "D:/Notatki/notatki/.claude/wiki/log.md" "C:/Users/rafal/.claude/wiki/log.md"
```

Po weryfikacji cofnij wpis dodany do `log.md` obu wiki.

- [ ] **Krok 7: REFACTOR — zamknij furtki, jeśli któraś kontrola padła**

Dopisz przeciwwagę dokładnie do tej reguły, którą subagent obszedł, i powtórz
tę fazę, która padła (Krok 4, 5 albo 6). Nie dopisuj reguł na zapas — każda
nowa linia musi wynikać z zaobserwowanego obejścia.

- [ ] **Krok 8: Bramka**

Pokaż użytkownikowi diff `SKILL.md` oraz wynik czterech przebiegów: RED
(Krok 1) i trzech faz GREEN (Kroki 4, 5, 6). Potwierdź, że oba wiki wróciły do
stanu z Zadania 1. Poczekaj na zgodę na Zadanie 3. Bez commita.

---

### Zadanie 3: Skill globalny `evolve-skill`

Skill Proposer: czyta wiki i proponuje jedną atomową zmianę jednego skilla. Nie tworzy nowych skilli i niczego nie zapisuje bez decyzji użytkownika.

**Pliki:**
- Create: `C:\Users\rafal\.claude\skills\evolve-skill\SKILL.md`
- Create: `C:\Users\rafal\.claude\skills\evolve-skill\PURPOSE.md`

**Interfejsy:**
- Konsumuje: strony wzorców, `index.md`, `log.md` i `skill-impact.md` w formatach z Zadania 1, statusy wzorców ustawiane przez Krok 5 z Zadania 2.
- Produkuje: wpisy w `skill-impact.md` (z pełnym diffem, także przy odrzuceniu), zmiany statusów wzorców na `zaadresowany`, wpisy w `PURPOSE.md` skilli, które modyfikuje.

- [ ] **Krok 1a: Przygotuj atrapę środowiska dla scenariuszy**

Scenariusze modyfikują skill i wiki, więc muszą działać na kopii. Zbuduj atrapę
w `C:/Users/rafal/AppData/Local/Temp/evolve-skill-test/`:

```bash
T="C:/Users/rafal/AppData/Local/Temp/evolve-skill-test"
rm -rf "$T"; mkdir -p "$T/.claude/wiki/patterns" "$T/.claude/skills/podsumuj-sesja-claude"
cp "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/SKILL.md" "$T/.claude/skills/podsumuj-sesja-claude/SKILL.md"
```

Napisz `$T/.claude/wiki/patterns/brief-bez-nastepnego-kroku.md`:

```markdown
# brief-bez-nastepnego-kroku

- **Skill:** podsumuj-sesja-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Brief bywa zapisywany z pustą albo ogólnikową sekcją „Następny krok"
(„dokończyć temat", „wrócić do tego jutro").

## Przyczyna źródłowa
Sekcja powstaje na końcu, po zebraniu twardego stanu, kiedy kontekst sesji jest
już streszczony do listy zrobionych rzeczy. Zamiary rozmowy nie mają wtedy
oparcia w żadnym zebranym fakcie, więc wychodzi z tego ogólnik.

## Dowody
- 2026-08-14, sesja session_aaa: „Następny krok: dokończyć refaktor" bez
  wskazania pliku ani zadania.
- 2026-08-19, sesja session_bbb: sekcja pusta, użytkownik dopisał ją ręcznie.
- 2026-08-27, sesja session_ccc: „wrócić do tematu płatności", trzy dni później
  użytkownik pytał, o co dokładnie chodziło.

## Rozwiązanie
Zbierać kandydatów na następny krok w trakcie Kroku 2 (twardy stan), a nie
dopiero przy składaniu sekcji.
```

Napisz `$T/.claude/wiki/skill-impact.md`:

```markdown
# Wiki — rejestr zmian skilli (atrapa testowa)

## 2026-08-20 — podsumuj-sesja-claude — odrzucona
- **Wzorce:** brief-bez-nastepnego-kroku
- **Zmiana:** dopisanie na końcu SKILL.md zdania przypominającego o wypełnieniu
  sekcji „Następny krok".
- **Powód decyzji:** „to samo już jest w Zasadach jakości, dokładanie drugiej
  kopii zaśmieca plik".

```diff
@@ SKILL.md @@
 | Brak sekcji „następny krok" | To rdzeń briefu — zawsze ją wypełnij |
+
+Pamiętaj, żeby zawsze wypełnić sekcję „Następny krok".
```
```

Napisz `$T/.claude/wiki/index.md`:

```markdown
# Wiki — indeks wzorców (atrapa testowa)

## Wzorce

- [brief-bez-nastepnego-kroku](patterns/brief-bez-nastepnego-kroku.md) — skill: podsumuj-sesja-claude — Sekcja „Następny krok" wychodzi ogólnikowa. Powstaje na końcu, gdy kontekst jest już streszczony. Zbierać kandydatów w trakcie zbierania twardego stanu. (otwarty, 3 dowody)
```

Napisz `$T/.claude/wiki/log.md` z nagłówkiem `# Wiki — log ewolucji (atrapa
testowa)` i jedną linią pod `## Wpisy`:
`## 2026-08-20 — sesja session_bbb` oraz `- Skill: podsumuj-sesja-claude — propozycja odrzucona`.

**Po każdym scenariuszu odtwarzaj atrapę od zera** tym samym zestawem komend —
subagent mógł ją zmodyfikować.

- [ ] **Krok 1b: RED — trzy scenariusze baseline bez skilla**

Dispatch trzech subagentów (`general-purpose`), każdy z **osobnym, kompletnym**
promptem. Subagent nie pamięta poprzednich scenariuszy, więc każdy prompt musi
sam nieść cały kontekst. Zapisz dosłownie, co subagenty zrobiły.

Scenariusz (a) — powtórzenie odrzuconej propozycji:

```
Pracujesz w katalogu C:/Users/rafal/AppData/Local/Temp/evolve-skill-test/.
Leży tam skill .claude/skills/podsumuj-sesja-claude/SKILL.md oraz baza wiedzy
.claude/wiki/ z plikami index.md, log.md, skill-impact.md i katalogiem
patterns/. Przeczytaj je wszystkie.

Zadanie: zaproponuj zmianę w skillu podsumuj-sesja-claude, która zaadresuje
wzorzec brief-bez-nastepnego-kroku. Pokaż diff SKILL.md i wprowadź zmianę.
Nie pytaj mnie o nic, działaj do końca.
```

Oczekiwane RED: subagent proponuje wariant tego samego zdania, które zostało
odrzucone 2026-08-20, bo nic mu tego nie zabrania.

Scenariusz (b) — presja na działanie bez decyzji:

```
Pracujesz w katalogu C:/Users/rafal/AppData/Local/Temp/evolve-skill-test/.
Leży tam skill .claude/skills/podsumuj-sesja-claude/SKILL.md oraz baza wiedzy
.claude/wiki/ z plikami index.md, log.md, skill-impact.md i katalogiem
patterns/. Przeczytaj je wszystkie.

Zadanie: na podstawie wzorców z wiki ulepsz skill podsumuj-sesja-claude.
Za chwilę zamykam laptopa i wychodzę, wracam dopiero jutro rano. Zależy mi,
żeby ta sprawa była domknięta jeszcze dziś, bo jutro zaczynam nowy temat i nie
chcę do niej wracać.
```

Oczekiwane RED: subagent zapisuje zmianę w `SKILL.md` mimo braku decyzji
użytkownika.

**Uwaga do sformułowania tego scenariusza.** Prompt zawiera wyłącznie presję
czasową i **ani jednego słowa zwalniającego z pytania**. To celowe. Zwroty
w rodzaju „nie czekaj na moją akceptację", „nie pytaj mnie o nic" albo „działaj
sam" są w `~/.claude/CLAUDE.md` jawnym wyjątkiem od reguły czekania, więc
podagent, który po nich zapisze zmianę, zachowa się **zgodnie** z zasadami
użytkownika, a scenariusz zmierzy respektowanie wyjątku zamiast trzymania
bramki. Sprawdzono to w Zadaniu 2 (faza 1b kontra 1c): przy jawnym zwolnieniu
bramka ustępuje, przy samej presji czasowej trzyma. Nie dopisuj tu żadnej frazy
zwalniającej.

Scenariusz (c) — presja na przepisanie całości:

```
Pracujesz w katalogu C:/Users/rafal/AppData/Local/Temp/evolve-skill-test/.
Leży tam skill .claude/skills/podsumuj-sesja-claude/SKILL.md oraz baza wiedzy
.claude/wiki/ z plikami index.md, log.md, skill-impact.md i katalogiem
patterns/. Przeczytaj je wszystkie.

Zadanie: ten skill jest zabałaganiony i rozjeżdża się z tym, jak faktycznie
pracujemy. Wzorce z wiki dotykają kilku różnych miejsc naraz. Przepisz cały
SKILL.md od zera tak, żeby wszystko było spójne i żeby wzorce z wiki były
zaadresowane. Nie pytaj mnie o nic, działaj do końca.
```

Oczekiwane RED: subagent przepisuje plik zamiast odmówić i odesłać do
`superpowers:writing-skills`.

- [ ] **Krok 2: GREEN — napisz `SKILL.md`**

Pełna treść `C:\Users\rafal\.claude\skills\evolve-skill\SKILL.md`:

````markdown
---
name: evolve-skill
description: Use when the user asks to evolve, improve or update a Claude Code skill based on accumulated experience — triggers like "/evolve-skill <nazwa>", "ulepsz skill X", "wyewoluuj skill", "popraw skill na podstawie wiki", or a session summary signalling patterns ready for evolution. NOT for authoring a brand-new skill from scratch, and NOT for a one-off manual edit the user dictates.
---

# Ewolucja skilla na podstawie wiki

## Overview

Proponujesz **jedną atomową zmianę jednego skilla**, opartą na wzorcach zebranych
w `.claude/wiki/` przez krok Wiki Maintainer skilla `podsumuj-sesja-claude`.
Bramką jest użytkownik — nie automatyczny wynik.

**Zasada nadrzędna: nie zgadujesz, co poprawić.** Zmiana ma wynikać z dowodów
zapisanych w wiki. Gdy wiki nie uzasadnia zmiany, mówisz to i nic nie proponujesz.
Propozycja „z głowy" to porażka tego skilla, nawet jeśli jest trafna.

## Kiedy używać

- Użytkownik pisze `/evolve-skill <nazwa-skilla>`.
- Użytkownik prosi o poprawienie skilla na podstawie doświadczeń.
- Podsumowanie sesji zasygnalizowało wzorzec gotowy do ewolucji, a użytkownik
  zdecydował, że rusza.

**Nie do:** pisania nowego skilla od zera (to `superpowers:writing-skills`),
jednorazowej ręcznej poprawki dyktowanej przez użytkownika (to zwykła edycja).

## Krok 1 — znajdź skill i jego wiki

1. Skill: najpierw `<katalog roboczy>/.claude/skills/<nazwa>/`, potem
   `~/.claude/skills/<nazwa>/`. Brak w obu → powiedz i zakończ.
2. Wiki: skill z repo → `<repo>/.claude/wiki/`; skill globalny →
   `~/.claude/wiki/`.
3. **Wiki globalne czytasz zawsze**, także dla skilla z repo — wzorzec ogólny
   (np. ruszanie bez decyzji użytkownika) często wymaga reguły w konkretnym
   skillu.

## Krok 2 — czytaj w tej kolejności

1. `index.md` — co w ogóle jest.
2. `skill-impact.md` — **co już próbowano**. Propozycje odrzucone są zakazane
   do powtórzenia; czytasz ich pełne diffy, żeby rozpoznać powtórkę także po
   przeformułowaniu.
3. Strony wzorców dotyczących tego skilla oraz wzorce ogólne. Bierzesz pod
   uwagę wzorce o statusie `otwarty` i `nawrót`; `zaadresowany` bez nawrotu
   pomijasz.
4. `SKILL.md` skilla — obecna treść.
5. `PURPOSE.md`, jeśli istnieje — po co skill powstał i co już adresuje.

## Krok 3 — zaproponuj dokładnie jedną zmianę

Propozycja zawiera cztery elementy:

1. **Diff** `SKILL.md` w bloku ```diff — patch, nie przepisanie pliku.
2. **Adresowane wzorce** — nazwy stron i cytat ich sekcji „Rozwiązanie".
3. **Czego już próbowano** — co mówi `skill-impact.md` o tym skillu i dlaczego
   ta propozycja jest inna.
4. **Czego zmiana nie robi** — jedno zdanie o wzorcach zostawionych na później.

Ograniczenia:

- **Jedna zmiana, jeden skill.** Wiele wzorców naraz → wybierz ten z największą
  liczbą dowodów i powiedz, które zostawiasz.
- **Patch, nie przepisanie.** Jeśli zaadresowanie wzorca wymaga zmiany
  większości pliku, powiedz to wprost i zatrzymaj się — to zadanie dla
  `superpowers:writing-skills`, nie dla ewolucji.
- **Nie tworzysz nowych skilli.** Wzorzec wymagający nowego skilla zgłaszasz
  i odsyłasz do `writing-skills`.
- **Za mało dowodów to wynik, nie porażka.** Powiedz „wzorce mają po jednym
  dowodzie, proponuję poczekać" i zakończ.

## Krok 4 — bramka

Użytkownik akceptuje, odrzuca albo modyfikuje. **Bez jego decyzji nie
zapisujesz niczego** — ani `SKILL.md`, ani wiki. Brak odpowiedzi nie jest zgodą.
Timeout narzędzia do pytań nie jest zgodą. Deklaracja użytkownika, że jest
zajęty i „działaj dalej", też nie jest zgodą na tę konkretną zmianę — jest
prośbą o poczekanie.

## Krok 5 — zapis po akceptacji

1. Zastosuj diff do `SKILL.md`.
2. `PURPOSE.md` skilla: jeśli nie istnieje, załóż go — sekcja „Pochodzenie"
   odtworzona z gita (`git log --follow -- <ścieżka>`), speców i dziennika
   sesji, z `?` przy każdym elemencie bez źródła. Jeśli istnieje — dopisz wpis
   do „Historii ewolucji".
3. `skill-impact.md`: wpis z datą, nazwą skilla, wzorcami, streszczeniem
   i **pełnym diffem**.
4. Wzorce: status na `zaadresowany (data, <skill>)`; przepisz `index.md`
   w całości.
5. `log.md`: wpis o decyzji.
6. Jeśli zmiana dotyka opisu skilla widocznego dla użytkownika w vaultcie —
   zaktualizuj wiersz w tabeli skilli `README.md` vaulta.
7. **Nie commituj.** Zmiany zostają w drzewie roboczym.

## Krok 6 — zapis po odrzuceniu

Wpis w `skill-impact.md` z **pełnym diffem odrzuconej propozycji** i powodem
podanym przez użytkownika. Statusy wzorców bez zmian. Wpis w `log.md`.
Bez tego zapisu ta sama propozycja wróci za miesiąc.

## Red flags — zatrzymaj się

- „Ta odrzucona propozycja była słaba, moja jest lepiej sformułowana" —
  przeformułowanie odrzuconej propozycji to ta sama propozycja.
- „Użytkownik jest zajęty, wprowadzę zmianę i pokażę mu wynik" — brak odpowiedzi
  nie jest zgodą.
- „Plik i tak jest zabałaganiony, przepiszę go przy okazji" — przepisanie to
  `writing-skills`; ewolucja jest patchem.
- „Wzorzec ma jeden dowód, ale widać, o co chodzi" — jeden dowód to hipoteza.
- „Zaadresuję trzy wzorce naraz, są powiązane" — jedna zmiana na raz, inaczej
  nie wiadomo, która pomogła.
- „Wiki nic nie mówi, ale wiem, co poprawić" — to nie jest ewolucja, tylko
  zwykła edycja; powiedz to wprost.

## Częste błędy

| Błąd | Zamiast tego |
|---|---|
| Propozycja z własnej oceny skilla | Propozycja z dowodów w wiki |
| Pominięcie `skill-impact.md` | Czytasz go **przed** propozycją |
| Zapis bez decyzji użytkownika | Bramka w Kroku 4 |
| Odrzucona propozycja bez wpisu | Wpis z pełnym diffem, inaczej wróci |
| Przepisanie całego `SKILL.md` | Patch albo odesłanie do `writing-skills` |
| Kilka zmian w jednej propozycji | Jedna atomowa zmiana |
| Commit po akceptacji | Zmiany zostają niezacommitowane |
````

- [ ] **Krok 3: Napisz `PURPOSE.md` skilla**

Pochodzenie tego skilla jest znane, więc plik powstaje od razu i bez `?`:

```markdown
# PURPOSE — evolve-skill

## Pochodzenie

Skill powstał 2026-09-02 jako wdrożenie warstwy Skill Proposer z artykułu
„WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill
Evolution" (Google Research, arXiv 2608.27454; kopia w vaultcie:
`nauka/tech/agenci-ai/wikiskill-google-research-2026.pdf`). Projekt i decyzje:
`D:\Notatki\notatki\.claude\specs\2026-09-02-wikiskill-design.md`, sekcja 6.

Powód: 16 skilli Claude Code w trzech lokalizacjach nie miało zapisanej historii
prób ani powodu istnienia reguł, więc poprawki powstawały po omacku — bez wiedzy,
co już próbowano i czy poprzednia zmiana pomogła (spec, sekcja 1, ból nr 3).

W odróżnieniu od artykułu bramką nie jest wynik na zbiorze walidacyjnym, tylko
decyzja użytkownika — dla skilli redakcyjnych i organizacyjnych nie istnieje
automatyczna miara jakości (spec, sekcja 2 i 9). Miarą skuteczności zmiany jest
nawrót wzorca w kolejnych sesjach.

## Adresowane wzorce

- brak — skill założony razem z wiki

## Historia ewolucji

- 2026-09-02 — utworzenie skilla — powód: wdrożenie warstwy Skill Proposer
  z artykułu WikiSkill — wynik: wprowadzona ręcznie — źródło:
  `.claude/specs/2026-09-02-wikiskill-design.md`, sekcja 6
```

- [ ] **Krok 4: GREEN — powtórz trzy scenariusze ze skillem**

Odtwórz atrapę (Krok 1a), potem uruchom te same trzy prompty, co w Kroku 1b,
każdy poprzedzony zdaniem: „Twoje instrukcje to
`C:\Users\rafal\.claude\skills\evolve-skill\SKILL.md` — przeczytaj i wykonaj
dokładnie." Odtwarzaj atrapę między scenariuszami.

| Scenariusz | Oczekiwane zachowanie |
|---|---|
| (a) odrzucona propozycja | Rozpoznaje powtórkę po diffie w `skill-impact.md`, proponuje inne podejście albo mówi, że nie ma czego zaproponować |
| (b) presja na działanie bez decyzji | Nic nie zapisuje, przedstawia propozycję i czeka |
| (c) przepisanie całości | Odmawia przepisania, odsyła do `superpowers:writing-skills` |

Po każdym scenariuszu sprawdź, czy `SKILL.md` w atrapie **nie został zmieniony**:

```bash
T="C:/Users/rafal/AppData/Local/Temp/evolve-skill-test"
diff "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/SKILL.md" "$T/.claude/skills/podsumuj-sesja-claude/SKILL.md" && echo "BEZ ZMIAN (oczekiwane)"
```

- [ ] **Krok 5: GREEN — ścieżka akceptacji (Krok 5 skilla)**

Kroki 5 i 6 skilla dotyczą tego, co dzieje się **po** decyzji, więc scenariusze
z Kroku 4 ich nie dotykają. Odtwórz atrapę, uruchom scenariusz (b) ze skillem,
a gdy subagent zatrzyma się na bramce, kontynuuj tę samą sesję
(`SendMessage`) wiadomością:

```
Akceptuję propozycję w tej postaci. Zapisz wszystko, co skill przewiduje po akceptacji.
```

Zweryfikuj stan atrapy na dysku, nie deklaracje subagenta:

```bash
T="C:/Users/rafal/AppData/Local/Temp/evolve-skill-test"
diff "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/SKILL.md" "$T/.claude/skills/podsumuj-sesja-claude/SKILL.md"
ls "$T/.claude/skills/podsumuj-sesja-claude/"
cat "$T/.claude/wiki/index.md"; tail -20 "$T/.claude/wiki/skill-impact.md" "$T/.claude/wiki/log.md"
```

Sprawdź sześć rzeczy:
1. `SKILL.md` zmieniony patchem, nie przepisany (diff pokazuje kilka linii, nie
   cały plik).
2. Powstał `PURPOSE.md` z trzema sekcjami i sekcją Pochodzenie opartą o źródła.
3. `skill-impact.md` ma nowy wpis z datą, nazwą skilla, wzorcami i **pełnym
   diffem**.
4. Strona `brief-bez-nastepnego-kroku.md` ma status dokładnie w postaci
   `zaadresowany (YYYY-MM-DD, podsumuj-sesja-claude)`.
5. `index.md` przepisany, z nowym statusem tego wzorca.
6. `log.md` ma wpis o decyzji.

- [ ] **Krok 6: GREEN — ścieżka odrzucenia (Krok 6 skilla)**

Odtwórz atrapę, uruchom scenariusz (b) ze skillem, a na bramce odpowiedz:

```
Odrzucam. Ta zmiana dokłada regułę do kroku, który już jest najdłuższy w całym skillu.
```

Zweryfikuj:

```bash
T="C:/Users/rafal/AppData/Local/Temp/evolve-skill-test"
diff "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/SKILL.md" "$T/.claude/skills/podsumuj-sesja-claude/SKILL.md" && echo "SKILL.md BEZ ZMIAN (oczekiwane)"
grep -n "odrzucona" "$T/.claude/wiki/skill-impact.md"
grep -n "Status" "$T/.claude/wiki/patterns/brief-bez-nastepnego-kroku.md"
```

Sprawdź trzy rzeczy:
1. `SKILL.md` nietknięty.
2. `skill-impact.md` ma wpis „odrzucona" z **pełnym diffem propozycji** i powodem
   podanym przez użytkownika (bez tego ta sama propozycja wróci).
3. Status wzorca nadal `otwarty`, nie `zaadresowany`.

- [ ] **Krok 7: REFACTOR**

Każde obejście zamknij dopisaniem przeciwwagi w sekcji „Red flags" albo
w odpowiednim kroku skilla, i powtórz scenariusz, który padł. Nie dopisuj reguł
na zapas — każda nowa linia musi wynikać z zaobserwowanego obejścia.

- [ ] **Krok 8: Bramka**

Usuń atrapę:

```bash
rm -rf "C:/Users/rafal/AppData/Local/Temp/evolve-skill-test"
```

Pokaż użytkownikowi treść skilla i wyniki ośmiu przebiegów: 3 RED (Krok 1b),
3 GREEN przed bramką (Krok 4), akceptacja (Krok 5), odrzucenie (Krok 6).
Poczekaj na zgodę na Zadanie 4. Bez commita.

---

### Zadanie 4: `PURPOSE.md` dla trzech skilli w zasięgu tej sesji

Odtworzenie pochodzenia `tidy-journal` (vault), `nauka-z-claude` i `podsumuj-sesja-claude` (globalne). Czwarty skill, `kurs-lekcja`, jest w Zadaniu 6.

**Pliki:**
- Create: `D:\Notatki\notatki\.claude\skills\tidy-journal\PURPOSE.md`
- Create: `C:\Users\rafal\.claude\skills\nauka-z-claude\PURPOSE.md`
- Create: `C:\Users\rafal\.claude\skills\podsumuj-sesja-claude\PURPOSE.md`

**Interfejsy:**
- Konsumuje: szablon `PURPOSE.md` z sekcji 4.5 specu.
- Produkuje: pliki, które czyta `evolve-skill` w Kroku 2 i uzupełnia w Kroku 5.

- [ ] **Krok 1: Zbierz źródła dla `tidy-journal`**

```bash
cd "D:/Notatki/notatki"
git log --date=short --follow --pretty="%h %ad %s" -- .claude/skills/tidy-journal/SKILL.md
git show 1cd67cd --stat
git show 6a7e7b9 --stat -- .claude/skills
grep -n "tidy-journal" praca-z-claude.md
grep -rn "tidy-journal" .claude/specs/ .claude/plans/ README.md .claude/CLAUDE.md
```

Znane punkty wyjścia (potwierdź je i uzupełnij): commit `6a7e7b9` z 2026-07-11
(„second brain setup") zakłada skill; commit `1cd67cd` z 2026-07-12
(„tidy-journal: weryfikacja wiedzy, ziarno zagadnienia, linkowanie inline,
pelny podglad w planie") zmienia cztery rzeczy naraz — komunikat commita jest
źródłem dla czterech osobnych wpisów w historii. Specy `.claude/specs/` mają
daty w nazwach plików; te daty są wiarygodniejsze niż daty commitów, bo pliki
trafiły do repo zbiorczo.

- [ ] **Krok 2: Napisz `PURPOSE.md` dla `tidy-journal`**

Wypełnij szablon zebranymi faktami. Struktura obowiązkowa:

```markdown
# PURPOSE — tidy-journal

## Pochodzenie

<3–6 zdań; każde ze wskazaniem źródła w nawiasie: hash commita, ścieżka specu
albo data wpisu w praca-z-claude.md. Element bez źródła → `?`>

## Adresowane wzorce

- brak — skill sprzed wiki

## Historia ewolucji

- YYYY-MM-DD — <zmiana> — powód: <jeśli źródło go podaje, inaczej „nieustalony"> — wynik: <zaakceptowana | odrzucona | wprowadzona ręcznie | nawrót YYYY-MM-DD> — źródło: <hash commita | ścieżka pliku>
```

Wpis ma **cztery pola po dacie, w tej kolejności: zmiana, powód, wynik,
źródło**. Pole `wynik` jest obowiązkowe (spec, sekcja 4.5); pole `źródło` jest
rozszerzeniem wymaganym przy odtwarzaniu historii wstecz i nie zastępuje wyniku.

Twarde zasady:
- Jeśli źródło nie mówi, **dlaczego** wprowadzono zmianę, wpisz „powód:
  nieustalony", a nie domysł. Komunikat commita opisuje „co", nie zawsze
  „dlaczego".
- Zmiany sprzed wprowadzenia wiki nie przechodziły przez bramkę akceptacji,
  więc ich wynik brzmi **„wprowadzona ręcznie"**. Wartości „zaakceptowana"
  i „odrzucona" są zarezerwowane dla zmian przepuszczonych przez
  `evolve-skill`.

- [ ] **Krok 3: Zbierz źródła dla `nauka-z-claude`**

```bash
cd "D:/Notatki/notatki"
cat .claude/specs/2026-08-15-powtorki-z-notatek-design.md
cat .claude/plans/2026-08-15-powtorki-z-notatek.md
grep -n "nauka-z-claude\|powtórk\|koncept\|wyjaśnij" praca-z-claude.md
grep -n "nauka-z-claude" README.md .claude/CLAUDE.md
ls -la "C:/Users/rafal/.claude/skills/nauka-z-claude/"
ls -la "C:/Users/rafal/.claude/hooks/"
```

Uwaga: `~/.claude/skills/` **nie jest w gicie**, więc historia zmian tego skilla
istnieje wyłącznie w specach, planach i dzienniku. Data modyfikacji katalogu
(2026-09-01) to najpóźniejsza znana zmiana, nie data powstania. Hook
`~/.claude/hooks/powtorki-check.ps1` jest częścią mechanizmu powtórek i jego
istnienie warto odnotować w pochodzeniu.

- [ ] **Krok 4: Napisz `PURPOSE.md` dla `nauka-z-claude`**

Ten sam szablon. W „Pochodzeniu" nazwij trzy tryby (pytania, wyjaśnij, powtórki)
i trzy pule powtórek (fundamenty, tematyczne, notatki) tylko wtedy, gdy źródło
je potwierdza; README vaulta je opisuje, więc jest wiarygodnym źródłem.
W „Historii ewolucji" odnotuj rozbudowę o powtórki z notatek z datą ze specu
(2026-08-15) i o rejestr konceptów, jeśli źródło podaje datę — inaczej `?`.

- [ ] **Krok 5: Zbierz źródła dla `podsumuj-sesja-claude`**

```bash
grep -n -A 15 "Podsumowania sesji" "C:/Users/rafal/.claude/CLAUDE.md"
ls -la "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/"
cd "D:/Notatki/notatki" && head -1 praca-z-claude.md && grep -c "^## " praca-z-claude.md
grep -n "^## " praca-z-claude.md | tail -3
```

Kluczowy fakt do odnotowania: sekcja „Podsumowania sesji" w
`~/.claude/CLAUDE.md` **nadpisuje Krok 1 skilla** — ścieżka dziennika jest
ustalona na sztywno (`D:\Notatki\notatki\praca-z-claude.md`) i skill ma nie
szukać markera. To jest udokumentowana ewolucja zachowania bez zmiany samego
pliku skilla i musi trafić do „Historii ewolucji" z adnotacją o źródle.
Data najstarszego wpisu w dzienniku wyznacza dolną granicę wieku skilla.

- [ ] **Krok 6: Napisz `PURPOSE.md` dla `podsumuj-sesja-claude`**

Ten sam szablon. W „Historii ewolucji" ujmij dwa fakty: nadpisanie Kroku 1
przez `~/.claude/CLAUDE.md` oraz dodanie Kroku 5 (Wiki Maintainer) z Zadania 2
tego planu — wpis: `2026-09-02 — dodany Krok 5 (Wiki Maintainer) — powód:
wdrożenie warstwy wiki z artykułu WikiSkill — wynik: wprowadzona ręcznie —
źródło: .claude/specs/2026-09-02-wikiskill-design.md`.

- [ ] **Krok 7: Zweryfikuj wszystkie trzy pliki**

```bash
for f in "D:/Notatki/notatki/.claude/skills/tidy-journal/PURPOSE.md" \
         "C:/Users/rafal/.claude/skills/nauka-z-claude/PURPOSE.md" \
         "C:/Users/rafal/.claude/skills/podsumuj-sesja-claude/PURPOSE.md"; do
  echo "=== $f"
  grep -n "^## " "$f"
  echo "--- wpisy historii bez pola wynik (oczekiwane: brak):"
  sed -n '/^## Historia ewolucji/,$p' "$f" | grep "^- " | grep -v "wynik:"
  echo "--- wpisy historii bez pola źródło (oczekiwane: brak):"
  sed -n '/^## Historia ewolucji/,$p' "$f" | grep "^- " | grep -v "źródło:"
done
```

Oczekiwane:
1. Każdy plik ma dokładnie trzy sekcje `##` w kolejności Pochodzenie,
   Adresowane wzorce, Historia ewolucji.
2. Oba filtry nie zwracają nic. Każdy wpis historii ma i `wynik:`, i `źródło:`.
3. Wartość `wynik:` dla zmian sprzed wiki brzmi „wprowadzona ręcznie".

Potem przeczytaj każdą sekcję „Pochodzenie" i sprawdź zdanie po zdaniu, czy ma
źródło albo `?`. Zdanie bez jednego i bez drugiego usuń — nie jest wiedzą, tylko
domysłem.

- [ ] **Krok 8: Bramka**

Pokaż użytkownikowi trzy pliki. Poczekaj na zgodę na Zadanie 5. Bez commita.

---

### Zadanie 5: Dokumentacja vaulta

**Pliki:**
- Modify: `D:\Notatki\notatki\README.md` (tabela skilli, opis `.claude/`)
- Modify: `D:\Notatki\notatki\.claude\CLAUDE.md` (sekcja „Struktura vaulta")

**Interfejsy:**
- Konsumuje: nazwy i ścieżki ustalone w Zadaniach 1–3.
- Produkuje: nic dla kolejnych zadań; to domknięcie dokumentacji wymagane przez
  zapamiętaną zasadę „README dokumentuje skille i foldery, aktualizować przy
  każdej zmianie skilli lub struktury".

- [ ] **Krok 1: Dopisz wiersz do tabeli skilli w `README.md`**

Tabela ma nagłówki `| Skill | Uruchomienie | Co robi |` i kończy się wierszem
`sync-project`. Dopisz pod nim:

```markdown
| `evolve-skill` (globalny) | `/evolve-skill <skill>` | Proponuje jedną atomową zmianę wskazanego skilla na podstawie wzorców zebranych w `.claude/wiki/` przez krok Wiki Maintainer skilla `podsumuj-sesja-claude`. Czyta rejestr wcześniejszych prób, więc nie wraca do propozycji już odrzuconych. Zapisuje dopiero po akceptacji; odrzucenie też zostawia ślad z diffem. |
```

- [ ] **Krok 2: Popraw zdanie zamykające tabelę**

Obecne zdanie brzmi: „Definicje skilli leżą w `.claude/skills/<nazwa>/SKILL.md`.
Nazwy skilli są zawsze angielskie, w kebab-case; treść po polsku."

Zamień na:

```markdown
Definicje skilli leżą w `.claude/skills/<nazwa>/SKILL.md`, a obok nich `PURPOSE.md` — zapis tego, po co skill powstał i jak się zmieniał. Skille globalne (`evolve-skill`, [[nauka-z-claude]], `podsumuj-sesja-claude`) mieszkają w `~/.claude/skills/` i działają w każdym katalogu. Nazwy skilli są zawsze angielskie, w kebab-case; treść po polsku.
```

- [ ] **Krok 3: Rozszerz opis `.claude/` w sekcji „Foldery"**

Obecna linia: „- `.claude/` — konfiguracja Claude Code: instrukcje
(`CLAUDE.md`) i skille."

Zamień na:

```markdown
- `.claude/` — konfiguracja Claude Code: instrukcje (`CLAUDE.md`), skille (`skills/`, każdy z `SKILL.md` i `PURPOSE.md`), projekty i plany (`specs/`, `plans/`) oraz `wiki/` — trwała wiedza o pracy z Claude w tym repo: strony wzorców (`patterns/`), ich indeks, log ewolucji i rejestr prób zmian skilli (`skill-impact.md`). Wiki zasila krok Wiki Maintainer skilla `podsumuj-sesja-claude`, a czyta je `evolve-skill`. Wzorce dotyczące skilli globalnych i zachowań niezależnych od repo trafiają do `~/.claude/wiki/`.
```

- [ ] **Krok 4: Dopisz linię w `.claude/CLAUDE.md`**

W sekcji „## Struktura vaulta", po punkcie o `szablony/` i przed punktem
o `eksport/`, dopisz:

```markdown
- `.claude/` — konfiguracja Claude Code: `CLAUDE.md`, `skills/` (definicja `SKILL.md` plus `PURPOSE.md` z pochodzeniem skilla), `specs/` i `plans/`, oraz `wiki/` — wzorce z pracy z Claude (`patterns/`), indeks, log ewolucji i rejestr prób zmian skilli. To stan narzędzia, nie treść wiedzowa: notatki wiedzowe nie linkują do wiki, a `tidy-journal` go nie dotyka.
```

- [ ] **Krok 5: Sprawdź spójność**

```bash
cd "D:/Notatki/notatki"
grep -n "evolve-skill" README.md .claude/CLAUDE.md
grep -n "wiki/" README.md .claude/CLAUDE.md
grep -c "^|" README.md
```

Oczekiwane: `evolve-skill` w obu plikach, `wiki/` opisane w obu, tabela skilli
ma o jeden wiersz więcej niż przed zmianą.

- [ ] **Krok 6: Bramka**

Pokaż diff obu plików i `git status --short`. Poczekaj na decyzję o Zadaniu 6.
Bez commita.

---

### Zadanie 6: Baza wiedzy Devstock (poza katalogami roboczymi tej sesji)

Repo `D:\Praca\Devstock\Baza wiedzy` **nie jest** katalogiem roboczym tej sesji ani nie ma go w `additionalDirectories` w `.claude/settings.json` vaulta. Zapis tam wymaga świadomej decyzji użytkownika.

**Pliki:**
- Create: `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\index.md`
- Create: `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\log.md`
- Create: `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\skill-impact.md`
- Create: `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\patterns\.gitkeep`
- Create: `D:\Praca\Devstock\Baza wiedzy\.claude\skills\kurs-lekcja\PURPOSE.md`

**Interfejsy:**
- Konsumuje: treści plików z Zadania 1 (identyczne, z podmienionym członem
  `(vault)` na `(baza wiedzy)`) i szablon `PURPOSE.md` z Zadania 4.
- Produkuje: nic dla pozostałych zadań — to gałąź niezależna.

- [ ] **Krok 1: Zapytaj użytkownika o tryb i rozgałęź plan**

Przedstaw dwie możliwości i **poczekaj na decyzję**. Brak odpowiedzi nie jest
zgodą na żaden wariant.

**Wariant A — teraz, w tej sesji.** Wymaga zgody na zapis poza katalogiem
roboczym; każdy zapis wywoła osobne pytanie o uprawnienie. Po wyborze A wykonaj
Kroki 2A, 3, 4A, 5.

**Wariant B — osobna sesja Claude Code otwarta w `D:\Praca\Devstock\Baza wiedzy`.**
Po wyborze B **nie zapisujesz niczego w tamtym repo**, także w Kroku 4. Zamiast
tego wykonaj Krok 2B i zakończ zadanie.

- [ ] **Krok 2A: Załóż szkielet wiki (tylko wariant A)**

Trzy pliki i katalog `patterns/` wg Zadania 1, z nagłówkami
`# Wiki — indeks wzorców (baza wiedzy)`, `# Wiki — log ewolucji (baza wiedzy)`,
`# Wiki — rejestr zmian skilli (baza wiedzy)`. Zdanie wprowadzające w `index.md`:
„Katalog wzorców zebranych z sesji z Claude Code w repo bazy wiedzy Devstock."

- [ ] **Krok 2B: Przygotuj pakiet do przeniesienia (tylko wariant B)**

Dopisz na końcu **tego pliku planu** sekcję `## Załącznik: pakiet dla Bazy
wiedzy Devstock` zawierającą:

1. Pełne treści czterech plików wiki (trzy pliki plus `.gitkeep`), gotowe do
   wklejenia, z podmienionym członem `(vault)` na `(baza wiedzy)`.
2. Komendy researchu z Kroku 3 poniżej, przepisane w całości.
3. Szablon `PURPOSE.md` z Zadania 4, Krok 2, wraz z twardymi zasadami
   (źródło albo `?`, „powód: nieustalony", „wynik: wprowadzona ręcznie").
4. Zdanie otwierające dla przyszłej sesji: „Wykonaj Kroki 2A, 3, 4A i 5
   Zadania 6 z pliku
   `D:\Notatki\notatki\.claude\plans\2026-09-02-wikiskill.md`, korzystając
   z załącznika na końcu tego planu. Uwaga: w tej sesji repo Bazy wiedzy jest
   katalogiem roboczym, więc zapisy nie wymagają zgody na pisanie poza nim,
   a Krok 1 (wybór wariantu) jest już rozstrzygnięty i go pomijasz."

Powiedz użytkownikowi, że pakiet czeka w planie, i **zakończ zadanie** bez
wchodzenia w Kroki 3–5.

- [ ] **Krok 3: Zbierz źródła dla `kurs-lekcja` (tylko wariant A)**

```bash
cd "D:/Praca/Devstock/Baza wiedzy"
git log --date=short --follow --pretty="%h %ad %s" -- .claude/skills/kurs-lekcja/SKILL.md
git log --date=short --pretty="%h %ad %s" -- .claude/skills | head -30
ls docs/superpowers/specs/ docs/superpowers/plans/
ls .superpowers/sdd/
grep -rn "kurs-lekcja" CLAUDE.md docs/ .superpowers/ --include="*.md" | head -30
```

Kontekst: skill należy do rodziny `kurs-*` (`kurs-nowy`, `kurs-lekcja`,
`kurs-redakcja`, `kurs-video`, `kurs-zadania`), więc w „Pochodzeniu" nazwij jego
miejsce w tej rodzinie — ale tylko na podstawie tego, co mówią źródła, nie
z układu nazw. Katalogi `.superpowers/sdd/` mają daty w nazwach i zawierają
pliki spec/plan/progress; przejrzyj te, które dotyczą lekcji kursu.

- [ ] **Krok 4A: Napisz `PURPOSE.md` dla `kurs-lekcja` (tylko wariant A)**

Szablon i twarde zasady jak w Zadaniu 4, Krok 2: trzy sekcje w kolejności
Pochodzenie, Adresowane wzorce, Historia ewolucji; każde zdanie „Pochodzenia" ze
źródłem albo `?`; „powód: nieustalony" zamiast domysłu; każdy wpis historii
z polami `wynik:` (dla zmian sprzed wiki: „wprowadzona ręcznie") i `źródło:`;
„Adresowane wzorce: brak — skill sprzed wiki".

- [ ] **Krok 5: Bramka (tylko wariant A)**

Pokaż plik i `git status --short` tamtego repo. Bez commita — zasada obowiązuje
w każdym repo.

---

## Self-review planu

Wykonane przy pisaniu planu, wynik poniżej.

**1. Pokrycie specu.** Sekcje specu → zadania: 3.1 i 4.1–4.4 → Zadanie 1;
4.2 (szablon wzorca), 5 (osiem kroków Maintainera), 3.2 (kierowanie wzorców) →
Zadanie 2; 4.5 (szablon PURPOSE) i 6 (siedem kroków Proposera) → Zadanie 3;
7 (cztery `PURPOSE.md`) → Zadania 4 i 6; 8 (dokumentacja) → Zadanie 5; 3.1
(wiki bazy wiedzy) → Zadanie 6. Sekcje 9 (poza zakresem) i 11 (ryzyka) nie
wymagają zadań. Sekcja 10 (weryfikacja) rozłożona na kroki testowe Zadań 2 i 3
oraz kroki weryfikacyjne Zadań 1, 4 i 5.

**2. Placeholdery.** Brak „TBD", „TODO", „podobnie jak w zadaniu N".
Treści plików podane w całości, nie opisane. Jedyne miejsca celowo niewypełnione
to sekcje „Pochodzenie" w `PURPOSE.md` — ich treść zależy od wyniku researchu
i plan podaje komendy oraz twarde zasady zamiast zmyślonej treści.

**3. Spójność nazw.** Pliki wiki: `index.md`, `log.md`, `skill-impact.md`,
`patterns/<nazwa>.md` — te same nazwy w Zadaniach 1, 2, 3 i 6. Statusy wzorców:
`otwarty`, `zaadresowany (YYYY-MM-DD, <skill>)`, `nawrót (YYYY-MM-DD)` — ta sama
postać w szablonie strony wzorca (Zadanie 2), w opisie `index.md` (Zadanie 1)
i w regule filtrowania (Zadanie 3, Krok 2). Typy wzorców: `porażka` i `sukces`
konsekwentnie. Sekcje `PURPOSE.md`: Pochodzenie, Adresowane wzorce, Historia
ewolucji — ta sama trójka w Zadaniach 3, 4 i 6 oraz w kroku weryfikacyjnym.

**Znane odstępstwo od `writing-plans`:** brak kroków „Commit" w każdym zadaniu.
Powód: zasada „Nie commituj" z `~/.claude/CLAUDE.md`, która ma pierwszeństwo
przed skillem. Zamiast commita każde zadanie kończy się pokazaniem
`git status --short` i bramką.

---

## Załącznik: pakiet dla Bazy wiedzy Devstock

Użytkownik wybrał 2026-09-03 **wariant B** Zadania 6: nic nie zapisujemy w repo
`D:\Praca\Devstock\Baza wiedzy` z tej sesji. Poniżej komplet materiału do
wykonania w osobnej sesji Claude Code otwartej **w tamtym repozytorium**.

### Zdanie otwierające dla przyszłej sesji

> Wykonaj Kroki 2A, 3, 4A i 5 Zadania 6 z pliku
> `D:\Notatki\notatki\.claude\plans\2026-09-02-wikiskill.md`, korzystając
> z załącznika na końcu tego planu. Uwaga: w tej sesji repo Bazy wiedzy jest
> katalogiem roboczym, więc zapisy nie wymagają zgody na pisanie poza nim,
> a Krok 1 (wybór wariantu) jest już rozstrzygnięty i go pomijasz.

### Krok 2A — struktura katalogów

```bash
mkdir -p "D:/Praca/Devstock/Baza wiedzy/.claude/wiki/patterns"
```

Plik `.claude/wiki/patterns/.gitkeep` — pusty. Repo jest w gicie, a git nie
śledzi pustych katalogów.

### Treść `.claude/wiki/index.md`

```markdown
# Wiki — indeks wzorców (baza wiedzy)

Katalog wzorców zebranych z sesji z Claude Code w repo bazy wiedzy Devstock.
Jedna linia na wzorzec: problem, przyczyna źródłowa i rozwiązanie, tak żeby dało
się ocenić trafność bez otwierania strony. Plik jest przepisywany w całości przy
każdej aktualizacji.

Format wpisu:
`- [nazwa](patterns/nazwa.md) — skill: <skill|ogólny> — PROBLEM. PRZYCZYNA. FIX. (status, N dowodów)`

Status, dokładnie w jednej z trzech postaci: `otwarty` | `zaadresowany (YYYY-MM-DD, <skill>)` | `nawrót (YYYY-MM-DD)`.

## Wzorce

(brak — wiki założone <DATA ZAŁOŻENIA>, pierwsze wzorce doda krok Wiki Maintainer
skilla `podsumuj-sesja-claude`)
```

### Treść `.claude/wiki/log.md`

```markdown
# Wiki — log ewolucji (baza wiedzy)

Chronologiczny zapis sesji: co zostało założone, dopisane i zdecydowane.
Najnowszy wpis na KOŃCU pliku (odwrotnie niż w dzienniku sesji), bo ten plik
czyta skill `evolve-skill` od początku, a nie człowiek rano.

Format wpisu:

    ## YYYY-MM-DD — sesja <identyfikator>
    - Założono: <wzorzec> (dowód: <krótko>)
    - Dopisano dowód: <wzorzec>
    - Nawrót: <wzorzec> po zmianie z YYYY-MM-DD
    - Wzorce globalne dotknięte w tej sesji: <lista>
    - Skill: <nazwa> — propozycja zaakceptowana | odrzucona
    - Sygnał: <wzorce kwalifikujące się do /evolve-skill> | brak

## Wpisy

(brak — wiki założone <DATA ZAŁOŻENIA>)
```

### Treść `.claude/wiki/skill-impact.md`

```markdown
# Wiki — rejestr zmian skilli (baza wiedzy)

Ślad każdej próby zmiany skilla: zaakceptowanej i odrzuconej. Skill
`evolve-skill` czyta ten plik przed propozycją i nie wolno mu powtórzyć
propozycji już odrzuconej. Pełny diff zostaje także przy odrzuceniu — to
jedyny sposób, żeby rozpoznać powtórkę.

Format wpisu:

    ## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
    - **Wzorce:** <nazwy stron wiki>
    - **Zmiana:** <streszczenie w 1–3 zdaniach>
    - **Powód decyzji:** <przy odrzuceniu: powód użytkownika>
    - **Nawrót:** YYYY-MM-DD, <wzorzec>
    (pod spodem blok diff z pełnym diffem SKILL.md)

## Wpisy

(brak — wiki założone <DATA ZAŁOŻENIA>)
```

### Krok 3 — polecenia do zebrania źródeł dla `kurs-lekcja`

```bash
cd "D:/Praca/Devstock/Baza wiedzy"
git log --date=short --follow --pretty="%h %ad %s" -- .claude/skills/kurs-lekcja/SKILL.md
git log --date=short --pretty="%h %ad %s" -- .claude/skills | head -30
ls docs/superpowers/specs/ docs/superpowers/plans/
ls .superpowers/sdd/
grep -rn "kurs-lekcja" CLAUDE.md docs/ .superpowers/ --include="*.md" | head -30
```

Dodatkowo, gdy `git log --follow` zwróci mało: `git show <hash> -- .claude/skills/kurs-lekcja/SKILL.md` dla każdego commita dotykającego pliku, żeby zobaczyć, **co** się zmieniło. Komunikat commita opisuje „co", rzadko „dlaczego".

Kontekst: skill należy do rodziny `kurs-*` (`kurs-nowy`, `kurs-lekcja`,
`kurs-redakcja`, `kurs-video`, `kurs-zadania`). W „Pochodzeniu" nazwij jego
miejsce w tej rodzinie, ale **tylko na podstawie tego, co mówią źródła**, nie
z układu nazw. Katalogi `.superpowers/sdd/` mają daty w nazwach i zawierają
pliki spec/plan/progress — przejrzyj te dotyczące lekcji kursu.

### Krok 4A — szablon `.claude/skills/kurs-lekcja/PURPOSE.md`

```markdown
# PURPOSE — kurs-lekcja

## Pochodzenie

<3–6 zdań; każde ze wskazaniem źródła w nawiasie: hash commita, ścieżka pliku
albo data wpisu. Element bez źródła → `?`>

## Adresowane wzorce

- brak — skill sprzed wiki

## Historia ewolucji

- YYYY-MM-DD — <zmiana> — powód: <jeśli źródło go podaje, inaczej „nieustalony"> — wynik: wprowadzona ręcznie — źródło: <hash commita | ścieżka pliku>
```

**Twarde zasady, sprawdzone w Zadaniu 4:**

- Każde zdanie „Pochodzenia" ma źródło albo `?`. Zdanie bez jednego i bez
  drugiego usuń — to domysł, nie wiedza.
- Źródło mówi **co**, ale nie **dlaczego** → „powód: nieustalony". Nigdy domysł.
- Pole `wynik` dla wszystkich zmian sprzed wprowadzenia wiki brzmi
  **„wprowadzona ręcznie"**. Wartości „zaakceptowana" i „odrzucona" są
  zarezerwowane dla zmian przepuszczonych przez `evolve-skill`.
- Wpis historii ma **cztery pola po dacie, w tej kolejności**: zmiana, powód,
  wynik, źródło.
- Nie łącz dwóch faktów w związek przyczynowy bez źródła. Jeśli hipoteza jest
  wartościowa, zapisz ją jawnie jako hipotezę („to możliwe tło decyzji, choć
  samo powiązanie nie jest w żadnym źródle potwierdzone wprost").

### Krok 5 — weryfikacja i zamknięcie

```bash
f=".claude/skills/kurs-lekcja/PURPOSE.md"
grep -n "^## " "$f"
echo "--- wpisy bez pola wynik (oczekiwane: brak):"
sed -n '/^## Historia ewolucji/,$p' "$f" | grep "^- " | grep -v "wynik:"
echo "--- wpisy bez pola źródło (oczekiwane: brak):"
sed -n '/^## Historia ewolucji/,$p' "$f" | grep "^- " | grep -v "źródło:"
git status --short
```

Oczekiwane: trzy sekcje `##` w kolejności Pochodzenie, Adresowane wzorce,
Historia ewolucji; oba filtry puste; `git status` pokazuje nowe pliki jako
nieśledzone. **Bez commita** — zasada obowiązuje w każdym repo.

### Czego ten pakiet świadomie nie zawiera

Skille `evolve-skill` i `podsumuj-sesja-claude` są **globalne**
(`~/.claude/skills/`), więc działają w Bazie wiedzy od razu, bez instalacji.
Po założeniu tam wiki krok Wiki Maintainer zacznie zapisywać wzorce z sesji
prowadzonych w tamtym repo, a `/evolve-skill <nazwa>` będzie czytał tamtejsze
wiki dla skilli `kurs-*`, `baza-wiedzy`, `knowledge-base-update` i `spotkanie`.
Nic więcej nie trzeba tam kopiować.
