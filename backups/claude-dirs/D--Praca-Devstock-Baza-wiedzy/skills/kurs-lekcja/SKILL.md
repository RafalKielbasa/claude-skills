---
name: kurs-lekcja
description: Generowanie treści jednej lekcji kursu (artykuł + scenariusz video + slajdy) z walidacją i niezależnym review AI. Używaj, gdy Rafał chce wygenerować lub poprawić lekcję istniejącego kursu.
---

# /kurs-lekcja — treść jednej lekcji

Wejście: ścieżka lekcji, np. `kursy/<slug>/modul-01-x/lekcja-02-y`.
Wynik: komplet treści w statusie `tresc: do_review` + raport `review-ai.md`,
przedstawione Rafałowi do bramki review.

## Procedura

1. **Kontekst.** Przeczytaj W CAŁOŚCI:
   - `kursy/_wspolne/styleguide.md`, `kursy/_wspolne/szablony/struktura-lekcji.md` i `kursy/_wspolne/profil-wypowiedzi.md` (profil czytasz przed pisaniem scenariusza; dotyczy wyłącznie tekstu lektora),
   - `kurs.yaml` kursu (miejsce lekcji w programie, cel modułu),
   - `lekcja.yaml` (cel, typ_video),
   - `zrodla.md` kursu,
   - artykuły WSZYSTKICH wcześniejszych lekcji ze statusem `tresc: zatwierdzona`
     (spójność narracji; odwołuj się do nich: "jak pamiętasz z lekcji...").
2. **Research.** Zweryfikuj aktualność twierdzeń o narzędziach (WebSearch,
   oficjalne dokumentacje). KAŻDE nowe źródło dopisz do `zrodla.md` kursu
   z datą dostępu. Treści o AI starzeją się w miesiące — sprawdzaj wersje
   i ceny, nie polegaj na pamięci.
3. **Generowanie** (kolejność obowiązkowa, wg struktura-lekcji.md):
   a. `artykul.md` — pełna treść lekcji, orientacyjnie 1200–2000 słów
      (sugestia, nie limit: styleguide → Długość treści),
   b. `video/scenariusz.md` — TA SAMA treść w formie mówionej; frontmatter
      `typ:` musi być równy `typ_video` z lekcja.yaml; segmenty
      `## [ekran: slajd|screencast|avatar] Segment N - Tytuł`, gdzie N to
      pozycja segmentu liczona od 1 przez WSZYSTKIE segmenty, avatary
      włącznie (ta sama numeracja, co nagłówki konspektu i pliki paczki
      lektora); avatar tylko powitanie /
      przejścia / podsumowanie; segment orientacyjnie 140–420 słów
      (sugestia, nie limit — segment niosący jeden spójny wątek zostaje
      w całości, choćby był dłuższy),

      **Tekst lektora wg profilu wypowiedzi.** "TA SAMA treść w formie mówionej"
      nie znaczy "artykuł w drugiej osobie": narrację piszesz ruchami z sekcji
      "Rdzeń: ruchy" `profil-wypowiedzi.md` (pole "rób" każdego ruchu), w pasmach
      z sekcji "Rytm: liczby" (mediana długości zdań, udział zdań krótkich,
      pierwsza osoba, pytania), z markerami tempa w dawce z sekcji "Czego nie
      odtwarzać" (ponad dawkę to szum, nie styl), z bankiem wzorców (sekcja 7)
      jako wzorcem brzmienia. Ruchy treściowe (anegdota, własna wpadka) wolno pisać tylko
      z prawdziwego źródła podanego przez Rafała - wymyślona anegdota to zmyślony
      fakt. Reguły z `redakcja.md` zawieszone dla lektora są wymienione w jego
      sekcji "Zawieszenia dla tekstu lektora"; nazwy, fonetyka (`wymowa.md`)
      i typografia obowiązują bez zmian,
   c. `video/prezentacja.yaml` — dla typu prezentacja: mapa prezentacji,
      jeden slajd na segment `[ekran: slajd]`, w tej samej kolejności.
      Każdy slajd deklaruje `id`, `uklad` z kontraktu (tytul, punkty,
      dwie-kolumny, liczba, cytat, proces, grafika-pelna, tabela) i pola
      tego układu. **Zero HTML-a w treści** — wygląd należy do identyfikacji
      wizualnej, nie do slajdu. Grafiki: `grafika: { rysunek: opis }`, gdy
      rysunek ma dopiero powstać, albo `grafika: { plik: grafiki/x.svg }`.
      Wzorzec: `kursy/_wspolne/szablony/prezentacja.yaml`.
      Kompozycja slajdu — reguły z realnych renderów, nie z gustu:
      - **diagram rysuj poziomo.** Kadr 16:9 z nagłówkiem i listą zostawia na
        rysunek pas 150–200 px wysokości; pionowy schemat wychodzi w nim
        miniaturą z nieczytelnymi podpisami, niezależnie od arkusza,
      - **`lead` to zdanie pod nagłówkiem**, przed treścią — nie podsumowanie
        pod nią. Jedno miejsce we wszystkich układach,
      - **zero emoji w `naglowek` kolumn** układu `dwie-kolumny`. Nagłówek jest
        wersalikowy i akcentowany kolorem; kolorowe emoji się z tym gryzie.
        Numerowanie kroków rób tekstem (`1 · Wejście`),
      - **maskotka najwyżej raz na lekcję** (`postac: <bohater modułu>`), na
        slajdzie podsumowującym albo wprowadzającym bohatera. Przyjmują ją
        układy `tytul`, `punkty`, `dwie-kolumny`, `liczba`, `tabela`; wyklucza
        się z `grafika` na tym samym slajdzie. Robot na każdym slajdzie
        przestaje cokolwiek znaczyć po trzeciej lekcji.
   d. `video/konspekt-nagrania.md` — dla typu demo: numerowana lista kroków
      do pokazania na ekranie, w kolejności segmentów `[ekran: screencast]`.
      Nagrywanie **bez mówienia**; spokojne tempo; po każdej akcji krótkie
      zatrzymanie (lektor ma gdzie zmieścić narrację przy montażu);
      nieudany dubel = powtórz czynność, śmieci nie wycina na bieżąco —
      Rafał dotnie je w postprodukcji przy montażu lektora.
   e. Oznaczenie pokrycia wideo w `artykul.md` (po napisaniu scenariusza):
      przed każdym blokiem artykułu (jeden lub kilka sąsiednich akapitów o tym
      samym wątku), którego meritum pada też w scenariuszu, wstaw callout —
      pierwsze wystąpienie w lekcji `> 🎬 **Też w wideo** - możesz przejrzeć pobieżnie, jeśli obejrzałeś.`,
      kolejne `> 🎬 **Też w wideo**`. Bloki tylko-artykułowe zostaw bez
      calloutu; ≥1 blok MUSI zostać nieoznaczony. Konwencja w struktura-lekcji.md.
   f. **Twarde spacje wstaw na końcu kroku 3 — i od tej chwili traktuj własny
      brudnopis jako nieaktualny.** Przebieg wstawiający U+00A0 po `a i o u w z`
      przepisuje pliki, które już napisałeś, więc tekst, który masz w pamięci
      i w brudnopisie, przestaje zgadzać się z dyskiem co do znaku — a Ty o tym
      nie wiesz, bo pliku po przebiegu nie czytałeś. Od tego momentu do końca
      lekcji, w KAŻDEJ czynności, nie tylko w kontrolach checklisty kroku 4:
      `old_string` w `Edit`, pattern w `grep` i wzorzec we własnym skrypcie
      kontrolnym kotwicz na fragmencie BEZ jednoliterowego słowa ze spacją
      (`wideo**`, `Ciebie (`, `^> `). Odbite `old_string` na pliku, który sam
      przed chwilą zapisałeś, i "0 trafień" na frazie, którą sam przed chwilą
      napisałeś, to objaw twardej spacji, a nie dowód, że plik zmienił ktoś
      inny — w obu wypadkach przeczytaj plik, zanim cokolwiek z tego wyniku
      wywnioskujesz. Reguła obowiązuje także wtedy, gdy przebieg wstawiający
      puściłeś ręcznie, poza jakąkolwiek komendą `course-pipeline`.
4. **Samokontrola.** Sprawdź checklistę:
   - artykuł realizuje cel z lekcja.yaml i strukturę z struktura-lekcji.md,
   - artykuł pokrywa całą treść scenariusza; scenariusz jest nadrzędny, więc
     rozjazd naprawiasz DOPISANIEM wątku do artykułu, nigdy wycięciem go ze
     scenariusza (struktura-lekcji.md → nadrzędność scenariusza),
   - każdy blok artykułu pokrywający się ze scenariuszem ma callout `> 🎬 **Też w wideo**`, a ≥1 blok jest bez calloutu (wartość dodana),
   - zero żargonu bez wyjaśnienia, zero twierdzeń bez źródła w zrodla.md,
   - zero grywalizacji w treści: żadnych odznak, rang, awansów, punktów, XP,
     streaków, rankingów, dyplomów ani boss-fightów w artykule, scenariuszu,
     na slajdach i w zadaniach. Nazwę odznaki i rangi za lekcję wpisujesz do
     adnotacji `grywalizacja` w lekcja.yaml (`odznaka` + `ranga`), skąd weźmie
     je platforma. Lekcja kończy się podsumowaniem i zapowiedzią następnej,
     bez stempla z odznaką. Reguła: styleguide → Grywalizacja,
   - typografia wg sekcji "Typografia" w styleguide: zero pauz (—) i półpauz (–)
     w roli myślnika (dywiz `-` ze spacjami), tylko proste cudzysłowy `"` i `'`,
     twarda spacja U+00A0 po jednoliterowych słowach (`a i o u w z`) w artykule
     i na slajdach; scenariusz bez reguły sierotek, ale z regułą myślników
     i cudzysłowów,
   - ostrzeżenia `npm run validate` z dopiskiem `(profil-wypowiedzi.md → Rytm)`
     przeczytane i rozstrzygnięte: segment poprawiony albo w raporcie do bramki
     stoi jedno zdanie, dlaczego zostaje (np. segment-instrukcja z krótkimi
     zdaniami rozkazującymi). Ostrzeżenie przemilczane = nieprzeczytane,
   - liczba segmentów avatar ≤ 3,
   - **kontrole tej checklisty rób odczytem pliku, nie `grep`-em po frazie
     z treści.** Po wstawieniu twardych spacji `w wideo`, `z inwestycji`
     i `U Ciebie` mają w środku U+00A0, a emoji jako pattern w Git Bash nie
     trafia — oba przypadki dają ciche "0", nie błąd. Kotwicz na fragmencie
     bez jednoliterowego słowa (`wideo**`, `Ciebie (`, `^> `). Odwrotna
     pułapka jest równie cicha: `grep -i` po krótkim akronimie (`API`) trafia
     w podciągi polskich słów („napisze", „zapisz") — kotwicz na granicy słowa
     (`\bAPI\b`) albo czytaj trafienia z kontekstem. "0 trafień"
     i "kilkanaście trafień" na pliku, który właśnie napisałeś, to wynik
     wzorca, a nie fakt — tak samo odbite `old_string` w `Edit` i licznik
     z własnego skryptu kontrolnego.
5. **Walidacja.** Ustaw `status.tresc: do_review` w lekcja.yaml, potem
   `cd tools/course-pipeline && npm run validate --
   ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog lekcji, nie kursu —
   błędy z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
6. **Niezależny review AI.**
   `npm run review-ai -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   Przeczytaj `review-ai.md`: problemy zasadne → popraw treść i powtórz
   kroki 5–6 (max 2 iteracje); problemy niezasadne → odnotuj dlaczego.
7. **BRAMKA: prezentacja Rafałowi.** Pokaż: ścieżki plików, streszczenie
   lekcji (3–5 zdań), werdykt z review-ai.md + co poprawiono, liczbę
   segmentów avatar. Uwagi Rafała nanoś od ręki i iteruj. Rafał może też
   wpisać je wprost do `video/scenariusz.md` jako linie `[UWAGA: ...]` — wtedy
   nanosi je `/kurs-uwagi`, a nie ta procedura.
8. **Po zatwierdzeniu przez Rafała:** ustaw `status.tresc: zatwierdzona`,
   uruchom walidację ponownie. Zmiany zostają niezacommitowane — commit robi
   Rafał.
   Dla `typ_video: demo` najpierw napisz albo odśwież `video/dane-do-nagrania.md`
   — ściągę klawiaturową nagrania. Kontrakt sekcji jest w struktura-lekcji.md
   („Czwarty artefakt"); procedura: przejdź `konspekt-nagrania.md` krok po
   kroku (to jedyne miejsce z numeracją) i przy każdym kroku rozstrzygnij, czy
   coś w nim idzie z klawiatury — sygnały to czasowniki „wpisz", „wklej",
   „nazwij", „ustaw pole", „zadaj pytanie" oraz treść w odwrotnych
   apostrofach. Literalne brzmienie bierz z `artykul.md`, a gdy tam go nie ma
   — z kroku konspektu albo linii `[AKCJA: ...]` w scenariuszu. Rozjazdu między
   artykułem a scenariuszem nie rozstrzygaj sam: wpisz wersję z konspektu
   i opisz rozjazd pod tabelą, ze wskazaniem `plik:linia`. Sekcja stoi
   w pliku pierwsza i powstaje dla KAŻDEJ lekcji `demo`, także takiej, która
   nie wymaga żadnych danych środowiska. Ten plik powstaje wyłącznie tutaj.
   Dopiero potem wygeneruj plan nagrania:
   `npm run plan-nagrania -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   Generator czyta ściągę i wkleja jej treść do planu (kolumna „Do wpisania"
   i bloki pod tabelami segmentów), dlatego ściąga musi być gotowa wcześniej.
   Ostrzeżenia generatora pokaż Rafałowi razem ze ścieżką pliku — zarówno
   o rozjeździe scenariusza z konspektem, jak i o ściądze (krok spoza
   konspektu, `(blok → niżej)` bez nagłówka `### Krok NN`, nagłówek bez
   wiersza). Plan powstaje WYŁĄCZNIE tutaj, po zatwierdzeniu — nigdy
   w krokach 3-7.

## Zasady

- NIE renderuj video, NIE generuj quizów/ćwiczeń — to inne skille
  (etapy 1b/1c).
- Jeśli lekcja.yaml nie istnieje lub kurs nie ma programu — przerwij
  i skieruj na /kurs-nowy.
- Poprawki po review Rafała nie wymagają ponownego review-ai, chyba że
  zmieniła się większość treści.
