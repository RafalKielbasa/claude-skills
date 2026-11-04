# skan-par-zadan-wykrywa-odwrocona-kolejnosc-usuwania

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: tabela pre-flight z wierszem dla każdej pary zadań dzielących pliki wykryła, że plan każe usunąć
bibliotekę (zadanie 5) przed martwym kodem aplikacji, który ją importuje (zadanie 6). W kolejności z planu TSC
i build padłyby w zadaniu 5 albo usunęłoby ono za mało. Ruling „zadanie 6 przed 5” zapisany przed pierwszym
dispatchem; review całej gałęzi potwierdziło go wprost („Running T6 before T5 was right”).

## Przyczyna źródłowa
Plan usuwania pisany per obszar (biblioteka, aplikacja) numeruje zadania według warstw, a zależność idzie
w poprzek: folder klasy `delete-chain` jest „martwy” tylko dlatego, że wszystkie jego importery są martwe —
czyli dopiero po usunięciu tych importerów. Inwentarz to mówi („a folder deleted with its importers needs no
other edit”), ale plan nie przeniósł tego na kolejność. Widać to dopiero, gdy ktoś zestawi produkt jednego
zadania z wejściem drugiego, a nie gdy czyta zadania po kolei.

## Dowody
- 2026-10-30, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, plan 9 W5):
  wiersz skanu „T5 → T6: T5 deletes `delete-chain` library folders; their dead importers include app files that
  only T6 deletes; T5 keep set says ‚minus what W5-D3 and W5-D4 free’ but D3/D4 changes happen in T6” → ruling R1.
  Zadanie 6 (opus) wypisało 34 foldery, które straciły ostatniego importera; zadanie 5 usunęło 104 ze 126
  folderów jednym przejściem z pełnym strażnikiem, CLEANGEN/TSC/BUILD/CMSBUILD zielone od pierwszego razu.

- 2026-11-04, sesja session_01WryF5UuECUFMWTUWLoBKsJ (lokalnie 78e3ca27-9604-4e3b-ad0b-1d0f66a80e7a) (code-busters-mobile, plan 1 `kodozercy-platform-mobile-release-screens`): drugi dowód. Wiersz skanu pre-flight dla pary zadań 9↔10: zadanie 9 (pojedynki 1v1) kasowało `shared/{duel-progress-steps,duel-timer-badge}.tsx`, a ekrany grupy z zadania 10 je importowały (potwierdzone `rg` na `df1ab70`). Ruling w ledgerze przed zadaniem 1: zadanie 9 zostawia pliki, zadanie 10 usuwa je po ostatnim imporcie; każde zadanie zostało zielone. Ten sam skan znalazł niekompletne Files zadania 8 (stories grupy).

## Rozwiązanie
W skanie pre-flight planu usuwającego kod: dla każdej pary zadań, z których jedno usuwa A, a drugie B
importujące A, sprawdź kolejność — usuwający importery idzie pierwszy. Klasy inwentarza typu „martwe przez
łańcuch” traktuj jako zależność od zadania, które usuwa łańcuch, i zapisz zmianę kolejności jako ruling
przed dispatchem, z listą tego, co pierwsze zadanie ma przekazać drugiemu (np. foldery, które straciły importera).
