# skill-zostawia-commit-rafalowi-po-zmianie-polityki-repo

- **Skill:** spotkanie (też kurs-lekcja, kurs-nowy, kurs-redakcja, kurs-video, kurs-zadania, kurs-uwagi, kurs-montaz, knowledge-base-update)
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
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (id claude.ai niedostępny):
  `/spotkanie transkrypt`, krok 7 („Notatka zostaje niezacommitowana — commit robi Rafał”) i
  egzekucja. Claude poszedł za `CLAUDE.md` i zacommitował notatkę z kolejkami przed bramką
  (`5e7957af`) i po egzekucji (`9545d6f9`) na gałęzi dnia `rafal-kielbasa/14-10-2026`, za każdym
  razem sprawdzając gałąź.
- 2026-10-15/16, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny):
  `/kurs-video`, krok 6 („Zmiany zostają niezacommitowane — commit robi Rafał”) przy akceptacji
  lekcji agenty-ai 0.3 i 1.1. Claude poszedł za `CLAUDE.md` i zacommitował `lekcja.yaml`
  (`68df44de`, `86e9946a`) oraz poprawki treści filmu (`d9acb5fe` slajd 5, `6106bacd` kotwice odsłon)
  na gałęzi dnia, za każdym razem sprawdzając gałąź. Pierwszy dowód z rodziny `kurs-*`.
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny): ponowny render lekcji
  agenty-ai 1.2. Trzy kolejne skille z tym samym zapisem:
  - `/kurs-uwagi` krok 11, `kurs-uwagi/SKILL.md:133` („Changes stay uncommitted — Rafał commits”);
  - migracja w `/kurs-lekcja`, `kurs-lekcja/SKILL.md:256` („Zmiany zostają niezacommitowane”);
  - `/kurs-montaz` krok 8, `kurs-montaz/SKILL.md:262`.

  Claude poszedł za `CLAUDE.md` i commitował na gałęzi dnia `rafal-kielbasa/16-10-2026`, np. `884376b9` (uwagi),
  `a0ed9773` (wymowa) i `3efe390a` (akceptacja wideo). Lista dotkniętych skilli rośnie z każdą sesją, która używa
  nowego skilla z rodziny.

## Rozwiązanie
Zastąp w skillach zdania „Zmiany zostają niezacommitowane — commit robi Rafał”
odesłaniem: „Commit według trybu commitów repo z `CLAUDE.md` (sekcja Git);
przed commitem sprawdź gałąź”. `knowledge-base-update` sprawdź osobno — może
celowo nie commitować w repo zewnętrznych.
