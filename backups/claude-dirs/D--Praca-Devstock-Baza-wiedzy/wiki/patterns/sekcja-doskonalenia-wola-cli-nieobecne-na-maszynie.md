# sekcja-doskonalenia-wola-cli-nieobecne-na-maszynie

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sekcja 9 skilla każe po zamknięciu konsultacji zapisać dowody przez `node "$HOME/.claude/skill-evolution/cli.mjs" record …` i uruchomić `evolve-skill`. Na maszynie Rafała tego narzędzia nie ma. Oba kroki są więc pomijane z jednym zdaniem w raporcie. Dowody z sesji trafiają do wiki tylko wtedy, gdy Rafał sam wywoła `/podsumuj-sesja-claude`.

## Przyczyna źródłowa
Sekcja 9 zakłada lokalne narzędzie poza repo, które istnieje w innym środowisku pracy skilla. W tym środowisku dowody o skillach zbiera wiki repo (`.claude/wiki/`, skill `podsumuj-sesja-claude`), a `evolve-skill` czyta właśnie je. Warunek „bez narzędzia pomiń oba kroki” chroni przed błędem, ale nie wskazuje kanału zastępczego. Krok, który ma zebrać dowody, przy każdym zamknięciu kończy się więc samym zdaniem o pominięciu.

## Dowody
- 2026-11-09, sesja 0facbde7-f16e-4ba0-a2f0-b304f63f372a (id claude.ai niedostępny; DT-81): kroki 1–2 sekcji 9 pominięte, bo `cli.mjs` nie istnieje; zapisane jako uwaga na stronie [[zamkniecie-konsultacji-koliduje-z-markerem-bramki]].
- 2026-11-10, sesja session_01WryF5Vs7iJSRzH27PExCPE (lokalnie d05fa43f-c46f-49dc-9cd3-4eb8fdea782f; koncept „Darmowa lekcja w kursie”): `ls` potwierdził brak `$HOME/.claude/skill-evolution/cli.mjs`. Raport zamknięcia mówi wprost o pominięciu kroków. Dowody z sesji zapisało dopiero `/podsumuj-sesja-claude` wywołane przez Rafała.

## Rozwiązanie
W sekcji 9: „Bez `cli.mjs` kanałem dowodów jest wiki repo. W raporcie zamknięcia zaproponuj jednym zdaniem `/podsumuj-sesja-claude`, które zapisze dowody do `.claude/wiki/`, a `evolve-skill konsultant-ux-kodozercy` uruchamiaj z sygnału tego skilla”.
