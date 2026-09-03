# Egzekucja planu konwencji repo

## Context

`docs/superpowers/specs/2026-08-12-repo-conventions-design.md` (spec) i `docs/superpowers/plans/2026-08-12-repo-conventions.md` (plan, 20 zadań) są zatwierdzone, po review codexa i zacommitowane 2026-08-12 na gałęzi `rafal-kielbasa/rules-for-project`. Egzekucję świadomie odłożono do czasu zmergowania otwartych PR-ów, bo plan produkuje masowe mechaniczne diffy. Teraz ruszamy — repo dostaje jedną konfigurację Prettiera, reguły importów w ESLincie, pełny `strict` w api, docelową strukturę katalogów, kebab-case i named exporty w web, uporządkowaną kolejność hooków, komentarze w limicie dwóch linii oraz `docs/conventions.md` jako pisemne źródło prawdy.

Ten plik jest planem **wykonania**: krok po kroku obowiązuje plan w repo, tu zapisuję zweryfikowany baseline, odchylenia znalezione w drzewie oraz kolejność faz. Nie powiela treści repo-planu.

## Założenia (nie było odpowiedzi na pytania — zmień przy zatwierdzeniu, jeśli chcesz inaczej)

1. **Zakres: pełny, taski 1–20.** Prosiłeś o implementację zasad, nie o jej wycinek. Koszt: trzy otwarte PR-y (#149 CP-30, #148 CP-31, #146 CP-37) dostaną ciężkie konflikty — samo Task 1 przeformatuje 175 plików w `apps/web`, Taski 11–16 przenoszą i przemianowują ~90. Jeśli wolisz mniejszy zasięg: faza A+B+D teraz (tooling + api + docs), faza C (web) po merge'u.
2. **Root scripts naprawiam w Task 1** (odchylenie D1 niżej) — bez tego weryfikacja z Tasków 18 i 20 melduje zielone, nie uruchomiwszy niczego.
3. **Checkpointy fazami.** Raportuję po każdej fazie i jadę dalej; zatrzymuję się tylko na czerwonej bramce albo gdy trzeba decyzji.
4. **Zero commitów.** Wszystko zostaje w working tree, Ty commitujesz. Krok „worktree" ze skilla `executing-plans` i cały `finishing-a-development-branch` (commit/merge/PR) — pomijam, zgodnie z globalnym CLAUDE.md i Global Constraints repo-planu. Pracuję na bieżącej gałęzi `rafal-kielbasa/rules-for-project`, nie na main.

## Zweryfikowany baseline (zmierzony 2026-08-13, drzewo czyste, commit 9816abc)

Bramki są zielone przed startem, więc każda regresja będzie moja:

| Pomiar | Wartość | Zgodność z planem |
|---|---|---|
| api testy | 30 suit / 296 testów PASS | — |
| web testy | 35 suit / 117 testów PASS | — |
| `tsc --strict` w api | exit 0, zero błędów | ✔ Task 4 to przełącznik, nie sesja naprawcza |
| api lint (bez `--fix`) | 0 błędów, 8 warningów | — |
| web lint | 0 błędów, 3 warningi `exhaustive-deps` w `CourseCatalog.tsx`, `CourseDetails.tsx` | pliki dotykane przez Task 17 |
| importy z ukośnikiem w api | 23 wystąpienia | plan mówił 20 |
| brakujące barrele `dto/` | 5 (`auth`, `landing`, `payments`, `video`, `search`) | ✔ |
| brakujące barrele `guards/` | 2 (`tenants`, `enrollments`) | ✔ |
| martwy kod (`SharedModule`, `UsersService`) | 0 referencji z zewnątrz | ✔ bezpieczny do usunięcia |
| polskie tytuły testów w api | 67 linii | ✔ (plan wylicza ~66) |
| web: pliki nie-kebab | 74 | ✔ |
| web: default exporty poza Next | 69 | ✔ |
| web: `import React from` | 46 | ✔ |
| web: barrele `export { default as }` | 66 linii | ✔ |
| web: importy `../` | 0 | ✔ Task 3 krok 5 już spełniony |
| komentarze ponad 2 linie | 84 bloki / 411 linii, najgorszy 22 linie w `app.module.ts:30` | ✔ |
| dryf Prettiera | **175 plików** w `apps/web/src`, 16 w root md/yml/json, `apps/api` już czysty | ✘ patrz D2 |

## Odchylenia od repo-planu (to jest cała delta)

- **D1 — root scripts nie działają na Windowsie.** `"lint": "pnpm --filter './apps/**' lint"` (i tak samo `test`, `typecheck`) trafia do cmd.exe z apostrofami i daje `No projects matched the filters`. Na CI (ubuntu/bash) działa, lokalnie to cichy no-op. W Task 1 zmieniam trzy skrypty w root `package.json` na `pnpm -r --if-present <skrypt>` — działa w obu powłokach, `packages/types` bez skryptów zostanie pominięty. Bez tego Task 18 krok 6 i Task 20 kroki 1–2 kłamią.
- **D2 — skala reformatu.** Task 1 krok 6 zapowiada „~10 plików" w web; realnie 175 plików `apps/web/src` + 16 plików md/yml w root. To nie blokada, ale diff po fazie A będzie ogromny i to on generuje konflikty z otwartymi PR-ami.
- **D3 — skaner komentarzy.** Task 18 zapisuje `/tmp/scan-comments.mjs`; na Windowsie ląduje w katalogu scratchpad sesji, nie w `/tmp`.
- **D4 — lint api mutuje do czasu Task 2.** Obecny skrypt to `eslint --fix`. Do momentu przepisania (Task 2 krok 3) weryfikuję przez `pnpm --filter @app/api exec eslint "src/**/*.ts" "test/**/*.ts"`, żeby nie mieszać naprawek lintera do diffu zadania.
- **D5 — 23 zamiast 20** importów z ukośnikiem; `sed` z Task 2 kroku 4 obsłuży wszystkie, weryfikacja greppem zostaje bez zmian.
- **D6 — Task 3 krok 2, rejestracja pluginu.** Obecny `apps/web/eslint.config.mjs` nie ma bloków `settings`/`rules`. Jeśli po dodaniu reguł ESLint powie „rule 'import/order' not found", rejestruję plugin jawnie — fallback jest opisany w planie.
- **D7 — e2e wymaga dockera.** Task 20 krok 3: postgres na porcie 5434, hasło `password`, baza `course_platform_test` tworzona ręcznie + `prisma migrate deploy`. Jeśli docker nie wstanie, raportuję to jako nieuruchomioną bramkę zamiast pominąć po cichu.

## Fazy

**Faza A — tooling (Taski 1–5).** Root `.prettierrc` + `.prettierignore`, kasacja `apps/api/.prettierrc`, prettier w root devDeps, skrypty `format`/`format:check` + naprawa D1, reformat repo, ESLint api (import/order, no-cycle, no-restricted-imports, `any` na warn, lint bez `--fix` + `lint:fix`), ESLint web (import/order, no-cycle, zakaz `../`, `consistent-type-imports`) z rozbiciem cyklu w `features/register/`, `strict: true` w `apps/api/tsconfig.json`, gate `format:check` w `.github/workflows/ci.yml`. Bramka: oba lint zielone, oba typecheck, oba testy, `format:check`.

**Faza B — api (Taski 6–10).** `src/search/` → `src/modules/search/`, `reorder-sections-dto.ts` → `reorder-sections.dto.ts`, `tenant-resolver.serice.spec.ts` → `.service.spec.ts`, 5 barreli `dto/` + 2 `guards/` i przepięcie konsumentów, usunięcie `shared.module.ts` i `modules/users/`, tłumaczenie 67 polskich tytułów testów. Bramka: typecheck + lint + testy, liczba testów spada dokładnie o suitę usuniętego `users.service.spec.ts`.

**Faza C — web (Taski 11–18).** Przenosiny `icons/` → `components/icons/`, `context/` → `lib/context/`, `hooks/` → `lib/hooks/` (29 plików-konsumentów), potem kebab-case + named exporty katalogami: `components/` (14), `features/courses-page/` (30), `features/creator/` (19), reszta (login, register, lib, types) — w każdym przypadku rename, zamiana `export default` na `export`, przepisanie barrela na `export * from './x'`, naprawa bezpośrednich importów. Dalej: `function` zamiast `React.FC` (24 wystąpienia), `loginForm` → `LoginForm`, `excludedPaths` → `EXCLUDED_PATHS`, `.spec.ts` → `.test.ts` w web, `import * as React` w 46 plikach, kolejność hooków w 9 plikach, i sweep komentarzy (84 bloki; 13 długich przenosi uzasadnienie do `docs/`). Bramka po każdym tasku: typecheck + lint + testy + `format:check`; po Tasku 15 dodatkowo `API_URL=... pnpm --filter @app/web build`.

**Faza D — dokumentacja i domknięcie (Taski 19–20).** `docs/conventions.md` (treść podana w planie dosłownie), link w `AGENTS.md`, trzy edycje w `README.md`, cztery w `docs/review-guide.md`. Na koniec pełne bramki: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`, e2e z dockerem, build web, plus trzy greppy na reguły, których żadne narzędzie nie pilnuje.

## Pliki krytyczne

Konfiguracja: `.prettierrc`, `.prettierignore`, `package.json` (root), `apps/api/eslint.config.mjs`, `apps/api/package.json`, `apps/web/eslint.config.mjs`, `apps/api/tsconfig.json`, `.github/workflows/ci.yml`.
Wzorzec powtarzalny (rename + named export + barrel), reprezentatywne ścieżki: `apps/web/src/components/index.ts`, `apps/web/src/features/courses-page/course-details/`, `apps/web/src/features/creator/courses/[id]/`, `apps/web/src/features/register/`.
Dokumentacja: `docs/conventions.md` (nowy), `AGENTS.md`, `README.md`, `docs/review-guide.md`.
Ryzykowne punktowo: `apps/api/src/app.module.ts` (22-liniowy komentarz o ThrottlerModule — uzasadnienie idzie do `docs/`, nie do kosza), `apps/web/src/features/register/CreatorRegisterForm.tsx` (rozbicie cyklu typów), `apps/web/src/proxy.ts` (Next 16 — przed edycją czytam `node_modules/next/dist/docs/` zgodnie z `apps/web/AGENTS.md`).

## Weryfikacja

Po każdym zadaniu bramki wskazane w repo-planie; poza tym:

1. **Regresja testowa** — po każdej fazie `pnpm --filter @app/api test` i `pnpm --filter @app/web test` z liczbami porównanymi do baseline'u (296 i 117; jedyna dozwolona zmiana to −1 suita w Fazie B).
2. **Czystość mechaniczna** — `pnpm format:check` po każdym zadaniu dotykającym plików; `import/no-cycle` w obu apkach pilnuje, że nowe barrele nie zrobiły cyklu.
3. **Brak dryfu behawioralnego w Tasku 17** — `git diff` czytany hunk po hunku: każdy musi być czystym przeniesieniem linii, tablice zależności bajt w bajt te same.
4. **Brak dryfu w Tasku 18** — `git diff` dla `apps/*/src` i `apps/api/test`: wyłącznie linie komentarzy plus nowe pliki w `docs/`.
5. **Reguły bez lintera** — skaner komentarzy (zero wyjścia), grep na pliki nie-kebab (zero), grep na `export default` poza `page.tsx`/`layout.tsx`/`proxy.ts` (zero).
6. **End-to-end** — `pnpm test:e2e` na lokalnym postgresie (docker compose, port 5434, `course_platform_test` + `prisma migrate deploy`) oraz produkcyjny build web z `API_URL`.
7. **Raport końcowy** — uruchomione bramki i ich wyniki, `git status --short | wc -l`, lista odchyleń od planu. Bez commita.
