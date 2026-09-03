---
name: kurs-nowy
description: Tworzenie programu nowego kursu — brainstorming z Rafałem, research, kurs.yaml i szkielet folderów w kursy/. Używaj, gdy Rafał chce rozpocząć nowy kurs.
---

# /kurs-nowy — program nowego kursu

Wynik: zatwierdzony program kursu zmaterializowany jako `kursy/<slug>/` ze
szkieletem folderów. NIE generuje treści lekcji — to robi `/kurs-lekcja`.

## Procedura

1. **Kontekst.** Przeczytaj `kursy/_wspolne/styleguide.md` i
   `kursy/_wspolne/szablony/struktura-lekcji.md`. Przejrzyj
   `kursy/_zrodla/` pod kątem istniejących materiałów
   na ten temat — wypisz Rafałowi, co znalazłeś.
2. **Brainstorming z Rafałem** — pytania POJEDYNCZO:
   - cel biznesowy kursu (po czym poznamy sukces),
   - dla kogo dokładnie (rola, poziom techniczny),
   - efekt końcowy kursanta (co będzie umiał ZROBIĆ po kursie),
   - zakres świadomie POZA kursem,
   - orientacyjna liczba modułów i preferencje toru video (prezentacja/demo).
3. **Research.** Aktualny stan narzędzi i tematu (WebSearch). Każde źródło
   zapisz z datą dostępu — trafi do `zrodla.md`.
4. **Propozycja programu.** Moduły → lekcje. Każdy moduł: cel biznesowy,
   3–5 lekcji, minimum 2 praktyczne projekty biznesowe. Każda lekcja: tytuł
   + typ_video (prezentacja | demo — demo tam, gdzie kursant ma patrzeć na
   ekran narzędzia). Przedstaw i iteruj z Rafałem.
5. **BRAMKA: Rafał zatwierdza program.** Bez wyraźnego zatwierdzenia nie
   twórz żadnych plików.
6. **Materializacja.**
   - `kursy/<slug>/kurs.yaml` — wg `kursy/_wspolne/szablony/kurs.yaml`,
     wypełniony programem (slugi kebab-case, numeracja od 1),
   - `kursy/<slug>/zrodla.md` — źródła z kroku 3 z datami,
   - folder `modul-NN-<slug>/lekcja-NN-<slug>/` dla KAŻDEJ lekcji programu
     (NN dwucyfrowe), w każdym `lekcja.yaml` wg szablonu — wypełnij tytul,
     numer, modul, cel, typ_video; statusy zostaw domyślne (tresc: szkic).
7. **Walidacja.** `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>`
   — napraw wszystkie BŁĘDY (ostrzeżenia zgłoś Rafałowi).
8. **Commit.** `git add kursy/<slug>` i commit
   `kurs(<slug>): program kursu zatwierdzony`.

## Zasady

- Jedno pytanie na wiadomość podczas brainstormingu.
- Program ma realizować metodykę Project-Based Learning (wzorzec:
  `kursy/_zrodla/kurs-agenty/Agenda.md`).
- YAGNI: nie planuj więcej niż 6 modułów; lepiej dowieźć krótszy kurs.
- Tytuły modułów i lekcji w `kurs.yaml`/`lekcja.yaml` pisz w typografii ze
  styleguide (sekcja "Typografia"): bez pauz i półpauz, proste cudzysłowy,
  twarda spacja U+00A0 po jednoliterowych słowach — trafiają na platformę jako
  treść widoczna dla kursanta. Walidator ich nie sprawdza, więc pilnuj sam.
- Grywalizacja (odznaki, rangi, punkty, boss-fighty) to warstwa platformy, nie
  wątek narracyjny lekcji — styleguide, sekcja "Grywalizacja". Jeśli kurs ma
  ścieżkę odznak i rang, zapisz ją jako adnotację `grywalizacja` (`odznaka` +
  `ranga`) w `lekcja.yaml` każdej lekcji, a tytuły modułów i lekcji trzymaj
  wolne od nazw nagród. Sam pomysł na oprawę może żyć w `zrodla.md` i w opisie
  sprzedażowym kursu; do treści lekcji nie wchodzi.
