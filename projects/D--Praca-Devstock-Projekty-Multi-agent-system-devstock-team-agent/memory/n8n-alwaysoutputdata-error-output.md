---
name: n8n-alwaysoutputdata-error-output
description: alwaysOutputData + onError=continueErrorOutput emituje itemy na OBU wyjściach naraz — maskuje błędy i dubluje powroty do pętli; error z continueRegularOutput bywa stringiem
metadata: 
  node_type: memory
  type: project
  originSessionId: fb55b19d-354e-4794-ab9e-c28921890ced
  modified: 2026-07-29T08:15:36.646Z
---

Potwierdzone na exec 954–956 (34_project_radar_collector, 2026-07-29): node z
`alwaysOutputData: true` **i** `onError: "continueErrorOutput"` przy błędzie (i
przy sukcesie z 0 itemów) emituje itemy na OBU wyjściach równocześnie —
wymuszony pusty `{}` na main[0] płynie dalej głównym torem (raport-zero maskuje
awarię), a item błędu na main[1] idzie torem błędu. W pętli SplitInBatches
projekt wraca wtedy do pętli 3×, wyjście done odpala wielokrotnie (7× na 3
projekty), a node'y za nim (Slack) wykonują się po kilka razy (6 wiadomości na
przebieg).

**Why:** alwaysOutputData wymusza niepusty output na każdej gałęzi main, nie
tylko na „regularnej" — połączenie z drugim wyjściem błędu jest toksyczne.

**How to apply:** gdy potrzebne alwaysOutputData (pętla nie może umrzeć na 0
itemów — [[n8n-splitinbatches-done-output]]), używać `onError:
"continueRegularOutput"` (błąd płynie głównym wyjściem jako item z polem
`error`) i rozdzielać błąd/dane jawnym IF-em na `$json.error !== undefined`.
Uwaga: `$json.error` bywa **stringiem** (nie obiektem z `.message`) — fallback
`$json.error?.message || $json.error || '...'`. Wzorzec wdrożony w
34_project_radar_collector (IF-y `Open Error?`/`Closed Error?`) + testy
struktury w tests/radar.test.js.
