---
name: karta-bramki-w-pytaniu
description: "Okno AskUserQuestion zasłania tekst czatu — karta bramki (/daily, /spotkanie i każda decyzja o treści) musi być w samym pytaniu (pole preview), nie nad nim."
metadata:
  node_type: memory
  type: feedback
  originSessionId: f7bf21f5-5b92-4551-a9f4-8f4ad317b15c
  modified: 2026-10-09T21:52:11.827Z
---

Rafał (2026-10-09, pierwsze realne `/daily` z bramką punkt po punkcie): „Pytasz mnie o wpisy i elementy, których nie widzę. Więc ciężko mi je ocenić.” Karta wydrukowana w czacie przed `AskUserQuestion` jest dla niego niewidoczna, gdy odpowiada w oknie pytania (VS Code).

**Why:** decyduje na podstawie tego, co widzi w oknie pytania; karta w czacie nad pytaniem to dla niego decyzja w ciemno.

**How to apply:** całą kartę (KANDYDAT, PODOBNY ISTNIEJĄCY, ŹRÓDŁO, UWAGA) wkładaj do pola `preview` każdej opcji `AskUserQuestion` — ta sama karta przy każdej opcji, plus jedna linia skutku tej opcji; w `question` krótki nagłówek karty. Dotyczy każdego pytania o ocenę treści, nie tylko bramki. Kontrakt `docs/spotkania-kolejki.md` („The gate”, „Cards and options”, „Final screen”) zmieniony na tę formę w commicie `bce2a560` (2026-10-09), zob. [[bramka-punkt-po-punkcie]].
