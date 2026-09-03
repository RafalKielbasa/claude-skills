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

4. **Zbierz informacje z vaulta:** otwarte zadania w `zadania.md` odnoszące się do projektu (wikilink `[[projekt]]`, nazwa lub alias w treści) oraz ukończone z bieżącego miesiąca w `archiwum/zadania-archiwum.md`.

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
