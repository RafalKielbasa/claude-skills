---
name: kurs-nowy
description: Tworzenie programu nowego kursu — brainstorming z Rafałem, research, kurs.yaml i szkielet folderów w kursy/. Używaj, gdy Rafał chce rozpocząć nowy kurs.
---

# /kurs-nowy — program nowego kursu

Wynik: zatwierdzony program kursu zmaterializowany jako `kursy/<slug>/` ze
szkieletem folderów. NIE generuje treści lekcji — to robi `/kurs-lekcja`.

## Procedura

1. **Kontekst.** Przeczytaj `kursy/_wspolne/styleguide.md` i
   `kursy/_wspolne/szablony/struktura-lekcji.md`; dla kursu stacjonarnego
   dodatkowo `kursy/_wspolne/szablony/struktura-bloku.md`. Przejrzyj
   `kursy/_zrodla/` pod kątem istniejących materiałów
   na ten temat — wypisz Rafałowi, co znalazłeś.
2. **Brainstorming z Rafałem** — pytania POJEDYNCZO:
   - format kursu: online (wideo, tory A/B) czy stacjonarny (sala, trener
     Devstock, bloki 90 min) - wpis `format` w `kurs.yaml`; brak = online,
   - czy kursant pisze kod: `bariera_kodu` w `kurs.yaml` (`false` dla kursu
     programowania; brak = `true`, reguła ze styleguide),
   - przy kursie stacjonarnym: czy program jest narzucony dokumentem
     zamawiającego (PDF, umowa) - jeśli tak, zamiast dalszych pytań tej listy
     przejdź do trybu "program narzucony" (sekcja niżej),
   - cel biznesowy kursu (po czym poznamy sukces),
   - dla kogo dokładnie (rola, poziom techniczny),
   - efekt końcowy kursanta (co będzie umiał ZROBIĆ po kursie),
   - zakres świadomie POZA kursem,
   - orientacyjna liczba modułów i (kurs online) preferencje toru video
     (prezentacja/demo); kurs stacjonarny nie ma toru video - każdy blok
     ma `typ_bloku: zajecia`, ostatni może być `hackathon`.
3. **Research.** Aktualny stan narzędzi i tematu (WebSearch). Każde źródło
   zapisz z datą dostępu — trafi do `zrodla.md`.
4. **Propozycja programu.** Moduły → lekcje. Każdy moduł: cel biznesowy,
   3–5 lekcji, minimum 2 praktyczne projekty biznesowe. Każda lekcja: tytuł
   + typ_video (prezentacja | demo — demo tam, gdzie kursant ma patrzeć na
   ekran narzędzia). Kurs stacjonarny: każda "lekcja" to blok 90 min z
   `typ_bloku: zajecia | hackathon` zamiast `typ_video`; blok zajecia = 90 min
   (2 godziny lekcyjne); blok hackathon = 180 min (4 godziny lekcyjne) w
   JEDNYM folderze - formuła godziny/2 liczy bloki zajecia; liczba bloków
   modułu = godziny lekcyjne modułu / 2; wymóg 2 projektów biznesowych na
   moduł nie dotyczy tego formatu - praktykę niesie rytm bloku (live coding
   i zadania w każdym bloku) i hackathon na koniec. Przedstaw i iteruj z
   Rafałem.
5. **BRAMKA: Rafał zatwierdza program.** Bez wyraźnego zatwierdzenia nie
   twórz żadnych plików.
6. **Materializacja.**
   - `kursy/<slug>/kurs.yaml` — wg `kursy/_wspolne/szablony/kurs.yaml`,
     wypełniony programem (slugi kebab-case, numeracja od 1); kurs
     stacjonarny dostaje `format: stacjonarny`, `bariera_kodu` wg decyzji
     z kroku 2 i `typ_bloku` zamiast `typ_video` w każdej lekcji programu,
   - `kursy/<slug>/zrodla.md` — źródła z kroku 3 z datami,
   - folder `modul-NN-<slug>/lekcja-NN-<slug>/` dla KAŻDEJ lekcji programu
     (NN dwucyfrowe), w każdym `lekcja.yaml` wg szablonu — wypełnij tytul,
     numer, modul, cel i typ_video (kurs stacjonarny: typ_bloku zamiast
     typ_video); statusy zostaw domyślne (tresc: szkic).
     Kurs stacjonarny: szablon `kursy/_wspolne/szablony/lekcja-stacjonarna.yaml`
     (pola `format`, `typ_bloku`, bez `status.video`).
7. **Walidacja.** `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>`
   — napraw wszystkie BŁĘDY (ostrzeżenia zgłoś Rafałowi).
8. **Zakończenie.** Program i szkielet folderów zostają w drzewie roboczym
   pod `kursy/<slug>` — commit robi Rafał.

## Tryb "program narzucony" (kurs stacjonarny z dokumentu zamawiającego)

Gdy program pochodzi z dokumentu (np. "Szczegółowy program" projektu EFS+),
nie projektujesz go od nowa - mapujesz dokument na strukturę kursu:

1. Przeczytaj dokument w całości. Wypisz moduły z ich godzinami lekcyjnymi
   i punktami programu.
2. Research: sprawdź w WebSearch aktualność narzędzi wymienionych w
   dokumencie (wersje, instalacja) - nie zakresu, ten ustala dokument.
   Każde źródło zapisz z datą dostępu do `kursy/<slug>/zrodla.md`.
3. Zaproponuj mapowanie: moduł dokumentu → moduł kursu; godziny lekcyjne / 2
   → liczba bloków; punkty programu rozdzielone na bloki po tematach, w
   kolejności dokumentu. Moduł "hackathon" / "projekt końcowy" → jeden
   folder z `typ_bloku: hackathon`. Pokaż tabelę: blok, tytuł, punkty
   dokumentu, które pokrywa.
4. Godziny nieparzyste albo punkt, który nie mieści się w bloku, zgłoś
   Rafałowi jako decyzję, nie rozstrzygaj sam.
5. `cel_biznesowy` modułu i `cel` bloku piszesz z punktów dokumentu, bez
   dodawania zakresu spoza niego - dokument jest umową z zamawiającym.
   Pola kursu `nazwa`, `opis`, `poziom`, `grupa_docelowa` i `technologie`
   też czytasz z dokumentu zamawiającego i potwierdzasz z Rafałem - to one,
   nie Twoje domysły, trafiają do `kurs.yaml`.
6. Dalej jak w procedurze od kroku 5 (bramka zatwierdzenia programu) - kroki
   3 (Research) i 4 (Propozycja programu) już wykonane wyżej.

W tym trybie zasada "nie planuj więcej niż 6 modułów" nie obowiązuje: liczbę
modułów ustala dokument.

## Zasady

- Jedno pytanie na wiadomość podczas brainstormingu.
- Program ma realizować metodykę Project-Based Learning (wzorzec:
  `kursy/_zrodla/kurs-agenty/Agenda.md`); w kursie stacjonarnym PBL to
  praktyka w live codingu i zadaniach każdego bloku plus hackathon na
  koniec - nie wymóg 2 projektów biznesowych na moduł z kroku 4.
- YAGNI: nie planuj więcej niż 6 modułów; lepiej dowieźć krótszy kurs.
  Nie dotyczy trybu "program narzucony" - tam liczbę modułów daje dokument.
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
