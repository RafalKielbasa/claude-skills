# PURPOSE — kurs-zadania

## Pochodzenie

Skill powstał 2026-07-17 jako etap 1c pipeline'u treści kursowych: generowanie quizu i ćwiczeń z **zatwierdzonej** treści lekcji, do statusu `zadania: do_review`, z walidacją przed bramką Rafała. Spec zakładający ten etap to `docs/superpowers/specs/2026-07-13-pipeline-tresci-kursowych-design.md` — wymienia `/kurs-zadania` w tabeli etapów („wejście: zatwierdzona treść, wyjście: `quiz.json` + `cwiczenia/`, bramka: zatwierdzenie zadań") i przypisuje go do etapu 1c razem z `/kurs-publikuj`. Skill nigdy nie miał specu poświęconego wyłącznie sobie.

Warunek wejścia — `status.tresc: zatwierdzona` — jest w projekcie od pierwszego commita i wynika wprost ze specu: quiz testuje treść, która przeszła bramkę, a nie szkic. Dwa commity z 2026-07-17 (`06b2dbf`, potem `754addc`) rozbudowały skill z samego quizu do quizu plus jednego z trzech rodzajów ćwiczeń (`automatyzacja`, `prompt`, `dopasowanie`).

Wszystkie pięć commitów dotykających `SKILL.md` daje się przypisać jednoznacznie po treści diffu (`git show <sha> -- .claude/skills/kurs-zadania/SKILL.md`) — w tej historii nie ma pozycji nieustalonych. Późniejsze zmiany szły poza `evolve-skill`, wprost z pracy nad kursem: reguły typografii i grywalizacji przyszły tym samym commitem, który wniósł je do `kurs-lekcja`, a twarde reguły formy quizu — z sesji poprawiania quizów modułu 1.

## Adresowane wzorce

- [walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki](../../wiki/patterns/walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki.md) — Krok 5 (2026-09-10, walidacja katalogu lekcji zamiast katalogu kursu)

## Historia ewolucji

- 2026-07-17 — utworzenie skilla: bramka wejścia na `status.tresc: zatwierdzona` (krok 1), kontekst ze `struktura-zadania.md`, `kurs.yaml`, `lekcja.yaml` i zatwierdzonego artykułu (krok 2), generowanie `quiz.json` (krok 3a), samokontrola, walidacja i bramka Rafała — powód: etap 1c pipeline'u treści kursowych — wynik: wprowadzona ręcznie — źródło: `06b2dbf`, spec `docs/superpowers/specs/2026-07-13-pipeline-tresci-kursowych-design.md`
- 2026-07-17 — krok 3b: wybór **co najwyżej jednego** rodzaju ćwiczenia z trzech (`automatyzacja`, `prompt`, `dopasowanie`) na podstawie charakteru sekcji „Praktyka krok po kroku", z jawną ścieżką „żaden nie pasuje = brak ćwiczenia, nie fabrykuj na siłę" — powód: rozszerzenie skilla poza sam quiz — wynik: wprowadzona ręcznie — źródło: `754addc`
- 2026-08-24 — krok 2 dostaje styleguide (sekcje „Typografia" i „Grywalizacja") jako obowiązkową lekturę, a krok 4 — osobne przejście typograficzne po polach widocznych dla kursanta (`tytul`, `opis`, treści i odpowiedzi pytań, `wskazowki`, `elementy`, `cele`) oraz zakaz obiecywania odznak, rang, punktów i awansów — powód: reguły styleguide'u obowiązują quiz i ćwiczenia tak samo jak artykuł — wynik: wprowadzona ręcznie — źródło: `e50a62d` (ten sam commit wniósł te reguły do `kurs-lekcja`)
- 2026-08-25 — krok 2: zatwierdzony `video/scenariusz.md` dołączony do lektury obowiązkowej jako źródło prawdy merytorycznej po akceptacji; artykuł przestaje być „jedynym źródłem prawdy" i staje się „zakresem wiedzy", a rozjazd faktu między nimi rozstrzyga się na rzecz scenariusza i idzie do bramki — powód: nadrzędność scenariusza ze `struktura-lekcji.md` — wynik: wprowadzona ręcznie — źródło: `f11f452`
- 2026-08-27 — krok 3a: trzy twarde reguły formy quizu (`czas_min` = liczba pytań, treść pytania `multi` nie zapowiada wielokrotnego wyboru, każda odpowiedź ≤ 70 znaków) i rozbicie samokontroli tak, żeby liczyć je osobno — powód: powtarzalne defekty quizów wyłapywane dopiero przez walidator — wynik: wprowadzona ręcznie — źródło: `6bebc49`
- 2026-09-10 — krok 5: walidacja katalogu lekcji (`../../kursy/<slug>/modul-NN-x/lekcja-NN-y`) zamiast katalogu kursu, z dopiskiem, że błędy z innych lekcji nie wchodzą do tej bramki — powód: wzorzec `walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki` z 4 dowodami z 4 sesji; ta sama poprawka weszła do `kurs-redakcja` 2026-09-07 i `kurs-lekcja` 2026-09-10, `kurs-zadania` był ostatnim niepoprawionym skillem rodziny — wynik: zaakceptowana przez `/evolve-skill` — źródło: `.claude/wiki/skill-impact.md`, wpis 2026-09-10 — kurs-zadania; sesja `https://claude.ai/code/session_01316pV2UPCFTTDHE9dksP6H`
