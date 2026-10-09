---
name: dry-run-skilli-ograniczenia
description: "Testy skilli na sucho przez subagenta — klasyfikator trybu auto blokuje zapisy przez wrapper niedeterministycznie."
metadata:
  node_type: memory
  type: project
  originSessionId: 8d719440-39b2-47dc-a0ac-a6cc9b529118
  modified: 2026-10-09T18:41:45.990Z
---

Przy teście skilla `/daily`/`/spotkanie` na sucho (2026-10-08) subagent kierował `kb-client`/`gh` przez wrapper logujący zapisy zamiast je wykonywać. Klasyfikator trybu auto blokował to niedeterministycznie: raz przepuścił cały przebieg, kiedy indziej odrzucił `safe.py … kb upsert` jako „[Auto-Mode Bypass]", a skrypt-launcher subagenta jako „Code from External"; bywa też, że odrzuci zwykły odczyt tablicy (`gh project item-list`).

(Wcześniejsza notatka, że Drive MCP nie widzi transkryptów n8n, była błędną diagnozą — przyczyną było konto konektora, zob. [[drive-konektor-konto-devstock]].)

**Why:** blokady klasyfikatora nie da się obejść bez zmiany uprawnień, a tę decyzję podejmuje Rafał.

**How to apply:** planując test na sucho, zakładaj, że faza wykonania może nie dać się zaobserwować — sprawdzaj bramkę osobno od wykonania i nie obchodź blokad. Zob. [[bramka-punkt-po-punkcie]].
