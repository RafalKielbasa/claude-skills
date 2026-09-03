---
name: tts-model-decyzja-v2-przerwy
description: "Lektor kursów zostaje na ElevenLabs eleven_multilingual_v2 z przerwami; v3 rozważony, ale odłożony (2026-07-23)."
metadata: 
  node_type: memory
  type: project
  originSessionId: b732f5c4-07fd-42e5-90fa-d6d13cd12297
  modified: 2026-07-24T10:38:43.130Z
---

Decyzja z 2026-07-23 dla lektora video kursów (`tools/course-pipeline`): zostajemy na `eleven_multilingual_v2` + przerwy (cisza między tematami + `<break>` w tekście), NIE przechodzimy na `eleven_v3` — „na ten moment".

Kontekst: v3 brzmiał ekspresyjniej i głosowo bardziej się podobał, ale ma wady dyskwalifikujące na teraz — brak request stitching (nieusuwalny przeskok barwy między osobnymi generacjami), limit ~5 tys. znaków/żądanie (lekcja ~9–10 tys. → wymuszony chunking i szwy), mniejsza powtarzalność re-renderów. Da się to obejść techniką „jeden generat całości → cięcie po with-timestamps" (alignment znak→czas jest 1:1 z wysłanym tekstem — sprawdzone) i chowaniem szwów na segmentach `[ekran: avatar]`, ale to złożoność odłożona na później.

Eksperyment A/B (throwaway, gitignored): `tools/course-pipeline/experiments/tts-ab/` — warianty v1 (goły v2), v2-fix (v2+break+cisza), v3-story (v3, 3 generacje), v4-oneshot (v3 jeden generat+cięcie).

**Why:** wybór stabilności i powtarzalności nad ekspresją; v3 kusi, ale koszt integracji i brak spójności między generacjami przeważyły.
**How to apply:** produkcyjnie zostaje domyślny `ELEVENLABS_MODEL_DOMYSLNY` w `src/config.js`; „przerwy" = (1) cisza między segmentami w montażu (`src/assemble-video.js` — dziś skleja klipy встык, bez przerwy) + (2) ewentualnie RZADKIE `<break>` w tekście — NIE po każdym zdaniu, bo ElevenLabs gubi zbyt gęste przerwy i robi się siekane. Wpięcie do pipeline'u zrobić osobnym spekiem. Do v3 wrócić przy okazji, gdy dojdzie stitching albo wyższy limit znaków.

**Aktualizacja 2026-07-24 — ROZSTRZYGNIĘTE: v2 + request stitching.** Powrót do wątku „głos skacze na stykach segmentów". Przetestowane po kolei (skrypty w `tools/course-pipeline/experiments/tts-ab/`, próbki w `out/`):
- `v5-v3-robust` — v3 `stability 1.0` (Robust, max stabilność), 3 OSOBNE generacje → barwa mocno skacze na cięciach. ❌
- `v6-v3-robust-oneshot` — v3 Robust, jeden generat całości → cięcie po `with-timestamps`. Działa, ale Rafał ODRZUCIŁ (nie chce cięcia jednego generatu; złożoność + limit znaków v3).
- `v7-v2-stitching` — **WYBRANE ✅**: `eleven_multilingual_v2` + request stitching (`previous_request_ids` z nagłówka `request-id` poprzednich generacji, max 3, + `previous_text`/`next_text`). Osobne pliki per segment, barwa spójna na stykach. Rafał potwierdził odsłuchem: „efekt jest ok".

Kluczowy fakt (potwierdzony w docs ElevenLabs): **request stitching jest niedostępny dla `eleven_v3`** — działa tylko z v2/turbo/flash. Dlatego v3 strukturalnie nie umie trzymać barwy między osobnymi wywołaniami, a v2 umie.

Reference parametrów requestu: `tools/course-pipeline/docs/elevenlabs-tts-konfiguracja.md` (pełne body, `voice_settings`, profile stability v3, sekcja „Request stitching (v2)").

**Do zrobienia (osobny spek):** wpięcie stitchingu w `src/tts.js` + montaż. Haczyk: generacja segmentów musi stać się SEKWENCYJNA, a dzisiejszy cache „pomiń, jeśli plik istnieje" rwie łańcuch (trafienie w cache wczesnego segmentu zabiera `request-id` dla kolejnych) — trzeba cache'ować `request-id` obok audio albo regenerować cały łańcuch przy zmianie.
