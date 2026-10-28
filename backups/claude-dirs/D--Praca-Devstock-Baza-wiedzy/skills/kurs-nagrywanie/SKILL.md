---
name: kurs-nagrywanie
description: Automatyczne nagrywanie ekranu lekcji demo Playwrightem (tools/nagrywanie) - automat sam klika w przeglądarce według planu nagrania, zapisuje znaczniki kroków i oddaje gotowy EDL montażowi automatycznemu. Przy pierwszej lekcji z nową usługą (np. n8n) prowadzi przez jednorazowe przygotowanie - warunki bezpieczeństwa konta, logowanie w osobnym profilu, sonda interfejsu i obsługa usługi sprawdzona na koncie zespołu. Używaj, gdy kurs ma `nagrywanie: { automat: true }` w kurs.yaml i lekcja demo ma zatwierdzoną treść i plan nagrania - najpierw przed lektorem (przebieg próbny ze zrzutami ekranu i raport rozjazdów scenariusza z aplikacją), potem po paczce lektora (nagranie); w lekcji z biletem produkcyjnym jedna pętla przed lektorem (przebiegi uczą automat, zaraz po nich finalne nagranie, potem dopasowanie scenariusza do nagrania); woła go /kurs-video zamiast ręcznego nagrania. NIE do pracy poza przeglądarką (terminal, aplikacje desktopowe) - te kroki nagrywa się ręcznie jako dogrywki.
---

# /kurs-nagrywanie - automat nagrywa ekran lekcji demo

Wejście: ścieżka lekcji demo, np. `kursy/<slug>/modul-03-x/lekcja-01-y`. Wynik w dwóch częściach: przed lektorem
zaakceptowany raport przebiegu próbnego `video/przebieg-probny.md` (kroki 0-4), po paczce lektora surowe nagrania
ujęć ze znacznikami kroków i `video/montaz/edl.json` + `zrodla.json` lekcji, gotowe dla `/kurs-montaz` (kroki 5-6).
Lekcja z biletem produkcyjnym (`video/ticket.yaml`) ma inną kolejność (sekcja „Lekcja z biletem: pętla produkcji”): przed
lektorem finalne nagrania ujęć i zaakceptowany raport nagrania `video/recording-report.md` z dopasowanym scenariuszem,
po paczce lektora tylko `edl` (krok 6).
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
   sekcje 3, 4, 12 i 20). **Kolejność:** `budzet` liczy wykonania z `video/nagrywanie.yaml` i waliduje lekcję jak `sprawdz`
   (pod `autonomy: full` także nazwy z `secrets.yaml`), więc działa dopiero, gdy `sprawdz` przechodzi. Lekcja bez
   `video/nagrywanie.yaml` przechodzi więc najpierw kroki 2 i 3 bez pracy na koncie i bez płatnych wywołań: ustalasz
   usługi, piszesz `video/nagrywanie.yaml`, uruchamiasz `sprawdz` i `proba` (oba bez przeglądarki); `przygotowanie`
   (czyta konto) i przebieg czekają na bilet. Gdy oba są czyste, w tej samej turze idzie karta G1. Usługa bez obsługi
   (krok 2 kieruje do sekcji „Pierwsza lekcja z nową usługą”) to praca na koncie z Rafałem - ta sekcja idzie wtedy
   przed kartą G1, jak dotąd. Karta dla Rafała: (a) propozycja budżetu z lekcji: uruchom `budzet <lekcja>` (bez
   przeglądarki i bez stanowiska) i wklej jego wynik: rozbicie `E` po ujęciach i grupach oraz blok `budget`
   (`executions`, `tts_regenerations`, `stt`) z `executions = E × 7 + M` („Limit kosztu zamiast licznika prób” (T1):
   mnożnik to 4 przebiegi próbne + 1 nagranie + 2 nagrania ponowne; `--dry-passes N` i `--retakes N` zmieniają tylko
   te części mnożnika, licznikami biletu nie są; `M` - maile `video/mail.yaml`, których tematy deklaruje
   `start_state.gmail.inbox`: `send-mail` wysyła każdy raz na przygotowanie lekcji; lekcja bez poczty ma `M = 0`),
   `tts_regenerations: 1` (2, gdy lekcja ma już `video/lektor/spis.md`: zmiana treści zużyje jedną regenerację w
   etapie 1), `stt: true` - Rafał zmienia liczby w karcie. Bilet nie ma liczników prób: pętlę produkcji ogranicza
   wyłącznie `budget.executions` i reguła braku postępu (sekcja „Lekcja z biletem: pętla produkcji”); (b) ustawienia kursu z
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
   „Bilet produkcyjny”); brak „OK” = brak pliku. Odmowa próby, na którą nie starczy wykonań, albo próby bez postępu
   otwiera G1 „bilet produkcyjny” ponownie (pętla produkcji, punkt „Karty pętli”); bilet sprzed tej zmiany z
   `budget.dry_passes` albo `budget.retakes` jest ważny - narzędzie ignoruje oba z ostrzeżeniem, a `spent.dry_passes`
   i `spent.retakes` liczy dalej tylko jako statystyki na kartę lekcji;
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
   - domyślnie (lekcja bez biletu i lekcja z biletem, której scenariusz ma już trzy akapity wariantów)
     `warianty.consent: { wartosci: [granted, incremental, remembered], rozstrzyga: <numer kroku z
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
     unieważni credential …`) - wtedy warianty (w lekcji z biletem z jednym akapitem zgody - bez wariantów, punkt
     niżej). Ujęcie z `require: granted` potrzebuje karty Gmaila i `start_state`
     (cofnięcie biegnie przed resetem);
   - lekcja z biletem, której scenariusz ma jeden akapit zgody: wariantów zgody nie potrzebuje i ich nie dopisujesz
     (spec sekcja 20.7, wiersz 10): bez `warianty.consent`, krok z `google_sign_in` narruje ten jeden akapit. Jaki
     ekran pokazał Google, rdzeń zapisuje w znaczniku kroku (`wariantZgody`, `zgodaOkna`), a dopasowanie do nagrania
     (pętla produkcji, etap 7) przeredaguje akapit do ekranu finalnego nagrania w granicy samodzielnych zmian (D1), bez
     kolejnego przebiegu. Dawnej zamiany jednego akapitu na trzy warianty znacznikiem `przebieg próbny` przez
     `/kurs-uwagi` przed pierwszym przebiegiem już nie robisz; warianty, które lekcja ma, zostają i rozstrzyga je
     nagranie jak dotąd. Lekcji nagranej i zaakceptowanej (0.2) nie przerabiasz.
   Lekcja, która wchodzi w tryb biletu i nie ma jeszcze `video/ticket.yaml`, kończy ten krok na czystych `sprawdz`
   i `proba` (bez `przygotowanie`) i wraca do karty G1 „bilet produkcyjny” z kroku 1; krok 4 rusza dopiero z biletem.
4. **Przebieg próbny (przed lektorem).** **Lekcja z biletem** (`video/ticket.yaml`) przechodzi kroki 4 i 5 jedną
   pętlą przed lektorem, w kolejności sekcji „Lekcja z biletem: pętla produkcji” (po kroku 6; spec sekcja 20.3):
   przebiegi próbne uczą automat, zaraz po przebiegu, który przeszedł ujęcie, idzie jego finalne nagranie, a scenariusz
   dopasowujesz do nagrań na końcu. Z tego kroku obowiązują ją tylko akapity, które tamta sekcja przywołuje:
   przygotowanie konta „Lekcja z biletem” niżej, „Kontrola zrzutów”, „Raport” (same wiersze `automat`), „Commity
   pętli” i „Scalanie po `--ujecie N`”; analizy zrzutów pod scenariusz, bramki raportu i akceptacji przebiegu nie ma.
   Lekcja nie potrzebuje jeszcze paczki lektora - ten krok idzie zaraz po
   zatwierdzeniu treści, zanim `/kurs-video` wygeneruje płatne audio. Lekcja, która ma już paczkę lektora (`video/lektor/spis.md`), a nie ma
   nagrania, też przechodzi przebieg przed nagraniem; przyjęta uwaga `scenariusz` oznacza wtedy nowe audio całej lekcji -
   uprzedź Rafała o koszcie (w lekcji z biletem bez uprzedzania: lektor i tak powstaje po dopasowaniu do nagrania, a
   regenerację liczy `tts_regenerations` biletu).
   Najpierw `npm run diagnoza -- <lekcja>`: zero
   BŁĘDÓW, każdą UWAGĘ powiedz Rafałowi.
   **Lekcja z biletem (`video/ticket.yaml`, G1 „bilet produkcyjny”):** bez tabeli przygotowania i bez pytania o zgodę na koszt - zgodą jest
   bilet, a narzędzie liczy `executions` i samo odmawia próby ujęcia, na którą nie starczy wykonań, albo próby bez
   postępu (pętla produkcji, „Karty pętli”). Przygotowanie konta
   sprawdza blok `preparation` przed każdym ujęciem przebiegu (komunikat `Przygotowanie ujęcia ... niespełnione`
   zatrzymuje ujęcie przed nagraniem); to, czego predykat nie obejmuje, jest w `account_setup` (G1 „bilet produkcyjny”). Lekcja ze
   `start_state`, której usługi mają w `kurs.yaml` potwierdzoną `reset_policy` obejmującą rodzaje z deklaracji (polityka konta (G3) raz
   na usługę): bez bramki B4 „lista trwałych usunięć” - `preview-start-state <lekcja> --ujecie N` drukujesz do logu (cztery listy: `Zostaje:`,
   `Usuwa:`, `Tworzy:`, `Odtwarza (OAuth):`; reset obejmuje `start_state` lekcji razem ze `shared_state` kursu) i idziesz
   dalej. Usługa bez polityki, z polityką czekającą na potwierdzenie (`pending_confirmation`) albo rodzaj spoza `covers`
   = błąd walidacji z nazwą bramki polityka konta (G3): wtedy karta tej bramki dla Rafała (co reset usuwa, na jakim koncie) i zapis
   `reset_policy` w `kurs.yaml` po jego „tak” - polityki czekającej nie traktujesz jak zatwierdzonej; Rafał potwierdza ją,
   usuwając `pending_confirmation` (albo poprawiając datę). Potem przebiegi ujęcie po ujęciu w pętli produkcji (etap
   4): `przebieg <lekcja> --ujecie N` (bez `--przygotowane`; podane jest ignorowane z ostrzeżeniem), bez wideo, zrzut
   po każdym kroku. Lekcja z `video/mail.yaml`: pierwsze `send-mail` w krótkim zajęciu konta przed rezerwacją
   `production` (pętla produkcji, „Przed rezerwacją”), a pod rezerwacją przed `preview-start-state` i przed każdym
   `przebieg` jeszcze raz `send-mail` (sekcja „Poczta lekcji”; wysyła tylko brakujące). Lekcja z
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
   Konto kursu współdzielą równoległe lekcje: `preview-start-state` i każdy `przebieg` zajmują je i oddają według sekcji „Lekcje równolegle”
   (lekcja z biletem trzyma je przez całą pętlę produkcji, rezerwacja `production`).
   **Analiza** (lekcja bez biletu; w lekcji z biletem zrzutów przebiegu nie porównujesz ze scenariuszem - te same
   pytania zadaje dopasowanie na klatkach finalnego nagrania, pętla produkcji, etap 7). Dla każdego kroku z `przebieg.json` otwórz zrzut (`Read`) i porównaj go z polami kroku: `narracja`,
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
   `grupa pominięta po wyczerpaniu budżetu` to zawsze uwaga `niepewne` dla Rafała - bez zrzutu nie ma porównania. Przebieg zatrzymany: zrzut `stop.png` i komunikat automatu oceniasz tak samo
   (rozjazd scenariusza czy błąd automatu).
   **Kontrola zrzutów.** Każdy wpis `kontrolaZrzutow` z `przebieg.json` bez `doradcze: true` (`pasek`, `styl`; README
   `tools/nagrywanie`, „Kontrola ekranu”) to uwaga `automat` przy swoim kroku, z `opis` w polu `Na zrzucie:`. Wpis
   `doradcze: true` (pionowy pasek, a do kalibracji na pierwszym przebiegu lekcji z biletem także `komunikat` i
   `przepelnienie`) nie jest uwagą: w `## Podsumowanie` raportu podajesz ich liczbę z rodzajem i krokami (dane do
   kalibracji), a na kartę lekcji trafiają z kontroli ujęcia nagrania. Gdy `przebieg.json` ma `kontrolaZrzutow`, o
   paskach przewijania i przepełnieniu rozstrzyga ona, nie oko (reguła pikselowa sondy P-A nie dała fałszywego
   alarmu). Pasek, który widzisz na zrzucie kroku bez wpisu `kontrolaZrzutow` o pasku, nie znika po cichu: to uwaga
   `niepewne` (decyduje Rafał). Inny defekt obrazu (pusty prostokąt, obce okno) zgłaszasz jak dotąd. W lekcji z
   biletem wpisy `kontrolaZrzutow` bez `doradcze: true` rozstrzygają, czy przebieg przeszedł ujęcie (pętla produkcji,
   etap 4), a zrzutów w poszukiwaniu innych wad nie przeglądasz: obraz nagrania sprawdza kontrola ujęcia i dopasowanie.
   **Raport** `video/przebieg-probny.md` (format: spec przebiegu próbnego, część 2), po każdym przebiegu, w obu trybach
   (w lekcji z biletem tylko wiersze `automat` - dziennik nauki automatu, bez akceptacji):
   - frontmatter: `narzedzie: tools/nagrywanie przebieg`, `data`, `zrodla-hasz` = `zrodlaHasz` z `przebieg.json`,
     `nagrywanie-hasz` = `hasz.model`, `przebiegi` (lista `"<numer ujęcia>: <katalog przebiegu względem <dane>>"`; w
     lekcji z biletem wpis ujęcia to przebieg, który je przeszedł i który przypinasz w `nagraj --przebieg`, a do tego
     czasu najnowszy przebieg ujęcia), `wynik`
     (`czysty` | `rozjazdy` | `zatrzymany`), `status: do_decyzji`, a po akceptacji `status: zaakceptowany` i
     `accepted_by` (`automat <RRRR-MM-DD>` albo `rafal <RRRR-MM-DD>`, niżej „Koniec pętli”); w lekcji z biletem
     `status: do_decyzji` zostaje i `accepted_by` nie ma - etap 1 `/kurs-video` czyta raport nagrania
     `video/recording-report.md`;
   - `## Zatrzymanie` (jeśli było): krok, ujęcie, komunikat automatu dosłownie, zrzut, diagnoza w jednym zdaniu;
   - uwagi `### N. Krok K (akapit S:A) - tytuł` (K to `numer` kroku automatu z `przebieg.json`, nie numer kroku planu -
     po nim `galeria` oznacza kroki) z polami `Typ:` (`scenariusz` | `automat` | `niepewne`; w lekcji z biletem tylko
     `automat`: wpisy `kontrolaZrzutow` bez `doradcze` i przyczyna zatrzymania), `Cytat:`,
     `Na zrzucie:`, `Propozycja:`, `Zrzut:`;
   - `## Niesprawdzone kroki` (z `niesprawdzone`), `## Do usunięcia przed nagraniem` (z `utworzone`),
     `## Podsumowanie` (liczba uwag na typ);
   - lekcja z biletem: `## Naniesione automatycznie` - tabela `| krok | typ | przed | po | commit |`, wiersz na każdą
     poprawkę `automat`, którą automat naniósł i zacommitował (plik oraz stara i nowa wartość). Nową wersję raportu
     (kolejny przebieg, scalanie po `--ujecie N`) piszesz z pliku poprzedniej wersji: sekcję przenosisz w całości,
     także wiersze `scenariusz` i notatki G4 „zakres dydaktyczny” sprzed pętli produkcji. Uwag `scenariusz` i
     `niepewne` ani sekcji `## Na karcie lekcji` raport przebiegu lekcji z biletem już nie dostaje - są w raporcie
     nagrania (pętla produkcji, etap 7).
   `wynik: czysty` tylko wtedy, gdy każde ujęcie lekcji przeszło przebieg na tym samym `zrodla-hasz`, nie ma żadnej uwagi, a
   `niesprawdzone` zawiera wyłącznie kroki z powodem `dogrywka` albo `nieaktywny wariant`. W lekcji z biletem
   `wynik: czysty`, gdy każde ujęcie z krokami automatu ma przebieg, który je przeszedł (pętla produkcji, etap 4);
   `wynik` niczego tam nie odblokowuje.
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
   **Lekcja z biletem - bez bramki raportu i bez analizy pod scenariusz** (spec `2026-10-21-nagrywanie-autonomy-gates-design.md`,
   sekcje 2 i 20.3). Przebiegi, poprawki `automat`, odmowy i karty idą w pętli produkcji (sekcja „Lekcja z biletem:
   pętla produkcji”, etapy 4-5); test zakresu (D1), druga metoda dla `niepewne` i karta zakresu dydaktycznego (G4) -
   w jej dopasowaniu do nagrania (etap 7). Rafał zobaczy wynik na karcie lekcji przy bramce film z kartą lekcji (G5).
   **Commity pętli** (poprawka `automat`, akceptacja; w lekcji z biletem także raport nagrania): przed commitem `git diff HEAD -- <ścieżka>` każdej ścieżki
   (pokazuje też to, co ktoś zaindeksował) i porównanie z tym, co pętla sama zmieniła. Ścieżki ze zmianami, których
   pętla nie zrobiła (Rafała albo innej sesji), nie commitujesz; pozostałe idą `git commit -m … -- <ścieżki>`, a tura
   nazywa pominiętą ścieżkę i powód. Bez tymczasowego indeksu. `git add -- <ścieżka>` tylko dla ścieżki jeszcze
   nieśledzonej (`git ls-files --error-unmatch -- <ścieżka>` kończy się błędem, np. pierwszy `video/karta.json`,
   pierwszy `video/przebieg-probny.md`, pierwszy `video/recording-report.md`, nowy moduł usługi), tuż przed commitem, który ją wymienia; ścieżki śledzonej
   nigdy nie dodajesz do wspólnego indeksu.
   **Scalanie po `--ujecie N`.** `przebiegi` w raporcie to lista wpisów `"<numer ujęcia>: <katalog względem <dane>>"`.
   Najpierw porównaj `zrodlaHasz` nowego `przebieg.json` z `zrodla-hasz` raportu: różne = treść się zmieniła,
   potrzebny przebieg całej lekcji, nie scalasz. W lekcji z biletem różny `zrodlaHasz` przebiegu całej lekcji nie
   wymaga („Poprawne nagranie” (T2); spec sekcja 20.1, przyczyna 2): treść zmienia tam tylko dopasowanie do nagrania
   albo decyzja w bramce zakres dydaktyczny (G4), po której ujęcie dostaje nowe finalne nagranie. Wtedy zaczynasz
   nową wersję raportu przebiegu (nowy `zrodla-hasz`, wpis tego ujęcia w `przebiegi`, sekcja `## Naniesione
   automatycznie` przeniesiona w całości, wpisy pozostałych ujęć bez zmian) i po nagraniu nową wersję
   `video/recording-report.md` (pętla produkcji, etap 7), zamiast przebiegu całej lekcji. Równe: usuń z raportu uwagi o krokach tego ujęcia (numery kroków
   ujęcia są w `ujecia[].kroki` obu `przebieg.json`) i jego sekcję "Zatrzymanie", dopisz uwagi z nowej analizy,
   ponumeruj wszystkie uwagi od 1 w kolejności kroków, podmień wpis tego ujęcia w `przebiegi`, przelicz
   "Niesprawdzone kroki", "Do usunięcia przed nagraniem" i `wynik`.
   **Koniec pętli.** Pętla kończy się raportem `wynik: czysty` albo "tak" Rafała dla pozostałych uwag - dopiero wtedy ustaw
   `status: zaakceptowany` i zacommituj raport. Raport przyjęty ręcznie przez Rafała dostaje
   `accepted_by: rafal <RRRR-MM-DD>`. Etap 1 `/kurs-video` (lektor) odmówi bez zaakceptowanego raportu
   zgodnego z bieżącą treścią; `--bez-przebiegu` tylko na jawne słowo Rafała w tej rozmowie. W lekcji z biletem raport
   przebiegu nie jest akceptowany: pętlę kończą finalne nagrania i zaakceptowany raport nagrania
   `video/recording-report.md` (pętla produkcji, etapy 6-7), który czyta etap 1 `/kurs-video`; `--bez-przebiegu` także
   tam tylko na jawne słowo Rafała w tej rozmowie (ujęcie bez przebiegów, pierwsza próba to nagranie).
5. **Nagranie (po paczce lektora).** **Lekcja z biletem** nagrywa w pętli produkcji (etap 5), zaraz po przebiegu,
   który przeszedł ujęcie, przed lektorem i bez akceptacji przebiegu próbnego (sekcja „Lekcja z biletem: pętla
   produkcji”); z tego kroku obowiązuje ją tylko akapit „Oba warianty”. Lekcja bez biletu: wymaga zaakceptowanego przebiegu próbnego (krok 4) i paczki lektora z etapu 1 `/kurs-video`; zasoby utworzone przez ostatni przebieg muszą być usunięte. Pod `autonomy: full` z `start_state` nic nie sprzątasz ręcznie przed nagraniem (reset przed ujęciem robi to sam), a `--wznow` takiego ujęcia narzędzie odmawia - nagrywasz je od początku. Najpierw `npm run diagnoza -- <lekcja>`: zero BŁĘDÓW, inaczej nie nagrywasz; każdą UWAGĘ powiedz Rafałowi (np. brak sygnatur przy lekcji bez `wykonaj` jest w porządku).
   **Lekcja bez biletu (dotychczasowe kroki):** przejdź z Rafałem tabelę `## Przygotowanie przed nagraniem` z konspektu (stan konta, otwarte
   workflow, credentials) - dopiero po jego potwierdzeniu nagrywaj ujęcie po ujęciu **do jednego przebiegu**:
   `nagraj <lekcja> --przygotowane --ujecie N --run <nazwa>` z tą samą `<nazwa>` dla wszystkich ujęć lekcji (bez
   `--przygotowane` narzędzie odmówi).
   **Oba warianty:** Ponowne nagranie ujęcia nie nadpisuje poprzedniego (`ujecie-NN-p2`), a po
   każdym nagraniu narzędzie wypisuje ujęcia, których jeszcze brakuje. Przerwane ujęcie:
   `nagraj <lekcja> --ujecie N --run <nazwa> --wznow <nazwa>` (w lekcji bez biletu dodaj `--przygotowane`) - narzędzie odmówi wznowienia grupy z rozpoczętym wykonaniem
   albo skutkiem ubocznym; wtedy w lekcji bez biletu decyduje Rafał, a w lekcji z biletem nagrywasz ujęcie od nowa
   (tabela triage w pętli produkcji). Automat powtarza grupę prób w ramach budżetu. Po każdym ukończonym ujęciu `nagraj` uruchamia kontrolę
   ujęcia i wypisuje werdykt `Kontrola ujęcia <i> <nazwa>: <werdykt> (<k> uwag)` (README, „Kontrola ujęcia”); zatrzymane
   ujęcie werdyktu nie ma, tylko linię `Triage: <klasa> - <dalej>` (README, „Klasy zatrzymań”).
   **Lekcja bez biletu (dotychczasowe kroki):** zatrzymanie z komunikatem
   (limit, logowanie, brak elementu, cel spoza listy dozwolonych, wykonanie o nieustalonym stanie) = nie zgaduj
   i nie obchodź - pokaż komunikat Rafałowi. **BRAMKA: pierwsze ujęcie lekcji** - daj Rafałowi ścieżkę surowego
   nagrania i poproś, żeby je obejrzał; jego uwagi zmieniają `nagrywanie.yaml`, potem ujęcie od nowa. Kolejne ujęcia
   tylko po jego "tak". Werdykt kontroli ujęcia i linia `Triage:` są tu tylko informacją dla niego.
   Konto kursu zajmujesz i oddajesz według sekcji „Lekcje równolegle” (kolejka; bez biletu zwolnienie przed bramką
   pierwszego ujęcia).
6. **EDL.** `edl <lekcja> --run <nazwa>` (wszystkie ujęcia nagrane) - granice klatek muszą zgodzić się z osią lektora (bramka narzędzia). Istniejący `edl.json` z ręcznymi
   decyzjami nadpisuje tylko `--nadpisz` po zgodzie Rafała (lekcja bez biletu). W lekcji z biletem `edl ... --nadpisz`
   bez pytania - stary `edl.json` z `zrodla.json` trafia do `video/montaz/archiwum/edl-<czas>/`. W lekcji z biletem
   po KAŻDYM `edl` (także `--nadpisz`), gdy lekcja ma `video/audio/kontrola/decyzje.json`, od razu
   `npm run kontrola-lektora -- <lekcja> --zastosuj` w `tools/course-pipeline` (czyta zapisane decyzje, bez
   rozpoznawania mowy i bez kosztu): `edl` układa EDL od nowa bez wyciszeń z kontroli lektora, więc bez tego kroku
   wyciszenia znikałyby po cichu. Dalej `/kurs-montaz` (zoomy, ramki, plansze), potem `/kurs-video` etap 2.
   W lekcji z biletem `edl` biegnie w etapie 8 pętli produkcji, po etapie 1 `/kurs-video` na dopasowanym scenariuszu,
   z runu finalnych nagrań. Nagranie wiąże ze scenariuszem szkielet planu, nie jego tekst (spec sekcja 20.4): `edl`
   przyjmuje nagranie po dopasowaniu narracji, a po zmianie tekstu do wpisania, kroków albo działań odmawia
   (`… nagranie powstało dla innego szkieletu planu (segmenty, kroki, akapity, tekst do wpisania) albo innego
   nagrywanie.yaml - nagraj ujęcie ponownie`) - to nowe finalne nagranie tego ujęcia (pętla produkcji, etap 3),
   po słowie Rafała w bramce zakres dydaktyczny (G4), gdy zmiana przyszła z treści.

Kurs z `oprawa: { znak_ai: true }` w `kurs.yaml`: znaczniki kroków niosą dodatkowo prostokąty elementów akcji
(początek i koniec akcji, prostokąt przed i po), a `edl` zapisuje `video/montaz/obszary-nagrania.json` - strażnik rogu
znaku AI nie zasłoni miejsca, w którym coś się dzieje. Nic do zrobienia ręcznie; kurs bez klucza - znaczniki jak dotąd.

## Lekcja z biletem: pętla produkcji

Lekcja z `video/ticket.yaml` (bilet produkcyjny (G1)) idzie od kroku 4 kolejnością specu
`docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`, sekcja 20 („Rola przebiegów próbnych” (T3),
„Poprawne nagranie” (T2), „Trzymanie konta kursu” (T4), „Limit kosztu zamiast licznika prób” (T1)): przebiegi próbne
uczą automat poruszać się po stronie (lokatory, elementy, oczekiwania, reset) i nie sprawdzają narracji; zaraz po
przebiegu, który przeszedł ujęcie, idzie finalne nagranie tego ujęcia; scenariusz dopasowujesz do nagrań raz, po
ostatnim ujęciu, a lektor powstaje dopiero na dopasowanym scenariuszu. Lekcja bez biletu zostaje przy krokach 4-6 bez
zmian (przebieg z raportem i bramką, lektor, nagranie). Lekcja z biletem, która była w produkcji przed tą zmianą
(2.2), przechodzi na pętlę od następnej próby dopiero na słowo Rafała w jej sesji - pytasz raz (spec sekcja 20.9).

| Etap | Co robisz | Konto |
|---|---|---|
| 1 | bilet produkcyjny (G1): krok 1 (budżet `executions`, ustawienia kursu, czynności ręczne) | bez konta |
| 2 | przygotowanie bez konta: kroki 2 i 3 (`video/nagrywanie.yaml`, `preparation`, `start_state`, `sprawdz`, `proba`), plansze, `npm run diagnoza -- <lekcja>`; poczta lekcji i czynności na koncie - krótkie zajęcia (punkt „Przed rezerwacją”) | bez konta |
| 3 | `station-wait <lekcja> --purpose production` w tle (sekcja „Lekcje równolegle”); od kodu 0 lekcja trzyma konto | zajęte |
| 4 | ujęcie po ujęciu, w kolejności ujęć: przebiegi próbne `przebieg <lekcja> --ujecie N`, aż jeden przejdzie ujęcie; między nimi wyłącznie poprawki `automat` (punkt „Przebiegi próbne”) | trzymane |
| 5 | od razu po przebiegu, który przeszedł ujęcie N: `nagraj <lekcja> --ujecie N --run <nazwa> --przebieg <katalog tego przebiegu>` i werdykt kontroli (punkt „Nagranie i kontrola”); poprawne - finalne nagranie ujęcia N, następne ujęcie od etapu 4; niepoprawne - poprawka `automat` i kolejna próba ujęcia N, zawsze nagranie | trzymane |
| 6 | po finalnym nagraniu ostatniego ujęcia: sprawdzenie haszy (punkt „Koniec nagrań”), `station-release <lekcja>` | oddane |
| 7 | dopasowanie scenariusza do nagrań i raport `video/recording-report.md` (punkt „Dopasowanie do nagrania”) | bez konta |
| 8 | `/kurs-video` etap 1 (lektor, kontrola lektora) na dopasowanym scenariuszu, avatary, `edl` z finalnych nagrań (krok 6), `/kurs-montaz`, etap 2, film z kartą lekcji (G5) | bez konta |

- Ujęcie z samymi dogrywkami (bez kroków automatu) pomija etapy 4 i 5.
- Po pierwszym przebiegu, który przeszedł ujęcie, każda dalsza próba tego ujęcia jest nagraniem, nigdy kolejnym
  przebiegiem (nagranie kosztuje tyle co przebieg, a pętlę kończy tylko poprawne nagranie).
- `--bez-przebiegu` tylko na jawne słowo Rafała w tej rozmowie: ujęcie bez etapu 4, pierwsza próba to nagranie
  (`nagraj` bez `--przebieg`).
- **Próba** (spec sekcja 20.5): jedno ujęcie uruchomione jedną komendą - przebieg (`przebieg`, cały albo `--ujecie N`),
  nagranie (`nagraj`) albo próba resetu (`przebieg --tylko-reset`). Każda zostawia manifest ujęcia `znaczniki.json` ze
  `startedAt`; komenda odrzucona przed jego zapisem (walidacja, stanowisko, bilet) próbą nie jest, ponowne
  `kontrola-ujecia` też nie (wynik próby to jej najnowszy `kontrola.json`).
- **Limit pętli** („Limit kosztu zamiast licznika prób” (T1)): wyłącznie `budget.executions` i reguła braku postępu.
  Przed każdą próbą `przebieg` i `nagraj` sprawdzają, czy zostało tyle wykonań, ile potrzebuje próba ujęcia (`E`
  ujęcia z `budzet`), i czy dwie ostatnie próby ujęcia nie są nieudane z tym samym podpisem; obie odmowy przychodzą
  przed otwarciem profilu, bez kosztu (punkt „Karty pętli”). Przebiegi próbne i nagrania ponowne bilet liczy tylko
  jako statystyki (`spent.dry_passes`, `spent.retakes`), które niczego nie odmawiają.

### Przed rezerwacją (etapy 1-2)

- Przed `station-wait --purpose production` kończysz całą pracę bez konta (kroki 1-3, plansze). Paczki lektora i
  avatarów lekcja z biletem przed nagraniem nie potrzebuje - powstają w etapie 8.
- Praca na koncie przed rezerwacją idzie w krótkich zajęciach, oddawanych zaraz po niej (`station-release`):
  `send-mail` lekcji z `video/mail.yaml` (`station-wait <lekcja> --purpose other`, sekcja „Poczta lekcji”), czynności
  Rafała na koncie z karty bilet produkcyjny (G1) (pozycje (c) i (f)) i `save-start-state` nowej lekcji (`other`
  albo `preview`).
  Czekanie na `mail_age` (`Dalej: ujęcie najwcześniej <data> …`) jest bez konta; tego dnia dołączasz
  `--purpose production`.

### Przebiegi próbne (etap 4)

- **Przed pierwszym przebiegiem ujęcia** konto przygotowuje automat jak w kroku 4 („Lekcja z biletem”): blok
  `preparation`, `preview-start-state <lekcja> --ujecie N` do logu (karta polityka konta (G3) tylko przy błędzie
  walidacji), `send-mail`, cofnięcie dostępu Google przy `consent: { require: granted }`; przed krokami konta usługi z
  `session_expires: true` w `kurs.yaml` (dziś pinecone) `login <lekcja> --usluga <nazwa> --refresh` (`AUTH` odsyła
  Rafała do zwykłego `login`).
- **Przebieg** `przebieg <lekcja> --ujecie N` (bez `--przygotowane`). Czy **przeszedł ujęcie**, rozstrzygają wyłącznie
  maszynowe kontrole `przebieg`: w `przebieg.json` ujęcie ma `status: gotowe` (każdy krok przyjęty), a
  `kontrolaZrzutow` nie ma żadnego wpisu tego ujęcia bez `doradcze: true`. Zrzutów nie porównujesz ze scenariuszem i
  nie dajesz ich do analizy subagentowi; otwierasz je tylko do diagnozy przyczyny `automat` (`stop.png`, krok z wpisem
  `kontrolaZrzutow`). Rozjazdu scenariusza nie szukasz i nie poprawiasz; ten, który zauważysz przy diagnozie, sprawdzi
  dopasowanie na klatkach nagrania (etap 7).
- **Poprawki między przebiegami** - wyłącznie przyczyny `automat`: `video/nagrywanie.yaml` lekcji (lokatory,
  oczekiwania, warunki przyjęcia, sesje czatu, kliknięcia), moduły usług i ich kod resetu
  (`_nagrywanie/uslugi/<usługa>.js`, `tools/nagrywanie/uslugi/`) oraz deklaracje klasy `STAN` w `kurs.yaml`
  (`shared_state`, `preparation`; nowa albo szersza `reset_policy` to polityka konta (G3), a listy bezpieczeństwa
  zmienia wyłącznie Rafał - wiersz `CEL`). Pliki wspólne poprawiasz od razu: lekcja trzyma konto, więc reguła plików
  wspólnych z sekcji „Lekcje równolegle” jest spełniona. Scenariusza, artykułu, konspektu i tekstu do wpisania nie
  zmieniasz. Potem `sprawdz`, `proba`, commit samych plików poprawki (`kurs(<slug>): lekcja <n> poprawka automatu z
  przebiegu próbnego (automat)`, `<n>` = `<moduł>.<numer>` z `lekcja.yaml`; „Commity pętli” w kroku 4), wiersz w
  `## Naniesione automatycznie` raportu przebiegu i kolejny `przebieg <lekcja> --ujecie N`.
- **Sonda automatyczna** po pierwszym zatrzymaniu `BRAK_ELEMENTU` albo `PRZYJECIE` ujęcia (punkt „Triage zatrzymań”),
  nie dopiero po drugim; drugie zatrzymanie z tym samym podpisem to karta braku postępu, nie kolejna sonda.
- **Próba resetu** („Próba resetu” (T5)): `przebieg <lekcja> --tylko-reset [--ujecie N]` - reset stanu startowego
  ujęcia (`start_state` i `shared_state`, `recreate`, skrzynka), predykaty `preparation` i odczyt kontrolny, bez kroków
  i bez wideo, zwykle bez wykonań. Uruchamiasz ją tylko po zmianie kodu resetu (kod resetu modułu usługi, `start_state`
  lekcji, `shared_state` kursu), przed następnym przebiegiem - nigdy jako rutynową próbę: to też próba dla reguły
  braku postępu, a udana próba resetu między dwoma takimi samymi niepowodzeniami rozbija ich parę i ukrywa brak
  postępu. Przebiegiem referencyjnym nagrania nie jest (`nagraj --przebieg` jej odmawia); zatrzymana - tabela triage.
- **Raport** `video/przebieg-probny.md` po każdym przebiegu, w formacie z kroku 4, tylko z wierszami `automat`
  (`## Zatrzymanie`, uwagi z `kontrolaZrzutow`, `## Naniesione automatycznie`), bez akceptacji.
- **Zatrzymanie przebiegu**: ujęcie ze `status: zatrzymane` - klasa z jego `stop.triage` (linia `Triage:`) i tabela
  triage niżej; ujęcie zatrzymane bez `stop.triage` (rejestrator zapisał `triage: null`, np. „konto kursu zajęte”) -
  reguła „Zatrzymanie bez klasy” pod tabelą triage. **Odmowa próby** to przebieg ze `status: zatrzymane`, w którym
  żadne ujęcie nie ma `status: zatrzymane`: odmówione ujęcie i dalsze mają `pominiete`, a `przebieg.json` `powod`
  niesie odmowę (`bilet produkcyjny (G1): …`; komenda wypisała ją też po podsumowaniu). Wtedy otwierasz kartę bilet
  produkcyjny (G1) według treści - `brak postępu w ujęciu` albo `potrzeba … wykonań, zostało …` (punkt „Karty
  pętli”). Odmowa pierwszego ujęcia komendy przychodzi jako błąd komendy, zanim cokolwiek powstanie - karta tak samo.

### Nagranie i kontrola (etap 5)

- **Nagranie** zaraz po przebiegu, który przeszedł ujęcie N, z tym samym trzymanym kontem:
  `nagraj <lekcja> --ujecie N --run <nazwa> --przebieg <katalog>` (`<katalog>`: nazwa katalogu tego przebiegu w
  `<dane>/przebiegi/<lekcja>/` albo ścieżka w katalogu danych; `--przygotowane` jest ignorowane z ostrzeżeniem). Ta
  sama `<nazwa>` runu dla wszystkich ujęć lekcji i to samo `--przebieg` przy każdej próbie ujęcia N. `--przebieg`
  przypina przebieg referencyjny w manifeście ujęcia (`referencePass`): kontrola ujęcia porównuje z nim, a późniejsze
  `kontrola-ujecia` tego ujęcia czyta przypięty przebieg, nigdy najnowszy. Przebiegu, który ujęcia nie przeszedł
  (status inny niż `gotowe`, wpis `kontrolaZrzutow` bez `doradcze`, próba resetu), `nagraj` odmawia
  (`nagraj --przebieg: przebieg … nie przeszedł ujęcia … - nagranie zaczyna się od przebiegu, który przeszedł całe
  ujęcie.`) - wtedy wracasz do etapu 4.
- **Poprawne nagranie** („Poprawne nagranie” (T2), w pojęciach kontroli, fail-closed): werdykt `przyjete` i kontrola
  kompletna (`kontrola.json` bez `kompletna: false`: klatka odczytana dla każdego przyjętego kroku, dźwięk
  sprawdzony). Każda uwaga w `uwagi` (kontrole 2-4: reguła poziomego paska przewijania, uwagi układu, obce `okno`,
  `audio`) dyskwalifikuje nagranie; rodzaje tylko na kartę (`pasek-pionowy`, `dymek`, doradcze `komunikat` i
  `przepelnienie`) zostają tylko na karcie. Werdyktu `przyjete-z-karta` w lekcji z biletem nie ma: powtórzona uwaga
  to `powtorka`, a o powtórzeniu rozstrzyga reguła braku postępu. Rozjazd narracji z ekranem nie unieważnia nagrania -
  poprawi go dopasowanie (etap 7).
- **Kontrola niekompletna**: `powtorka` z `kompletna: false` i bez uwag (notatki `klatka nieodczytana`,
  `audio: nie udało się sprawdzić` albo `przebieg referencyjny nie wczytany`). `nagraj` wypisuje wtedy
  `Dalej: npm run nagrywanie -- kontrola-ujecia <lekcja> --run "<run>" --ujecie N` - wykonujesz ją raz (bez
  przeglądarki, bez nowej próby). Kompletna z `przyjete` - nagranie finalne; nadal niekompletna - to `powtorka` jak
  niżej. Kontrola, która się nie powiodła (uwaga `rodzaj: kontrola`, też z `kompletna: false`), to `powtorka` z uwagą.
- **`powtorka` z uwagą**: przyczyna `automat` (`pasek` i `styl`: styl nagrania usługi; `okno`: okno, którego krok nie
  deklaruje; `material`: nieczytelny plik ujęcia; `kontrola`: przyczyna z opisu uwagi; kontrola nadal niekompletna:
  przyczyna z notatki), poprawka jak w etapie 4 (pliki wspólne od razu), `sprawdz`, `proba`, commit poprawki, potem
  kolejna próba ujęcia N - nagranie `nagraj <lekcja> --ujecie N --run <ta sama> --przebieg <ten sam>` (tak wypisuje je
  linia `Dalej:` po kontroli) - i `karta dopisz` `powtorka` z powodem. Dwie próby z rzędu z tą samą uwagą
  `(krok K, rodzaj)` - narzędzie odmówi następnej (karta braku postępu, wariant [B]).
- **Zatrzymane nagranie** - tabela triage niżej; kolejna próba ujęcia to znów nagranie.
- Po finalnym nagraniu ujęcia N - następne ujęcie od etapu 4, z tym samym trzymanym kontem.

### Koniec nagrań (etap 6)

- Przed `station-release`, przy trzymanym koncie: `proba` (bez przeglądarki) i porównanie `hasz.skeleton` i
  `hasz.model` manifestu syntetycznego `proba` (`<dane>/proba/<lekcja>/…/ujecie-NN/znaczniki.json`) z manifestem
  finalnego nagrania każdego ujęcia (wpis ujęcia w `wybrane.json` runu). Poprawka `automat` po finalnym nagraniu
  wcześniejszego ujęcia, która zmieniła `hasz.model` (`haszModelu` w `tools/nagrywanie/src/schemat.js` obejmuje kroki
  z działaniami, grupy, ujęcia ze `start_state` i warianty; poza nim są blok `lokatory`, adresy kart, opisy
  `przyjecie`, `limit_s` i budżety grup), unieważnia tamto nagranie - `edl` by go odmówił. Takie ujęcie nagrywasz
  jeszcze raz przy tym samym koncie (etap 5 z jego przypiętym `--przebieg`). Dlatego poprawki ujęć po pierwszym
  finalnym nagraniu kładziesz najpierw poza haszem (blok `lokatory`, `przyjecie`, `limit_s`, moduł usługi).
  Wyjątek: nagrania przyjętego słowem Rafała (wariant [B] karty braku postępu) sam ponownie nie nagrywasz. Gdy
  późniejsza poprawka mimo to zmieniła `hasz.model`, karta bilet produkcyjny (G1) z wyborem: cofnąć tę poprawkę albo
  nagrać to ujęcie jeszcze raz.
- Potem `station-release <lekcja>` - koniec rezerwacji `production`.

### Karty pętli

- **Konto przy karcie.** Rezerwacji `production` przed kartą nie oddajesz („Trzymanie konta kursu” (T4)): przed kartą
  `station-mark <lekcja> --state waiting`, po odpowiedzi Rafała `station-mark <lekcja> --state working`. Po karcie,
  która czekała dłużej niż 2 h (puls kończy się po `PULSE_IDLE_MS` bez komend), najpierw
  `station-wait <lekcja> --purpose production` w tle - zajmie trzymaną rezerwację od nowa i wystartuje puls. Inne
  lekcje czekają za tobą do 12 h bez kodu 3 (sekcja „Lekcje równolegle”).
- **Kolejność w turze:** najpierw to, co automat robi sam (poprawki `automat` albo naniesienia dopasowania, z
  commitem, i raport), na końcu karta. Jedna karta na
  turę, także gdy bramek jest kilka; decyzje nazwane bramką z nazwą i kodem (`bilet produkcyjny (G1), brak postępu w
  ujęciu <ujęcie>`, `zakres dydaktyczny (G4), krok 8`), nigdy numerami D1, D2 (kod D1 to granica samodzielnych zmian),
  każda z rekomendacją i wariantami jak w `CLAUDE.md`; na końcu jedna linia `⏸ Czeka na decyzję: ...`.
- **Bilet produkcyjny (G1), brak postępu.** Odmowa `przebieg` albo `nagraj` przed otwarciem profilu:
  `bilet produkcyjny (G1): brak postępu w ujęciu <ujęcie> - <podpis>: <manifest 1>, <manifest 2>. Karta dla Rafała; po
  jego słowie ticket.yaml stall_ack: { take: "<ujęcie>", attempt: "<manifest 2>", approved: <data> }.` Dwie ostatnie
  próby ujęcia (dowolnego rodzaju) są nieudane z tym samym podpisem: to samo miejsce (`reset` albo `krok K`), klasa i
  znormalizowany komunikat dwóch zatrzymań albo co najmniej jedna wspólna para `(krok K, rodzaj)` dwóch niepowodzeń
  kontroli (do trzech zatrzymań `LIMIT_SIEC` z rzędu reguła pomija, czwarte z rzędu to brak postępu). Drugiego takiego
  samego niepowodzenia nie zamieniasz w kartę sam: robisz poprawkę, jeśli ją masz, i uruchamiasz kolejną próbę - kartę
  otwiera odmowa, bo niesie wpis `stall_ack` do przepisania. Wyjątek: przy dwóch nagraniach z tą samą uwagą kontroli
  ujęcia poprawki, która zmienia `hasz.model` (działanie kroku, grupa, ujęcie, wariant - punkt „Koniec nagrań”), przed
  odpowiedzią Rafała nie nanosisz, tylko ją opisujesz: naniesiona unieważniłaby nagranie, które wariant [B] może
  przyjąć. Karta: obie próby (rodzaj, katalog, wynik), podpis z
  odmowy dosłownie, poprawka, którą proponuje automat (plik i zmiana, naniesiona albo do naniesienia; bez poprawki -
  napisz to wprost), statystyki ujęcia i `spent.executions`/`budget.executions`. Warianty:
  - [A] jeszcze jedna próba z tą poprawką - po słowie Rafała dopisujesz wpis z odmowy do listy `stall_ack` w
    `video/ticket.yaml` (`approved: <dziś>`), nanosisz wstrzymaną poprawkę i robisz kolejną próbę; wpis wpuszcza
    dokładnie jedną kolejną próbę (gdy powstanie nowsza, przestaje pasować);
  - [B] tylko gdy obie próby to nagrania z tą samą uwagą kontroli ujęcia (klatki): przyjmij to nagranie z uwagą na
    karcie lekcji - nagranie zostaje finalne (najnowsze w `wybrane.json`), `karta dopisz` `miejsce`
    (`zrodlo: "kontrola-ujecia"`, `co`: uwaga i „przyjęte słowem Rafała”), raport nagrania dostaje
    `accepted_by: rafal`; dalej następne ujęcie. Wstrzymanej poprawki nie nanosisz: przyjęte nagranie zostaje ważne, a
    „Koniec nagrań” nie nagrywa go ponownie wbrew słowu Rafała;
  - [C] zatrzymaj lekcję: `station-release <lekcja>` (koniec rezerwacji `production`), lekcja stoi do jego słowa.

  Po każdym wariancie `karta dopisz` `triage` (`klasa`: `brak postępu (G1)`, `decyzja`: podpis krótko i wariant
  Rafała, bez ścieżek manifestów - narzędzie odrzuca ciąg 32 znaków i więcej bez spacji). Gdzie sekcje „Poczta
  lekcji” albo „Kurs z `autonomy: full`” dają przy tym samym komunikacie drugi raz kartę innej bramki (poświadczenia i
  pierwsza zgoda OAuth (G2), polityka konta (G3)), w lekcji z biletem kartą jest ta karta braku postępu: w poprawce
  wariantu [A] nazywasz tamtą bramkę i czynność Rafała (np. sprawdzenie połączonych aplikacji konta Google).
- **Bilet produkcyjny (G1), dopłata.** Odmowa `bilet produkcyjny (G1): na próbę ujęcia <ujęcie> potrzeba <E> wykonań,
  zostało <n> (<spent>/<budget>) - dopłata budżetu wykonań w video/ticket.yaml.` (także zatrzymanie `BUDZET`,
  `bilet produkcyjny: licznik executions wyczerpany …`, np. przy `send-mail` albo `probe-auto --allow-writes`).
  Karta: odmowa dosłownie, `spent.executions`/`budget.executions`, `E` ujęcia z `budzet <lekcja>`, statystyki prób
  ujęcia, następna akcja i propozycja nowego `budget.executions` = `spent.executions` + `E` ujęcia × `n`, gdzie `n`
  to liczba prób ujęcia, które Rafał finansuje (dopłata = `E` × `n` − zostało); budżet liczony od „zostało” spadłby
  poniżej `spent` i następne sprawdzenie odmówiłoby znowu (2.2: 56 + 7 × 2 = 70, nie 3 + 7 × 2 = 17). `budzet <lekcja>
  --dry-passes <d> --retakes <r>` drukuje liczbę dla całej lekcji, `E` lekcji × (d + 1 + r) + M - to tylko liczba do
  porównania, nie ta propozycja. Po „OK” zmieniasz `budget.executions` w `video/ticket.yaml` (z notatką w `notes`);
  liczników prób do budżetu nie dopisujesz.
- **Oba teksty w jednej odmowie.** Gdy odmowa niesie oba teksty (najpierw `brak postępu w ujęciu …`, w następnej
  linii `na próbę ujęcia … potrzeba …`), jedna karta niesie obie decyzje: warianty [A]/[B]/[C] braku postępu i dopłatę.
- **Poświadczenia i pierwsza zgoda OAuth (G2), polityka konta (G3) i zakres dydaktyczny (G4) w pętli** - według
  wiersza tabeli triage albo sekcji, która je daje, zawsze z trzymanym kontem.
  Zakres dydaktyczny (G4) przychodzi w pętli tylko z sondy (funkcji już nie ma), z `NIEUSTALONY`, którego
  `stan-wykonania` nie ustalił, ze stanów skrzynki, których automat nie naprawi, i z odmów `send-mail` klasy zakres
  dydaktyczny (G4) (sekcja „Poczta lekcji”). Reguły „ta sama uwaga wraca po
  poprawce” ani „ten sam komunikat drugi raz → zakres dydaktyczny (G4)” w lekcji z biletem nie ma („Bez zakresu
  dydaktycznego za powrót po poprawce” (T7)): powtórzenie rozstrzyga reguła braku postępu.

### Triage zatrzymań

Zatrzymania próby (przebiegu i nagrania) nie pokazujesz Rafałowi - działasz według klasy z linii
`Triage: <klasa> - <dalej>` (README, „Klasy zatrzymań”; spec sekcje 7 i 20.7). „Kolejna próba” to przed przebiegiem,
który przeszedł ujęcie, `przebieg <lekcja> --ujecie N`, a po nim `nagraj <lekcja> --ujecie N --run <nazwa> --przebieg
<katalog>`. Konto trzymasz przy każdym wierszu, także w odstępach.

| Klasa | Co robisz | Bramka |
|---|---|---|
| `LIMIT_SIEC` (limit, błąd sieci, awaria usługi: HTTP 502, 503, 504, „Workspace offline”; „Awaria usługi” (T6)) | bez `station-release`: odczekaj kolejny odstęp z `TRIAGE_ODSTEPY_MIN` (2, 10, 30 min) w tle (`sleep` narzędziem Bash z `run_in_background: true`) i powtórz tę samą próbę od nowa (przebieg albo nagranie, jak była); do trzech takich zatrzymań z rzędu reguła braku postępu nie liczy | bilet produkcyjny (G1): odmowa braku postępu po czwartym z rzędu; dopłata, gdy nie starczy wykonań |
| `NIEUSTALONY` | `stan-wykonania <lekcja> --ujecie N --run <nazwa>` (nagranie) albo `--przebieg <katalog przebiegu>` (przebieg; odczyt z usługi, sprawdza stanowisko jak `przygotowanie`); każde wykonanie ze stanem końcowym - kolejna próba, nigdy `--wznow`. Komunikat `revoke_google_access: …` to nie wykonanie - „Cofnięcie dostępu Google” w sekcji „Kurs z `autonomy: full`” | stan `null` albo `trwa` - karta jak G4 „zakres dydaktyczny” z identyfikatorem wykonania (Rafał sprawdza ręcznie) |
| `AUTH` | nic | G2 „poświadczenia i pierwsza zgoda OAuth”: karta z komunikatem; loguje się Rafał (`login <lekcja> --usluga <nazwa>`) przy trzymanym koncie |
| `BUDZET` | nic | G1 „bilet produkcyjny”, dopłata (punkt „Karty pętli”) |
| `CEL` | popraw konfigurację - `video/nagrywanie.yaml` albo lokatory modułu usługi - albo krok i powtórz próbę; zatrzymania bezpieczeństwa nie powtarzasz bez zmiany. Listy bezpieczeństwa w `kurs.yaml` (`hosty`, `hostyLogowania`, `identyfikatory`, `widokiBezId`, hosty i zakresy OAuth - `oauth_hosts`, `oauth_scopes` - oraz `wyzwalaczeSieci`) zmienia wyłącznie Rafał | G2 „poświadczenia i pierwsza zgoda OAuth”, gdy to sprawa okna zgody albo gdy poprawka wymaga zmiany listy bezpieczeństwa: karta z komunikatem zatrzymania dosłownie; ten sam `CEL` drugi raz - brak postępu, bilet produkcyjny (G1) |
| `STAN` | popraw deklarację (`shared_state`, `preparation`), gdy różnica to zasób innej lekcji; inaczej jeden ponowny reset (kolejna próba). Komunikaty skrzynki Gmail i cofnięcia dostępu - sekcje „Poczta lekcji” i „Kurs z `autonomy: full`” (brak maila w Odebranych to `send-mail`, nie ponowny reset; odpowiedź konta kursu w wątku lekcji z biletem usuwa sam reset, `usun-odpowiedz`, bez stopu; odmowy `send-mail` i kart stanów skrzynki nie obchodzisz wysyłką ani resetem) | polityka konta (G3) tylko dla nowej polityki; stany skrzynki, których automat nie naprawi (sekcja „Poczta lekcji”): karta klasy G4 „zakres dydaktyczny” (odpowiedź albo kopia w wątku lekcji - w lekcji z biletem już tylko wiersz bez identyfikatora wątku, wątek ze szkicem i wątek z odpowiedzią zadeklarowaną w `sent` -, wiadomość, której reset nie usuwa, zdublowany temat, mail lekcji już w skrzynce poza swoim wierszem w Odebranych; także powody `konto kursu nieustalone`, `rozmowa niezgodna z licznikiem (<n> z <count> wiadomości)`, `wersja robocza w rozmowie`, `wiadomość niewidoczna w całości`) albo karta klasy polityka konta (G3) („kosz NIE opróżniony”, także rozmowa zmieniona przed usunięciem odpowiedzi, odpowiedź, która nie zniknęła z rozmowy, i rozmowa, która po usunięciu nie jest samym mailem lekcji); rozmowa zmieniona od planu, niewczytana w 15 s albo nierozwinięta i każda inna ta sama przyczyna drugi raz - brak postępu, bilet produkcyjny (G1), z bramką klasy w karcie (punkt „Karty pętli”) |
| `BRAK_ELEMENTU`, `PRZYJECIE` | sonda automatyczna po pierwszym takim zatrzymaniu ujęcia (niżej), potem poprawka `automat` (lokatory, oczekiwania, warunek przyjęcia) i kolejna próba; scenariusza w pętli nie zmieniasz - rozjazd nazwy albo układu poprawi dopasowanie (etap 7) | G4 „zakres dydaktyczny”, gdy sonda pokaże, że funkcji nie ma; ta sama przyczyna drugi raz - brak postępu, bilet produkcyjny (G1), nie druga sonda |
| `INNY` | kolejna próba ujęcia | ten sam komunikat drugi raz - brak postępu, bilet produkcyjny (G1), karta z komunikatem dosłownie |

**Zatrzymanie bez klasy** (manifest ujęcia z `triage: null`, bez linii `Triage:`; README „Klasy zatrzymań”): próbę
przerwał błąd, który nie jest jej własnym zatrzymaniem. Komunikat „konto kursu zajęte” (pod rezerwacją `production`
znaczy, że rezerwacja wygasła albo ktoś ją zwolnił siłą; tak samo odmowa z tym komunikatem przed startem próby) to
`station-wait <lekcja> --purpose production` w tle (koniec tury bez znacznika bramki), a po kodzie 0 ta sama próba od
nowa. Każde inne zatrzymanie bez klasy (np. Chrome nie wystartował) obsługujesz jak `INNY`.
Każda nieudana próba to `karta dopisz` `triage` (ujęcie; `klasa` - klasa zatrzymania, `kontrola zrzutów` albo
`kontrola ujęcia` przy niepowodzeniu kontroli, przy zatrzymaniu bez klasy `INNY` albo `bez klasy - konto kursu
zajęte`; `decyzja` jednym zdaniem: miejsce - `reset` albo `krok K` -, przyczyna i co zrobiłeś), a każda kolejna próba
nagrania także wpis `powtorka`. Odmowa przed próbą (dopłata, brak postępu) i zatrzymanie `BUDZET` to G1 „bilet
produkcyjny”, nigdy G4 „zakres dydaktyczny”.

**Sonda automatyczna** (klasy `BRAK_ELEMENTU` i `PRZYJECIE`, w przebiegu i w nagraniu; spec sekcje 5 i 20.7): po
pierwszym takim zatrzymaniu ujęcia napisz skrypt sondy pod pytanie (YAML: README, „Sonda automatyczna”; plik w
`<dane>/sondy/`, poza gitem, plik wspólny), uruchom `probe-auto <lekcja> --usluga <nazwa> --script <plik>` (tylko
odczyt; `--allow-writes` wyłącznie, gdy pytanie wymaga działania `cel: wykonaj`, z `tworzy: [executions]` - zużywa
`executions`), przeczytaj raport (`<dane>/sondy/probe-auto-<usługa>-<czas>/raport.json` i zrzuty), potem popraw
lokatory, oczekiwania albo warunek przyjęcia (`automat`) i kolejna próba. Zmiany `scenariusz` po sondzie nie piszesz:
rozjazd nazwy albo układu zobaczy dopasowanie na klatkach finalnego nagrania. Sonda zajmuje konto jak każda komenda
profilu - pod rezerwacją `production` już je trzymasz. Funkcji, którą pokazuje scenariusz, już nie ma - G4 „zakres
dydaktyczny”.

### Dopasowanie do nagrania (etap 7)

Bez konta, raz, po `station-release` z etapu 6. „Poprawne nagranie” (T2): rozjazd narracji z ekranem nie unieważnia
nagrania - to scenariusz dopasowujesz do nagrania, w granicy samodzielnych zmian (D1), a nagranie zostaje.

- **Materiał.** Finalne nagranie każdego ujęcia (wpis ujęcia w `wybrane.json` runu): klatki `kontrola/krok-NN.png` z
  kontroli ujęcia i manifest `znaczniki.json` (kroki z `numer`, `proba`, `start`, `end`, `status`; przy kroku z
  `google_sign_in` `wariantZgody` i `zgodaOkna`; w kursie z `oprawa: { znak_ai: true }` także `elementy` z
  prostokątami `przed` i `po`). Manifest nagrania nie ma pól treści: `akapit` i `przyjecie` kroku bierzesz z
  `video/nagrywanie.yaml`, `narracja` (tekst akapitu) i `opis` (kroki planu, czyli `[AKCJA]`) z bieżącego
  `video/plan-nagrania.md`; przypięty przebieg referencyjny (`referencePass`, jego `przebieg.json`) ma je zebrane przy
  każdym kroku, razem z `elementy`, ale z treści z chwili przebiegu. Każdą klatkę porównujesz z polami kroku
  (`narracja`, `opis`, `przyjecie`, `elementy`) pytaniami „Analizy” z kroku 4 i z jej regułą ekranu
  przejściowego; ujęcie z więcej niż 15 klatkami analizuje subagent (jeden na ujęcie), a każdy zgłoszony rozjazd
  otwierasz sam na klatce. Typy uwag: `scenariusz` (opis rozjeżdża się z ekranem), `automat` (wada obrazu, którą
  przebieg nazwałby `automat`: pasek akcji po najechaniu, obrys zaznaczenia) i `niepewne`.
- **Dwie „akcje”** (spec sekcja 20.4). Opis tego, co dzieje się na ekranie - linie `[AKCJA: …]` w `scenariusz.md`,
  kroki konspektu i kolumna „Ekran (krok)” w `plan-nagrania.md` - dopasowanie może przeredagować w granicy
  samodzielnych zmian (D1), razem z narracją i artykułem. Działań wykonywalnych - `nagrywanie.yaml: kroki[].dzialania`
  i wszystkiego, co obejmuje `haszModelu` (kroki, grupy, ujęcia, warianty) - dopasowanie nigdy nie rusza; wyjątek: opisy
  `przyjecie`, poza haszem, mogą pójść za nowym brzmieniem. Zmiana, która zmieniłaby `hasz.skeleton` (segmenty, kroki,
  akapity i ich kolejność, tekst do wpisania - kolumna „Do wpisania” i bloki pod tabelą) albo `hasz.model`, nie jest
  dopasowaniem: to bramka zakres dydaktyczny (G4), a po słowie Rafała nowe finalne nagranie tego ujęcia (etap 3).
- **`scenariusz`:** napisz nowe brzmienie (to, co jest na klatce, w stylu narracji lekcji; nazwy w cudzysłowie tylko
  wtedy, gdy zatwierdzona narracja lekcji tak je zapisuje) i zrób **test zakresu**: granica samodzielnych zmian (D1,
  spec sekcja 2.2). Zmiana mieści się w granicy samodzielnych zmian (D1) tylko wtedy, gdy zachodzą wszystkie cztery
  warunki (cytat ze specu; „D1” w cytacie to ta granica):
  > A `scenariusz` change is within D1 when all of these hold:
  > - the segment count, order and screen types do not change (the `/kurs-uwagi` invariant);
  > - the `[AKCJA]` still acts in the same service on the same kind of resource (a renamed button, a moved field, a
  >   tooltip instead of a hint are within; a different node, tool or service is outside);
  > - the narration keeps its claim (the beat still shows what it showed; a claim of absence that is false becomes a
  >   rewording, not a removed beat);
  > - no lesson step is removed and no new step is added beyond a one-click transition (open, close, scroll).

  Warunki dotyczą zmiany w całości: narracja, która po zmianie nazwałaby inny węzeł, narzędzie albo usługę niż przed
  nią, jest poza granicą samodzielnych zmian (D1) także wtedy, gdy linia `[AKCJA]` już zgadza się z ekranem (zmienia
  się to, czego beat uczy); zmieniona etykieta tego samego elementu mieści się w tej granicy (D1). W granicy (D1) i bez
  zmiany szkieletu: pod akapitem tego zdania znacznik `[UWAGA: nagranie, krok K: <rozjazd>. Propozycja: <brzmienie>]`
  (K - `numer` kroku automatu z manifestu nagrania, ten sam co w `nagrywanie.yaml`; `<rozjazd>` cytuje stare zdanie, `<brzmienie>` to całe nowe zdanie
  albo nowa linia `[AKCJA: ...]`). Poza granicą (D1) - karta bramki zakres dydaktyczny (G4), bez żadnej edycji.
- **Ekran zgody Google.** Lekcja z biletem bez wariantów `consent`: akapit zgody przeredagowujesz do ekranu, który
  pokazało finalne nagranie (klatka kroku z `google_sign_in`, jego `wariantZgody` i `zgodaOkna`), znacznikiem jak wyżej
  (D1; spec sekcja 20.7, wiersz 10), bez kolejnego przebiegu. Warianty, które lekcja już ma, zostają - rozstrzyga je
  nagranie jak dotąd.
- **`automat`** (wada obrazu): nagranie zostaje (zmiana działań ujęcia zmieniłaby `hasz.model` i je unieważniła) -
  `karta dopisz` `miejsce` (`zrodlo: "kontrola-ujecia"`, krok, akapit, `t: null`, co obejrzeć w filmie) i wiersz w
  `## Na karcie lekcji` raportu nagrania; trafia na kartę do „Miejsc do obejrzenia”.
- **`niepewne`:** druga metoda na materiale nagrania, na tym samym kroku i w tej kolejności: (a) druga klatka z
  `surowe.mp4` sekundę wcześniej (`ffmpeg -ss <kroki[].end − 1> -i surowe.mp4 -frames:v 1 <plik roboczy>.png`), (b)
  wycinek prostokąta elementu z klatki, powiększony 2x - prostokąt `elementy[].przed` albo `po` kroku z manifestu
  nagrania (`{ x, y, width, height }`, tylko w kursie ze znakiem AI), a bez nich `elementy[].prostokat` tego kroku w
  przypiętym przebiegu referencyjnym (`[x, y, szer, wys]`)
  (`ffmpeg -i <klatka> -vf "crop=w:h:x:y,scale=iw*2:ih*2" <plik roboczy>.png`; pliki robocze poza repo). Metoda,
  która rozstrzyga, zmienia typ na `scenariusz` albo `automat` - dalej jak wyżej; czego żadna nie rozstrzygnie, to
  `karta dopisz` `miejsce` z `zrodlo: niepewne` (krok, akapit, `t: null`, co obejrzeć w filmie). Klatek sąsiednich
  kroków nie używasz jako dowodu.
- **Naniesienie, raz.** Wszystkie znaczniki naraz, potem `/kurs-uwagi` w trybie automatycznym (jego sekcja „Auto
  mode”) jeden raz: naniesie zmiany, przeniesie je do artykułu i konspektu, przegeneruje plan nagrania, zacommituje
  ścieżki lekcji jako `kurs(<slug>): lekcja <n> dopasowanie do nagrania (automat)` i dopisze na kartę po jednym wpisie
  `zmiana-tresci` na zmianę. Po nim nie ma ani przebiegu, ani nagrania: lektor powstaje na dopasowanym scenariuszu
  (etap 8). Znacznik, którego `/kurs-uwagi` nie naniesie chirurgicznie (zostaje na miejscu), idzie do bramki zakres
  dydaktyczny (G4).
- **Szkielet po dopasowaniu.** `sprawdz`, `proba` i to samo porównanie `hasz.skeleton` i `hasz.model` co w etapie 6.
  Różne - zmiana nie była dopasowaniem (`edl` odrzuciłby nagranie): karta zakres dydaktyczny (G4) z tą zmianą.
- **Karta: zakres dydaktyczny (G4).** Pola: uwaga (cytat i to, co na klatce), pełna ścieżka klatki w bloku kodu,
  naruszona granica (który warunek granicy samodzielnych zmian (D1) nie zachodzi, zmiana szkieletu albo działania,
  znacznik nie do naniesienia), propozycja automatu. Decyzję Rafała zapisujesz najpierw jako `karta dopisz`
  `decyzja-g4` (bez tego wpisu `/kurs-uwagi` potraktuje znacznik decyzji jak zwykły znacznik) i notatkę w `## Naniesione
  automatycznie` raportu nagrania. Zmianę samej narracji albo linii `[AKCJA]` wykonujesz znacznikiem z dopiskiem
  decyzji - `[UWAGA: nagranie, krok K (decyzja G4): <rozjazd>. Propozycja: <brzmienie Rafała>]` - i `/kurs-uwagi` w
  trybie automatycznym, z jego brzmieniem dosłownie, bez dostosowania; na kartę idzie też `zmiana-tresci`, do
  `## Naniesione automatycznie` wiersz `scenariusz (decyzja G4)`. Decyzja, która zmienia tekst do wpisania, krok albo
  działanie, to nowe finalne nagranie tego ujęcia (etap 3, potem etapy 4-5 dla niego i dopasowanie jego klatek).
  Zmiana segmentów idzie przez `/kurs-lekcja`. Konto: dopasowanie biegnie po `station-release`, więc karta zakres
  dydaktyczny (G4) tego etapu konta nie trzyma.
- **Raport nagrania** `video/recording-report.md` (format niżej) po naniesieniu: `status: zaakceptowany` i
  `accepted_by: automat`, gdy każda uwaga poszła do naniesienia w granicy (D1) albo na kartę i nie ma otwartej
  bramki zakres dydaktyczny (G4) - także wtedy, gdy uwag nie było, bez pytania; inaczej `status: do_decyzji` i karta
  zakres dydaktyczny (G4), a po decyzjach Rafała `status: zaakceptowany` z `accepted_by: rafal` (tak samo po wariancie [B] karty braku
  postępu). Commit raportu z `video/karta.json`: `kurs(<slug>): lekcja <n> dopasowanie do nagrania (automat)`, przy
  `accepted_by: rafal` - `(rafal)` („Commity pętli” w kroku 4). Etap 1 `/kurs-video` odmówi bez zaakceptowanego
  raportu nagrania, którego `zrodla-hasz` zgadza się z bieżącym scenariuszem i konspektem.

**Format** `video/recording-report.md` (spec sekcja 20.4; raport przebiegu zostaje w `video/przebieg-probny.md`):

```markdown
---
status: do_decyzji            # albo zaakceptowany
accepted_by: automat          # albo rafal; dopiero przy zaakceptowany
data: RRRR-MM-DD
nagrania:                     # finalne nagranie każdego ujęcia, katalog względem <dane>
  - "1: runs/<lekcja>/<nazwa>/ujecie-01"
  - "2: runs/<lekcja>/<nazwa>/ujecie-02-p2"
skeleton-hasz: <hasz.skeleton z manifestów finalnych nagrań>
zrodla-hasz: <zrodla-hasz z video/plan-nagrania.md po dopasowaniu>
---

### 1. Krok K (akapit S:A) - tytuł
Typ: scenariusz | automat | niepewne
Cytat: <zdanie scenariusza dosłownie>
Na klatce: <co widać>
Propozycja: <nowe brzmienie albo co obejrzeć w filmie>
Klatka: runs/<lekcja>/<nazwa>/ujecie-NN/kontrola/krok-KK.png

## Naniesione automatycznie

| krok | typ | przed | po | commit |
|---|---|---|---|---|

## Na karcie lekcji

- krok K, akapit S:A: <co obejrzeć w filmie> (automat | niepewne | wariant B)
```

Uwagi numerujesz od 1 w kolejności kroków; `## Naniesione automatycznie` ma wiersz na każdą naniesioną zmianę
(`scenariusz`: zdanie przed i po; `scenariusz (decyzja G4)`), pod tabelą notatki G4 „zakres dydaktyczny” (krok,
otwarta albo rozstrzygnięta i jak). `zrodla-hasz` bierzesz z `video/plan-nagrania.md` po przegenerowaniu planu (po
`/kurs-uwagi` albo, gdy nic nie naniosłeś, `npm run plan-nagrania -- <lekcja>` w `tools/course-pipeline`).

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
  karta braku postępu i dopłata (bilet produkcyjny (G1)) oraz zakres dydaktyczny (G4), tylko z wyzwalaczy: w
  dopasowaniu do nagrania zmiana poza granicą samodzielnych zmian (D1) albo zmieniająca tekst do wpisania, krok lub
  działanie, i znacznik nie do naniesienia chirurgicznie; w pętli produkcji funkcja, której wg sondy już nie ma, i
  wykonanie, którego stanu `stan-wykonania` nie ustalił (sekcja „Lekcja z biletem: pętla produkcji”). Powtórzone
  zatrzymanie albo uwaga - także ten sam `CEL` i ten sam komunikat `INNY` drugi raz - to w lekcji z biletem karta
  braku postępu (bilet produkcyjny (G1)), nigdy zakres dydaktyczny (G4)). W lekcji z biletem
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
    martwe, żeby reset je odtworzył - uruchamiasz dokładnie polecenie z komunikatu (bez pytania), potem przy trzymanej
    rezerwacji `production` kolejną próbę ujęcia od nowa (pętla produkcji: przed przebiegiem, który przeszedł ujęcie,
    `przebieg <lekcja> --ujecie N`, po nim nagranie z `--przebieg`); nigdy zwykły ponowny reset z wiersza `STAN`;
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
    OAuth (G2) z komunikatem dosłownie (w lekcji z biletem karta braku postępu z tą bramką, pętla produkcji, „Karty
    pętli”).
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
  `nagraj` lekcji - `send-mail <lekcja>` (`--ujecie N`, gdy skrzynkę deklaruje inne ujęcie niż pierwsze). W pętli
  produkcji pierwsze `send-mail` idzie w krótkim zajęciu `station-wait <lekcja> --purpose other` przed rezerwacją
  `production` (maile muszą się postarzeć, `mail_age`), a pod rezerwacją przed `preview-start-state` i przed każdą
  próbą ujęcia ze skrzynką jeszcze raz (zwykle `OK: wysłane 0`). Wysyła tylko
  maile, których brakuje w Odebranych, każdy jednym wykonaniem z licznika `executions`; `OK: wysłane 0` - idziesz
  dalej. Mail, którego wątek lekcji ma odpowiedź konta kursu (np. agent 2.3 odpowiedział w wątku storczyków), w lekcji
  z biletem `send-mail` pomija jako obecny, a odpowiedź usuwa reset ujęcia (`usun-odpowiedz`,
  punkt „Stany skrzynki, których automat nie naprawi”) - ani wysyłki, ani karty. Każdy mail idzie w jednym oknie
  uruchomienia `send_mail`, które przepuszcza do 20 żądań sygnatury wysyłki (`runRequests: 20`, tylko to działanie:
  Gmail wysyła `POST /sync/u/1/i/s` kilka razy na jeden mail), a karta wraca na konto kursu (`/mail/u/0/`) jeszcze w
  tym oknie, także po zatrzymaniu. Żądanie sygnatury poza tym oknem albo ponad 20 strażnik blokuje (do Gmaila nie
  dochodzi) i zatrzymuje `send-mail` kodem `CEL` (punkt „Inne zatrzymania `send-mail`”). Reset, który staje `STAN` `gmail: brak wiadomości „<s>” w Odebranych - wyślij ją: send-mail …` (np. reset
  innej lekcji skasował maile spoza swojej deklaracji), to też `send-mail` przy trzymanym koncie, potem nowe ujęcie
  (w pętli produkcji kolejna próba);
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
  dołączasz `station-wait <lekcja> --purpose production` w tle (pętla produkcji, etap 3).
  Rafałowi jedna linia: co wysłane i którego
  dnia lekcja wraca do kolejki. Wcześniej `mail_age` i tak zatrzymałby ujęcie (`Przygotowanie ujęcia ... niespełnione`).
  W lekcji z biletem to czekanie przypada przed rezerwacją `production`; gdy `send-mail` pod rezerwacją coś wyśle i
  każe czekać do innego dnia, też oddajesz konto i czekasz bez niego (spec sekcja 20.7, wiersz 16: czekanie na
  `mail_age` bez konta) - to koniec rezerwacji, a tego dnia wracasz przez `--purpose production`.
- **`NIEUSTALONY`** (`gmail: wysyłka „<temat>” w nieznanym stanie - sprawdź Wysłane konta nadawcy; send-mail nie
  powtarza jej sam.`): komenda staje i dalszych maili nie próbuje. Ty: `karta dopisz` `konto` (`co`: wysyłka maila
  `<id>` w nieznanym stanie, send-mail). W krótkim zajęciu przed rezerwacją `production`: `station-release`. W tej
  turze nie powtarzasz `send-mail` (ani bez flag, ani
  z `--rozstrzygnij` z własnej inicjatywy) i nie pytasz Rafała; kończysz turę bez znacznika bramki, a po 2 min (odstęp
  w tle, jak `LIMIT_SIEC`) dołączasz `station-wait <lekcja> --purpose other` w tle. Pod rezerwacją `production` bez
  `station-release` i bez dołączania: odstęp 2 min z trzymanym kontem, potem zwykłe `send-mail`. Wysyłkę ustala
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
  przyczyna poza plikami lekcji - karta klasy G4 „zakres dydaktyczny” z komunikatem dosłownie (automat nie pójdzie
  dalej bez zmiany tego, co robi); wyjątek: inne konto na `/mail/u/1/` to
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
    dosłownie, jak przy „kosz NIE opróżniony” (stan konta, do którego reset nie dociera). Dwa dosłownie te same
    komunikaty zatrzymuje w pętli produkcji odmowa braku postępu przed następną próbą: wtedy ta karta jest kartą braku
    postępu z bramką polityka konta (G3) w wariancie [A] („Karty pętli”); dwa różne komunikaty jednej rodziny (niżej)
    narzędzie przepuściłoby, więc kartę klasy polityka konta (G3) otwierasz sam, bez kolejnej próby. Jedną rodziną liczą się
    `nie wczytała się w 15 s` i `zmieniła się od planu (rozmowa nie wczytała się w 15 s)`, a osobno `nie rozwinęła się`
    i `zmieniła się od planu (rozmowa nie rozwinęła się)`: dwa komunikaty jednej rodziny to ten sam komunikat drugi
    raz.
- **Konto w kartach dla Rafała.** Przed kartą oddajesz konto (`station-release`), jak przed każdą bramką, która nie
  potrzebuje konta - poza rezerwacją `production`. Pod rezerwacją `production` („Trzymanie konta kursu” (T4)) konta
  przed kartą nie oddajesz, także tam, gdzie punkty tej sekcji mówią „`station-release`, potem karta”:
  `station-mark <lekcja> --state waiting`, po odpowiedzi Rafała `station-mark <lekcja> --state working` (pętla
  produkcji, „Karty pętli”). Gdy Rafał chce coś sprawdzić albo poprawić w profilu kursu (Wysłane nadawcy, skrzynka kursu),
  dzieje się to przy trzymanym koncie: `station-wait <lekcja> --purpose other` (pod rezerwacją `production` konto już
  trzymasz), `station-mark <lekcja> --state waiting`
  na czas jego kliknięć, potem `station-mark <lekcja> --state working` (sekcja „Lekcje równolegle”).

## Lekcje równolegle

Kilka sesji dzieli jedno konto kursu (profil, n8n, konto Google, arkusz). Stanowisko, kolejka i komunikaty: README
`tools/nagrywanie`, sekcja „Kolejka do konta kursu”. Kolejność zgłoszeń, bez przeskakiwania.

- **Lekcja wchodzi do kolejki dopiero gotowa.** Wcześniej zamknij każdą bramkę, która nie potrzebuje konta: w lekcji z biletem
  G1 „bilet produkcyjny” i całe przygotowanie bez konta (pętla produkcji, etapy 1-2: `video/nagrywanie.yaml`,
  `preparation`, `start_state`, `sprawdz`, `proba`, plansze) - paczki lektora i avatarów przed nagraniem lekcja z
  biletem nie potrzebuje, powstają po dopasowaniu do nagrania; w lekcji bez biletu zgodę na koszt i limit
  wykonań oraz tabelę `## Przygotowanie przed nagraniem` (i paczkę lektora z avatarami przed nagraniem). Do `dry-pass`, `recording` i `production` każde ujęcie lekcji musi mieć `start_state`; bez niego `station-wait` z tym
  celem odmawia (najpierw `save-start-state`; w lekcji bez biletu także bramka B4 „lista trwałych usunięć”, w lekcji z biletem bramka polityka konta (G3) raz na usługę, a gdy potwierdzona `reset_policy` obejmuje rodzaje deklaracji - podgląd `preview-start-state` tylko do logu, bez bramki). `preview` i `other` tego wymogu nie mają.
- **Dołączanie.** `station-wait <lekcja> --purpose <preview|dry-pass|recording|production|other>` uruchom narzędziem Bash z
  `run_in_background: true` (nie `Monitor` - kończy komendę po najwyżej 30 min). Lekcja z biletem dołącza do pętli
  produkcji raz, z `--purpose production` (etap 3), a nie przed każdym przebiegiem i nagraniem. Powiedz w jednej linii, na której
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
  waiting`) dłużej niż 30 min, a trzymający z celem `production` (lekcja z biletem w pętli produkcji) dopiero po 12 h
  (`PRODUCTION_WAITING_REPORT_MS`): jego karta i tak dochodzi do Rafała przez hub, a 12 h to jedyny sygnał, że jego
  sesja umarła w `waiting` (`station-show` podaje trzymającego, cel i od kiedy czeka). Za trzymającym `production`
  lekcja najpierw kończy całą pracę bez konta (treść, `nagrywanie.yaml`, `sprawdz`, `proba`, plansze; lektor, avatary
  i montaż lekcji już nagranej), dopiero potem staje w kolejce. Powiedz Rafałowi ze znacznikiem bramki, cytując komunikat dosłownie; na „czekaj” uruchom
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
  jest wolne, i wystartuje puls od nowa. Pulsu nie uruchamiasz ręcznie. Trzymający w stanie `waiting` nie wygasa
  nigdy, więc rezerwacja `production` przetrwa kartę każdej długości; puls kończy się jednak po 2 h bez komend i po
  takiej karcie `station-wait <lekcja> --purpose production` zajmie trzymaną rezerwację od nowa i wystartuje puls.
- **Punkty zwolnienia (`station-release <lekcja>`).** Lekcja bez biletu: po `preview-start-state` (B4 „lista trwałych
  usunięć” zatwierdza Rafał bez trzymanego
  konta); po każdym `przebieg` od razu, gdy komenda się skończy - analizę zrzutów i raport robisz bez konta, a kolejny
  przebieg po poprawkach to nowe dołączenie; po nagraniu ujęć, przed bramką pierwszego ujęcia - każde dalsze ujęcie
  (ponowne nagranie albo kolejne) to nowe `station-wait --purpose recording`, a konto przywraca reset `start_state`
  tego ujęcia. B4 „lista trwałych usunięć” (lekcja bez biletu) zatwierdza deklarację `start_state` lekcji; że reset skasuje też to, co zostawiły inne lekcje, jest
  oczekiwane i nie wymaga nowej bramki. Lekcja z biletem („Trzymanie konta kursu” (T4); spec sekcja 20.6) punktów
  zwolnienia między próbami nie ma: rezerwację `production` trzyma od etapu 3 pętli produkcji bez przerwy - między
  przebiegami, między przebiegiem a nagraniem, przy kolejnych próbach, w odstępach `LIMIT_SIEC` i przy każdej karcie
  (bilet produkcyjny (G1) - dopłata i brak postępu -, poświadczenia i pierwsza zgoda OAuth (G2), polityka konta (G3)
  i zakres dydaktyczny (G4) z pętli) - i oddaje ją tylko po finalnym nagraniu
  ostatniego ujęcia (etap 6), przy wariancie [C] karty braku postępu i na czekanie `mail_age` (sekcja „Poczta
  lekcji”). Krótkie zajęcia przed rezerwacją (`other`: `send-mail`, czynności Rafała z karty bilet produkcyjny (G1); `preview`:
  `save-start-state`) oddaje zaraz po nich.
- **Przygotowanie konta przez Rafała** (np. odebranie dostępu n8n w koncie Google przed ujęciem lekcji bez biletu; w
  lekcji z biletem cofa automat) dzieje się przy
  trzymanym koncie: `station-mark <lekcja> --state waiting`, zakończ turę ze znacznikiem bramki, po jego odpowiedzi
  `station-mark <lekcja> --state working`.
- **`waiting` w lekcji z biletem:** `station-mark <lekcja> --state waiting` tylko przy bramce od G1 „bilet produkcyjny” do G4 „zakres dydaktyczny” zamykanej z
  trzymanym kontem (pod rezerwacją `production` - przy każdej karcie pętli, także karcie braku postępu) i przy czynności Rafała klasy G2 „poświadczenia i pierwsza zgoda OAuth” na koncie (logowanie, także
  pierwsze logowanie konta nadawcy, okno zgody P1b „sonda okna ze zgodą”, odebranie dostępu, ręczna wysyłka sondy
  sygnatur Gmaila, sprawdzenie Wysłanych nadawcy). Każda
  inna praca przy trzymanym koncie - poprawka automatu, sonda automatyczna, `stan-wykonania`, kolejne ujęcie -
  zostaje w `working`.
- **Pliki wspólne kursu** - `tools/**`, `kursy/<slug>/_nagrywanie/**` (w tym skrypty sond w `<dane>/sondy/`) i
  `kursy/<slug>/kurs.yaml` - zmieniasz tylko trzymając konto. Poprawka „automat” z przebiegu: w lekcji bez biletu po
  ponownym dołączeniu, gdy `station-wait` odda ci konto (kod 0), przed kolejnym `przebieg`; w lekcji z biletem od
  razu, bo rezerwacja `production` trzyma konto przez całą pętlę.
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

Sekcje karty z pętli produkcji: „Bilet” (sekcja 1) `buduj` liczy sam z `video/ticket.yaml` - `executions` zużyte i
budżet, przebiegi próbne i nagrania ponowne na ujęcie jako statystyki (bez budżetu); „Zmiany treści naniesione przez
automat” (sekcja 2) to zmiany dopasowania do nagrania; „Przebieg produkcji” (sekcja 4) to każda próba ujęcia z
miejscem i przyczyną (wpisy `triage` i `powtorka` niżej, próby nagrań z werdyktem `buduj` czyta z runu) i każda karta
braku postępu.

| Zdarzenie | `rodzaj` | Pola wpisu |
|---|---|---|
| zmiana treści z dopasowania do nagrania (pętla produkcji, etap 7; dawniej z przebiegu próbnego), po commicie `/kurs-uwagi` (wpis na każdą zmianę) | `zmiana-tresci` | `krok`, `akapit`, `przed`, `po`, `pliki`, `commit`, `data` |
| decyzja Rafała w G4 „zakres dydaktyczny” | `decyzja-g4` | `krok`, `opis`, `decyzja`, `data` |
| `niepewne`, którego druga metoda nie rozstrzygnęła (dopasowanie do nagrania) | `miejsce` | `krok`, `akapit`, `t: null`, `co`, `zrodlo: "niepewne"` |
| wada obrazu finalnego nagrania z dopasowania (nagranie zostaje) i uwaga kontroli ujęcia przyjęta słowem Rafała (wariant [B] karty braku postępu) | `miejsce` | `krok`, `akapit`, `t: null`, `co`, `zrodlo: "kontrola-ujecia"` |
| każda kolejna próba nagrania ujęcia (werdykt `powtorka`, kolejna próba po triage) | `powtorka` | `ujecie`, `powod`, `data` |
| każda nieudana próba ujęcia (zatrzymanie przebiegu albo nagrania, niepowodzenie kontroli; `decyzja`: miejsce `reset` albo `krok K`, przyczyna, co zrobione) i każda karta braku postępu (`klasa: "brak postępu (G1)"`, `decyzja`: podpis i wariant Rafała) | `triage` | `ujecie`, `klasa`, `decyzja`, `data` |
| czynność ręczna Rafała w G2 „poświadczenia i pierwsza zgoda OAuth” i w bramce polityka konta (G3) (logowanie, okno zgody, zatwierdzona polityka, pozycja `account_setup`, ręczne cofnięcie dostępu Google), wysyłka maila lekcji w nieznanym stanie (`send-mail` `NIEUSTALONY`) i jej rozstrzygnięcie przez Rafała | `konto` | `co`, `data` |

Przykład: `--json '{"rodzaj":"triage","ujecie":"lekcja","klasa":"LIMIT_SIEC","decyzja":"krok 11, Workspace offline; odczekane 2 min, ta sama próba od nowa","data":"2026-10-22"}'`.

- Każde pole jest wymagane, a obce pole albo nieznany `rodzaj` to `BŁĄD:` i plik bez zmian. Wpis z adresem e-mail albo
  ciągiem w kształcie klucza (w polach tekstowych także 32 znaki i więcej bez spacji, np. pełna ścieżka) narzędzie
  odrzuca - napisz go bez nich, bo karta idzie do gita.
- `akapit` to `S:A` kroku z `przebieg.json` (w dopasowaniu do nagrania z przypiętego przebiegu referencyjnego) albo z
  `video/nagrywanie.yaml` - manifest nagrania go nie ma; `t` w `miejsce` to sekunda w akapicie (`null` - jego początek), czas w
  filmie liczy `buduj` z osi montażu.
- Powtórzone i doradcze uwagi kontroli ujęcia, decyzje kontroli lektora, kadry znaku AI do przejrzenia i ostrzeżenia
  montażu `buduj` czyta sam - tych nie dopisujesz.
- `video/karta.json` z niezacommitowanymi wpisami wchodzi do najbliższego commitu lekcji: commitu poprawki
  automatu, commitu trybu automatycznego `/kurs-uwagi` albo commitu raportu nagrania (dawniej akceptacji przebiegu;
  wpis `zmiana-tresci` niesie hash commitu treści,
  więc trafia do następnego). Wpisy z pętli (`powtorka`, `triage`, `konto`) idą do następnego commitu lekcji,
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
  ujęcia, `send-mail` i `probe-auto --allow-writes`, a odmowa próby, na którą nie starczy wykonań (i wyczerpany
  licznik `executions`), otwiera G1 „bilet produkcyjny”, dopłatę.
- Surowe nagrania, zrzuty przebiegu próbnego, klatki kontroli ujęcia i profil przeglądarki nie idą do gita (mogą zawierać dane konta). W raportach `video/przebieg-probny.md` i `video/recording-report.md` (idą do gita) pola `Cytat:`, `Na zrzucie:` i `Na klatce:` nie przepisują danych konta: adresów e-mail, nazw spoza projektu testowego, fragmentów kluczy. To samo dotyczy sekcji `## Naniesione automatycznie` i wpisów `video/karta.json`.
- `kursy/misja-ai-start/_nagrywanie/` to osobny, zamrożony automat Misji - ten skill go nie używa i nie zmienia.
