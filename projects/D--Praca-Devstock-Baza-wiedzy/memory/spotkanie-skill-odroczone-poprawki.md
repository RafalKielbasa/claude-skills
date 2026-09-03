---
name: spotkanie-skill-odroczone-poprawki
description: Lista poprawek skilla /spotkanie odroczonych do przeglądu po pierwszym realnym spotkaniu (z finalnego review 2026-07-16).
metadata: 
  node_type: memory
  type: project
  originSessionId: ab452985-8bf1-4655-b71e-ab56a219767c
---

Skill `/spotkanie` scalono do main 2026-07-16 (Ready to merge YES). Finalny
review odroczył sześć drobnych poprawek do jednego przebiegu porządkowego
**po pierwszym realnym spotkaniu** (ledger SDD jest poza gitem, stąd zapis tu):

1. Zachowanie `dalej` na ostatnim punkcie agendy (czy implikuje `koniec`).
2. Timing zapisu wpisów `parkuj`/`sprawdź` do pliku (trwałość przy padzie
   sesji przed pierwszym `dalej`).
3. Heurystyka `## Nieomówione`: punkt, którego jedynym efektem był `parkuj`,
   liczony jest jako nieomówiony.
4. Wiszący link `Agenda:` w notatce, gdy `prowadź` wczytał starszą agendę
   (placeholder daty spotkania ≠ data pliku agendy).
5. Heurystyka ekstrakcji z historycznego `planning/02.06.2026-planning.md`
   (ścieżka tylko pierwszego użycia — samowygasająca).
6. Subiektywne kryterium „decyzje wymagające follow-upu" w kroku 1 `przygotuj`.

**Why:** te braki nie psują kontraktu parsowania, ale pierwsze realne użycie
pokaże, które z nich faktycznie przeszkadzają.

**How to apply:** gdy Rafał zgłosi się po pierwszym spotkaniu prowadzonym
przez `/spotkanie` (lub poprosi o szlif skilla), zrób jeden wspólny commit
poprawek w `.claude/skills/spotkanie/` zamiast sześciu osobnych. Powiązane:
[[kurs-agenty-ai-zakres]].
