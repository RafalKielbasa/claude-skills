---
name: ilustracje-podpis-w-artykulach
description: Podpisy ilustracji w artykułach lekcji mają format "Ilustracja [NR]. Podpis." pod obrazkiem; reguła żyje TYLKO w /kurs-redakcja
metadata:
  type: feedback
---

W artykułach kursowych każda ilustracja dostaje podpis
`**Ilustracja <NR>.** <podpis>` — osobna linia **pod** obrazkiem, oddzielona od
niego pustą linią, numeracja ciągła od 1 w obrębie jednego artykułu, podpis
pełnym zdaniem zakończonym kropką. Przykład podany przez Rafała 2026-09-10:
`Ilustracja 1. Węzeł Edit Fields z trzema polami i panelami INPUT / OUTPUT`
(pogrubienie prefiksu i kropkę na końcu wziąłem z legacy artykułów n8n
w `kursy/_zrodla-notion/kurs-n8n/…`, które już tę konwencję stosują).

**Gdzie zapisana:** `.claude/skills/kurs-redakcja/SKILL.md` — punkt `- dla A:`
w wymaganiach promptu (krok 4) i punkt „artykuł" w kontroli strukturalnej
(krok 5). Stan 2026-09-10.

**Why:** Rafał podał zasadę wprost jako regułę pisania artykułów, a artykuły
kursu n8n już ją stosują — nowe lekcje mają być z nimi spójne.

**How to apply:** Podpisy powstają na etapie redakcji, nie generowania.
Rafał zdecydował 2026-09-10, że do `/kurs-lekcja` reguły NIE dokładamy —
nie proponuj tego ponownie. Przy ręcznym pisaniu lub poprawianiu artykułu
w sesji stosuj format sam. Powiązane: [[kurs-agenty-ai-zakres]].
