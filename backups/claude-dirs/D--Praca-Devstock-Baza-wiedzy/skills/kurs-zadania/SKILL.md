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
   a. `quiz.json` — zawsze. 5–6 pytań (5 to minimum platformy, mniejszy quiz jest odrzucany), mix `single`/`multi`, dystraktory
      wiarygodne (typowe pomyłki, nie absurdy), każda poprawna odpowiedź
      weryfikowalna w `artykul.md`. Cztery twarde reguły formy:
      - `czas_min` = liczba pytań (minuta na pytanie): 5 pytań → `5`,
        8 pytań → `8`. Walidator to sprawdza.
      - Treść pytania `multi` NIE zapowiada wielokrotnego wyboru — zero
        dopisków "(zaznacz wszystkie pasujące)" i wariantów; tryb pytania
        pokazuje platforma.
      - Treść pytania (`tresc`) ≤ 185 znaków — CMS nie przyjmuje dłuższej
        (`kursy/_wspolne/uwagi.md`). Walidator to sprawdza. Nie mieści się?
        Utnij tło i przykłady z pytania, zostaw samo pytanie — kontekst
        kursant ma z lekcji.
      - Każda odpowiedź ≤ 69 znaków (platforma odrzuca 70 i więcej). Nie mieści się? Przenieś kontekst do
        treści pytania (pilnując limitu 185), nie rozpychaj odpowiedzi.
   b. Oceń charakter sekcji "Praktyka krok po kroku" artykułu i wybierz **co
      najwyżej jeden** pasujący rodzaj ćwiczenia (struktura-zadania.md ma
      pełny schemat każdego):
      - **`automatyzacja`** — praktyka daje się przełożyć na testowalne
        `input`→`output` (automatyzacja/workflow, np. n8n). `typ:
        AUTOMATION_ANSWER` domyślnie, jednoznaczny `przyklad` i 3 różne
        `testy`.
      - **`prompt`** — praktyka to pisanie/dopracowywanie promptu. Jasne
        `instrukcje_oceniajace` (co model oceniający ma sprawdzić, kiedy
        uznać za wykonane) — bez miejsca na interpretację. `limit_prob` 1..10
        i `limit_czasu_s` 60..3600 s (zakresy platformy).
      - **`dopasowanie`** — praktyka sprawdza znajomość pojęć lub kolejności
        kroków, ale nie wymaga budowania niczego. `kategoria: MATCH`/
        `CATEGORIZE` dla par pojęcie↔znaczenie, `SORT` dla kolejności kroków
        z jedną logicznie poprawną odpowiedzią. Wszystkie trzy kategorie mają
        ten sam komplet pól: `elementy` + `cele` + `rozwiazanie`; w `SORT`
        `cele` to numery pozycji `["1" … "N"]`. Kolejności list NIE ustawiasz
        sam — od tego jest `npm run tasuj` w kroku 5.
      - **Żaden nie pasuje** — **nie fabrykuj ćwiczenia na siłę**; pomiń
        `cwiczenia/` i przygotuj krótkie uzasadnienie na bramkę.
      Nazwa pliku: `cwiczenia/<rodzaj>-01-<krotki-slug>.json`.
4. **Samokontrola.** Sprawdź checklistę jakości ze `struktura-zadania.md` dla
   quizu i wybranego rodzaju ćwiczenia. Dla quizu policz osobno: `czas_min`
   równy liczbie pytań, żadna treść pytania nie zapowiada wielokrotnego
   wyboru, żadna treść pytania nie przekracza 185 znaków, żadna odpowiedź
   nie przekracza 69 znaków, pytań jest 5–6. Osobno przejdź
   typografię: zero pauz (—) i półpauz (–) w roli myślnika (dywiz `-` ze
   spacjami), tylko proste cudzysłowy `"` i `'`, twarda spacja U+00A0 po
   jednoliterowych słowach (`a i o u w z`) w polach widocznych dla kursanta —
   `tytul`, `opis`, treści i odpowiedzi pytań, `wskazowki`, `elementy`,
   `cele`.
   **Kontrole tej checklisty rób odczytem pliku, nie `grep`-em po frazie
   z treści.** Po wstawieniu twardych spacji pola `opis`, `wskazowki` i treści
   pytań mają U+00A0 w środku `a i o u w z`, więc wzorzec ze zwykłą spacją
   zwróci ciche "0" na tekście, który tam na pewno jest; `grep -i` po krótkim
   akronimie (`API`) trafia z kolei w podciągi polskich słów („napisze").
   Kotwicz na fragmencie bez jednoliterowego słowa albo na granicy słowa
   (`\bAPI\b`). "0 trafień" na pliku, który właśnie napisałeś, to błąd wzorca,
   nie fakt — tak samo odbite `old_string` w `Edit`.
   Zero grywalizacji: pytanie ani ćwiczenie nie obiecuje odznaki,
   rangi, punktów ani awansu — nagrody pokazuje platforma, treść o nich
   milczy. Dla ćwiczenia `dopasowanie` sprawdź osobno, czy zadania da się
   rozwiązać bez wiedzy z lekcji: platforma renderuje obie listy w kolejności
   z pliku, więc listy wypisane parami zdradzają odpowiedź samym układem kart.
   Kolejności nie poprawiasz ręcznie — robi to `npm run tasuj` w kroku 5.
5. **Tasowanie i walidacja.** Ustaw `status.zadania: do_review` w
   `lekcja.yaml`. Jeśli lekcja ma ćwiczenie `dopasowanie`, najpierw
   `cd tools/course-pipeline && npm run tasuj -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`
   — komenda przestawia `cele` (MATCH/CATEGORIZE) albo `elementy` (SORT) tak,
   żeby odpowiedź nie leżała na przekątnej; `rozwiazanie` zostaje nietknięte,
   więc tasowanie nie może zepsuć poprawnej odpowiedzi. Potem
   `npm run validate -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog
   lekcji, nie kursu — błędy z innych lekcji nie wchodzą do tej bramki) —
   napraw wszystkie BŁĘDY.
6. **BRAMKA: prezentacja Rafałowi.** Pokaż: treść pytań quizu (z poprawnymi
   odpowiedziami oznaczonymi), wygenerowane ćwiczenie (polecenie + treść
   właściwa dla rodzaju) albo uzasadnienie, czemu go nie ma. Uwagi Rafała
   nanoś od ręki i iteruj.
7. **Po zatwierdzeniu przez Rafała:** ustaw `status.zadania: zatwierdzone`,
   uruchom walidację ponownie. Zmiany zostają niezacommitowane — commit robi
   Rafał.

## Zasady

- NIE publikuje do CMS ani nie zakłada kont zewnętrznych API — to
  `/kurs-publikuj`.
- Obsługiwane rodzaje ćwiczeń: `automatyzacja`, `prompt`, `dopasowanie`
  (patrz `struktura-zadania.md`). Inne typy platformy (kod, sandbox) są poza
  zakresem — kurs ma zasadę "bariera kodu", kursant nie pisze kodu.
- Co najwyżej jedno ćwiczenie na lekcję. Opcjonalne: brak pasującego rodzaju
  = brak ćwiczenia, nie sztucznie dopasowane zadanie.
- Poprawki po review Rafała nie wymagają pełnej regeneracji, chyba że
  zmieniła się większość treści.
