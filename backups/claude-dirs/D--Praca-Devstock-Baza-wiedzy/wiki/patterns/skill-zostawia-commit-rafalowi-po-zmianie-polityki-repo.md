# skill-zostawia-commit-rafalowi-po-zmianie-polityki-repo

- **Skill:** spotkanie (też kurs-lekcja, kurs-nowy, kurs-redakcja, kurs-video, kurs-zadania, knowledge-base-update)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skill każe zostawić plik niezacommitowany, „commit robi Rafał”, a obowiązująca
reguła repo mówi odwrotnie: w „Bazie wiedzy” Claude commituje sam, bez pytania.
Przy każdym przebiegu Claude musi rozstrzygać sprzeczność i tłumaczyć ją
Rafałowi przy bramce.

## Przyczyna źródłowa
Reguła commitów żyła w treści skilli. 2026-09-11 zdjęto z nich kroki commitu,
bo `~/.claude/CLAUDE.md` mówił wtedy „Nie commituj”, i w ich miejsce wpisano
zdania „commit robi Rafał”. 2026-09-18 polityka się zmieniła — tryb commitów
ustala repo, a „Baza wiedzy” commituje sama — ale zdania w skillach zostały.
Skill powtarza regułę, która ma swoje jedyne źródło w `CLAUDE.md`.

## Dowody
- 2026-10-09, sesja 75fd3461 (id claude.ai niedostępny): `/spotkanie przygotuj
  2026-10-13`, krok 5 „Plik zostaje niezacommitowany — commit robi Rafał”.
  Claude zapowiedział przy bramce, że reguła repo z `CLAUDE.md` ma pierwszeństwo,
  i zacommitował agendę (`1daedb99`). Ten sam zapis jest dziś w
  `kurs-lekcja/SKILL.md:186`, `kurs-nowy:87`, `kurs-redakcja:242`,
  `kurs-video:208`, `kurs-zadania:107`, `knowledge-base-update:20`.
- 2026-10-12, sesja d06ea110-eacf-4754-90ea-c7b325490912 (id claude.ai
  niedostępny): `/spotkanie` przy dopisaniu punktu do agendy 13.10 — skill
  nadal mówi „Plik zostaje niezacommitowany — commit robi Rafał”. Claude poszedł
  za `CLAUDE.md` i zacommitował trzy zmiany agendy na gałęzi worktree
  (`87c98345`, `3c6eb979`, `b50f3f7d`), sprawdzając gałąź przed każdym.

## Rozwiązanie
Zastąp w skillach zdania „Zmiany zostają niezacommitowane — commit robi Rafał”
odesłaniem: „Commit według trybu commitów repo z `CLAUDE.md` (sekcja Git);
przed commitem sprawdź gałąź”. `knowledge-base-update` sprawdź osobno — może
celowo nie commitować w repo zewnętrznych.
