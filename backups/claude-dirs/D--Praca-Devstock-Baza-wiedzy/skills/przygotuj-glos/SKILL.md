---
name: przygotuj-glos
description: Wycina z dowolnego nagrania audio lub wideo (filmy, live'y, podcasty, mp3, wav) próbkę głosu wskazanej osoby na podstawie wskazanego fragmentu „prawidłowego dźwięku” albo numeru głosu z listy mówców, którą narzędzie samo tworzy z podglądami do odsłuchu (gdy użytkownik nie zna minuty wzorca) — dopasowuje głos i brzmienie (mikrofon, pomieszczenie), oczyszcza głos z szumu, muzyki i efektów, zostawia całkowitą ciszę w pauzach, tnie wyłącznie w ciszy (pełne słowa), usuwa innych mówców, „yyy”, oddechy, a zachowuje śmiech i okrzyki dla różnorodności; składa wszystko w jeden plik probka.mp3 z raportem i mapą źródeł, np. pod klon głosu ElevenLabs (PVC, Eleven v4). Użyj, gdy użytkownik mówi m.in. „wytnij próbkę głosu z tego nagrania”, „przygotuj próbki głosu”, „wytnij mój głos z nagrań/filmów”, „zrób próbkę do ElevenLabs”, „klon głosu z live'ów”, „ten fragment brzmi dobrze, wytnij wszystko podobne”, „wytnij głos tej drugiej osoby/gościa/prowadzącego”, „kto mówi w tym nagraniu”, „nie wiem, w której minucie”, albo zgłasza usterkę z odsłuchu („w probka na 5:10 jest yyy”, „słychać muzyczkę”, „szumi”, „ucięte słowo”, „słychać oddech”, „to nie mój głos”, „brakuje śmiechu”). Także gdy pyta, jak wgrać próbki do ElevenLabs i douczyć klon na v4.
---

# Próbka głosu z dowolnego nagrania (voiceprep)

Użytkownik wskazuje fragment „prawidłowego dźwięku” (np. 10–30 s, w których mówi tylko on, czysto,
właściwym mikrofonem). Narzędzie wycina z całego materiału wszystko, co brzmi jak ten wzorzec,
i składa w **jeden plik** `probka.mp3`.

Gdy użytkownik nie zna minuty wzorca, narzędzie najpierw samo znajduje głosy (`-Speakers`): dla każdego
robi 20-sekundowy podgląd `mowcy/mowca_N.wav` i wiersz w `mowcy/mowcy.md`. Użytkownik słucha i podaje
numer (`-Speaker 2`), a narzędzie wybiera z mowy tej osoby 1–3 najpewniejsze fragmenty jako wzorzec
i dalej działa tak samo jak z ręcznym wzorcem.

## Gdzie co leży

Polecenia uruchamiaj z katalogu głównego repo.

| Co | Gdzie |
|---|---|
| Narzędzie (jedyna wersja kodu) | `tools/voiceprep/voiceprep.py` |
| Uruchamianie jednym poleceniem | `tools/voiceprep/uruchom.ps1` (znajduje pliki po fragmencie nazwy, także z emotkami); głos wskazuje dokładnie jedno z: `-Ref`, `-Speakers` (lista głosów), `-Speaker "N"` |
| Lista głosów (po `-Speakers`) | `<out>/mowcy/`: `mowca_N.wav` (podgląd), `mowcy.md` (mowa, nagrania, pierwsze wystąpienie, przykładowe zdanie), `mowcy.json` (wzorce, odciski) |
| Oczyszczanie głosu (osobne środowisko) | `tools/voiceprep/enhance.py` — MossFormer2_SE_48K przez `.venv-enh` |
| Lokalizacja uwag z odsłuchu | `tools/voiceprep/gdzie.py` |
| Sprawdzenie gotowości (niczego nie instaluje) | `tools/voiceprep/sprawdz.ps1`: Python 3.12, ffmpeg, oba środowiska z importem pakietów, 4 modele, GPU; kod 0 = gotowe |
| Instalacja wszystkiego, uzupełnia tylko braki | `tools/voiceprep/instaluj.ps1`: Python 3.12 i ffmpeg (winget), `.venv`, `.venv-enh` (`requirements*.lock.txt`), modele (`pobierz_modele.py`), na końcu `sprawdz.ps1` |
| Środowiska i modele (~13,5 GB) | `%USERPROFILE%\Documents\voice-prep` (`.venv`, `.venv-enh`, `models`); zmienna `VOICEPREP_HOME` |
| Zalecenia ElevenLabs dla v4 | `elevenlabs-v4.md` (obok tego pliku) |

Python do skryptów pomocniczych: `$HOME/Documents/voice-prep/.venv/Scripts/python`.
Narzędzie nie działa na niepełnej instalacji: `uruchom.ps1` odmawia pracy (kod 3), a `voiceprep.py` kończy
się od razu przy braku ffmpeg lub środowiska oczyszczania (pominięcie oczyszczania tylko świadomie: `--no-enhance`).

## Co robi narzędzie (kolejność)

1. ffmpeg → mono 48 kHz; Whisper large-v3 → słowa z czasami (pamięć podręczna `<out>/_cache`).
2. Odcisk głosu ECAPA vs wzorzec → odrzuca innych mówców.
3. **Oczyszczanie MossFormer2** całego nagrania (raz, ok. 5 min na godzinę nagrania na RTX 4080): usuwa
   szum, muzykę, efekty. Cięcie i wynik idą z wersji oczyszczonej.
4. Silero VAD → odcinki mowy; **odcinek wchodzi w całości albo wcale** (pełne słowa). Odpada, gdy ma
   inny głos, „yyy”, ukryte „yyy” (słowo za długie jak na liczbę liter, `--stretch`), falstart,
   niewyraźne słowo, mowę niezapisaną przez Whispera.
5. **Ekspresja:** AST przywraca odrzucone odcinki z **Twoim** śmiechem lub okrzykiem (głos pasuje
   łagodniejszym progiem albo przylega do Twojej mowy bez innych mówców obok). Okrzyki nie odpadają
   za szczyt — są ściszane tak, by się zmieściły. Miejsca wskazane przez użytkownika z odsłuchu dołącza
   `--include "nazwa*@mm:ss-mm:ss=smiech"` (mimo filtrów, granice do ciszy), a `--include-raw` z oryginału.
6. **Brzmienie jak wzorzec:** barwa (40 pasm, mediana z ±60 s, `--timbre` 5 dB) i tło nie głośniejsze
   niż we wzorcu (`--bg-margin`). Opcjonalnie `--match-eq` wyrównuje barwę każdego nagrania do wzorca
   korektorem o liniowej fazie (tercje, ±`--eq-max` 6 dB, krzywe w `korekcja_barwy.csv`; wzorzec barwy
   osobno przez `--eq-ref "nazwa*@mm:ss-mm:ss"`), a `--level` wyrównuje głośność wypowiedzi (70%, ±6 dB).
7. Pauzy i wycięte oddechy → **cyfrowa cisza** (`--pause-fill silence`). Głośność −20 dB RMS,
   true peak −3 dB, limiter tylko na plozje.
8. Wynik: `probka.mp3` (320 kbps, 48 kHz), `raport.md`, `fragmenty.csv`, `mapa.csv`, `do_odsluchu/`.

## Przebieg pracy

0. **Sprawdź gotowość — zawsze przed pierwszym przebiegiem w sesji:**
   `powershell -NoProfile -File tools/voiceprep/sprawdz.ps1`.
   Kod 0 → dalej. Kod 1 → nie uruchamiaj narzędzia i nie obchodź braków (np. `--no-enhance`, inny model)
   bez decyzji użytkownika. Pokaż listę braków i poproś o zgodę na instalację, podając rozmiar (do ok.
   13,5 GB; Python 3.12 i ffmpeg z winget, z akceptacją ich licencji). Po zgodzie uruchom `instaluj.ps1`
   w tle i po nim jeszcze raz `sprawdz.ps1`. Pracuj dalej dopiero przy kodzie 0.
1. **Zbierz wejście:** folder lub pliki (tylko główny poziom folderu; podfoldery z `--recursive`);
   język (`--lang pl`, `auto`); który głos. Głos wskazuje się na jeden z dwóch sposobów:
   - **zna minutę:** 1–3 fragmenty wzorca (fragment nazwy pliku + czas, np. `kodo*@06:45-07:15`), każdy
     to osobny przykład dobrego dźwięku → od razu krok 2;
   - **nie zna minuty albo opisuje osobę** („wytnij gościa”, „ten drugi głos”) → najpierw lista głosów:
     ```
     powershell -NoProfile -File tools/voiceprep/uruchom.ps1 -Dir "<folder>" -Speakers
     ```
     Trwa tyle co transkrypcja (bez oczyszczania); wynik zostaje w pamięci podręcznej, więc krok 2 jej
     nie powtarza. Pokaż tabelę z `<out>/mowcy/mowcy.md` i poproś o odsłuch `mowca_N.wav`.
     **Numer wybiera użytkownik po odsłuchu.** Dopasowanie opisu do numeru (przykładowe zdanie,
     pierwsze wystąpienie) możesz zaproponować, ale go nie zakładaj. Ta sama osoba bywa rozbita na
     dwa numery (inny mikrofon, krzyk): wtedy `-Speaker "1,3"`.
   Przy klonie PVC przypomnij: tylko własny głos. Cudzy głos tylko za zgodą tej osoby.
2. **Uruchom w tle** (`run_in_background`), z wzorcem albo z numerem głosu:
   ```
   powershell -NoProfile -File tools/voiceprep/uruchom.ps1 -Dir "<folder>" -Ref "kodo*@06:45-07:15;przesta*pami*@05:00-05:30" -Extra "--min-snr 0"
   powershell -NoProfile -File tools/voiceprep/uruchom.ps1 -Dir "<folder>" -Speaker "2"
   ```
   `-Out` domyślnie `<folder>\pvc`; `-Extra` przekazuje opcje (`voiceprep.cmd -h`). Przy `-Speaker`
   z tym samym `-Out` co lista; gdy nagrania się zmieniły, lista liczy się od nowa i numery mogą się
   przesunąć (narzędzie to zgłasza) — wtedy pokaż nową tabelę przed dalszą pracą.
3. **Przeczytaj `<out>/raport.md`** i przekaż: długość (PVC: min 30 min, zalecane 2–3 h), ile
   śmiechu/okrzyków, z których nagrań ile (`mapa.csv`), co wycięto, kolumny „Podob.” i „Barwa”.
   Wskaż `do_odsluchu/ekspresja_*.wav` do sprawdzenia, czy śmiech jest użytkownika.
4. **Nie zalecaj użycia próbki przed odsłuchem użytkownika.** Jakość oceniasz pomiarami — mów to.

## Uwaga z odsłuchu → działanie

Najpierw zlokalizuj miejsce:
```
"$HOME/Documents/voice-prep/.venv/Scripts/python" tools/voiceprep/gdzie.py "<out>" probka 0:34 1:06
```

| Objaw | Zwykła przyczyna | Działanie |
|---|---|---|
| „yyy”, „eee” | Whisper nie zapisuje wtrąceń, tylko wydłuża sąsiednie słowo | obniż `--stretch` (0.25 → 0.2) |
| szum lub muzyka pod mową | oczyszczanie wyłączone albo za słabe | sprawdź w raporcie „oczyszczony”; jeśli tak — pomiń to nagranie |
| metaliczny, „podwodny” głos | artefakty oczyszczania (v4 je sklonuje) | porównaj z oryginałem; rozważ `--no-enhance` dla tego materiału |
| niewyraźnie, „bełkot” w części próbki | słabsze nagrania źródłowe (transmisja, mikrofon); pomiary zniekształceń tego nie wskazują | zapytaj, który zakres `probka.mp3` brzmi dobrze; `mapa.csv` → to nagranie; `--ref` z 1–2 czystych 30 s tego nagrania (okna bez „inny mówca” w `fragmenty.csv`); sprawdź, czy wynik ≥ 30 min |
| brakuje śmiechu / okrzyków | AST nie wykrywa ich w mowie z live'ów; oczyszczanie je przycisza | kandydaci AST (niski próg) do odsłuchu; potwierdzone miejsca `--include …=smiech` albo `--include-raw`; inaczej nagrać osobno |
| nagrania brzmią jak z różnych sesji (barwa, głośność) | inne mikrofony i ustawienia live'ów | `--match-eq --level`; wzorzec barwy z nagrania, które użytkownik uznał za najlepsze (`--eq-ref`) |
| dźwięk w pauzach | `--pause-fill tone` albo niedokładne granice | domyślnie pauzy są ciszą (`silence`) |
| ucięta końcówka słowa | granica za blisko | `--quiet-db 28` |
| oddech | Silero doliczył go do mowy | zgłoś miejsce przez `gdzie.py`; dostrajaj `VAD_PAD_MS` w kodzie |
| przy `-Speaker`: w próbce zły głos albo tylko część mowy osoby | zły numer albo osoba rozbita na dwa numery | odsłuch `mowcy/mowca_N.wav`; podaj oba numery `-Speaker "1,3"` |
| cudzy głos / cudzy śmiech | progi | `do_odsluchu/`; podnieś `--threshold` (0.55–0.6); śmiech: `--no-expressive` |
| inne brzmienie (mikrofon) | próg barwy | obniż `--timbre` (4); kolumna „Barwa” w raporcie |
| za mało materiału | filtry działają zgodnie z zamiarem | więcej nagrań (najlepiej czytanie z tekstu); łagodniej `--stretch 0.35`, `--timbre 6` |

Po każdej zmianie uruchom to samo polecenie z nowym `-Extra` — przebieg trwa minuty (pamięć podręczna).
Zawartość `probka.mp3` się zmienia, stare czasy z odsłuchu przestają pasować — powiedz to. Sprawdź
w `fragmenty.csv` lub `gdzie.py`, że zgłoszone miejsca zniknęły, zanim to ogłosisz.

## Pułapki (pierwsze wdrożenie, 2026-10-06, 8 live'ów ~12 h)

- **Pliki podglądu w folderze wejściowym trafiły do wyniku** → domyślnie bez podfolderów; własne
  podglądy zapisuj poza folderem z nagraniami.
- **SNR z czasów słów Whispera był fałszywy** (Whisper rozciąga słowa na pauzy) i odrzucił 5 h mowy.
  Wierz uchu użytkownika; przy oczyszczaniu filtr SNR i tak nie odrzuca plików.
- **Kopiowanie „tła” z nagrania przenosiło muzykę** z planszy startowej do każdej przerwy.
  Pauzy są ciszą; nie wracaj do kopiowania tła z nagrania.
- **Stałe tło −20…−30 dB pod mową na live'ach to nie pogłos** (nie słabnie w pauzie) i nie muzyka
  (Demucs go nie usuwa). Usuwa je dopiero MossFormer2 (tło w pauzach −20 → −34 dB, cisza −78 dBFS).
- **DeepFilterNet nie ma paczki dla Pythona 3.12 na Windows**; ClearerVoice psuje numpy w głównym
  środowisku → stąd osobne `.venv-enh`.
- **Filtr muzyki z płaskości widma** myli muzykę z pogłosem i resztkami odszumiania — domyślnie wyłączony.
- **Cięcie po czasach słów ucinało słowa** → tnie się wyłącznie w ciszy Silero, odcinek w całości albo wcale.
- **Na live'ach ok. 55% odcinków ma ukryte „yyy”** — wynik kurczy się o połowę. Powiedz o koszcie.
- **Barwa** różni się między live'ami tylko o 3–5 dB (jedno studio); próg 4 dB wyciąłby połowę.
- **Śmiech na live'ach:** AST dał w 12,5 h najwyżej 0,17 (próg 0,3), a z 11 kandydatów (0,05–0,17)
  użytkownik usłyszał śmiech w 2–4; Whisper nie zapisuje śmiechu. MossFormer2 potrafi przyciszyć śmiech
  o 30 dB (−18 → −48 dB). Nie obniżaj progu na ślepo — daj kandydatów do odsłuchu i dołącz potwierdzone.

## Wgranie do ElevenLabs

Szczegóły i źródła: `elevenlabs-v4.md`. Skrót: Voices → Create Voice → Professional Voice
Clone → wgraj `probka.mp3` (przy odrzuceniu za rozmiar: `--chunk-minutes 30`) → weryfikacja tym samym
mikrofonem → po treningu My Voices → „+” przy Eleven v4 (6–24 h). Śmiech i okrzyki w próbce
pomagają tagom `[laughs]`, `[shouting]` w v4.
