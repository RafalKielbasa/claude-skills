---
name: spotkanie
description: Wsparcie spotkań planistycznych rozwoju firmy — „przygotuj" buduje agendę z historii spotkań i bazy wiedzy repo, „prowadź" prowadzi sesję na żywo i składa notatkę z action items, „transkrypt" składa notatkę automatycznie z dostarczonych transkryptów spotkania. Używaj, gdy Rafał przygotowuje, prowadzi lub rozlicza spotkanie planistyczne.
---

# /spotkanie — spotkania planistyczne

Tryby: `/spotkanie przygotuj [data]`, `/spotkanie prowadź` i
`/spotkanie transkrypt <data>`.
Pliki spotkań żyją w `planning/`: `YYYY-MM-DD-agenda.md` i
`YYYY-MM-DD-notatka.md` (daty ISO, sortują się chronologicznie).
Szablony: `szablony/agenda.md`, `szablony/notatka.md` obok tego pliku —
ZAWSZE wypełniaj szablon, nigdy nie improwizuj struktury; kolejne
`przygotuj` parsuje te sekcje.
Wypełniając, zastępuj przykłady z komentarzy `<!-- -->` widoczną treścią
i usuwaj komentarze-przykłady — realna treść nigdy nie zostaje w
komentarzu.

## Tryb „przygotuj"

Data spotkania: z argumentu; brak argumentu → dziś.

1. **Historia.** Znajdź najnowszą `planning/*-notatka.md`.
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
      (sekcja „Indeksowanie notatki do bazy wiedzy").

## Tryb „transkrypt"

Wywołanie: `/spotkanie transkrypt <data>` — data jest wymagana (identyfikuje
agendę i docelową notatkę). Transkrypt(y) trafiają do
`planning/transkrypty/` — Rafał wgrywa je ręcznie
PRZED wywołaniem trybu albo skill pobiera je z Google Drive (krok 2).

1. **Wymagana agenda.** Wczytaj `planning/<data>-agenda.md`. Brak pliku →
   powiedz to wprost, zaproponuj `/spotkanie przygotuj <data>` i przerwij
   — ten tryb nie tworzy agendy ad-hoc.
2. **Pusta skrzynka → Google Drive.** Gdy `planning/transkrypty/` nie
   zawiera plików (poza `.gitkeep`), poszukaj transkryptu na Google Drive
   narzędziami Drive MCP: wyszukaj plik o nazwie `<data>-transkrypt`
   (tworzy go pipeline n8n w dedykowanym folderze transkryptów), pobierz
   treść i zapisz jako `planning/transkrypty/<data>-transkrypt.md`; powiedz
   Rafałowi, że plik pochodzi z Drive. Plik na Drive ZOSTAJE (archiwum po
   stronie n8n) — pobierasz kopię, niczego tam nie kasujesz.
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
4. **Analiza i mapowanie.** Dla każdego punktu agendy znajdź w
   transkrypcie fragmenty, które go dotyczą — dopasowanie po temacie, nie
   po czasie w nagraniu. Sklasyfikuj istotne fragmenty jak w trybie
   „prowadź": `ustalenie:` / `decyzja:` / `action item:` (dla action item
   wyłuskaj osobę i termin, jeśli padły). Punkt agendy bez pasującej
   treści zostaje pusty → trafi do `## Nieomówione`. Nie zmyślaj treści
   spoza transkryptu; fragment niejednoznaczny → zacytuj go i zaznacz
   niepewność zamiast interpretować na siłę.
5. **Złożenie notatki.** Utwórz `planning/<data>-notatka.md` z
   `szablony/notatka.md` (status `szkic`): `## Ustalenia` per punkt agendy
   z wpisami z kroku 4, `## Decyzje`, `## Action items` (tabela),
   `## Zaparkowane` (wątki odłożone wspomniane w transkrypcie),
   `## Nieomówione`.
   - Action item bez osoby lub terminu w transkrypcie → dopytaj Rafała
     (jak w kroku 5a trybu „prowadź"); nadal brak → status
     `do doprecyzowania`.
6. **Przegląd z Rafałem.** Pokaż całą notatkę. Rafał poprawia, dopisuje
   lub kwestionuje dopasowania — nanieś poprawki.
7. **BRAMKA: Rafał zatwierdza notatkę.** Dopiero wtedy: zmień
   `**Status:** szkic` → `**Status:** finalna`, zapisz plik i USUŃ
   wszystkie pliki (poza `.gitkeep`) z `planning/transkrypty/` — surowy
   transkrypt to poufna treść rozmowy, nie zostaje w repo ani na dysku po
   przetworzeniu. Notatka zostaje niezacommitowana — commit robi Rafał.
8. **Indeksowanie.** Przejdź do indeksowania notatki do bazy wiedzy
   (sekcja „Indeksowanie notatki do bazy wiedzy").

## Indeksowanie notatki do bazy wiedzy

Wykonuj po finalizacji notatki: w trybie „prowadź" po kroku 5d, w trybie
„transkrypt" po kroku 7. Ponowny przebieg po poprawce notatki jest
bezpieczny — te same `entry_id` podmieniają wpisy (bez duplikatów).
Skill obsługuje wyłącznie spotkania OFFSITE (całodniowe) — DAILY/PLANNING
idą torem n8n — dlatego prefiks wpisów jest zawsze `offsite:`.

1. **Budowa wpisów.** Z finalnej `planning/YYYY-MM-DD-notatka.md` zbuduj
   wpisy — JEDEN wpis na punkt agendy (sekcję `### N.` z `## Ustalenia`):
   - treść = ustalenia i decyzje punktu przepisane pełnymi,
     samowystarczalnymi zdaniami (pełne nazwy zamiast zaimków; decyzje
     z uzasadnieniem, jeśli padło), z prefiksem
     `[YYYY-MM-DD, offsite: <tytuł punktu>] `,
   - POMIŃ: tabelę `## Action items` (statusy się zmieniają — wpisy by się
     starzały), sekcje `## Zaparkowane` i `## Nieomówione` oraz wpisy
     z adnotacją niepewności (niejednoznaczne cytaty z transkryptu),
   - small talk, przekleństwa i wątki poboczne NIE przechodzą — notatka
     jest ich z konstrukcji pozbawiona; jeśli coś takiego mimo wszystko
     w niej jest, nie przenoś tego do wpisu,
   - punkt bez ustaleń i decyzji (pusty lub same action items) → bez wpisu.
2. **Kategorie.** Do każdego wpisu zaproponuj kategorię wg reguł skilla
   `baza-wiedzy` (`dev` / `marketing` / `product` / `sales` / `company` /
   `other` / `interns`); niejednoznaczna → zapytaj Rafała.
3. **BRAMKA: Rafał zatwierdza podział i kategorie.** Pokaż wszystkie wpisy
   (pełna treść + kategoria). Rafał może wpis usunąć, poprawić treść lub
   zmienić kategorię. Bez zatwierdzenia nie upsertuj.
4. **Upsert per wpis** przez kb-client (komendy z katalogu
   `tools/kb-client`; wymaga `tools/kb-client/.env`):

       npm run kb -- upsert --category <kategoria> --entry-id "planning/YYYY-MM-DD-notatka/<n>-<slug>" --text "<treść wpisu z prefiksem>"

   `<n>` = numer punktu agendy, `<slug>` = tytuł punktu małymi literami,
   myślniki zamiast spacji, bez polskich znaków, np.
   `planning/2026-07-30-notatka/2-kurs-agenty-ai`.
5. **Sprzątanie po poprawkach.** Przy ponownej indeksacji tej samej notatki
   (zmieniona liczba, tytuły lub kategorie punktów): `npm run kb -- list
   --category <kategoria>` dla każdej kategorii użytej teraz ORAZ użytej
   wcześniej dla tej notatki (gdy punkt zmienił kategorię, jego stary wpis
   został pod poprzednią kategorią i trzeba go tam znaleźć), znajdź wpisy
   z prefiksem `planning/YYYY-MM-DD-notatka/` bez odpowiednika w nowym
   podziale i po pokazaniu ich Rafałowi usuń:
   `npm run kb -- delete --category <kategoria> --entry-id "<osierocony>"`.

## Zasady

- Plik notatki jest dopisywany po KAŻDYM `dalej` — przerwana sesja nie
  traci zapisu (wznowienie: krok 1 trybu „prowadź").
- W trybie „prowadź" zero rozwlekłości: potwierdzenia jednolinijkowe,
  żadnych podsumowań przed `koniec`.
- Statusy action items: `otwarte` | `zrobione` | `do doprecyzowania`.
- NIE modyfikuj `planning/02.06.2026-planning.md` (plik historyczny).
- Odpowiedzi `sprawdź` tylko z repo — zero wiedzy z pamięci modelu.
- Do bazy wektorowej trafia wyłącznie przetworzona treść notatki (sekcja
  „Indeksowanie notatki do bazy wiedzy") — NIGDY surowy transkrypt; to
  niezmiennik całego systemu spotkań.
- `planning/transkrypty/` to skrzynka robocza, nie archiwum — pliki
  wchodzą tylko na ten jeden przebieg trybu „transkrypt" i są usuwane po
  finalizacji notatki (krok 7). Nigdy nie commituj ich zawartości.
