# Kontekst zewnętrznych projektów w vaultcie — specyfikacja

Data: 2026-07-11
Status: zaakceptowana

## Cel

Skille vaulta (`start-day`, `tidy-journal` oraz nowy `sync-project`) mają mieć dostęp do kontekstu projektów programistycznych leżących poza vaultem, żeby wzbogacać raporty, doprecyzowywać notatki i utrzymywać aktualną dokumentację projektów w vaultcie. Notatki projektowe stają się artefaktem generowanym — użytkownik pisze wyłącznie w `zadania.md` i dzienniku.

## Projekty i ścieżki

| Projekt (vault) | Ścieżka na dysku |
|---|---|
| `edu-saas` | `D:\Praca\Devstock\Projekty\saas app` |
| `system-wieloagentowy` | `D:\Praca\Devstock\Projekty\Multi agent system` |
| `duty-rota-app` | `D:\Praca\Side projects\duty-rota-app` |

Do repozytoriów projektów **nigdy nic nie piszemy** — wyłącznie odczyt.

## Struktura w vaultcie

Każdy projekt to podfolder `praca/projekty/<projekt>/` z dokładnie dwiema notatkami:

1. **Notatka stanu** — `<projekt>.md` (nazwa = nazwa folderu; pełni rolę huba projektu, cel wikilinków `[[projekt]]` z zadań):
   - frontmatter: `sciezka:` (ścieżka do projektu na dysku) + `tags`,
   - sekcje: `## podsumowanie stanu`, `## postępy`, `## planowane prace`,
   - zastępuje dotychczasową sekcję `## na czym skończyłem`.
2. **Dokumentacja techniczna** — `<projekt>-dokumentacja.md` (prefiks projektu dla jednoznaczności wikilinków):
   - sekcje: `## czym jest projekt`, `## stack`, `## architektura`, `## struktura repo`.

## Nowy skill: `sync-project`

Wywołanie: `/sync-project <projekt>`; bez argumentu — listuje projekty z `praca/projekty/` i pyta; obsługuje wariant „wszystkie".

Przebieg:
1. Czyta ścieżkę z frontmattera notatki stanu. Nowy projekt → pyta o ścieżkę, tworzy folder i obie notatki.
2. Zbiera informacje:
   - z repo: dokumentacja (README, `docs/`, STATUS.md, specyfikacje), git log od daty ostatniej aktualizacji notatki, manifesty (package.json itp.) dla stacku,
   - z vaulta: otwarte i świeżo ukończone zadania linkujące `[[projekt]]`.
3. Regeneruje obie notatki z ochroną przed utratą danych: zbiorcza propozycja zmian (z wyraźnym wskazaniem usuwanych treści), zapis dopiero po akceptacji użytkownika.
4. Czysty odczyt repo — zero zapisów poza vaultem.

## Zmiany w istniejących skillach

### `start-day`
Krok raportu (7): dla projektów linkowanych z otwartych zadań czyta notatkę stanu (sekcje `## postępy` i `## planowane prace`) zamiast `## na czym skończyłem`. Dodatkowo `git log -1` w repo projektu — jeśli ostatni commit nowszy niż data modyfikacji notatki stanu, raport sugeruje uruchomienie `/sync-project`. Bez pełnego skanowania repo — poranek ma zostać szybki.

### `tidy-journal`
Wpisy dziennika dotyczące projektu trafiają do notatki stanu (sekcje postępy/planowane prace); skill może zajrzeć do repo (docs, git log), żeby doprecyzować fakty. Późniejsza regeneracja przez `sync-project` scala te wpisy — nie gubi ich.

## Konfiguracja i dokumentacja

- `.claude/settings.json` → `permissions.additionalDirectories` z trzema ścieżkami projektów (odczyt bez promptów o zgodę).
- `CLAUDE.md`: aktualizacja opisu struktury `praca/projekty/` (podfoldery projektów, konwencja dwóch notatek, frontmatter `sciezka`), wzmianka o skillu `sync-project`.
- `README.md`: nowy skill + nowa struktura (zasada: README aktualizowany przy każdej zmianie skilli/struktury).

## Migracja

- `praca/projekty/edu-saas.md` → `praca/projekty/edu-saas/edu-saas.md`; treść wpisu z „na czym skończyłem" (lista rzeczy do zrobienia) trafia do `## planowane prace`.
- Foldery `system-wieloagentowy/` i `duty-rota-app/` powstaną przy pierwszym uruchomieniu `/sync-project` dla tych projektów.

## Poza zakresem

- Automatyczna aktualizacja notatek projektowych bez udziału użytkownika (zawsze propozycja → akceptacja → zapis).
- Zapisy do repozytoriów projektów.
- Osobne sekcje/notatki per moduł projektu — dokładnie dwie notatki na projekt.
