---
name: agenty-ai-m00l01-rerender
description: "Re-render agenty-ai M00L01 od zera na V4 ze skillami Mateusza (nagrywanie, plansze, oprawa, znak AI) i Grzegorza (montaz) - stan i decyzje z 2026-10-08"
metadata:
  node_type: memory
  type: project
  originSessionId: fda79c08-275f-4424-9045-38899980dee1
  modified: 2026-10-09T21:14:48.115Z
---

Rafał 2026-10-08: lekcję 1 modułu 0 kursu `agenty-ai` robimy od nowa, „skillami Mateusza i Grzegorza”:
`/kurs-nagrywanie` (automat Playwrighta, Mateusz), `/kurs-montaz` (Grzegorz), plansze/oprawa/znak AI (Mateusz),
lektor V4 ([[tts-model-decyzja-v2-przerwy]]).

Decyzje Rafała 2026-10-08:
- `kurs.yaml` agenty-ai: `slajdy.odslanianie`, `montaz.plansze`, `nagrywanie.automat`, `oprawa {intro,outro,znak_ai}` - wszystko true (commit `4a2607c1`).
- M00L01: 5 plansz zaakceptowanych, migracja konspektu do nowego układu, scenariusz seg. 7 „dwa wpisy” (commit `3c12c5ad`).
- Silnik avatara: **MCP** (plan konta); kontrola lektora: tak.
- n8n do automatu: **nowe konto n8n Cloud pod kurs** (zakłada i loguje Rafał).
- Kroki 1-5 konspektu (pusta lista, nowy workflow, nazwa) = **dogrywka ręczna**: strażnik `tools/nagrywanie` wpuszcza tylko workflow z `identyfikatory`, a nowy workflow nie ma ID przed nagraniem; automat robi kroki 6-31 na workflow z dogrywki.
- Node systemowy podniesiony do 24.20.0 (winget) - `tools/nagrywanie` wymaga >=22.11; Playwright ffmpeg doinstalowany.

Stare media (wrzesień, głos v2) przeniesione do `video/archiwum/2026-09-v2/` lekcji.

Stan 2026-10-08 po południu: scenariusz przeredagowany wg profilu wypowiedzi Bartka (commit `31243016`), etap 1 `/kurs-video` ZROBIONY - avatary przez HeyGen MCP (konto Bartłomieja Łozy, plan pro, Avatar IV, 1080p 16:9, ręcznie: create_asset_upload → PUT → complete → create_video_from_avatar → get_video → curl pod `cel`), paczka lektora V4 w `video/lektor/`. Pułapka: pełny render po `--plan-avatara` generuje od nowa `audio/01.mp3`/`04.mp3`, ale do filmu idzie dźwięk wpieczony w mp4 avatara (`assemble-video.js:56`), więc liczy się kontrola lektora z PIERWSZEGO przebiegu (po 4a). Klucz ElevenLabs dostał `speech_to_text` 2026-10-08.

Stan 2026-10-08 wieczór: automat n8n GOTOWY (commit `a4f1810f`): `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js` + `video/nagrywanie.yaml` M00L01 (kroki 6-31 jedno ujęcie, budżet 1, dogrywka 1-5), próba na workflow testowym `QTN9nUu0shNDCpSI` 26/26. Scenariusz: "Failed"→"Error"/"Erer" (`54f81212`), nowe audio wygenerowane. Czeka na Rafała: usunąć czat "Badacz - test", zarchiwizować i usunąć "Test automatu", nagrać dogrywkę 1-5 (profil kursu, DISPLAY3 F11), podać ID workflow lekcji → dopisać do `identyfikatory` i `prepare.workflows`, karta w nagrywanie.yaml, potem `nagraj` z bramką po pierwszym ujęciu, `edl`, `/kurs-montaz`, etap 2.
Pułapki n8n 2.x: CSS zoom > 1 wypycha pasek nagłówka i Logs z kadru (100vh) - powiększenie 1; profil kursu logowany w zwykłym Chrome `--user-data-dir` (domyślnego User Data Chrome 136+ nie da się zautomatyzować); okno na DISPLAY3: `RECORDING_WINDOW_POSITION=-1920,0 RECORDING_FULLSCREEN=1`; blokada "Edit here" po przerwanej sesji; podgląd starszego wykonania pokazuje nazwy węzłów z chwili uruchomienia.

Stan 2026-10-08 noc: rdzeń rozszerzony o cel `utworz` (commit `f53e3901`, spec `docs/superpowers/specs/2026-10-08-nagrywanie-zasob-utworzony-design.md`) - automat sam zakłada workflow, więc M00L01 to JEDNO ujęcie kroków 1-31 z pustej listy, bez dogrywki; `kurs.yaml` `identyfikatory: []`, bez `prepare`. Ujęcie `lekcja-v6` gotowe (31/31, 141 s, workflow `7LtRPRWqZ3pyUgbF`, wykonania 541/542) - czeka na bramkę obejrzenia Rafała, potem `edl`, `/kurs-montaz`, etap 2. Przed KAŻDYM ujęciem Rafał ręcznie usuwa workflow poprzedniego (decyzja 2026-10-08); v5 padło raz na zbędnym „o” w „Anna Kowalska” (przyczyna nieznana, odczyt kontrolny złapał). Otwarte: „My workflow 3” w kadrze vs lektor „My workflow” (licznik nazw n8n liczy całą instancję, w tym projekt „Rafał Devstock”).

Stan 2026-10-09 rano: montaż automatyczny gotowy (próbka seg. 2 zaakceptowana przez Rafała, pełny render 8:27, 17 nakładek plansz), etap 2 `/kurs-video --avatar=mcp` zrobiony: `video/final.mp4` 10:53, znak AI ZAAKCEPTOWANY (akceptacja ważna, 0 twardych, 2 ostrzeżenia do obejrzenia), `status.video: wyrenderowane` (commit `bbb8e98c`). Czeka bramka akceptacji filmu przez Rafała. Poprawki narzędzi po drodze: kotwica tuż za `od` gubiła stopklatkę (`2ddc9d33`), stykówka plansz ze ścieżką względną (`6aff6eb3`), `video/znak-ai/` do `.gitignore` (`f24c830f`). Pułapka EDL: wycięcie musi kończyć się DOKŁADNIE na `do` akapitu, inaczej zostaje ułamek klatki = puste ujęcie i klip krótszy (render łapie „klipom brakuje klatek”).

Stan 2026-10-09 po południu: znak AI w wariancie „okno” (bez robocika, skala 3, bez kursora, róg ld; spec `2026-10-09-znak-ai-wariant-okno-design.md`, kurs.yaml `znak_ai: { wariant: okno }`, commit `33e7dcef`), detektor napisu po jasności (decyzja Rafała), final.mp4 z nowym znakiem przeszedł bramkę. Po drodze naprawione: znak znikał na zmianie metadanych koloru środka (`-reinit_filter 0`, `59869b61`), mignięcie nagrania przy przenikaniu etapów plansz (`3fc10f35`). Uwagi Rafała do filmu wieczorem 2026-10-09 NANIESIONE (gałąź dnia `rafal-kielbasa/09-10-2026`, commit `a08015c4`): nowe audio V4 (4:1 i 5:4 przeformułowane), montaż przeliczony na nowe czasy zdań skryptem (kotwice/pauzy/zaznaczenia po zdaniach), 6:2 wycięcie postoju menu + kotwica na w pełni otwartym oknie (90,23), 6:4 napisy skrótów, 7:1 stopklatka 106,5, plansze w nowym motywie `agenci-ai-konsola` (szablon Misji ze stopką „AGENCI AI”, `f1fe4bc7`), ręczny róg znaku `ld` 300-592 s w `video/znak-ai.yaml` (bez niego znak stał na „Publish”). final.mp4 przeszedł bramkę i Rafał go ZAAKCEPTOWAŁ („jest idealnie”), `status.video: zaakceptowane` (`df6a248c`). Lekcje M01L01, M01L05, M02L04 przełączone na nowy motyw (status.video: brak), render dopiero przy przejściu modułu na V4; 6 slajdów-tabel przepełnia się w nowym szablonie - do poprawy treści przy tym renderze.

**Why:** pierwsza lekcja kursu przechodzi cały nowy tor (V4 + automat + montaż automatyczny + oprawa) - wzorzec dla reszty lekcji demo agenty-ai.
**How to apply:** kolejność: etap 1 `/kurs-video` (MCP: `--plan-avatara` → HeyGen MCP → `--avatar=mcp`, kontrola lektora) → `/kurs-nagrywanie` „Pierwsza lekcja z nową usługą” (n8n: kurs.yaml `nagrywanie.uslugi.n8n`, login, sonda, moduł usługi, próba, powiększenie, PR) → `/kurs-montaz` od zaznaczeń i plansz → etap 2 `/kurs-video` ze znakiem AI. Sprawdzaj stan w git log i `video/` lekcji, nie z pamięci.
