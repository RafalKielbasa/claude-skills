# Wiki — log ewolucji (repo Baza wiedzy)

Chronologiczny zapis sesji: co zostało założone, dopisane i zdecydowane.
Najnowszy wpis na KOŃCU pliku (odwrotnie niż w dzienniku sesji), bo ten plik
czyta skill `evolve-skill` od początku, a nie człowiek rano. Wpis wymienia też
wzorce globalne (`~/.claude/wiki/`) dotknięte w sesji, żeby log repo był
kompletnym zapisem sesji.

Format wpisu:

    ## YYYY-MM-DD — sesja <identyfikator>
    - Założono: <wzorzec> (dowód: <krótko>)
    - Dopisano dowód: <wzorzec>
    - Nawrót: <wzorzec> po zmianie z YYYY-MM-DD

## 2026-09-07 — sesja session_01BFVYzhLh64ykBPjopBZyHU
- Wiki repo założone w tej sesji (`/kurs-redakcja` M00L01, kurs agenty-ai).
- Założono: walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki (dowód: `npm run validate -- ../../kursy/agenty-ai` → 57 błędów, wszystkie w `modul-01-*/quiz.json`, pliki nietknięte; katalog lekcji → czysto; Rafał: „czemu uruchamiamy walidator całego kursu, przecież pracujemy lekcja po lekcji"; skill poprawiony w tej samej sesji → status zaadresowany)
- Założono: reczne-dopiski-autora-w-drzewie-przed-redakcja (sukces; dwie niezacommitowane linie Rafała w scenariuszu wykryte przed startem i przekazane agentowi B jako „treść zostaje, język i zapis do poprawy"; wynik: czyste fragmenty, 4 nowe wiersze `wymowa.md`, rozjazd z artykułem zgłoszony i domknięty w bramce)
- Założono: grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (dowód: `grep -c "Też w wideo"` → 0 i `grep "🎬"` → nic na pliku z pięcioma calloutami; kotwica `wideo**` → 5; „zwrot z inwestycji" niewidoczne przez U+00A0 po „z")
- Założono: bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu (sukces; jedno `AskUserQuestion` Model / Effort / Start, odpowiedź „fable, xhigh, Scenariusz i artykuł" — zakres większy niż w prośbie, bez dodatkowej tury)
- Zmiana skilla: kurs-redakcja krok 6 — walidacja katalogu lekcji zamiast kursu, na zgodę użytkownika („zgadzam się z twoją propozycją"), poza `evolve-skill`; pełny diff w `skill-impact.md`.
- Globalne (`~/.claude/wiki/`): założono decyzja-w-bramce-bez-przed-i-po; dopisano dowody: cd-w-komendzie-bash-przestawia-katalog-kolejnych-wywolan, twierdzenie-o-pliku-bez-odczytu, subagent-zglasza-sprzecznosc-zamiast-dopasowac-test.
- Sygnał: brak wzorców repo do ewolucji — wszystkie mają dowody z jednej sesji, jedyna porażka `otwarta` (grep) ma 1 dowód. Żaden wzorzec nie ma statusu `nawrót`.

## 2026-09-09 — sesja session_01PrFurqNDm53ZdkCryE5kjm (`/kurs-redakcja` M00L02 + zmiana zapisu fonetycznego kursu agenty-ai)
- Założono: decyzja-fonetyczna-rozstrzygana-odsluchem (sukces; Rafał zgłosił „n osiem n było przeczytane ny 8 en", uruchomiony pierwszy raz `experiments/wymowa-proba.mjs` — katalog wyników nie istniał — sześć próbek, werdykt „json 1 i 2 super 0 zły akcent, n 8 n 1 wygrywa", dopiero potem podmiana)
- Założono: lista-wymowy-poprawiona-przed-startem-agenta (sukces; `wymowa.md` i `redakcja.md` zmienione przed dispatchem grupy B, prompt nazwał zmianę z liczbą wystąpień; wynik: 19 × `"en osiem en"`, 4 × `dżejson`, zero pozostałości starego zapisu)
- Założono: agent-redakcji-naprawia-rozjazd-zamiast-go-zglosic (porażka; agent A osłabił hedge „prawie nigdy" → „nigdy… zawsze" i dopisał 7 glos angielskich terminów wbrew regule „wątpliwość = zostaw bez zmian", zgłaszając to dopiero w raporcie)
- Dopisano dowód: grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (drugi dowód, druga sesja: `grep -c "w wideo"` → 0 przy sześciu calloutach, `od -c` pokazał `w 302 240 wideo`; nowe — `.` w Git Bash dopasowuje bajt, nie znak, więc `"Te.* w wideo"` też chybia, a raport subagenta podał 8 calloutów zamiast 6)
- Dopisano dowód: bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu (drugi dowód: cztery pytania w jednym wywołaniu — odsłuch / zakres / model / effort — z tabelą siedmiu scenariuszy i kosztem re-renderu nad pytaniem; Rafał zawęził zakres do M00L02 jedną odpowiedzią)
- Brak nawrotu: `walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki` (zaadresowany 2026-09-07) — krok 6 uruchomiony na katalogu lekcji, walidacja czysta, żaden cudzy błąd nie wszedł do bramki.
- Globalne (`~/.claude/wiki/`): dopisano dowód twierdzenie-o-pliku-bez-odczytu (liczba calloutów w raporcie subagenta podana bez kontroli).
- Sygnał: brak wzorców repo do ewolucji. Jedyna porażka z dowodami z więcej niż jednej sesji (`grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji`, 2 dowody z 2 sesji) nie przekracza progu „więcej niż dwie sesje"; nowa porażka `agent-redakcji-naprawia-rozjazd-zamiast-go-zglosic` ma 1 dowód. Żaden wzorzec nie ma statusu `nawrót`.
