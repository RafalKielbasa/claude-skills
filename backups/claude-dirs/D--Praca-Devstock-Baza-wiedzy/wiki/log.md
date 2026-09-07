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
