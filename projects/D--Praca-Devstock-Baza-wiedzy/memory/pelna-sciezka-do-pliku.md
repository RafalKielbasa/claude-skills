---
name: pelna-sciezka-do-pliku
description: "Gdy daję Rafałowi plik do obejrzenia/odsłuchu (podgląd, final.mp4, raport), zawsze pełna bezwzględna ścieżka w bloku kodu, nie skrót ani „ścieżka w poprzedniej wiadomości”"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96436fe2-135f-4db8-9a6a-e2d0011a65cc
  modified: 2026-10-09T11:45:21.947Z
---

Każdy plik, który Rafał ma otworzyć (wideo do bramki, podgląd, raport, klatki), podaję jako pełną bezwzględną ścieżkę Windows, w osobnym bloku kodu, gotową do skopiowania. Bez skrótów typu `scratchpad\plik.mp4` i bez odsyłania do wcześniejszej wiadomości.

**Why:** Rafał powiedział 2026-10-09: „podaj dokładną ścieżkę do pliku, zawsze dużo przyspieszy mi to pracę” — skrócona ścieżka do podglądu znaku AI kazała mu jej szukać.

**How to apply:** przy każdej bramce z plikiem (np. `/kurs-video` krok 5, `/kurs-montaz` próbka, podglądy [[agenty-ai-m00l01-rerender]]) ścieżka typu `D:\Praca\Devstock\Baza wiedzy\kursy\...\video\final.mp4` albo pełna ścieżka scratchpadu; przy kilku plikach — każdy w osobnej linii bloku.
