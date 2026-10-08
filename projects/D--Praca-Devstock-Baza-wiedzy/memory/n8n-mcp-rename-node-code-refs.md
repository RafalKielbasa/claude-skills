---
name: n8n-mcp-rename-node-code-refs
description: "MCP n8n update_workflow renameNode NIE przepisuje $('Stara nazwa') w kodzie węzłów Code — po zmianie nazwy popraw odwołania sam i sprawdź eksportem"
metadata:
  node_type: memory
  type: reference
  originSessionId: 41a1e8b7-c5e2-4570-9e9d-57aefeb98e5e
  modified: 2026-10-08T10:27:52.480Z
---

Operacja `renameNode` w `update_workflow` (MCP `n8n-prod`) zmienia nazwę węzła i połączenia, ale **nie przepisuje odwołań `$('Stara nazwa')` w `jsCode` innych węzłów Code** (w odróżnieniu od edytora n8n). Zaobserwowane 2026-10-08 przy Tasku 6: po `Parse Classification` → `Compute Meeting Date` węzeł `Apply Cuts` dalej czytał `$('Parse Classification')`, co na produkcji rzuciłoby błąd przy każdym nagraniu.

**How to apply:** po każdym `renameNode` dołóż w tej samej operacji `setNodeParameter /jsCode` dla węzłów, które czytają starą nazwę. Potem wyeksportuj draft i sprawdź testem, że każde `$('…')` w parametrach wskazuje istniejący węzeł — `devstock-team-agent/tests/meeting-pipeline.test.js` ma taki test („kazde $(...) wskazuje istniejacy wezel”). Dodatkowo: `get_workflow_details` nie zwraca `credentials` węzłów, więc przypisania credentiala nie zweryfikujesz z MCP. Zob. [[n8n-prod-inwentaryzacja]].
