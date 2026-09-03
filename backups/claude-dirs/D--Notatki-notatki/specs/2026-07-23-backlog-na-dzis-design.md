# Podział zadań: „na dziś" + „backlog"

Data: 2026-07-23

## Problem

`zadania.md` trzyma wszystkie zadania w jednej warstwie pogrupowanej per kontekst
(`## praca/dom/nauka/prywatne`). Zadań zrobiło się za dużo — lista jest nieczytelna.
Priorytety dnia żyją dziś tylko opisowo w bloku „start dnia", bez wydzielonej listy
tego, co faktycznie robimy dzisiaj.

## Cel

Krótka, czytelna lista **na dziś** na górze; cała reszta w **backlogu** na dole.
Oś organizacji zmienia się z „tylko kontekst" na „status (dziś vs backlog) × kontekst".

## Struktura `zadania.md`

```markdown
# Zadania

## start dnia — RRRR-MM-DD
**Wczoraj:** …analiza…
**Dziś:** …sugestia priorytetów + co dorzucić z backlogu…

## na dziś
### dom
- [ ] Kostka brukowa #dom ➕2026-07-10

## backlog
### praca
- [ ] gif dla Mateusza #praca
### dom
- [ ] regały od Jolki #dom
### nauka
- [ ] plan nauki: biznes #nauka ➕2026-07-12
### prywatne
- [ ] procesy taty #prywatne
```

- Kolejność: blok „start dnia" → `## na dziś` → `## backlog`.
- Konteksty jako podsekcje `### praca/dom/nauka/prywatne` w obu sekcjach.
- **Backlog** trzyma zawsze wszystkie cztery podsekcje (stały dom każdego zadania;
  puste zostają, jak dotąd).
- **„Na dziś"** zawiera tylko podsekcje z faktycznymi zadaniami na dziś — puste
  podsekcje pomijamy, żeby lista była krótka. Gdy z podsekcji znika ostatnie
  zadanie, poranny porządek usuwa pusty nagłówek.
- Format zadania bez zmian: `- [ ] Treść #kontekst [[projekt]] ➕RRRR-MM-DD`.

## Reguły krążenia zadań

- Zadanie żyje w dokładnie jednym miejscu: `na dziś`, `backlog` albo archiwum.
- Nowe zadania w ciągu dnia → domyślnie do **backlogu** (właściwy kontekst).
  „Na dziś" to świadomy wybór — użytkownik sam przenosi tam to, co dziś robi.
- **Użytkownik kuruje „na dziś" ręcznie.** `start-day` nie przenosi zadań między
  backlogiem a „na dziś".

## Zmiany w skillu `start-day`

- **Analiza opiera się na sekcji „na dziś"** (nie na backlogu): postęp, co odhaczone,
  co wisi.
- **Backlog = źródło sugestii:** blok „Dziś" podpowiada, co warto z backlogu dorzucić —
  bez ruszania list.
- **Zaległe w „na dziś":** zadanie przetrwałe z poprzednich dni nieodhaczone skill
  wytyka narracyjnie w analizie („kostka wisi w 'na dziś' drugi dzień"), ale nie
  przenosi. Brak metadanej „od kiedy w na dziś" — sygnał wnioskowany z porównania
  z ustępującym blokiem/wczorajszą notatką, więc miękki. Twardy sygnał zombie
  (`➕` > 14 dni) zostaje i działa na całym pliku.
- **Porządki** świadome dwóch warstw: archiwizacja `[x]` z obu sekcji; uzupełnianie
  dat `➕`; korekta tagu do podsekcji; zabłąkane zadania z dziennika/spotkań →
  domyślnie do **backlogu**.
- Blok „start dnia" pozostaje wyłącznie opisowy (bez checkboxów) — bez zmian.

## Zmiana w skillu `tidy-journal`

- Krok 5 (zabłąkane zadania → `zadania.md`): niezakończone checkboxy trafiają do
  podsekcji kontekstu w `## backlog` (nie do sekcji kontekstu najwyższego poziomu,
  której już nie ma).

## Migracja obecnego pliku

- Wszystkie otwarte zadania → **backlog**, rozdzielone po kontekstach.
- **„Na dziś" startuje puste** — użytkownik sam przeniesie zadania.
- `- [x] review` (odhaczone 2026-07-23) → do `zadania-archiwum.md` (sekcja `## 2026-07`).
- Puste checkboxy i wiersze usuwamy.
- Blok „start dnia — 2026-07-23" zostaje bez zmian.

## Pliki do zaktualizowania

| Plik | Zmiana |
|---|---|
| `zadania.md` | przebudowa wg struktury wyżej |
| `.claude/skills/start-day/SKILL.md` | struktura, reguły warstw, sugestie z backlogu, oznaczanie zaległych, cel nowych zadań = backlog |
| `.claude/skills/tidy-journal/SKILL.md` | krok 5: zabłąkane zadania → podsekcje w `## backlog` |
| `.claude/CLAUDE.md` | opis `zadania.md` (struktura sekcji) |
| `README.md` | linia 25 (opis `[[zadania]]`) |

## Poza zakresem

- Automatyczne przenoszenie zadań do/z „na dziś" przez skill.
- Metadana daty wejścia zadania do „na dziś".
- Zmiany w `meeting` / `sync-project` — odwołują się do `zadania.md` jako całości,
  nie do wewnętrznej struktury sekcji.
