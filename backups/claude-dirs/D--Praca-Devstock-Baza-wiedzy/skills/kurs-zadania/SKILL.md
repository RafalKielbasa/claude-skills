---
name: kurs-zadania
description: Generowanie quizu i ćwiczeń (automatyzacja webhook, prompt, dopasowanie/sortowanie) z zatwierdzonej treści lekcji kursu, z walidacją. Używaj, gdy Rafał chce wygenerować lub poprawić zadania (quiz.json + cwiczenia/) dla lekcji ze statusem tresc: zatwierdzona.
---

# /kurs-zadania — quiz i ćwiczenia z zatwierdzonej treści

Wejście: ścieżka lekcji, np. `kursy/<slug>/modul-01-x/lekcja-02-y`. Wymaga
`status.tresc: zatwierdzona` — quiz i ćwiczenia testują dokładnie zatwierdzoną
treść, nie szkic.
Wynik: `quiz.json` w statusie `status.zadania: do_review` (+ opcjonalnie
`cwiczenia/*.json`), przedstawione Rafałowi do bramki review.

## Procedura

1. **Bramka wejścia.** Sprawdź `lekcja.yaml`. Jeśli plik nie istnieje —
   przerwij i skieruj na `/kurs-nowy`. Jeśli `status.tresc != zatwierdzona` —
   przerwij i skieruj na dokończenie `/kurs-lekcja` (bramka Rafała dla treści)
   najpierw; nie generuj zadań z treści w statusie `szkic`/`do_review`.
2. **Kontekst.** Przeczytaj W CAŁOŚCI:
   - `kursy/_wspolne/szablony/struktura-zadania.md` (schemat plików, trzy
     rodzaje ćwiczeń, checklist jakości),
   - `kursy/_wspolne/styleguide.md`, sekcje "Typografia" i "Grywalizacja" —
     obowiązują quiz i ćwiczenia tak samo jak artykuł,
   - `kurs.yaml` kursu (miejsce lekcji w programie, cel modułu),
   - `lekcja.yaml` (cel lekcji),
   - **zatwierdzony** `artykul.md` tej lekcji — zakres wiedzy dla pytań
     i ćwiczeń; nie wprowadzaj wiedzy spoza lekcji,
   - **zatwierdzony** `video/scenariusz.md` — po akceptacji to on jest
     źródłem prawdy merytorycznej (struktura-lekcji.md). Gdy fakt brzmi
     inaczej niż w artykule, obowiązuje wersja ze scenariusza; zgłoś
     rozjazd Rafałowi na bramce, bo to artykuł wymaga poprawki.
3. **Generowanie:**
   a. `quiz.json` — zawsze. 3–6 pytań, mix `single`/`multi`, dystraktory
      wiarygodne (typowe pomyłki, nie absurdy), każda poprawna odpowiedź
      weryfikowalna w `artykul.md`. Trzy twarde reguły formy:
      - `czas_min` = liczba pytań (minuta na pytanie): 5 pytań → `5`,
        8 pytań → `8`. Walidator to sprawdza.
      - Treść pytania `multi` NIE zapowiada wielokrotnego wyboru — zero
        dopisków "(zaznacz wszystkie pasujące)" i wariantów; tryb pytania
        pokazuje platforma.
      - Każda odpowiedź ≤ 70 znaków. Nie mieści się? Przenieś kontekst do
        treści pytania, nie rozpychaj odpowiedzi.
   b. Oceń charakter sekcji "Praktyka krok po kroku" artykułu i wybierz **co
      najwyżej jeden** pasujący rodzaj ćwiczenia (struktura-zadania.md ma
      pełny schemat każdego):
      - **`automatyzacja`** — praktyka daje się przełożyć na testowalne
        `input`→`output` (automatyzacja/workflow, np. n8n). `typ:
        AUTOMATION_ANSWER` domyślnie, jednoznaczny `przyklad` i 3 różne
        `testy`.
      - **`prompt`** — praktyka to pisanie/dopracowywanie promptu. Jasne
        `instrukcje_oceniajace` (co model oceniający ma sprawdzić, kiedy
        uznać za wykonane) — bez miejsca na interpretację.
      - **`dopasowanie`** — praktyka sprawdza znajomość pojęć lub kolejności
        kroków, ale nie wymaga budowania niczego. `kategoria: MATCH`/
        `CATEGORIZE` dla par pojęcie↔znaczenie, `SORT` dla kolejności kroków
        z jedną logicznie poprawną odpowiedzią.
      - **Żaden nie pasuje** — **nie fabrykuj ćwiczenia na siłę**; pomiń
        `cwiczenia/` i przygotuj krótkie uzasadnienie na bramkę.
      Nazwa pliku: `cwiczenia/<rodzaj>-01-<krotki-slug>.json`.
4. **Samokontrola.** Sprawdź checklistę jakości ze `struktura-zadania.md` dla
   quizu i wybranego rodzaju ćwiczenia. Dla quizu policz osobno: `czas_min`
   równy liczbie pytań, żadna treść pytania nie zapowiada wielokrotnego
   wyboru, żadna odpowiedź nie przekracza 70 znaków. Osobno przejdź
   typografię: zero pauz (—) i półpauz (–) w roli myślnika (dywiz `-` ze
   spacjami), tylko proste cudzysłowy `"` i `'`, twarda spacja U+00A0 po
   jednoliterowych słowach (`a i o u w z`) w polach widocznych dla kursanta —
   `tytul`, `opis`, treści i odpowiedzi pytań, `wskazowki`, `elementy`,
   `cele`. Zero grywalizacji: pytanie ani ćwiczenie nie obiecuje odznaki,
   rangi, punktów ani awansu — nagrody pokazuje platforma, treść o nich
   milczy.
5. **Walidacja.** Ustaw `status.zadania: do_review` w `lekcja.yaml`, potem
   `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>` —
   napraw wszystkie BŁĘDY.
6. **BRAMKA: prezentacja Rafałowi.** Pokaż: treść pytań quizu (z poprawnymi
   odpowiedziami oznaczonymi), wygenerowane ćwiczenie (polecenie + treść
   właściwa dla rodzaju) albo uzasadnienie, czemu go nie ma. Uwagi Rafała
   nanoś od ręki i iteruj.
7. **Po zatwierdzeniu przez Rafała:** ustaw `status.zadania: zatwierdzone`,
   uruchom walidację ponownie, commit
   `kurs(<slug>): zadania lekcji NN-y zatwierdzone`.

## Zasady

- NIE publikuje do CMS ani nie zakłada kont zewnętrznych API — to
  `/kurs-publikuj` (kolejny etap).
- Obsługiwane rodzaje ćwiczeń: `automatyzacja`, `prompt`, `dopasowanie`
  (patrz `struktura-zadania.md`). Inne typy platformy (kod, sandbox) są poza
  zakresem — kurs ma zasadę "bariera kodu", kursant nie pisze kodu.
- Co najwyżej jedno ćwiczenie na lekcję. Opcjonalne: brak pasującego rodzaju
  = brak ćwiczenia, nie sztucznie dopasowane zadanie.
- Poprawki po review Rafała nie wymagają pełnej regeneracji, chyba że
  zmieniła się większość treści.
