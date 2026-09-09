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
   - `kursy/_wspolne/styleguide.md` i `kursy/_wspolne/szablony/struktura-lekcji.md`,
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
      `## [ekran: slajd|screencast|avatar] Tytuł`; avatar tylko powitanie /
      przejścia / podsumowanie; segment orientacyjnie 140–420 słów
      (sugestia, nie limit — segment niosący jeden spójny wątek zostaje
      w całości, choćby był dłuższy),
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
   - liczba segmentów avatar ≤ 3.
5. **Walidacja.** Ustaw `status.tresc: do_review` w lekcja.yaml, potem
   `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>` —
   napraw wszystkie BŁĘDY.
6. **Niezależny review AI.**
   `npm run review-ai -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   Przeczytaj `review-ai.md`: problemy zasadne → popraw treść i powtórz
   kroki 5–6 (max 2 iteracje); problemy niezasadne → odnotuj dlaczego.
7. **BRAMKA: prezentacja Rafałowi.** Pokaż: ścieżki plików, streszczenie
   lekcji (3–5 zdań), werdykt z review-ai.md + co poprawiono, liczbę
   segmentów avatar. Uwagi Rafała nanoś od ręki i iteruj.
8. **Po zatwierdzeniu przez Rafała:** ustaw `status.tresc: zatwierdzona`,
   uruchom walidację ponownie, commit
   `kurs(<slug>): lekcja NN-y zatwierdzona`.
   Dla `typ_video: demo` wygeneruj plan nagrania:
   `npm run plan-nagrania -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   Ostrzeżenia o rozjeździe scenariusza z konspektem pokaż Rafałowi razem ze
   ścieżką pliku. Plan powstaje WYŁĄCZNIE tutaj, po zatwierdzeniu — nigdy
   w krokach 3-7.

## Zasady

- NIE renderuj video, NIE generuj quizów/ćwiczeń — to inne skille
  (etapy 1b/1c).
- Jeśli lekcja.yaml nie istnieje lub kurs nie ma programu — przerwij
  i skieruj na /kurs-nowy.
- Poprawki po review Rafała nie wymagają ponownego review-ai, chyba że
  zmieniła się większość treści.
