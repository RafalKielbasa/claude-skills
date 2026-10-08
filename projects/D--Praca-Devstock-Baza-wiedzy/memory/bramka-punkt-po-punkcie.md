---
name: bramka-punkt-po-punkcie
description: Bramka /daily i /spotkanie przerobiona 2026-10-08 na przejście karta po karcie z jednym zatwierdzeniem; pierwsze prawdziwe /daily to test akceptacyjny; 7 drobnych uwag odłożonych.
metadata:
  node_type: memory
  type: project
  originSessionId: 8d719440-39b2-47dc-a0ac-a6cc9b529118
  modified: 2026-10-08T18:42:09.911Z
---

Od 2026-10-08 (commity a481ed32 spec, f2e75420 plan, 1ac982cb, 117074bc, ea378033 na main, wypchnięte na origin tego samego dnia) bramka `/daily` i `/spotkanie` to przejście punkt po punkcie: fragmenty ⚠ → wpisy → zadania → ekran końcowy („Akceptuj i wykonaj" / „Wykonaj" · „Jeszcze nie"). Definicja raz, w `docs/spotkania-kolejki.md` („Uncertain passages", „The gate"); publikację znaczy linia `> **Opublikowano:**` w notatce.

**Why:** Rafał uznał edycję YAML + podwójne „przetwórz" za toporne; testy na sucho (fixture z daily 2026-10-08) przeszły, ale ścieżka „ŹRÓDŁO — transkrypt"/KONTEKST i realne wykonanie nie zostały zaobserwowane.

**How to apply:** pierwsze realne `/daily` po zmianie traktuj jako test akceptacyjny i zgłaszaj odchylenia. Notatka `planning/daily/2026-10-08-1000/notatka.md` nie ma znacznika `**Opublikowano:**` — ponowne `/daily 2026-10-08 10:00` zgłosi publikację jako oczekującą; nie publikuj bez potwierdzenia Rafała, czy ten daily już poszedł na Slacka. Odłożone drobne uwagi z final review (guard „przetwórz" w /spotkanie, wznowienie kroku 6 /spotkanie, approved+duplicate, stare sformułowania „edit the file", prowadź nadpisujący notatkę, ręczna edycja przed pierwszym przejściem pomija ⚠) — do decyzji Rafała. Zob. [[dry-run-skilli-ograniczenia]].
