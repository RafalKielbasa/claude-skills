---
name: kurs-nagrywanie
description: Automatyczne nagrywanie ekranu lekcji demo Playwrightem (tools/nagrywanie) - automat sam klika w przeglądarce według planu nagrania, zapisuje znaczniki kroków i oddaje gotowy EDL montażowi automatycznemu. Przy pierwszej lekcji z nową usługą (np. n8n) prowadzi przez jednorazowe przygotowanie - warunki bezpieczeństwa konta, logowanie w osobnym profilu, sonda interfejsu i obsługa usługi sprawdzona na koncie zespołu. Używaj, gdy kurs ma `nagrywanie: { automat: true }` w kurs.yaml i lekcja demo ma zatwierdzoną treść i plan nagrania - najpierw przed lektorem (przebieg próbny ze zrzutami ekranu i raport rozjazdów scenariusza z aplikacją), potem po paczce lektora (nagranie); woła go /kurs-video zamiast ręcznego nagrania. NIE do pracy poza przeglądarką (terminal, aplikacje desktopowe) - te kroki nagrywa się ręcznie jako dogrywki.
---

# /kurs-nagrywanie - automat nagrywa ekran lekcji demo

Wejście: ścieżka lekcji demo, np. `kursy/<slug>/modul-03-x/lekcja-01-y`. Wynik w dwóch częściach: przed lektorem
zaakceptowany raport przebiegu próbnego `video/przebieg-probny.md` (kroki 0-4), po paczce lektora surowe nagrania
ujęć ze znacznikami kroków i `video/montaz/edl.json` + `zrodla.json` lekcji, gotowe dla `/kurs-montaz` (kroki 5-6).
Projekt: `docs/superpowers/specs/2026-10-07-nagrywanie-wspolne-design.md` i
`docs/superpowers/specs/2026-10-10-nagrywanie-przebieg-probny-design.md`; narzędzie i formaty:
`tools/nagrywanie/README.md`.
Komendy: `cd tools/nagrywanie && npm run nagrywanie -- <komenda> ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.

## Procedura

0. **Diagnoza środowiska** - zawsze, sam, bez pytania: `npm run diagnoza` (w `tools/nagrywanie`, BEZ lekcji: Node,
   Chrome, ffmpeg, samotest strażnika). Każdy BŁĄD naprawiasz według podpowiedzi; BŁĄD w samoteście strażnika = nie
   nagrywamy, powiedz Rafałowi. Gdy narzędzie jest na tym komputerze pierwszy raz (brak `tools/nagrywanie/.demo/`):
   sam uruchom `npm run demo` (minuta, strona testowa, bez konta) i pokaż Rafałowi ścieżkę nagrania.
   Pełna diagnoza lekcji (`npm run diagnoza -- <lekcja>`) dopiero w kroku 4, gdy usługa i `nagrywanie.yaml` są gotowe.
1. **Bramka wejścia.** `lekcja.yaml`: `typ_video: demo`, `status.tresc: zatwierdzona`, istnieje aktualny
   `video/plan-nagrania.md` (jeśli `npm run validate` mówi, że jest nieaktualny - `npm run plan-nagrania` w
   `tools/course-pipeline`). Kurs ma `nagrywanie: { automat: true }`. Inaczej przerwij i powiedz Rafałowi, czego brakuje.
2. **Usługi lekcji.** Z planu nagrania i `[AKCJA: ...]` w scenariuszu ustal, w jakich usługach dzieje się nagranie
   (np. n8n). Każda usługa musi mieć obsługę w `<kurs>/_nagrywanie/uslugi/` (ma pierwszeństwo) albo
   `tools/nagrywanie/uslugi/` i swoją konfigurację bezpieczeństwa w
   `kurs.yaml` (format: `tools/nagrywanie/README.md`). Brak którejś = **sekcja "Pierwsza lekcja z nową usługą"**, potem
   wracasz tutaj. Krok poza przeglądarką (terminal, aplikacja desktopowa) = dogrywka ręczna tego kroku - powiedz o tym
   od razu.
3. **Konfiguracja lekcji.** Napisz `video/nagrywanie.yaml` z planu nagrania: każdy krok planu jako działania usługi
   w kolejności planu, akapit lektora, warunek przyjęcia (`sprawdz`: nazwany predykat - to on rozstrzyga, nie opis),
   grupy prób z budżetem, warianty narracji, ujęcia, dogrywki. Treść do wpisania bierz dosłownie z planu (kolumna
   "Do wpisania" i bloki pod tabelą) - nigdy własne brzmienie. Potem `sprawdz` (walidacja wobec planu) i `proba`
   (bez przeglądarki, atrapy) - oba czyste, zanim cokolwiek otworzysz w przeglądarce.
4. **Przebieg próbny (przed lektorem).** Lekcja nie potrzebuje jeszcze paczki lektora - ten krok idzie zaraz po
   zatwierdzeniu treści, zanim `/kurs-video` wygeneruje płatne audio. Lekcja, która ma już paczkę lektora (`video/lektor/spis.md`), a nie ma
   nagrania, też przechodzi przebieg przed nagraniem; przyjęta uwaga `scenariusz` oznacza wtedy nowe audio całej lekcji -
   uprzedź Rafała o koszcie. Najpierw `npm run diagnoza -- <lekcja>`: zero
   BŁĘDÓW, każdą UWAGĘ powiedz Rafałowi. Przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu
   i zapytaj o zgodę na koszt: przebieg tworzy i uruchamia workflow jak nagranie (podaj, ile wykonań przewiduje
   budżet grup i które węzły zużywają tokeny). Lekcja ze `start_state` (kurs `autonomy: full`): przed PIERWSZYM
   przebiegiem `preview-start-state <lekcja> --ujecie N` i **BRAMKA B4** - Rafał zatwierdza listę trwałych usunięć
   (kolejne resety tej lekcji idą bez bramki). Po jego "tak": `przebieg <lekcja> --przygotowane` - cała lekcja,
   bez wideo, zrzut po każdym kroku. Wynik: `<dane>/przebiegi/<lekcja>/<czas>/` z `przebieg.json`, zrzutami
   i `galeria.html`; komenda wypisuje niesprawdzone kroki i zasoby do usunięcia.
   **Analiza.** Dla każdego kroku z `przebieg.json` otwórz zrzut (`Read`) i porównaj go z polami kroku: `narracja`,
   `opis` (kroki planu, czyli `[AKCJA]`), `przyjecie` i `elementy` (lokator i widoczna nazwa). Pytania:
   - czy wszystko, co narracja nazywa (przycisk, zakładka, pole, etykieta, sekcja), jest na ekranie pod tą nazwą;
   - czy opisany stan się zgadza (kolor, liczba elementów, pusta lista, połączenie);
   - czy twierdzenie o braku ("nie ma go") jest prawdą na ekranie;
   - czy automat zadziałał na elemencie, który nazywa `[AKCJA]`.
   Ujęcie z więcej niż 15 zrzutami analizuje subagent (jeden na ujęcie) z tymi samymi pytaniami i formatem uwagi
   poniżej. Każdy zgłoszony rozjazd otwierasz sam na zrzucie, zanim trafi do raportu; czego nie potwierdzisz - typ
   `niepewne`, nigdy ciche pominięcie. Krok z `zrzutBlad` (w `niesprawdzone` z powodem `brak zrzutu`) i krok z powodem
   `grupa pominięta po wyczerpaniu budżetu` to zawsze uwaga `niepewne` dla Rafała - bez zrzutu nie ma porównania. Przebieg zatrzymany: zrzut `stop.png` i komunikat automatu oceniasz tak samo
   (rozjazd scenariusza czy błąd automatu).
   **Raport** `video/przebieg-probny.md` (format: spec przebiegu próbnego, część 2):
   - frontmatter: `narzedzie: tools/nagrywanie przebieg`, `data`, `zrodla-hasz` = `zrodlaHasz` z `przebieg.json`,
     `nagrywanie-hasz` = `hasz.model`, `przebiegi` (lista `"<numer ujęcia>: <katalog przebiegu względem <dane>>"`), `wynik`
     (`czysty` | `rozjazdy` | `zatrzymany`), `status: do_decyzji`;
   - `## Zatrzymanie` (jeśli było): krok, ujęcie, komunikat automatu dosłownie, zrzut, diagnoza w jednym zdaniu;
   - uwagi `### N. Krok K (akapit S:A) - tytuł` (K to `numer` kroku automatu z `przebieg.json`, nie numer kroku planu -
     po nim `galeria` oznacza kroki) z polami `Typ:` (`scenariusz` | `automat` | `niepewne`), `Cytat:`,
     `Na zrzucie:`, `Propozycja:`, `Zrzut:`;
   - `## Niesprawdzone kroki` (z `niesprawdzone`), `## Do usunięcia przed nagraniem` (z `utworzone`),
     `## Podsumowanie` (liczba uwag na typ).
   `wynik: czysty` tylko wtedy, gdy każde ujęcie lekcji przeszło przebieg na tym samym `zrodla-hasz`, nie ma żadnej uwagi, a
   `niesprawdzone` zawiera wyłącznie kroki z powodem `dogrywka` albo `nieaktywny wariant`.
   Potem `galeria <lekcja>` - oznacza kroki z uwag.
   **BRAMKA: raport.** Pokaż Rafałowi tabelę `nr | krok | akapit | typ | rozjazd | propozycja`, zatrzymanie,
   niesprawdzone kroki, listę do usunięcia i pełną ścieżkę `galeria.html` w bloku kodu. Rafał decyduje o każdej
   uwadze. Brak odpowiedzi to nie zgoda.
   **Poprawki - tylko uwagi, które Rafał przyjął:**
   - `scenariusz`: wstaw pod zdaniem `[UWAGA: przebieg próbny, krok K: <rozjazd>. Propozycja: <brzmienie>]` i oddaj
     lekcję do `/kurs-uwagi` (naniesie, przeniesie zmianę do artykułu i konspektu, przegeneruje plan nagrania).
     Scenariusza nie poprawiasz sam;
   - `automat`: popraw `nagrywanie.yaml` albo obsługę usługi, potem `sprawdz` i `proba`;
   - potem Rafał usuwa zasoby z "Do usunięcia przed nagraniem" (podaj usługę, identyfikator i nazwę), a ty robisz
     kolejny przebieg: całej lekcji po zmianie scenariusza, `--ujecie N` po poprawce automatu w jednym ujęciu.
     Pod `autonomy: full` z `start_state` lista "Do usunięcia przed nagraniem" jest tylko informacyjna: kolejny
     przebieg startuje od automatycznego resetu, Rafał niczego nie usuwa.
   **Scalanie po `--ujecie N`.** `przebiegi` w raporcie to lista wpisów `"<numer ujęcia>: <katalog względem <dane>>"`.
   Najpierw porównaj `zrodlaHasz` nowego `przebieg.json` z `zrodla-hasz` raportu: różne = treść się zmieniła,
   potrzebny przebieg całej lekcji, nie scalasz. Równe: usuń z raportu uwagi o krokach tego ujęcia (numery kroków
   ujęcia są w `ujecia[].kroki` obu `przebieg.json`) i jego sekcję "Zatrzymanie", dopisz uwagi z nowej analizy,
   ponumeruj wszystkie uwagi od 1 w kolejności kroków, podmień wpis tego ujęcia w `przebiegi`, przelicz
   "Niesprawdzone kroki", "Do usunięcia przed nagraniem" i `wynik`.
   Pętla kończy się raportem `wynik: czysty` albo "tak" Rafała dla pozostałych uwag - dopiero wtedy ustaw
   `status: zaakceptowany` i zacommituj raport. Etap 1 `/kurs-video` (lektor) odmówi bez zaakceptowanego raportu
   zgodnego z bieżącą treścią; `--bez-przebiegu` tylko na jawne słowo Rafała w tej rozmowie.
5. **Nagranie (po paczce lektora).** Wymaga zaakceptowanego przebiegu próbnego (krok 4) i paczki lektora z etapu 1 `/kurs-video`; zasoby utworzone przez ostatni przebieg muszą być usunięte. Pod `autonomy: full` z `start_state` nic nie sprzątasz ręcznie przed nagraniem (reset przed ujęciem robi to sam), a `--wznow` takiego ujęcia narzędzie odmawia - nagrywasz je od początku. Najpierw `npm run diagnoza -- <lekcja>`: zero BŁĘDÓW, inaczej nie nagrywasz; każdą UWAGĘ powiedz Rafałowi (np. brak sygnatur przy lekcji bez `wykonaj` jest w porządku). Przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu (stan konta, otwarte
   workflow, credentials) - dopiero po jego potwierdzeniu nagrywaj ujęcie po ujęciu **do jednego przebiegu**:
   `nagraj <lekcja> --przygotowane --ujecie N --run <nazwa>` z tą samą `<nazwa>` dla wszystkich ujęć lekcji (bez
   `--przygotowane` narzędzie odmówi). Ponowne nagranie ujęcia nie nadpisuje poprzedniego (`ujecie-NN-p2`), a po
   każdym nagraniu narzędzie wypisuje ujęcia, których jeszcze brakuje. Przerwane ujęcie:
   `nagraj <lekcja> --przygotowane --ujecie N --run <nazwa> --wznow <nazwa>` - narzędzie odmówi wznowienia grupy z rozpoczętym wykonaniem
   albo skutkiem ubocznym; wtedy decyduje Rafał. Automat powtarza grupę prób w ramach budżetu; zatrzymanie z komunikatem
   (limit, logowanie, brak elementu, cel spoza listy dozwolonych, wykonanie o nieustalonym stanie) = nie zgaduj
   i nie obchodź - pokaż komunikat Rafałowi. **BRAMKA: pierwsze ujęcie lekcji** - daj Rafałowi ścieżkę surowego
   nagrania i poproś, żeby je obejrzał; jego uwagi zmieniają `nagrywanie.yaml`, potem ujęcie od nowa. Kolejne ujęcia
   tylko po jego "tak".
6. **EDL.** `edl <lekcja> --run <nazwa>` (wszystkie ujęcia nagrane) - granice klatek muszą zgodzić się z osią lektora (bramka narzędzia). Istniejący `edl.json` z ręcznymi
   decyzjami nadpisuje tylko `--nadpisz` po zgodzie Rafała. Dalej `/kurs-montaz` (zoomy, ramki, plansze), potem
   `/kurs-video` etap 2.

Kurs z `oprawa: { znak_ai: true }` w `kurs.yaml`: znaczniki kroków niosą dodatkowo prostokąty elementów akcji
(początek i koniec akcji, prostokąt przed i po), a `edl` zapisuje `video/montaz/obszary-nagrania.json` - strażnik rogu
znaku AI nie zasłoni miejsca, w którym coś się dzieje. Nic do zrobienia ręcznie; kurs bez klucza - znaczniki jak dotąd.

## Pierwsza lekcja z nową usługą (jednorazowo na usługę)

Robi się przy pierwszej lekcji, która jej potrzebuje, na koncie zespołu. ⛔ Bez kroku 1 nie ma sondy ani nagrania.

1. **Warunki bezpieczeństwa konta** - ustal z Rafałem i zapisz w konfiguracji usługi w `kurs.yaml`:
   - stały adres usługi i **projekt testowy** (w n8n: projekt, nie sam folder), lista **dozwolonych identyfikatorów
     workflow** - automat zatrzyma się przed otwarciem, zmianą albo wykonaniem czegokolwiek spoza listy;
   - sesja z dostępem ograniczonym do projektu testowego, jeśli plan konta na to pozwala; jeśli nie - osobne konto
     albo instancja testowa (decyzja Rafała);
   - tylko dane syntetyczne; credentials wskazują testowe zasoby, są przygotowane wcześniej, automat wybiera je
     z listy i nigdy nie otwiera ich szczegółów; klucze API nigdy nie są wpisywane na nagraniu;
   - operacje ze skutkami ubocznymi (wysyłka, zapis do zewnętrznego systemu) nie są powtarzane automatycznie.
   Zapis w `kurs.yaml: nagrywanie.uslugi.<nazwa>` (pola: `adres`, `hosty`, `hostyLogowania`, `identyfikatory`,
   `identyfikator`, opcjonalnie `widokiBezId`, `sesja`; `wyzwalaczeSieci` dopiero z sondy w kroku 4 - opis w `tools/nagrywanie/README.md`, sekcja "Nowa usługa").
2. **Szablon usługi:** `nowa-usluga <lekcja> --usluga <nazwa>` tworzy `<kurs>/_nagrywanie/uslugi/<nazwa>.js` ze
   szablonu, który bierze wszystko z konfiguracji z kroku 1. To **tryb przygotowania**: wystarczy do bezpiecznego
   logowania i sondy bez `wyzwalaczeSieci` (w obu oknach nie ma działań `wykonaj`, a sygnatury, jeśli już są,
   pozostają zablokowane). Nagrywanie ujęć z działaniem `wykonaj` wymaga już sygnatur z kroku 4 - bez nich
   walidator odmawia.
3. **Logowanie:** `login <lekcja> --usluga <nazwa>` otwiera przeglądarkę w osobnym profilu kursu; loguje się Rafał
   (hasło i dwuetapowe logowanie zostają u niego). Okno jest chronione strażnikiem: nie otwieraj w nim ręcznie nowych
   kart (zostaną zamknięte). Automat tylko korzysta z zapamiętanej sesji.
4. **Sonda:** w projekcie testowym zapisz drzewo dostępności, atrybuty `data-test-id` i zrzuty kluczowych widoków.
   Przejrzyj je przed dalszą pracą (żadnych prawdziwych danych w artefaktach). Potem **sygnatury sieciowe
   uruchomienia**: `sonda <lekcja> --usluga <nazwa>` otwiera chronione okno profilu kursu, w którym Rafał RAZ ręcznie
   uruchamia pusty testowy workflow (za jego zgodą na to jedno wykonanie), czeka na wynik i zamyka okno. Komenda
   wypisuje kandydatów (metoda + ścieżka żądań zmieniających stan) gotowych do wklejenia jako `wyzwalaczeSieci`
   w `kurs.yaml` i zapisuje je w `<dane>/sondy/`. Wybierz żądanie, którym usługa startuje wykonanie (w n8n: wykonanie
   workflow i węzła), zastąp identyfikatory w ścieżce wyrażeniem (np. `^/rest/workflows/[^/]+/run$`) i sprawdź,
   czy zwykłe zapisanie workflow nie trafia w ten sam wzorzec. To sygnatury blokują uruchomienie z pominięciem kroku
   `wykonaj` (Enter, inny przycisk, ramka, przekierowanie).
5. **Obsługa usługi:** uzupełnij moduł z kroku 2 wg kontraktu z README: lokatory z wariantami zapasowymi, wzorce
   popupów, limitów i logowania, predykaty stanu, działania specyficzne z deklaracją `cel`, `wyzwalacze` (przyciski
   uruchamiające wykonanie - klikane wyłącznie działaniem `wykonaj`), `stanWykonania`, wykonania z identyfikatorem
   i stanem `nieustalony`. Strona otwierająca nową kartę jest zawsze blokowana - taki krok idzie jako dogrywka. Dla n8n działania przez interfejs jak człowiek: węzeł z wyszukiwarki
   węzłów, "dodaj następny węzeł" z wyjścia, bez przeciągania po współrzędnych.
6. **Próba obsługi** na pustym testowym workflow, z odczytem wyniku (nie samą obecnością): dodanie węzła, połączenie
   (także z istniejącego węzła, z konkretnego wyjścia, rozgałęzienie, połączenia węzłów AI potrzebnych lekcji) potwierdzone
   odczytem krawędzi, ustawienie pola potwierdzone odczytem, wykonanie z odczytem stanu. Krótkie nagranie próby pokaż
   Rafałowi. Czego nie da się zrobić stabilnie - ten krok lekcji idzie jako dogrywka ręczna.
   **Powiększenie:** w tej samej próbie dobierz raz na usługę `powiekszenie` w `kurs.yaml` (1-1.5; dla n8n zacznij
   od 1.25). Wyciągnij klatkę z nagrania próby (np. `ffmpeg -ss 5 -i surowe.mp4 -frames:v 1 klatka.png`) i pokaż ją
   Rafałowi: tekst czytelny, nic ważnego nie wypada poza kadr, kursor stoi na klikanym elemencie. Jego decyzja
   zostaje dla wszystkich lekcji z tą usługą.
7. **Review** tym, czego zespół używa (review AI pipeline'u albo inny model w sesji), potem zmiany do repo (gałąź i PR
   jak w zespole). Od teraz ta usługa nie wymaga przygotowania.

## Kurs z `autonomy: full`

Kurs z `nagrywanie.autonomy: full` w `kurs.yaml` (konto wyłącznie kursowe; reguły per poziom: `tools/nagrywanie/README.md`,
sekcja "Poziom autonomii kursu"). Reszta procedury bez zmian.

- **Automat robi sam:** reset stanu startowego konta przed ujęciem (`start_state`), okno logowania OAuth dostawcy
  w działaniu z `okno` (zakresy i uprawnienia sprawdza rdzeń wobec listy z `kurs.yaml`) i wpisanie klucza
  z `secrets.yaml` działaniem `type_secret`.
- **Zostaje u Rafała:** jednorazowe zalogowanie kont w profilu kursu (`login`), ręczne wpisanie `secrets.yaml`
  (Claude pliku nie czyta i nie prosi o klucze w rozmowie), hasło i drugi składnik, wszystkie bramki (B3, B4,
  zatwierdzenie raportu, pierwsze ujęcie).
- **Nowy dostawca albo nowe zakresy:** `probe-ui --usluga <nazwa> --okno <dostawca>` (P1a, bez zgody) -> bramka B3
  (Rafał zatwierdza hosty i listę zakresów w `kurs.yaml`) -> `probe-ui ... --okno <dostawca> --zgoda` (P1b).
- **`start_state` nowej lekcji:** `save-start-state <lekcja> --ujecie N` zapisuje migawkę; przejrzyj ją z tabelą
  `## Przygotowanie przed nagraniem` z planu i dopiero wtedy wklej deklarację do `nagrywanie.yaml`.

## Zasady

- Nic poza przeglądarką. Pod `restricted`: nic poza projektem testowym i listą dozwolonych workflow; pod `full`: nic poza hostami kursu. Zasady wykonań i kosztów poniżej bez zmian.
- Żadnego obchodzenia zabezpieczeń usługi (CAPTCHA, wykrycie automatu, wylogowanie) - zatrzymanie i komunikat.
- Koszty: wykonania workflow z węzłami AI zużywają tokeny przy każdej próbie. **Zgoda Rafała na koszt i limit wykonań
  PRZED pierwszym prawdziwym wykonaniem** - także w sondzie, próbie obsługi usługi, przygotowaniu i resecie, nie
  dopiero przed nagraniem lekcji. Powiedz, ile wykonań przewiduje budżet grup (z resetami) i jakie węzły zużywają
  tokeny; bez zgody tylko kroki bez wykonań.
- Surowe nagrania, zrzuty przebiegu próbnego i profil przeglądarki nie idą do gita (mogą zawierać dane konta). W raporcie `video/przebieg-probny.md` (idzie do gita) pola `Cytat:` i `Na zrzucie:` nie przepisują danych konta: adresów e-mail, nazw spoza projektu testowego, fragmentów kluczy.
- `kursy/misja-ai-start/_nagrywanie/` to osobny, zamrożony automat Misji - ten skill go nie używa i nie zmienia.
