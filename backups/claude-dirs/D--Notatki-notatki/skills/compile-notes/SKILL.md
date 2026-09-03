---
name: compile-notes
description: Użyj, gdy użytkownik chce skompilować notatki z folderu (i jego podfolderów) w jeden plik Markdown pod NotebookLM — np. "zrób z tego materiał do NotebookLM", "skompiluj folder X do jednego pliku", "przygotuj źródło do audio overview", "zbierz notatki z Y do nauki w jednym pliku".
---

# Kompilacja notatek do NotebookLM

Rekurencyjnie zbiera notatki atomowe ze wskazanego folderu i jego poddrzewa w wersjonowane pliki Markdown w `eksport/`, zachowując pełną treść (Podsumowanie + Szczegóły) i pedagogiczną kolejność z hubów. Kompilacje są przyrostowe: pierwszy bieg dla folderu tworzy pełną kompilację `v1`, każdy kolejny — plik `v<N>` wyłącznie z notatkami nowymi i zmienionymi od poprzedniej wersji. Dzięki temu kolejne źródła wgrywane do NotebookLM nie dublują treści.

Zmiany śledzi manifest `eksport/<slug>-notebooklm.manifest.json` (hash treści każdej notatki), prowadzony automatycznie przez skrypt. Liczy się faktyczna treść notatki — ręczne edycje też są wykrywane; notatki źródłowe nie mają żadnych pól wersji.

**Zwykły bieg jest bezpieczny i odwracalny: tylko czyta notatki i zapisuje pliki w `eksport/`. Nie modyfikuje żadnej notatki źródłowej. Nie wymaga akceptacji planu — uruchom od razu i pokaż raport. Wyjątek: `--full` kasuje stare pliki wersji, więc wymaga potwierdzenia użytkownika.**

## Jak uruchomić

Z korzenia vaulta (`D:\Notatki\notatki` jako katalog roboczy):

```
node .claude/skills/compile-notes/compile.js <folder-względem-korzenia> [--full]
```

Przykład: `node .claude/skills/compile-notes/compile.js nauka/tech/chmura/google-cloud`

- Bez flag (tryb domyślny, przyrostowy): brak manifestu → pełna `v1`; manifest istnieje → delta `v<N+1>` z notatkami nowymi i zmienionymi; brak zmian → żaden plik nie powstaje.
- `--full`: reset wersjonowania — nowa pełna `v1`, manifest od zera, stare pliki `v*` tego folderu skasowane. Używaj, gdy użytkownik zakłada nowy notebook w NotebookLM. **Zawsze potwierdź z użytkownikiem przed biegiem z `--full`** — kasuje pliki (vault jest w gicie, więc są odzyskiwalne).

Ścieżkę folderu podaje użytkownik lub ustal ją z nim, jeśli nie jest jednoznaczna. Skill działa na DOWOLNYM folderze z notatkami zbliżonymi do formatu `szablony/notatka-wiedzowa.md` — nie tylko `nauka/`.

Jeśli użytkownik wskaże `szablony/`, `.claude/`, `.obsidian/` lub `eksport/` — to nie są foldery z notatkami wiedzowymi; upewnij się, że to zamierzone, zanim uruchomisz skrypt.

## Jak raportować wynik

Skrypt wypisuje na stdout: tryb i numer wersji (pełna `v1` / przyrostowa `v<N>` z liczbą nowych i zmienionych), ścieżkę pliku wynikowego, liczbę słów, notatki usunięte od poprzedniej wersji, usunięte przestarzałe pliki i listę ostrzeżeń. Przekaż to użytkownikowi zwięźle po polsku:

- Zawsze podaj numer wersji, ścieżkę pliku wynikowego i liczbę słów; przy delcie — ile notatek nowych, ile zmienionych.
- „Brak zmian od v<N>" → powiedz to wprost: żaden plik nie powstał, nie ma czego wgrywać do NotebookLM.
- Notatki usunięte od poprzedniej wersji wymień informacyjnie — delta nie umie nic „odjąć" z NotebookLM; ich stare treści zostają w starszych źródłach notebooka.
- Ostrzeżenia zgrupuj tematycznie zamiast wklejać surową listę, np.: „3 foldery bez huba (kolejność alfabetyczna), 1 notatka bez Szczegółów, 2 linki poza kompilowanym poddrzewem — zostały jako zwykły tekst."
- Jeśli skrypt zakończył się błędem (folder nie istnieje / brak plików `.md` / uszkodzony manifest) — przekaż komunikat błędu; nic nie zostało zapisane.

## Testy

`node .claude/skills/compile-notes/test-compile.js` — buduje tymczasowy vault i przechodzi scenariusze wersjonowania. Uruchamiaj po każdej zmianie w `compile.js`.

## Czego nie robić

- Nie modyfikuj żadnej istniejącej notatki ani huba — skrypt tylko czyta.
- Nie proś o akceptację planu przed zwykłym (przyrostowym) biegiem; potwierdzenia wymaga wyłącznie `--full`.
- Nie edytuj ręcznie plików w `eksport/` — ani kompilacji `v*`, ani manifestów `.manifest.json`; to regenerowane artefakty i stan wersjonowania.
- Nie kasuj ręcznie plików `v*` ani manifestów „dla porządku" — historia wersji odzwierciedla źródła wgrane do NotebookLM; reset tylko przez `--full`.
- Nie zmieniaj kolejności notatek z huba na alfabetyczną „dla porządku" — kolejność w hubie jest celowo pedagogiczna.
