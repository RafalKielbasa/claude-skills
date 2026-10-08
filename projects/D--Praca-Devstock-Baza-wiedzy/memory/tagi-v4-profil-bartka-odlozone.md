---
name: tagi-v4-profil-bartka-odlozone
description: Tagi audio eleven_v4 dopasowane do sposobu mówienia Bartka — nieprzewidziane w pipeline ani w profilu; Rafał odłożył temat 2026-10-08.
metadata:
  node_type: memory
  type: project
  originSessionId: 0e98e756-136c-4e4b-a105-6ba3bea1e65d
  modified: 2026-10-08T11:30:15.243Z
---

2026-10-08 Rafał zapytał, czy scenariusz da się redagować tak, żeby tagi audio `eleven_v4` (`[excited]` itd.) oddawały sposób mówienia Bartka. Stan: nieprzewidziane. Spec v4 wyłącza tagi z zakresu (`docs/superpowers/specs/2026-10-07-elevenlabs-v4-voice-design.md:221`), a `kursy/_wspolne/profil-wypowiedzi.md` opiera się na samych transkryptach Whispera: opisuje słowa i rytm, nie ton ani tempo. Decyzja Rafała: **zostawiamy na później**.

**Why:** temat potrzebuje nowego źródła danych (odsłuch nagrań źródłowych Bartka) i zmian w pipeline. Na dziś nie ma priorytetu.

**How to apply:** gdy temat wróci, zacznij od płatnej sondy (za zgodą Rafała): 2–3 żądania v4 po polsku z tagami. Ma pokazać, czy v4 wykonuje tag, czy czyta go na głos, i czy alignment z `with-timestamps` liczy znaki tagu. `src/tts.js:249` rzuca błąd przy rozjeździe długości alignmentu, a `src/kontrola-lektora.js:70` nie usuwa `[…]`. Potem brainstorming i spec. Zapytaj też, czy oryginalne nagrania Bartka jeszcze istnieją (źródło `react-31-router` skasowane). Powiązane: [[tts-model-decyzja-v2-przerwy]].
