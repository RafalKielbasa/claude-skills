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
   - **Dla `typ_video: demo` dodatkowo:** układ scenariusza musi być avatar →
     screencasty → avatar (waliduje render). Etap renderu zależy od
     `video/nagranie-z-lektorem.mp4`: brak pliku = etap materiałów (paczka
     lektora + avatary), plik jest = finalne spięcie. Surowe
     `video/nagranie.mp4` jest materiałem roboczym Rafała do edytora —
     pipeline go nie czyta.
     Dokumentem do nagrywania jest `video/plan-nagrania.md` (kroki ekranu obok
     narracji i nazw plików lektora). Jeśli go nie ma albo `npm run validate`
     zgłasza, że jest nieaktualny — przegeneruj przed nagraniem:
     `npm run plan-nagrania -- <lekcja>`.
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
4. **Uruchom rendering** wg silnika wybranego w bramce:
   - **Silnik `api`:**
     `cd tools/course-pipeline && npm run video -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
   - **Silnik `mcp`:**
     a. `npm run video -- <lekcja> --plan-avatara` — wypisze JSON
        `[{numer, hasz, audio, cel}]` (TTS segmentów avatarowych już
        wygenerowany, z cache).
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
   Kroki wewnętrzne (slajdy Marp → PNG dla toru A, TTS per segment, avatar
   dla segmentów `[ekran: avatar]`, montaż ffmpeg) mają cache po istnieniu
   pliku — przerwany proces można bezpiecznie uruchomić ponownie, gotowe
   pliki się nie regenerują. **Nazwa pliku audio zawiera odcisk całego
   żądania TTS** (tekst + model + `voice_settings`), więc zmiana brzmienia
   lektora — `ELEVENLABS_VOICE_SETTINGS` w `src/config.js` albo nadpisania
   `ELEVENLABS_*` w `.env` — unieważnia cache całej lekcji: kolejny render
   generuje audio od nowa (i avatary, bo idą za haszem audio). To realny
   koszt API; uprzedź Rafała, zanim odpalisz render po zmianie ustawień.
   **Tor B — dwa etapy:** pierwszy `npm run video` kończy się komunikatem z
   paczką lektora (`video/lektor/spis.md` — pliki NN-FF.mp3 z długościami).
   Przekaż Rafałowi ścieżkę spisu; Rafał montuje lektora z nagraniem w
   edytorze, eksportuje `video/nagranie-z-lektorem.mp4` i wtedy ponowny
   `npm run video` spina final. Po zmianie treści scenariusza przypomnij
   Rafałowi, że zmontowany materiał trzeba zaktualizować ręcznie — pipeline
   tego nie wykryje.
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
   `lekcja.yaml`, commit `kurs(<slug>): video lekcji NN-y zaakceptowane`
   (commitujesz tylko `lekcja.yaml` — media binarne są w `.gitignore`).

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
- Głos ElevenLabs i avatar HeyGen są obecnie placeholderami (dowolne realne
  ID z konta Rafała) — jeśli okażą się docelowo złe, Rafał podmieni
  `ELEVENLABS_VOICE_ID`/`HEYGEN_AVATAR_ID` w `.env`; nie wybieraj ich sam.
- **Interpunkcja i intonacja lektora** to `ELEVENLABS_VOICE_SETTINGS`
  w `src/config.js` (stability, style, speed — niższa stability i speed
  poniżej 1 dają słyszalne przecinki i żywszą melodię zdania). Wartości
  dobiera się **odsłuchem, nie w ciemno**:
  `npm run tts-proba -- <lekcja> [--segment=N] [--pauza=S]` generuje ten sam
  akapit w kilku wariantach (w tym „baseline" bez ustawień) do
  `experiments/tts-proba/` wraz ze `spis.md`. Rafał odsłuchuje i wskazuje
  zwycięzcę — dopiero wtedy wpisujesz wartości do `config.js`. Sam nie
  zmieniaj brzmienia lektora i nie odpalaj próbek bez jego zgody (płatne API).
  Osobna sprawa niż `PAUZA_W_MOWIE_S` (cisza przed frazami-przejściami,
  `src/pauzy.js`) — tę kalibruje flaga `--pauza`.
- Bez intro/outro z szablonu marki — nie istnieje jeszcze plik szablonu w
  `kursy/_wspolne/`. `final.mp4` to na razie czysty montaż segmentów.
- NIE publikuje do CMS/Vimeo — to `/kurs-publikuj` (kolejny etap).
