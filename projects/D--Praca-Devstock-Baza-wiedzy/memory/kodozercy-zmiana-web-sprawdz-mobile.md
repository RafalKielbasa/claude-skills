---
name: kodozercy-zmiana-web-sprawdz-mobile
description: "Przy pracy nad platformą Kodożercy jawnie sprawdzaj i raportuj odpowiednik w aplikacji mobilnej, zamiast po cichu dziedziczyć zakres „sam web”"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6d612fb1-5799-42b0-a178-38ddcc6979bd
  modified: 2026-11-10T09:26:30.785Z
---

Rafał (2026-11-10, po DT-81 #815): rozwój platformy Kodożercy dotyka też aplikacji mobilnej (`code-busters-mobile`). DT-81 po cichu przejął zakres „sam web” z decyzji „Zakres zmian w aplikacji mobilnej” (S5, 2026-10-20). Sesja tego nie powiedziała, więc Rafał zapytał, czemu mobile nie było ruszane.

**Why:** odłożone pozycje mobilne giną. S5 przesunęło darmową lekcję w aplikacji na czas nowej szaty, a redesign zamknięto 2026-11-05 bez niej. Aplikacja nie czyta `isFreeSample` ani `sampleLessonId` i żadne issue tego nie prowadziło.

**How to apply:** w każdym tickecie, specu i planie platformy Kodożercy daj w pierwszym raporcie jedną linię „Aplikacja mobilna: co się zmienia / brak odpowiednika, bo … / poza zakresem decyzją X”. Gdy Rafał wskazuje Szymona (`Szymon0C`, dev mobile) „na mobilce”, a zmiana jest tylko w web, zapytaj, zamiast zakładać. Powiązane: [[dt37-galaz-biblioteki]].
