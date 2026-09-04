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

## 2026-09-03 — sesja session_01APWRKsZej4SeoF4vvdibEC (druga część)
- Założono: regula-ciecia-usuwa-zakres-nie-szczegol (dowód: przy przepisywaniu #168 wg reguły głębokości ticketu zniknął cały punkt o `CatalogFilterProvider` oraz reguła życia klienta zapytań, obie niemożliwe do odzyskania z kodu; wyłapał to `codex exec`, nie własna lista kontrolna). Status od razu zaadresowany: cztery odpowiadające pozycje dopisane do `self-check.md` skilla `github-tickets` w tej samej sesji.
- Założono: kalibracja-na-jednym-elemencie-przed-paczka (dowód: #168 przepisany jako pierwszy i pokazany w całości; po „Jest super, tnij" czternaście pozostałych poszło tym samym cięciem bez poprawek kalibracyjnych)
- Założono: sciezka-skrocona-nie-jest-klikalna (dowód: podana ścieżka `scratchpad/tickets-new/168.md`, użytkownik: „Nie działa mi link"; plik był pod pełną ścieżką w katalogu tymczasowym sesji)
- Dopisano dowód: twierdzenie-o-pliku-bez-odczytu (dwa fałszywe twierdzenia o stanie repozytorium przeniesione bez sprawdzenia ze starych treści ticketów do nowych, w #171 i #183; oba wyłapał `codex exec`)
- Dopisano dowód: windows-path-w-literale-skryptu (heredoc `<<'SPECEOF'` w narzędziu Bash padł na apostrofach w angielskim tekście — `skill's`, `child's` — nie na ścieżce Windows; ten sam wyzwalacz co pierwotny dowód, inny znak)
- Dopisano dowód: skrypt-z-asercja-zamiast-serii-edycji (wstawienie wpisu do `praca-z-claude.md` z asercją nagłówka i sprawdzeniem przyrostu linii 635+39+2=676; wysyłka 15 przepisanych ticketów zweryfikowana odczytem treści z GitHuba wobec draftów, nie założeniem, że polecenia się powiodły)
- Sygnał: brak (wszystkie trzy nowe wzorce mają jeden dowód z jednej sesji; próg to dowody z więcej niż dwóch sesji albo status nawrót)

## 2026-09-03/04 — sesja session_0115YBg2ri1ajCfG8GNynEsZ
- Założono: mutacja-przed-dispatchem-lapie-wlasne-bledy (dowód: test rozjazdu historii symetryczny 1/1 nie dyskryminował kierunku; arytmetyka strażnika mergea `$before + 2` zamiast `$before + 1`; podwójne opakowanie `@(Find-DuplicateSlug ...)` dawało `count=1` zamiast `0` — wszystkie trzy złapane mutacją przed dispatchem, plus analogiczne przypadki w Task 1, 3, 4, 6)
- Założono: subagent-odmawia-commita-mimo-jawnego-wyjatku (dowód: implementer odmówił `git commit` dwukrotnie w Task 6 i raz w finalnej fali poprawek, cytując globalne „Nie commituj" mimo opisanego w prompcie stojącego wyjątku repo-specyficznego; kontroler commitował sam po własnej weryfikacji)
- Założono: powershell-semantyka-wymaga-sondy-nie-czytania (dowód: `$PSScriptRoot` pusty w `param()` pod `-File`; `ConvertFrom-Json` rzuca na przypisaniu do nieistniejącej właściwości niezależnie od `Set-StrictMode`; `2>&1` na komendzie natywnej z `$ErrorActionPreference='Stop'` zamienia udany `git fetch --verbose` w wyjątek; zewnętrzny `@(...)` wokół `return , @(...)` podwaja opakowanie pustego wyniku — wszystkie cztery ustalone sondą, nie lekturą)
- Założono: branch-finish-zaklada-oddzielna-galaz-feature (dowód: 8-zadaniowy plan backupu `.claude` wykonany od początku wprost na `main` per pre-flight ruling; wywołanie `finishing-a-development-branch` wymagało przekazania tego w `ARGUMENTS`, bo standardowe kroki 2–4 menu merge/PR/zostaw nie miały zastosowania)
- Sygnał: brak (wszystkie cztery nowe wzorce mają dowody z jednej sesji; próg to dowody z więcej niż dwóch sesji albo status nawrót)

## 2026-09-03 — sesja session_01TR43bKGaUWASqCrAsDE6GT
- Założono: instrukcja-zakotwiczona-na-pozycji-nie-na-naglowku (dowód: sekcja `# Pomysły` dołożona nad dziennikiem w `praca-z-claude.md` weszła w konflikt z Krokiem 4 „dopisz na GÓRZE pliku"; kolizja wyłapana przed zapisem, Krok 4 przekotwiczony na nagłówek dziennika)
- Założono: zmiana-skilla-poza-evolve-skill-bez-sladu (dowód: ta sama zmiana Kroku 4, wprowadzona wprost na prośbę użytkownika, zostawiła ślad tylko w `PURPOSE.md` skilla; w `skill-impact.md` nie było jej do czasu tego kroku)
- Dopisano dowód: plik-zmieniony-miedzy-odczytem-a-edycja (dwa rozjazdy w jednej sesji: `praca-z-claude.md` zmieniony przez użytkownika w Obsidianie między `Read` a `Edit`, oraz `index.md` tego wiki wymieniający 15 wzorców przy odczycie i 19 na dysku kwadrans później — równoległa sesja session_0115YBg2ri1ajCfG8GNynEsZ; przepisanie z nieodświeżonego kontekstu skasowałoby cztery wpisy)
- Skill: podsumuj-sesja-claude — propozycja zaakceptowana (Krok 4, wpis z diffem w `skill-impact.md`)
- Sygnał: brak (oba nowe wzorce mają jeden dowód; `plik-zmieniony-miedzy-odczytem-a-edycja` ma dowody z dwóch różnych sesji, a próg to więcej niż dwie)

## 2026-09-04 — sesja session_013eH7DXzW8DZjC16fy2ZCs4
- Założono: ustalenie-w-review-potwierdzone-sonda (dowód: zamiast poprzestać na zdaniu z `apps/api/README.md:119`, dwa anonimowe `GET`-y dały `certificates/_probe.pdf → 403` wobec `thumbnails/_probe.jpg → 404`; różnica 403/404 rozstrzygnęła, że `certificateUrl` z PR #165 jest niepobieralny, bez odwoływania się do czyjejkolwiek pamięci)
- Założono: review-przez-checkout-zabiera-drzewo-uzytkownika (dowód: checkout gałęzi PR #165 podmienił `AGENTS.md` pod odczytem i zostawił klienta Prisma przy schemacie CP-89; `tsc` dał 9 błędów o brakującym `certificateUrl`, czyli o kolumnie, którą PR właśnie dodawał — po `prisma generate` zero)
- Założono: review-pr-bez-skilla-odtwarzany-za-kazdym-razem (dowód: procedura review odtworzona w locie — kryteria z `docs/review-guide.md`, własny dobór sprawdzeń, payload `POST …/pulls/165/reviews` z tablicą `comments` zamiast `gh pr review`; „inline" odczytane jako „w tej sesji", a znaczyło „komentarze przy liniach", co kosztowało turę i podwójne dostarczenie treści). Skill do review jest w budowie od tej daty — wzorzec spisany jako wymagania do wciągnięcia w niego, nie jako postulat jego powstania.
- Dopisano dowód: windows-path-w-literale-skryptu (heredoc `<<'SCRIPT'` przez narzędzie Bash padł trzeci raz na apostrofach w angielskiej prozie komentarzy review — `student's name`, `endpoint's contract`; naprawa: skrypt zapisany przez Write, payload do `gh api` przez `--input`)
- Sygnał: brak (trzy nowe wzorce mają po jednym dowodzie z jednej sesji; `windows-path-w-literale-skryptu` ma 3 dowody, ale z dwóch sesji, a próg to więcej niż dwie)
