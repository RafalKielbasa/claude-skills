---
name: spotkanie
description: Wsparcie spotkań planistycznych rozwoju firmy — „przygotuj" buduje agendę z historii spotkań i bazy wiedzy repo, „prowadź" prowadzi sesję na żywo i składa notatkę z action items, „transkrypt" składa notatkę automatycznie z dostarczonych transkryptów spotkania. Używaj, gdy Rafał przygotowuje, prowadzi lub rozlicza spotkanie planistyczne.
---

# /spotkanie — spotkania planistyczne

Tryby: `/spotkanie przygotuj [data]`, `/spotkanie prowadź` i
`/spotkanie transkrypt <data>`.
Pliki spotkań żyją w `planning/`, układ zależy od typu spotkania: offsite
płasko w `planning/` (`YYYY-MM-DD-agenda.md`, `YYYY-MM-DD-notatka.md`, daty
ISO, sortują się chronologicznie); spotkanie robocze (tryb bezagendowy) w
`planning/robocze/<data>-<godzina>-<slug>/notatka.md`; daily — skill
`/daily`, nie ten plik — w `planning/daily/<data>-<godzina>/notatka.md`.
Szablony: `szablony/agenda.md`, `szablony/notatka.md` obok tego pliku —
ZAWSZE wypełniaj szablon, nigdy nie improwizuj struktury; kolejne
`przygotuj` parsuje te sekcje. Tryb bezagendowy wypełnia ten sam szablon
notatki, ale świadomie pomija metadaną `Agenda:` i sekcję `## Nieomówione`
— nie ma agendy, więc nie ma z czym porównać ani punktów, które zostały
nieomówione. Tryb „prowadź" nie konsumuje żadnego transkryptu, więc
pomija też metadaną `Źródła:` — wypełnia ją wyłącznie tryb „transkrypt"
(z agendą i bezagendowy), nazwami plików wczytanych w jego kroku 3.
Wypełniając, zastępuj przykłady z komentarzy `<!-- -->` widoczną treścią
i usuwaj komentarze-przykłady — realna treść nigdy nie zostaje w
komentarzu.

## Tryb „przygotuj"

Data spotkania: z argumentu; brak argumentu → dziś.

1. **Historia.** Znajdź najnowszą notatkę spotkania planistycznego —
   `planning/*-notatka.md` (offsite) ORAZ `planning/robocze/*/notatka.md`
   (spotkania robocze), porównane po dacie (i godzinie dla roboczych, bo
   ich katalog niesie `<data>-<godzina>`). `planning/daily/` NIE wchodzi do
   tego przeglądu — statusy daily feedują digest w n8n, a wciąganie
   każdego standupu zasypałoby wątki planistyczne.
   - Status `szkic` → poprzednie spotkanie niedomknięte: zapytaj Rafała,
     czy najpierw je domknąć (`/spotkanie prowadź` wznowi sesję).
   - Brak jakiejkolwiek notatki → przeczytaj
     `planning/02.06.2026-planning.md` jako jednorazowe źródło historii;
     jeśli i tego nie ma — pomiń ten krok.
   Wypisz Rafałowi: otwarte action items (najpierw `do doprecyzowania`,
   potem przeterminowane, potem reszta — kto / co / termin), wątki
   z `## Zaparkowane`, decyzje wymagające follow-upu.
2. **Stan prac z bazy wiedzy.** Zbuduj obraz „gdzie jesteśmy":
   - `kursy/*/kurs.yaml` i statusy lekcji (co się rusza, co stoi),
   - zawartość `knowledge-base/` i `marketing/` (nowe / zmienione
     materiały — patrz `git log`),
   - `git log --oneline -30` (aktywność od ostatniego spotkania).
   Zaproponuj kandydatów na tematy z uzasadnieniem, np. „kurs agenty-ai
   bez commitów od 3 tygodni — omówić blokery?".
3. **Tematy od Rafała.** Poproś o tematy — wkleja luzem (hasła, fragmenty
   ze Slacka); Rafał wybiera też z kandydatów z kroku 2. Dopytuj tylko
   o niejasności, JEDNO pytanie na wiadomość.
4. **Agenda.** Wypełnij `szablony/agenda.md`:
   - punkt 1 zawsze: przegląd action items (tabela z kroku 1),
   - dalej tematy wg priorytetu; każdy punkt ma szacowany czas i efekt
     („decyzja: X" / „omówienie: Y"),
   - do każdego punktu dołącz `Materiały:` — linki do pasujących plików
     repo (`knowledge-base/`, `kursy/`, `marketing/`), tylko jeśli
     naprawdę pasują (bez zapełniania na siłę).
   Iteruj z Rafałem aż zaakceptuje.
5. **BRAMKA: Rafał zatwierdza agendę.** Bez zatwierdzenia nie zapisuj
   plików. Po zatwierdzeniu: zapis `planning/YYYY-MM-DD-agenda.md`. Plik
   zostaje niezacommitowany — commit robi Rafał.

## Tryb „prowadź"

1. **Start.** Wczytaj `planning/YYYY-MM-DD-agenda.md` z dzisiejszą datą;
   brak → najnowszą; brak jakiejkolwiek → zaproponuj szybką agendę ad-hoc
   (skrócone „przygotuj": kroki 1 i 4, sam zapis pliku).
   - Jeśli najnowsza `*-notatka.md` ma status `szkic` → WZNOWIENIE
     (niezależnie od daty): pokaż dotychczasowe wpisy i kontynuuj od
     pierwszego punktu agendy bez wpisów; szkic z wcześniejszej daty →
     powiedz to wprost i zapytaj Rafała, czy wznowić spotkanie, czy od
     razu je sfinalizować na dostępnych wpisach (krok 5).
   - Inaczej utwórz `planning/YYYY-MM-DD-notatka.md` z `szablony/notatka.md`
     (status `szkic`, sekcja `### N.` per punkt agendy); zapytaj Rafała
     o obecnych i uzupełnij `{{OSOBY}}` w metadanych.
   Pokaż kokpit: lista punktów z czasami, bieżący punkt = 1.
2. **Notowanie.** Rafał wrzuca hasłowo, co się dzieje. Dopisuj wpis do
   bieżącego punktu z klasyfikacją: `ustalenie:` / `decyzja:` /
   `action item:`. Odpowiadaj JEDNĄ krótką linią („✓ decyzja
   zanotowana"). Nie komentuj, nie doradzaj, nie przerywaj dyskusji.
3. **Komendy sterujące** (zwykły tekst od Rafała):
   - `dalej` — zapisz wpisy punktu do pliku notatki, zamknij punkt,
     pokaż następny + ile punktów i minut zostało,
   - `parkuj <temat>` — dopisz do `## Zaparkowane`, potwierdź jedną linią,
   - `status` — bieżący punkt, punkty pozostałe, czas vs plan,
   - `sprawdź <pytanie>` — przeszukaj `knowledge-base/`, `kursy/`,
     `marketing/`, `planning/`; odpowiedz zwięźle (≤5 zdań) WYŁĄCZNIE na
     podstawie znalezionych plików, z podaniem ścieżek; nic nie znalazłeś
     → powiedz wprost „nie ma tego w repo". Każdą liczbę w odpowiedzi
     (lekcje, moduły, pliki) policz komendą (grep/find) w trakcie
     odpowiadania — nigdy z pamięci. Odpowiedź dopisz do bieżącego
     punktu z prefiksem `sprawdź:`,
   - `koniec` — finalizacja (krok 5).
4. **Pilnowanie zakresu.** Gdy wpis pasuje do innego punktu agendy lub
   wykracza poza nią — zasygnalizuj jedną linią („to brzmi jak punkt 4 —
   kontynuować tu, przenieść, czy parkować?"). Sygnalizuj, nie blokuj;
   decyzja należy do Rafała.
5. **Finalizacja (`koniec`).**
   a. Przejrzyj wpisy `action item:` — brak osoby lub terminu → dopytaj
      Rafała; nadal brak → status `do doprecyzowania`.
   b. Uzupełnij sekcje: `## Decyzje` (wszystkie `decyzja:`),
      `## Action items` (tabela), `## Zaparkowane`, `## Nieomówione`
      (punkty agendy bez wpisów).
   c. Zmień `**Status:** szkic` → `**Status:** finalna`, pokaż całą
      notatkę Rafałowi.
   d. BRAMKA: akceptacja Rafała. Notatka zostaje niezacommitowana —
      commit robi Rafał.
   e. Po akceptacji przejdź do indeksowania notatki do bazy wiedzy
      (sekcja „Indeksowanie notatki do bazy wiedzy") — `prowadź` działa
      zawsze na agendzie, więc produkuje notatkę offsite: `<typ> = offsite`,
      układ płaski w `planning/`.

## Tryb „transkrypt"

Wywołanie: `/spotkanie transkrypt <data>` — data jest wymagana. Transkrypt(y)
trafiają do `planning/transkrypty/` — Rafał wgrywa je ręcznie PRZED
wywołaniem trybu albo skill pobiera je z Google Drive (krok 2).

1. **Powrót do bramki, potem agenda.** Najpierw szukaj otwartej bramki tej daty: plików kolejek
   `planning/<data>-wpisy.yaml` (tryb z agendą) albo `planning/robocze/<data>-*/wpisy.yaml`
   (tryb bezagendowy), w których — albo w sąsiednim `zadania.yaml` — jest pozycja bez decyzji
   (patrz „Resuming" w `docs/spotkania-kolejki.md`) albo `approved` jeszcze niewykonana, albo
   których notatka nie ma znacznika `**Opublikowano:**` („Execution order" tamże). Spotkanie
   z kolejkami w pełni wykonanymi i opublikowanymi jest zamknięte i nie liczy się.
   Dokładnie jedna otwarta bramka → przejdź od razu do kroku 5 sekcji „Indeksowanie notatki do
   bazy wiedzy" — nie szukaj transkryptów (skasowane przy akceptacji notatki) i niczego nie buduj
   od nowa. Więcej niż jedna → wypisz je, zapytaj Rafała, którą, i czekaj. Żadnej → to nowe
   nagranie: wczytaj `planning/<data>-agenda.md`.
   - Plik istnieje → **tryb z agendą** (jak dotychczas, spotkanie
     całodniowe/offsite): sekcje notatki wynikają z punktów agendy;
     artefakty to `planning/<data>-notatka.md` (+ pliki kolejek obok niego).
   - Pliku nie ma, a Rafał wprost poprosił o notatkę ze spotkania
     całodniowego (offsite) → powiedz to wprost, zaproponuj
     `/spotkanie przygotuj <data>` i przerwij — ten tryb nie tworzy agendy
     ad-hoc.
   - Pliku nie ma w każdym innym przypadku → **tryb bezagendowy** dla
     spotkania roboczego (`robocze`): sekcje notatki wynikają z tematów
     znalezionych w transkrypcie (krok 4). Ustal godzinę spotkania: gdy
     w `planning/transkrypty/` już leży plik dla tej daty, godzina wynika
     z jego nazwy (`<data>-<godzina>-transkrypt...`); inaczej sprawdź
     `kb-client pending --json` (`tools/kb-client`) — dokładnie jedno
     nagranie tej daty → jego godzina; więcej niż jedno → wypisz godziny
     i zapytaj Rafała, które przetworzyć (JEDNO pytanie), czekaj na
     odpowiedź; brak nagrania na tę datę → powiedz to wprost i przerwij;
     `pending` zawodzi (np. webhook jeszcze niewdrożony) → powiedz to
     wprost, poproś Rafała o godzinę albo o wgranie pliku z nazwą
     `<data>-<godzina>-transkrypt...`, potem przerwij.
     Artefakty trafiają do `planning/robocze/<data>-<godzina>-<slug>/` —
     `<slug>` to główny temat spotkania (małe litery, myślniki, bez
     polskich znaków); gdy tematów jest więcej niż jeden i żaden nie
     dominuje, złącz skrócone nazwy 2–3 tematów myślnikiem, przy większej
     ich liczbie weź temat pierwszy — katalog ma zostać skanowalny, nie
     wyczerpujący. Deklarację nagrania (standup czy spotkanie robocze)
     sprawdzasz z treścią transkryptu w ręku, nie tutaj — patrz krok 3.
2. **Pusta skrzynka → Google Drive.** Gdy `planning/transkrypty/` nie
   zawiera plików (poza `.gitkeep`), poszukaj transkryptu na Google Drive
   narzędziami Drive MCP: wyszukaj plik o nazwie `<data>-transkrypt` (tryb
   z agendą) albo `<data>-<godzina>-transkrypt` (tryb bezagendowy, godzina
   z kroku 1) — tworzy go pipeline n8n w dedykowanym folderze transkryptów
   — pobierz treść i zapisz pod tą samą nazwą w `planning/transkrypty/`;
   powiedz Rafałowi, że plik pochodzi z Drive. Plik na Drive ZOSTAJE
   (archiwum po stronie n8n) — pobierasz kopię, niczego tam nie kasujesz.
   - Brak narzędzi Drive w sesji → powiedz to wprost i poproś Rafała
     o ręczne wgranie pliku do `planning/transkrypty/`, potem przerwij.
   - Pliku nie ma też na Drive → powiedz wprost, że transkryptu nie ma
     (n8n mógł jeszcze nie przetworzyć nagrania) i przerwij — nic nie twórz.
3. **Wczytanie transkryptów.** Wczytaj wszystkie pliki z
   `planning/transkrypty/` (pomiń `.gitkeep`) — dowolna liczba, dowolne
   rozszerzenie tekstowe. Brak plików → powiedz to wprost i przerwij, nic
   nie twórz. Więcej niż jeden plik → potraktuj łącznie jako treść jednego
   spotkania (kolejność wg nazwy pliku, jeśli sugeruje segmenty/kolejność
   nagrania).
   - Tryb bezagendowy: teraz, z treścią w ręku, sprawdź deklarację na
     początku transkryptu — deklaruje standup/daily → powiedz to jednym
     zdaniem, wskaż `/daily <data> <godzina>` i przerwij, nic nie twórz;
     n8n już nie klasyfikuje spotkań, więc deklaracja z transkryptu to
     jedyny sygnał, który odróżnia tu daily od spotkania roboczego.
4. **Analiza i mapowanie.**
   - Tryb z agendą: dla każdego punktu agendy znajdź w transkrypcie
     fragmenty, które go dotyczą — dopasowanie po temacie, nie po czasie
     w nagraniu. Punkt agendy bez pasującej treści zostaje pusty → trafi
     do `## Nieomówione`.
   - Tryb bezagendowy: wypisz tematy, o których faktycznie rozmawiano —
     sekcje notatki wynikają z nich, nie z agendy, której nie ma.
   - W obu trybach sklasyfikuj istotne fragmenty jak w trybie „prowadź":
     `ustalenie:` / `decyzja:` / `action item:` (dla action item wyłuskaj
     osobę i termin, jeśli padły). Nie zmyślaj treści spoza transkryptu;
     fragment niejednoznaczny → zacytuj go i oznacz znacznikiem `⚠` z sekcji
     „Uncertain passages" w `docs/spotkania-kolejki.md`, zamiast interpretować na siłę.
5. **Złożenie notatki.** Utwórz notatkę z `szablony/notatka.md` (status
   `szkic`) w miejscu ustalonym w kroku 1:
   - tryb z agendą: `planning/<data>-notatka.md`; `## Ustalenia` per
     punkt agendy z wpisami z kroku 4; `## Nieomówione` (punkty agendy
     bez wpisów),
   - tryb bezagendowy: `planning/robocze/<data>-<godzina>-<slug>/notatka.md`;
     `## Ustalenia` per temat z kroku 4 (`### N.` w kolejności tematów,
     tytuł = temat, nie punkt agendy); pomiń metadaną `Agenda:` i sekcję
     `## Nieomówione` — nie ma agendy, więc nie ma punktów nieomówionych,
   - w obu trybach: `## Decyzje`, `## Action items` (tabela),
     `## Zaparkowane` (wątki odłożone wspomniane w transkrypcie).
   - w obu trybach: wypełnij metadaną `**Źródła:**` nazwami plików
     transkryptów wczytanych w kroku 3 (rozdzielone przecinkiem, w
     kolejności wczytania) — to jedyny sygnał, po którym
     `.claude/hooks/nagrania-check.ps1` i `/daily`'s no-argument mode
     rozpoznają nagranie jako przetworzone, gdy trafiło do notatki
     całodniowej albo roboczej, a nie do własnej notatki daily.
   - Action item bez osoby lub terminu w transkrypcie → dopytaj Rafała
     (jak w kroku 5a trybu „prowadź"); nadal brak → status
     `do doprecyzowania`.
6. **Przegląd z Rafałem.** Najpierw etap fragmentów `⚠` bramki z `docs/spotkania-kolejki.md`
   (sekcje „Phases" i „Resolving a `⚠` passage" w „The gate", czytane na bieżąco): fragment po
   fragmencie, karta i przyciski, rozstrzygnięcie zapisane w notatce od razu. Fragment, który po
   rozstrzygnięciu jest ustaleniem, decyzją albo action itemem, przenieś do właściwej sekcji
   notatki — kandydatów jeszcze nie budujesz, powstaną z zaakceptowanej notatki w sekcji
   „Indeksowanie". Potem pokaż całą notatkę. Rafał poprawia, dopisuje lub kwestionuje
   dopasowania — nanieś poprawki.
7. **BRAMKA: Rafał zatwierdza notatkę.** Dopiero wtedy: zmień
   `**Status:** szkic` → `**Status:** finalna`, zapisz plik i USUŃ
   wszystkie pliki (poza `.gitkeep`) z `planning/transkrypty/` — surowy
   transkrypt to poufna treść rozmowy, nie zostaje w repo ani na dysku po
   przetworzeniu. Notatka zostaje niezacommitowana — commit robi Rafał.
8. **Indeksowanie.** Przejdź do budowy plików kolejek `wpisy.yaml` i
   `zadania.yaml` (sekcja „Indeksowanie notatki do bazy wiedzy").

## Indeksowanie notatki do bazy wiedzy

Wykonuj po finalizacji notatki: w trybie „prowadź" po kroku 5d, w trybie
„transkrypt" po kroku 7. Obsługuje spotkania OFFSITE (tryb z agendą) i
PLANNING/robocze (tryb bezagendowy) — DAILY idzie skillem `/daily`.

Schemat plików `wpisy.yaml`/`zadania.yaml`, bramka, kolejność egzekucji
i reguły deduplikacji są opisane raz, w `docs/spotkania-kolejki.md`, i
współdzielone z `/daily` — ta sekcja odsyła do tego dokumentu, nie
powtarza jego treści.

1. **Budowa kandydatów.** Z finalnej notatki zbuduj JEDEN kandydat wiedzy
   na punkt agendy (tryb z agendą) albo na temat (tryb bezagendowy) —
   sekcję `### N.` z `## Ustalenia`:
   - treść = ustalenia i decyzje punktu przepisane pełnymi,
     samowystarczalnymi zdaniami (pełne nazwy zamiast zaimków; decyzje
     z uzasadnieniem, jeśli padło), z prefiksem
     `[YYYY-MM-DD, <typ>: <tytuł punktu>] ` — `<typ>` to `offsite` (tryb
     z agendą) albo `robocze` (tryb bezagendowy),
   - POMIŃ: tabelę `## Action items` (trafia do `zadania.yaml`, nie tu —
     statusy się zmieniają, wpis by się starzał), sekcje `## Zaparkowane`
     i `## Nieomówione` oraz fragmenty z adnotacją niepewności —
     wykluczenie fragmentów niepewnych ma jedną definicję, w sekcji
     `wpisy.yaml` dokumentu `docs/spotkania-kolejki.md`, współdzieloną
     z `/daily`,
   - small talk, przekleństwa i wątki poboczne NIE przechodzą — notatka
     jest ich z konstrukcji pozbawiona; jeśli coś takiego mimo wszystko
     w niej jest, nie przenoś tego do kandydata,
   - punkt bez ustaleń i decyzji (pusty lub same action items) → bez
     kandydata.
   Każdy wiersz `## Action items` to JEDEN kandydat zadania do
   `zadania.yaml`.
2. **Kategorie, etykiety, przypisanie.** Do każdego kandydata `wpisy.yaml`
   zaproponuj kategorię wg reguł skilla `baza-wiedzy`; niejednoznaczna →
   zapytaj Rafała (ten tryb działa w rozmowie z nim; `/daily` nie ma takiej
   synchronicznej chwili, więc tam niejednoznaczna kategoria idzie od razu
   do bramki jako najlepsza propozycja — to nie jest wzorzec do skopiowania
   tutaj). Do każdego kandydata `zadania.yaml` dobierz `labels` (domena +
   rozmiar) wg taksonomii etykiet w `docs/ticket-conventions.md`, a
   `assignee` wg reguły „Task assignment" w `docs/spotkania-kolejki.md`:
   najpierw jawna deklaracja z rozmowy, potem macierz odpowiedzialności
   z `docs/ticket-conventions.md` wg domeny zadania, dopiero na końcu
   `null` — ta sekcja definiuje kolejność raz, nie powtarzamy jej tutaj.
   Login nigdy nie jest zgadywany: gdy reguła niczego nie rozstrzyga
   (także gdy `docs/ticket-conventions.md` brakuje) → `assignee: null`
   plus jeden widoczny komentarz `#` nad blokiem tego kandydata,
   nazywający osobę albo domenę i powód.
3. **Deduplikacja przed bramką.** Wiedza: jedno wywołanie `kb-client
   similar --category <c> --file <ścieżka> --json` per kandydat, w jego
   kategorii — treść kandydata najpierw do pliku roboczego (dowolna
   ścieżka w katalogu artefaktów tego spotkania, usuwana po wywołaniu):
   `--text` w linii komend wystawia backticki i cytaty z treści kandydata
   na zgubienie przez powłokę, więc zostaje tylko do krótkich sprawdzeń
   ad-hoc. Klasyfikuj wynik wg aktualnych progów z sekcji „Thresholds"
   w `docs/spotkania-kolejki.md` — czytanych na bieżąco, nigdy z pamięci.
   Zadania: jeden odczyt tablicy kanban — repozytorium i tablica nazwane
   raz w sekcji „Deduplication before the gate" tego samego dokumentu,
   nie powtarzane tutaj (labelki i macierz odpowiedzialności zostają w
   `docs/ticket-conventions.md`). Awaria webhooka albo odczytu tablicy
   degraduje, nie blokuje — patrz tamże; przebieg idzie dalej do bramki
   z widocznym komentarzem `#`, że deduplikacja była niedostępna.
4. **Zapis plików kolejek.**
   - tryb z agendą: `planning/<data>-wpisy.yaml`, `planning/<data>-zadania.yaml`,
   - tryb bezagendowy: `planning/robocze/<data>-<godzina>-<slug>/wpisy.yaml`
     i `.../zadania.yaml` (ten sam katalog co notatka).
5. **BRAMKA: przejście punkt po punkcie.** Przeprowadź bramkę z sekcji „The gate" w
   `docs/spotkania-kolejki.md` (czytaj ją na bieżąco): podsumowanie na jeden ekran, kandydaci
   wiedzy, kandydaci zadań, ekran końcowy. Etap fragmentów `⚠` masz za sobą (krok 6 trybu
   „transkrypt"), a notatka jest zaakceptowana, więc ekran końcowy pokazuje samą tabelę decyzji:
   **Wykonaj** → krok 6; **Jeszcze nie** → koniec, nic nie wysłane, decyzje są już w plikach,
   a powrót to `/spotkanie transkrypt <data>` (krok 1). Nic nie wysyłaj przed **Wykonaj** —
   brak odpowiedzi to nie zgoda.
6. **Egzekucja po „Wykonaj".** Także po „przetwórz", gdy wcześniejsza egzekucja została
   przerwana. Wykonaj kolejność egzekucji z
   `docs/spotkania-kolejki.md`: upsert per zatwierdzony wpis wiedzy
   (`entry_id` = `planning/<data>-notatka/<id>-<slug>` w trybie z agendą,
   `planning/robocze/<data>-<godzina>-<slug>/<id>-<slug-wpisu>` w trybie
   bezagendowym — dla `action: update` skopiowany z `similar_to`, nie
   budowany na nowo), issue albo komentarz + wpis na tablicy per
   zatwierdzone zadanie, wpis numeru issue do `## Action items` notatki.
   Po wgraniu zatwierdzonych wpisów wiedzy uruchom porządek osieroconych
   wpisów z sekcji „Execution order" `docs/spotkania-kolejki.md`: lista
   wpisów pod prefiksem `entry_id` tego spotkania i usunięcie tych bez
   odpowiednika w aktualnym `wpisy.yaml` — jedyny sposób, żeby korekta
   tytułu punktu albo, w trybie bezagendowym, zmiana dominującego tematu
   (który niesie każdy `entry_id` w swoim katalogu) nie zostawiła starego
   wektora odpowiadającego na pytania w nieskończoność. Na końcu:

       npm run kb -- publish --type offsite --date <data> --title "<tytuł>" --file planning/<data>-notatka.md

   (tryb bezagendowy: `--type robocze` i `--file
   planning/robocze/<data>-<godzina>-<slug>/notatka.md`; żaden z trybów
   nie ma `statuses.json`, więc bez `--statuses`). Publikację pomiń, gdy
   notatka ma już znacznik `**Opublikowano:**`; po udanej publikacji wpisz
   go do notatki („Execution order" w `docs/spotkania-kolejki.md`). Zapisuj
   wynik w pliku kolejki od razu po każdej operacji, żeby przerwany przebieg
   wznawiał, nie powtarzał.

## Zasady

- Plik notatki jest dopisywany po KAŻDYM `dalej` — przerwana sesja nie
  traci zapisu (wznowienie: krok 1 trybu „prowadź").
- W trybie „prowadź" zero rozwlekłości: potwierdzenia jednolinijkowe,
  żadnych podsumowań przed `koniec`.
- Statusy action items: `otwarte` | `zrobione` | `do doprecyzowania`.
- Action items ze spotkania całodniowego (offsite) mogą teraz stać się
  zadaniami na tablicy przez `zadania.yaml` — do tej zmiany żyły
  wyłącznie w tabeli notatki. Nic nie powstaje bez `status: approved`
  i odpowiedzi **Wykonaj** na ekranie końcowym bramki. Egzekucja notatki offsite trafia też przez
  `kb-client publish` na Slacka (`#core-team`) — do tej zmiany offsite nie
  publikował tam nic.
- NIE modyfikuj `planning/02.06.2026-planning.md` (plik historyczny).
- Odpowiedzi `sprawdź` tylko z repo — zero wiedzy z pamięci modelu.
- Do bazy wektorowej trafia wyłącznie przetworzona treść notatki (sekcja
  „Indeksowanie notatki do bazy wiedzy") — NIGDY surowy transkrypt; to
  niezmiennik całego systemu spotkań.
- `planning/transkrypty/` to skrzynka robocza, nie archiwum — pliki
  wchodzą tylko na ten jeden przebieg trybu „transkrypt" i są usuwane po
  finalizacji notatki (krok 7). Nigdy nie commituj ich zawartości.
