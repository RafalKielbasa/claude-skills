# Wiki — indeks wzorców (repo Baza wiedzy)

Katalog wzorców dotyczących skilli tego repo (`.claude/skills/`: baza-wiedzy,
knowledge-base-update, kurs-lekcja, kurs-nowy, kurs-redakcja, kurs-video,
kurs-zadania, spotkanie). Wzorce o skillach globalnych i o zachowaniach
niezależnych od repo leżą w `~/.claude/wiki/`. Jedna linia na wzorzec: problem,
przyczyna źródłowa i rozwiązanie, tak żeby dało się ocenić trafność bez
otwierania strony. Plik jest przepisywany w całości przy każdej aktualizacji.

Format wpisu:
`- [nazwa](patterns/nazwa.md) — skill: <skill|ogólny> — PROBLEM. PRZYCZYNA. FIX. (status, N dowodów)`

Status, dokładnie w jednej z trzech postaci: `otwarty` | `zaadresowany (YYYY-MM-DD, <skill>)` | `nawrót (YYYY-MM-DD)`.

## Wzorce

- [walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki](patterns/walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki.md) — skill: kurs-redakcja — Krok 6 walidował cały kurs, więc do bramki jednej lekcji weszło 57 błędów z quizów innych lekcji. Jednostką pracy skilla jest lekcja, a komenda była napisana z katalogiem kursu, choć walidator przyjmuje katalog lekcji. Walidować `../../kursy/<slug>/<modul>/<lekcja>`; błędy spoza lekcji idą do briefu jako osobne zadanie. (zaadresowany (2026-09-07, kurs-redakcja), 1 dowód)
- [reczne-dopiski-autora-w-drzewie-przed-redakcja](patterns/reczne-dopiski-autora-w-drzewie-przed-redakcja.md) — skill: kurs-redakcja — Sukces: `git diff` plików lekcji przed startem wykrył niezacommitowane dopiski Rafała, które trafiły do promptu agenta jako treść do zachowania z językiem do poprawy. Dopiski z klikania w n8n są najpewniejszą merytoryką lekcji, ale pisane szybko, z literówkami i fonetyką z głowy, więc agent bez sygnału mógłby je cofnąć. W kroku 1 diff plików, każdy fragment nazwany w prompcie: fakty zostają, język i wymowa do poprawy, nowe nazwy do `wymowa.md`. (otwarty, 1 dowód)
- [grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji](patterns/grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji.md) — skill: kurs-redakcja — Kontrolne `grep` zwraca 0 dla fraz na pewno obecnych w artykule („Też w wideo", „🎬", „zwrot z inwestycji"). Styleguide wymusza U+00A0 po jednoliterowym słowie, więc zwykła spacja w patternie nie pasuje, a emoji jako pattern w Git Bash nie trafia. Kotwiczyć na ASCII bez jednoliterowych słów (`wideo**`, `Ciebie (`) albo dopuszczać oba znaki spacji; „0 trafień" na pliku właśnie przeczytanym to błąd patternu. (otwarty, 1 dowód)
- [bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu](patterns/bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu.md) — skill: kurs-redakcja — Sukces: kroki 2 (model, effort) i 3 (potwierdzenie startu) w jednym `AskUserQuestion` po inwentaryzacji; Rafał odpowiedział raz i rozszerzył zakres. Oba kroki czekają na tę samą osobę, a odpowiedź z kroku 2 nie zmienia pytania z kroku 3. Połączyć kroki w skillu, z listą plików i konsekwencjami statusów w tekście nad pytaniem i opcją „Nie startuj". (otwarty, 1 dowód)
