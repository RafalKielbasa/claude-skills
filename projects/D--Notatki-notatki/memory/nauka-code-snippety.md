---
name: nauka-code-snippety
description: "Przy nauce opartej o kod (nauka-z-claude) dołączać snippet kodu, nie tylko referencję plik:linia"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 0e47ddd2-7ad5-4faa-892d-ba3d3a02889d
  modified: 2026-08-28T19:29:12.320Z
---

Przy pytaniach, wyjaśnieniach i wpisach w `nauka-z-claude.md` odwołujących się
do konkretnego kodu (np. projekt saas app) zawsze dołączaj krótki fragment
(blok kodu) obok referencji `plik:linia`, nie samą referencję.

**Why:** Użytkownik nie zawsze robi powtórki lub kontynuuje naukę mając
otwarty projekt na dysku — sama referencja `plik:linia` bez treści kodu jest
wtedy bezużyteczna. Feedback padł wprost przy zamykaniu sesji 2026-08-28
(temat „Komunikacja FE → BE", projekt saas app).

**How to apply:** Dotyczy zarówno rozmowy w danej sesji (cytuj kod w
odpowiedzi, nie tylko wskazuj lokalizację), jak i zapisu w pliku postępu —
pytania/scenariusze do wznowienia kroku, które opierają się na konkretnej
implementacji, mają nieść ze sobą snippet kodu wprost w treści wpisu.
