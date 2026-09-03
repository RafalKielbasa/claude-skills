---
name: meeting
description: Użyj, gdy użytkownik chce utworzyć notatkę ze spotkania — pisze /meeting <temat>, „notatka ze spotkania X", „zaczynam spotkanie" — tworzy plik w praca/spotkania/ z szablonu spotkania.
---

# Notatka ze spotkania

Tworzy notatkę spotkania w `praca/spotkania/` z szablonu `szablony/spotkanie.md`.

## Przebieg

1. **Ustal temat** z argumentu polecenia; gdy go brak — zapytaj. Przekształć na kebab-case (małe litery, myślniki, bez polskich znaków), np. „Planowanie SaaS Q3" → `planowanie-saas-q3`.
2. **Utwórz plik** `praca/spotkania/RRRR-MM-DD-<temat>.md` (dzisiejsza data) z szablonu `szablony/spotkanie.md`; wypełnij we frontmatterze `data` (RRRR-MM-DD) i `temat`; `uczestnicy` uzupełnij, jeśli użytkownik ich podał, inaczej zostaw puste. Folder `praca/spotkania/` utwórz, jeśli nie istnieje.
3. **Kolizja nazwy:** jeśli plik o tej nazwie już istnieje, dopytaj — kontynuacja w istniejącym pliku czy nowy z sufiksem `-2`.
4. **Poinformuj**, że zadania zapisane w sekcji `## zadania` trafią do `zadania.md` przy najbliższym `/start-day` lub `/tidy-journal`.

## Czego nie robić

- Nie nadpisuj istniejących notatek spotkań.
- Nie twórz notatki poza `praca/spotkania/`.
