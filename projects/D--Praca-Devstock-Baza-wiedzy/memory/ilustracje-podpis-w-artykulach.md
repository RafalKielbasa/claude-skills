---
name: ilustracje-podpis-w-artykulach
description: Podpisy ilustracji w artykułach lekcji mają format "Ilustracja [NR]. Podpis." pod obrazkiem
metadata:
  type: feedback
---

W artykułach kursowych każda ilustracja dostaje podpis w formacie
`Ilustracja [NR]. Podpis ilustracji.` — numeracja ciągła w obrębie jednego
artykułu, kropka po numerze, podpis pełnym zdaniem opisującym, co widać na
zrzucie. Przykład podany przez Rafała 2026-09-10:
`Ilustracja 1. Węzeł Edit Fields z trzema polami i panelami INPUT / OUTPUT`

Ustalenia z repo (`kursy/_zrodla-notion/kurs-n8n/…`, pliki legacy z Notion):
prefiks jest tam pogrubiony (`**Ilustracja 1.** …`) i stoi w osobnej linii
**pod** obrazkiem, oddzielony od niego pustą linią.

**Why:** Rafał podał tę zasadę wprost jako regułę dla pisania artykułów;
istniejące artykuły kursu n8n już ją stosują, więc nowe lekcje muszą być z nimi
spójne.

**How to apply:** Przy generowaniu i redakcji artykułu lekcji ([[kurs-agenty-ai-zakres]],
skille `kurs-lekcja` i `kurs-redakcja` — żaden z nich nie ma tej zasady zapisanej
w SKILL.md, stan 2026-09-10) wstawiaj podpis pod każdym `![…](…)`, numeruj od 1
w każdym artykule osobno.
