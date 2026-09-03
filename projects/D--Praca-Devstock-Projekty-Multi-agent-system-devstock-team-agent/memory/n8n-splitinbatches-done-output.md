---
name: n8n-splitinbatches-done-output
description: "done-output SplitInBatches emituje itemy odesłane do pętli (akumulacja) — wzorzec produkcyjny w 07; Postgres/GitHub przy 0 wynikach emitują 0 itemów — gałąź \"pusto\" wymaga alwaysOutputData"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 5e3b9b42-ab6d-40ba-86a1-92248dd70a93
  modified: 2026-07-29T00:07:44.662Z
---

Dwa wzorce n8n potwierdzone w tym repo (sesja 2026-07-29, radar etap 1):

1. **SplitInBatches: done-output akumuluje itemy odesłane do wejścia pętli.** Węzły na końcu łańcucha łączą się z powrotem do node'a pętli; po wyczerpaniu batchy wyjście `done` (index 0) emituje wszystkie odesłane itemy. Dowód produkcyjny: `07_enrich_and_push_tasks` (`Loop Over Tasks1 → done → Aggregate Enriched Tasks1` agreguje pole `enriched` z itemów feedbacku). Wykorzystane w `34_project_radar_collector` (Mark Success / Collect Error * → Loop → Aggregate Results). Codex kwestionował ten wzorzec — niesłusznie.

2. **Zero wyników = zero itemów = martwy downstream.** Postgres executeQuery i GitHub getIssues przy pustym wyniku nie emitują nic — gałąź „brak danych" (IF → nota) nigdy się nie wykona bez `"alwaysOutputData": true` na node (placeholder `{}` do odfiltrowania w Code). Ten brak w 36 wykryło dopiero finalne review; [[n8n-expression-gotchas]].

**How to apply:** w pętlach zbieraj wyniki przez feedback do SplitInBatches i czytaj `$input.all()` po stronie done; każdemu źródłu danych, po którym stoi gałąź „pusto", dawaj alwaysOutputData + filtr placeholderów.
