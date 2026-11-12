---
name: nagrywanie-pelne-testy-czas
description: "Pełne `npm test` w tools/nagrywanie trwa ~50 minut (2026-11-12) — w planach i subagentach uruchamiaj je raz, na końcu"
metadata:
  node_type: memory
  type: project
  originSessionId: 19a6d551-86c2-4a42-ba59-287e0daef195
  modified: 2026-11-12T10:49:34.010Z
---

Pełny zestaw testów `tools/nagrywanie` (`npm test`, ~1333 testy, 101 plików) trwał 2026-11-12 około 52 minut, dwa razy z rzędu (zadanie 2 i odbiór planu 2 `nagrywanie-transit-pace`). `tools/course-pipeline` (`env -u ELEVENLABS_API_KEY npm test`) jest wielokrotnie szybszy.

**Why:** subagent z szablonem „pełny zestaw przed commitem” zablokował zadanie na godzinę; równoległe uruchomienie obu zestawów grozi timeoutami (`render-slides`).

**How to apply:** w zadaniach planu uruchamiaj pliki celowane (w course-pipeline `npx vitest run tests/montaz` itp.), a pełne zestawy obu narzędzi raz, w zadaniu odbioru, jeden po drugim, nagrywanie w tle z długim limitem. Zob. [[elevenlabs-klucz-systemowy-wygrywa-z-env]] dla wyjątku `tts.test.js`.
