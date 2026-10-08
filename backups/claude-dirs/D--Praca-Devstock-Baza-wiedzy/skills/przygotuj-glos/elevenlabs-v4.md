# ElevenLabs: klon głosu na Eleven v4 (stan: październik 2026)

Źródła (sprawdź, czy się nie zmieniły, zanim podasz liczby jako pewne):
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
- https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/professional-voice-cloning
- https://elevenlabs.io/docs/creative-platform/voices/voice-cloning/instant-voice-cloning
- https://help.elevenlabs.io/hc/en-us/articles/26642069003409

## Co ważne w v4

- v4 (premiera 28.09.2026) **wierniej niż poprzednie modele odtwarza źródło**: akcent, sposób
  mówienia, głośność, a więc także szum, pogłos, muzykę, oddechy i „yyy” z próbek.
- Suwaki tylko **Stability** i **Similarity**. Nie ma Style, Speed ani SSML. Ekspresję dają
  interpunkcja (wielokropek = pauza, WERSALIKI = nacisk) i tagi `[whispers]`, `[laughs]`.
- Tagi działają dobrze tylko wtedy, gdy dany sposób mówienia jest w próbkach.
- Inny język niż w próbkach: v4 mówi z naturalnym akcentem tego języka. Nagrywaj w języku docelowym.
- Jedna generacja do 10 000 znaków; dłuższe teksty łącz przez request stitching.
- IVC na v4 według ElevenLabs przewyższa PVC na Multilingual v2; PVC na v4 daje najwyższą wierność.

## Professional Voice Clone (PVC)

- **Tylko własny głos.** Cudzego nie wolno, nawet za zgodą. Weryfikacja nagraniem: ten sam
  mikrofon i ton co w próbkach, każdą linię czytać raz; po porażce 24 h przerwy.
- Minimum 30 min, zalecane **2–3 h**. Pliki po ~30 min. MP3 ≥ 192 kbps (voiceprep daje 320 kbps).
- Głośność: od −23 do −18 dB RMS, true peak −3 dB (voiceprep celuje w −20 / −3).
- Plany: Creator i Pro mają 1 miejsce na PVC, Scale 3, Business 10.
- Kroki: Voices → Create Voice → Professional Voice Clone → wgraj `pvc_*.mp3` → Audio settings
  (usuwanie szumu tylko w razie potrzeby) → weryfikacja → trening 3–6 h (do 24 h).
- **Na v4 trzeba douczyć ręcznie:** My Voices → najedź na głos → „+” przy Eleven v4 (6–24 h).
  Klony sprzed v4 też trzeba tak douczyć.

## Instant Voice Clone (IVC)

- 1–2 min czystego nagrania; ponad 3 min nic nie daje albo szkodzi. v4: działa nawet od 10 s.
- Jeden spójny styl na klon; kilka stylów = kilka klonów.

## Ustawienia startowe (propozycja, nie z dokumentacji)

| Zastosowanie | Stability | Similarity |
|---|---|---|
| Narracja | 0,50–0,65 | 0,80–0,90 |
| Dialog, emocje | 0,30–0,45 | 0,75–0,85 |

Za wysoka Similarity wzmacnia artefakty z próbek; za wysoka Stability daje monotonię.
