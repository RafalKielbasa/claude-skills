---
name: kurs-nagrywanie
description: Automatyczne nagrywanie ekranu lekcji demo Playwrightem (tools/nagrywanie) - automat sam klika w przeglądarce według planu nagrania, zapisuje znaczniki kroków i oddaje gotowy EDL montażowi automatycznemu. Przy pierwszej lekcji z nową usługą (np. n8n) prowadzi przez jednorazowe przygotowanie - warunki bezpieczeństwa konta, logowanie w osobnym profilu, sonda interfejsu i obsługa usługi sprawdzona na koncie zespołu. Używaj, gdy kurs ma `nagrywanie: { automat: true }` w kurs.yaml i lekcja demo ma zatwierdzoną treść i plan nagrania - najpierw przed lektorem (przebieg próbny ze zrzutami ekranu i raport rozjazdów scenariusza z aplikacją), potem po paczce lektora (nagranie); woła go /kurs-video zamiast ręcznego nagrania. NIE do pracy poza przeglądarką (terminal, aplikacje desktopowe) - te kroki nagrywa się ręcznie jako dogrywki.
---

# /kurs-nagrywanie - automat nagrywa ekran lekcji demo

Wejście: ścieżka lekcji demo, np. `kursy/<slug>/modul-03-x/lekcja-01-y`. Wynik w dwóch częściach: przed lektorem
zaakceptowany raport przebiegu próbnego `video/przebieg-probny.md` (kroki 0-4), po paczce lektora surowe nagrania
ujęć ze znacznikami kroków i `video/montaz/edl.json` + `zrodla.json` lekcji, gotowe dla `/kurs-montaz` (kroki 5-6).
Projekt: `docs/superpowers/specs/2026-10-07-nagrywanie-wspolne-design.md`,
`docs/superpowers/specs/2026-10-10-nagrywanie-przebieg-probny-design.md` i dla lekcji z biletem produkcyjnym
`docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`; narzędzie i formaty:
`tools/nagrywanie/README.md`.
Komendy: `cd tools/nagrywanie && npm run nagrywanie -- <komenda> ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
`<dane>` w całym skillu to katalog danych roboczych automatu (przebiegi, nagrania, sondy, stanowisko): `nagrywanie.dane`
z `kurs.yaml`, liczone względem folderu kursu, domyślnie `<kurs>/_nagrywanie` (opcja `--dane` komendy go nadpisuje).

## Procedura

0. **Diagnoza środowiska** - zawsze, sam, bez pytania: `npm run diagnoza` (w `tools/nagrywanie`, BEZ lekcji: Node,
   Chrome, ffmpeg, samotest strażnika). Każdy BŁĄD naprawiasz według podpowiedzi; BŁĄD w samoteście strażnika = nie
   nagrywamy, powiedz Rafałowi. Gdy narzędzie jest na tym komputerze pierwszy raz (brak `tools/nagrywanie/.demo/`):
   sam uruchom `npm run demo` (minuta, strona testowa, bez konta) i pokaż Rafałowi ścieżkę nagrania.
   Pełna diagnoza lekcji (`npm run diagnoza -- <lekcja>`) dopiero w kroku 4, gdy usługa i `nagrywanie.yaml` są gotowe.
1. **Bramka wejścia.** `lekcja.yaml`: `typ_video: demo`, `status.tresc: zatwierdzona`, istnieje aktualny
   `video/plan-nagrania.md` (jeśli `npm run validate` mówi, że jest nieaktualny - `npm run plan-nagrania` w
   `tools/course-pipeline`). Kurs ma `nagrywanie: { automat: true }`. Inaczej przerwij i powiedz Rafałowi, czego brakuje.
   **BRAMKA G1: bilet produkcyjny** (lekcja wchodzi w tryb biletu; spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
   sekcje 3, 4, 12). **Kolejność:** `budzet` liczy wykonania z `video/nagrywanie.yaml` i waliduje lekcję jak `sprawdz`
   (pod `autonomy: full` także nazwy z `secrets.yaml`), więc działa dopiero, gdy `sprawdz` przechodzi. Lekcja bez
   `video/nagrywanie.yaml` przechodzi więc najpierw kroki 2 i 3 bez pracy na koncie i bez płatnych wywołań: ustalasz
   usługi, piszesz `video/nagrywanie.yaml`, uruchamiasz `sprawdz` i `proba` (oba bez przeglądarki); `przygotowanie`
   (czyta konto) i przebieg czekają na bilet. Gdy oba są czyste, w tej samej turze idzie karta G1. Usługa bez obsługi
   (krok 2 kieruje do sekcji „Pierwsza lekcja z nową usługą”) to praca na koncie z Rafałem - ta sekcja idzie wtedy
   przed kartą G1, jak dotąd. Karta dla Rafała: (a) propozycja budżetu z lekcji: uruchom `budzet <lekcja>` (bez
   przeglądarki i bez stanowiska) i wklej jego wynik: rozbicie `E` po ujęciach i grupach oraz blok `budget` z
   `executions = E × (dry_passes + 1 + retakes) + M` (`M` - maile `video/mail.yaml`, których tematy deklaruje
   `start_state.gmail.inbox`: `send-mail` wysyła każdy raz na przygotowanie lekcji; lekcja bez poczty ma `M = 0`),
   domyślnie `dry_passes: 4`, `retakes: 2`, `tts_regenerations: 1`
   (2, gdy lekcja ma już `video/lektor/spis.md`: zmiana treści zużyje jedną regenerację w etapie 1), `stt: true`
   (`--dry-passes N` i `--retakes N` zmieniają liczby) - Rafał zmienia liczby w karcie; (b) ustawienia kursu z
   `kurs.yaml`: każdy brakujący klucz `video.avatar_engine` (`api` albo `mcp`) i `video.narrator_control` (`true` albo
   `false`) to pytanie w tej karcie z twoją propozycją; po „OK” Rafała zapisujesz je w `kurs.yaml` razem z biletem (jak
   pozycje (e)), a `/kurs-video` w lekcji z biletem już o nie nie pyta;
   (c) pozycje `nagrywanie.account_setup` bez `done` (czynności ręczne na koncie, np. nazwa wyświetlana w Cohere i nazwa
   organizacji w Pinecone) - wylistuj je i nie pytaj o nie ponownie, gdy `done` jest ustawione; (d) przy lekcji ze
   `start_state`: `reset_policy` usług lekcji z `kurs.yaml` (z biletem lekcja jej wymaga, bramka polityka konta (G3)) - polityka z
   `pending_confirmation: true` (data wpisana w imieniu Rafała) odmawia w lekcji z biletem
   jak brakująca (błąd walidacji z bramką polityka konta (G3)); Rafał potwierdza ją, usuwając flagę (albo poprawia datę) - pokaż mu to w
   karcie; (e) decyzje, o które `/kurs-video` (krok 1) i `/kurs-montaz` pytają w lekcji bez biletu: brakujące klucze
   `slajdy.odslanianie`, `montaz.plansze` i `oprawa` w `kurs.yaml`, akceptacja brakującego `video/plansze.yaml`
   (plik pisze `/kurs-lekcja`) oraz - w kursie bez `oprawa` - intro i outro do montażu. W lekcji z biletem pytasz o
   nie tu, przed zapisem biletu, a skille etapów już o nie nie pytają (brak decyzji = bilet zapisano błędnie, dopłata do
   bilet produkcyjny (G1)); (f) lekcja z pocztą (`video/mail.yaml`) albo z `consent: { require: granted }` (krok 3):
   pozycje konta kursu, których `kurs.yaml` jeszcze nie ma - raz na kurs, w kursie, który je ma, o nie nie pytasz:
   adresy `nagrywanie.uslugi.gmail.course_account` i `sender_account` (poświadczenia i pierwsza zgoda OAuth (G2);
   wpisuje je Rafał albo ty z jego dosłownych słów, wyłącznie w `kurs.yaml`), sygnatury wysyłki `gmail.wyzwalaczeSieci`
   (poświadczenia i pierwsza zgoda OAuth (G2): jedna ręczna wysyłka Rafała w oknie `sonda <lekcja> --usluga gmail`;
   wiersze, które sonda wypisze, wklejasz do `kurs.yaml` tylko na jego słowo przy tej pozycji - listy bezpieczeństwa
   zmienia wyłącznie Rafał, wiersz `CEL` tabeli triage; żądanie wysyłki, którego nie da się odróżnić od innych żądań
   Gmaila, np. usunięcia, to nic do wklejenia i decyzja Rafała), `sender_policy` z `send` (polityka konta (G3)) oraz -
   tylko przy `consent: { require: granted }` - rodzaj `connections` w `reset_policy` gmaila (polityka konta (G3)) i
   host `myaccount.google.com` w `gmail.hosty` (lista bezpieczeństwa: bez niego strażnik celu blokuje stronę konta
   Google, `CEL`, czyli poświadczenia i pierwsza zgoda OAuth (G2) według wiersza `CEL`). Pierwsze logowanie konta
   nadawcy jest pozycją `account_setup` (pozycja (c): na karcie tylko bez `done`; w agenty-ai zrobione 2026-10-22).
   Czynności na koncie z tej listy robi Rafał po „OK”, na swoje słowo, przy trzymanym koncie (`station-wait --purpose
   other`, `station-mark --state waiting`; jego kroki: „Dwa konta Google” w sekcji „Kurs z `autonomy: full`”), a po
   każdej `karta dopisz` `konto`. Po jego „OK” zapisujesz
   `video/ticket.yaml` z `approved: <dziś>` i budżetem (format i licznik po liczniku: README `tools/nagrywanie`, sekcja
   „Bilet produkcyjny”); brak „OK” = brak pliku. Wyczerpany licznik otwiera G1 „bilet produkcyjny” ponownie z licznikami i następną akcją;
   odrzucony plik (ręcznie zmieniony `spent`) odbudowujesz z manifestów (README, „Odbudowa `spent`”).
   Bilet włącza też `shared_state` kursu (z `delete` i `recreate`) w resecie `start_state` lekcji i wymaganie
   `reset_policy` (bramka polityka konta (G3)) - bez biletu reset obejmuje tylko własną deklarację lekcji, bez żadnej polityki.
   Bilet zakłada każda lekcja, która rusza `/kurs-nagrywanie` po tej zmianie. Lekcja BEZ `video/ticket.yaml` (dziś tylko
   1.4) kończy na dotychczasowych krokach - tabela przygotowania, `--przygotowane`,
   B4 „lista trwałych usunięć” per lekcja, reset bez `shared_state`, bez `recreate` i bez `reset_policy` - chyba że Rafał powie inaczej (decyzja w bramce S1 „zatwierdzenie specu”, wariant A dla lekcji w toku).
   Lekcje 2.1, 2.2 i 2.3 nie kończą już na starych zasadach: Rafał zatrzymał moduł 2 dnia 2026-10-22 i wracają one w
   trybie biletu po planach 2 i 3 (decyzja w indeksie projektu „Moduł 2 na automacie”).
2. **Usługi lekcji.** Z planu nagrania i `[AKCJA: ...]` w scenariuszu ustal, w jakich usługach dzieje się nagranie
   (np. n8n). Każda usługa musi mieć obsługę w `<kurs>/_nagrywanie/uslugi/` (ma pierwszeństwo) albo
   `tools/nagrywanie/uslugi/` i swoją konfigurację bezpieczeństwa w
   `kurs.yaml` (format: `tools/nagrywanie/README.md`). Brak którejś = **sekcja "Pierwsza lekcja z nową usługą"**, potem
   wracasz tutaj. Krok poza przeglądarką (terminal, aplikacja desktopowa) = dogrywka ręczna tego kroku - powiedz o tym
   od razu.
3. **Konfiguracja lekcji.** Napisz `video/nagrywanie.yaml` z planu nagrania: każdy krok planu jako działania usługi
   w kolejności planu, akapit lektora, warunek przyjęcia (`sprawdz`: nazwany predykat - to on rozstrzyga, nie opis),
   grupy prób z budżetem, warianty narracji, ujęcia, dogrywki. Dwie usługi w jednym ujęciu (np. n8n i arkusz) to dwie karty ujęcia (`karta` + `karty`) i przejścia między nimi
   działaniem `switch_tab: { tab: <karta> }`, nie `goto` na adres drugiej usługi - `goto` przeładowuje stronę w filmie
   (README `tools/nagrywanie`, sekcja „Przełączanie kart”). Treść do wpisania bierz dosłownie z planu (kolumna
   "Do wpisania" i bloki pod tabelą) - nigdy własne brzmienie. Potem `sprawdz` (walidacja wobec planu) i `proba`
   (bez przeglądarki, atrapy) - oba czyste, zanim cokolwiek otworzysz w przeglądarce.
   Krok z formularzem n8n (wyzwalacz formularza z plikiem) to działanie `submit_form { plik: materialy/<plik> }` -
   okno formularza przyjmuje rdzeń (`okno: usluga`), plik bierze z katalogu lekcji; „Execute workflow” otwiera
   formularz przy każdym uruchomieniu, „Execute step” na węźle dalej w przepływie - nie (README, „Okno formularza”).
   Tabelę `## Przygotowanie przed nagraniem` z konspektu zapisujesz też jako blok `preparation` w `nagrywanie.yaml`
   (predykaty stanu konta na usługę; tabela predykatów: README, „Przygotowanie jako predykaty”). Pozycja, która nie jest
   predykatem, a jednorazową czynnością ręczną, idzie do `account_setup` w `kurs.yaml` (G1 „bilet produkcyjny”). `przygotowanie <lekcja>`
   sprawdza blok bez nagrywania (tylko odczyt, wymaga stanowiska).
   **Poczta lekcji** (konspekt każe przygotować skrzynkę Gmail; README `tools/nagrywanie`, „Stan startowy skrzynki
   Gmail” i „Poczta lekcji”):
   - `video/mail.yaml` z sekcji konspektu, która wymienia maile (np. „Dane do przygotowania”, a w 2.2 „### Skrzynka
     Gmail - dziesięć wiadomości” pod „## Do wklejenia i wpisania na ekranie”), mail po mailu: `id` (litery,
     cyfry, kropka, myślnik, podkreślenie), `subject` i `body` dosłownie z konspektu, w kolejności, którą konspekt
     ustala (jawne polecenie typu „storczyki jako druga albo trzecia z kolei” jest tą kolejnością); maile innej lekcji,
     które skrzynka też ma pokazać, dołączasz przez `include` (ścieżka względem tej lekcji), nigdy kopią;
   - `start_state.gmail` ujęcia z kartą Gmaila z tabeli `## Przygotowanie przed nagraniem`: `inbox` - każdy temat,
     który tabela każe mieć w Odebranych, jako `{ subject, from: sender }`; `drafts` i `sent` tak, jak mówi tabela
     (pusty folder to `[]`). `from: sender`, nigdy adres - także wtedy, gdy konspekt nazywa nadawcę adresem: adresy są
     tylko w `kurs.yaml` (`sender_account`, `course_account`). Żaden plik lekcji nie zawiera adresu e-mail;
   - `preparation.gmail: [{ predicate: mail_age, folder: "Odebrane", days_ago: 1 }]`, gdy konspekt każe wysłać maile
     dzień przed nagraniem; bez takiego zdania `mail_age` nie piszesz;
   - `sprawdz` odrzuca temat `inbox` spoza `video/mail.yaml`, a `budzet` dolicza te maile (`+ M`). Wysyła je
     `send-mail` (sekcja „Poczta lekcji”), nigdy reset.
   **Ekran zgody Google** (krok z `google_sign_in` na ekranie; README „Warianty narracji: klucz `consent`”):
   - domyślnie `warianty.consent: { wartosci: [granted, incremental, remembered], rozstrzyga: <numer kroku z
     google_sign_in> }`: Google pokazuje pełny ekran zgody, ekran tylko z nowymi uprawnieniami albo żaden - zależnie od
     tego, co pamięta - a scenariusz ma na to trzy akapity wariantów (wzór: `/kurs-lekcja`, „Ekran zgody Google”).
     Konspekt ma po kroku logowania trzy kroki wariantów, a plan nagrania - trzy wiersze wariantów z własnymi numerami
     kroków planu (jak w `tools/nagrywanie/przyklady/kurs-przyklad/lekcja-warianty`). Krok z `google_sign_in`
     rozstrzyga, więc sam nie jest krokiem wariantu: pokrywa krok planu logowania i narruje akapit wspólny przed
     wariantami. Każdy z trzech akapitów wariantu (osobny fragment pod linią `[AKCJA: WARIANT <wartość> - ...]`) narruje
     krok automatu po nim z `wariant: { klucz: consent, wartosc: <wartość> }` i `krok_planu` swojego wiersza wariantu -
     zwykle dalsze działania logowania (np. nazwanie credentiala), w każdym z trzech kroków te same, bo gra tylko
     aktywny. `sprawdz` liczy pokrycie akapitów i kroków planu w każdej z trzech kombinacji;
   - wyjątek: konspekt wymaga pełnego ekranu zgody w filmie (np. „logowanie przez Google pokazujemy w całości”), a
     efektywny `start_state` ujęcia (`start_state` + `shared_state` − `delete`) nie trzyma innego credentiala Google -
     wtedy `consent: { require: granted }` zamiast wariantów (oba klucze się wykluczają) i jeden akapit w wersji
     `granted`. Pełny ekran wymaga cofnięcia dostępu `n8n.cloud` przed ujęciem („Cofnięcie dostępu Google” w sekcji
     „Kurs z `autonomy: full`”), a cofnięcie unieważnia każdy credential Google na koncie, więc ujęcie, które trzyma
     inny credential Google, `sprawdz` odrzuca (`consent.require: granted - cofnięcie dostępu przed ujęciem <i>
     unieważni credential …`) - wtedy warianty. Ujęcie z `require: granted` potrzebuje karty Gmaila i `start_state`
     (cofnięcie biegnie przed resetem);
   - zatwierdzona lekcja z jednym akapitem zgody, sprzed wariantów, dostaje akapity wariantów przez `/kurs-uwagi` w
     trybie automatycznym (zmiana w granicy samodzielnych zmian (D1) z decyzji specu, sekcja 10), więc dopiero z
     biletem: po G1 „bilet produkcyjny”, przed pierwszym przebiegiem, wstaw pod tym akapitem znacznik
     `[UWAGA: przebieg próbny, krok K: <zdanie o ekranie Google, dosłownie>. Propozycja: warianty consent | wspólne:
     <to zdanie bez części o ekranie Google> | granted: <zdanie> | incremental: <zdanie> | remembered:
     <zdanie>]` (jedna linia; K = `numer` kroku z `google_sign_in`; zdanie każdego wariantu zaczyna się zdaniem stałym
     z `/kurs-lekcja`), potem `/kurs-uwagi` w trybie automatycznym. Część wspólna - tekst, który zostaje pod linią
     `[AKCJA]` logowania (to, co akapit mówi przed zdaniem o ekranie Google, razem z `wspólne`) - nigdy nie jest pusta:
     bez tekstu między tą linią a `[AKCJA: WARIANT granted - …]` `parsujScenariusz`
     (`tools/course-pipeline/src/scenariusz.js`) skleja obie akcje w jedną (`<logowanie>; WARIANT granted - …`). Gdy po
     wycięciu części o ekranie Google pod linią logowania nic by nie zostało, `wspólne` to krótkie zdanie o kliknięciu
     logowania i wyborze konta, w stylu narracji lekcji. `/kurs-uwagi` doda też do konspektu trzy kroki wariantów i
     przenumeruje dalsze kroki o trzy (numer kroku, za którym numery się przesunęły, podaje w odpowiedzi), więc w
     `video/nagrywanie.yaml` dopisujesz kroki wariantów i przesuwasz o trzy każde odwołanie do dalszych kroków planu
     (`krok_planu`, `z_planu`, `warianty.<klucz>.kroki_planu`) oraz numery `akapit` za zmianą; potem `sprawdz` i
     `proba`. Zmiana zmienia `zrodla-hasz`, więc przebieg całej lekcji. Lekcji
     nagranej i zaakceptowanej (0.2) nie przerabiasz.
   Lekcja, która wchodzi w tryb biletu i nie ma jeszcze `video/ticket.yaml`, kończy ten krok na czystych `sprawdz`
   i `proba` (bez `przygotowanie`) i wraca do karty G1 „bilet produkcyjny” z kroku 1; krok 4 rusza dopiero z biletem.
4. **Przebieg próbny (przed lektorem).** Lekcja nie potrzebuje jeszcze paczki lektora - ten krok idzie zaraz po
   zatwierdzeniu treści, zanim `/kurs-video` wygeneruje płatne audio. Lekcja, która ma już paczkę lektora (`video/lektor/spis.md`), a nie ma
   nagrania, też przechodzi przebieg przed nagraniem; przyjęta uwaga `scenariusz` oznacza wtedy nowe audio całej lekcji -
   uprzedź Rafała o koszcie (w lekcji z biletem bez uprzedzania: regenerację liczy `tts_regenerations` biletu).
   Najpierw `npm run diagnoza -- <lekcja>`: zero
   BŁĘDÓW, każdą UWAGĘ powiedz Rafałowi.
   **Lekcja z biletem (`video/ticket.yaml`, G1 „bilet produkcyjny”):** bez tabeli przygotowania i bez pytania o zgodę na koszt - zgodą jest
   bilet, a narzędzie liczy `executions` i `dry_passes` i samo odmawia po wyczerpaniu budżetu. Przygotowanie konta
   sprawdza blok `preparation` przed każdym ujęciem przebiegu (komunikat `Przygotowanie ujęcia ... niespełnione`
   zatrzymuje ujęcie przed nagraniem); to, czego predykat nie obejmuje, jest w `account_setup` (G1 „bilet produkcyjny”). Lekcja ze
   `start_state`, której usługi mają w `kurs.yaml` potwierdzoną `reset_policy` obejmującą rodzaje z deklaracji (polityka konta (G3) raz
   na usługę): bez bramki B4 „lista trwałych usunięć” - `preview-start-state <lekcja> --ujecie N` drukujesz do logu (cztery listy: `Zostaje:`,
   `Usuwa:`, `Tworzy:`, `Odtwarza (OAuth):`; reset obejmuje `start_state` lekcji razem ze `shared_state` kursu) i idziesz
   dalej. Usługa bez polityki, z polityką czekającą na potwierdzenie (`pending_confirmation`) albo rodzaj spoza `covers`
   = błąd walidacji z nazwą bramki polityka konta (G3): wtedy karta tej bramki dla Rafała (co reset usuwa, na jakim koncie) i zapis
   `reset_policy` w `kurs.yaml` po jego „tak” - polityki czekającej nie traktujesz jak zatwierdzonej; Rafał potwierdza ją,
   usuwając `pending_confirmation` (albo poprawiając datę). Potem `przebieg <lekcja>` (bez `--przygotowane`; podane jest
   ignorowane z ostrzeżeniem) - cała lekcja, bez wideo, zrzut po każdym kroku. Lekcja z `video/mail.yaml`: po zajęciu
   konta, przed `preview-start-state` i przed każdym `przebieg`, najpierw `send-mail` (sekcja „Poczta lekcji”). Lekcja z
   `consent: { require: granted }`: `preview-start-state` wymienia cofnięcie dostępu wśród trwałych operacji, a
   `przebieg` robi je sam przed resetem ujęcia („Cofnięcie dostępu Google” w sekcji „Kurs z `autonomy: full`”).
   **Lekcja bez biletu (dotychczasowe kroki):** przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu
   i zapytaj o zgodę na koszt: przebieg tworzy i uruchamia workflow jak nagranie (podaj, ile wykonań przewiduje
   budżet grup i które węzły zużywają tokeny). Lekcja ze `start_state` (kurs `autonomy: full`; reset obejmuje tylko
   własną deklarację lekcji - `shared_state` kursu, `recreate` i wymaganie `reset_policy` (polityka konta (G3), także `pending_confirmation`)
   działają dopiero z biletem; lekcja bez biletu waliduje się bez polityki): przed PIERWSZYM
   przebiegiem `preview-start-state <lekcja> --ujecie N` i **BRAMKA B4 „lista trwałych usunięć”** - Rafał zatwierdza listę trwałych usunięć
   (kolejne resety tej lekcji idą bez bramki, dopóki deklaracja `start_state` się nie zmieni - zmieniona deklaracja wymaga nowego `preview-start-state` i nowej bramki B4 „lista trwałych usunięć”). Po jego "tak": `przebieg <lekcja> --przygotowane` - cała lekcja,
   bez wideo, zrzut po każdym kroku. Wynik: `<dane>/przebiegi/<lekcja>/<czas>/` z `przebieg.json`, zrzutami
   i `galeria.html`; komenda wypisuje niesprawdzone kroki i zasoby do usunięcia.
   Konto kursu współdzielą równoległe lekcje: `preview-start-state` i każdy `przebieg` zajmują je i oddają według sekcji „Lekcje równolegle”.
   **Analiza.** Dla każdego kroku z `przebieg.json` otwórz zrzut (`Read`) i porównaj go z polami kroku: `narracja`,
   `opis` (kroki planu, czyli `[AKCJA]`), `przyjecie` i `elementy` (lokator i widoczna nazwa). Pytania:
   - czy wszystko, co narracja nazywa (przycisk, zakładka, pole, etykieta, sekcja), jest na ekranie pod tą nazwą;
   - czy opisany stan się zgadza (kolor, liczba elementów, pusta lista, połączenie);
   - czy twierdzenie o braku ("nie ma go") jest prawdą na ekranie;
   - czy automat zadziałał na elemencie, który nazywa `[AKCJA]`.
   Ekran przejściowy nie jest rozjazdem: narracja nazywa element widoczny tylko w trakcie kroku (otwarta lista,
   najechanie kursorem), którego zrzut po kroku już nie pokazuje - jeśli krok przeszedł przyjęcie (`status: przyjety`),
   a ten element jest celem kroku (w `elementy` albo w `[AKCJA]`), uwagi nie ma.
   Ujęcie z więcej niż 15 zrzutami analizuje subagent (jeden na ujęcie) z tymi samymi pytaniami i formatem uwagi
   poniżej. Każdy zgłoszony rozjazd otwierasz sam na zrzucie, zanim trafi do raportu; czego nie potwierdzisz - typ
   `niepewne`, nigdy ciche pominięcie. Krok z `zrzutBlad` (w `niesprawdzone` z powodem `brak zrzutu`) i krok z powodem
   `grupa pominięta po wyczerpaniu budżetu` to zawsze uwaga `niepewne` dla Rafała - bez zrzutu nie ma porównania (w lekcji
   z biletem zamiast Rafała druga metoda i karta lekcji, niżej). Przebieg zatrzymany: zrzut `stop.png` i komunikat automatu oceniasz tak samo
   (rozjazd scenariusza czy błąd automatu).
   **Kontrola zrzutów.** Każdy wpis `kontrolaZrzutow` z `przebieg.json` bez `doradcze: true` (`pasek`, `styl`; README
   `tools/nagrywanie`, „Kontrola ekranu”) to uwaga `automat` przy swoim kroku, z `opis` w polu `Na zrzucie:`. Wpis
   `doradcze: true` (pionowy pasek, a do kalibracji na pierwszym przebiegu lekcji z biletem także `komunikat` i
   `przepelnienie`) nie jest uwagą: w `## Podsumowanie` raportu podajesz ich liczbę z rodzajem i krokami (dane do
   kalibracji), a na kartę lekcji trafiają z kontroli ujęcia nagrania. Gdy `przebieg.json` ma `kontrolaZrzutow`, o
   paskach przewijania i przepełnieniu rozstrzyga ona, nie oko (reguła pikselowa sondy P-A nie dała fałszywego
   alarmu). Pasek, który widzisz na zrzucie kroku bez wpisu `kontrolaZrzutow` o pasku, nie znika po cichu: to uwaga
   `niepewne` (w lekcji z biletem druga metoda, potem karta lekcji - jak każda `niepewne`, niżej; bez biletu decyduje
   Rafał). Inny defekt obrazu (pusty prostokąt, obce okno) zgłaszasz jak dotąd.
   **Raport** `video/przebieg-probny.md` (format: spec przebiegu próbnego, część 2), po każdym przebiegu, w obu trybach:
   - frontmatter: `narzedzie: tools/nagrywanie przebieg`, `data`, `zrodla-hasz` = `zrodlaHasz` z `przebieg.json`,
     `nagrywanie-hasz` = `hasz.model`, `przebiegi` (lista `"<numer ujęcia>: <katalog przebiegu względem <dane>>"`), `wynik`
     (`czysty` | `rozjazdy` | `zatrzymany`), `status: do_decyzji`, a po akceptacji `status: zaakceptowany` i
     `accepted_by` (`automat <RRRR-MM-DD>` albo `rafal <RRRR-MM-DD>`, niżej „Koniec pętli”);
   - `## Zatrzymanie` (jeśli było): krok, ujęcie, komunikat automatu dosłownie, zrzut, diagnoza w jednym zdaniu;
   - uwagi `### N. Krok K (akapit S:A) - tytuł` (K to `numer` kroku automatu z `przebieg.json`, nie numer kroku planu -
     po nim `galeria` oznacza kroki) z polami `Typ:` (`scenariusz` | `automat` | `niepewne`), `Cytat:`,
     `Na zrzucie:`, `Propozycja:`, `Zrzut:`;
   - `## Niesprawdzone kroki` (z `niesprawdzone`), `## Do usunięcia przed nagraniem` (z `utworzone`),
     `## Podsumowanie` (liczba uwag na typ);
   - lekcja z biletem: `## Naniesione automatycznie` - tabela `| krok | typ | przed | po | commit |`, wiersz na każdą
     zmianę, którą automat naniósł i zacommitował (`scenariusz`: zdanie przed i po; `scenariusz (decyzja G4)`: zmiana
     z decyzji Rafała w G4 „zakres dydaktyczny”; `automat`: plik oraz stara i nowa wartość), pod tabelą notatki G4 „zakres dydaktyczny” (krok, otwarta albo
     rozstrzygnięta i jak). Nową wersję raportu (kolejny przebieg, scalanie po `--ujecie N`) piszesz z pliku poprzedniej
     wersji: sekcję przenosisz w całości, z wierszami `automat` i notatkami G4 „zakres dydaktyczny”. Z wpisów `zmiana-tresci` w
     `video/karta.json` odbudowujesz ją tylko wtedy, gdy żadna poprzednia wersja raportu tej sekcji nie ma;
   - lekcja z biletem: `## Na karcie lekcji` - uwagi `niepewne`, których druga metoda nie rozstrzygnęła, i kroki z
     `zrzutBlad` albo z powodem `grupa pominięta po wyczerpaniu budżetu`, które poszły na kartę (`miejsce`,
     `zrodlo: niepewne`): krok, akapit, co obejrzeć w filmie.
   `wynik: czysty` tylko wtedy, gdy każde ujęcie lekcji przeszło przebieg na tym samym `zrodla-hasz`, nie ma żadnej uwagi, a
   `niesprawdzone` zawiera wyłącznie kroki z powodem `dogrywka` albo `nieaktywny wariant`. W lekcji z biletem uwagi
   i kroki z `## Na karcie lekcji` do `wynik` się nie liczą. Sekcja 2.1 specu (nierozstrzygnięte `niepewne` nie
   blokuje przebiegu) ma tu pierwszeństwo przed brzmieniem sekcji 2.4 („definicja bez zmian”) dla pozycji, które
   poszły na kartę: `wynik: czysty` zapada, gdy każda pozostała uwaga poszła na kartę, a `niesprawdzone` poza
   `dogrywka` i `nieaktywny wariant` ma wyłącznie kroki z tej sekcji.
   Potem `galeria <lekcja>` - oznacza kroki z uwag.
   **Lekcja bez biletu - BRAMKA: raport.** Pokaż Rafałowi tabelę `nr | krok | akapit | typ | rozjazd | propozycja`, zatrzymanie,
   niesprawdzone kroki, listę do usunięcia i pełną ścieżkę `galeria.html` w bloku kodu. Rafał decyduje o każdej
   uwadze. Brak odpowiedzi to nie zgoda.
   **Poprawki - tylko uwagi, które Rafał przyjął:**
   - `scenariusz`: wstaw pod zdaniem `[UWAGA: przebieg próbny, krok K: <rozjazd>. Propozycja: <brzmienie>]` i oddaj
     lekcję do `/kurs-uwagi` w trybie zwykłym, ze wszystkimi jego bramkami - bez biletu trybu automatycznego nie ma
     (naniesie, przeniesie zmianę do artykułu i konspektu, przegeneruje plan nagrania). Scenariusza nie poprawiasz sam;
   - `automat`: popraw `nagrywanie.yaml` albo obsługę usługi, potem `sprawdz` i `proba`;
   - potem Rafał usuwa zasoby z "Do usunięcia przed nagraniem" (podaj usługę, identyfikator i nazwę), a ty robisz
     kolejny przebieg: całej lekcji po zmianie scenariusza, `--ujecie N` po poprawce automatu w jednym ujęciu.
     Pod `autonomy: full` z `start_state` lista "Do usunięcia przed nagraniem" jest tylko informacyjna: kolejny
     przebieg startuje od automatycznego resetu, Rafał niczego nie usuwa.
   **Lekcja z biletem - bez bramki raportu** (spec `2026-10-21-nagrywanie-autonomy-gates-design.md`, sekcja 2). Każdą
   uwagę obsługujesz sam, według typu; Rafał zobaczy wynik na karcie lekcji (sekcja „Karta lekcji”) przy bramce
   film z kartą lekcji (G5).
   **Najpierw aktualność przebiegu.** Przegeneruj plan (`npm run plan-nagrania -- <lekcja>` w `tools/course-pipeline`),
   żeby porównanie nigdy nie szło do nieaktualnego planu, i porównaj `zrodlaHasz` przebiegu każdego ujęcia (wpisy
   `przebiegi` raportu) z `zrodla-hasz` w `video/plan-nagrania.md`. Różne - przebieg jest nieaktualny: jego uwag nie
   obsługujesz (żadnej poprawki ani bramki zakres dydaktyczny (G4) za „wróciła po poprawce”; uwagę z nieaktualnego
   przebiegu sprawdza dopiero następny przebieg), akceptacji nie ma, a dalej idzie przebieg całej lekcji w ramach
   `dry_passes`.
   - `automat` (w tym każdy wpis `kontrolaZrzutow` bez `doradcze`): poprawkę w pliku lekcji (`video/nagrywanie.yaml`)
     robisz od razu. Poprawkę pliku wspólnego (`_nagrywanie/uslugi/<usługa>.js`, `kurs.yaml` i reszta listy z sekcji
     „Lekcje równolegle”) w tej turze tylko zapisujesz jako propozycję w raporcie (plik i zmiana), a robisz ją po
     decyzjach bramek, gdy `station-wait --purpose dry-pass` przed następnym przebiegiem odda ci konto (kod 0). Potem
     `sprawdz` i `proba`, commit samych plików poprawki (`kurs(<slug>): lekcja <n> poprawka automatu z przebiegu
     próbnego (automat)`, „Commity pętli” niżej) i `przebieg <lekcja> --ujecie N` ujęcia z poprawką.
   - `scenariusz`: napisz nowe brzmienie (to, co jest na zrzucie, w stylu narracji lekcji; nazwy w cudzysłowie tylko
     wtedy, gdy zatwierdzona narracja lekcji tak je zapisuje) i zrób **test zakresu**: granica samodzielnych zmian
     (D1, spec sekcja 2.2). Zmiana mieści się w granicy samodzielnych zmian (D1) tylko wtedy, gdy zachodzą wszystkie
     cztery warunki (cytat ze specu; „D1” w cytacie to ta granica):
     > A `scenariusz` change is within D1 when all of these hold:
     > - the segment count, order and screen types do not change (the `/kurs-uwagi` invariant);
     > - the `[AKCJA]` still acts in the same service on the same kind of resource (a renamed button, a moved field, a
     >   tooltip instead of a hint are within; a different node, tool or service is outside);
     > - the narration keeps its claim (the beat still shows what it showed; a claim of absence that is false becomes a
     >   rewording, not a removed beat);
     > - no lesson step is removed and no new step is added beyond a one-click transition (open, close, scroll).

     Warunki dotyczą zmiany w całości: narracja, która po zmianie nazwałaby inny węzeł, narzędzie albo usługę niż
     przed nią, jest poza granicą samodzielnych zmian (D1) także wtedy, gdy linia `[AKCJA]` już zgadza się z ekranem
     (zmienia się to, czego beat uczy); zmieniona etykieta tego samego elementu mieści się w tej granicy (D1).
     W granicy samodzielnych zmian (D1): wstaw pod akapitem tego zdania `[UWAGA: przebieg próbny, krok K: <rozjazd>. Propozycja: <brzmienie>]`
     (`<rozjazd>` cytuje stare zdanie, `<brzmienie>` to całe nowe zdanie albo nowa linia `[AKCJA: ...]`) i uruchom
     `/kurs-uwagi` w trybie automatycznym (jego sekcja „Auto mode”): naniesie zmianę, przeniesie ją do artykułu i
     konspektu, przegeneruje plan nagrania, zacommituje ścieżki lekcji jako
     `kurs(<slug>): lekcja <n> uwagi z przebiegu próbnego (automat)` (`<n>` = `<moduł>.<numer>` z `lekcja.yaml`, np.
     `1.3`) i dopisze na kartę po jednym wpisie `zmiana-tresci` na zmianę. Potem przebieg całej lekcji (`zrodla-hasz`
     się zmienił). Poza granicą samodzielnych zmian (D1) - karta bramki zakres dydaktyczny (G4), bez żadnej edycji.
     Znacznik, którego `/kurs-uwagi` nie naniesie chirurgicznie (zostaje na miejscu), też idzie do tej bramki (G4).
   - `niepewne`: najpierw druga metoda, na tym samym kroku i w tej kolejności: (a) `layout` kroku i wpisy
     `kontrolaZrzutow` tego kroku, (b) `zrzut2s` (drugi zrzut 2 s po pierwszym), (c) wycinek prostokąta elementu z
     `elementy[].prostokat` (`[x, y, szer, wys]`) powiększony 2x:
     `ffmpeg -i <zrzut> -vf "crop=w:h:x:y,scale=iw*2:ih*2" <plik roboczy>.png` (plik roboczy poza repo). Metoda, która
     rozstrzyga, zmienia typ na `scenariusz` albo `automat` - dalej jak wyżej. Czego żadna z trzech nie rozstrzygnie
     (krok bez zrzutu: nie ma czego wyciąć, a bez `layout` i `zrzut2s` nie ma czego czytać), to `karta dopisz`
     `miejsce` z `zrodlo: niepewne` (krok, akapit, `t: null`, co obejrzeć w filmie); przebiegu to nie blokuje. Zrzutów
     sąsiednich kroków nie używasz jako dowodu.
   - zatrzymanie (`## Zatrzymanie`): klasa z `ujecia[].stop.triage` i tabela triage z kroku 5 w wersji dla przebiegu:
     „nowe ujęcie” to `przebieg <lekcja> --ujecie N` (licznik `dry_passes`, nie `retakes`), kolejka to
     `station-wait --purpose dry-pass` (nie `recording`), `NIEUSTALONY` to
     `stan-wykonania <lekcja> --ujecie N --przebieg <katalog przebiegu>`; zatrzymanie bez `stop.triage` - reguła
     „Zatrzymanie bez klasy” pod tabelą triage z kroku 5. Poprawka w `kurs.yaml` przychodzi wyłącznie
     z klasy `STAN` (deklaracje: `shared_state`, `preparation`), z trzymanym kontem; nowa albo szersza `reset_policy` to
     bramka polityka konta (G3). Klasa `CEL` nigdy nie zmienia `kurs.yaml` (wiersz `CEL`).

   Ta sama uwaga (ten sam krok i typ), która wraca w aktualnym przebiegu po swojej poprawce (krok jest w `## Naniesione
   automatycznie` albo ma wpis `zmiana-tresci` na karcie), to bramka zakres dydaktyczny (G4) - drugi raz jej nie
   poprawiasz.
   **Kolejność w turze:** najpierw naniesienia w D1 „granica samodzielnych zmian” (z commitem) i poprawki `automat` w plikach lekcji, propozycje
   poprawek plików wspólnych i raport, dopiero na końcu karta bramki. Poprawki plików wspólnych i kolejny przebieg -
   po decyzjach Rafała, nie przed nimi.
   **Karta: zakres dydaktyczny (G4).** Pola: uwaga (cytat i to, co na zrzucie), pełna ścieżka zrzutu w bloku kodu,
   naruszona granica (który warunek granicy samodzielnych zmian (D1) nie zachodzi albo „wróciła po poprawce”),
   propozycja automatu. Decyzję Rafała zapisujesz najpierw jako `karta dopisz` `decyzja-g4` (bez tego wpisu
   `/kurs-uwagi` potraktuje znacznik decyzji jak zwykły znacznik przebiegu) i notatkę w `## Naniesione
   automatycznie`. Zmianę samej narracji albo linii `[AKCJA]` wykonujesz znacznikiem z dopiskiem decyzji -
   `[UWAGA: przebieg próbny, krok K (decyzja G4): <rozjazd>. Propozycja: <brzmienie Rafała>]` - i `/kurs-uwagi` w trybie
   automatycznym, z jego brzmieniem dosłownie, bez dostosowania; na kartę idzie też `zmiana-tresci`, do `## Naniesione
   automatycznie` wiersz `scenariusz (decyzja G4)`. Zmiana segmentów idzie przez `/kurs-lekcja`.
   **Karta: bilet produkcyjny (G1), dopłata.** Zużyte i budżet obu liczników, `dry_passes` i `executions`, następna
   akcja i propozycja nowego budżetu z `executions` przeliczonym przez
   `budzet <lekcja> --dry-passes <nowe> --retakes <r>` (`<r>` z biletu) - nie sam `dry_passes`.
   **Karta w turze:** jedna na turę, także gdy bramek jest kilka; decyzje nazwane bramką z nazwą i kodem
   (`zakres dydaktyczny (G4), krok 8`, `bilet produkcyjny (G1)`), nigdy numerami D1, D2 (kod D1 to granica
   samodzielnych zmian), każda z rekomendacją i wariantami jak w `CLAUDE.md`; na końcu jedna linia
   `⏸ Czeka na decyzję: ...`.
   **Kolejny przebieg:** po zmianie treści przebieg całej lekcji, po samych poprawkach `automat` `--ujecie N` każdego
   poprawionego ujęcia (scalanie niżej); uwagi z `## Na karcie lekcji` kolejnego przebiegu nie wymagają. Gdy przebieg
   skończył się uwagami spoza karty (kolejny będzie potrzebny), od razu porównaj w `video/ticket.yaml`
   `spent.dry_passes` z `budget.dry_passes`: równe - karta bilet produkcyjny (G1) w tej samej turze (razem z kartą
   zakres dydaktyczny (G4), jeśli jest), nigdy zakres dydaktyczny (G4) za budżet, i przebiegu nie planujesz przed
   dopłatą. Każdy przebieg to dołączenie do kolejki (`station-wait --purpose dry-pass`) i oddanie konta po nim.
   **Commity pętli** (poprawka `automat`, akceptacja): przed commitem `git diff HEAD -- <ścieżka>` każdej ścieżki
   (pokazuje też to, co ktoś zaindeksował) i porównanie z tym, co pętla sama zmieniła. Ścieżki ze zmianami, których
   pętla nie zrobiła (Rafała albo innej sesji), nie commitujesz; pozostałe idą `git commit -m … -- <ścieżki>`, a tura
   nazywa pominiętą ścieżkę i powód. Bez tymczasowego indeksu. `git add -- <ścieżka>` tylko dla ścieżki jeszcze
   nieśledzonej (`git ls-files --error-unmatch -- <ścieżka>` kończy się błędem, np. pierwszy `video/karta.json`,
   pierwszy `video/przebieg-probny.md`, nowy moduł usługi), tuż przed commitem, który ją wymienia; ścieżki śledzonej
   nigdy nie dodajesz do wspólnego indeksu.
   **Scalanie po `--ujecie N`.** `przebiegi` w raporcie to lista wpisów `"<numer ujęcia>: <katalog względem <dane>>"`.
   Najpierw porównaj `zrodlaHasz` nowego `przebieg.json` z `zrodla-hasz` raportu: różne = treść się zmieniła,
   potrzebny przebieg całej lekcji, nie scalasz. Równe: usuń z raportu uwagi o krokach tego ujęcia (numery kroków
   ujęcia są w `ujecia[].kroki` obu `przebieg.json`) i jego sekcję "Zatrzymanie", dopisz uwagi z nowej analizy,
   ponumeruj wszystkie uwagi od 1 w kolejności kroków, podmień wpis tego ujęcia w `przebiegi`, przelicz
   "Niesprawdzone kroki", "Do usunięcia przed nagraniem" i `wynik`.
   **Koniec pętli.** Pętla kończy się raportem `wynik: czysty` albo "tak" Rafała dla pozostałych uwag - dopiero wtedy ustaw
   `status: zaakceptowany` i zacommituj raport. W lekcji z biletem `wynik: czysty` (definicja wyżej, z sekcją
   `## Na karcie lekcji`) na aktualnym przebiegu - po `npm run plan-nagrania` `zrodlaHasz` każdego ujęcia równe
   `zrodla-hasz` w `video/plan-nagrania.md`, inaczej przebieg całej lekcji w ramach `dry_passes` - to od razu
   `status: zaakceptowany` i `accepted_by: automat <RRRR-MM-DD>`, bez pytania, oraz commit raportu i `video/karta.json`
   (`kurs(<slug>): lekcja <n> przebieg próbny zaakceptowany (automat)`, „Commity pętli”). Raport przyjęty ręcznie
   przez Rafała (lekcja bez biletu albo jego „tak” w bramce zakres dydaktyczny (G4) dla pozostałych uwag) dostaje
   `accepted_by: rafal <RRRR-MM-DD>`; w lekcji z biletem jego commit to
   `kurs(<slug>): lekcja <n> przebieg próbny zaakceptowany (rafal)`, razem z `video/karta.json`. Etap 1 `/kurs-video` (lektor) odmówi bez zaakceptowanego raportu
   zgodnego z bieżącą treścią; `--bez-przebiegu` tylko na jawne słowo Rafała w tej rozmowie, także w lekcji z biletem.
5. **Nagranie (po paczce lektora).** Wymaga zaakceptowanego przebiegu próbnego (krok 4) i paczki lektora z etapu 1 `/kurs-video`; zasoby utworzone przez ostatni przebieg muszą być usunięte. Pod `autonomy: full` z `start_state` nic nie sprzątasz ręcznie przed nagraniem (reset przed ujęciem robi to sam), a `--wznow` takiego ujęcia narzędzie odmawia - nagrywasz je od początku. Najpierw `npm run diagnoza -- <lekcja>`: zero BŁĘDÓW, inaczej nie nagrywasz; każdą UWAGĘ powiedz Rafałowi (np. brak sygnatur przy lekcji bez `wykonaj` jest w porządku).
   **Lekcja z biletem:** tabeli nie przechodzisz z Rafałem - stan konta (otwarte workflow, credentials) sprawdza blok
   `preparation` przed każdym ujęciem (pomijany tylko przy `--wznow`), a B4 „lista trwałych usunięć” nie ma, gdy potwierdzona `reset_policy`
   usługi (bez `pending_confirmation`) obejmuje rodzaje (podgląd idzie do logu). Przed krokami konta usługi z `session_expires: true` w `kurs.yaml` (dziś pinecone)
   uruchom `login <lekcja> --usluga <nazwa> --refresh`; `AUTH` odsyła Rafała do zwykłego `login`. Nagrywaj ujęcie po
   ujęciu **do jednego przebiegu**: `nagraj <lekcja> --ujecie N --run <nazwa>` z tą samą `<nazwa>` dla wszystkich
   ujęć lekcji (`--przygotowane` jest ignorowane z ostrzeżeniem). Przy `--wznow` blok `preparation` nie jest sprawdzany.
   Lekcja z `video/mail.yaml`: po zajęciu konta, przed pierwszym `nagraj`, najpierw `send-mail` (sekcja „Poczta
   lekcji”); cofnięcie dostępu przy `consent: { require: granted }` `nagraj` robi sam przed resetem ujęcia.
   **Lekcja bez biletu (dotychczasowe kroki):** przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu (stan konta, otwarte
   workflow, credentials) - dopiero po jego potwierdzeniu nagrywaj ujęcie po ujęciu **do jednego przebiegu**:
   `nagraj <lekcja> --przygotowane --ujecie N --run <nazwa>` z tą samą `<nazwa>` dla wszystkich ujęć lekcji (bez
   `--przygotowane` narzędzie odmówi).
   **Oba warianty:** Ponowne nagranie ujęcia nie nadpisuje poprzedniego (`ujecie-NN-p2`), a po
   każdym nagraniu narzędzie wypisuje ujęcia, których jeszcze brakuje. Przerwane ujęcie:
   `nagraj <lekcja> --ujecie N --run <nazwa> --wznow <nazwa>` (w lekcji bez biletu dodaj `--przygotowane`) - narzędzie odmówi wznowienia grupy z rozpoczętym wykonaniem
   albo skutkiem ubocznym; wtedy w lekcji bez biletu decyduje Rafał, a w lekcji z biletem nagrywasz ujęcie od nowa
   (triage niżej). Automat powtarza grupę prób w ramach budżetu. Po każdym ukończonym ujęciu `nagraj` uruchamia kontrolę
   ujęcia i wypisuje werdykt `Kontrola ujęcia <i> <nazwa>: <werdykt> (<k> uwag)` (README, „Kontrola ujęcia”); zatrzymane
   ujęcie werdyktu nie ma, tylko linię `Triage: <klasa> - <dalej>` (README, „Klasy zatrzymań”).
   **Lekcja bez biletu (dotychczasowe kroki):** zatrzymanie z komunikatem
   (limit, logowanie, brak elementu, cel spoza listy dozwolonych, wykonanie o nieustalonym stanie) = nie zgaduj
   i nie obchodź - pokaż komunikat Rafałowi. **BRAMKA: pierwsze ujęcie lekcji** - daj Rafałowi ścieżkę surowego
   nagrania i poproś, żeby je obejrzał; jego uwagi zmieniają `nagrywanie.yaml`, potem ujęcie od nowa. Kolejne ujęcia
   tylko po jego "tak". Werdykt kontroli ujęcia i linia `Triage:` są tu tylko informacją dla niego.
   **Lekcja z biletem - bez bramki pierwszego ujęcia** (spec sekcje 6 i 7). Po każdym `nagraj` czytasz werdykt:
   - `przyjete` - następne ujęcie;
   - `powtorka` - gdy uwaga nazywa znaną przyczynę (`pasek` i `styl`: styl nagrania usługi; `okno`: okno, którego krok
     nie deklaruje; `material`: nieczytelny plik ujęcia), popraw ją (pliki wspólne tylko z trzymanym kontem), potem
     polecenie z linii `Dalej:`, czyli `nagraj <lekcja> --ujecie N --run <ten sam>` (zużywa `retakes`), i `karta dopisz`
     `powtorka` z powodem;
   - `przyjete-z-karta` - następne ujęcie; powtórzone uwagi trafiają na kartę same (`buduj` czyta `powtorzone` i
     `doradcze` z `kontrola.json` nagrania wybranego do montażu), więc ich nie dopisujesz.

   Zatrzymania nie pokazujesz Rafałowi - działasz według klasy z linii `Triage:` (README, „Klasy zatrzymań”; spec
   sekcja 7):

   | Klasa | Co robisz | Bramka |
   |---|---|---|
   | `LIMIT_SIEC` | `station-release`, odczekaj kolejny odstęp z `TRIAGE_ODSTEPY_MIN` (2, 10, 30 min, dalej co 30) w tle (`sleep` narzędziem Bash z `run_in_background: true`), wróć przez `station-wait --purpose recording` i nagraj ujęcie od nowa | G1 „bilet produkcyjny”, gdy `retakes` wyczerpane |
   | `NIEUSTALONY` | `stan-wykonania <lekcja> --ujecie N --run <nazwa>` (odczyt z usługi, sprawdza stanowisko jak `przygotowanie`); każde wykonanie ze stanem końcowym - nowe ujęcie (`nagraj --ujecie N --run <ten sam>`, nigdy `--wznow`). Komunikat `revoke_google_access: …` to nie wykonanie - „Cofnięcie dostępu Google” w sekcji „Kurs z `autonomy: full`” | stan `null` albo `trwa` - karta jak G4 „zakres dydaktyczny” z identyfikatorem wykonania (Rafał sprawdza ręcznie) |
   | `AUTH` | nic | G2 „poświadczenia i pierwsza zgoda OAuth”: karta z komunikatem; loguje się Rafał (`login <lekcja> --usluga <nazwa>`) |
   | `BUDZET` | nic | G1 „bilet produkcyjny”: karta jak w kroku 4 (liczniki, następna akcja, propozycja z `budzet <lekcja> --dry-passes <d> --retakes <nowe>`) |
   | `CEL` | popraw konfigurację - `video/nagrywanie.yaml` albo lokatory modułu usługi - albo krok i nagraj od nowa; zatrzymania bezpieczeństwa nie powtarzasz bez zmiany. Listy bezpieczeństwa w `kurs.yaml` (`hosty`, `hostyLogowania`, `identyfikatory`, `widokiBezId`, hosty i zakresy OAuth - `oauth_hosts`, `oauth_scopes` - oraz `wyzwalaczeSieci`) zmienia wyłącznie Rafał | G2 „poświadczenia i pierwsza zgoda OAuth”, gdy to sprawa okna zgody albo gdy poprawka wymaga zmiany listy bezpieczeństwa: karta z komunikatem zatrzymania dosłownie; ten sam `CEL` po poprawce - G4 „zakres dydaktyczny” |
   | `STAN` | popraw deklarację (`shared_state`, `preparation`), gdy różnica to zasób innej lekcji; inaczej jeden ponowny reset (nowe ujęcie). Komunikaty skrzynki Gmail i cofnięcia dostępu - sekcje „Poczta lekcji” i „Kurs z `autonomy: full`” (brak maila w Odebranych to `send-mail`, nie ponowny reset; odpowiedź konta kursu w wątku lekcji z biletem usuwa sam reset, `usun-odpowiedz`, bez stopu; odmowy `send-mail` i kart stanów skrzynki nie obchodzisz wysyłką ani resetem) | polityka konta (G3) tylko dla nowej polityki; stany skrzynki, których automat nie naprawi (sekcja „Poczta lekcji”): karta klasy G4 „zakres dydaktyczny” (odpowiedź albo kopia w wątku lekcji - w lekcji z biletem już tylko wiersz bez identyfikatora wątku, wątek ze szkicem i wątek z odpowiedzią zadeklarowaną w `sent` -, wiadomość, której reset nie usuwa, zdublowany temat, mail lekcji już w skrzynce poza swoim wierszem w Odebranych; także powody `konto kursu nieustalone`, `rozmowa niezgodna z licznikiem (<n> z <count> wiadomości)`, `wersja robocza w rozmowie`, `wiadomość niewidoczna w całości`) albo karta klasy polityka konta (G3) („kosz NIE opróżniony”, także rozmowa zmieniona przed usunięciem odpowiedzi, odpowiedź, która nie zniknęła z rozmowy, i rozmowa, która po usunięciu nie jest samym mailem lekcji; rozmowa zmieniona od planu, niewczytana w 15 s albo nierozwinięta - dopiero, gdy po jednym nowym ujęciu ten sam komunikat (ta sama przyczyna w nawiasie) wraca drugi raz) |
   | `BRAK_ELEMENTU`, `PRZYJECIE` | sonda automatyczna (niżej), potem lokatory (`automat`) i nowe ujęcie; zmiana `scenariusz` (test zakresu z kroku 4) to powrót do kroku 4 (przebieg całej lekcji i akceptacja), potem `/kurs-video` etap 1 (nowy lektor, zużywa `tts_regenerations`) i nagranie od nowa - nigdy nowe ujęcie na zmienionej treści ze starym lektorem | G4 „zakres dydaktyczny”, gdy sonda pokaże, że funkcji nie ma |
   | `INNY` | jedno nowe ujęcie w ramach `retakes`; zatrzymania nie pokazujesz Rafałowi | ten sam komunikat drugi raz - karta G4 „zakres dydaktyczny” z komunikatem dosłownie (automat nie pójdzie dalej bez zmiany tego, co robi) |

   **Zatrzymanie bez klasy** (manifest ujęcia z `triage: null`, bez linii `Triage:`; README „Klasy zatrzymań”): ujęcie
   przerwał błąd, który nie jest jego własnym zatrzymaniem. Komunikat „konto kursu zajęte” (inna lekcja zajęła konto
   między sprawdzeniem a otwarciem profilu; tak samo odmowa z tym komunikatem przed startem ujęcia) to
   `station-wait <lekcja> --purpose recording` w tle (koniec tury bez znacznika bramki), a po kodzie 0 ujęcie od nowa. Każde inne zatrzymanie bez klasy (np. Chrome nie wystartował)
   obsługujesz jak `INNY`: jedno nowe ujęcie w ramach `retakes`, ten sam komunikat drugi raz - karta G4 „zakres
   dydaktyczny” z komunikatem dosłownie. W przebiegu próbnym (krok 4) tak samo, z `--purpose dry-pass` i licznikiem
   `dry_passes` zamiast `retakes`.
   Każda decyzja triage to `karta dopisz` `triage` (ujęcie, klasa, decyzja jednym zdaniem; zatrzymanie bez klasy:
   `klasa` `INNY` albo `bez klasy - konto kursu zajęte`), a każde nowe ujęcie po triage także wpis `powtorka`. Wyczerpany licznik to odmowa `bilet produkcyjny: licznik ... wyczerpany` (klasa
   `BUDZET`) - G1 „bilet produkcyjny”, nigdy G4 „zakres dydaktyczny”.
   **Sonda automatyczna** (lekcja z biletem; klasy `BRAK_ELEMENTU` i `PRZYJECIE` w nagraniu i w przebiegu próbnym; spec
   sekcja 5): napisz skrypt sondy pod pytanie (YAML: README, „Sonda automatyczna”; plik w `<dane>/sondy/`, poza
   gitem, plik wspólny - tylko z trzymanym kontem), uruchom `probe-auto <lekcja> --usluga <nazwa> --script <plik>`
   (tylko odczyt; `--allow-writes` wyłącznie, gdy pytanie wymaga działania `cel: wykonaj`, z `tworzy: [executions]` -
   zużywa `executions`), przeczytaj raport (`<dane>/sondy/probe-auto-<usługa>-<czas>/raport.json` i zrzuty), potem
   popraw lokatory (`automat`) albo napisz zmianę `scenariusz` z testem zakresu (krok 4). Zmiana `scenariusz` w trakcie
   nagrania wraca do kroku 4 (przebieg całej lekcji i akceptacja), potem `/kurs-video` etap 1 (nowy lektor, zużywa
   `tts_regenerations`), potem nagranie od nowa - nigdy nowe ujęcie na zmienionej treści ze starym lektorem. Sonda
   zajmuje konto jak każda komenda profilu. Funkcji, którą pokazuje scenariusz, już nie ma - G4 „zakres dydaktyczny”.
   Konto kursu zajmujesz i oddajesz według sekcji „Lekcje równolegle” (kolejka; bez biletu zwolnienie przed bramką
   pierwszego ujęcia).
6. **EDL.** `edl <lekcja> --run <nazwa>` (wszystkie ujęcia nagrane) - granice klatek muszą zgodzić się z osią lektora (bramka narzędzia). Istniejący `edl.json` z ręcznymi
   decyzjami nadpisuje tylko `--nadpisz` po zgodzie Rafała (lekcja bez biletu). W lekcji z biletem `edl ... --nadpisz`
   bez pytania - stary `edl.json` z `zrodla.json` trafia do `video/montaz/archiwum/edl-<czas>/`. W lekcji z biletem
   po KAŻDYM `edl` (także `--nadpisz`), gdy lekcja ma `video/audio/kontrola/decyzje.json`, od razu
   `npm run kontrola-lektora -- <lekcja> --zastosuj` w `tools/course-pipeline` (czyta zapisane decyzje, bez
   rozpoznawania mowy i bez kosztu): `edl` układa EDL od nowa bez wyciszeń z kontroli lektora, więc bez tego kroku
   wyciszenia znikałyby po cichu. Dalej `/kurs-montaz` (zoomy, ramki, plansze), potem `/kurs-video` etap 2.

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
   `wykonaj` (Enter, inny przycisk, ramka, przekierowanie). Ta sekcja idzie przed kartą G1 „bilet produkcyjny” (krok 1),
   więc dopóki lekcja nie ma biletu, przebieg sygnatur zostaje ręczną sondą wyżej (czynność Rafała klasy G2
   „poświadczenia i pierwsza zgoda OAuth”). Dopiero gdy bilet już jest (po G1 „bilet produkcyjny”, np. sygnatury
   odłożone za bilet albo nowa usługa w lekcji, która bilet ma), przebieg sygnatur robi automat ze skryptu sondy
   zamiast ręki Rafała (spec, załącznik A, wiersz 24): `sonda <lekcja> --usluga <nazwa> --script <plik>`
   (gramatyka `probe-auto`, README „Sonda automatyczna”; skrypt w `<dane>/sondy/`, plik wspólny - tylko z trzymanym
   kontem; `tworzy` obejmuje `executions`, a uruchomienie to działanie `cel: wykonaj`, które zużywa licznik
   `executions`). Odmawia bez biletu (bilet produkcyjny (G1)), bez `reset_policy` obejmującej `tworzy` skryptu
   (polityka konta (G3)) i dla usługi bez sygnatur. Wynik jak przy ręcznej sondzie: wiersze `wyzwalaczeSieci`, z których
   wybierasz żądanie uruchamiające tą samą regułą; żądania przerwane przez sesję (`zablokowane`) nie są kandydatami.
   Krok, który nie przeszedł, albo naruszenie ochrony - kod wyjścia 1 i nic do wklejenia. Wyjątek: sygnaturę wysyłki
   Gmaila zbiera tylko ręczna sonda - Rafał wysyła jeden mail w oknie `sonda <lekcja> --usluga gmail` (poświadczenia i
   pierwsza zgoda OAuth (G2), raz na kurs; krok 1, pozycja (f)), a `sonda --script --usluga gmail` odmawia.
5. **Obsługa usługi:** uzupełnij moduł z kroku 2 wg kontraktu z README: lokatory z wariantami zapasowymi, wzorce
   popupów, limitów i logowania, predykaty stanu, działania specyficzne z deklaracją `cel`, `wyzwalacze` (przyciski
   uruchamiające wykonanie - klikane wyłącznie działaniem `wykonaj`), `stanWykonania`, wykonania z identyfikatorem
   i stanem `nieustalony`. Strona otwierająca nową kartę jest zawsze blokowana - taki krok idzie jako dogrywka. Dla n8n działania przez interfejs jak człowiek: węzeł z wyszukiwarki
   węzłów, "dodaj następny węzeł" z wyjścia, bez przeciągania po współrzędnych.
6. **Próba obsługi** na pustym testowym workflow, z odczytem wyniku (nie samą obecnością): dodanie węzła, połączenie
   (także z istniejącego węzła, z konkretnego wyjścia, rozgałęzienie, połączenia węzłów AI potrzebnych lekcji) potwierdzone
   odczytem krawędzi, ustawienie pola potwierdzone odczytem, wykonanie z odczytem stanu. Krótkie nagranie próby pokaż
   Rafałowi (lekcja bez biletu). Czego nie da się zrobić stabilnie - ten krok lekcji idzie jako dogrywka ręczna.
   **Powiększenie:** w tej samej próbie dobierz raz na usługę `powiekszenie` w `kurs.yaml` (1-1.5; dla n8n zacznij
   od 1.25). Lekcja bez biletu: wyciągnij klatkę z nagrania próby (np. `ffmpeg -ss 5 -i surowe.mp4 -frames:v 1 klatka.png`) i pokaż ją
   Rafałowi: tekst czytelny, nic ważnego nie wypada poza kadr, kursor stoi na klikanym elemencie. Jego decyzja
   zostaje dla wszystkich lekcji z tą usługą.
   **Lekcja z biletem** (spec, załącznik A, wiersz 24): odczyt wyniku w próbie jest samosprawdzeniem - krótkiego
   nagrania próby nie pokazujesz Rafałowi; `powiekszenie` startuje od wartości domyślnej usługi (dla n8n 1.25) bez
   bramki klatki, a Rafał ocenia je w `final.mp4` w G5 „film z kartą lekcji”.
7. **Review** tym, czego zespół używa (review AI pipeline'u albo inny model w sesji), potem zmiany do repo (gałąź i PR
   jak w zespole). Od teraz ta usługa nie wymaga przygotowania.

## Kurs z `autonomy: full`

Kurs z `nagrywanie.autonomy: full` w `kurs.yaml` (konto wyłącznie kursowe; reguły per poziom: `tools/nagrywanie/README.md`,
sekcja "Poziom autonomii kursu"). Reszta procedury bez zmian.

- **Automat robi sam:** reset stanu startowego konta przed ujęciem (`start_state`), okno logowania OAuth dostawcy
  w działaniu z `okno` (zakresy i uprawnienia sprawdza rdzeń wobec listy z `kurs.yaml`) i wpisanie klucza
  z `secrets.yaml` działaniem `type_secret`.
- **Zostaje u Rafała:** jednorazowe zalogowanie kont w profilu kursu (`login`), ręczne wpisanie `secrets.yaml`
  (Claude pliku nie czyta i nie prosi o klucze w rozmowie), hasło i drugi składnik, wszystkie bramki (B3 „hosty i zakresy OAuth”, G1 „bilet produkcyjny”, polityka konta (G3) raz na usługę - w lekcji z biletem, gdy potwierdzona `reset_policy` obejmuje rodzaje deklaracji, podgląd `preview-start-state` idzie tylko do logu, bez bramki (jak czyta w nim Gmail - punkt „Gmail w sesjach tylko do odczytu” niżej);
  w lekcji bez biletu także B4 „lista trwałych usunięć”, zatwierdzenie raportu i pierwsze ujęcie; w lekcji z biletem zamiast dwóch ostatnich
  zakres dydaktyczny (G4), tylko z wyzwalaczy: w przebiegu zmiana poza granicą samodzielnych zmian (D1), znacznik nie
  do naniesienia chirurgicznie i uwaga wracająca po poprawce (krok 4); w nagraniu ten sam `CEL` po poprawce, funkcja,
  której wg sondy już nie ma, ten sam komunikat `INNY` drugi raz i wykonanie, którego stanu `stan-wykonania` nie
  ustalił (krok 5); wyzwalacze triage obowiązują też przy zatrzymaniu przebiegu w kroku 4). W lekcji z biletem
  zostają u niego także: rozstrzygnięcie wątpliwej wysyłki maila, której nie ustalił odczyt Wysłanych, i stany
  skrzynki, których automat nie naprawi (sekcja „Poczta lekcji”); w lekcji bez biletu - cofnięcie dostępu Google przed
  ujęciem z pełnym ekranem zgody.
- **Gmail w sesjach tylko do odczytu** (podgląd `preview-start-state`, `przygotowanie` i `probe-auto` bez
  `--allow-writes`; spec sekcja 10, „Read-only sessions”, decyzja „Odczyt Gmaila w trybie tylko do odczytu”, wariant
  A; README, „Stan startowy skrzynki Gmail”): Gmail czyta skrzynkę przez dokładny wyjątek dwóch swoich żądań
  odczytu, `POST mail.google.com ^/sync/u/\d+/i/fd$` i `^/sync/u/\d+/i/bv$` (linia „Przepuszczone wyjątki trybu tylko
  do odczytu”, zapis `przepuszczoneZapisy`). Zapisy Gmaila (`i/s`), `POST /mail/u/<n>/` i telemetria zostają
  zablokowane i wypisane w `zablokowaneZapisy` - to nie naruszenie i nie powód do karty. W lekcji z biletem podgląd
  wymienia w `Usuwa:` także odpowiedź konta kursu w wątku lekcji (`usun-odpowiedz`, sekcja „Poczta lekcji”), a rozmowę,
  której nie narysował albo nie rozwinął (zablokowane żądanie po „Rozwiń wszystkie”), opisem `… (rozmowa nieczytelna w podglądzie; reset sprawdzi ją przed pierwszym kliknięciem)` -
  też tylko do logu. Okno konta planu 4 (2026-10-24) potwierdziło wariant A: z tym wyjątkiem pięć folderów i rozmowa
  się rysują (Gmail nadal pokazuje „Ups… system napotkał problem (#2014)”, ale listy są), nic nie zostało zapisane,
  bez naruszeń. Wariant B („odczyt w resecie”, zadanie 8 planu 4) nie jest więc potrzebny.
- **Nowy dostawca albo nowe zakresy:** `probe-ui --usluga <nazwa> --okno <dostawca>` (P1a „sonda okna bez zgody”) -> bramka B3 „hosty i zakresy OAuth”
  (Rafał zatwierdza hosty i listę zakresów w `kurs.yaml`) -> `probe-ui ... --okno <dostawca> --zgoda` (P1b „sonda okna ze zgodą”).
  W lekcji z biletem P1a „sonda okna bez zgody” robi automat: `probe-auto <lekcja> --usluga <nazwa> --script <plik> --okno <dostawca>` (skrypt
  z krokiem `otworz_okno`; README, „Sonda automatyczna”), bez Rafała; B3 „hosty i zakresy OAuth” i P1b „sonda okna ze zgodą” zostają u niego (G2 „poświadczenia i pierwsza zgoda OAuth”) przez `probe-ui`,
  tak jak strony logowania.
- **Ekran zgody Google i zgoda zapamiętana:** reset kasuje credential w n8n, ale to NIE odwołuje zgody po stronie
  Google (przebiegi 2026-10-14: po resecie raz nie było ekranu zgody, raz był wariant przyrostowy). Który wariant
  pokaże `google_sign_in`, zależy od tego, co Google pamięta: szczegółowy z polami wyboru (pierwsza zgoda),
  przyrostowy (tylko brakujące uprawnienia) albo brak ekranu. Teksty uprawnień rdzeń czyta z kontrolki „Zobacz
  szczegóły dostępu” i porównuje dokładnie z listą z `kurs.yaml`. Który ekran był, rdzeń zapisuje jako wariant
  `consent` (`granted`, `incremental`, `remembered`; linia „Okno logowania: ekran zgody …” w `przebieg.json` i
  galerii), a lekcja ma na każdy akapit wariantu (krok 3, „Ekran zgody Google”). Pełny ekran zgody w nagraniu wymaga
  cofnięcia dostępu n8n.cloud w koncie Google przed ujęciem (`consent: { require: granted }`, punkt „Cofnięcie dostępu
  Google” niżej). Gdy Google zgodę pamięta i ekranu nie ma - rdzeń przyjmuje to (decyzja Rafała
  2026-10-14, znacznik `zgodaOkna: zapamietana`) tylko wtedy, gdy wszystkie adresy okna ze `scope` przeszły
  sprawdzenie zakresów, okno wróciło na zatwierdzony host i samo się zamknęło, adres powrotu miał `code` bez `error`,
  a naruszeń nie było; w przeciwnym razie stop. Zwykła ścieżka zgody wymaga tego samego (adres powrotu z `code`, bez `error`). Sukces `google_sign_in` to dowód n8n „Account connected”
  po zgodzie (krok 10 M00L02: predykat `credential_account_connected`) - n8n zapisuje rekord credentiala już przy
  kliknięciu, więc sama jego obecność niczego nie dowodzi; bez dowodu stop z nazwami credentiali utworzonych przy kliknięciu.
- **Cofnięcie dostępu Google** (ujęcie lekcji z `consent: { require: granted }`; README „Cofnięcie dostępu (D4, sonda
  P-D)” i „Cofnięcie dostępu Google (`google-grant.json`)”):
  - lekcja z biletem: cofa automat. `przebieg` i `nagraj` w fazie stanu startowego wołają `revoke_google_access` na
    karcie Gmaila ujęcia, przed resetem; `preview-start-state` wymienia cofnięcie wśród trwałych operacji, niczego nie
    klikając. Wymaga dwóch pozycji okna konta, zatwierdzanych i wpisywanych raz (krok 1, pozycja (f)): rodzaju
    `connections` w `reset_policy` gmaila - bez niego ujęcie staje `STAN` przed jakimkolwiek kliknięciem, karta
    polityki konta (G3) - i hosta `myaccount.google.com` w `gmail.hosty` - bez niego strażnik celu blokuje stronę konta
    Google (`CEL`; listy bezpieczeństwa to poświadczenia i pierwsza zgoda OAuth (G2), wiersz `CEL` tabeli triage).
    `AUTH` (Google prosi o hasło) - karta poświadczeń i pierwszej zgody OAuth (G2), loguje się Rafał. `NIEUSTALONY` po
    „Potwierdź” (dostęp mógł zniknąć, nic nie zapisane) to nie wykonanie, `stan-wykonania` go nie ustali: karta klasy
    G2 „poświadczenia i pierwsza zgoda OAuth” - Rafał sprawdza listę połączonych aplikacji konta kursu; gdy
    `n8n.cloud` zniknął, na jego słowo polecenie `google-grant …` z końca komunikatu (z czasem kliknięcia), potem nowe
    ujęcie. `STAN` `revoke_google_access: n8n.cloud odłączony o <czas>, ale zapis google-grant.json się nie udał (…) -
    dopisz go: google-grant …`: cofnięcie się stało, brakuje tylko lokalnego wpisu, który oznacza credentiale jako
    martwe, żeby reset je odtworzył - uruchamiasz dokładnie polecenie z komunikatu (bez pytania), potem ponownie
    dołączasz do kolejki i powtarzasz ujęcie od nowa: w przebiegu próbnym `przebieg <lekcja> --ujecie N`
    (`station-wait --purpose dry-pass`, licznik `dry_passes`), w nagraniu nowe ujęcie (`--purpose recording`, licznik
    `retakes`); nigdy zwykły ponowny reset z wiersza `STAN`;
  - lekcja bez biletu: automat niczego nie cofa. Zostaje karta poświadczeń i pierwszej zgody OAuth (G2), na której
    cofa Rafał, przy trzymanym koncie (sekcja „Lekcje równolegle”, `waiting`);
  - po każdym cofnięciu - automatu, Rafała albo sondy - martwe są wszystkie credentiale Google OAuth n8n na koncie
    kursu (Google cofa naraz każdą zgodę `n8n.cloud`), a następny reset lekcji z biletem odtwarza te z `recreate`
    (`shared_state` kursu; operacja `odswiez-credential`, w podglądzie wiersz `Odtwarza (OAuth):`). Reguła czyta
    `<dane>/google-grant.json`: automat zapisuje swoje cofnięcie sam, cofnięcie ręczne zapisujesz zaraz po odpowiedzi
    Rafała (`google-grant <lekcja> --revoked <czas ISO ze strefą> --by "<kto>"`) - bez wpisu reset uzna martwy
    credential za żywy. Przy cofnięciu ręcznym `--revoked` to czas potwierdzenia Rafała, że dostępu już nie ma (jego
    odpowiedzi), nigdy wcześniejsze szacowanie, kiedy cofał: czas wcześniejszy niż prawdziwe cofnięcie uzna za żywy
    credential zapisany w n8n między tymi dwiema chwilami, a późniejszy kosztuje najwyżej jedno dodatkowe odtworzenie
    credentiala zapisanego po cofnięciu. Martwy credential bez `recreate` zatrzymuje reset (`… dopisz recreate w
    shared_state (polityka konta (G3)) albo utwórz go na ekranie.`) - karta polityki konta (G3);
  - `STAN` `consent.require: granted, a Google pokazał ekran <wariant> - ujęcie bez pełnego ekranu zgody`: jedno nowe
    ujęcie (cofnięcie biegnie znowu przed resetem); ten sam komunikat drugi raz - karta poświadczeń i pierwszej zgody
    OAuth (G2) z komunikatem dosłownie.
- **Dwa konta Google w profilu kursu** (ustalenia sondy P-C o tej nazwie): konto kursu na `/mail/u/0/`
  (`kurs.yaml` `gmail.course_account`), konto nadawcy maili lekcji na `/mail/u/1/` (`gmail.sender_account`). Automat
  dochodzi do nadawcy wyłącznie adresem `/mail/u/1/`, nigdy przez menu konta (w oknie narzędzia menu nie działa, a jego
  link otwiera kartę, którą zamyka ochrona nawigacji). Pierwsze logowanie konta nadawcy, i każde ponowne, to czynność
  Rafała klasy G2 „poświadczenia i pierwsza zgoda OAuth” w zwykłym Chrome na profilu kursu -
  `chrome.exe --user-data-dir=<dane>\profile\n8n`, przy trzymanym koncie i bez otwartego okna narzędzia - nigdy w oknie
  narzędzia (`login` drugiego konta nie doda); pierwsze logowanie zapisuje pozycja `account_setup` z `done`. Kroki
  Rafała, które mu podajesz przy każdej takiej czynności (logowanie nadawcy i ręczna wysyłka w oknie
  `sonda <lekcja> --usluga gmail`): do konta nadawcy wchodzi wpisanym adresem `https://mail.google.com/mail/u/1/`,
  nigdy przez menu konta; zwykłe okno Chrome na profilu kursu zamyka, zanim narzędzie otworzy profil ponownie
  (blokada profilu działa w obie strony: profil otwarty w jednym oknie zablokuje drugie, sonda P-C widziała `EPERM`);
  wiersze `wyzwalaczeSieci`,
  które sonda wypisze, wklejasz do `kurs.yaml` tylko na jego słowo przy tej pozycji (listy bezpieczeństwa zmienia
  wyłącznie Rafał, wiersz `CEL`). `google_sign_in` klika na liście kont Google wyłącznie wpis `course_account`, także
  gdy wpis jest jeden (README „Okno logowania OAuth”): brak tego wpisu na liście, także jedyny wpis z innym adresem -
  `AUTH`, karta poświadczeń i pierwszej zgody OAuth (G2); przy kilku wpisach brak `course_account` w `kurs.yaml` -
  `CEL` z prośbą o adres, karta poświadczeń i pierwszej zgody OAuth (G2) (adres wpisuje Rafał).
- **`start_state` nowej lekcji:** `save-start-state <lekcja> --ujecie N` zapisuje migawkę; przejrzyj ją z tabelą
  `## Przygotowanie przed nagraniem` z planu i dopiero wtedy wklej deklarację do `nagrywanie.yaml`.
- **Stan wspólny, odtwarzanie i polityka resetu** (spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
  sekcja 4; README, „Stan startowy”):
  - **`shared_state`, `delete` i `recreate` działają tylko w lekcji z biletem** (`video/ticket.yaml`). Lekcja bez
    biletu resetuje wyłącznie własny `start_state`, jak przed tą zmianą: credential ze `shared_state`, którego nie
    deklaruje, reset kasuje; `recreate` w jej deklaracji to błąd walidacji, a `delete` niczego nie zmienia (ostrzeżenie).
  - `nagrywanie.shared_state.<usługa>` w `kurs.yaml` to credentiale (`{ name, type, recreate? }`), które zostają na koncie
    przy każdym resecie lekcji z biletem (dołączane do `start_state` każdego ujęcia deklarującego tę usługę; dziś
    `Google - Zielony Ogrod` i `Gmail - Zielony Ogrod`). Deklaracji `start_state` lekcji nie dublujesz o nie (gdy
    dublujesz, wpis bez `secret` i `recreate` i tak dostaje wspólne `recreate`; `save-start-state` pomija je w deklaracji);
    jeśli lekcja ma sama skasować taki credential, wpisuje go w `start_state.<usługa>.delete: [{ name, type }]`.
    Credential OAuth w `start_state` spoza `shared_state`, bez `secret`, daje ostrzeżenie walidacji.
  - `recreate: { action: google_sign_in, node: <Google Sheets | Gmail> }` przy takim credentialu pozwala resetowi
    odtworzyć go przez okno zgody Google, zamiast zatrzymać się na braku. Zgody po stronie Google nie odwołuje (znane zachowanie z przebiegów 2026-10-14, opisane wyżej: reset kasuje credential
    w n8n, ale zgoda w Google zostaje).
  - `reset_policy: { approved, covers }` per usługa (`kurs.yaml`): **polityka konta (G3) raz na usługę, tylko w trybie biletu**. Lekcja
    bez biletu jej nie potrzebuje (waliduje się i resetuje bez polityki) i zostaje przy B4 „lista trwałych usunięć” per lekcja; w lekcji z biletem
    B4 „lista trwałych usunięć” zastępuje potwierdzona polityka obejmująca rodzaje, które reset dotyka (`workflows`, `executions`, `credentials` -
    n8n zawsze wszystkie trzy - `rows`, `indexes`, `mailbox`): wtedy `preview-start-state` idzie do logu. W lekcji z
    biletem brak polityki, polityka z `pending_confirmation: true` (czeka na potwierdzenie Rafała - odmawia jak brakująca;
    Rafał potwierdza, usuwając flagę) albo rodzaj spoza `covers` zatrzymuje walidację komunikatem z bramką polityka konta (G3); wtedy
    karta bramki polityka konta (G3) dla Rafała i zapis daty po jego „tak”.
  - `nagrywanie.account_setup` (czynności ręczne bez `done`) wylistowuje G1 „bilet produkcyjny” (krok 1); datę `done` wpisuje Rafał albo ty
    na jego słowo.
  - `session_expires: true` przy usłudze w `kurs.yaml` (dziś pinecone): przed krokami konta tej usługi
    `login <lekcja> --usluga <nazwa> --refresh` (odświeża sesję bez człowieka; `AUTH` odsyła Rafała do zwykłego `login`).

## Poczta lekcji (lekcja z biletem i `video/mail.yaml`)

Maile, które ujęcie pokazuje w Odebranych konta kursu (`start_state.gmail.inbox`), wysyła z konta nadawcy komenda
`send-mail` (README `tools/nagrywanie`, „Poczta lekcji”; spec sekcja 10); reset skrzynki niczego nie wysyła. Mail
nigdy nie wychodzi dwa razy: narzędzie pilnuje tego w jednym uruchomieniu i między uruchomieniami wszystkich lekcji
kursu. Bez biletu `send-mail` odmawia, a lekcja zostaje przy dotychczasowych krokach (maile i skrzynkę przygotowuje
Rafał według tabeli przygotowania).

- **Kiedy.** Z trzymanym kontem (`station-wait` kod 0), przed pierwszym krokiem konta ujęcia ze
  `start_state.gmail.inbox`: w kroku 4 przed `preview-start-state` i przed każdym `przebieg`, w kroku 5 przed pierwszym
  `nagraj` lekcji - `send-mail <lekcja>` (`--ujecie N`, gdy skrzynkę deklaruje inne ujęcie niż pierwsze). Wysyła tylko
  maile, których brakuje w Odebranych, każdy jednym wykonaniem z licznika `executions`; `OK: wysłane 0` - idziesz
  dalej. Mail, którego wątek lekcji ma odpowiedź konta kursu (np. agent 2.3 odpowiedział w wątku storczyków), w lekcji
  z biletem `send-mail` pomija jako obecny, a odpowiedź usuwa reset ujęcia (`usun-odpowiedz`,
  punkt „Stany skrzynki, których automat nie naprawi”) - ani wysyłki, ani karty. Każdy mail idzie w jednym oknie
  uruchomienia `send_mail`, które przepuszcza do 20 żądań sygnatury wysyłki (`runRequests: 20`, tylko to działanie:
  Gmail wysyła `POST /sync/u/1/i/s` kilka razy na jeden mail), a karta wraca na konto kursu (`/mail/u/0/`) jeszcze w
  tym oknie, także po zatrzymaniu. Żądanie sygnatury poza tym oknem albo ponad 20 strażnik blokuje (do Gmaila nie
  dochodzi) i zatrzymuje `send-mail` kodem `CEL` (punkt „Inne zatrzymania `send-mail`”). Reset, który staje `STAN` `gmail: brak wiadomości „<s>” w Odebranych - wyślij ją: send-mail …` (np. reset
  innej lekcji skasował maile spoza swojej deklaracji), to też `send-mail` przy trzymanym koncie, potem nowe ujęcie;
  gdy `send-mail` odmawia, bo mail jest już w skrzynce kursu - punkt niżej. Bilet bez wolnych `executions` na
  wszystkie brakujące maile: odmowa przed pierwszą wysyłką, karta bilet produkcyjny (G1), dopłata.
- **Mail lekcji już w skrzynce poza swoim wierszem w Odebranych.** Odmowa dotyczy tylko maili, które `send-mail`
  wysłałby: bez własnego wiersza w Odebranych (brak albo wątek z odpowiedzią, którego reset nie przejmuje) i
  nierozstrzygniętych jako wysłane. Taki
  mail `send-mail` odmawia, gdy skrzynka kursu ma jego temat (po zdjęciu przedrostków odpowiedzi i przekazania po obu
  stronach) gdzie indziej: w innym wierszu Odebranych (np. wiersz rozmowy z odpowiedzią), zarchiwizowany w
  Wszystkich, w Wysłanych, w Koszu albo w konflikcie lub zdublowanym temacie planu skrzynki. Mail z własnym wierszem
  w Odebranych jest pomijany, nigdy odmawiany, także gdy skrzynka ma gdzie indziej jego starą kopię (usunie ją reset).
  W lekcji z biletem tak samo pomijany jest mail, którego wątek lekcji (identyfikator wątku jego wiersza w Odebranych)
  ma odpowiedź konta kursu: rozmowę przejmuje reset (`usun-odpowiedz`), więc `send-mail` liczy mail jako obecny. Bez
  biletu taki wątek zostaje odmową, a z biletem odmowę dostaje wątek z odpowiedzią, którego reset nie przejmuje:
  wiersz bez identyfikatora wątku, wątek, który ma też szkic, albo wątek z odpowiedzią zadeklarowaną w `sent`
  (zadeklarowany wiersz Wysłanych w tym wątku). Nowa kopia dołączyłaby w Gmailu do istniejącej rozmowy, reset by jej nie rozdzielił, a „Get Many” n8n przeczytałby
  mail dwa razy. Odmowa przychodzi przed zamiarem wysyłki, jedną linią na mail, i całe uruchomienie nic nie wysyła
  (także pozostałym mailom; nic nie wpisane, nic nie policzone): `send-mail: wiadomość „<s>” jest już w skrzynce
  kursu (folder <f>) poza swoim wierszem w Odebranych - nic nie wysłane; sprawdź wątek (bramka zakresu dydaktycznego
  (G4)).` `<f>` to foldery po przecinku, w kolejności Odebrane, Wszystkie, Wersje robocze, Wysłane, Kosz (np.
  `Wszystkie` - kopia zarchiwizowana, `Kosz`, `Odebrane` - wiersz rozmowy z odpowiedzią), a `nieodczytany`, gdy plan
  skrzynki nie opisał tematu. Także po `STAN` „brak wiadomości … wyślij ją: send-mail” z resetu, gdy jedyna kopia
  maila jest zarchiwizowana albo w Koszu: plan skrzynki mówi „brak”, a `send-mail` odmawia. Tej odmowy nie
  obchodzisz - ani wysyłką (także z `--ids`), ani ponownym resetem, ani usunięciem kopii. `station-release`, potem
  karta klasy G4 „zakres dydaktyczny” dla Rafała z odmową dosłownie (jak ma wyglądać wątek w filmie, rozstrzyga
  treść lekcji - jak przy stanach skrzynki niżej).
- **Odmowy przed przeglądarką**, w kolejności narzędzia: bilet produkcyjny (G1), `sender_policy` z `send` (polityka
  konta (G3)), adresy kont i sygnatury wysyłki (poświadczenia i pierwsza zgoda OAuth (G2)). To pozycje konta kursu z
  karty bilet produkcyjny (G1) (krok 1, pozycja (f)), raz na kurs.
- **`Dalej: ujęcie najwcześniej <data> (mail_age days_ago <d>) - wróć do kolejki tego dnia.`** (gdy coś wysłał, a
  ujęcie ma `mail_age`): kończysz turę BEZ znacznika bramki - to nie decyzja Rafała (spec sekcja 10). Przed końcem tury
  oddajesz konto (`station-release <lekcja>`), wychodzisz z kolejki (`station-leave <lekcja>` - lekcja nie stoi w niej
  do tego dnia) i w tle (narzędzie Bash z `run_in_background: true`) czekasz do tego dnia (czas Warszawy), a wtedy
  dołączasz `station-wait <lekcja> --purpose <dry-pass|recording>` w tle. Rafałowi jedna linia: co wysłane i którego
  dnia lekcja wraca do kolejki. Wcześniej `mail_age` i tak zatrzymałby ujęcie (`Przygotowanie ujęcia ... niespełnione`).
- **`NIEUSTALONY`** (`gmail: wysyłka „<temat>” w nieznanym stanie - sprawdź Wysłane konta nadawcy; send-mail nie
  powtarza jej sam.`): komenda staje i dalszych maili nie próbuje. Ty: `karta dopisz` `konto` (`co`: wysyłka maila
  `<id>` w nieznanym stanie, send-mail) i `station-release`. W tej turze nie powtarzasz `send-mail` (ani bez flag, ani
  z `--rozstrzygnij` z własnej inicjatywy) i nie pytasz Rafała; kończysz turę bez znacznika bramki, a po 2 min (odstęp
  w tle, jak `LIMIT_SIEC`) dołączasz `station-wait <lekcja> --purpose <dry-pass|recording>` w tle. Wysyłkę ustala
  następne zwykłe `send-mail` - to przed następnym krokiem konta tej lekcji, po tym dołączeniu, albo `send-mail` innej
  lekcji z tym mailem: zanim cokolwiek wyśle, czyta Wysłane nadawcy, a wiersz z tematem, którego przed kliknięciem nie
  było, uznaje wysyłkę za wysłaną (mail pominięty, kolejne idą). W oknie konta planu 4 (2026-10-24) tak skończyło się
  7 z 10 prawdziwych wysyłek 2.2 (strona, która wysłała, nie pokazała wiersza w Wysłanych w 30 s; od tego okna
  `send_mail` przeładowuje Wysłane, README „Poczta lekcji”) i każdą ustaliło następne zwykłe
  `send-mail`, bez słowa Rafała i bez powtórnej wysyłki. Gdy dołączenie odda ci konto (kod 0), w następnej turze
  uruchamiasz więc zwykłe `send-mail`, jak mówi ta reguła, i nie pytasz Rafała; karta przychodzi dopiero z odmową
  wątpliwej wysyłki (punkt niżej).
- **Inne zatrzymania `send-mail`.** `STAN` przed „Wyślij” (np. `gmail: wysyłka „<temat>” nie ruszyła (<krok>):
  <przyczyna> - nic nie wysłane.` i pozostałe `STAN` sesji): przyczyna nazwana w plikach lekcji (`video/mail.yaml`, deklaracja
  `start_state.gmail`) - poprawiasz ją, `sprawdz`, potem zwykłe `send-mail` (mail nie wyszedł, więc może wyjść);
  przyczyna poza plikami lekcji - karta klasy G4 „zakres dydaktyczny” z komunikatem dosłownie, jak przy powtórzonym
  `INNY` w tabeli triage (automat nie pójdzie dalej bez zmiany tego, co robi); wyjątek: inne konto na `/mail/u/1/` to
  karta klasy G2 „poświadczenia i pierwsza zgoda OAuth”. `AUTH` na `/mail/u/1/` (konto nadawcy wylogowane) - karta
  poświadczeń i pierwszej zgody OAuth (G2): Rafał loguje nadawcę jak przy pierwszym logowaniu („Dwa konta Google” w
  sekcji „Kurs z `autonomy: full`”). `CEL` - jak wiersz `CEL` tabeli triage; `CEL` z okna wysyłki (żądanie sygnatury
  poza oknem `send_mail` albo ponad jego 20) to zmiana listy bezpieczeństwa: karta klasy G2 „poświadczenia i pierwsza
  zgoda OAuth” z komunikatem dosłownie (sygnaturę i limit zmienia wyłącznie Rafał), a `send-mail` przed jego decyzją
  nie powtarzasz. To nie ścieżka `NIEUSTALONY` (bez odstępu 2 min i bez dołączenia w tle): mail, który mógł wyjść
  (zatrzymanie po „Wyślij”), zostaje wątpliwą wysyłką, a następne `send-mail` po decyzji Rafała ustala ją odczytem
  Wysłanych nadawcy albo trafia na odmowę wątpliwej wysyłki (punkt „Odmowa wątpliwej wysyłki”) - wtedy może przyjść
  druga karta klasy G2 „poświadczenia i pierwsza zgoda OAuth”. Wyjątek: `CEL` przy samym odczycie Wysłanych nadawcy
  (`/mail/u/1/#sent`), którym `send-mail` ustala wątpliwą wysyłkę wcześniejszego uruchomienia - przed pierwszym
  zamiarem wysyłki tego uruchomienia, bez otwartego okna `send_mail` - to nie sprawa sygnatury i nie karta sygnatury
  (poświadczenia i pierwsza zgoda OAuth (G2)): wysyłka zostaje wątpliwa i idzie ścieżką `--rozstrzygnij` (karta
  klasy G2 „poświadczenia i pierwsza zgoda OAuth” z komunikatem `CEL` dosłownie i wariantami `--rozstrzygnij` jak w
  punkcie „Odmowa wątpliwej wysyłki”).
- **Odmowa wątpliwej wysyłki** - `send-mail: wysyłka „<temat>” (<id>) z <zapis> w nieznanym stanie - sprawdź Wysłane
  konta nadawcy i rozstrzygnij: send-mail <lekcja> --rozstrzygnij <id>=wyslane|niewyslane.` (odczyt Wysłanych jej nie
  ustalił albo zapis nie ma notatki stanu Wysłanych sprzed kliknięcia; nic nie wysłane, nic nie policzone): `send-mail`
  nie uruchamiasz ponownie sam. Dopiero teraz, po `station-release`, karta klasy G2 „poświadczenia i pierwsza zgoda
  OAuth” dla Rafała: odmowa dosłownie, Rafał sprawdza Wysłane konta nadawcy (`/mail/u/1/`; w profilu kursu - przy
  trzymanym koncie, „Konto w kartach dla Rafała” niżej); warianty `--rozstrzygnij <id>=wyslane` (mail jest w Wysłanych:
  pominięty i liczony jako obecny) i `--rozstrzygnij <id>=niewyslane` (nie ma go: wyjdzie w tym uruchomieniu, jedna
  próba). Na jego słowo, z trzymanym kontem, `send-mail <lekcja> --rozstrzygnij <id>=<jego słowo>` i `karta dopisz`
  `konto`. Wątpliwa wysyłka blokuje `send-mail` każdej lekcji, która ma ten mail w `video/mail.yaml` (2.2 dołącza maile
  2.1), a rozstrzygnięcie z dowolnej lekcji zdejmuje ją ze wszystkich. Gdy wysyłkę w międzyczasie ustaliło inne
  uruchomienie (np. `send-mail` innej lekcji przeczytał Wysłane nadawcy), `send-mail` z `--rozstrzygnij` odmawia zaraz
  po zajęciu konta: `send-mail: rozstrzygnięcie <id> dotyczy wysyłki, która w międzyczasie przestała być wątpliwa -
  uruchom send-mail jeszcze raz bez --rozstrzygnij.` (słowo Rafała mogłoby przeczyć temu ustaleniu; nic nie wysłane).
  Wtedy, z tym samym trzymanym kontem i bez nowego pytania do Rafała, uruchamiasz `send-mail <lekcja>` jeszcze raz,
  bez `--rozstrzygnij`.
- **Zapis, który blokuje cały kurs:** `send-mail: zapis <ścieżka> nieczytelny (…) - może skrywać wątpliwą wysyłkę; …`
  i `send-mail: zapis <ścieżka> ma wysyłkę w nieznanym stanie bez nazwy maila (zapis sprzed poprawki) - …` odmawiają
  `send-mail` każdej lekcji kursu. Karta klasy G2 „poświadczenia i pierwsza zgoda OAuth” z pełną ścieżką zapisu
  (`<dane>/runs/<lekcja>/send-mail/`, poza gitem): Rafał sprawdza zapis i Wysłane nadawcy; zapis poprawiasz albo
  usuwasz wyłącznie na jego słowo.
- **Stany skrzynki, których automat nie naprawi** (reset skrzynki staje `STAN` przed pierwszym kliknięciem albo przed
  „Usuń na zawsze”; ponowny reset stanąłby tak samo albo skasowałby mail lekcji jeszcze raz). Nie poprawiasz
  deklaracji i nie powtarzasz resetu; karta dla Rafała z komunikatem dosłownie, w klasie bramki, jak karta wykonania
  `NIEUSTALONY`: klasa G4 „zakres dydaktyczny”, gdy reset nic nie usunął, a stan wątku albo skrzynki rozstrzyga treść
  lekcji (jak ma wyglądać w filmie); klasa polityka konta (G3), gdy kosz NIE opróżniony (stan konta, do którego
  reset nie dotarł bezpiecznie - coś mogło już leżeć w Koszu). Na żadną z tych kart nie odpowiadasz wysyłką (ani
  `send-mail`, ani `--ids`) ani drugim resetem; jak traktować wątek, decyduje Rafał w karcie.
  - **Lekcja bez biletu** (bez zmian): `gmail: wątek lekcji „<s>” ma odpowiedź albo kopię w folderze <f> - nic nie
    usunięte …` i `gmail: temat „<s>” x<n> w folderze <f> - nic nie usunięte` - karta klasy G4 „zakres dydaktyczny”;
    `gmail: po usunięciu brak w Odebranych „<s>” - kosz NIE opróżniony, wiadomość lekcji jest jeszcze w Koszu.` -
    karta klasy polityka konta (G3). Odpowiedź w wątku lekcji (np. agenta 2.3 w wątku storczyków) zatrzymuje
    tu każde późniejsze ujęcie lekcji bez biletu, która deklaruje ten mail. Plan skrzynki sprawdza wątek z odpowiedzią
    przed brakiem maila, więc takie ujęcie dostaje komunikat `gmail: wątek lekcji „<s>” ma odpowiedź albo kopię w
    folderze <f> …`, nigdy wcześniej „brak wiadomości … wyślij ją: send-mail”. Wiersz rozmowy w Odebranych jest takim
    konfliktem (folder Odebrane) wtedy, gdy wymienia `sender_account` i jeszcze inny adres (np. konto kursu, które
    odpowiedziało); wiersz z tym tematem bez adresu nadawcy reset dalej planuje usunąć jako „nie od sender_account”, a
    temat jest brakiem. `send-mail` taki mail i tak odmawia (folder Odebrane): kopia dołączyłaby do tej samej rozmowy,
    a następny reset zgłosiłby wątek znowu - jedna kopia więcej na każde ujęcie.
  - **Lekcja z biletem** (spec sekcja 10, „A reply inside a lesson thread”, decyzja „Powtórki lekcji 2.3 a odpowiedź w
    wątku storczyków”, wariant A; README, „Stan startowy skrzynki Gmail”): odpowiedź konta kursu w wątku lekcji usuwa
    sam reset - operacja `usun-odpowiedz` rodzaju `mailbox`, pod zatwierdzoną `reset_policy` gmaila, więc bez nowej
    bramki; w podglądzie pozycja `gmail: Odebrane: „<s>” - odpowiedź konta kursu, wiadomość <i> z <n>` w wierszu
    `Usuwa:`. Plan
    otwiera rozmowę (tylko taką, której nagłówek niesie żądany identyfikator wątku - inaczej rozmowa nieczytelna) i
    klasyfikuje każdą jej wiadomość po nadawcy z nagłówka; reset przed pierwszym kliknięciem i jeszcze raz tuż przed
    „Usuń” w menu „Więcej opcji wiadomości” tej wiadomości czyta i klasyfikuje całą rozmowę od nowa, kasuje pojedynczo
    wyłącznie wiadomości `course_account` (nigdy maila od `sender_account`), a po usunięciu sprawdza, że rozmowa to
    dokładnie zadeklarowane maile lekcji. Odczyt musi dowieść, że widział całą rozmowę: tyle wiadomości, ile liczy
    wiersz lekcji w Odebranych (gdy licznik jest znany), każda z widocznym własnym „Więcej opcji wiadomości” albo
    widoczną treścią (ukryte, choć obecne w stronie, się nie liczą); wersja robocza w rozmowie zatrzymuje reset. Okno
    konta planu 4 (2026-10-24) potwierdziło na prawdziwym Gmailu: „Usuń” z menu odpowiedzi usuwa tylko ją (z jej kopią
    w Wysłanych), mail lekcji zostaje w Odebranych także po „Usuń na zawsze”. Powtórka 2.3 i późniejsze ujęcie 2.1 albo 2.2 nie stają więc na tym wątku, a `send-mail` pomija ten mail
    jako obecny. Kartę dostają już tylko:
    - klasa G4 „zakres dydaktyczny” (nic nie usunięte): `gmail: wątek lekcji „<s>” ma odpowiedź albo kopię w folderze
      <f> - nic nie usunięte …` dla wiersza odpowiedzi bez identyfikatora wątku, dla wątku z odpowiedzią, który ma też
      szkic (`<f>` to wtedy `Wersje robocze`), i dla wątku lekcji, w którym odpowiedź jest zadeklarowana w `sent`
      (zadeklarowany wiersz Wysłanych dzieli z kandydatem identyfikator wątku albo temat bazowy; `<f>` to wtedy
      `Wysłane`) - zadeklarowanej odpowiedzi reset nie usuwa; sam temat bazowy łączy tak też rozmowę inną niż wątek
      lekcji (np. osobną rozmowę odpowiedzi obok zadeklarowanego „Re: …”) - to też ten stop, celowo (fail closed); `gmail: wątek lekcji „<s>” ma wiadomość, której reset
      nie usuwa (<powód>) - nic nie usunięte.` z powodem `konto kursu nieustalone`,
      `rozmowa niezgodna z licznikiem (<n> z <count> wiadomości)`, `wersja robocza w rozmowie`,
      `wiadomość niewidoczna w całości`, `nieczytelny nadawca, wiadomość <i> z <n>`, `nadawca spoza kont kursu, wiadomość <i> z <n>`, `wiadomości od sender_account: <k>, zadeklarowane maile
      lekcji w tej rozmowie: <m>` albo `brak odpowiedzi konta kursu w rozmowie`; zdublowany temat jak bez biletu;
    - klasa polityka konta (G3) (kosz NIE opróżniony): `gmail: rozmowa wątku lekcji „<s>” zmieniła się przed
      usunięciem odpowiedzi (wiadomość <i> z <n>: <co>) - wiadomość nie usunięta, kosz NIE opróżniony.`, `gmail:
      odpowiedź w wątku lekcji „<s>” (wiadomość <i>) nie zniknęła z rozmowy w 8 s - kosz NIE opróżniony.`, `gmail: po
      usunięciu odpowiedzi rozmowa „<s>” nie jest samym mailem lekcji (<k> wiadomości, od sender_account <m>) - kosz
      NIE opróżniony.` (rozmowa lekcji), `gmail: po usunięciu odpowiedzi rozmowa „<s>” nie jest samym mailem lekcji
      (wierszy w folderze Wszystkie: <k>, od sender_account: <m>) - kosz NIE opróżniony.` (osobna rozmowa odpowiedzi)
      i, jak bez biletu, `gmail: po usunięciu brak w Odebranych „<s>” - kosz NIE opróżniony, …`.

    Te same powody jako `<co>` innego stopu idą klasą tego stopu, nie kartą G4 „zakres dydaktyczny”: w „zmieniła się
    przed usunięciem odpowiedzi” - karta klasy polityka konta (G3) (punkt wyżej), w „zmieniła się od planu” - jak
    niżej.

    Trzy stopy tej ścieżki stają przed pierwszym zapisem resetu i nie należą do stanów, których automat nie naprawi:
    `gmail: rozmowa wątku lekcji „<s>” zmieniła się od planu (<co>) - nic nie usunięte.`, `gmail: rozmowa wątku lekcji
    „<s>” nie wczytała się w 15 s - nic nie usunięte.` (rozmowa się nie narysowała) i `gmail: rozmowa wątku lekcji
    „<s>” nie rozwinęła się - nic nie usunięte.` (osobna przyczyna: „Rozwiń wszystkie” po 5 s od kliknięcia nadal
    widać; jako `<co>` - `rozmowa nie rozwinęła się`). To zwykły `STAN` z wiersza triage: jedno nowe ujęcie (nowy plan czyta rozmowę od
    nowa); ten sam komunikat (ta sama przyczyna w nawiasie) drugi raz - karta klasy polityka konta (G3) z komunikatem
    dosłownie, jak przy „kosz NIE opróżniony” (stan konta, do którego reset nie dociera). Jedną rodziną liczą się
    `nie wczytała się w 15 s` i `zmieniła się od planu (rozmowa nie wczytała się w 15 s)`, a osobno `nie rozwinęła się`
    i `zmieniła się od planu (rozmowa nie rozwinęła się)`: dwa komunikaty jednej rodziny to ten sam komunikat drugi
    raz.
- **Konto w kartach dla Rafała.** Przed kartą oddajesz konto (`station-release`), jak przed każdą bramką, która nie
  potrzebuje konta. Gdy Rafał chce coś sprawdzić albo poprawić w profilu kursu (Wysłane nadawcy, skrzynka kursu),
  dzieje się to przy trzymanym koncie: `station-wait <lekcja> --purpose other`, `station-mark <lekcja> --state waiting`
  na czas jego kliknięć, potem `station-mark <lekcja> --state working` (sekcja „Lekcje równolegle”).

## Lekcje równolegle

Kilka sesji dzieli jedno konto kursu (profil, n8n, konto Google, arkusz). Stanowisko, kolejka i komunikaty: README
`tools/nagrywanie`, sekcja „Kolejka do konta kursu”. Kolejność zgłoszeń, bez przeskakiwania.

- **Lekcja wchodzi do kolejki dopiero gotowa.** Wcześniej zamknij każdą bramkę, która nie potrzebuje konta: w lekcji z biletem
  G1 „bilet produkcyjny”, a przed nagraniem (krok 5) także paczkę lektora i avatary; w lekcji bez biletu zgodę na koszt i limit
  wykonań oraz tabelę `## Przygotowanie przed nagraniem` (i paczkę lektora z avatarami przed nagraniem). Do `dry-pass` i `recording` każde ujęcie lekcji musi mieć `start_state`; bez niego `station-wait` z tym
  celem odmawia (najpierw `save-start-state`; w lekcji bez biletu także bramka B4 „lista trwałych usunięć”, w lekcji z biletem bramka polityka konta (G3) raz na usługę, a gdy potwierdzona `reset_policy` obejmuje rodzaje deklaracji - podgląd `preview-start-state` tylko do logu, bez bramki). `preview` i `other` tego wymogu nie mają.
- **Dołączanie.** `station-wait <lekcja> --purpose <preview|dry-pass|recording|other>` uruchom narzędziem Bash z
  `run_in_background: true` (nie `Monitor` - kończy komendę po najwyżej 30 min). Powiedz w jednej linii, na której
  pozycji stoisz i kto trzyma konto (`station-show <lekcja>`), i zakończ turę BEZ znacznika bramki (nie czekasz na
  Rafała). W kolejce nie robisz nic innego. Jeśli Rafał zagadnie sesję o cokolwiek innego, najpierw
  `station-leave <lekcja>` (tracisz miejsce) - to kończy też działające w tle `station-wait` tej lekcji kodem 4, bez
  zajmowania konta - i dołączasz ponownie, gdy lekcja jest gotowa. To samo, gdy sesja musi z innego powodu przestać
  czekać: `station-leave`, żeby lekcja nie została martwa w kolejce. Gdy `station-leave` odpowie, że lekcja „nie
  stała w kolejce”, sprawdź `station-show <lekcja>`: jeśli oczekiwanie zdążyło zająć konto, oddaj je
  (`station-release <lekcja>`).
- **Wynik `station-wait`.** Kod 0 - konto jest twoje, kontynuuj krok z kontem na zgodach, które już masz. Kod 4 -
  lekcja wyszła z kolejki (`station-leave`), konto nie jest twoje; dołączasz ponownie dopiero gotowa. Kod 1 - zacytuj
  Rafałowi komunikat dosłownie i zrób `station-leave <lekcja>`, zanim spróbujesz ponownie.
  Kod 3 - jedyny przypadek, który kolejka zostawia człowiekowi: trzymający konto czeka na Rafała (`station-mark --state
  waiting`) dłużej niż 30 min. Powiedz Rafałowi ze znacznikiem bramki, cytując komunikat dosłownie; na „czekaj” uruchom
  w tle `station-wait` ponownie z `--ack "<lekcja>|<początek rezerwacji>"` (pełna komenda jest na końcu komunikatu), na
  „zwolnij” `station-force-release <lekcja>` - wyłącznie na jego jawne słowo. Po jego odpowiedzi od razu uruchom własne
  `station-wait` ponownie w tle; ponowne dołączenie czyści znacznik zgłoszenia.
- **Kolejka sama się naprawia** (README, „Kolejka do konta kursu”; zdarzenia w `station-show` pod `Ostatnie zdarzenia:`).
  Żywe `station-wait` samo usuwa martwe wpisy kolejki przed sobą i samo zwalnia trzymającego w stanie `working` bez
  aktywności dłużej niż 30 min albo trzymającego domyślnie, którego proces nie żyje (dopiero po 2 min karencji od jego
  ostatniej aktywności, `IMPLICIT_DEAD_GRACE_MS`) - bez pytania Rafała i bez Twojej akcji. Do Rafała trafia wyłącznie trzymający w stanie `waiting` (kod 3 wyżej); `station-reorder` i
  `station-force-release` zostają jego decyzjami.
- **Rezerwacja po zajęciu konta.** Po kodzie 0 odłączony proces `station-pulse` podtrzymuje rezerwację do 2 h bez
  żadnych komend. Praca na koncie dłuższa niż 2 h bez komend: `station-mark <lekcja> --state working` odświeża
  aktywność. Po dłuższej ciszy rezerwacja mogła wygasnąć: uruchom `station-wait` ponownie - zajmie konto od razu, gdy
  jest wolne, i wystartuje puls od nowa. Pulsu nie uruchamiasz ręcznie.
- **Punkty zwolnienia (`station-release <lekcja>`).** Po `preview-start-state` (lekcja bez biletu: B4 „lista trwałych usunięć” zatwierdza Rafał bez trzymanego
  konta; lekcja z biletem: bramka polityka konta (G3) raz na usługę, a gdy potwierdzona `reset_policy` obejmuje rodzaje deklaracji - podgląd `preview-start-state` tylko do logu, bez bramki); po każdym `przebieg` od razu, gdy komenda się skończy - analizę zrzutów i raport robisz bez konta, a kolejny
  przebieg po poprawkach to nowe dołączenie; po nagraniu ujęć, przed bramką pierwszego ujęcia - każde dalsze ujęcie
  (ponowne nagranie albo kolejne) to nowe `station-wait --purpose recording`, a konto przywraca reset `start_state`
  tego ujęcia. B4 „lista trwałych usunięć” (lekcja bez biletu) zatwierdza deklarację `start_state` lekcji; że reset skasuje też to, co zostawiły inne lekcje, jest
  oczekiwane i nie wymaga nowej bramki. W lekcji z biletem bramki pierwszego ujęcia nie ma: konto trzymasz od pierwszego
  do ostatniego ujęcia (także przy powtórkach z werdyktu kontroli i po triage, które nie czeka) i oddajesz je po
  ostatnim ujęciu, przed odstępem `LIMIT_SIEC` i przed każdą bramką, która nie potrzebuje konta.
- **Przygotowanie konta przez Rafała** (np. odebranie dostępu n8n w koncie Google przed ujęciem lekcji bez biletu; w
  lekcji z biletem cofa automat) dzieje się przy
  trzymanym koncie: `station-mark <lekcja> --state waiting`, zakończ turę ze znacznikiem bramki, po jego odpowiedzi
  `station-mark <lekcja> --state working`.
- **`waiting` w lekcji z biletem:** `station-mark <lekcja> --state waiting` tylko przy bramce od G1 „bilet produkcyjny” do G4 „zakres dydaktyczny” zamykanej z
  trzymanym kontem i przy czynności Rafała klasy G2 „poświadczenia i pierwsza zgoda OAuth” na koncie (logowanie, także
  pierwsze logowanie konta nadawcy, okno zgody P1b „sonda okna ze zgodą”, odebranie dostępu, ręczna wysyłka sondy
  sygnatur Gmaila, sprawdzenie Wysłanych nadawcy). Każda
  inna praca przy trzymanym koncie - poprawka automatu, sonda automatyczna, `stan-wykonania`, kolejne ujęcie -
  zostaje w `working`.
- **Pliki wspólne kursu** - `tools/**`, `kursy/<slug>/_nagrywanie/**` (w tym skrypty sond w `<dane>/sondy/`) i
  `kursy/<slug>/kurs.yaml` - zmieniasz tylko trzymając konto. Poprawka „automat” z przebiegu: po ponownym dołączeniu,
  gdy `station-wait` odda ci konto (kod 0), przed kolejnym `przebieg`.
- **Commity:** commity lekcji biorą tylko jej ścieżki. Dwa nazwane wyjątki: commit poprawki `automat` w plikach
  wspólnych (z trzymanym kontem) i commit `kursy/<slug>/wymowa.md` z trybu automatycznego `/kurs-uwagi`. Zawsze
  `git commit -m … -- <ścieżki>`, nigdy `git add -A` (folder jest wspólny). `git add -- <ścieżka>` tylko dla ścieżki
  jeszcze nieśledzonej (`git ls-files --error-unmatch -- <ścieżka>` kończy się błędem), tuż przed commitem, który ją
  wymienia - inaczej commit z pathspec przerywa się na `did not match any file(s) known to git`; ścieżki śledzonej
  nigdy nie dodajesz do wspólnego indeksu.

## Karta lekcji (lekcja z biletem)

Karta to `video/lesson-card.md` na bramkę G5 „film z kartą lekcji” (spec `2026-10-21-nagrywanie-autonomy-gates-design.md`, sekcja 11): co
automat zmienił sam, miejsca do obejrzenia z czasem w `final.mp4`, przebieg produkcji, konto i raporty. Składa ją
`buduj` z `video/karta.json` (w gicie) i z plików, które narzędzia piszą same (`przebieg.json`, `kontrola.json` ujęć,
decyzje kontroli lektora, pomiar znaku AI, ostrzeżenia montażu). Do `video/karta.json` dopisujesz wpis zaraz po
zdarzeniu: `cd tools/course-pipeline`, potem
`npm run karta -- dopisz ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --json '<wpis>'` (README `tools/course-pipeline`,
„Karta lekcji”).

| Zdarzenie | `rodzaj` | Pola wpisu |
|---|---|---|
| zmiana treści z przebiegu próbnego, po commicie `/kurs-uwagi` (wpis na każdą zmianę) | `zmiana-tresci` | `krok`, `akapit`, `przed`, `po`, `pliki`, `commit`, `data` |
| decyzja Rafała w G4 „zakres dydaktyczny” | `decyzja-g4` | `krok`, `opis`, `decyzja`, `data` |
| `niepewne`, którego druga metoda nie rozstrzygnęła (krok 4) | `miejsce` | `krok`, `akapit`, `t: null`, `co`, `zrodlo: "niepewne"` |
| każde ponowne nagranie ujęcia (werdykt `powtorka`, nowe ujęcie po triage) | `powtorka` | `ujecie`, `powod`, `data` |
| każda decyzja triage (krok 5, także zatrzymanie przebiegu w kroku 4) | `triage` | `ujecie`, `klasa`, `decyzja`, `data` |
| czynność ręczna Rafała w G2 „poświadczenia i pierwsza zgoda OAuth” i w bramce polityka konta (G3) (logowanie, okno zgody, zatwierdzona polityka, pozycja `account_setup`, ręczne cofnięcie dostępu Google), wysyłka maila lekcji w nieznanym stanie (`send-mail` `NIEUSTALONY`) i jej rozstrzygnięcie przez Rafała | `konto` | `co`, `data` |

Przykład: `--json '{"rodzaj":"triage","ujecie":"lekcja","klasa":"LIMIT_SIEC","decyzja":"odczekane 2 min, ujęcie od nowa","data":"2026-10-22"}'`.

- Każde pole jest wymagane, a obce pole albo nieznany `rodzaj` to `BŁĄD:` i plik bez zmian. Wpis z adresem e-mail albo
  ciągiem w kształcie klucza (w polach tekstowych także 32 znaki i więcej bez spacji, np. pełna ścieżka) narzędzie
  odrzuca - napisz go bez nich, bo karta idzie do gita.
- `akapit` to `S:A` kroku z `przebieg.json`; `t` w `miejsce` to sekunda w akapicie (`null` - jego początek), czas w
  filmie liczy `buduj` z osi montażu.
- Powtórzone i doradcze uwagi kontroli ujęcia, decyzje kontroli lektora, kadry znaku AI do przejrzenia i ostrzeżenia
  montażu `buduj` czyta sam - tych nie dopisujesz.
- `video/karta.json` z niezacommitowanymi wpisami wchodzi do najbliższego commitu lekcji: commitu trybu
  automatycznego `/kurs-uwagi` albo commitu akceptacji przebiegu (wpis `zmiana-tresci` niesie hash commitu treści,
  więc trafia do następnego). Wpisy z nagrania (`powtorka`, `triage`, `konto`) idą do następnego commitu lekcji,
  najpóźniej razem z `video/lesson-card.md` przy budowie karty na G5 „film z kartą lekcji” (`/kurs-video`, krok 5).
- Przed G5 „film z kartą lekcji” (`/kurs-video`, krok 5): `npm run karta -- buduj ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` zapisuje
  `video/lesson-card.md`.
- Lekcja bez biletu karty nie prowadzi - jej bramki zostają jak dotąd.

## Zasady

- Nic poza przeglądarką. Pod `restricted`: nic poza projektem testowym i listą dozwolonych workflow; pod `full`: nic poza hostami kursu. Zasady wykonań i kosztów poniżej bez zmian.
- Żadnego obchodzenia zabezpieczeń usługi (CAPTCHA, wykrycie automatu, wylogowanie) - zatrzymanie i komunikat.
- Koszty: wykonania workflow z węzłami AI zużywają tokeny przy każdej próbie. **Zgoda Rafała na koszt i limit wykonań
  PRZED pierwszym prawdziwym wykonaniem** - także w sondzie, próbie obsługi usługi, przygotowaniu i resecie, nie
  dopiero przed nagraniem lekcji. Powiedz, ile wykonań przewiduje budżet grup (z resetami) i jakie węzły zużywają
  tokeny; bez zgody tylko kroki bez wykonań. W lekcji z biletem tą zgodą jest bilet (G1 „bilet produkcyjny”): `executions` liczy przebiegi,
  ujęcia i `probe-auto --allow-writes`, a wyczerpany licznik otwiera G1 „bilet produkcyjny”.
- Surowe nagrania, zrzuty przebiegu próbnego i profil przeglądarki nie idą do gita (mogą zawierać dane konta). W raporcie `video/przebieg-probny.md` (idzie do gita) pola `Cytat:` i `Na zrzucie:` nie przepisują danych konta: adresów e-mail, nazw spoza projektu testowego, fragmentów kluczy. To samo dotyczy sekcji `## Naniesione automatycznie` i wpisów `video/karta.json`.
- `kursy/misja-ai-start/_nagrywanie/` to osobny, zamrożony automat Misji - ten skill go nie używa i nie zmienia.
