# Wiki — log ewolucji (vault)

Chronologiczny zapis sesji: co zostało założone, dopisane i zdecydowane.
Najnowszy wpis na KOŃCU pliku (odwrotnie niż w dzienniku sesji), bo ten plik
czyta skill `evolve-skill` od początku, a nie człowiek rano.

Format wpisu:

    ## YYYY-MM-DD — sesja <identyfikator>
    - Założono: <wzorzec> (dowód: <krótko>)
    - Dopisano dowód: <wzorzec>
    - Nawrót: <wzorzec> po zmianie z YYYY-MM-DD
    - Wzorce globalne dotknięte w tej sesji: <lista>
    - Skill: <nazwa> — propozycja zaakceptowana | odrzucona
    - Sygnał: <wzorce kwalifikujące się do /evolve-skill> | brak

## Wpisy

## 2026-09-02 — sesja session_019Hub3mysiz4zztWAWESMQn
- Bez nowych wzorców
- Wzorce globalne dotknięte w tej sesji: pdf-read-wymaga-pdftotext, subagent-limit-zastapiony-wlasna-ocena, jednorazowe-zapoznanie-startuje-cala-nauke, przekierowanie-uzytkownika-respektowane-bez-oporu, nauka-przerwana-zostawia-punkt-wznowienia
- Sygnał: brak

## 2026-09-03 — sesja session_01TR43bKGaUWASqCrAsDE6GT
- Bez nowych wzorców (sesja nie dotknęła żadnego skilla z tego repo; zmiany objęły `praca-z-claude.md` i skill globalny `podsumuj-sesja-claude`)
- Wzorce globalne dotknięte w tej sesji: instrukcja-zakotwiczona-na-pozycji-nie-na-naglowku (założony), zmiana-skilla-poza-evolve-skill-bez-sladu (założony), plik-zmieniony-miedzy-odczytem-a-edycja (dopisany dowód)
- Sygnał: brak

## 2026-09-04/05 — sesja session_01WXmUJrXM5viDmNJuc3xjy6
- Bez nowych wzorców (sesja nie dotknęła żadnego skilla z tego repo; powstał skill globalny `code-review-master` w `~/.claude/skills/`, a w vaultcie zmieniły się tylko `.claude/specs/`, `.claude/plans/` i `praca-z-claude.md`)
- Wzorce globalne dotknięte w tej sesji: kod-referencyjny-planu-nigdy-nie-uruchomiony (założony), brief-nieaktualny-po-zmianie-planu (założony), konfiguracja-z-katalogu-domowego-wchodzi-do-testow (założony), furtka-testowa-w-strazniku-produkcyjnym (założony), subagent-zglasza-sprzecznosc-zamiast-dopasowac-test (założony), windows-path-w-literale-skryptu (dopisany dowód), mutacja-przed-dispatchem-lapie-wlasne-bledy (dopisany dowód), powershell-semantyka-wymaga-sondy-nie-czytania (dopisany dowód), twierdzenie-o-pliku-bez-odczytu (dopisany dowód), review-pr-bez-skilla-odtwarzany-za-kazdym-razem (dopisany dowód)
- Sygnał: windows-path-w-literale-skryptu (dowody z trzech różnych sesji, próg przekroczony; wzorzec globalny, decyzja o `/evolve-skill` po stronie użytkownika)

## 2026-10-15/16 — sesja c51a0755-8b46-4b7b-bca0-4c9d99ee48bd (id claude.ai niedostępny)
- Bez nowych wzorców (sesja nie dotknęła żadnego skilla z tego repo; w vaultcie zmieniły się `.claude/specs/` i `.claude/plans/` huba orkiestratora, a poza vaultem globalny `CLAUDE.md` i skill `hub`)
- Wzorce globalne dotknięte w tej sesji: codex-exec-dziedziczy-hooki-i-mcp-uzytkownika (założony), zlozona-komenda-git-z-cd-poza-regulami-allow (założony), komenda-do-wklejenia-zaklada-git-bash (założony), windows-path-w-literale-skryptu (dopisany dowód), manual-step-confirmation-checked-against-system-state (dopisany dowód), cd-w-komendzie-bash-przestawia-katalog-kolejnych-wywolan (dopisany dowód)
- Sygnał: brak
