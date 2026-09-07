---
name: podsumuj-sesja-claude
description: Use when the user wants to save/close out the current Claude session as a brief for later — triggers like "podsumuj sesję", "zapisz stan sesji", "brief na jutro", "kończymy na dziś", end-of-workday wrap-up. NOT for summarizing a single file, diff, or PR.
---

# Podsumuj sesję z Claude

## Overview

Zapisuje stan bieżącej sesji jako **datowany brief**, z którym partner następnego dnia (albo po przerwie) w minutę wraca do kontekstu. Wpis dopisujesz do jednego, wspólnego pliku — **najnowszy na samej górze**.

**Zasada:** brief to punkt wznowienia, nie kronika. Ma odpowiedzieć na „gdzie jesteśmy i co robić dalej", a nie opowiadać przebieg dnia. Twardy stan (gałąź, commity, testy) bierzesz z narzędzi, nie z pamięci — pamięć po kompaktowaniu bywa nieaktualna.

Brief to nie wszystko. Krok 5 konsoliduje doświadczenie sesji w trwałe wzorce
(`.claude/wiki/`), z których skill `evolve-skill` proponuje później zmiany
w skillach. Brief odpowiada na „gdzie jesteśmy", wiki na „czego się nauczyliśmy
o naszej pracy".

## When to use

- Partner mówi „podsumuj sesję", „zapisz stan", „brief na jutro", „kończymy na dziś".
- Kończycie dłuższą sesję i warto zostawić punkt wznowienia.
- NIE do: streszczenia pojedynczego pliku/diffa/PR-a (to zwykłe zadanie, nie ten skill).

## Krok 1 — ustal, gdzie zapisać

Ścieżka pliku podsumowań jest w konfiguracji projektu. Znajdź ją:

1. Przeszukaj `CLAUDE.md` i `CLAUDE.local.md` w repo pod kątem markera:
   `<!-- podsumuj-sesja-claude: <ścieżka> -->`
2. Jeśli marker jest — zapisuj do tej ścieżki.
3. Jeśli markera NIE ma — zapytaj partnera o ścieżkę i zaproponuj dopisanie markera do `CLAUDE.md` (żeby następnym razem było automatycznie).

## Krok 2 — zbierz twardy stan (nie z pamięci)

Zanim złożysz brief, zbierz fakty z narzędzi (pomiń nietrafne dla danej sesji):

- Repo git: `git branch --show-current`, `git log --oneline -8`, `git status --short`, ahead/behind względem `origin/<base>`.
- Status testów/buildów, jeśli je uruchamialiście (liczby, nie „przechodzą").
- Kluczowe ścieżki: nowe/zmienione pliki, artefakty, foldery eksperymentów.
- Otwarte wątki: co zostało nierozstrzygnięte, co czeka na decyzję partnera.

## Krok 3 — złóż wpis wg szablonu

Datę bierz z kontekstu sesji (dzisiejsza, `YYYY-MM-DD`). Trzymaj się kolejności sekcji — pusta sekcja niech zniknie, nie zostawiaj nagłówka bez treści.

```markdown
## YYYY-MM-DD — <projekt/temat> — <TL;DR jednozdaniowy: gdzie jesteśmy>

**Gdzie jesteśmy:** <1–2 zdania: stan na koniec dnia, czy coś jest zablokowane>

**Zrobione:**
- <konkret, nie „pracowaliśmy nad X">

**Decyzje:**
- <decyzja> — bo <krótkie dlaczego>

**Stan:** gałąź `…`, commity `…`, testy `N/N`, pliki/artefakty `…`

**Następny krok / otwarte wątki:**
1. <najważniejsza rzecz do zrobienia jutro — konkretna, wykonalna>
2. <…>

**Pułapki / uwagi:** <gotcha, którą łatwo przeoczyć; pomiń, jeśli brak>
```

## Krok 4 — dopisz na GÓRZE pliku

- Nowy wpis idzie **nad** poprzednie (odwrotnie chronologicznie) — rano partner widzi najnowszy pierwszy.
- „Góra pliku" znaczy **pod nagłówkiem `# Praca z Claude — dziennik sesji`**, nie na fizycznym początku pliku. Nad tym nagłówkiem mogą leżeć inne sekcje (np. tabela pomysłów) — nie ruszasz ich i nie wstawiasz wpisu przed nimi.
- Jeśli plik pusty/nie istnieje: załóż go z nagłówkiem `# Praca z Claude — dziennik sesji`, potem wpis.
- **Dopisuj, nie nadpisuj** — starych wpisów nie kasujesz.
- Po zapisie podaj partnerowi ścieżkę i 1-zdaniowe potwierdzenie.

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
- Brakujący plik wiki załóż z nagłówkiem i opisem formatu wpisu, nie z
  pustego pliku — format bierz z tego samego Kroku 5 (szablon strony wzorca
  jest w 5.8), nie z kopiowania sąsiednich plików katalogu, których w nowym
  repo może nie być; dotyczy to `index.md`, `log.md` i `skill-impact.md` tak
  samo, jak stron wzorców. Brakujący katalog `patterns/` utwórz.

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
`- **Nawrót:** <data>, <wzorzec>` do właściwego wpisu w `skill-impact.md`
**tego wiki, w którym prowadzony jest rejestr dla skilla `<skill>`** — wiki
repo dla skilla z repo, wiki globalne dla skilla globalnego, niezależnie od
tego, w którym wiki leży sam wzorzec (reguła kierowania zapisu, Krok 5 skilla
`evolve-skill`). Nawrót jest jedyną miarą skuteczności zmiany skilla, jaką
mamy — nie pomijaj go.

### 5.7 Zapisz i wypisz, co zapisałeś

**Zapisujesz od razu, bez pytania o zgodę.** Podgląd przed zapisem był bramką,
która kosztowała turę i niczego nie chroniła: wiki leży w gicie, każdy wpis da
się poprawić albo skasować, a użytkownik i tak czyta listę zmian — tyle że po
fakcie zamiast przed.

Po zapisie wypisz, co powstało:

- `założono: <nazwa> (skill: X, typ: porażka|sukces) — <jedno zdanie>`
- `dopisano dowód: <nazwa> — <jedno zdanie>`
- `nawrót: <nazwa> — zaadresowany <data>, wraca`

Lista po fakcie ma tę samą treść co podgląd, zmienia się tylko moment. Gdy
obserwacja wydaje Ci się wątpliwa, zapisz ją i powiedz w jednym zdaniu, że jest
wątpliwa — decyzję o skasowaniu podejmie użytkownik, patrząc na gotowy wpis, a
nie na jego opis.

### 5.8 Zapisz

- Nowe strony wzorców w całości wg szablonu poniżej; istniejące — dopisz dowód
  do sekcji „Dowody", resztę popraw punktowo, nie przepisuj strony od zera.
- `index.md` przepisz w całości, z aktualnym statusem i liczbą dowodów —
  **chyba że w tym samym wiki pisze równolegle druga sesja.** Wtedy aktualizuj
  punktowo: dopisz swoje linie i popraw liczniki dowodów, bo przepisanie
  w całości skasuje jej wpisy. Rozpoznasz to po tym, że plik zmienił się między
  Twoim odczytem a zapisem albo że `Edit` odmówił z powodu nieaktualnego
  odczytu — potraktuj odmowę jak asercję wejścia, przeczytaj ponownie i pisz
  punktowo.
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
w `log.md` obu wiki, repo i globalnego — także w tym, którego sesja w ogóle
nie dotknęła. Log ma być kompletny.

## Zasady jakości

- Skanowalne i zorientowane na „następny krok" — nie ściana narracji.
- „Stan" z faktów (numery commitów, `N/N` testów), nie z pamięci.
- Żadnych sekretów (kluczy, tokenów) w briefie.
- Sekcja „Następny krok" jest obowiązkowa i najważniejsza — to po nią partner sięga rano.

## Częste błędy

| Błąd | Zamiast tego |
|---|---|
| Nadpisanie pliku / kasowanie starych wpisów | Dopisuj nowy wpis na górze |
| „Stan" z pamięci (nieaktualny po kompaktowaniu) | `git`/testy jako źródło prawdy |
| Długa narracja przebiegu dnia | TL;DR + „następny krok" |
| Brak sekcji „następny krok" | To rdzeń briefu — zawsze ją wypełnij |
| Zgadywanie ścieżki pliku | Marker w `CLAUDE.md` (Krok 1) |
| Wstrzymanie zapisu do wiki w oczekiwaniu na zgodę | Krok 5.7 — zapisz, potem wypisz listę zmian |
| `index.md` przepisany w całości, gdy w wiki pisze druga sesja | Krok 5.8 — aktualizacja punktowa, cudze wpisy zostają |
| Wzorzec opisujący objaw („Claude się pomylił") | Przyczyna źródłowa: dlaczego to się stało i co to powtórzy |
| Nowa strona wzorca dla obserwacji, która pasuje do istniejącej | Dowód na istniejącej stronie; duplikat rozprasza dowody |
