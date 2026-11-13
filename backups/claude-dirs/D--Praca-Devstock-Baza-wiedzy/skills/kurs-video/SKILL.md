---
name: kurs-video
description: Rendering video lekcji obu torów — tor A (typ_video prezentacja: slajdy Marp + TTS + avatar) i tor B (typ_video demo: dwuetapowy montaż ręczny — system generuje paczkę lektora TTS i avatary, Rafał nakłada lektora na nagranie w edytorze, system spina całość). Montaż ffmpeg. Po akceptacji filmu w kursie z `vimeo.automat` wgrywa go na Vimeo. Używaj, gdy Rafał chce wygenerować lub poprawić final.mp4 dla zatwierdzonej lekcji, a także gdy mówi „wrzuć zaległe filmy na Vimeo” albo „zaktualizuj domeny filmów na Vimeo”.
---

# /kurs-video — rendering video (tor A i tor B)

Wejście: ścieżka lekcji, np. `kursy/<slug>/modul-01-x/lekcja-02-y`. Obsługuje
oba tory: `typ_video: prezentacja` (slajdy Marp, TTS, avatar — automatyczny po
wyborze silnika) i `typ_video: demo` (dwuetapowy
montaż ręczny: system generuje paczkę lektora TTS i avatary, Rafał nakłada
lektora na nagranie w edytorze i dostarcza `video/nagranie-z-lektorem.mp4`,
system spina całość; układ zawsze avatar → screencasty → avatar).
**Silnik avatara** — `api` (REST API HeyGen, kredyty API) albo `mcp` (oficjalny
serwer MCP HeyGen, rozliczenia OAuth na koncie: plan zamiast kredytów API) —
**nie ma wartości domyślnej po stronie skilla**: albo Rafał wskazuje go
w komendzie, albo pytasz w bramce (krok 2).
Silnik jest ortogonalny do torów A/B — dotyczy tylko segmentów `[ekran: avatar]`.
Wynik: `video/final.mp4` w folderze lekcji, `status.video: wyrenderowane`,
przedstawione Rafałowi do bramki akceptacji.

## Lekcja z biletem produkcyjnym (tryb biletu)

Lekcja z plikiem `video/ticket.yaml` (bilet produkcyjny (G1), zakłada go `/kurs-nagrywanie`; spec
`docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`, sekcje 9, 11 i 12) ma etapy lektora,
kontroli lektora, montażu i filmu **bez bramek**. Czego automat nie rozstrzygnie, trafia na kartę lekcji
(`video/lesson-card.md`), a Rafał ocenia `final.mp4` razem z kartą w jednej bramce: film z kartą lekcji (G5),
krok 5. Bramki wejścia z kroku 1 (treść zatwierdzona, brak `[UWAGA]`, zaakceptowany raport: w lekcji z biletem
raport nagrania `video/recording-report.md`, w lekcji bez biletu przebieg próbny) obowiązują dalej. **Kolejność toru B
w lekcji z biletem** (spec sekcja 20.3): finalne nagrania ujęć i raport nagrania (`/kurs-nagrywanie`, pętla
produkcji, etapy 3-7) → etap 1 tego skilla i kontrola lektora → avatary → `edl` z finalnych nagrań →
`/kurs-montaz` → etap 2 → bramka film z kartą lekcji (G5). Po etapie 1 niczego się nie nagrywa: lektor powstaje na
scenariuszu dopasowanym do nagrań. Kroki niżej mają akapity „Lekcja z biletem”; **lekcja bez `video/ticket.yaml` działa po staremu, ze
wszystkimi dotychczasowymi bramkami** - tam stosuj sam tekst bez tych akapitów.

- **Wpisy na kartę:** `cd tools/course-pipeline`, potem
  `npm run karta -- dopisz ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --json '<wpis>'` (rodzaje i pola wpisów:
  `/kurs-nagrywanie`, sekcja „Karta lekcji (lekcja z biletem)”). Narzędzie odrzuca wpis z adresem e-mail albo
  ciągiem w kształcie klucza - pisz bez nich. Powtórzone uwagi kontroli lektora, kadry znaku AI do przejrzenia i
  ostrzeżenia montażu `buduj` czyta sam z plików, które narzędzia piszą - tych nie dopisujesz.
- **Commity:** przed commitem `git branch --show-current` (inna gałąź niż gałąź dnia = stop i pytanie do Rafała),
  potem `git commit -m … -- <ścieżki>`. `git add -- <ścieżka>` tylko dla ścieżki jeszcze nieśledzonej
  (`git ls-files --error-unmatch -- <ścieżka>` kończy się błędem), tuż przed tym commitem; ścieżki śledzonej nie
  dodajesz do wspólnego indeksu. Ścieżka ze zmianami, których sesja nie zrobiła, nie jest commitowana, a tura ją
  nazywa. Bez pusha. `video/karta.json` i `video/lesson-card.md` wchodzą do najbliższego commitu lekcji.

## Procedura

1. **Bramka wejścia.** Sprawdź `lekcja.yaml`:
   - `status.tresc != zatwierdzona` → przerwij i skieruj na dokończenie
     `/kurs-lekcja` (bramka Rafała dla treści) najpierw — rendering to
     kosztowne API (ElevenLabs, HeyGen), tylko dla zatwierdzonej treści.
   - `video/scenariusz.md` nie może zawierać linii `[UWAGA: ...]` — `npm run video` zatrzyma
     się przed pierwszym płatnym wywołaniem. Nienaniesione uwagi nanieś przez `/kurs-uwagi`.
   - Kurs online bez zapisanej decyzji o usprawnieniach filmów (brak klucza
     `slajdy.odslanianie`, `montaz.plansze`, `oprawa` albo - w kursie z lekcjami demo -
     `nagrywanie.automat` w `kurs.yaml`; kurs
     `format: stacjonarny` pomijasz): zapytaj wyłącznie o brakującą decyzję
     (pytanie z `/kurs-nowy`, krok 2), zapisz odpowiedź, także "nie"
     (`false`), istniejących wartości nie ruszaj. Przy planszach włączonych
     w lekcji demo bez `video/plansze.yaml` **zatrzymaj się**: montaż bez tego
     pliku po cichu pominąłby plansze. Najpierw `/kurs-lekcja` pisze plik na
     podstawie zatwierdzonego scenariusza i przedstawia go Rafałowi do
     akceptacji; dopiero po niej wracasz tutaj. Zmiana treści lekcji przy tej
     okazji = ponowne zatwierdzenie treści.
     **Lekcja z biletem:** te decyzje (`slajdy.odslanianie`, `montaz.plansze`, `oprawa`, akceptacja brakującego
     `video/plansze.yaml`) zapadły na karcie bilet produkcyjny (G1), zanim bilet powstał. Skill ich nie
     zadaje i nie zatrzymuje się na bramce: brak decyzji oznacza, że bilet zapisano błędnie - zatrzymaj się z
     komunikatem nazywającym brakujący klucz lub plik (to dopłata do bilet produkcyjny (G1), nie nowa bramka).
     Lekcja bez biletu: pytanie jak wyżej.
   - **Dla `typ_video: demo` dodatkowo:** układ scenariusza musi być avatar →
     screencasty → avatar (waliduje render). Etap renderu zależy od
     `video/nagranie-z-lektorem.mp4`: brak pliku = etap materiałów (paczka
     lektora + avatary), plik jest = finalne spięcie. Surowe
     `video/nagranie.mp4` jest materiałem roboczym Rafała do edytora —
     pipeline go nie czyta.
     **Kurs z `nagrywanie: { automat: true }`:** etap 1 (paczka lektora, także `--plan-avatara`) wymaga
     zaakceptowanego przebiegu próbnego: `video/przebieg-probny.md` ze `status: zaakceptowany` i `zrodla-hasz`
     zgodnym z bieżącym scenariuszem i konspektem - `npm run video` odmówi przed pierwszym płatnym wywołaniem.
     Brak albo odmowa = najpierw `/kurs-nagrywanie` (kroki 0-4, do zaakceptowanego raportu). `--bez-przebiegu`
     tylko na jawne słowo Rafała w tej rozmowie.
     **Lekcja z biletem** (`video/ticket.yaml`, bilet produkcyjny (G1)): etap 1 wymaga zamiast tego zaakceptowanego
     raportu nagrania: `video/recording-report.md` ze `status: zaakceptowany` i `zrodla-hasz` zgodnym z bieżącym
     scenariuszem i konspektem (po dopasowaniu scenariusza do nagrań, nie przed nim). `npm run video` odmawia przed
     pierwszym płatnym wywołaniem; brak albo odmowa = najpierw `/kurs-nagrywanie` (pętla produkcji, do etapu 7).
     `video/przebieg-probny.md` nie jest tu warunkiem. Lekcja bez biletu: przebieg próbny jak wyżej.
     Dokumentem do nagrywania jest `video/plan-nagrania.md` (kroki ekranu,
     kolumna „Do wpisania" z tym, co przy kroku idzie z klawiatury, narracja
     z nazwami plików lektora, a pod tabelą segmentu bloki do wklejenia).
     Bramka czyta ten plik, nie konspekt wprost: gdy `plan-nagrania.md` już
     istnieje i niesie kolumnę „Do wpisania", nagrywaj z niego bez pytania
     o sekcję w konspekcie - dotyczy to też lekcji, których konspekt tej
     sekcji nigdy nie miał (stary układ, świadomie niezmigrowany).
     Jeśli planu nie ma albo `npm run validate` zgłasza, że jest nieaktualny
     - przegeneruj przed nagraniem: `npm run plan-nagrania -- <lekcja>`.
     Kolumna i bloki w wygenerowanym planie są kopią sekcji
     `## Do wklejenia i wpisania na ekranie` z `video/konspekt-nagrania.md`,
     nie osobnego pliku. Gdy regeneracja się nie powiedzie, bo tej sekcji
     brakuje w konspekcie, odeślij do `/kurs-lekcja`,
     `Migracja lekcji ze starego układu` - dopiero regenerowany plan
     wymaga tej sekcji, sam odczyt gotowego planu nie.
2. **BRAMKA: silnik avatara.** Jeśli Rafał wskazał silnik w komendzie („avatar
   przez MCP", „przez API") — honoruj wskazanie bez pytania. Jeśli **nie**
   wskazał — zapytaj **przed renderem** i **czekaj na odpowiedź**: plan
   (silnik `mcp`, rozliczenie OAuth na koncie) czy kredyty API (silnik `api`)?
   Brak odpowiedzi nie jest zgodą — nie zgaduj, nie wybieraj za Rafała i nie
   ruszaj renderu, bo każdy segment avatarowy to realny wydatek. Pytaj też
   przy wznowieniu przerwanego renderu — cache pokrywa tylko gotowe segmenty,
   reszta pójdzie wybranym silnikiem. Bramka jest bezprzedmiotowa (renderuj
   bez pytania) tylko wtedy, gdy scenariusz lekcji nie ma segmentów
   `[ekran: avatar]` albo wszystkie ich pliki są już w `video/avatar/`.
   **Zgoda na kontrole (osobno od silnika, zawsze przed renderem):** po
   wygenerowaniu głosu idzie kontrola lektora (krok 4b: rozpoznanie mowy
   ElevenLabs, grosze, wynik w cache), a w kursie z odsłanianiem także
   rozpoznanie mowy slajdów (krok 3). Jeśli Rafał nie odniósł się do tego
   w komendzie, powiedz o tym jednym zdaniem i czekaj na odpowiedź - także
   wtedy, gdy pytanie o silnik było bezprzedmiotowe. „Bez kontroli lektora”
   = pomijasz krok 4b; rozpoznanie mowy slajdów wyłącza się tylko kluczem
   `slajdy.odslanianie` w `kurs.yaml`. Lekcja ze zrzutami do artykułu (zamówienia `kind: screenshot`
   w `artykul-grafiki/zrodla/`) ma w tej samej zgodzie przegląd prywatności zrzutów
   (`npm run ilustracje -- prywatnosc <lekcja>`: Gemini, kilka groszy, jedno wywołanie na wszystkie zmienione
   zrzuty, przed bramką 5) - wymień go w tym samym zdaniu. „Bez przeglądu zrzutów” = pomijasz go w bloku
   „Zrzuty do artykułu” przed bramką 5; zrzuty są wtedy nieprzejrzane (zasady w tym bloku).
   **Lekcja z biletem** (`video/ticket.yaml`, bilet produkcyjny (G1)): bramka silnika i zgody schodzi do ustawień
   kursu, a bilet jest zgodą na koszt. Oba klucze `video.avatar_engine` i `video.narrator_control` ustala karta
   bilet produkcyjny (G1) w `/kurs-nagrywanie` (pozycja (b)), zanim bilet powstanie - tu nie pytasz o żaden z nich.
   - `kurs.yaml` ma `video.avatar_engine` (`api` albo `mcp`) → silnik z kursu, **bez pytania** (wskazanie Rafała w
     komendzie nadal wygrywa).
   - `video.narrator_control: true` w `kurs.yaml` i `budget.stt: true` w bilecie → zgoda na kontrole jest
     dana, **bez pytania**. `budget.stt: false` wyłącza rozpoznawanie mowy (`kontrola-lektora` odmawia przed
     żądaniem): pomijasz krok 4b i mówisz o tym jednym zdaniem w podsumowaniu tury. `video.narrator_control:
     false` to decyzja z karty G1: krok 4b pomijasz tak samo, bez pytania.
   - Brak klucza `video.avatar_engine` albo `video.narrator_control` (albo wartość spoza `api`/`mcp`,
     `true`/`false`) oznacza, że bilet zapisano błędnie: zatrzymaj się z komunikatem nazywającym brakujący klucz
     (to dopłata do bilet produkcyjny (G1), nie nowe pytanie). Brak klucza nie jest zgodą i nie jest `api`.
   - Przegląd prywatności zrzutów (lekcja z zamówieniami `kind: screenshot`) jak `budget.stt`:
     `budget.screenshot_review: true` w bilecie → zgoda dana, **bez pytania**; `false` wyłącza przegląd
     (`npm run ilustracje -- prywatnosc <lekcja>` odmawia przed żądaniem): pomijasz go, a zrzuty są
     nieprzejrzane (blok „Zrzuty do artykułu” przed bramką 5). Bilet z `approved` od 2026-11-13 (od tego dnia
     `/kurs-nagrywanie` proponuje ten klucz) bez `budget.screenshot_review` oznacza, że bilet zapisano błędnie:
     zatrzymaj się z komunikatem nazywającym klucz, jak wyżej. Bilet zatwierdzony wcześniej klucza nie ma, a narzędzie traktuje jego brak
     jako zgodę: przegląd idzie, jedno zdanie w turze.
   Lekcja bez biletu: bramka silnika i zgoda na kontrole dokładnie jak wyżej.
3. **Sprawdź konfigurację** przed uruchomieniem, żeby nie wywalić się w
   połowie. Wspólne dla obu silników: `tools/course-pipeline/.env` ma
   `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `HEYGEN_AVATAR_ID`; `ffmpeg`
   dostępny w PATH (`ffmpeg -version`). Dodatkowo, wg silnika wybranego
   w bramce:
   - silnik `api`: `.env` ma `HEYGEN_API_KEY`;
   - silnik `mcp`: serwer MCP `heygen` podłączony i zalogowany (narzędzia
     HeyGen widoczne w sesji). Jeśli nie — podaj Rafałowi jednorazową
     konfigurację: `claude mcp add --transport http heygen
     https://mcp.heygen.com/mcp/v1/`, logowanie OAuth przez `/mcp`, i zatrzymaj
     się.
   Brak któregoś — zatrzymaj się i powiedz Rafałowi czego brakuje, zamiast
   odpalać połowiczny rendering.
   **Kontrola układu slajdów (tor A), zawsze, przed płatnym renderem:**
   `npm run kontrola-ukladu -- <lekcja>` (render w Chrome, bez kosztów).
   Problem w raporcie = zatrzymaj się i wróć do `/kurs-lekcja` (poprawka
   slajdu, nie motywu) - TTS i HeyGen nie idą na slajdy, które trzeba będzie
   zmienić.
   **Znak AI (tylko kurs z `oprawa: { znak_ai: true }` w `kurs.yaml`, oba tory):** render
   składa środek filmu, strażnik rogu układa plan znaku (`video/znak-ai/plan.json`), znak jest
   wpalany, doklejane są intro i outro z `kursy/_wspolne/oprawa/`, a kandydat przechodzi bramkę
   (pełny napis na starcie, widoczność, wyjście przed outro, technika). Bez płatnych wywołań;
   kilka do kilkunastu minut więcej. Po renderze przeczytaj `video/znak-ai/raport.md` i pokaż
   Rafałowi sekcję „Do przejrzenia przez człowieka” z klatkami. Bramka nie przeszła = `final.mp4`
   nie powstaje, stary film idzie do `video/archiwum/` jako nieaktualny, `status.video: brak`,
   odrzucony film leży w `video/znak-ai/odrzucony.mp4`: pokaż raport i zaproponuj poprawkę
   (wymuszony róg w `video/znak-ai.yaml`: `rogi: [{ od, do, rog }]`, zaznaczenie w EDL) - nigdy
   obejście. Przy bramce akceptacji filmu sprawdź `npm run znak-ai -- kontrola <lekcja>`
   (akceptacja `video/znak-ai/akceptacja.json` zgodna z `final.mp4`). Projekt:
   `docs/superpowers/specs/2026-10-07-oprawa-znak-ai-design.md`.
   **Znak AI w lekcji z biletem** (bez pokazywania sekcji Rafałowi w tej turze): linie sekcji „Do przejrzenia
   przez człowieka” trafiają na kartę same (`buduj` czyta `video/znak-ai/pomiar.json`), więc ich nie przepisujesz.
   Bramka znaku nie przeszła → plan z `npm run znak-ai -- plan <lekcja>` pokazuje, który róg jest wolny w danym
   przedziale; na każdy niezaliczony przedział dopisz jeden wpis do `video/znak-ai.yaml`
   (`rogi: [{ od, do, rog }]`, róg wolny wg planu) i wyrenderuj **raz**. Drugie niezaliczenie → bramka film z kartą
   lekcji (G5) z `video/znak-ai/odrzucony.mp4` i raportem; Rafał wybiera róg. Bez obejścia bramki, jak wyżej.
   Bez `final.mp4` kontrola `znak-ai -- kontrola` przed tą bramką jest pominięta, a karta mówi dlaczego (wpis
   `miejsce`, `zrodlo: "znak-ai"`: bramka znaku nie przeszła dwa razy, filmu nie ma).
   Lekcja bez biletu: sekcja do przejrzenia idzie do Rafała, a poprawka rogu po odrzuceniu jest propozycją.
   **Odsłony punktów (tylko kurs z `slajdy: { odslanianie: true }` w `kurs.yaml`, tor A):**
   render dodatkowo rozpoznaje mowę audio segmentów slajdów (ElevenLabs Speech-to-Text,
   grosze; cache wspólny z `npm run kontrola-lektora`, więc po kontroli lektora zwykle
   za darmo) i potrzebuje Chrome. Powiedz o tym Rafałowi w tej bramce. Kotwice
   (frazy, od których lektor zaczyna mówić o punkcie) i grafiki slajdów leżą w
   `video/odslony.yaml`; podgląd dopasowania bez renderu: `npm run odslony -- <lekcja>`,
   raport `video/klipy/odslony/dopasowanie.md` (spec
   `docs/superpowers/specs/2026-10-07-odslony-w-prezentacjach-design.md`).
   Po renderze przejrzyj ten raport sam: punkt z metodą „rozłożone” albo
   wyraźnie spóźniony wobec swojego zdania to kandydat na kotwicę - dopisz
   frazy do `video/odslony.yaml` (`kotwice: { <numer slajdu>: [fraza punktu 1, fraza punktu 2, ...] }`, tyle fraz, ile punktów)
   i przegeneruj (audio i avatary z cache, bez kosztów). Rafałowi w bramce 5
   podaj tylko to, czego nie dało się poprawić.
4. **Uruchom rendering** wg silnika wybranego w bramce:
   - **Silnik `api`:**
     `cd tools/course-pipeline && npm run video -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   - **Silnik `mcp`:**
     a. `npm run video -- <lekcja> --plan-avatara` — wypisze JSON
        `[{numer, hasz, audio, cel}]`. Gdy pełny łańcuch lekcji w `video/audio/` jest aktualny, plan bierze
        `audio` avatarów z niego i nie płaci za TTS. W przeciwnym razie generuje TTS samych chunków avatarowych
        do `video/audio/avatar-plan/`, z własnym znacznikiem. Plan nigdy nie unieważnia pełnego łańcucha i nie
        wydaje `tts_regenerations`, więc wolno go uruchomić także między pełnymi renderami lekcji z biletem
        (#774). Avatary HeyGen idą za `cel` i przeżywają regenerację narracji.
     b. Dla każdej pozycji planu, której plik `cel` **nie istnieje** (istniejący
        = cache, pomiń): przez narzędzia MCP `heygen` (nazwy odkryj w sesji —
        HeyGen może je zmieniać): wgraj `audio` jako asset → utwórz video
        avatara w trybie lip-sync do tego audio (avatar z `HEYGEN_AVATAR_ID`
        w `.env`; 1080p/16:9, jeśli narzędzie przyjmuje) → odpytuj status aż
        `completed` (limit ~10 min na segment) → pobierz `video_url` i zapisz
        plik dokładnie pod ścieżką `cel`.
     c. `npm run video -- <lekcja> --avatar=mcp` — pełny render; flaga to
        bezpiecznik: brak pliku avatara = twardy błąd, nie ciche zejście na
        API.
   Narracja całej lekcji idzie **jednym łańcuchem 4-6 żądań TTS** (chunki:
   tor A — chunk na segment, tor B — screencasty sklejone do budżetu znaków,
   avatar zawsze osobno), każde żądanie kondycjonowane poprzednimi, żeby
   głos trzymał jedno tempo przez całą lekcję. Pliki audio to
   `video/audio/NN.mp3` (NN = numer chunku), a **cache jest per lekcja**
   (`video/audio/.lesson-cache`), nie per plik: zmiana treści narracji,
   modelu albo głosu (`lektor.model` / `lektor.voice_id` w `kurs.yaml`, `.env`), ustawień głosu z `ELEVENLABS_MODELS` w `src/config.js`, nadpisań
   `ELEVENLABS_*` w `.env` albo stałych pauz akapitowych regeneruje audio
   **całej lekcji** — sklejonego łańcucha nie da się odbudować od środka.
   To realny koszt API (~13 600 znaków, ok. 1,4 $ za lekcję); uprzedź
   Rafała, zanim odpalisz render po zmianie ustawień (lekcja z biletem: regeneracja lektora nie wymaga
   uprzedzenia, bo zgodą jest budżet `tts_regenerations` w bilecie). Slajdy Marp → PNG,
   avatary HeyGen i montaż ffmpeg mają nadal cache po istnieniu pliku;
   nazwa avatara (`video/avatar/NN-<hasz>.mp4`, NN = numer segmentu)
   niesie odcisk tekstu avatara i profilu głosu, więc render HeyGen
   przeżywa zmiany narracji w innych segmentach.
   **Tor B — dwa etapy:** pierwszy `npm run video` kończy się komunikatem z
   paczką lektora (`video/lektor/`): **jeden plik `NN.mp3` na chunk
   narracji** (avatary nie wchodzą do paczki) i `spis.md` z **timecodem
   startu każdego akapitu** (kolumny: start, segment, akapit, po akcji,
   początek akapitu). Akapity w chunku rozdziela pauza ok. 1,1–1,5 s
   (zamówione 1,0 s; skrócona o połowę 2026-09-15 po odsłuchu M02L02) —
   długością nie odróżnia się pewnie od najdłuższych pauz naturalnych
   (do ~1,6 s), więc chunk tnie się po timecodach ze spisu, nie po
   długości ciszy. Przekaż Rafałowi ścieżkę spisu; Rafał
   montuje lektora z nagraniem w edytorze, eksportuje
   `video/nagranie-z-lektorem.mp4` i wtedy ponowny `npm run video` spina
   final. Ten krok może zamiast edytora zrobić `/kurs-montaz` (montaż
   automatyczny z bramką: lekcja, nagranie, intro, outro) — zaproponuj go
   Rafałowi razem ze ścieżką spisu. **Kurs z `nagrywanie: { automat: true }`:**
   nagrania ekranu nie robi człowiek - przebieg próbny `/kurs-nagrywanie`
   jest już za lekcją (bramka w kroku 1); po paczce lektora uruchom
   `/kurs-nagrywanie` od kroku 5 (automat Playwrighta nagrywa ujęcia i pisze EDL), potem
   `/kurs-montaz` od kroku zaznaczeń i plansz (EDL już wypełniony), potem etap 2. Kroki z kontem kursu w `/kurs-nagrywanie` idą przez kolejkę (sekcja „Lekcje równolegle”).
   **Lekcja z biletem - inna kolejność, bez nagrywania po etapie 1:** finalne nagrania ujęć i raport nagrania są już
   za lekcją (bramka w kroku 1). Po paczce lektora (i kontroli lektora, krok 4b) uruchom z `/kurs-nagrywanie`
   wyłącznie `edl` (krok 6) z runu finalnych nagrań, potem `/kurs-montaz`, etap 2 i bramka film z kartą lekcji
   (G5). Nagrania nie powtarzasz: wiąże je ze scenariuszem szkielet planu (`hasz.skeleton`), nie tekst narracji,
   więc `edl` przyjmuje je po dopasowaniu. Gdy `edl` odmawia, bo nagranie powstało dla innego szkieletu planu albo
   innego `nagrywanie.yaml`, zmiana nie była dopasowaniem: wróć do `/kurs-nagrywanie` (karta zakres dydaktyczny (G4)),
   nie nagrywaj na własną rękę. Po zmianie treści scenariusza przypomnij
   Rafałowi, że zmontowany materiał trzeba zaktualizować ręcznie — pipeline
   tego nie wykryje.
4b. **Kontrola lektora (objęta zgodą z bramki 2):**
   `npm run kontrola-lektora -- <lekcja>` (rozpoznanie mowy ElevenLabs,
   grosze, cache). Silnik `api` - raz, po renderze. Silnik `mcp` - dwa razy:
   po 4a (wtedy istnieje tylko audio avatarów, więc kontrola obejmuje je,
   zanim pójdzie HeyGen) i po 4c (cała lekcja; audio avatarów z cache). Raport `video/audio/kontrola/raport.md` wskazuje słowa,
   które generator dorzucił albo zgubił względem scenariusza, z czasem
   w pliku. To raport do odsłuchu, nie bramka: w bramce 5 podaj Rafałowi te
   miejsca (plik, sekunda, zdanie), żeby odsłuchał je przed oceną całości.
   Artefakt potwierdzony uchem = poprawka tekstu lektora w `scenariusz.md`
   przez `/kurs-lekcja` (zapis fonetyczny wg `wymowa.md` albo przeformułowanie
   zdania - TTS czyta scenariusz, sam wpis w `wymowa.md` niczego w głosie nie
   zmieni) i nowe audio całej lekcji (uprzedź o koszcie, krok 4). Pomiar tonu (`--ton`) jest eksperymentalny -
   nie uruchamiaj go bez prośby Rafała.
   **Lekcja z biletem - kontrola lektora bez bramki i bez pokazywania czegokolwiek Rafałowi** (wymaga
   `video.narrator_control: true` i `budget.stt: true`, krok 2; tor B z EDL; przy `narrator_control: false` albo
   `budget.stt: false` krok 4b pomijasz bez pytania, a brak klucza zatrzymuje według kroku 2):
   a. Decyzje kontroli i regeneracja (najwyżej jedna) idą po etapie 1, dokładnie tam, gdzie stawia je kolejność
      narzędzi: silnik `api` - po jednym przebiegu etapu 1, który renderuje narrację i avatary; silnik `mcp` - po
      pełnym etapie 1 następującym po `--plan-avatara` i avatarach z MCP (4c). Regeneracja zachowuje avatary:
      render avatara jest kluczowany numerem segmentu, odciskiem jego własnego tekstu i profilu głosu, więc
      nie powtarza się, dopóki jego słowa i głos się nie zmienią. Jedno polecenie:
      `npm run kontrola-lektora -- <lekcja> --decyzje` (samo uruchamia kontrolę).
      Podejrzenia w chunkach avatarów idą na kartę (`doKarty`), nie do regeneracji. Polecenie zapisuje `video/audio/kontrola/decyzje.json`
      (`wyciszenia`, `regeneracja`, `doKarty`) i drukuje
      `Wyciszenia: <n>; regeneracja: potrzebna (<n>) | niepotrzebna; do karty: <n>`.
   b. `regeneracja: potrzebna` i w `video/ticket.yaml` zostaje `tts_regenerations` (`spent` poniżej `budget`) →
      `npm run video -- <lekcja> --regeneruj-lektora` (silnik z `video.avatar_engine` kursu: przy `mcp` dodaj
      `--avatar=mcp`, avatary idą z cache), potem `kontrola-lektora -- <lekcja> --decyzje` jeszcze raz.
      Podejrzenie liczy się jako powtórzone dopiero po tym, jak narrację naprawdę wygenerowano ponownie (nowy
      stempel generacji obok markera, `video/audio/.lesson-generation.json` - także przy niezmienionym tekście);
      powtórzenia idą na kartę, a regeneracja jest najwyżej jedna we wszystkich uruchomieniach. W lekcji z biletem
      chunk „nie oceniono” (audio nie odpowiada scenariuszowi) też idzie na kartę, z przyczyną. Gdy licznik jest wyczerpany,
      `--decyzje` samo kieruje każdego kandydata na kartę - nie wołasz wtedy `--regeneruj-lektora`.
      `--regeneruj-lektora` odmawia po montażu, więc robisz to tylko tu, w etapie 1. Regeneracja nie wymaga
      pytania o koszt: zgodą jest budżet `tts_regenerations` w bilecie.
   c. Dalej tylko `edl` z `/kurs-nagrywanie` (jego krok 6; nagrania ujęć są już zrobione, krok 5 nie biegnie). Po `edl`:
      `npm run kontrola-lektora -- <lekcja> --zastosuj` dopisuje `wyciszenia` do `video/montaz/edl.json`, nie
      ruszając istniejących; odrzucone zakresy trafiają do `doKarty`.
   d. `doKarty` i powtórzenia `buduj` czyta sam, więc niczego nie dopisujesz. Odsłuch miejsc z raportu robi
      Rafał na karcie w bramce film z kartą lekcji (G5).
   Lekcja bez biletu: kontrola jak wyżej w tym kroku, a miejsca z raportu idą do Rafała w bramce 5.

**Zrzuty do artykułu (przed bramką 5, w lekcji z biletem przed G5).** Tylko lekcja z zamówieniami
`kind: screenshot` w `artykul-grafiki/zrodla/` (schemat, komendy, komunikaty:
`.claude/skills/kurs-lekcja/ilustracje.md`); reszta pomija ten blok. Po ostatnim renderze, gdy
`video/montaz/zrodla.json` i `edl.json` istnieją (bez nich, przy filmie zmontowanym w edytorze, zrzut nie
powstanie - zaproponuj plansze w miejsce zaślepek):
   a. `cd tools/course-pipeline && npm run ilustracje -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --rodzaj screenshot`
      (bez płatnych wywołań; zaślepki zamieniają się w zrzuty z ujęć montażu, niezmienione to `POMINIĘTO`).
      Zrzut, którego kroku nie da się rozstrzygnąć (brak ujęcia, brak kroku albo znaczników, film nie pokazał
      kroku, okno podręczne bez własnych znaczników), kończy się `BŁĄD:` z przyczyną: cytujesz ją dosłownie
      i proponujesz w jego miejsce planszę (zamówienie `kind: board` pod tą samą nazwą, potem
      `npm run ilustracje -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y --tylko <nazwa>`; linia obrazka
      w artykule zostaje). Innej klatki ani innego kroku nie bierzesz po cichu.
   b. **Adresy e-mail.** Narzędzie rozmywa w zrzucie tylko to, co rozmył film (`rozmycie` z `edl.json`), i
      prostokąty `screenshot.blur` z zamówienia; samo adresów nie wykrywa, więc adres zostawiony w filmie (konto
      kursu w lekcji 3.1) trafia do zrzutu. Zrzut nie pokazuje żadnego adresu e-mail, także konta kursu: otwórz
      każdy zrzut sam i każdy adres, który widzisz albo który wskaże przegląd, zakryj prostokątem
      `screenshot.blur` (albo innym `crop`), potem `--tylko <nazwa>` i otwórz nowy PNG. Prostokąt jest
      w pikselach nagrania, nie PNG: wyciągnij pełną klatkę z `produced.take` (ścieżka względem `kursy/<slug>/`)
      w sekundzie `produced.second` zamówienia, odczytaj na niej ramkę adresu i dodaj ok. 10 px z każdej
      strony (kroki i komenda: `ilustracje.md`, sekcja „Privacy review”). Adresu e-mail nigdy nie zostawiasz
      przez `privacyAccepted`.
   c. `npm run ilustracje -- prywatnosc ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (objęte zgodą z bramki 2,
      w lekcji z biletem `budget.screenshot_review`; przy „bez przeglądu zrzutów” albo `false` pomijasz) -
      jedno wywołanie Gemini, raport `review-zrzutow.md` w folderze lekcji z sha256 każdego PNG.
   Bramka (5 albo G5, w turze obok ścieżek filmu i karty) wymienia każdy zrzut: pełna ścieżka PNG w bloku kodu
   i werdykt (`OK`, `POMINIĘTO`, `OSTRZEŻENIE` - uwaga zaakceptowana, `BŁĄD` - uwagi bez akceptacji, cytowane
   dosłownie). `BŁĄD` blokuje ten zrzut, dopóki go nie poprawisz (prostokąt `screenshot.blur` albo inny `crop`
   w zamówieniu, potem `--tylko <nazwa>` i `prywatnosc` ponownie). Uwagę inną niż adres e-mail (imię, nazwa
   konta, drugie konto Google, klucz, saldo, tekst etykiety) Rafał może też wprost zaakceptować; akceptację
   zapisujesz w zamówieniu jako
   `privacyAccepted: { hash: <sha256 z linii BŁĄD>, note: "<RRRR-MM-DD>: <słowa Rafała>" }`; ponownie
   wyrenderowany PNG ma inny sha256 i potrzebuje nowej akceptacji. Bez jego słów `privacyAccepted` nie powstaje.
   Po zapisaniu akceptacji uruchom jeszcze raz
   `npm run ilustracje -- prywatnosc ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` przed commitem: PNG nie zmienił
   się od przeglądu, więc nie ma wywołania modelu, a przebieg wypisze dla tego zrzutu `OSTRZEŻENIE` i zapisze
   akceptację w `review-zrzutow.md` (`zaakceptowany: tak`). Prod (`/kurs-publikuj`) odmawia każdego zrzutu,
   którego obecny PNG nie ma ani przeglądu z werdyktem `ok`, ani akceptacji Rafała tego PNG (`privacyAccepted`
   z jego sha256).
   **Bez przeglądu** („bez przeglądu zrzutów” albo `budget.screenshot_review: false`) zrzuty są nieprzejrzane:
   bramka wymienia je z werdyktem „nieprzejrzany”, a na staging idą dopiero, gdy Rafał obejrzy każdy PNG
   i powie to wprost (jego słowa cytujesz w turze bramki) albo gdy przegląd przejdzie później. Na prod taki zrzut
   potrzebuje przeglądu albo akceptacji Rafała tego PNG (jak wyżej). Adresy e-mail zakrywasz i tak, jak
   w punkcie b.
5. **BRAMKA: Rafał ogląda `video/final.mp4`** (lokalnie — plik nie trafia do
   git, patrz Zasady). Uwagi Rafała: jeśli dotyczą treści segmentu
   (scenariusz/slajdy), wróć do `/kurs-lekcja`, popraw treść, usuń
   nieaktualne pliki pośrednie tego segmentu w `video/audio/`
   (nazwa pliku zawiera hasz tekstu — zmieniony tekst i tak wygeneruje nowy
   plik) i uruchom `npm run video` ponownie. **Dla toru B: jeśli poprawka
   zmienia treść narracji screencastów** (nie tylko montaż), sama zmiana
   `scenariusz.md` nie wystarczy — dopóki `video/nagranie-z-lektorem.mp4`
   istnieje, kolejny `npm run video` idzie od razu w etap spięcia ze STARĄ
   paczką lektora. Usuń albo przenieś ten plik (przenieś, jeśli stary montaż
   ma zostać zachowany — plik nie jest odtwarzalny), dopiero potem uruchom
   `npm run video`, żeby dostać odświeżoną paczkę lektora do etapu 1. Jeśli
   uwaga dotyczy wyłącznie toru B (lektor pada w złym momencie, tempo,
   przycięcie) — Rafał poprawia montaż we własnym edytorze i eksportuje
   `video/nagranie-z-lektorem.mp4` ponownie, potem uruchom `npm run video`
   (etap spięcia); jeśli materiału zwyczajnie brakuje, Rafał dokrywa
   nagranie. Za długich cisz NIE traktuj jako usterki — Rafał skraca je w
   postprodukcji.
   **Lekcja z biletem: bramka film z kartą lekcji (G5).** Zamiast bramki 5 w brzmieniu wyżej: (1) po ostatnim
   renderze `cd tools/course-pipeline && npm run karta -- buduj ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`,
   zapisuje `video/lesson-card.md`; (2) commit `video/karta.json` i `video/lesson-card.md` (reguły commitów na
   początku pliku); (3) bramka pokazuje **pełną ścieżkę** `video/final.mp4` i `video/lesson-card.md`, każdą w
   bloku kodu - kontrole lektora, kadry znaku AI i ostrzeżenia montażu są już na karcie, nie przepisujesz ich do
   tury. Przed bramką sprawdź `npm run znak-ai -- kontrola <lekcja>` (kurs z `znak_ai`; po drugim niezaliczeniu
   znaku nie ma `final.mp4`, więc pomijasz ją i bramka pokazuje `odrzucony.mp4` zamiast filmu). Uwagi Rafała do treści
   wracają do `/kurs-lekcja` albo `/kurs-uwagi` jak wyżej, uwagi do montażu - do `/kurs-montaz`; po każdym
   ponownym renderze `buduj` przed następną bramką. `status.video: zaakceptowane` tylko na jego słowo.
   Lekcja bez biletu: bramka 5 bez zmian.
6. **Po akceptacji przez Rafała:** ustaw `status.video: zaakceptowane` w
   `lekcja.yaml`. Lekcja bez biletu: zmiany zostają niezacommitowane — commit robi Rafał;
   do zacommitowania jest sam `lekcja.yaml`, media binarne są w `.gitignore`.
   **Lekcja z biletem:** w tym repozytorium sesja sama commituje ścieżki lekcji: `lekcja.yaml` razem z
   niezacommitowanymi `video/karta.json` i `video/lesson-card.md`, według reguł z początku pliku
   (`git commit -m … -- <ścieżki>`, `git add --` tylko dla ścieżki nieśledzonej, ścieżki z cudzymi zmianami
   pominięte i nazwane w turze, bez pusha).
   **Wgranie na Vimeo (ta sama tura).** Jeśli `kurs.yaml` kursu ma `vimeo.automat: true`, zaraz po ustawieniu
   statusu uruchom w tle (wgranie trwa minuty) `cd tools/course-pipeline && npm run vimeo -- <ścieżka lekcji>`.
   - Sukces: w turze podaj linię `OK: …` (ID wideo), link `https://vimeo.com/manage/videos/<id>`, stan
     transkodowania i każdą linię `OSTRZEŻENIE:` dosłownie. Do reguły commitu z tego kroku dochodzą
     `lekcja.yaml` (klucz `vimeo`), nowy `video/vimeo.json` i — przy pierwszym wgraniu kursu, gdy pipeline
     założył folder — `kurs.yaml` (`vimeo.folder`): lekcja z biletem w commicie sesji, lekcja bez biletu
     zostaje dla Rafała.
   - Błąd: akceptacja zostaje (`status.video: zaakceptowane` się nie cofa). Zacytuj linię `BŁĄD:` dosłownie
     i podaj komendę do ponowienia. Ponowienie jest bezpieczne: `video/vimeo.json` prowadzi do tego samego
     wideo, nigdy do drugiego.
   - **Staging.** Gdy `npm run vimeo` wypisało `OK: …` (wideo utworzone albo podmienione), w tej samej turze
     wyślij tę lekcję na staging według sekcji „Wysyłka na staging (wołają ją inne skille)” w pliku `.claude/skills/kurs-publikuj/SKILL.md`
     (przeczytaj tę sekcję; nie wołaj skilla `/kurs-publikuj`, bo ten jest tylko na prod)
     (aktywność wideo powstaje, bo `lekcja.yaml` ma już `vimeo`). Przy błędzie wgrania nic nie wysyłasz.
     Wysyłka niesie też zrzuty do artykułu (PNG z `artykul-grafiki/`, które `npm run ilustracje` zrobił
     w miejscu zaślepek), bez osobnego kroku. Zrzut z `BŁĄD` przeglądu prywatności bez `privacyAccepted` albo
     zrzut nieprzejrzany bez słów Rafała wstrzymuje ją (blok „Zrzuty do artykułu” przed bramką 5); wysyłka
     idzie w tej turze, w której rozstrzygniesz ostatni taki zrzut.
     Wysyłka nie jest bramką: jej błąd pokazujesz dosłownie z komendą ponowienia, a akceptacja i wgranie
     zostają. `platformIds` zapisane przez wysyłkę leżą w `lekcja.yaml` i `kurs.yaml` — dochodzą do reguły
     commitu z tego kroku jak klucz `vimeo`.
   - Kurs bez `vimeo.automat: true`: jedna linia „kurs bez automatu Vimeo” i nic więcej.

## Zaległe filmy na Vimeo

Lekcje zaakceptowane, zanim kurs dostał `vimeo.automat: true`, albo takie, którym wgranie w kroku 6 padło.

1. Lista bez zapisu: `cd tools/course-pipeline && npm run vimeo -- zalegle ../../kursy/<slug>` (albo
   `../../kursy` dla wszystkich kursów z włączonym automatem). Pokaż tabelę Rafałowi: lekcja, plik i rozmiar,
   znak AI, `wznowienie <id>` (lekcja z przerwanym wgraniem) i ID filmów o tym samym tytule już na koncie,
   suma rozmiarów wobec wolnego miejsca.
2. Wgranie dopiero na „OK” Rafała: ta sama komenda z `--wykonaj`. Lekcja z filmem o tym samym tytule na koncie
   jest pomijana, chyba że Rafał wskaże ją wprost — wtedy `--mimo-tytulu=<ścieżka lekcji>` (flaga powtarzalna).
3. Po przebiegu: tabela wgranych, pominiętych i nieudanych; commit `lekcja.yaml` i `video/vimeo.json` wgranych
   lekcji (i `kurs.yaml`, jeśli pipeline założył folder) wg reguł repozytorium.

**Domeny osadzania.** Po zmianie `VIMEO_EMBED_DOMAINS` w `tools/course-pipeline/.env`:
`npm run vimeo -- domeny ../../kursy/<slug>` pokazuje rozjazd (brakujące i nadmiarowe hosty) dla lekcji z
`video/vimeo.json` w stanie `done`; z `--wykonaj` dopiero na „OK” Rafała. Filmów wgranych ręcznie nie rusza.

## Zasady

- Tor B: jedyne audio screencastów w `final.mp4` pochodzi z
  `nagranie-z-lektorem.mp4` (lektor wmontowany przez Rafała); avatary mają
  własny dźwięk. Paczka `video/lektor/` jest odtwarzalna,
  `nagranie-z-lektorem.mp4` NIE — jak surowe nagranie, backup po stronie
  Rafała.
- Silnik avatara wybiera Rafał, nigdy skill: brak wskazania w komendzie =
  pytanie w bramce (krok 2), nie cichy start na API. W lekcji z biletem silnik pochodzi z
  `kurs.yaml` `video.avatar_engine`, ustalonego na słowo Rafała na karcie bilet produkcyjny (G1); brak klucza
  zatrzymuje render z nazwą klucza (krok 2), nigdy nie jest `api`. To decyzja o tym, z czego
  schodzą pieniądze (plan konta przez MCP vs kredyty API), a nie detal
  techniczny. Flaga CLI bez `--avatar=` domyśla się `api` — dlatego pełny
  render bez świadomej decyzji jest zakazany.
- Silnik `mcp`: generacja nieudana → pokaż `failure_message` i zatrzymaj się.
  **Bez automatycznego fallbacku na API** — cel silnika to rozliczenia OAuth;
  cichy fallback wydałby kredyty API. Świadome dokończenie przez API = ponowny
  `npm run video` bez flagi (cache zachowuje segmenty zrobione przez MCP).
- Silnik `mcp` nie zmienia lektora: mowa zawsze z ElevenLabs, HeyGen robi
  wyłącznie lip-sync do gotowego audio (jak w silniku `api`).
- Tor A: segment ze `screencast` w scenariuszu lekcji `prezentacja` to błąd
  danych — przerwij i zgłoś. Tor B: segment ze `slajd` to błąd danych
  (lekcje `demo` nie mają `slajdy.md`) — przerwij i zgłoś.
- Media generowane (`video/audio/`, `video/avatar/`, `video/slajdy/`,
  `video/klipy/`, `video/lektor/`, `video/final.mp4`) są w `.gitignore` —
  odtwarzalne ponownym uruchomieniem `npm run video`; `final.mp4` trafia na
  Vimeo w kroku 6 (kurs z `vimeo.automat`). NIE dodawaj ich ręcznie do git.
  `video/nagranie.mp4` i `video/nagranie-z-lektorem.mp4` też są w
  `.gitignore`, ale **nie są odtwarzalne** — to prawdziwy materiał źródłowy,
  backup to odpowiedzialność Rafała.
- Lektor: domyślnie `eleven_v4` z głosem `ELEVENLABS_VOICE_ID` z `.env`; kurs może przypiąć
  model i głos w `kurs.yaml` (`lektor.model`, `lektor.voice_id` — `misja-ai-start` jest
  przypięta do v2). Avatar HeyGen to `HEYGEN_AVATAR_ID` w `.env`. Głosu, modelu ani avatara
  nie wybierasz sam — zmienia je Rafał.
- **Ustawienia głosu modelu** to ustawienia modelu w `ELEVENLABS_MODELS` (`src/config.js`): dla v2 stability, style, speed, dla v4 tylko stability i similarity. Wartości
  dobiera się **odsłuchem, nie w ciemno**:
  `npm run tts-proba -- <lekcja> [--segment=N] [--pauza=S]` generuje ten sam
  akapit w kilku wariantach (dla v2 cztery, w tym „baseline" z bazowym
  brzmieniem konta; dla v4 trzy warianty stability: 0,35 / 0,5 / 0,7) do
  `experiments/tts-proba/` wraz ze `spis.md`. Rafał odsłuchuje i wskazuje
  zwycięzcę — dopiero wtedy wpisujesz wartości do `config.js`. Sam nie
  zmieniaj brzmienia lektora i nie odpalaj próbek bez jego zgody (płatne API).
  Osobna sprawa niż `PAUZA_W_MOWIE_S` (cisza przed frazami-przejściami,
  `src/pauzy.js`) — tę kalibruje flaga `--pauza`.
- Intro/outro: w kursie z `oprawa` w `kurs.yaml` z kursu (oba tory, pliki
  `kursy/_wspolne/oprawa/`); inaczej z bramki `/kurs-montaz`: gdy lekcja ma
  `video/montaz/zrodla.json`, etap 2 dokleja wskazane tam intro na początku
  i outro na końcu `final.mp4` — bez zmian treści (jak avatary: tylko
  przekodowanie do wspólnego formatu klipów). Brak pliku = czysty montaż
  segmentów, jak dotąd. Intro i outro są wspólne dla wszystkich kursów:
  `kursy/_wspolne/oprawa/intro.mp4` i `outro.mp4` — bramka `/kurs-montaz`
  proponuje je jako pierwsze.
- Do CMS wysyła wyłącznie na staging, według sekcji „Wysyłka na staging (wołają ją inne skille)”
  w `/kurs-publikuj` (krok 6, po `OK:` z `npm run vimeo`); na prod nigdy — to `/kurs-publikuj`. Na Vimeo wgrywa wyłącznie przez
  `npm run vimeo` (krok 6 i „Zaległe filmy na Vimeo”); nigdy niczego na Vimeo nie usuwa.
