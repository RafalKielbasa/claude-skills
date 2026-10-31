# commit-podsumowania-po-scaleniu-pr-zostaje-poza-main

- **Skill:** podsumuj-sesja-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Commit z wpisem wiki, robiony na końcu sesji, ląduje na gałęzi, której PR został już scalony do `main`.
Nikt go potem nie wypycha ani nie scala. Wychodzi na jaw dopiero przy porządkach, a wtedy trzeba osobnego PR-a
i rozwiązania konfliktu w `log.md`.

## Przyczyna źródłowa
Skill uruchamia się po kroku integracji sesji (PR i merge gałęzi worktree albo „scal dzień”), bo „kończymy
na dziś” pada po nim. Krok 8 commituje na bieżącej gałęzi i nie sprawdza, czy jej PR jest już scalony.
Gałąź jest wtedy formalnie żywa, ale martwa w obiegu: gałąź worktree nikt już nie scala, a gałąź dnia
następnego dnia zakłada się od nowa z `main`.

## Dowody
- 2026-10-31, sesja def4d1f9-b042-446f-a69e-5044f811f431 (id claude.ai niedostępny; Baza wiedzy, worktree
  `baza-wiedzy-scal-dzien`, zlecenie huba). Do `main` brakowało dwóch commitów wiki z 30.10:
  - `286538b2` (sesja 71a4e9dd, 18:59) — 15 minut po scaleniu PR #830 (17:44Z) z tej samej gałęzi
    `worktree-baza-wiedzy-w5m5`;
  - `955d1faf` (sesja Fit Body 175d9d6c, 19:47) — 10 minut po scaleniu PR #832 (18:37Z) gałęzi dnia
    `rafal-kielbasa/30-10-2026`.
  - Hub uruchomił osobną sesję. Potrzebne były: gałąź pomocnicza, scalenie z konfliktem w `log.md` i PR #835.
  - Podsumowanie tej samej sesji trafiło na tę samą pułapkę: jej gałąź (`rafal-kielbasa/30-10-2026-wiki`)
    była scalona i usunięta z `origin`. Wpis repo poszedł na nową gałąź od `origin/main`, a push i PR
    trafiły do pytania „scal dzień?”.

## Rozwiązanie
Krok 8, przed commitem w wiki repo: `git fetch` i `git merge-base --is-ancestor HEAD origin/main`.
Jeśli wynik to 0, a gałąź ma scalony PR (`gh pr list --head <gałąź> --state merged`), nie commituj na niej.
Załóż gałąź od `origin/main` (w kopii głównej: dzisiejszą gałąź dnia), commituj tam, a w raporcie daj push
i PR jako decyzję użytkownika w tej samej turze. Commit poza `main` bez takiej decyzji nie kończy skilla.
