---
name: kurs-video
description: Rendering video lekcji obu torów — tor A (typ_video prezentacja: slajdy Marp + TTS + avatar) i tor B (typ_video demo: dwuetapowy montaż ręczny — system generuje paczkę lektora TTS i avatary, Rafał nakłada lektora na nagranie w edytorze, system spina całość). Montaż ffmpeg. Używaj, gdy Rafał chce wygenerować lub poprawić final.mp4 dla zatwierdzonej lekcji.
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
   - **Dla `typ_video: demo` dodatkowo:** układ scenariusza musi być avatar →
     screencasty → avatar (waliduje render). Etap renderu zależy od
     `video/nagranie-z-lektorem.mp4`: brak pliku = etap materiałów (paczka
     lektora + avatary), plik jest = finalne spięcie. Surowe
     `video/nagranie.mp4` jest materiałem roboczym Rafała do edytora —
     pipeline go nie czyta.
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
   `slajdy.odslanianie` w `kurs.yaml`.
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
        `[{numer, hasz, audio, cel}]` (TTS chunków avatarowych już
        wygenerowany; ten tryb generuje tylko avatary, więc pełny render po
        nim policzy łańcuch lekcji od nowa — to zamierzone, avatary HeyGen
        idą za `cel` i przeżywają).
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
   Rafała, zanim odpalisz render po zmianie ustawień. Slajdy Marp → PNG,
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
   nagrania ekranu nie robi człowiek - po paczce lektora uruchom
   `/kurs-nagrywanie` (automat Playwrighta nagrywa ujęcia i pisze EDL), potem
   `/kurs-montaz` od kroku zaznaczeń i plansz (EDL już wypełniony), potem etap 2. Po zmianie treści scenariusza przypomnij
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
6. **Po akceptacji przez Rafała:** ustaw `status.video: zaakceptowane` w
   `lekcja.yaml`. Zmiany zostają niezacommitowane — commit robi Rafał;
   do zacommitowania jest sam `lekcja.yaml`, media binarne są w `.gitignore`.

## Zasady

- Tor B: jedyne audio screencastów w `final.mp4` pochodzi z
  `nagranie-z-lektorem.mp4` (lektor wmontowany przez Rafała); avatary mają
  własny dźwięk. Paczka `video/lektor/` jest odtwarzalna,
  `nagranie-z-lektorem.mp4` NIE — jak surowe nagranie, backup po stronie
  Rafała.
- Silnik avatara wybiera Rafał, nigdy skill: brak wskazania w komendzie =
  pytanie w bramce (krok 2), nie cichy start na API. To decyzja o tym, z czego
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
  odtwarzalne ponownym uruchomieniem `npm run video`, docelowo trafiają na
  Vimeo przez `/kurs-publikuj`. NIE dodawaj ich ręcznie do git.
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
- NIE publikuje do CMS/Vimeo — to `/kurs-publikuj` (kolejny etap).
