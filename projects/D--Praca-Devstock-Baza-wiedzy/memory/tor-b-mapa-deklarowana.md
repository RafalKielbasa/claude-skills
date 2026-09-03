---
name: tor-b-mapa-deklarowana
description: "Tor B przebudowany (2026-07-30) na mapę deklarowaną — nagranie bez dźwięku, czasy ręczne; STT+Gemini skasowane"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9e16a47c-205c-4a87-b015-23cdede6b20c
  modified: 2026-07-30T14:41:51.133Z
---

Przebudowa toru B wykonana 2026-07-30 (7 zadań SDD, finalne review „Ready to
merge: Yes", 271/271 testów): nagranie ekranu **bez dźwięku**, szkielet
`mapa-nagrania.md` generuje `/kurs-lekcja` (`npm run szkielet-mapy`, bezpiecznik
`--force`), Rafał wpisuje czasy (minimum: wiersze segmentowe N.1 + „⏹ KONIEC
materiału"; `—` = bez cięcia; kolumna „Koniec" wycina duble/martwy czas),
`/kurs-nagranie` = walidacja (`npm run waliduj-mape`, ffprobe, bez kluczy API)
+ bramka. Statusy mapy: do_wypelnienia → do_review → zatwierdzona. Cały przepływ
STT (ElevenLabs) + dopasowanie Gemini SKASOWANY (moduły analyze-recording,
speech-to-text, dopasuj-*). Mechanika renderu pod-klipów zostaje — kotwice
pochodzą z deklaracji, nie z pauz w mowie. Zastępuje wcześniejszy mechanizm
kotwic [AKCJA:] z STT (pamięć o nim usunięta).

Spec: `docs/superpowers/specs/2026-07-30-tor-b-mapa-deklarowana-design.md`,
plan: `docs/superpowers/plans/2026-07-30-tor-b-mapa-deklarowana.md`.

Otwarte: kalibracja stałych ostrzeżeń (`TEMPO_ZNAKOW_NA_S=15`,
`PROG_STOPKLATKI=1.5`, `MIN_ROZNICA_STOPKLATKI_S=3`) po pierwszym realnym
użyciu; migracja lekcji agenty-ai 1.2 tylko przy ewentualnym re-renderze
(stara mapa nieczytelna — `szkielet-mapy --force` + przepisanie czasów).
W chwili zapisu zmiany niezacommitowane ([[nie-commituj-rafal-sam]]).
