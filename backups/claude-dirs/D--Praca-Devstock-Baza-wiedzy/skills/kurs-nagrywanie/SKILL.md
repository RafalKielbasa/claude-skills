---
name: kurs-nagrywanie
description: Automatyczne nagrywanie ekranu lekcji demo Playwrightem (tools/nagrywanie) - automat sam klika w przeglądarce według planu nagrania, zapisuje znaczniki kroków i oddaje gotowy EDL montażowi automatycznemu. Przy pierwszej lekcji z nową usługą (np. n8n) prowadzi przez jednorazowe przygotowanie - warunki bezpieczeństwa konta, logowanie w osobnym profilu, sonda interfejsu i obsługa usługi sprawdzona na koncie zespołu. Używaj, gdy kurs ma `nagrywanie: { automat: true }` w kurs.yaml i lekcja demo ma zatwierdzoną treść i plan nagrania; woła go /kurs-video zamiast ręcznego nagrania. NIE do pracy poza przeglądarką (terminal, aplikacje desktopowe) - te kroki nagrywa się ręcznie jako dogrywki.
---

# /kurs-nagrywanie - automat nagrywa ekran lekcji demo

Wejście: ścieżka lekcji demo, np. `kursy/<slug>/modul-03-x/lekcja-01-y`. Wynik: surowe nagrania ujęć ze znacznikami
kroków i `video/montaz/edl.json` + `zrodla.json` lekcji, gotowe dla `/kurs-montaz`. Projekt:
`docs/superpowers/specs/2026-10-07-nagrywanie-wspolne-design.md`; narzędzie i formaty: `tools/nagrywanie/README.md`.
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
4. **Nagranie.** Najpierw `npm run diagnoza -- <lekcja>`: zero BŁĘDÓW, inaczej nie nagrywasz; każdą UWAGĘ powiedz Rafałowi (np. brak sygnatur przy lekcji bez `wykonaj` jest w porządku). Przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu (stan konta, otwarte
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
5. **EDL.** `edl <lekcja> --run <nazwa>` (wszystkie ujęcia nagrane) - granice klatek muszą zgodzić się z osią lektora (bramka narzędzia). Istniejący `edl.json` z ręcznymi
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

## Zasady

- Nic poza przeglądarką. Nic poza projektem testowym i listą dozwolonych workflow.
- Żadnego obchodzenia zabezpieczeń usługi (CAPTCHA, wykrycie automatu, wylogowanie) - zatrzymanie i komunikat.
- Koszty: wykonania workflow z węzłami AI zużywają tokeny przy każdej próbie. **Zgoda Rafała na koszt i limit wykonań
  PRZED pierwszym prawdziwym wykonaniem** - także w sondzie, próbie obsługi usługi, przygotowaniu i resecie, nie
  dopiero przed nagraniem lekcji. Powiedz, ile wykonań przewiduje budżet grup (z resetami) i jakie węzły zużywają
  tokeny; bez zgody tylko kroki bez wykonań.
- Surowe nagrania i profil przeglądarki nie idą do gita (mogą zawierać dane konta).
- `kursy/misja-ai-start/_nagrywanie/` to osobny, zamrożony automat Misji - ten skill go nie używa i nie zmienia.
