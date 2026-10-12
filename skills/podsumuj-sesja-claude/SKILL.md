---
name: podsumuj-sesja-claude
description: Use when the user wants to close out the current Claude session — triggers like "podsumuj sesję", "kończymy na dziś", end-of-workday wrap-up — or asks to record what the session taught about working with Claude and its skills. NOT for summarizing a single file, diff, or PR, and NOT for a "where we left off" brief.
---

# Podsumuj sesję z Claude

## Overview

Konsoliduje doświadczenie bieżącej sesji w trwałe wzorce w wiki (`.claude/wiki/`),
z których skill `evolve-skill` proponuje później zmiany w skillach. Cały skill to
krok Wiki Maintainer: odpowiada na „czego się nauczyliśmy o naszej pracy", a nie
na „gdzie jesteśmy".

**Briefu sesji ani dziennika ten skill nie pisze.** Od 2026-10-12 podsumowanie
stanu sesji robi wtyczka, a dziennik `D:\Notatki\notatki\praca-z-claude.md` jest
usunięty. Nie zakładasz go ponownie i nie piszesz briefu do żadnego innego pliku —
jedynym zapisem tego skilla jest wiki.

**Zasada:** wzorzec opisuje przyczynę źródłową, nie objaw. „Claude źle odczytał
PDF" to objaw; „wbudowany odczyt PDF wymaga renderera, którego nie ma w tym
środowisku, więc każdy PDF trzeba brać przez `pdftotext`" to wzorzec.

## When to use

- Partner mówi „podsumuj sesję", „kończymy na dziś", koniec dnia pracy.
- Kończycie dłuższą sesję, w której używaliście skilli albo partner coś poprawiał.
- NIE do: streszczenia pojedynczego pliku/diffa/PR-a ani briefu „gdzie
  skończyłem" (to robi wtyczka).

## Krok 1 — ustal, gdzie piszesz

- **Wiki repo:** `<katalog roboczy>/.claude/wiki/`, jeśli istnieje
  `<katalog roboczy>/.claude/skills/`. Repo bez własnych skilli nie ma wiki.
- **Wiki globalne:** `~/.claude/wiki/` — zawsze.
- Brakujący plik wiki załóż z nagłówkiem i opisem formatu wpisu, nie z
  pustego pliku — format bierz z tego skilla (szablon strony wzorca jest
  w Kroku 8), nie z kopiowania sąsiednich plików katalogu, których w nowym
  repo może nie być; dotyczy to `index.md`, `log.md` i `skill-impact.md` tak
  samo, jak stron wzorców. Brakujący katalog `patterns/` utwórz.

## Krok 2 — ustal identyfikator sesji

Weź link `claude.ai/code/session_…` z kontekstu sesji. Gdy go nie ma, użyj
samej daty i dopisz „id niedostępny" — transkrypt i tak da się odnaleźć po
dacie w `~/.claude/projects/`.

## Krok 3 — przeanalizuj sesję

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

## Krok 4 — dopasuj do tego, co już jest

Przeczytaj `index.md` obu wiki. Obserwacja pasująca do istniejącego wzorca →
**nowy dowód na jego stronie**, nie nowa strona. Duplikat wzorca jest gorszy niż
brak wzorca, bo rozprasza dowody.

## Krok 5 — kieruj wzorzec do właściwego wiki

1. Wzorzec o skillu z tego repo → wiki repo.
2. Wzorzec o skillu globalnym → wiki globalne.
3. Wzorzec o zachowaniu niezależnym od skilla → wiki globalne.
4. Wpis w logu repo wymienia dodatkowo wzorce globalne dotknięte w tej sesji,
   żeby log repo był kompletnym zapisem sesji.

## Krok 6 — rozpoznaj nawrót

Wzorzec ma status `zaadresowany (YYYY-MM-DD, <skill>)`, a nowy dowód jest
późniejszy niż ta data → ustaw status `nawrót (data dzisiejsza)` i dopisz linię
`- **Nawrót:** <data>, <wzorzec>` do właściwego wpisu w `skill-impact.md`
**tego wiki, w którym prowadzony jest rejestr dla skilla `<skill>`** — wiki
repo dla skilla z repo, wiki globalne dla skilla globalnego, niezależnie od
tego, w którym wiki leży sam wzorzec (reguła kierowania zapisu, Krok 5 skilla
`evolve-skill`). Nawrót jest jedyną miarą skuteczności zmiany skilla, jaką
mamy — nie pomijaj go.

## Krok 7 — zapisz i wypisz, co zapisałeś

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

## Krok 8 — zapisz

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

## Krok 9 — zasygnalizuj kandydatów do ewolucji

Na koniec jedno zdanie: wzorce typu **porażka** o statusie `otwarty`
z dowodami z **więcej niż dwóch różnych sesji**, plus wszystkie o statusie
`nawrót`, każdy z sugestią `/evolve-skill <skill>`. Wzorce sukcesów nie
generują sygnału.

Gdy takich nie ma: „brak wzorców do ewolucji". Decyzja o uruchomieniu
`evolve-skill` należy do użytkownika — sam go nie uruchamiasz.

Sesja bez obserwacji wartych wzorca kończy skill wpisem `- Bez nowych wzorców`
w `log.md` obu wiki, repo i globalnego — także w tym, którego sesja w ogóle
nie dotknęła. Log ma być kompletny.

## Zasady jakości

- Żadnych sekretów (kluczy, tokenów) we wpisach wiki.

## Częste błędy

| Błąd | Zamiast tego |
|---|---|
| Brief „gdzie skończyłem" albo wpis do `praca-z-claude.md` obok wiki | Briefu nie piszesz — robi to wtyczka; skill kończy się na wiki |
| Wstrzymanie zapisu do wiki w oczekiwaniu na zgodę | Krok 7 — zapisz, potem wypisz listę zmian |
| `index.md` przepisany w całości, gdy w wiki pisze druga sesja | Krok 8 — aktualizacja punktowa, cudze wpisy zostają |
| Wzorzec opisujący objaw („Claude się pomylił") | Przyczyna źródłowa: dlaczego to się stało i co to powtórzy |
| Nowa strona wzorca dla obserwacji, która pasuje do istniejącej | Dowód na istniejącej stronie; duplikat rozprasza dowody |
