# Wiki — log ewolucji (globalne)

Chronologiczny zapis sesji: co zostało założone, dopisane i zdecydowane.
Najnowszy wpis na KOŃCU pliku (odwrotnie niż w dzienniku sesji), bo ten plik
czyta skill `evolve-skill` od początku, a nie człowiek rano.

Format wpisu:

    ## YYYY-MM-DD — sesja <identyfikator>
    - Założono: <wzorzec> (dowód: <krótko>)
    - Dopisano dowód: <wzorzec>
    - Nawrót: <wzorzec> po zmianie z YYYY-MM-DD
    - Skill: <nazwa> — propozycja zaakceptowana | odrzucona
    - Sygnał: <wzorce kwalifikujące się do /evolve-skill> | brak

## Wpisy

## 2026-09-02 — sesja session_019Hub3mysiz4zztWAWESMQn
- Założono: pdf-read-wymaga-pdftotext (dowód: `Read` zwrócił błąd braku `pdftoppm` na PDF-ie artykułu, obejście `pdftotext -layout` z mingw64)
- Założono: subagent-limit-zastapiony-wlasna-ocena (dowód: dwa podagenty badawcze padły na limicie ok. 00:15, praca dokończona własną oceną zamiast po resecie)
- Założono: jednorazowe-zapoznanie-startuje-cala-nauke (dowód: „przeprowadź mnie przez treść" uruchomiło pełny tryb nauki z roadmapą, użytkownik przerwał na pierwszym pytaniu)
- Założono: przekierowanie-uzytkownika-respektowane-bez-oporu (dowód: po „Nie będę się uczył teraz" natychmiastowe przejście do brainstormingu, bez ponawiania pytania)
- Założono: nauka-przerwana-zostawia-punkt-wznowienia (dowód: `nauka-z-claude.md` został z notatką, od czego zacząć i czego nie powtarzać)
- Sygnał: brak (każdy wzorzec ma jeden dowód z jednej sesji; próg to dowody z więcej niż dwóch sesji albo status nawrót)

Uwaga do pochodzenia tych wpisów: wzorce powstały w przebiegach testowych
Zadania 2 planu `.claude/plans/2026-09-02-wikiskill.md`, w których podagenty
wykonywały skill `podsumuj-sesja-claude` na opisie tej właśnie sesji. Opis był
prawdziwy, więc obserwacje są autentyczne. Trzy z nich wyszły niezależnie
w dwóch osobnych przebiegach i zostały tu scalone. Zapis do wiki nastąpił po
jawnej zgodzie użytkownika, już poza przebiegiem testowym.

## 2026-09-03 — sesja session_01APWRKsZej4SeoF4vvdibEC
- Założono: twierdzenie-o-pliku-bez-odczytu (dowód: „mam go w kopii" o skasowanym wpisie WikiSkill; `grep` w kopii dał 0, bo kopia powstała 2 h po zniknięciu wpisu)
- Założono: plik-zmieniony-miedzy-odczytem-a-edycja (dowód: `praca-z-claude.md` 89 044 B o 09:45 i 85 067 B o 10:24 — druga sesja Claude skasowała wpis w oknie między odczytem a cięciem)
- Założono: opcje-z-tego-co-mierzalne-nie-z-celu (dowód: cztery opcje celu zbudowane z metryk pliku odrzucone; użytkownik wpisał „Wiele notatek nie ma już sensu")
- Założono: skrypt-z-asercja-zamiast-serii-edycji (dowód: 68 cięć jednym skryptem z `assert len(src) == 655`, weryfikator potwierdził 379/379 linii treści, 0 różnic)
- Założono: windows-path-w-literale-skryptu (dowód: `SyntaxError ... truncated \UXXXXXXXX escape` na `C:\Users\rafal\.claude\skills\...` wewnątrz odtwarzanej treści)
- Sygnał: brak (każdy nowy wzorzec ma jeden dowód z jednej sesji; próg to dowody z więcej niż dwóch sesji albo status nawrót)

## 2026-09-03 — sesja session_01PKwz2sPWn4S4MPAStw2DuF
- Założono: semantyka-wizualna-z-jednej-wlasciwosci (dowód: ikona wiersza lekcji wzięta za ikonę typu na podstawie geometrii wektorów, choć koduje stan — trzy komponenty skasowane i zbudowane od nowa; drugi dowód: szewron sekcji sprawdzony przez `rotation`, wszystkie trzy zwróciły 0, a różnica siedzi w wymiarach wektora 8×4 vs 4×8)
- Założono: figma-instancje-nie-przeliczaja-po-podmianie-mistrza (dowód: po wymianie dzieci mistrza `PanelRail` dwie instancje z nadpisaną widocznością wyrenderowały dwie pozycje na `y=56`; naprawił toggle właściwości, pozostałych 11 instancji przeliczyło się samo)
- Dopisano dowód: skrypt-z-asercja-zamiast-serii-edycji (spis stanu 22 instancji `TopBar` i 7 instancji szyny kursu przed podmianą na komponenty, odtworzenie jako właściwości, weryfikacja odczytem ze wszystkich instancji zamiast zrzutem ekranu)
- Sygnał: brak (oba nowe wzorce mają dowody z jednej sesji; próg to dowody z więcej niż dwóch sesji albo status nawrót)
