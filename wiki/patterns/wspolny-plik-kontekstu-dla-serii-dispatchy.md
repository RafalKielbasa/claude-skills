# wspolny-plik-kontekstu-dla-serii-dispatchy

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: przy serii kilkunastu zadań tego samego kształtu (ekrany migrowane na jedną bibliotekę) kontroler zapisuje dwa wspólne pliki w workspace planu. Pierwszy, dla implementerów, opisuje, co zbudowały wcześniejsze zadania, wylicza rulingi i reguły domu. Drugi, dla recenzentów, zawiera Global Constraints dosłownie, decyzje użytkownika i rulingi. Dispatch każdego zadania podaje ścieżki do tych plików plus kilka zdań specyficznych dla zadania, zamiast powtarzać kontekst.

## Przyczyna źródłowa
Skill każe nie wklejać historii poprzednich zadań do dispatchu, a brief z planu nie zna interfejsów zbudowanych po drodze. Bez wspólnego pliku kontroler albo puchnie każdy dispatch, albo implementer odkrywa API sam i każdy ekran robi to samo inaczej. Rulingi zmieniające się w trakcie (np. etykiety wstecz) trafiają do wszystkich kolejnych zadań jedną edycją pliku.

## Dowody
- 2026-10-26/27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), plan 4 (M2) migracji Kodożerców, mobile, zadania 7–20.
  - Pliki: `screen-task-context.md` (biblioteka ds, bliźniaki `components/learning`, pomocniki, rulingi R1–R22, komendy kontrolne) i `screen-review-constraints.md`.
  - Dispatch zadania ekranowego miał ok. 25 linii i czternaście takich przeszło bez pytań NEEDS_CONTEXT.
  - Rulingi R21/R22 (codegen ze schematu na dysku, etykiety wstecz) dopisane w trakcie trafiły do zadań 16–20 bez zmiany ich promptów.
  - Recenzenci zadań z tym samym plikiem ograniczeń nie zgłaszali ponownie rozstrzygniętych kwestii (braki ikon, tony `Badge`).
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven) (sukces, web): `implementer-context.md`, `reviewer-preamble.md`, `ledger-notes.md` i `intended-changes.md` w workspace; 13 dispatchy zadań po ~20–30 linii, zero NEEDS_CONTEXT, reguły z błędów (hash z `git log`, artefakty sitemap po BUILD) dopisywane raz w pliku dla wszystkich kolejnych.
- 2026-10-29/30, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, plan 7 W4) (sukces, web, trzecia sesja): `global-context.md` (wycięte linie planu: Global Constraints, Review Focus, decyzje W4-D1…D6 z tabelą mapowania), `implementer-common.md` i `reviewer-common.md` (szablon recenzenta jako plik). 15 dispatchy implementera po ~15–25 linii, zero NEEDS_CONTEXT, recenzent dostawał trzy ścieżki i 2–3 nazwane ryzyka. Reguła z pomyłki Task 7 (alt zamieniony na `''`) dopisana raz do `implementer-common.md`; Task 11 i 13 przeniosły alty kluczami bez przypominania.

## Rozwiązanie
Gdy po fundamentach planu zostaje seria ≥ 5 zadań tego samego kształtu, przed pierwszym z nich zapisz w workspace dwa pliki:
- kontekst dla implementera: co zbudowano, z sygnaturami, dozwolone importy, rulingi, komendy kontrolne;
- ograniczenia dla recenzenta: Global Constraints dosłownie, decyzje użytkownika, rulingi.

Dispatch podaje ich ścieżki i tylko to, co specyficzne dla zadania. Każdy nowy ruling obowiązujący serię dopisz do obu plików w tej samej turze, w której go zapisujesz w ledgerze.
